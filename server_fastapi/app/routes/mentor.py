from fastapi import APIRouter, HTTPException, Depends
from bson import ObjectId
from datetime import datetime, timezone
from app.core.database import get_db
from app.core.security import require_roles
from app.schemas.schemas import ReviewReportRequest, ReviewDocumentRequest, EvaluationCreate

router = APIRouter(prefix="/api/mentor", tags=["mentor"])


def serialize_doc(doc: dict) -> dict:
    d = {**doc}
    for key in ("_id", "student", "reviewedBy", "evaluator", "companyMentor", "facultyMentor"):
        if isinstance(d.get(key), ObjectId):
            d[key] = str(d[key])
    if "assignedStudents" in d and isinstance(d["assignedStudents"], list):
        d["assignedStudents"] = [str(s) if isinstance(s, ObjectId) else s for s in d["assignedStudents"]]
    return d


@router.get("/students")
async def get_assigned_students(current_user: dict = Depends(require_roles("mentor"))):
    db = get_db()
    mentor_oid = ObjectId(current_user["_id"])
    mentor_str = current_user["_id"]

    students = []
    async for s in db.users.find({
        "$or": [
            {"companyMentor": mentor_oid},
            {"facultyMentor": mentor_oid},
            {"companyMentor": mentor_str},
            {"facultyMentor": mentor_str},
        ]
    }):
        doc = serialize_doc(s)
        doc.pop("password", None)
        # Count weekly reports submitted by this student
        report_count = await db.weekly_reports.count_documents({"student": s["_id"]})
        doc["reportsSubmitted"] = report_count
        students.append(doc)

    return {"success": True, "data": students}


@router.get("/student/{student_id}/reports")
async def get_student_reports(
    student_id: str,
    current_user: dict = Depends(require_roles("mentor")),
):
    db = get_db()
    reports = []
    async for r in db.weekly_reports.find({"student": ObjectId(student_id)}).sort("weekNumber", 1):
        reports.append(serialize_doc(r))

    return {"success": True, "data": reports}


@router.put("/review-report/{report_id}")
async def review_report(
    report_id: str,
    data: ReviewReportRequest,
    current_user: dict = Depends(require_roles("mentor")),
):
    db = get_db()

    total_score = 0
    scores_dict = {}
    if data.scores:
        scores_dict = data.scores.model_dump()
        total_score = sum(scores_dict.values())

    update_data = {
        "scores": scores_dict,
        "totalScore": total_score,
        "feedback": data.feedback or "",
        "status": data.status.value if data.status else "reviewed",
        "reviewedBy": ObjectId(current_user["_id"]),
        "reviewedAt": datetime.now(timezone.utc),
    }

    result = await db.weekly_reports.find_one_and_update(
        {"_id": ObjectId(report_id)},
        {"$set": update_data},
        return_document=True,
    )

    if not result:
        raise HTTPException(status_code=404, detail="Report not found")

    return {"success": True, "data": serialize_doc(result)}


@router.get("/student/{student_id}/evaluations")
async def get_student_evaluations(
    student_id: str,
    current_user: dict = Depends(require_roles("mentor")),
):
    db = get_db()
    evaluations = []
    async for e in db.evaluations.find({
        "student": ObjectId(student_id),
        "evaluator": ObjectId(current_user["_id"]),
    }):
        evaluations.append(serialize_doc(e))
    return {"success": True, "data": evaluations}


@router.post("/evaluate/{student_id}")
async def evaluate_student(
    student_id: str,
    data: EvaluationCreate,
    current_user: dict = Depends(require_roles("mentor")),
):
    db = get_db()

    # Prevent duplicate evaluation for same student + type by this mentor
    existing = await db.evaluations.find_one({
        "student": ObjectId(student_id),
        "evaluator": ObjectId(current_user["_id"]),
        "evaluationType": data.evaluationType.value,
    })
    if existing:
        raise HTTPException(status_code=400, detail="You have already submitted this evaluation type for this student")

    total_marks = sum(data.rubrics.values())
    max_marks_map = {
        "industry_final": 30,
        "review_meetings": 10,
        "final_report": 10,
        "presentation_viva": 10,
    }
    max_marks = max_marks_map.get(data.evaluationType.value, 0)

    rubric_field_map = {
        "industry_final": "industryRubrics",
        "review_meetings": "reviewMeetingRubrics",
        "final_report": "finalReportRubrics",
        "presentation_viva": "presentationRubrics",
    }
    rubric_field = rubric_field_map.get(data.evaluationType.value, "industryRubrics")

    eval_doc = {
        "student": ObjectId(student_id),
        "evaluator": ObjectId(current_user["_id"]),
        "evaluationType": data.evaluationType.value,
        rubric_field: data.rubrics,
        "totalMarks": total_marks,
        "maxMarks": max_marks,
        "comments": data.comments or "",
        "createdAt": datetime.now(timezone.utc),
    }

    result = await db.evaluations.insert_one(eval_doc)
    eval_doc["_id"] = str(result.inserted_id)
    eval_doc["student"] = str(eval_doc["student"])
    eval_doc["evaluator"] = str(eval_doc["evaluator"])

    return {"success": True, "data": eval_doc}


@router.get("/documents")
async def get_mentor_documents(current_user: dict = Depends(require_roles("mentor"))):
    """Get all documents from assigned students."""
    db = get_db()
    mentor_oid = ObjectId(current_user["_id"])
    mentor_str = current_user["_id"]

    # Find students assigned to this mentor
    student_ids = []
    async for s in db.users.find({
        "$or": [
            {"companyMentor": mentor_oid},
            {"facultyMentor": mentor_oid},
            {"companyMentor": mentor_str},
            {"facultyMentor": mentor_str},
        ]
    }):
        student_ids.append(s["_id"])

    documents = []
    if student_ids:
        async for d in db.documents.find({"student": {"$in": student_ids}}).sort("uploadDate", -1):
            doc = serialize_doc(d)
            if d.get("filePath"):
                doc["fileUrl"] = "/" + d["filePath"].replace("\\", "/")
            student = await db.users.find_one({"_id": d["student"]})
            if student:
                doc["studentName"] = student.get("name", "")
                doc["studentPrn"] = student.get("prn", "")
            documents.append(doc)
    return {"success": True, "data": documents}


@router.get("/student/{student_id}/documents")
async def get_student_documents(
    student_id: str,
    current_user: dict = Depends(require_roles("mentor")),
):
    db = get_db()
    documents = []
    async for d in db.documents.find({"student": ObjectId(student_id)}):
        doc = serialize_doc(d)
        if d.get("filePath"):
            doc["fileUrl"] = "/" + d["filePath"].replace("\\", "/")
        documents.append(doc)

    return {"success": True, "data": documents}


@router.put("/review-document/{doc_id}")
async def review_document(
    doc_id: str,
    data: ReviewDocumentRequest,
    current_user: dict = Depends(require_roles("mentor")),
):
    db = get_db()

    result = await db.documents.find_one_and_update(
        {"_id": ObjectId(doc_id)},
        {
            "$set": {
                "status": data.status.value,
                "reviewComment": data.reviewComment or "",
                "reviewedBy": ObjectId(current_user["_id"]),
                "reviewDate": datetime.now(timezone.utc),
            }
        },
        return_document=True,
    )

    if not result:
        raise HTTPException(status_code=404, detail="Document not found")

    return {"success": True, "data": serialize_doc(result)}
