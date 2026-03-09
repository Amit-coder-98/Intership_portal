# MIT VPU Internship Portal — Application Architecture

## Overview

A full-stack web application for managing the MCA Semester IV Internship program at MIT Vishwaprayag University, School of Computing. The system connects **Students**, **Mentors** (Industry & Faculty), and **Admins** through a unified portal for report submission, document management, grading, and progress tracking.

| Layer     | Technology                                      |
| --------- | ----------------------------------------------- |
| Frontend  | React 19 + Vite 7 + Tailwind CSS 3             |
| Backend   | FastAPI (Python 3.10) + Uvicorn                 |
| Database  | MongoDB (via Motor async driver)                |
| Auth      | JWT (HS256) + Bcrypt password hashing           |
| File Store| Local disk (`uploads/`) served via FastAPI static mount |

---

## High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                         │
│  React 19 + React Router 7 + Tailwind CSS + Framer Motion      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │  Login /  │  │ Student  │  │  Mentor  │  │  Admin   │       │
│  │ Register  │  │Dashboard │  │Dashboard │  │Dashboard │       │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘       │
│         │             │             │             │              │
│         └─────────────┴─────────────┴─────────────┘              │
│                           │                                      │
│               Axios / Fetch (Bearer JWT)                         │
└───────────────────────────┬──────────────────────────────────────┘
                            │  HTTP (Port 5173 → Proxy → 8000)
                            ▼
┌───────────────────────────────────────────────────────────────────┐
│                     BACKEND (FastAPI + Uvicorn)                   │
│                                                                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │  Auth Routes │  │Student Routes│  │Mentor Routes│              │
│  │ /api/auth/*  │  │/api/student/*│  │/api/mentor/*│              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
│  ┌─────────────┐  ┌─────────────┐  ┌────────────────┐           │
│  │Admin Routes  │  │  Security   │  │ Static Files   │           │
│  │/api/admin/* │  │ JWT+Bcrypt  │  │ /uploads/*     │           │
│  └─────────────┘  └─────────────┘  └────────────────┘           │
│                           │                                       │
└───────────────────────────┬───────────────────────────────────────┘
                            │  Motor (Async)
                            ▼
┌───────────────────────────────────────────────────────────────────┐
│                     MongoDB (Port 27017)                          │
│                                                                   │
│  ┌──────────┐  ┌───────────────┐  ┌───────────┐  ┌────────────┐│
│  │  users   │  │weekly_reports │  │ documents │  │evaluations ││
│  └──────────┘  └───────────────┘  └───────────┘  └────────────┘│
│                                                                   │
│  Database: mit_internship                                         │
└───────────────────────────────────────────────────────────────────┘
```

---

## Directory Structure

```
Intership_handbook_web/
│
├── client/                          # React Frontend
│   ├── public/                      # Static public assets
│   ├── src/
│   │   ├── main.jsx                 # React entry point
│   │   ├── App.jsx                  # Router + Protected routes
│   │   ├── App.css                  # Global styles
│   │   ├── index.css                # Tailwind + custom CSS
│   │   ├── assets/                  # Images, logos
│   │   ├── context/
│   │   │   └── AuthContext.jsx      # Auth state (user, token, login, logout)
│   │   ├── components/
│   │   │   ├── Layout.jsx           # App shell: sidebar + topbar + search + notifications + profile
│   │   │   └── Sidebar.jsx          # Role-based navigation sidebar
│   │   └── pages/
│   │       ├── Login.jsx            # Login form
│   │       ├── Register.jsx         # Student self-registration + offer letter upload
│   │       ├── Preloader.jsx        # Animated loading screen after login
│   │       ├── StudentDashboard.jsx # Student home: profile, stats, progress
│   │       ├── WeeklyReports.jsx    # Submit & view weekly reports
│   │       ├── Documents.jsx        # Upload & track 8 document types
│   │       ├── Grades.jsx           # View marks, evaluations, credit mapping
│   │       ├── Timeline.jsx         # Internship schedule & milestones
│   │       ├── Downloads.jsx        # Downloadable templates (proposal, logbook, etc.)
│   │       ├── MentorDashboard.jsx  # Mentor: students list, review reports, grade, approve docs
│   │       └── AdminDashboard.jsx   # Admin: manage students, mentors, docs, create accounts
│   ├── index.html
│   ├── vite.config.js               # Vite config + proxy to backend
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── package.json
│
├── server_fastapi/                  # Python Backend
│   ├── main.py                      # FastAPI app, CORS, lifespan, route registration
│   ├── requirements.txt             # Python dependencies
│   ├── .env                         # Environment variables (JWT_SECRET, MONGODB_URI)
│   ├── seed_users.py                # Demo data seeder (student, mentor, admin)
│   ├── uploads/                     # Uploaded files (per-student subdirectories)
│   └── app/
│       ├── __init__.py
│       ├── core/
│       │   ├── config.py            # Settings: DB URI, JWT secret, upload limits
│       │   ├── database.py          # Motor client, connect/close, indexes
│       │   └── security.py          # Bcrypt, JWT encode/decode, role-based guards
│       ├── schemas/
│       │   └── schemas.py           # Pydantic models & enums
│       ├── routes/
│       │   ├── auth.py              # Register, login, profile, logout, notifications
│       │   ├── student.py           # Dashboard, weekly reports, documents, grades
│       │   ├── mentor.py            # Assigned students, review reports, evaluate, approve docs
│       │   └── admin.py             # All students/mentors, assign mentor, create user, marks
│       └── models/
│           └── __init__.py          # Empty — uses schemaless MongoDB (raw dicts)
│
└── server/                          # Legacy Node.js backend (unused)
```

---

## Backend Architecture

### Route Modules

| Module       | Prefix           | Auth Required | Allowed Roles      |
| ------------ | ---------------- | ------------- | ------------------ |
| `auth.py`    | `/api/auth`      | Mixed         | Any                |
| `student.py` | `/api/student`   | Yes           | `student`          |
| `mentor.py`  | `/api/mentor`    | Yes           | `mentor`           |
| `admin.py`   | `/api/admin`     | Yes           | `admin` (some shared with `mentor`) |

### API Endpoints

#### Auth (`/api/auth`)

| Method | Endpoint          | Auth | Description                          |
| ------ | ----------------- | ---- | ------------------------------------ |
| POST   | `/register`       | No   | Student self-registration            |
| POST   | `/login`          | No   | Login (any role) → returns JWT       |
| GET    | `/me`             | Yes  | Get current user profile             |
| PUT    | `/profile`        | Yes  | Update name, phone, companyName      |
| POST   | `/logout`         | Yes  | Logout (client-side token removal)   |
| GET    | `/notifications`  | Yes  | Role-aware notifications             |

#### Student (`/api/student`)

| Method | Endpoint           | Description                                         |
| ------ | ------------------ | --------------------------------------------------- |
| GET    | `/dashboard`       | Profile, stats, current stage, reports, documents    |
| POST   | `/weekly-report`   | Submit weekly report (unique per student + week)     |
| GET    | `/weekly-reports`  | All submitted reports for current student            |
| POST   | `/upload-document` | Upload document (multipart, validates type & size)   |
| GET    | `/documents`       | All documents with status & reviewer info            |
| GET    | `/grades`          | Aggregated marks across 5 components → credit calc   |
| PUT    | `/update-profile`  | Update company name & internship status              |

#### Mentor (`/api/mentor`)

| Method | Endpoint                          | Description                                    |
| ------ | --------------------------------- | ---------------------------------------------- |
| GET    | `/students`                       | Assigned students with report counts           |
| GET    | `/student/{id}/reports`           | All weekly reports of a student                |
| PUT    | `/review-report/{id}`             | Score & review a weekly report (5 rubrics)     |
| GET    | `/documents`                      | All documents from assigned students           |
| GET    | `/student/{id}/documents`         | Documents of a specific student                |
| PUT    | `/review-document/{id}`           | Approve/reject a document                      |
| POST   | `/evaluate/{id}`                  | Submit evaluation (industry, meetings, etc.)   |

#### Admin (`/api/admin`)

| Method | Endpoint                          | Description                                      |
| ------ | --------------------------------- | ------------------------------------------------ |
| GET    | `/dashboard`                      | Overview stats (students, mentors, reports, docs) |
| GET    | `/students`                       | All students with populated mentor info           |
| GET    | `/mentors`                        | All mentor accounts                               |
| PUT    | `/assign-mentor`                  | Assign company/faculty mentor to student          |
| PUT    | `/update-student-status/{id}`     | Change internship status                          |
| GET    | `/student/{id}/marks`             | Student's complete grade breakdown                |
| POST   | `/create-user`                    | Create mentor/admin accounts                      |
| DELETE | `/delete-user/{id}`               | Delete user + cleanup mentor references           |
| GET    | `/documents`                      | All documents across all students                 |
| PUT    | `/approve-document/{id}`          | Approve a document (admin + mentor)               |
| PUT    | `/reject-document/{id}`           | Reject a document (admin + mentor)                |
| GET    | `/student/{id}/detail`            | Full student profile + docs + reports + evals     |

---

### MongoDB Collections

#### `users`
```
{
  _id, name, email, password (bcrypt),
  role: "student" | "mentor" | "admin",
  prn (unique, sparse), class, semester, division, phone, avatar,
  internshipStatus: "not_registered" | "registered" | "internship_started" | "mid_term" | "completed",
  companyName, companyMentor (ObjectId), facultyMentor (ObjectId),
  internshipStartDate, internshipEndDate,
  designation, department, mentorType: "company" | "faculty",
  assignedStudents: [ObjectId],
  createdAt
}
```

#### `weekly_reports` — Unique index on `(student, weekNumber)`
```
{
  _id, student (ObjectId), weekNumber (1-20),
  weekStartDate, weekEndDate,
  tasksPerformed, keyLearnings, planForNextWeek, challengesFaced, hoursWorked,
  status: "submitted" | "reviewed" | "approved" | "revision_needed",
  scores: { consistency, clarity, technicalContent, learningReflection, planning } (0-4 each),
  totalScore (0-20), feedback,
  reviewedBy (ObjectId), submittedAt, reviewedAt
}
```

#### `documents`
```
{
  _id, student (ObjectId),
  documentType: "offer_letter" | "internship_proposal" | "undertaking" | "daily_logbook" |
                "completion_certificate" | "final_report" | "presentation_slides" | "mentor_evaluation",
  fileName, filePath, fileSize,
  status: "pending" | "approved" | "rejected",
  reviewedBy (ObjectId), reviewComment, uploadDate, reviewDate
}
```

#### `evaluations`
```
{
  _id, student (ObjectId), evaluator (ObjectId),
  evaluationType: "industry_final" | "review_meetings" | "final_report" | "presentation_viva",
  [rubric_field]: { ... },   // industryRubrics, reviewMeetingRubrics, etc.
  totalMarks, maxMarks, comments, createdAt
}
```

---

## Frontend Architecture

### Routing (React Router 7)

```
/login                   → Login.jsx           (Public)
/register                → Register.jsx        (Public)
/loading                 → Preloader.jsx        (Protected)

/ (Layout)               → Student pages        (role: student)
├── /dashboard           → StudentDashboard.jsx
├── /weekly-reports      → WeeklyReports.jsx
├── /documents           → Documents.jsx
├── /downloads           → Downloads.jsx
├── /timeline            → Timeline.jsx
└── /grades              → Grades.jsx

/mentor (Layout)         → Mentor pages         (role: mentor)
├── /mentor              → MentorDashboard.jsx (dashboard view)
├── /mentor/students     → MentorDashboard.jsx (students view)
├── /mentor/documents    → MentorDashboard.jsx (documents view)
├── /mentor/reviews      → MentorDashboard.jsx (reviews view)
└── /mentor/evaluations  → MentorDashboard.jsx (evaluations view)

/admin (Layout)          → Admin pages          (role: admin)
├── /admin               → AdminDashboard.jsx  (dashboard view)
├── /admin/students      → AdminDashboard.jsx  (students view)
├── /admin/mentors       → AdminDashboard.jsx  (mentors view)
├── /admin/documents     → AdminDashboard.jsx  (documents view)
├── /admin/reports       → AdminDashboard.jsx  (reports view)
└── /admin/settings      → AdminDashboard.jsx  (settings view)
```

### Component Tree

```
<BrowserRouter>
  <AuthProvider>
    <Routes>
      ├── <PublicRoute> → Login, Register
      ├── <ProtectedRoute> → Preloader
      └── <ProtectedRoute>
            <Layout>                          ← Sidebar + TopBar + Outlet
              ├── Sidebar                     ← Role-based navigation
              ├── TopBar                      ← Search (Ctrl+K), Notifications, Profile
              └── <Outlet>                    ← Page component rendered here
                  ├── StudentDashboard
                  ├── WeeklyReports           ← Uses createPortal for modals
                  ├── Documents               ← Uses createPortal for modals
                  ├── Grades
                  ├── Timeline
                  ├── Downloads
                  ├── MentorDashboard         ← URL-based section switching
                  └── AdminDashboard          ← URL-based section switching
            </Layout>
    </Routes>
    <ToastContainer />
  </AuthProvider>
</BrowserRouter>
```

### Authentication Flow

```
┌────────────┐   email/password    ┌──────────────┐   JWT token    ┌──────────────┐
│  Login.jsx │ ──────────────────→ │ POST /login  │ ────────────→ │ localStorage │
└────────────┘                     └──────────────┘               └──────┬───────┘
                                                                         │
                                                                         ▼
┌────────────┐   Bearer token      ┌──────────────┐   user object  ┌──────────────┐
│ AuthContext│ ──────────────────→ │ GET /api/me  │ ────────────→ │  AuthContext  │
│  (verify)  │                     └──────────────┘               │  user state   │
└────────────┘                                                     └──────┬───────┘
                                                                         │
                                   ┌──────────────┐                      │
                                   │ProtectedRoute│ ◄───────────────────┘
                                   │ role check   │
                                   └──────┬───────┘
                                          │
                    ┌─────────────────────┼─────────────────────┐
                    ▼                     ▼                     ▼
              /dashboard           /mentor              /admin
              (student)            (mentor)             (admin)
```

---

## Grading System Architecture

### Marks Distribution (Total: 100)

| Component                          | Max Marks | Evaluator           | Source                          |
| ---------------------------------- | --------- | ------------------- | ------------------------------- |
| Industry Mentor Final Evaluation   | 50        | Company Mentor      | `evaluations` (industry_final)  |
| Weekly Progress Reports            | 20        | Faculty Mentor      | Avg of `weekly_reports` scores  |
| Faculty Review Meetings            | 10        | Faculty Mentor      | `evaluations` (review_meetings) |
| Final Internship Report            | 10        | Faculty Mentor      | `evaluations` (final_report)    |
| Presentation & Viva Voce           | 10        | Faculty Mentor      | `evaluations` (presentation_viva)|

### Credit Mapping

| Total Marks | Credits Earned |
| ----------- | -------------- |
| 90 – 100    | 8              |
| 80 – 89     | 7              |
| 70 – 79     | 6              |
| 60 – 69     | 5              |
| 50 – 59     | 4              |
| Below 50    | 0 (re-internship) |

### Weekly Report Scoring Rubric (5 × 4 = 20 marks per report)

| Rubric                       | Max Score |
| ---------------------------- | --------- |
| Consistency of Submission    | 4         |
| Clarity of Work Description  | 4         |
| Technical Content Quality    | 4         |
| Learning Outcomes Reflection | 4         |
| Planning & Progress Tracking | 4         |

---

## Security Architecture

| Layer              | Implementation                                        |
| ------------------ | ----------------------------------------------------- |
| Password Storage   | Bcrypt hashing via passlib                             |
| Token Format       | JWT (HS256), 7-day expiry                              |
| Token Transport    | `Authorization: Bearer <token>` header                 |
| Token Storage      | Browser localStorage                                   |
| Route Protection   | `require_roles()` dependency in FastAPI                |
| Frontend Guards    | `<ProtectedRoute>` component checks role               |
| File Validation    | Extension whitelist + 10 MB size limit                 |
| CORS               | Allowed origin: `http://localhost:5173`                |
| Unique Constraints | `users.email` (unique), `users.prn` (unique, sparse)  |
| Report Uniqueness  | Composite index on `(student, weekNumber)`             |
