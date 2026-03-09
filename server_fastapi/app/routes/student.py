import os
import uuid
from pathlib import Path
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form
from bson import ObjectId
from datetime import datetime, timezone
from app.core.database import get_db
from app.core.security import require_roles
from app.core.config import settings
from app.schemas.schemas import WeeklyReportCreate, UpdateProfileRequest, DailyLogbookCreate, DailyLogbookUpdate

router = APIRouter(prefix="/api/student", tags=["student"])


def serialize_doc(doc: dict) -> dict:
    d = {**doc}
    for key in ("_id", "student", "reviewedBy"):
        if isinstance(d.get(key), ObjectId):
            d[key] = str(d[key])
    return d


@router.get("/dashboard")
async def student_dashboard(current_user: dict = Depends(require_roles("student"))):
    db = get_db()
    user_id = ObjectId(current_user["_id"])

    student = await db.users.find_one({"_id": user_id})
    student_data = {**student, "_id": str(student["_id"])}
    student_data.pop("password", None)

    # Populate mentors
    for field in ("companyMentor", "facultyMentor"):
        mid = student.get(field)
        if mid and isinstance(mid, ObjectId):
            mentor = await db.users.find_one({"_id": mid})
            if mentor:
                student_data[field] = {
                    "name": mentor.get("name", ""),
                    "email": mentor.get("email", ""),
                    "designation": mentor.get("designation", ""),
                    "companyName": mentor.get("companyName", ""),
                }

    reports = []
    async for r in db.weekly_reports.find({"student": user_id}).sort("weekNumber", 1):
        reports.append(serialize_doc(r))

    documents = []
    async for d in db.documents.find({"student": user_id}):
        documents.append(serialize_doc(d))

    total_reports = len(reports)
    approved_reports = sum(1 for r in reports if r.get("status") == "approved")

    internship_start = datetime(2026, 1, 15, tzinfo=timezone.utc)
    now = datetime.now(timezone.utc)
    days_since_start = max(0, (now - internship_start).days)
    total_days = 136
    weeks_since_start = max(1, -(-days_since_start // 7))  # ceil division

    current_stage = "registration"
    if now >= datetime(2026, 5, 15, tzinfo=timezone.utc):
        current_stage = "conclusion"
    elif now >= internship_start:
        current_stage = "during_internship"

    return {
        "success": True,
        "data": {
            "student": student_data,
            "stats": {
                "daysCompleted": days_since_start,
                "totalDays": total_days,
                "attendancePercentage": round((days_since_start / total_days) * 100) if total_days > 0 else 0,
                "reportsSubmitted": total_reports,
                "totalReportsRequired": 20,
                "approvedReports": approved_reports,
                "currentWeek": weeks_since_start,
            },
            "currentStage": current_stage,
            "reports": reports,
            "documents": documents,
        },
    }


@router.post("/weekly-report")
async def submit_weekly_report(
    data: WeeklyReportCreate,
    current_user: dict = Depends(require_roles("student")),
):
    db = get_db()
    user_id = ObjectId(current_user["_id"])

    existing = await db.weekly_reports.find_one({"student": user_id, "weekNumber": data.weekNumber})
    if existing:
        raise HTTPException(status_code=400, detail=f"Week {data.weekNumber} report already submitted")

    report_doc = {
        "student": user_id,
        "weekNumber": data.weekNumber,
        "weekStartDate": data.weekStartDate,
        "weekEndDate": data.weekEndDate,
        "tasksPerformed": data.tasksPerformed,
        "keyLearnings": data.keyLearnings,
        "planForNextWeek": data.planForNextWeek,
        "challengesFaced": data.challengesFaced or "",
        "hoursWorked": data.hoursWorked or 0,
        "status": "submitted",
        "scores": {"consistency": 0, "clarity": 0, "technicalContent": 0, "learningReflection": 0, "planning": 0},
        "totalScore": 0,
        "feedback": "",
        "reviewedBy": None,
        "submittedAt": datetime.now(timezone.utc),
        "reviewedAt": None,
    }

    result = await db.weekly_reports.insert_one(report_doc)
    report_doc["_id"] = str(result.inserted_id)
    report_doc["student"] = str(report_doc["student"])

    return {"success": True, "data": report_doc}


@router.get("/weekly-reports")
async def get_weekly_reports(current_user: dict = Depends(require_roles("student"))):
    db = get_db()
    reports = []
    async for r in db.weekly_reports.find({"student": ObjectId(current_user["_id"])}).sort("weekNumber", 1):
        doc = serialize_doc(r)
        # Populate reviewer name
        if r.get("reviewedBy"):
            reviewer = await db.users.find_one({"_id": r["reviewedBy"]})
            if reviewer:
                doc["reviewedBy"] = {"_id": str(reviewer["_id"]), "name": reviewer.get("name", "")}
        reports.append(doc)

    return {"success": True, "data": reports}


@router.post("/upload-document")
async def upload_document(
    documentType: str = Form(...),
    document: UploadFile = File(...),
    current_user: dict = Depends(require_roles("student")),
):
    # Validate file extension
    ext = Path(document.filename).suffix.lower()
    if ext not in settings.ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Invalid file type. Only PDF, DOC, DOCX, PPTX, JPEG, PNG allowed.")

    # Validate file size
    content = await document.read()
    if len(content) > settings.MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File size exceeds 10MB limit.")

    # Save file
    user_dir = os.path.join(settings.UPLOAD_DIR, current_user["_id"])
    os.makedirs(user_dir, exist_ok=True)

    unique_name = f"{uuid.uuid4().hex}{ext}"
    file_path = os.path.join(user_dir, unique_name)

    with open(file_path, "wb") as f:
        f.write(content)

    db = get_db()
    doc_entry = {
        "student": ObjectId(current_user["_id"]),
        "documentType": documentType,
        "fileName": document.filename,
        "filePath": file_path,
        "fileSize": len(content),
        "status": "pending",
        "reviewedBy": None,
        "reviewComment": "",
        "uploadDate": datetime.now(timezone.utc),
        "reviewDate": None,
    }

    result = await db.documents.insert_one(doc_entry)
    doc_entry["_id"] = str(result.inserted_id)
    doc_entry["student"] = str(doc_entry["student"])

    return {"success": True, "data": doc_entry}


@router.get("/documents")
async def get_documents(current_user: dict = Depends(require_roles("student"))):
    db = get_db()
    documents = []
    async for d in db.documents.find({"student": ObjectId(current_user["_id"])}):
        doc = serialize_doc(d)
        if d.get("filePath"):
            doc["fileUrl"] = "/" + d["filePath"].replace("\\", "/")
        if d.get("reviewedBy"):
            reviewer = await db.users.find_one({"_id": d["reviewedBy"]})
            if reviewer:
                doc["reviewedBy"] = {"_id": str(reviewer["_id"]), "name": reviewer.get("name", "")}
        documents.append(doc)

    return {"success": True, "data": documents}


@router.get("/grades")
async def get_student_grades(current_user: dict = Depends(require_roles("student"))):
    db = get_db()
    sid = ObjectId(current_user["_id"])

    evaluations = []
    async for e in db.evaluations.find({"student": sid}):
        evaluations.append(serialize_doc(e))

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
            "industryFinal": {"marks": industry_marks, "maxMarks": 50, "completed": industry_marks > 0},
            "weeklyReports": {"marks": weekly_report_marks, "maxMarks": 20, "completed": weekly_report_marks > 0},
            "reviewMeetings": {"marks": review_meeting_marks, "maxMarks": 10, "completed": review_meeting_marks > 0},
            "finalReport": {"marks": final_report_marks, "maxMarks": 10, "completed": final_report_marks > 0},
            "presentationViva": {"marks": presentation_marks, "maxMarks": 10, "completed": presentation_marks > 0},
            "totalMarks": total_marks,
            "credits": credits,
        },
    }


@router.put("/update-profile")
async def update_profile(
    data: UpdateProfileRequest,
    current_user: dict = Depends(require_roles("student")),
):
    db = get_db()
    updates = {}
    if data.companyName is not None:
        updates["companyName"] = data.companyName
    if data.internshipStatus is not None:
        updates["internshipStatus"] = data.internshipStatus.value

    if updates:
        await db.users.update_one({"_id": ObjectId(current_user["_id"])}, {"$set": updates})

    user = await db.users.find_one({"_id": ObjectId(current_user["_id"])})
    user["_id"] = str(user["_id"])
    user.pop("password", None)

    return {"success": True, "user": user}


# ── Daily Logbook ──

@router.post("/daily-logbook")
async def create_logbook_entry(
    data: DailyLogbookCreate,
    current_user: dict = Depends(require_roles("student")),
):
    db = get_db()
    user_id = ObjectId(current_user["_id"])

    # One entry per date
    existing = await db.daily_logbook.find_one({"student": user_id, "date": data.date})
    if existing:
        raise HTTPException(status_code=400, detail=f"Entry for {data.date} already exists. Please edit it instead.")

    entry = {
        "student": user_id,
        "date": data.date,
        "tasksPerformed": data.tasksPerformed,
        "hoursWorked": data.hoursWorked,
        "supervisorRemarks": data.supervisorRemarks or "",
        "createdAt": datetime.now(timezone.utc),
        "updatedAt": datetime.now(timezone.utc),
    }
    result = await db.daily_logbook.insert_one(entry)
    entry["_id"] = str(result.inserted_id)
    entry["student"] = str(entry["student"])
    return {"success": True, "data": entry}


@router.put("/daily-logbook/{entry_id}")
async def update_logbook_entry(
    entry_id: str,
    data: DailyLogbookUpdate,
    current_user: dict = Depends(require_roles("student")),
):
    db = get_db()
    entry = await db.daily_logbook.find_one({"_id": ObjectId(entry_id), "student": ObjectId(current_user["_id"])})
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")

    updates = {}
    if data.tasksPerformed is not None:
        updates["tasksPerformed"] = data.tasksPerformed
    if data.hoursWorked is not None:
        updates["hoursWorked"] = data.hoursWorked
    if data.supervisorRemarks is not None:
        updates["supervisorRemarks"] = data.supervisorRemarks
    updates["updatedAt"] = datetime.now(timezone.utc)

    await db.daily_logbook.update_one({"_id": ObjectId(entry_id)}, {"$set": updates})
    updated = await db.daily_logbook.find_one({"_id": ObjectId(entry_id)})
    return {"success": True, "data": serialize_doc(updated)}


@router.delete("/daily-logbook/{entry_id}")
async def delete_logbook_entry(
    entry_id: str,
    current_user: dict = Depends(require_roles("student")),
):
    db = get_db()
    result = await db.daily_logbook.delete_one({"_id": ObjectId(entry_id), "student": ObjectId(current_user["_id"])})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Entry not found")
    return {"success": True}


@router.get("/daily-logbook")
async def get_logbook_entries(
    current_user: dict = Depends(require_roles("student")),
):
    db = get_db()
    entries = []
    async for e in db.daily_logbook.find({"student": ObjectId(current_user["_id"])}).sort("date", -1):
        entries.append(serialize_doc(e))
    return {"success": True, "data": entries}
