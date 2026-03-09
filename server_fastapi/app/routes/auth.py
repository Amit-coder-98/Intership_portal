from fastapi import APIRouter, HTTPException, Depends
from bson import ObjectId
from datetime import datetime, timezone
from app.core.database import get_db
from app.core.security import hash_password, verify_password, create_access_token, get_current_user
from app.schemas.schemas import RegisterRequest, LoginRequest

router = APIRouter(prefix="/api/auth", tags=["auth"])


def serialize_user(user: dict) -> dict:
    """Serialize a MongoDB user document for JSON response."""
    u = {**user}
    u["_id"] = str(u["_id"])
    u.pop("password", None)
    # Serialize nested ObjectIds
    for key in ("companyMentor", "facultyMentor"):
        if isinstance(u.get(key), ObjectId):
            u[key] = str(u[key])
    if "assignedStudents" in u and isinstance(u["assignedStudents"], list):
        u["assignedStudents"] = [str(s) for s in u["assignedStudents"]]
    return u


@router.post("/register")
async def register(data: RegisterRequest):
    db = get_db()

    # Check if email exists
    existing = await db.users.find_one({"email": data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Check PRN uniqueness for students
    if data.role == "student" and data.prn:
        existing_prn = await db.users.find_one({"prn": data.prn})
        if existing_prn:
            raise HTTPException(status_code=400, detail="PRN already registered")

    user_doc = {
        "name": data.name,
        "email": data.email,
        "password": hash_password(data.password),
        "role": data.role.value,
        "prn": data.prn or "",
        "class": data.class_name or "MCA",
        "semester": "IV",
        "division": data.division or "",
        "phone": data.phone or "",
        "avatar": "",
        "internshipStatus": "registered" if data.role.value == "student" else "",
        "companyName": "",
        "companyMentor": None,
        "facultyMentor": None,
        "internshipStartDate": None,
        "internshipEndDate": None,
        "designation": "",
        "department": "",
        "mentorType": "",
        "assignedStudents": [],
        "createdAt": datetime.now(timezone.utc),
    }

    result = await db.users.insert_one(user_doc)
    user_doc["_id"] = result.inserted_id
    token = create_access_token(str(result.inserted_id))

    return {
        "success": True,
        "token": token,
        "user": serialize_user(user_doc),
    }


@router.post("/login")
async def login(data: LoginRequest):
    db = get_db()

    if not data.email or not data.password:
        raise HTTPException(status_code=400, detail="Please provide email and password")

    user = await db.users.find_one({"email": data.email})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not verify_password(data.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token(str(user["_id"]))

    return {
        "success": True,
        "token": token,
        "user": serialize_user(user),
    }


@router.get("/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    db = get_db()
    user = await db.users.find_one({"_id": ObjectId(current_user["_id"])})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user_data = serialize_user(user)

    # Populate mentor info
    for field in ("companyMentor", "facultyMentor"):
        mentor_id = user.get(field)
        if mentor_id and isinstance(mentor_id, ObjectId):
            mentor = await db.users.find_one({"_id": mentor_id})
            if mentor:
                user_data[field] = {
                    "_id": str(mentor["_id"]),
                    "name": mentor.get("name", ""),
                    "email": mentor.get("email", ""),
                    "designation": mentor.get("designation", ""),
                }

    return {"success": True, "user": user_data}


@router.post("/logout")
async def logout():
    return {"success": True, "message": "Logged out successfully"}


@router.put("/profile")
async def update_my_profile(
    data: dict,
    current_user: dict = Depends(get_current_user),
):
    """Update current user's profile. Accepts JSON with optional: name, phone, companyName."""
    db = get_db()
    allowed = {"name", "phone", "companyName"}
    updates = {k: v for k, v in data.items() if k in allowed and isinstance(v, str) and v.strip()}
    if updates:
        await db.users.update_one({"_id": ObjectId(current_user["_id"])}, {"$set": updates})

    user = await db.users.find_one({"_id": ObjectId(current_user["_id"])})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {"success": True, "user": serialize_user(user)}


@router.get("/notifications")
async def get_notifications(current_user: dict = Depends(get_current_user)):
    db = get_db()
    role = current_user.get("role")
    uid = ObjectId(current_user["_id"])
    notifications = []

    if role == "student":
        # Recent document status changes (approved/rejected)
        async for d in db.documents.find(
            {"student": uid, "status": {"$in": ["approved", "rejected"]}}
        ).sort("reviewDate", -1).limit(10):
            doc_type = (d.get("documentType") or "").replace("_", " ").title()
            status = d.get("status", "")
            notifications.append({
                "id": str(d["_id"]),
                "type": "document",
                "message": f"Your {doc_type} has been {status}",
                "status": status,
                "date": d.get("reviewDate") or d.get("uploadDate"),
            })

        # Recent report reviews
        async for r in db.weekly_reports.find(
            {"student": uid, "status": "reviewed"}
        ).sort("reviewedAt", -1).limit(10):
            notifications.append({
                "id": str(r["_id"]),
                "type": "report",
                "message": f"Week {r.get('weekNumber', '?')} report reviewed — {r.get('totalScore', 0)}/20",
                "status": "reviewed",
                "date": r.get("reviewedAt") or r.get("submittedAt"),
            })

    elif role == "mentor":
        # Get assigned student IDs
        student_ids = []
        async for s in db.users.find({"$or": [
            {"companyMentor": uid}, {"facultyMentor": uid}
        ]}):
            student_ids.append(s["_id"])

        if student_ids:
            # New reports from students (pending)
            async for r in db.weekly_reports.find(
                {"student": {"$in": student_ids}, "status": "submitted"}
            ).sort("submittedAt", -1).limit(10):
                student = await db.users.find_one({"_id": r["student"]})
                name = student.get("name", "Student") if student else "Student"
                notifications.append({
                    "id": str(r["_id"]),
                    "type": "report",
                    "message": f"{name} submitted Week {r.get('weekNumber', '?')} report",
                    "status": "pending",
                    "date": r.get("submittedAt"),
                })

            # New documents from students (pending)
            async for d in db.documents.find(
                {"student": {"$in": student_ids}, "status": "pending"}
            ).sort("uploadDate", -1).limit(10):
                student = await db.users.find_one({"_id": d["student"]})
                name = student.get("name", "Student") if student else "Student"
                doc_type = (d.get("documentType") or "").replace("_", " ").title()
                notifications.append({
                    "id": str(d["_id"]),
                    "type": "document",
                    "message": f"{name} uploaded {doc_type}",
                    "status": "pending",
                    "date": d.get("uploadDate"),
                })

    elif role == "admin":
        # New student registrations (last 10)
        async for u in db.users.find({"role": "student"}).sort("createdAt", -1).limit(5):
            notifications.append({
                "id": str(u["_id"]),
                "type": "registration",
                "message": f"New student registered: {u.get('name', 'Unknown')}",
                "status": "info",
                "date": u.get("createdAt"),
            })

        # Pending documents
        async for d in db.documents.find({"status": "pending"}).sort("uploadDate", -1).limit(10):
            student = await db.users.find_one({"_id": d.get("student")})
            name = student.get("name", "Student") if student else "Student"
            doc_type = (d.get("documentType") or "").replace("_", " ").title()
            notifications.append({
                "id": str(d["_id"]),
                "type": "document",
                "message": f"{name} uploaded {doc_type} — awaiting review",
                "status": "pending",
                "date": d.get("uploadDate"),
            })

    # Sort all by date descending
    notifications.sort(key=lambda n: n.get("date") or datetime.min.replace(tzinfo=timezone.utc), reverse=True)

    return {"success": True, "data": notifications[:20]}
