import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLocation } from 'react-router-dom';
import { FiUsers, FiFileText, FiCheckCircle, FiClock, FiAward, FiClipboard, FiBarChart2, FiStar, FiX, FiSend, FiChevronLeft, FiSearch, FiExternalLink, FiBookOpen } from 'react-icons/fi';
import { toast } from 'react-toastify';

export default function MentorDashboard() {
    const { token } = useAuth();
    const location = useLocation();
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [documents, setDocuments] = useState([]);
    const [docActionLoading, setDocActionLoading] = useState(null);
    const [reviewStudent, setReviewStudent] = useState(null);
    const [studentReports, setStudentReports] = useState([]);
    const [reportsLoading, setReportsLoading] = useState(false);
    const [selectedReport, setSelectedReport] = useState(null);
    const [reviewScores, setReviewScores] = useState({ consistency: 0, clarity: 0, technicalContent: 0, learningReflection: 0, planning: 0 });
    const [reviewFeedback, setReviewFeedback] = useState('');
    const [reviewLoading, setReviewLoading] = useState(false);
    const [gradeStudent, setGradeStudent] = useState(null);
    const [gradeType, setGradeType] = useState('industry_final');
    const [gradeRubrics, setGradeRubrics] = useState({});
    const [gradeComments, setGradeComments] = useState('');
    const [gradeLoading, setGradeLoading] = useState(false);
    const [existingEvals, setExistingEvals] = useState([]);

    const [studentDetail, setStudentDetail] = useState(null);
    const [studentDetailLoading, setStudentDetailLoading] = useState(false);

    const section = location.pathname.endsWith('/students') ? 'students' :
        location.pathname.endsWith('/documents') ? 'documents' :
        location.pathname.endsWith('/reviews') ? 'reviews' :
        location.pathname.endsWith('/evaluations') ? 'evaluations' : 'dashboard';

    useEffect(() => { setSearchQuery(''); }, [section]);

    useEffect(() => {
        (async () => {
            try {
                const [studRes, docsRes] = await Promise.all([
                    fetch('/api/mentor/students', { headers: { 'Authorization': `Bearer ${token}` } }),
                    fetch('/api/mentor/documents', { headers: { 'Authorization': `Bearer ${token}` } }),
                ]);
                if (studRes.ok) {
                    const json = await studRes.json();
                    setStudents(json.data || []);
                }
                if (docsRes.ok) {
                    const json = await docsRes.json();
                    setDocuments(json.data || []);
                }
            } catch { /* backend unreachable */ }
            setLoading(false);
        })();
    }, []);

    if (loading) {
        return <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}><div className="spinner"></div></div>;
    }

    const openReview = async (student) => {
        setReviewStudent(student);
        setSelectedReport(null);
        setReportsLoading(true);
        try {
            const res = await fetch(`/api/mentor/student/${student._id}/reports`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const json = await res.json();
                setStudentReports(json.data || []);
            }
        } catch { /* */ }
        setReportsLoading(false);
    };

    const handleReviewReport = async () => {
        if (!selectedReport) return;
        setReviewLoading(true);
        try {
            const res = await fetch(`/api/mentor/review-report/${selectedReport._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ scores: reviewScores, feedback: reviewFeedback, status: 'reviewed' })
            });
            if (res.ok) {
                const json = await res.json();
                setStudentReports(prev => prev.map(r => r._id === selectedReport._id ? json.data : r));
                setSelectedReport(null);
                setReviewScores({ consistency: 0, clarity: 0, technicalContent: 0, learningReflection: 0, planning: 0 });
                setReviewFeedback('');
            } else {
                const err = await res.json().catch(() => ({}));
                toast.error(err.detail || 'Review failed');
            }
        } catch { toast.error('Cannot connect to server'); }
        setReviewLoading(false);
    };

    const openGrade = async (student) => {
        setGradeStudent(student);
        setGradeRubrics({});
        setGradeComments('');
        setExistingEvals([]);
        setGradeType('industry_final');
        try {
            const res = await fetch(`/api/mentor/student/${student._id}/evaluations`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const json = await res.json();
                const evals = json.data || [];
                setExistingEvals(evals);
                const evalTypes = evals.map(e => e.evaluationType);
                const allTypes = ['industry_final', 'review_meetings', 'final_report', 'presentation_viva'];
                const firstAvailable = allTypes.find(t => !evalTypes.includes(t));
                setGradeType(firstAvailable || 'industry_final');
            }
        } catch { /* */ }
    };

    const handleSubmitGrade = async () => {
        if (!gradeStudent) return;
        setGradeLoading(true);
        try {
            const res = await fetch(`/api/mentor/evaluate/${gradeStudent._id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ evaluationType: gradeType, rubrics: gradeRubrics, comments: gradeComments })
            });
            if (res.ok) {
                const json = await res.json();
                setExistingEvals(prev => [...prev, json.data]);
                setGradeRubrics({});
                setGradeComments('');
                // Auto-select next available type
                const doneTypes = [...existingEvals.map(e => e.evaluationType), gradeType];
                const allTypes = ['industry_final', 'review_meetings', 'final_report', 'presentation_viva'];
                const nextAvailable = allTypes.find(t => !doneTypes.includes(t));
                if (nextAvailable) setGradeType(nextAvailable);
                toast.success('Evaluation submitted successfully');
            } else {
                const err = await res.json().catch(() => ({}));
                toast.error(err.detail || 'Evaluation failed');
            }
        } catch { toast.error('Cannot connect to server'); }
        setGradeLoading(false);
    };

    const rubricsByType = {
        industry_final: ['Technical Competency', 'Quality & Timeliness', 'Problem Solving & Initiative', 'Responsibility & Ownership', 'Teamwork & Professionalism'],
        review_meetings: ['Preparedness', 'Technical Discussion', 'Demo Quality', 'Progress', 'Communication'],
        final_report: ['Report Structure', 'Technical Depth', 'Originality', 'Presentation Quality', 'References'],
        presentation_viva: ['Technical Understanding', 'Communication Skills', 'Confidence', 'Q&A Handling', 'Time Management'],
    };
    const maxPerRubric = { industry_final: 6, review_meetings: 2, final_report: 2, presentation_viva: 2 };

    const filteredStudents = students.filter(s => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (s.name?.toLowerCase().includes(q) || s.prn?.toLowerCase().includes(q) || s.companyName?.toLowerCase().includes(q));
    });

    const handleDocAction = async (docId, action) => {
        setDocActionLoading(docId);
        try {
            const res = await fetch(`/api/admin/${action}-document/${docId}`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setDocuments(prev => prev.map(d => d._id === docId ? { ...d, ...data.data } : d));
            } else {
                const err = await res.json().catch(() => ({}));
                toast.error(err.detail || `Failed to ${action} document`);
            }
        } catch { toast.error('Cannot connect to server'); }
        setDocActionLoading(null);
    };

    const filteredDocuments = documents.filter(d => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (d.studentName?.toLowerCase().includes(q) || d.studentPrn?.toLowerCase().includes(q) || d.documentType?.toLowerCase().includes(q) || d.originalName?.toLowerCase().includes(q));
    });

    const openStudentDetail = async (studentId) => {
        setStudentDetailLoading(true);
        setStudentDetail(null);
        try {
            const res = await fetch(`/api/admin/student/${studentId}/detail`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const json = await res.json();
                setStudentDetail(json.data);
            }
        } catch { /* */ }
        setStudentDetailLoading(false);
    };

    const StudentTable = ({ showSearch }) => (
        <div className="card">
            <div className="card-header">
                <h2><FiUsers style={{ marginRight: 8, verticalAlign: 'middle' }} /> Assigned Students</h2>
            </div>
            {showSearch && (
                <div style={{ padding: '0 0 16px 0' }}>
                    <div style={{ position: 'relative' }}>
                        <FiSearch style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input type="text" className="form-control" placeholder="Search by name, PRN, or company..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ paddingLeft: 36 }} />
                    </div>
                </div>
            )}
            <div className="table-container">
                <table>
                    <thead><tr><th>PRN</th><th>Student Name</th><th>Company</th><th>Reports</th><th>Status</th><th>Actions</th></tr></thead>
                    <tbody>
                        {filteredStudents.length === 0 ? (
                            <tr><td colSpan={6} style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>
                                {searchQuery ? 'No students match your search' : 'No students assigned yet'}
                            </td></tr>
                        ) : filteredStudents.map(student => (
                            <tr key={student._id}>
                                <td><strong>{student.prn}</strong></td>
                                <td><span onClick={() => openStudentDetail(student._id)} style={{ color: 'var(--primary)', cursor: 'pointer', fontWeight: 500 }}>{student.name}</span></td>
                                <td>{student.companyName || <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                                <td><span style={{ fontWeight: 600 }}>{student.reportsSubmitted || 0}/20</span></td>
                                <td><span className={`status-badge ${student.internshipStatus.replace(/_/g, '-')}`}>{student.internshipStatus.replace(/_/g, ' ')}</span></td>
                                <td>
                                    <div style={{ display: 'flex', gap: 6 }}>
                                        <button className="btn btn-sm btn-secondary" onClick={() => openReview(student)}><FiClipboard /> Review</button>
                                        <button className="btn btn-sm btn-primary" onClick={() => openGrade(student)}><FiAward /> Grade</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    return (
        <div>
            {/* ═══════════ DASHBOARD OVERVIEW ═══════════ */}
            {section === 'dashboard' && (
                <>
                    <div style={{ marginBottom: 24 }}>
                        <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Mentor Dashboard</h2>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 4 }}>
                            Review student progress, grade weekly reports, and complete evaluations
                        </p>
                    </div>

                    <div className="stats-grid">
                        <div className="stat-card">
                            <div className="stat-icon red"><FiUsers /></div>
                            <div className="stat-info"><h3>{students.length}</h3><p>Assigned Students</p></div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon blue"><FiFileText /></div>
                            <div className="stat-info"><h3>{students.reduce((s, st) => s + (st.reportsSubmitted || 0), 0)}</h3><p>Total Reports</p></div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon yellow"><FiClock /></div>
                            <div className="stat-info"><h3>{students.length}</h3><p>Pending Evaluations</p></div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon green"><FiCheckCircle /></div>
                            <div className="stat-info"><h3>{students.filter(s => (s.reportsSubmitted || 0) >= 4).length}</h3><p>Students on Track</p></div>
                        </div>
                    </div>

                    <div className="grid-2" style={{ marginTop: 20 }}>
                        <div className="card">
                            <div className="card-header">
                                <h2><FiBarChart2 style={{ marginRight: 8, verticalAlign: 'middle', color: 'var(--info)' }} /> Weekly Report Rubric (20 marks)</h2>
                            </div>
                            <div style={{ fontSize: '0.82rem' }}>
                                {['Consistency of Submission', 'Clarity of Work Description', 'Technical Content Quality', 'Learning Outcomes Reflection', 'Planning & Progress Tracking'].map((c, i) => (
                                    <div key={i} style={{ padding: '8px 0', borderBottom: '1px solid var(--accent-light)' }}>
                                        <span style={{ fontWeight: 600 }}>{i + 1}. {c}</span>
                                        <span style={{ float: 'right', color: 'var(--text-muted)' }}>Max: 4</span>
                                    </div>
                                ))}
                                <div style={{ padding: '8px 0', fontWeight: 700, color: 'var(--primary)' }}>Total: 20 marks</div>
                            </div>
                        </div>
                        <div className="card">
                            <div className="card-header">
                                <h2><FiStar style={{ marginRight: 8, verticalAlign: 'middle', color: 'var(--warning)' }} /> Industry Final Rubric (30 marks)</h2>
                            </div>
                            <div style={{ fontSize: '0.82rem' }}>
                                {['Technical Competency', 'Quality & Timeliness', 'Problem Solving & Initiative', 'Responsibility & Ownership', 'Teamwork & Professionalism'].map((c, i) => (
                                    <div key={i} style={{ padding: '8px 0', borderBottom: '1px solid var(--accent-light)' }}>
                                        <span style={{ fontWeight: 600 }}>{i + 1}. {c}</span>
                                        <span style={{ float: 'right', color: 'var(--text-muted)' }}>Max: 6</span>
                                    </div>
                                ))}
                                <div style={{ padding: '8px 0', fontWeight: 700, color: 'var(--primary)' }}>Total: 30 marks</div>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* ═══════════ STUDENTS SECTION ═══════════ */}
            {section === 'students' && (
                <>
                    <div style={{ marginBottom: 24 }}>
                        <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>My Students</h2>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 4 }}>
                            View and manage your assigned students
                        </p>
                    </div>
                    <StudentTable showSearch />
                </>
            )}

            {/* ═══════════ DOCUMENTS SECTION ═══════════ */}
            {section === 'documents' && (
                <>
                    <div style={{ marginBottom: 24 }}>
                        <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Student Documents</h2>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 4 }}>
                            Review and approve/reject document submissions from your assigned students
                        </p>
                    </div>

                    <div className="stats-grid">
                        <div className="stat-card">
                            <div className="stat-icon blue"><FiFileText /></div>
                            <div className="stat-info"><h3>{documents.length}</h3><p>Total Documents</p></div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon yellow"><FiClock /></div>
                            <div className="stat-info"><h3>{documents.filter(d => d.status === 'pending').length}</h3><p>Pending Review</p></div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon green"><FiCheckCircle /></div>
                            <div className="stat-info"><h3>{documents.filter(d => d.status === 'approved').length}</h3><p>Approved</p></div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon red"><FiX /></div>
                            <div className="stat-info"><h3>{documents.filter(d => d.status === 'rejected').length}</h3><p>Rejected</p></div>
                        </div>
                    </div>

                    <div className="card">
                        <div className="card-header">
                            <h2><FiFileText style={{ marginRight: 8, verticalAlign: 'middle' }} /> All Documents</h2>
                        </div>
                        <div style={{ padding: '0 0 16px 0' }}>
                            <div style={{ position: 'relative' }}>
                                <FiSearch style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                <input type="text" className="form-control" placeholder="Search by student name, PRN, or document type..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ paddingLeft: 36 }} />
                            </div>
                        </div>
                        <div className="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Student</th>
                                        <th>PRN</th>
                                        <th>Document Type</th>
                                        <th>File</th>
                                        <th>Upload Date</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredDocuments.length === 0 ? (
                                        <tr><td colSpan={7} style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>
                                            {searchQuery ? 'No documents match your search' : 'No documents uploaded yet'}
                                        </td></tr>
                                    ) : filteredDocuments.map(doc => (
                                        <tr key={doc._id}>
                                            <td><strong>{doc.studentName || '—'}</strong></td>
                                            <td>{doc.studentPrn || '—'}</td>
                                            <td style={{ textTransform: 'capitalize' }}>{(doc.documentType || '').replace(/_/g, ' ')}</td>
                                            <td>
                                                <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', textDecoration: 'none', fontSize: '0.85rem' }}>
                                                    {doc.fileName || 'View'}
                                                </a>
                                            </td>
                                            <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                                {doc.uploadDate ? new Date(doc.uploadDate).toLocaleDateString() : '—'}
                                            </td>
                                            <td>
                                                <span className={`status-badge ${doc.status === 'approved' ? 'completed' : doc.status === 'rejected' ? 'not-registered' : 'registered'}`}
                                                    style={doc.status === 'rejected' ? { background: '#fef2f2', color: '#b91c1c' } : {}}>
                                                    {doc.status || 'pending'}
                                                </span>
                                            </td>
                                            <td style={{ display: 'flex', gap: 6 }}>
                                                {doc.status === 'pending' ? (
                                                    <>
                                                        <button className="btn btn-sm" style={{ background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0', fontSize: '0.8rem' }}
                                                            onClick={() => handleDocAction(doc._id, 'approve')} disabled={docActionLoading === doc._id}>
                                                            <FiCheckCircle /> Approve
                                                        </button>
                                                        <button className="btn btn-sm" style={{ background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca', fontSize: '0.8rem' }}
                                                            onClick={() => handleDocAction(doc._id, 'reject')} disabled={docActionLoading === doc._id}>
                                                            <FiX /> Reject
                                                        </button>
                                                    </>
                                                ) : (
                                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Reviewed</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}

            {/* ═══════════ REVIEWS SECTION ═══════════ */}
            {section === 'reviews' && (
                <>
                    <div style={{ marginBottom: 24 }}>
                        <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Weekly Report Reviews</h2>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 4 }}>
                            Review and grade student weekly reports
                        </p>
                    </div>

                    <div className="stats-grid">
                        <div className="stat-card">
                            <div className="stat-icon blue"><FiFileText /></div>
                            <div className="stat-info"><h3>{students.reduce((s, st) => s + (st.reportsSubmitted || 0), 0)}</h3><p>Total Reports</p></div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon red"><FiUsers /></div>
                            <div className="stat-info"><h3>{students.length}</h3><p>Students to Review</p></div>
                        </div>
                    </div>

                    <StudentTable showSearch />
                </>
            )}

            {/* ═══════════ EVALUATIONS SECTION ═══════════ */}
            {section === 'evaluations' && (
                <>
                    <div style={{ marginBottom: 24 }}>
                        <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Evaluations</h2>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 4 }}>
                            Complete final evaluations for your assigned students
                        </p>
                    </div>

                    <div className="stats-grid">
                        <div className="stat-card">
                            <div className="stat-icon yellow"><FiAward /></div>
                            <div className="stat-info"><h3>{students.length}</h3><p>Pending Evaluations</p></div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon green"><FiCheckCircle /></div>
                            <div className="stat-info"><h3>{students.filter(s => s.internshipStatus === 'completed').length}</h3><p>Completed</p></div>
                        </div>
                    </div>

                    <StudentTable showSearch />
                </>
            )}

            {/* ═══════════ MODALS (shared across sections) ═══════════ */}

            {/* Review Reports Modal */}
            {reviewStudent && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => { setReviewStudent(null); setSelectedReport(null); }}>
                    <div style={{ background: '#fff', borderRadius: 'var(--radius-lg, 12px)', padding: '28px 32px', width: '100%', maxWidth: 650, maxHeight: '90vh', overflow: 'auto', position: 'relative' }} onClick={e => e.stopPropagation()}>
                        <button onClick={() => { setReviewStudent(null); setSelectedReport(null); }} style={{ position: 'absolute', top: 12, right: 12, background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: 'var(--text-muted)' }}><FiX /></button>

                        {!selectedReport ? (
                            <>
                                <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 4 }}>Review Reports — {reviewStudent.name}</h2>
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 20 }}>PRN: {reviewStudent.prn} • Click a report to review</p>

                                {reportsLoading ? (
                                    <div style={{ textAlign: 'center', padding: 32 }}><div className="spinner"></div></div>
                                ) : studentReports.length === 0 ? (
                                    <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 32 }}>No reports submitted yet</p>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                        {studentReports.map(r => (
                                            <div key={r._id} onClick={() => { setSelectedReport(r); setReviewScores(r.scores || { consistency: 0, clarity: 0, technicalContent: 0, learningReflection: 0, planning: 0 }); setReviewFeedback(r.feedback || ''); }} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', border: '1px solid var(--accent)', borderRadius: 8, cursor: 'pointer', transition: 'all 0.2s' }}>
                                                <div>
                                                    <strong style={{ fontSize: '0.9rem' }}>Week {r.weekNumber}</strong>
                                                    <span style={{ marginLeft: 12, fontSize: '0.8rem', color: 'var(--text-muted)' }}>{r.submittedAt ? new Date(r.submittedAt).toLocaleDateString() : ''}</span>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                    {r.totalScore > 0 && <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>{r.totalScore}/20</span>}
                                                    <span className={`status-badge ${r.status}`}>{r.status.replace('_', ' ')}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </>
                        ) : (
                            <>
                                <button onClick={() => setSelectedReport(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', fontWeight: 600, fontSize: '0.85rem', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 4 }}><FiChevronLeft /> Back to Reports</button>
                                <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 16 }}>Week {selectedReport.weekNumber} Report</h2>

                                <div style={{ background: 'var(--accent-light)', borderRadius: 8, padding: 14, marginBottom: 16, fontSize: '0.85rem', lineHeight: 1.6 }}>
                                    <strong>Tasks:</strong> {selectedReport.tasksPerformed}<br />
                                    <strong>Learnings:</strong> {selectedReport.keyLearnings}<br />
                                    <strong>Next Week:</strong> {selectedReport.planForNextWeek}
                                    {selectedReport.challengesFaced && <><br /><strong>Challenges:</strong> {selectedReport.challengesFaced}</>}
                                </div>

                                <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: 10 }}>Score (each 0–4, total 20)</h3>
                                {Object.entries({ consistency: 'Consistency', clarity: 'Clarity', technicalContent: 'Technical Content', learningReflection: 'Learning Reflection', planning: 'Planning' }).map(([key, label]) => (
                                    <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0' }}>
                                        <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>{label}</span>
                                        <div style={{ display: 'flex', gap: 4 }}>
                                            {[0, 1, 2, 3, 4].map(v => (
                                                <button key={v} onClick={() => setReviewScores({ ...reviewScores, [key]: v })} style={{ width: 32, height: 32, borderRadius: 6, border: reviewScores[key] === v ? '2px solid var(--primary)' : '1px solid var(--accent)', background: reviewScores[key] === v ? 'var(--primary)' : '#fff', color: reviewScores[key] === v ? '#fff' : 'var(--text)', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer' }}>{v}</button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                                <p style={{ textAlign: 'right', fontWeight: 700, fontSize: '0.9rem', marginTop: 8 }}>Total: {Object.values(reviewScores).reduce((a, b) => a + b, 0)} / 20</p>

                                <div style={{ marginTop: 12 }}>
                                    <label style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: 4, display: 'block' }}>Feedback</label>
                                    <textarea className="form-control" rows={3} value={reviewFeedback} onChange={e => setReviewFeedback(e.target.value)} placeholder="Optional feedback for the student..." />
                                </div>

                                <button className="btn btn-primary" style={{ width: '100%', marginTop: 14 }} onClick={handleReviewReport} disabled={reviewLoading}>
                                    <FiSend /> {reviewLoading ? 'Submitting...' : 'Submit Review'}
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Grade/Evaluate Modal */}
            {gradeStudent && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setGradeStudent(null)}>
                    <div style={{ background: '#fff', borderRadius: 'var(--radius-lg, 12px)', padding: '28px 32px', width: '100%', maxWidth: 520, maxHeight: '90vh', overflow: 'auto', position: 'relative' }} onClick={e => e.stopPropagation()}>
                        <button onClick={() => setGradeStudent(null)} style={{ position: 'absolute', top: 12, right: 12, background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: 'var(--text-muted)' }}><FiX /></button>
                        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 4 }}>Evaluate — {gradeStudent.name}</h2>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 20 }}>PRN: {gradeStudent.prn}</p>

                        <div style={{ marginBottom: 16 }}>
                            <label style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: 6, display: 'block' }}>Evaluation Type</label>
                            <select className="form-control" value={gradeType} onChange={e => { setGradeType(e.target.value); setGradeRubrics({}); }}>
                                {[
                                    { value: 'industry_final', label: 'Industry Final (30 marks)' },
                                    { value: 'review_meetings', label: 'Review Meetings (10 marks)' },
                                    { value: 'final_report', label: 'Final Report (10 marks)' },
                                    { value: 'presentation_viva', label: 'Presentation & Viva (10 marks)' },
                                ].map(opt => {
                                    const done = existingEvals.some(e => e.evaluationType === opt.value);
                                    return <option key={opt.value} value={opt.value} disabled={done}>{opt.label}{done ? ' ✓ Done' : ''}</option>;
                                })}
                            </select>
                        </div>

                        <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: 10 }}>Rubrics (max {maxPerRubric[gradeType]} each)</h3>
                        {(rubricsByType[gradeType] || []).map((label, i) => {
                            const key = label.replace(/[^a-zA-Z]/g, '').toLowerCase();
                            return (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--accent-light)' }}>
                                    <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>{label}</span>
                                    <input type="number" min={0} max={maxPerRubric[gradeType]} value={gradeRubrics[key] || 0} onChange={e => setGradeRubrics({ ...gradeRubrics, [key]: Math.min(maxPerRubric[gradeType], Math.max(0, parseInt(e.target.value) || 0)) })} style={{ width: 60, textAlign: 'center', padding: '4px 8px', border: '1px solid var(--accent)', borderRadius: 6, fontWeight: 600 }} />
                                </div>
                            );
                        })}
                        <p style={{ textAlign: 'right', fontWeight: 700, fontSize: '0.9rem', marginTop: 8 }}>
                            Total: {Object.values(gradeRubrics).reduce((a, b) => a + b, 0)} / {maxPerRubric[gradeType] * (rubricsByType[gradeType] || []).length}
                        </p>

                        <div style={{ marginTop: 12 }}>
                            <label style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: 4, display: 'block' }}>Comments</label>
                            <textarea className="form-control" rows={3} value={gradeComments} onChange={e => setGradeComments(e.target.value)} placeholder="Optional comments..." />
                        </div>

                        {existingEvals.length === 4 ? (
                            <div style={{ textAlign: 'center', padding: '16px 0', color: 'var(--primary)', fontWeight: 600, fontSize: '0.9rem' }}>
                                <FiCheckCircle style={{ marginRight: 6 }} /> All evaluation types completed for this student
                            </div>
                        ) : (
                            <button className="btn btn-primary" style={{ width: '100%', marginTop: 14 }} onClick={handleSubmitGrade} disabled={gradeLoading || existingEvals.some(e => e.evaluationType === gradeType)}>
                                <FiAward /> {gradeLoading ? 'Submitting...' : 'Submit Evaluation'}
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Student Detail Modal */}
            {(studentDetail || studentDetailLoading) && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => { setStudentDetail(null); setStudentDetailLoading(false); }}>
                    <div style={{ background: '#fff', borderRadius: 'var(--radius-lg, 12px)', padding: '28px 32px', width: '100%', maxWidth: 700, maxHeight: '90vh', overflow: 'auto', position: 'relative' }} onClick={e => e.stopPropagation()}>
                        <button onClick={() => { setStudentDetail(null); setStudentDetailLoading(false); }} style={{ position: 'absolute', top: 12, right: 12, background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: 'var(--text-muted)' }}><FiX /></button>

                        {studentDetailLoading ? (
                            <div style={{ textAlign: 'center', padding: 48 }}><div className="spinner"></div></div>
                        ) : studentDetail && (
                            <>
                                {/* Header */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                                    <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 700 }}>
                                        {studentDetail.profile.name?.charAt(0)?.toUpperCase()}
                                    </div>
                                    <div>
                                        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>{studentDetail.profile.name}</h2>
                                        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>PRN: {studentDetail.profile.prn || 'N/A'} • {studentDetail.profile.email}</p>
                                    </div>
                                    <span className={`status-badge ${studentDetail.profile.internshipStatus?.replace(/_/g, '-')}`} style={{ marginLeft: 'auto' }}>
                                        {studentDetail.profile.internshipStatus?.replace(/_/g, ' ')}
                                    </span>
                                </div>

                                {/* Profile Info */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 20px', padding: '14px 16px', background: 'var(--accent-light)', borderRadius: 8, marginBottom: 20, fontSize: '0.82rem' }}>
                                    <div><span style={{ color: 'var(--text-muted)' }}>Phone:</span> <strong>{studentDetail.profile.phone || '—'}</strong></div>
                                    <div><span style={{ color: 'var(--text-muted)' }}>Company:</span> <strong>{studentDetail.profile.companyName || '—'}</strong></div>
                                    <div><span style={{ color: 'var(--text-muted)' }}>Faculty Mentor:</span> <strong>{studentDetail.profile.facultyMentor?.name || '—'}</strong></div>
                                    <div><span style={{ color: 'var(--text-muted)' }}>Company Mentor:</span> <strong>{studentDetail.profile.companyMentor?.name || '—'}</strong></div>
                                </div>

                                {/* Documents */}
                                <div style={{ marginBottom: 20 }}>
                                    <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}><FiFileText /> Documents ({studentDetail.documents.length})</h3>
                                    {studentDetail.documents.length === 0 ? (
                                        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', padding: '8px 0' }}>No documents uploaded</p>
                                    ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                            {studentDetail.documents.map(doc => (
                                                <div key={doc._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', border: '1px solid var(--accent)', borderRadius: 6, fontSize: '0.82rem' }}>
                                                    <div>
                                                        <strong style={{ textTransform: 'capitalize' }}>{(doc.documentType || '').replace(/_/g, ' ')}</strong>
                                                        <span style={{ marginLeft: 8, color: 'var(--text-muted)' }}>{doc.uploadDate ? new Date(doc.uploadDate).toLocaleDateString() : ''}</span>
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                        <span className={`status-badge ${doc.status === 'approved' ? 'completed' : doc.status === 'rejected' ? 'not-registered' : 'registered'}`}
                                                            style={doc.status === 'rejected' ? { background: '#fef2f2', color: '#b91c1c' } : { fontSize: '0.75rem' }}>
                                                            {doc.status}
                                                        </span>
                                                        {doc.fileUrl && <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)' }}><FiExternalLink /></a>}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Weekly Reports */}
                                <div style={{ marginBottom: 20 }}>
                                    <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}><FiBarChart2 /> Weekly Reports ({studentDetail.reports.length})</h3>
                                    {studentDetail.reports.length === 0 ? (
                                        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', padding: '8px 0' }}>No reports submitted</p>
                                    ) : (
                                        <div className="table-container" style={{ maxHeight: 220, overflow: 'auto' }}>
                                            <table style={{ fontSize: '0.8rem' }}>
                                                <thead><tr><th>Week</th><th>Submitted</th><th>Score</th><th>Status</th></tr></thead>
                                                <tbody>
                                                    {studentDetail.reports.map(r => (
                                                        <tr key={r._id}>
                                                            <td><strong>Week {r.weekNumber}</strong></td>
                                                            <td>{r.submittedAt ? new Date(r.submittedAt).toLocaleDateString() : '—'}</td>
                                                            <td style={{ fontWeight: 600 }}>{r.totalScore || 0}/20</td>
                                                            <td><span className={`status-badge ${r.status}`}>{r.status?.replace('_', ' ')}</span></td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>

                                {/* Daily Logbook */}
                                <div style={{ marginBottom: 20 }}>
                                    <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}><FiBookOpen /> Daily Logbook ({(studentDetail.logbook || []).length})</h3>
                                    {(!studentDetail.logbook || studentDetail.logbook.length === 0) ? (
                                        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', padding: '8px 0' }}>No logbook entries</p>
                                    ) : (
                                        <div className="table-container" style={{ maxHeight: 260, overflow: 'auto' }}>
                                            <table style={{ fontSize: '0.8rem' }}>
                                                <thead><tr><th>Date</th><th>Tasks Performed</th><th>Hours</th><th>Supervisor Remarks</th></tr></thead>
                                                <tbody>
                                                    {studentDetail.logbook.map(entry => (
                                                        <tr key={entry._id}>
                                                            <td style={{ whiteSpace: 'nowrap', fontWeight: 600 }}>{new Date(entry.date + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</td>
                                                            <td style={{ maxWidth: 280, whiteSpace: 'pre-line' }}>{entry.tasksPerformed}</td>
                                                            <td style={{ fontWeight: 600 }}>{entry.hoursWorked || 0}h</td>
                                                            <td style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>{entry.supervisorRemarks || '—'}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>

                                {/* Evaluations */}
                                <div>
                                    <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}><FiAward /> Evaluations ({studentDetail.evaluations.length})</h3>
                                    {studentDetail.evaluations.length === 0 ? (
                                        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', padding: '8px 0' }}>No evaluations yet</p>
                                    ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                            {studentDetail.evaluations.map(ev => (
                                                <div key={ev._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', border: '1px solid var(--accent)', borderRadius: 6, fontSize: '0.82rem' }}>
                                                    <div>
                                                        <strong style={{ textTransform: 'capitalize' }}>{(ev.evaluationType || '').replace(/_/g, ' ')}</strong>
                                                        <span style={{ marginLeft: 8, color: 'var(--text-muted)' }}>by {ev.evaluator?.name || 'Unknown'}</span>
                                                    </div>
                                                    <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{ev.totalMarks || 0} marks</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
