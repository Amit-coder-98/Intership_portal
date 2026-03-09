from fastapi import APIRouter, HTTPException, Depends
from bson import ObjectId
from datetime import datetime, timezone
from app.core.database import get_db
from app.core.security import require_roles, hash_password
from app.schemas.schemas import AssignMentorRequest, UpdateStatusRequest, AdminCreateUserRequest, SettingsUpdate

router = APIRouter(prefix="/api/admin", tags=["admin"])


def serialize_doc(doc: dict) -> dict:
    d = {**doc}
    for key in ("_id", "student", "reviewedBy", "evaluator", "companyMentor", "facultyMentor"):
        if isinstance(d.get(key), ObjectId):
            d[key] = str(d[key])
    if "assignedStudents" in d and isinstance(d["assignedStudents"], list):
        d["assignedStudents"] = [str(s) if isinstance(s, ObjectId) else s for s in d["assignedStudents"]]
    return d


@router.get("/dashboard")
async def admin_dashboard(current_user: dict = Depends(require_roles("admin"))):
    db = get_db()

    total_students = await db.users.count_documents({"role": "student"})
    total_mentors = await db.users.count_documents({"role": "mentor"})
    registered = await db.users.count_documents({"role": "student", "internshipStatus": {"$ne": "not_registered"}})
    completed = await db.users.count_documents({"role": "student", "internshipStatus": "completed"})
    total_reports = await db.weekly_reports.count_documents({})
    pending_docs = await db.documents.count_documents({"status": "pending"})

    return {
        "success": True,
        "data": {
            "totalStudents": total_students,
            "totalMentors": total_mentors,
            "registeredStudents": registered,
            "completedStudents": completed,
            "totalReports": total_reports,
            "pendingDocuments": pending_docs,
        },
    }


@router.get("/students")
async def get_all_students(current_user: dict = Depends(require_roles("admin"))):
    db = get_db()
    students = []
    async for s in db.users.find({"role": "student"}):
        doc = serialize_doc(s)
        doc.pop("password", None)

        # Populate mentors
        for field in ("companyMentor", "facultyMentor"):
            mid = s.get(field)
            if mid and isinstance(mid, ObjectId):
                mentor = await db.users.find_one({"_id": mid})
                if mentor:
                    doc[field] = {"_id": str(mentor["_id"]), "name": mentor.get("name", ""), "email": mentor.get("email", "")}

        students.append(doc)

    return {"success": True, "data": students}


@router.get("/mentors")
async def get_all_mentors(current_user: dict = Depends(require_roles("admin"))):
    db = get_db()
    mentors = []
    async for m in db.users.find({"role": "mentor"}):
        doc = serialize_doc(m)
        doc.pop("password", None)
        mentors.append(doc)

    return {"success": True, "data": mentors}


@router.put("/assign-mentor")
async def assign_mentor(
    data: AssignMentorRequest,
    current_user: dict = Depends(require_roles("admin")),
):
    db = get_db()
    update_field = "companyMentor" if data.mentorType == "company" else "facultyMentor"

    await db.users.update_one(
        {"_id": ObjectId(data.studentId)},
        {"$set": {update_field: ObjectId(data.mentorId)}},
    )
    await db.users.update_one(
        {"_id": ObjectId(data.mentorId)},
        {"$addToSet": {"assignedStudents": ObjectId(data.studentId)}},
    )

    return {"success": True, "message": "Mentor assigned successfully"}


@router.put("/update-student-status/{student_id}")
async def update_student_status(
    student_id: str,
    data: UpdateStatusRequest,
    current_user: dict = Depends(require_roles("admin")),
):
    db = get_db()
    result = await db.users.find_one_and_update(
        {"_id": ObjectId(student_id)},
        {"$set": {"internshipStatus": data.internshipStatus.value}},
        return_document=True,
    )

    if not result:
        raise HTTPException(status_code=404, detail="Student not found")

    return {"success": True, "data": serialize_doc(result)}


@router.get("/student/{student_id}/marks")
async def get_student_marks(
    student_id: str,
    current_user: dict = Depends(require_roles("admin")),
):
    db = get_db()
    sid = ObjectId(student_id)

    evaluations = []
    async for e in db.evaluations.find({"student": sid}):
        doc = serialize_doc(e)
        evaluator_id = e.get("evaluator")
        if evaluator_id and isinstance(evaluator_id, ObjectId):
            evaluator = await db.users.find_one({"_id": evaluator_id})
            if evaluator:
                doc["evaluator"] = {"_id": str(evaluator["_id"]), "name": evaluator.get("name", ""), "role": evaluator.get("role", "")}
        evaluations.append(doc)

    reports = []
    async for r in db.weekly_reports.find({"student": sid}):
        reports.append(serialize_doc(r))

    industry_marks = 0
    weekly_report_marks = 0
    review_meeting_marks = 0
    final_report_marks = 0
    presentation_marks = 0

    for e in evaluations:
        et = e.get("evaluationType")
        tm = e.get("totalMarks", 0)
        if et == "industry_final":
            industry_marks = tm
        elif et == "review_meetings":
            review_meeting_marks = tm
        elif et == "final_report":
            final_report_marks = tm
        elif et == "presentation_viva":
            presentation_marks = tm

    if reports:
        total_report_score = sum(r.get("totalScore", 0) for r in reports)
        weekly_report_marks = round(total_report_score / len(reports))

    total_marks = industry_marks + weekly_report_marks + review_meeting_marks + final_report_marks + presentation_marks

    credits = 0
    if total_marks >= 90:
        credits = 8
    elif total_marks >= 80:
        credits = 7
    elif total_marks >= 70:
        credits = 6
    elif total_marks >= 60:
        credits = 5
    elif total_marks >= 50:
        credits = 4

    return {
        "success": True,
        "data": {
            "industryMarks": {"marks": industry_marks, "maxMarks": 50},
            "weeklyReportMarks": {"marks": weekly_report_marks, "maxMarks": 20},
            "reviewMeetingMarks": {"marks": review_meeting_marks, "maxMarks": 10},
            "finalReportMarks": {"marks": final_report_marks, "maxMarks": 10},
            "presentationMarks": {"marks": presentation_marks, "maxMarks": 10},
            "totalMarks": total_marks,
            "maxTotalMarks": 100,
            "credits": credits,
            "maxCredits": 8,
            "evaluations": evaluations,
        },
    }


@router.post("/create-user")
async def admin_create_user(
    data: AdminCreateUserRequest,
    current_user: dict = Depends(require_roles("admin")),
):
    db = get_db()

    if data.role.value == "student":
        raise HTTPException(status_code=400, detail="Students must register themselves via the registration page")

    existing = await db.users.find_one({"email": data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user_doc = {
        "name": data.name,
        "email": data.email,
        "password": hash_password(data.password),
        "role": data.role.value,
        "phone": data.phone or "",
        "department": data.department or "",
        "designation": data.designation or "",
        "assignedStudents": [],
    }

    if data.role.value == "mentor" and data.mentorType:
        user_doc["mentorType"] = data.mentorType

    result = await db.users.insert_one(user_doc)
    user_doc["_id"] = str(result.inserted_id)
    user_doc.pop("password", None)

    return {"success": True, "message": f"{data.role.value.capitalize()} account created", "data": user_doc}


@router.delete("/delete-user/{user_id}")
async def delete_user(
    user_id: str,
    current_user: dict = Depends(require_roles("admin")),
):
    db = get_db()
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.get("role") == "admin" and str(user["_id"]) == str(current_user["_id"]):
        raise HTTPException(status_code=400, detail="Cannot delete your own admin account")

    await db.users.delete_one({"_id": ObjectId(user_id)})

    # Remove from any student's mentor references
    await db.users.update_many(
        {"companyMentor": ObjectId(user_id)},
        {"$set": {"companyMentor": None}},
    )
    await db.users.update_many(
        {"facultyMentor": ObjectId(user_id)},
        {"$set": {"facultyMentor": None}},
    )

    return {"success": True, "message": "User deleted successfully"}


@router.get("/documents")
async def get_all_documents(current_user: dict = Depends(require_roles("admin"))):
    """Get all uploaded documents across all students."""
    db = get_db()
    documents = []
    async for d in db.documents.find().sort("uploadDate", -1):
        doc = serialize_doc(d)
        # Build accessible file URL from stored filePath
        if d.get("filePath"):
            doc["fileUrl"] = "/" + d["filePath"].replace("\\", "/")
        # Populate student info
        student_id = d.get("student")
        if student_id and isinstance(student_id, ObjectId):
            student = await db.users.find_one({"_id": student_id})
            if student:
                doc["studentName"] = student.get("name", "")
                doc["studentPrn"] = student.get("prn", "")
        documents.append(doc)
    return {"success": True, "data": documents}


@router.put("/approve-document/{doc_id}")
async def approve_document(
    doc_id: str,
    current_user: dict = Depends(require_roles("admin", "mentor")),
):
    db = get_db()
    result = await db.documents.find_one_and_update(
        {"_id": ObjectId(doc_id)},
        {"$set": {
            "status": "approved",
            "reviewedBy": ObjectId(current_user["_id"]),
            "reviewDate": datetime.now(timezone.utc),
        }},
        return_document=True,
    )
    if not result:
        raise HTTPException(status_code=404, detail="Document not found")
    return {"success": True, "data": serialize_doc(result)}


@router.put("/reject-document/{doc_id}")
async def reject_document(
    doc_id: str,
    current_user: dict = Depends(require_roles("admin", "mentor")),
):
    db = get_db()
    result = await db.documents.find_one_and_update(
        {"_id": ObjectId(doc_id)},
        {"$set": {
            "status": "rejected",
            "reviewedBy": ObjectId(current_user["_id"]),
            "reviewDate": datetime.now(timezone.utc),
        }},
        return_document=True,
    )
    if not result:
        raise HTTPException(status_code=404, detail="Document not found")
    return {"success": True, "data": serialize_doc(result)}


@router.get("/student/{student_id}/detail")
async def get_student_detail(
    student_id: str,
    current_user: dict = Depends(require_roles("admin", "mentor")),
):
    """Get comprehensive student detail: profile, documents, reports, evaluations."""
    db = get_db()
    sid = ObjectId(student_id)

    student = await db.users.find_one({"_id": sid, "role": "student"})
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    profile = serialize_doc(student)
    profile.pop("password", None)

    # Populate mentor names
    for field in ("companyMentor", "facultyMentor"):
        mid = student.get(field)
        if mid and isinstance(mid, ObjectId):
            mentor = await db.users.find_one({"_id": mid})
            if mentor:
                profile[field] = {"_id": str(mentor["_id"]), "name": mentor.get("name", ""), "email": mentor.get("email", "")}

    # Documents
    documents = []
    async for d in db.documents.find({"student": sid}).sort("uploadDate", -1):
        doc = serialize_doc(d)
        if d.get("filePath"):
            doc["fileUrl"] = "/" + d["filePath"].replace("\\", "/")
        documents.append(doc)

    # Weekly reports
    reports = []
    async for r in db.weekly_reports.find({"student": sid}).sort("weekNumber", 1):
        reports.append(serialize_doc(r))

    # Evaluations
    evaluations = []
    async for e in db.evaluations.find({"student": sid}):
        doc = serialize_doc(e)
        evaluator_id = e.get("evaluator")
        if evaluator_id and isinstance(evaluator_id, ObjectId):
            evaluator = await db.users.find_one({"_id": evaluator_id})
            if evaluator:
                doc["evaluator"] = {"_id": str(evaluator["_id"]), "name": evaluator.get("name", ""), "role": evaluator.get("role", "")}
        evaluations.append(doc)

    # Daily logbook entries
    logbook = []
    async for entry in db.daily_logbook.find({"student": sid}).sort("date", -1):
        logbook.append(serialize_doc(entry))

    return {
        "success": True,
        "data": {
            "profile": profile,
            "documents": documents,
            "reports": reports,
            "evaluations": evaluations,
            "logbook": logbook,
        },
    }


DEFAULT_SETTINGS = {
    "keyDates": [
        {"label": "Internship Start", "date": "15 January 2026"},
        {"label": "Weekly Reports", "date": "Every Saturday"},
        {"label": "Mid-Term Evaluation", "date": "Mid-March 2026"},
        {"label": "Final Submission", "date": "May 2026 (2nd last week)"},
        {"label": "Viva & Presentations", "date": "Last week of May 2026"},
        {"label": "Marks Finalisation", "date": "Within 1 week after viva"},
    ],
    "assessmentStructure": {
        "industryMentor": {"total": 50, "items": [{"label": "Final Evaluation", "marks": 50}]},
        "facultyCoordinator": {
            "total": 50,
            "items": [
                {"label": "Weekly Progress Reports", "marks": 20},
                {"label": "Faculty Review Meetings", "marks": 10},
                {"label": "Final Internship Report", "marks": 10},
                {"label": "Presentation & Viva", "marks": 10},
            ],
        },
    },
}


@router.get("/settings")
async def get_settings(current_user: dict = Depends(require_roles("admin"))):
    db = get_db()
    settings = await db.settings.find_one({"type": "internship_program"})
    if not settings:
        return {"success": True, "data": DEFAULT_SETTINGS}
    settings.pop("_id", None)
    settings.pop("type", None)
    return {"success": True, "data": settings}


@router.put("/settings")
async def update_settings(
    data: SettingsUpdate,
    current_user: dict = Depends(require_roles("admin")),
):
    db = get_db()
    update_fields = {}
    if data.keyDates is not None:
        update_fields["keyDates"] = [kd.model_dump() for kd in data.keyDates]
    if data.assessmentStructure is not None:
        update_fields["assessmentStructure"] = data.assessmentStructure
    update_fields["updatedAt"] = datetime.now(timezone.utc)

    result = await db.settings.find_one_and_update(
        {"type": "internship_program"},
        {"$set": update_fields},
        upsert=True,
        return_document=True,
    )
    result.pop("_id", None)
    result.pop("type", None)
    return {"success": True, "data": result}
