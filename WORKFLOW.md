# MIT VPU Internship Portal — Application Workflow

This document describes the end-to-end workflows for all user roles in the Internship Portal.

---

## 1. Registration & Login Workflow

```
                    ┌───────────────┐
                    │  /register    │
                    │  (Student)    │
                    └───────┬───────┘
                            │ Fill name, email, PRN,
                            │ password, upload offer letter
                            ▼
                    ┌───────────────┐
                    │ POST /api/    │
                    │ auth/register │
                    └───────┬───────┘
                            │ Returns JWT + user
                            ▼
                    ┌───────────────┐
                    │  /loading     │
                    │ (Preloader)   │
                    │ ~5 sec anim   │
                    └───────┬───────┘
                            │ Redirect by role
              ┌─────────────┼─────────────┐
              ▼             ▼             ▼
        /dashboard      /mentor       /admin
        (Student)       (Mentor)      (Admin)
```

### Login Flow
1. User visits `/login` → enters email + password
2. Frontend calls `POST /api/auth/login`
3. Backend verifies credentials via bcrypt → returns JWT token + user object
4. Token stored in `localStorage`
5. User redirected to `/loading` (animated preloader for ~5 seconds)
6. Preloader redirects to role-specific dashboard:
   - Student → `/dashboard`
   - Mentor → `/mentor`
   - Admin → `/admin`

### Registration Flow (Students Only)
1. User visits `/register` → fills name, email, PRN, phone, password
2. Uploads offer letter file (required)
3. Frontend calls `POST /api/auth/register`
4. On success, auto-uploads offer letter via `POST /api/student/upload-document`
5. Redirects to `/loading` → then `/dashboard`

### Account Creation (Mentors & Admins)
- Created by Admin from `/admin/mentors` → "Create Mentor/Admin" button
- Admin fills: name, email, password, role, department, designation, mentorType
- `POST /api/admin/create-user`

---

## 2. Student Workflow

### 2.1 Dashboard Overview
```
Student logs in → /dashboard
  ├── View profile: name, PRN, class, company, mentors
  ├── See stats: days completed, reports submitted, days to deadline
  ├── View current internship stage (registration / during / conclusion)
  └── Quick links to upload documents, submit reports
```

### 2.2 Weekly Report Submission
```
Student                                    Mentor
  │                                          │
  ├── Navigate to /weekly-reports            │
  ├── Click "New Report"                     │
  ├── Fill form:                             │
  │   • Week number (1-20)                   │
  │   • Start/end dates                      │
  │   • Tasks performed                      │
  │   • Key learnings                        │
  │   • Plan for next week                   │
  │   • Challenges faced                     │
  │   • Hours worked                         │
  ├── Submit                                 │
  │   → POST /api/student/weekly-report      │
  │   → Status: "submitted"                  │
  │   → Scores: all 0 (awaiting review)      │
  │                                          │
  │            ┌─────────────────────────────►│
  │            │  Report appears in           │
  │            │  /mentor/reviews             │
  │            │                              │
  │            │  Mentor clicks student       │
  │            │  → sees report list          │
  │            │  → clicks report             │
  │            │  → scores 5 rubrics (0-4)    │
  │            │  → adds feedback             │
  │            │  → PUT /review-report/{id}   │
  │            │  → Status: "reviewed"        │
  │            │                              │
  │◄───────────┘  Notification sent:          │
  │               "Week N reviewed - X/20"    │
  │                                          │
  ├── View score & feedback in report detail  │
  └── Score visible in /grades               │
```

### 2.3 Document Upload & Approval
```
Student                           Mentor / Admin
  │                                    │
  ├── Navigate to /documents           │
  ├── See 8 document types:            │
  │   Before Internship:               │
  │   • Offer Letter (required)        │
  │   • Internship Proposal            │
  │   • Student Undertaking            │
  │   During:                          │
  │   • Daily Logbook                  │
  │   End of Internship:               │
  │   • Completion Certificate         │
  │   • Final Report                   │
  │   • Presentation Slides            │
  │   • Mentor Evaluation              │
  │                                    │
  ├── Click Upload → select file       │
  │   (PDF/DOC/DOCX/PPTX/JPG/PNG)    │
  │   Max size: 10 MB                  │
  │                                    │
  ├── POST /api/student/upload-doc     │
  │   → Status: "pending"             │
  │                                    │
  │         ┌──────────────────────────►│
  │         │  Doc appears in          │
  │         │  /mentor/documents or    │
  │         │  /admin/documents        │
  │         │                          │
  │         │  Reviewer clicks View    │
  │         │  → opens file in browser │
  │         │  → clicks Approve/Reject │
  │         │  → PUT /approve-document │
  │         │  → Status: "approved"    │
  │         │    or "rejected"         │
  │         │                          │
  │◄────────┘  Notification sent       │
  │            "Offer letter approved" │
  │                                    │
  └── Green badge shown on document    │
```

### 2.4 View Grades & Credits
```
Student navigates to /grades
  │
  ├── GET /api/student/grades
  │
  ├── See overall score: X / 100
  ├── See credits earned: Y / 8
  │
  ├── Assessment Breakdown:
  │   ┌─────────────────────────────────┬──────────┐
  │   │ Component                       │ Marks    │
  │   ├─────────────────────────────────┼──────────┤
  │   │ Industry Mentor Evaluation      │ __/50    │
  │   │ Weekly Progress Reports         │ __/20    │
  │   │ Faculty Review Meetings         │ __/10    │
  │   │ Final Report                    │ __/10    │
  │   │ Presentation & Viva             │ __/10    │
  │   ├─────────────────────────────────┼──────────┤
  │   │ TOTAL                           │ __/100   │
  │   └─────────────────────────────────┴──────────┘
  │
  └── Credit Mapping:
      90-100 → 8 credits
      80-89  → 7 credits
      70-79  → 6 credits
      60-69  → 5 credits
      50-59  → 4 credits
      <50    → 0 (re-internship)
```

### 2.5 Timeline & Downloads
- `/timeline` — View 7 internship milestones, key dates, rules
- `/downloads` — Download 7 templates: proposal format, undertaking form, logbook, report format, guidelines, PPT template, handbook

---

## 3. Mentor Workflow

### 3.1 Dashboard View
```
Mentor logs in → /mentor
  ├── See stats: assigned students, total reports, pending evaluations
  ├── Weekly Report Rubric guide (5 criteria × 4 pts = 20)
  └── Industry Final Rubric guide (5 criteria × 6 pts = 30)
```

### 3.2 Viewing Assigned Students
```
Navigate to /mentor/students
  │
  ├── GET /api/mentor/students
  │   → Returns students where companyMentor or facultyMentor = this mentor
  │
  ├── Table shows: PRN, Name, Company, Reports (X/20), Status, Actions
  │
  ├── Click student name → Student Detail Modal
  │   → GET /api/admin/student/{id}/detail
  │   → Shows: profile, all documents, all reports, all evaluations
  │
  ├── Click "Review" → Opens Review Reports Modal
  │   → Fetch student's reports
  │   → Select report → score & feedback → submit review
  │
  └── Click "Grade" → Opens Evaluation Modal
      → Select evaluation type → score rubrics → submit
```

### 3.3 Review Weekly Reports
```
Navigate to /mentor/reviews → Select student → Select report

  ┌─────────────────────────────────────────┐
  │  Week 3 Report                          │
  │                                         │
  │  Tasks: Built REST API for user module  │
  │  Learnings: Learned FastAPI routing     │
  │  Next Week: Frontend integration        │
  │  Challenges: CORS configuration         │
  │  Hours: 45                              │
  │                                         │
  │  ── Score (each 0-4) ──────────────     │
  │  Consistency:          [0][1][2][3][4]  │
  │  Clarity:              [0][1][2][3][4]  │
  │  Technical Content:    [0][1][2][3][4]  │
  │  Learning Reflection:  [0][1][2][3][4]  │
  │  Planning:             [0][1][2][3][4]  │
  │                                         │
  │  Total: 16 / 20                         │
  │                                         │
  │  Feedback: [________________________]   │
  │                                         │
  │  [Submit Review]                        │
  └─────────────────────────────────────────┘
  
  → PUT /api/mentor/review-report/{id}
  → Report status → "reviewed", totalScore → 16
```

### 3.4 Evaluate Students
```
Navigate to /mentor/evaluations → Select student → Click "Grade"

  ┌─────────────────────────────────────────┐
  │  Evaluate — Rahul Sharma  (MCA401)      │
  │                                         │
  │  Type: [Industry Final (30 marks)    ▼] │
  │                                         │
  │  Rubrics (max 6 each):                  │
  │  Technical Competency:         [__]     │
  │  Quality & Timeliness:         [__]     │
  │  Problem Solving & Initiative: [__]     │
  │  Responsibility & Ownership:   [__]     │
  │  Teamwork & Professionalism:   [__]     │
  │                                         │
  │  Total: 24 / 30                         │
  │                                         │
  │  Comments: [________________________]   │
  │  [Submit Evaluation]                    │
  └─────────────────────────────────────────┘
  
  → POST /api/mentor/evaluate/{student_id}
  → Creates evaluation record in DB
```

### 3.5 Review Documents
```
Navigate to /mentor/documents
  ├── See all documents from assigned students
  ├── Filter/search by student name, PRN, doc type
  ├── Click file link → opens document in new tab
  ├── Click "Approve" → PUT /api/admin/approve-document/{id}
  └── Click "Reject" → PUT /api/admin/reject-document/{id}
```

---

## 4. Admin Workflow

### 4.1 Dashboard Overview
```
Admin logs in → /admin
  ├── Stats: total students, registered, active, completed
  ├── Key dates table (start, weekly reports, mid-term, final, viva)
  └── Quick summary: mentors, reports, pending docs
```

### 4.2 Student Management
```
Navigate to /admin/students
  │
  ├── GET /api/admin/students
  │   → All students with mentor info populated
  │
  ├── Search by name, PRN, company
  │
  ├── Click student name → Detail Modal
  │   → Full profile, documents, reports, evaluations
  │
  └── Click "Manage" → Edit Modal
      ├── Update internship status (dropdown)
      │   → PUT /api/admin/update-student-status/{id}
      │
      ├── Assign Faculty Mentor (dropdown)
      │   → PUT /api/admin/assign-mentor
      │   → { studentId, mentorId, mentorType: "faculty" }
      │
      └── Assign Company Mentor (dropdown)
          → PUT /api/admin/assign-mentor
          → { studentId, mentorId, mentorType: "company" }
```

### 4.3 Mentor Management
```
Navigate to /admin/mentors
  │
  ├── GET /api/admin/mentors
  │
  ├── Table: Name, Email, Department, Type (Faculty/Industry), Students, Actions
  │
  ├── Click "Create Mentor/Admin"
  │   → Fill: name, email, password, role, department, designation, mentorType
  │   → POST /api/admin/create-user
  │
  └── Click "Delete" → confirm → DELETE /api/admin/delete-user/{id}
      → Also clears mentor references from students
```

### 4.4 Document Management
```
Navigate to /admin/documents
  ├── GET /api/admin/documents → all docs across all students
  ├── Table: Student, PRN, Type, File link, Date, Status, Actions
  ├── Approve → PUT /api/admin/approve-document/{id}
  └── Reject → PUT /api/admin/reject-document/{id}
```

### 4.5 Student Grades View
```
Click student → /api/admin/student/{id}/marks
  → Industry (50) + Weekly Reports (20) + Meetings (10) + Report (10) + Viva (10) = 100
  → Credits calculated automatically
  → Admin updates status to "completed" when finalized
```

---

## 5. Mentor Assignment Workflow

This is the critical flow that connects students to mentors.

```
Admin                          MongoDB                        Mentor
  │                              │                              │
  ├── /admin/students            │                              │
  ├── Click "Manage" on student  │                              │
  ├── Select mentor from dropdown│                              │
  ├── PUT /api/admin/assign-mentor                              │
  │   { studentId, mentorId,     │                              │
  │     mentorType: "faculty" }  │                              │
  │                              │                              │
  │   ┌──────────────────────────┤                              │
  │   │ student.facultyMentor    │                              │
  │   │   = mentorId (ObjectId)  │                              │
  │   │                          │                              │
  │   │ mentor.assignedStudents  │                              │
  │   │   += [studentId]         │                              │
  │   └──────────────────────────┤                              │
  │                              │                              │
  │                              │    GET /api/mentor/students  │
  │                              │◄─────────────────────────────┤
  │                              │    Query: where student's    │
  │                              │    companyMentor or          │
  │                              │    facultyMentor = mentorId  │
  │                              │                              │
  │                              │    Returns: [student list]  ─►│
  │                              │                              │
  │                              │                              ├── Sees assigned students
  │                              │                              ├── Can review reports
  │                              │                              ├── Can approve documents
  │                              │                              └── Can submit evaluations
```

---

## 6. File Upload Workflow

```
Student (Browser)              Backend (FastAPI)              Disk Storage
  │                              │                              │
  ├── Select file                │                              │
  │   (PDF/DOC/DOCX/PPTX/       │                              │
  │    JPEG/JPG/PNG, ≤10MB)     │                              │
  │                              │                              │
  ├── FormData:                  │                              │
  │   documentType + file        │                              │
  │                              │                              │
  ├── POST /api/student/         │                              │
  │   upload-document            │                              │
  │                              │                              │
  │                    ┌─────────┤                              │
  │                    │ Validate:│                              │
  │                    │ extension│                              │
  │                    │ & size   │                              │
  │                    └─────────┤                              │
  │                              │                              │
  │                              ├── mkdir uploads/{userId}/     │
  │                              ├── Write file as {uuid}.{ext}─►│
  │                              │                              │ uploads/
  │                              │                              │   {userId}/
  │                              │                              │     abc123.pdf
  │                              │                              │
  │                              ├── Insert to MongoDB:         │
  │                              │   { student, documentType,   │
  │                              │     fileName, filePath,      │
  │                              │     fileSize, status:pending }│
  │                              │                              │
  │◄─────────────────────────────┤ Return document object       │
  │                              │                              │
  │                              │                              │
  │  Access file later via:      │                              │
  │  GET /uploads/{userId}/      │    StaticFiles middleware ──►│
  │       {uuid}.{ext}           │    serves from disk          │
```

---

## 7. Notification Workflow

```
Any user opens notification bell → GET /api/auth/notifications

Backend checks role and generates notifications:

Student:
  • Pending documents needing upload
  • Reports awaiting submission (based on week)
  • Recently reviewed reports with scores
  • Document approval/rejection updates

Mentor:
  • New reports to review from assigned students
  • Pending document approvals
  • Upcoming evaluation deadlines

Admin:
  • Pending document approvals count
  • Students without mentor assignments
  • Internship completion stats
```

---

## 8. Session Lifecycle

```
┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐
│  Login   │──►│ Preloader│──►│Dashboard │──►│  Work    │──►│ Logout   │
│          │   │ ~5 sec   │   │ by role  │   │ (CRUD)   │   │          │
└──────────┘   └──────────┘   └──────────┘   └──────────┘   └──────────┘
                                                                  │
                                                                  ▼
                                                          Clear localStorage
                                                          Redirect to /login
```

- JWT expires after 7 days → forces re-login
- Token stored in localStorage persists across browser sessions
- No server-side session — purely stateless JWT
