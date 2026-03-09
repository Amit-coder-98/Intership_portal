import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import {
    FiCalendar, FiFileText, FiClock, FiCheckCircle, FiUpload,
    FiDownload, FiArrowRight, FiAlertCircle, FiAward, FiUsers,
    FiTrendingUp, FiBookOpen, FiBriefcase, FiClipboard, FiEdit3,
    FiBook, FiLayout, FiStar
} from 'react-icons/fi';

// Icon map for download items — replaces emojis with React Icons
const dlIconMap = {
    'proposal': FiFileText,
    'undertaking': FiClipboard,
    'logbook': FiBookOpen,
    'weekly': FiEdit3,
    'final': FiLayout,
    'handbook': FiBook
};

export default function StudentDashboard() {
    const { user, token } = useAuth();
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const res = await fetch('/api/student/dashboard', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const json = await res.json();
                    const d = json.data;
                    const s = d.stats;

                    // Calculate deadline info
                    const now = new Date();
                    let nextDeadline = '';
                    let nextDeadlineDate = null;
                    const internshipStart = new Date('2026-01-15');

                    if (now < internshipStart) {
                        nextDeadline = 'Registration Deadline';
                        nextDeadlineDate = internshipStart;
                    } else if (now < new Date('2026-03-15')) {
                        nextDeadline = 'Mid-Term Evaluation';
                        nextDeadlineDate = new Date('2026-03-15');
                    } else if (now < new Date('2026-05-24')) {
                        nextDeadline = 'Final Submission';
                        nextDeadlineDate = new Date('2026-05-24');
                    } else {
                        nextDeadline = 'Final Viva';
                        nextDeadlineDate = new Date('2026-05-31');
                    }
                    const daysToDeadline = nextDeadlineDate ? Math.max(0, Math.ceil((nextDeadlineDate - now) / (1000 * 60 * 60 * 24))) : 0;

                    setDashboardData({
                        stats: {
                            daysCompleted: s.daysCompleted,
                            totalDays: s.totalDays,
                            attendancePercentage: s.attendancePercentage,
                            reportsSubmitted: s.reportsSubmitted,
                            approvedReports: s.approvedReports || 0,
                            totalReportsRequired: s.totalReportsRequired,
                            currentWeek: s.currentWeek,
                            nextDeadline,
                            daysToDeadline
                        },
                        currentStage: d.currentStage,
                        documents: d.documents || [],
                        reports: d.reports || [],
                        student: d.student || {},
                    });
                }
            } catch { /* backend unreachable — show fallback */ }
            setLoading(false);
        })();
    }, []);

    if (loading || !dashboardData) {
        return <div className="loader"><div className="spinner"></div></div>;
    }

    const { stats, currentStage, documents, reports, student } = dashboardData;

    const getStatusBadgeClass = () => {
        switch (user?.internshipStatus) {
            case 'not_registered': return 'not-registered';
            case 'registered': return 'registered';
            case 'internship_started': return 'internship-started';
            case 'mid_term': return 'mid-term';
            case 'completed': return 'completed';
            default: return 'not-registered';
        }
    };

    const getStatusLabel = () => {
        switch (user?.internshipStatus) {
            case 'not_registered': return 'Not Registered';
            case 'registered': return 'Registered';
            case 'internship_started': return 'Internship Started';
            case 'mid_term': return 'Mid-Term';
            case 'completed': return 'Completed';
            default: return 'Not Registered';
        }
    };

    return (
        <div>
            {/* Profile Summary Header */}
            <div className="card" style={{ marginBottom: 24, background: 'linear-gradient(135deg, #fff 0%, #fdf2f5 100%)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div style={{
                            width: 56, height: 56, borderRadius: 'var(--radius-lg)',
                            background: 'var(--primary-gradient)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: '#fff', fontSize: '1.4rem', fontWeight: 800
                        }}>
                            {user?.name?.charAt(0) || 'S'}
                        </div>
                        <div>
                            <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: 2 }}>{user?.name || 'Student'}</h2>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                PRN: <strong>{user?.prn || 'N/A'}</strong> &nbsp;&bull;&nbsp;
                                {user?.class || 'MCA'} &nbsp;&bull;&nbsp;
                                Semester {user?.semester || 'IV'}
                            </p>
                            {user?.companyName && (
                                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <FiBriefcase size={14} style={{ color: 'var(--primary)' }} />
                                    <strong>{user.companyName}</strong>
                                </p>
                            )}
                        </div>
                    </div>
                    <span className={`status-badge ${getStatusBadgeClass()}`}>
                        {getStatusLabel()}
                    </span>
                </div>

                {(student?.companyMentor || student?.facultyMentor) && (
                    <div style={{
                        display: 'flex', gap: 24, marginTop: 16, paddingTop: 16,
                        borderTop: '1px solid var(--accent)', flexWrap: 'wrap'
                    }}>
                        {student?.companyMentor && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                                <FiUsers style={{ color: 'var(--primary)' }} />
                                <span>Company Mentor: <strong>{student.companyMentor.name}</strong></span>
                            </div>
                        )}
                        {student?.facultyMentor && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                                <FiBookOpen style={{ color: 'var(--info)' }} />
                                <span>Faculty Mentor: <strong>{student.facultyMentor.name}</strong></span>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Key Statistics Widgets */}
            <div className="stats-grid">
                <div className="stat-card animate-fade-in-up">
                    <div className="stat-icon red"><FiCalendar /></div>
                    <div className="stat-info">
                        <h3>{stats.daysCompleted}</h3>
                        <p>Days Completed</p>
                        <div className="progress-bar-container">
                            <div className="progress-bar-fill" style={{ width: `${stats.attendancePercentage}%` }}></div>
                        </div>
                        <span className="stat-detail">of {stats.totalDays} days (Min 85% required)</span>
                    </div>
                </div>

                <div className="stat-card animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                    <div className="stat-icon blue"><FiFileText /></div>
                    <div className="stat-info">
                        <h3>{stats.reportsSubmitted} / {stats.totalReportsRequired}</h3>
                        <p>Weekly Reports</p>
                        <div className="progress-bar-container">
                            <div className="progress-bar-fill" style={{
                                width: `${(stats.reportsSubmitted / stats.totalReportsRequired) * 100}%`,
                                background: 'linear-gradient(135deg, #008C99 0%, #00b3c3 100%)'
                            }}></div>
                        </div>
                        <span className="stat-detail">Worth 20 marks total</span>
                    </div>
                </div>

                <div className="stat-card animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                    <div className="stat-icon yellow"><FiClock /></div>
                    <div className="stat-info">
                        <h3>{stats.daysToDeadline}</h3>
                        <p>Days to Next Deadline</p>
                        <span className="stat-detail" style={{ color: stats.daysToDeadline < 7 ? 'var(--danger)' : 'var(--warning)' }}>
                            <FiAlertCircle size={12} /> {stats.nextDeadline}
                        </span>
                    </div>
                </div>

                <div className="stat-card animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                    <div className="stat-icon green"><FiTrendingUp /></div>
                    <div className="stat-info">
                        <h3>Week {stats.currentWeek}</h3>
                        <p>Current Week</p>
                        <span className="stat-detail positive">
                            <FiCheckCircle size={12} /> On Track
                        </span>
                    </div>
                </div>
            </div>

            {/* Current Stage Action Cards */}
            <div className="stage-section">
                <div className="stage-title">
                    <FiCheckCircle /> Current Actions
                    <span className="stage-badge">
                        {currentStage === 'registration' ? 'Stage 1: Registration' :
                            currentStage === 'during_internship' ? 'Stage 2: Internship' : 'Stage 3: Conclusion'}
                    </span>
                </div>

                <div className="action-cards-grid">
                    {currentStage === 'registration' && (
                        <>
                            <div className="action-card animate-fade-in-up">
                                <div className="action-card-icon"><FiUpload /></div>
                                <h3>Upload Mandatory Documents</h3>
                                <p>Submit your Offer Letter, Internship Proposal, and Undertaking Form before January 15.</p>
                                <Link to="/documents" className="action-btn">
                                    Upload Now <FiArrowRight />
                                </Link>
                            </div>
                            <div className="action-card animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                                <div className="action-card-icon"><FiFileText /></div>
                                <h3>Complete Registration</h3>
                                <p>Fill in your company details and get your documents approved by the coordinator.</p>
                                <Link to="/documents" className="action-btn">
                                    Get Started <FiArrowRight />
                                </Link>
                            </div>
                        </>
                    )}

                    {currentStage === 'during_internship' && (
                        <>
                            <div className="action-card animate-fade-in-up">
                                <div className="action-card-icon"><FiFileText /></div>
                                <h3>Submit Weekly Report</h3>
                                <p>Document your Tasks Performed, Key Learnings, and Plan for Next Week. Due every Saturday.</p>
                                <Link to="/weekly-reports" className="action-btn">
                                    Submit Report <FiArrowRight />
                                </Link>
                            </div>
                            <div className="action-card animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                                <div className="action-card-icon"><FiCalendar /></div>
                                <h3>Review Meeting Schedule</h3>
                                <p>Fortnightly faculty review meetings are held every 2nd Saturday. Come prepared with demos.</p>
                                <Link to="/timeline" className="action-btn">
                                    View Schedule <FiArrowRight />
                                </Link>
                            </div>
                            <div className="action-card animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                                <div className="action-card-icon"><FiBookOpen /></div>
                                <h3>Update Daily Logbook</h3>
                                <p>Maintain your daily logbook with activities, hours worked, and supervisor feedback.</p>
                                <Link to="/daily-logbook" className="action-btn">
                                    Open Logbook <FiArrowRight />
                                </Link>
                            </div>
                        </>
                    )}

                    {currentStage === 'conclusion' && (
                        <>
                            <div className="action-card animate-fade-in-up">
                                <div className="action-card-icon"><FiUpload /></div>
                                <h3>Upload Final Report</h3>
                                <p>Submit your final internship report in PDF/Word format following the guidelines template.</p>
                                <Link to="/documents" className="action-btn">
                                    Upload Report <FiArrowRight />
                                </Link>
                            </div>
                            <div className="action-card animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                                <div className="action-card-icon"><FiAward /></div>
                                <h3>Upload Completion Certificate</h3>
                                <p>Get your completion certificate from the company on official letterhead and upload it.</p>
                                <Link to="/documents" className="action-btn">
                                    Upload Certificate <FiArrowRight />
                                </Link>
                            </div>
                            <div className="action-card animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                                <div className="action-card-icon"><FiFileText /></div>
                                <h3>Mentor Evaluation Forms</h3>
                                <p>Ensure your industry mentor completes the final evaluation form (30 marks rubric).</p>
                                <Link to="/documents" className="action-btn">
                                    Upload Form <FiArrowRight />
                                </Link>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Two Column Layout */}
            <div className="grid-2">
                {/* Internship Checklist */}
                <div className="card">
                    <div className="card-header">
                        <h2><FiCheckCircle style={{ marginRight: 8, verticalAlign: 'middle', color: 'var(--primary)' }} /> Checklist</h2>
                    </div>
                    <ul className="checklist">
                        {[
                            { label: 'Registration form submitted', done: user?.internshipStatus !== 'not_registered' },
                            { label: 'Offer letter uploaded', done: documents.some(d => d.documentType === 'offer_letter') },
                            { label: 'Internship proposal approved', done: documents.some(d => d.documentType === 'internship_proposal' && d.status === 'approved') },
                            { label: 'Week 1 report submitted', done: reports.some(r => r.weekNumber === 1) },
                            { label: 'Mid-term evaluation completed', done: user?.internshipStatus === 'mid_term' || user?.internshipStatus === 'completed' },
                            { label: 'All weekly reports uploaded', done: stats.reportsSubmitted >= 20 },
                            { label: 'Final report uploaded', done: documents.some(d => d.documentType === 'final_report') },
                            { label: 'Completion certificate uploaded', done: documents.some(d => d.documentType === 'completion_certificate') },
                            { label: 'Presentation delivered', done: documents.some(d => d.documentType === 'presentation_slides') },
                        ].map((item, i) => (
                            <li key={i} className="checklist-item">
                                <span className={`checklist-check ${item.done ? 'done' : 'pending'}`}>
                                    {item.done ? <FiCheckCircle size={14} /> : ''}
                                </span>
                                <span style={{ color: item.done ? 'var(--text-muted)' : 'var(--text-primary)', textDecoration: item.done ? 'line-through' : 'none' }}>
                                    {item.label}
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Assessment Breakdown */}
                <div className="card">
                    <div className="card-header">
                        <h2><FiAward style={{ marginRight: 8, verticalAlign: 'middle', color: 'var(--primary)' }} /> Assessment (100 Marks = 8 Credits)</h2>
                    </div>

                    <div style={{ marginBottom: 20 }}>
                        <h4 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 12 }}>
                            Industry Mentor — 50 Marks
                        </h4>
                        <AssessmentBar label="Final Evaluation" marks={50} maxMarks={50} color="#9E1B32" />
                    </div>

                    <div>
                        <h4 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 12 }}>
                            Faculty Coordinator — 50 Marks
                        </h4>
                        <AssessmentBar label="Weekly Reports" marks={20} maxMarks={20} color="#008C99" />
                        <AssessmentBar label="Review Meetings" marks={10} maxMarks={10} color="#a156b4" />
                        <AssessmentBar label="Final Report" marks={10} maxMarks={10} color="#F37021" />
                        <AssessmentBar label="Presentation & Viva" marks={10} maxMarks={10} color="#00d084" />
                    </div>

                    <div style={{
                        marginTop: 20, padding: '14px 18px', background: 'var(--accent-light)', borderRadius: 'var(--radius-md)',
                        fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.7
                    }}>
                        <strong>Credit Mapping:</strong><br />
                        90–100 → 8 credits | 80–89 → 7 | 70–79 → 6 | 60–69 → 5 | 50–59 → 4 | &lt;50 → Incomplete
                    </div>
                </div>
            </div>

            {/* Downloads & Resources */}
            <div className="card" style={{ marginTop: 4 }}>
                <div className="card-header">
                    <h2><FiDownload style={{ marginRight: 8, verticalAlign: 'middle', color: 'var(--primary)' }} /> Downloads & Resources</h2>
                    <Link to="/downloads" className="btn btn-sm btn-secondary">View All</Link>
                </div>
                <div className="downloads-grid">
                    {[
                        { name: 'Internship Proposal Format', file: '1 Internship Proposal Format1.docx', iconKey: 'proposal' },
                        { name: 'Undertaking Form', file: '2 Student Internship Undetaking 2025-26.docx', iconKey: 'undertaking' },
                        { name: 'Daily Logbook Template', file: '3 Internship LogBook.docx', iconKey: 'logbook' },
                        { name: 'Weekly Report Format', file: '4 Internship_Weekly_Report_Format.docx', iconKey: 'weekly' },
                        { name: 'Final Report Guidelines', file: '5 Guidelines for project Report 2025-26.doc', iconKey: 'final' },
                        { name: 'Internship Handbook', file: 'MCA_Internship_Handbook.docx', iconKey: 'handbook' },
                    ].map((item, i) => {
                        const IconComp = dlIconMap[item.iconKey] || FiFileText;
                        return (
                            <div key={i} className="download-item" onClick={() => window.open(`/templates/${item.file}`, '_blank')}>
                                <div className="dl-icon"><IconComp size={20} /></div>
                                <div className="dl-info">
                                    <h4>{item.name}</h4>
                                    <span>.docx template</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

function AssessmentBar({ label, marks, maxMarks, color }) {
    return (
        <div style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: '0.8rem' }}>
                <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{label}</span>
                <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{marks} marks</span>
            </div>
            <div className="progress-bar-container">
                <div className="progress-bar-fill" style={{ width: '100%', background: color }}></div>
            </div>
        </div>
    );
}
