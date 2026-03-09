from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


# ── Enums ──
class UserRole(str, Enum):
    student = "student"
    mentor = "mentor"
    admin = "admin"


class InternshipStatus(str, Enum):
    not_registered = "not_registered"
    registered = "registered"
    internship_started = "internship_started"
    mid_term = "mid_term"
    completed = "completed"


class DocumentType(str, Enum):
    offer_letter = "offer_letter"
    internship_proposal = "internship_proposal"
    undertaking = "undertaking"
    daily_logbook = "daily_logbook"
    completion_certificate = "completion_certificate"
    final_report = "final_report"
    presentation_slides = "presentation_slides"
    mentor_evaluation = "mentor_evaluation"


class DocumentStatus(str, Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"


class ReportStatus(str, Enum):
    submitted = "submitted"
    reviewed = "reviewed"
    approved = "approved"
    revision_needed = "revision_needed"


class EvaluationType(str, Enum):
    industry_final = "industry_final"
    weekly_reports = "weekly_reports"
    review_meetings = "review_meetings"
    final_report = "final_report"
    presentation_viva = "presentation_viva"


# ── Auth Schemas ──
class RegisterRequest(BaseModel):
    name: str = Field(..., min_length=1)
    email: EmailStr
    password: str = Field(..., min_length=6)
    role: UserRole = UserRole.student
    prn: Optional[str] = None
    class_name: Optional[str] = Field(None, alias="class")
    division: Optional[str] = None
    phone: Optional[str] = None

    class Config:
        populate_by_name = True


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: str = Field(..., alias="_id")
    name: str
    email: str
    role: str
    prn: Optional[str] = None
    class_name: Optional[str] = Field(None, alias="class")
    division: Optional[str] = None
    semester: Optional[str] = None
    internshipStatus: Optional[str] = None
    companyName: Optional[str] = None
    companyMentor: Optional[dict] = None
    facultyMentor: Optional[dict] = None
    designation: Optional[str] = None
    department: Optional[str] = None
    mentorType: Optional[str] = None

    class Config:
        populate_by_name = True


class AuthResponse(BaseModel):
    success: bool
    token: str
    user: dict


# ── Weekly Report Schemas ──
class WeeklyReportCreate(BaseModel):
    weekNumber: int = Field(..., ge=1, le=20)
    weekStartDate: str
    weekEndDate: str
    tasksPerformed: str = Field(..., min_length=1)
    keyLearnings: str = Field(..., min_length=1)
    planForNextWeek: str = Field(..., min_length=1)
    challengesFaced: Optional[str] = ""
    hoursWorked: Optional[float] = 0


class ReportScores(BaseModel):
    consistency: int = Field(0, ge=0, le=4)
    clarity: int = Field(0, ge=0, le=4)
    technicalContent: int = Field(0, ge=0, le=4)
    learningReflection: int = Field(0, ge=0, le=4)
    planning: int = Field(0, ge=0, le=4)


class ReviewReportRequest(BaseModel):
    scores: Optional[ReportScores] = None
    feedback: Optional[str] = ""
    status: Optional[ReportStatus] = ReportStatus.reviewed


# ── Daily Logbook Schemas ──
class DailyLogbookCreate(BaseModel):
    date: str  # YYYY-MM-DD
    tasksPerformed: str = Field(..., min_length=1)
    hoursWorked: float = Field(0, ge=0, le=24)
    supervisorRemarks: Optional[str] = ""


class DailyLogbookUpdate(BaseModel):
    tasksPerformed: Optional[str] = None
    hoursWorked: Optional[float] = None
    supervisorRemarks: Optional[str] = None


# ── Document Schemas ──
class DocumentUploadMeta(BaseModel):
    documentType: DocumentType


class ReviewDocumentRequest(BaseModel):
    status: DocumentStatus
    reviewComment: Optional[str] = ""


# ── Evaluation Schemas ──
class EvaluationCreate(BaseModel):
    evaluationType: EvaluationType
    rubrics: dict
    comments: Optional[str] = ""


# ── Admin Schemas ──
class AssignMentorRequest(BaseModel):
    studentId: str
    mentorId: str
    mentorType: str  # "company" or "faculty"


class UpdateStatusRequest(BaseModel):
    internshipStatus: InternshipStatus


class SettingsKeyDate(BaseModel):
    label: str
    date: str


class SettingsUpdate(BaseModel):
    keyDates: Optional[list[SettingsKeyDate]] = None
    assessmentStructure: Optional[dict] = None


class AdminCreateUserRequest(BaseModel):
    name: str = Field(..., min_length=1)
    email: EmailStr
    password: str = Field(..., min_length=6)
    role: UserRole
    phone: Optional[str] = None
    department: Optional[str] = None
    designation: Optional[str] = None
    mentorType: Optional[str] = None  # "company" or "faculty" for mentors


class UpdateProfileRequest(BaseModel):
    companyName: Optional[str] = None
    internshipStatus: Optional[InternshipStatus] = None
