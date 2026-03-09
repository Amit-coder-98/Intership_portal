import { FiCalendar, FiCheck, FiClock, FiAlertCircle, FiAlertTriangle, FiInfo } from 'react-icons/fi';

const timelineEvents = [
    { date: '15 Jan', label: 'Internship Start', description: 'Submit offer letter, proposal and undertaking. Begin work at the company.', status: 'completed' },
    { date: 'Every Sat', label: 'Weekly Progress Reports', description: 'Submit weekly report with tasks, learnings, and next-week plan. Worth 20 marks.', status: 'active' },
    { date: 'Fortnightly Sat', label: 'Faculty Review Meetings', description: 'Attend fortnightly reviews with faculty. Come prepared with demos/screenshots. Worth 10 marks.', status: 'active' },
    { date: 'Mid-March', label: 'Mid-Term Mentor Evaluation', description: 'Industry mentor completes mid-term evaluation. The 20-mark rubric covers technical competency, quality, and teamwork.', status: 'upcoming' },
    { date: '2nd last week May', label: 'Final Submission', description: 'Submit final report, completion certificate, and presentation slides by the deadline.', status: 'upcoming' },
    { date: 'Last week May', label: 'Final Presentations & Viva', description: 'Present your internship work. Evaluated on Technical Understanding (5) and Communication (5). Worth 10 marks.', status: 'upcoming' },
    { date: 'Within 1 week', label: 'Marks Finalisation', description: 'Coordinator consolidates all marks (Industry 50 + Faculty 50 = 100) and maps to credits (max 8).', status: 'upcoming' },
];

export default function Timeline() {
    return (
        <div>
            <div style={{ marginBottom: 24 }}>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Internship Timeline</h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 4 }}>
                    MCA Sem IV — Duration: January 15 to May 31, 2026 — Total: 8 Credits (100 Marks)
                </p>
            </div>

            <div className="card">
                <div className="timeline" style={{ paddingLeft: 40 }}>
                    {timelineEvents.map((event, i) => (
                        <div key={i} className={`timeline-item ${event.status}`}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                                <div style={{
                                    minWidth: 80,
                                    padding: '4px 10px',
                                    background: event.status === 'completed' ? 'var(--success-light)' : event.status === 'active' ? 'rgba(178,13,53,0.08)' : 'var(--accent-light)',
                                    borderRadius: 'var(--radius-sm)',
                                    fontSize: '0.72rem',
                                    fontWeight: 700,
                                    color: event.status === 'completed' ? 'var(--success)' : event.status === 'active' ? 'var(--primary)' : 'var(--text-muted)',
                                    textAlign: 'center'
                                }}>
                                    {event.date}
                                </div>
                                <div>
                                    <h4 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        {event.label}
                                        {event.status === 'completed' && <FiCheck style={{ color: 'var(--success)', fontSize: '0.9rem' }} />}
                                        {event.status === 'active' && <span className="notification-dot"></span>}
                                    </h4>
                                    <p style={{ maxWidth: 500 }}>{event.description}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Key Rules */}
            <div className="grid-2" style={{ marginTop: 20 }}>
                <div className="card">
                    <div className="card-header">
                        <h2><FiAlertTriangle style={{ marginRight: 8, verticalAlign: 'middle', color: 'var(--warning)' }} /> Attendance Rules</h2>
                    </div>
                    <ul style={{ listStyle: 'none', padding: 0 }}>
                        <li style={{ padding: '10px 0', borderBottom: '1px solid var(--accent-light)', fontSize: '0.85rem' }}>
                            <strong>Minimum &ge; 85%</strong> of agreed internship days/hours required
                        </li>
                        <li style={{ padding: '10px 0', borderBottom: '1px solid var(--accent-light)', fontSize: '0.85rem' }}>
                            Attendance verified by industry mentor and cross-checked by coordinator
                        </li>
                        <li style={{ padding: '10px 0', borderBottom: '1px solid var(--accent-light)', fontSize: '0.85rem' }}>
                            Attendance &lt; 75% → <strong>ineligible for credit</strong> even if marks qualify
                        </li>
                        <li style={{ padding: '10px 0', fontSize: '0.85rem' }}>
                            Professional conduct required; misconduct → termination of credit
                        </li>
                    </ul>
                </div>

                <div className="card">
                    <div className="card-header">
                        <h2><FiInfo style={{ marginRight: 8, verticalAlign: 'middle', color: 'var(--info)' }} /> Important Notes</h2>
                    </div>
                    <ul style={{ listStyle: 'none', padding: 0 }}>
                        <li style={{ padding: '10px 0', borderBottom: '1px solid var(--accent-light)', fontSize: '0.85rem' }}>
                            Final report must be <strong>original</strong>. Plagiarism → disqualification
                        </li>
                        <li style={{ padding: '10px 0', borderBottom: '1px solid var(--accent-light)', fontSize: '0.85rem' }}>
                            Late submissions only with <strong>documented permission</strong>
                        </li>
                        <li style={{ padding: '10px 0', borderBottom: '1px solid var(--accent-light)', fontSize: '0.85rem' }}>
                            All documents uploaded to assigned drive by deadlines
                        </li>
                        <li style={{ padding: '10px 0', fontSize: '0.85rem' }}>
                            Mentor evaluations must be on <strong>company letterhead</strong>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
