# MIT VPU Internship Portal — Features List

## Authentication & User Management

- [x] Student self-registration with PRN, email, phone, password
- [x] Offer letter upload during registration (required)
- [x] JWT-based authentication (7-day token expiry)
- [x] Secure password hashing (Bcrypt)
- [x] Role-based access control (Student / Mentor / Admin)
- [x] Protected routes — role mismatch redirects to correct dashboard
- [x] Login with email + password (toggle password visibility)
- [x] Logout (clears session + localStorage)
- [x] Edit profile (name, phone, company name)
- [x] Animated preloader screen after login (~5 seconds)
- [x] Admin can create Mentor and Admin accounts
- [x] Admin can delete Mentor/Admin accounts (with mentor reference cleanup)

---

## Student Features

- [x] **Dashboard** — Profile card, internship stats, days completed, reports count, deadline countdown
- [x] **Current stage detection** — Automatically shows registration / during internship / conclusion based on date
- [x] **Mentor info display** — Shows assigned faculty mentor and company mentor names
- [x] **Weekly Report Submission** — Submit reports for weeks 1-20
  - [x] Fields: week number, date range, tasks, learnings, next week plan, challenges, hours worked
  - [x] Unique per student + week (can't submit duplicate weeks)
  - [x] Status tracking: submitted → reviewed → approved / revision needed
  - [x] Score display after mentor review (X/20)
  - [x] "Awaiting Review" indicator for unreviewed reports
- [x] **Document Upload** — 8 document types organized by internship stage
  - [x] Offer Letter, Proposal, Undertaking, Daily Logbook
  - [x] Completion Certificate, Final Report, Presentation Slides, Mentor Evaluation
  - [x] File validation: PDF/DOC/DOCX/PPTX/JPEG/JPG/PNG, max 10 MB
  - [x] Per-student file storage (uploads/{userId}/)
  - [x] Status tracking: pending → approved / rejected
  - [x] Reviewer info and review comments visible
- [x] **Grades & Credits** — View marks from 5 assessment components
  - [x] Industry Mentor Final Evaluation (50 marks)
  - [x] Weekly Progress Reports (20 marks, average of all report scores)
  - [x] Faculty Review Meetings (10 marks)
  - [x] Final Report (10 marks)
  - [x] Presentation & Viva (10 marks)
  - [x] Automatic credit mapping (50-100 marks → 4-8 credits)
  - [x] Progress bars and completion indicators
- [x] **Timeline** — 7 internship milestones with dates and descriptions
  - [x] Key rules: attendance ≥85%, plagiarism = disqualification, late submission policy
- [x] **Downloads** — 7 downloadable templates
  - [x] Proposal format, undertaking form, logbook, report format, guidelines, PPT template, handbook

---

## Mentor Features

- [x] **Dashboard overview** — Stats: assigned students, total reports, pending evaluations, on-track count
- [x] **Rubric guides** — Weekly report rubric (20 marks) and Industry final rubric (30 marks) displayed on dashboard
- [x] **Assigned Students List** — Table with PRN, name, company, reports submitted (X/20), status
  - [x] Search/filter by name, PRN, or company
  - [x] Real-time report count from database
- [x] **Student Detail Modal** — Click student name to view full profile, documents, reports, evaluations
- [x] **Weekly Report Review** — Select student → view submitted reports → score & review
  - [x] 5 scoring rubrics (0-4 each): consistency, clarity, technical content, learning reflection, planning
  - [x] Total score calculated automatically (max 20)
  - [x] Optional feedback text
  - [x] Status updated to "reviewed"
- [x] **Student Evaluation** — Grade students across 4 evaluation types
  - [x] Industry Final (5 rubrics × 6 pts = 30 marks)
  - [x] Review Meetings (5 rubrics × 2 pts = 10 marks)
  - [x] Final Report (5 rubrics × 2 pts = 10 marks)
  - [x] Presentation & Viva (5 rubrics × 2 pts = 10 marks)
  - [x] Optional comments field
- [x] **Document Review** — View all documents from assigned students
  - [x] Approve or Reject pending documents
  - [x] View uploaded files in browser
  - [x] Document stats: total, pending, approved, rejected

---

## Admin Features

- [x] **Dashboard overview** — Stats: total students, registered, active, completed, total mentors, pending docs
- [x] **Key dates table** — Internship start, weekly reports, mid-term, final submission, viva dates
- [x] **Student Management**
  - [x] View all students with mentor assignments and status
  - [x] Search by name, PRN, company
  - [x] Update internship status (not_registered → registered → started → mid_term → completed)
  - [x] Assign faculty mentor and company mentor via dropdown
  - [x] Student detail modal (profile + docs + reports + evaluations)
- [x] **Mentor Management**
  - [x] View all mentors with department, designation, assigned student count
  - [x] Create new mentor/admin accounts (name, email, password, role, department, mentorType)
  - [x] Delete mentor/admin accounts (auto-cleans references from students)
- [x] **Document Management**
  - [x] View all documents across all students
  - [x] Search by student, type, status
  - [x] Approve/Reject pending documents
  - [x] View file links
- [x] **Grade Overview** — View student marks breakdown (industry + weekly + meetings + report + viva = 100)

---

## UI / UX Features

- [x] **Responsive sidebar** — Collapsible, role-based navigation links
- [x] **Search overlay** — Ctrl+K keyboard shortcut, searches navigation links
- [x] **Notification dropdown** — Bell icon, role-aware notifications (pending docs, reviews, deadlines)
- [x] **Profile dropdown** — Avatar with user info, role badge, edit profile, logout
- [x] **Toast notifications** — Success/error messages via React Toastify
- [x] **Loading spinners** — Shown during data fetches
- [x] **Status badges** — Color-coded: registered, started, completed, pending, approved, rejected
- [x] **Modal dialogs** — Rendered via createPortal to avoid stacking context issues
- [x] **Animated page transitions** — Fade-in animation on page load
- [x] **Progress bars** — For days completed, reports submitted, grade components
- [x] **MIT VPU branding** — Logo on preloader, sidebar, and login page
- [x] **"Powered by Spanda"** — Footer branding on preloader

---

## Technical Features

- [x] **FastAPI backend** — Async Python with automatic OpenAPI docs (/docs)
- [x] **Motor async MongoDB driver** — Non-blocking database operations
- [x] **Pydantic validation** — Request body validation with detailed error messages
- [x] **Database indexes** — Unique email, unique PRN (sparse), unique student+weekNumber
- [x] **File upload handling** — UUID-based filenames, per-student directories
- [x] **Static file serving** — FastAPI mounts /uploads for direct file access
- [x] **Vite dev proxy** — /api and /uploads proxied to backend (no CORS issues in dev)
- [x] **React Router 7** — Nested routes with Layout wrapper
- [x] **Tailwind CSS** — Utility-first styling
- [x] **Framer Motion** — Animation library (available)
- [x] **React Context** — Global auth state management
- [x] **localStorage persistence** — Token + user survive page refresh

---

## Grading System

| Component                        | Max Marks | Evaluator        |
| -------------------------------- | --------- | ---------------- |
| Industry Mentor Final Evaluation | 50        | Company Mentor   |
| Weekly Progress Reports          | 20        | Faculty Mentor   |
| Faculty Review Meetings          | 10        | Faculty Mentor   |
| Final Internship Report          | 10        | Faculty Mentor   |
| Presentation & Viva Voce         | 10        | Faculty Mentor   |
| **Total**                        | **100**   |                  |

| Total Marks | Credits |
| ----------- | ------- |
| 90 – 100    | 8       |
| 80 – 89     | 7       |
| 70 – 79     | 6       |
| 60 – 69     | 5       |
| 50 – 59     | 4       |
| Below 50    | 0       |

---

## Security Features

- [x] Bcrypt password hashing (salted)
- [x] JWT authentication with expiry
- [x] Role-based route guards (backend + frontend)
- [x] File type whitelist validation
- [x] File size limit enforcement (10 MB)
- [x] CORS restriction to frontend origin
- [x] Unique email & PRN constraints (prevent duplicates)
- [x] Duplicate report prevention (student + week composite index)
- [x] Admin self-deletion prevention
