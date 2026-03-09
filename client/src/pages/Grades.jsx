import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { FiAward, FiTrendingUp } from 'react-icons/fi';

export default function Grades() {
    const { token } = useAuth();
    const [grades, setGrades] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const res = await fetch('/api/student/grades', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const json = await res.json();
                    setGrades(json.data);
                }
            } catch { /* backend unreachable */ }
            setLoading(false);
        })();
    }, []);

    if (loading) {
        return <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}><div className="spinner"></div></div>;
    }

    const g = grades || {
        industryFinal: { marks: 0, maxMarks: 50, completed: false },
        weeklyReports: { marks: 0, maxMarks: 20, completed: false },
        reviewMeetings: { marks: 0, maxMarks: 10, completed: false },
        finalReport: { marks: 0, maxMarks: 10, completed: false },
        presentationViva: { marks: 0, maxMarks: 10, completed: false },
        totalMarks: 0,
        credits: 0,
    };

    const totalMarks = g.totalMarks || 0;
    const credits = g.credits || 0;

    const gradeItems = [
        { label: 'Industry Mentor Final Evaluation', ...g.industryFinal, color: '#9E1B32', evaluator: 'Industry Mentor' },
        { label: 'Weekly Progress Reports', ...g.weeklyReports, color: '#008C99', evaluator: 'Faculty Coordinator' },
        { label: 'Faculty Review Meetings', ...g.reviewMeetings, color: '#a156b4', evaluator: 'Faculty Coordinator' },
        { label: 'Final Internship Report', ...g.finalReport, color: '#F37021', evaluator: 'Faculty Coordinator' },
        { label: 'Presentation & Viva', ...g.presentationViva, color: '#00d084', evaluator: 'Faculty Coordinator' },
    ];

    return (
        <div>
            <div style={{ marginBottom: 24 }}>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Grades & Credits</h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 4 }}>
                    Track your assessment scores across all evaluation components
                </p>
            </div>

            {/* Overall Score Card */}
            <div className="card" style={{
                background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)',
                color: 'white', marginBottom: 24, textAlign: 'center', padding: 40
            }}>
                <div style={{ fontSize: '3.5rem', fontWeight: 900, lineHeight: 1 }}>
                    {totalMarks} <span style={{ fontSize: '1.5rem', fontWeight: 400, opacity: 0.7 }}>/ 100</span>
                </div>
                <p style={{ fontSize: '1rem', opacity: 0.8, marginTop: 8 }}>Total Marks</p>

                <div style={{ display: 'flex', justifyContent: 'center', gap: 40, marginTop: 24 }}>
                    <div>
                        <div style={{ fontSize: '2rem', fontWeight: 800 }}>{credits}</div>
                        <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>Credits Earned</div>
                    </div>
                    <div style={{ width: 1, background: 'rgba(255,255,255,0.2)' }}></div>
                    <div>
                        <div style={{ fontSize: '2rem', fontWeight: 800 }}>8</div>
                        <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>Max Credits</div>
                    </div>
                </div>

                <p style={{ marginTop: 20, fontSize: '0.82rem', opacity: 0.6 }}>
                    Grades will be finalized within one week after viva
                </p>
            </div>

            {/* Individual Components */}
            <div className="card">
                <div className="card-header">
                    <h2><FiTrendingUp style={{ marginRight: 8, verticalAlign: 'middle' }} /> Assessment Breakdown</h2>
                </div>

                {gradeItems.map((item, i) => (
                    <div key={i} style={{
                        padding: '18px 0',
                        borderBottom: i < gradeItems.length - 1 ? '1px solid var(--accent-light)' : 'none'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                            <div>
                                <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{item.label}</span>
                                <span style={{
                                    marginLeft: 8, fontSize: '0.7rem',
                                    color: 'var(--text-muted)', fontWeight: 500
                                }}>
                                    ({item.evaluator})
                                </span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <span style={{ fontSize: '1.1rem', fontWeight: 800 }}>
                                    {item.marks} <span style={{ fontSize: '0.8rem', fontWeight: 400, color: 'var(--text-muted)' }}>/ {item.maxMarks}</span>
                                </span>
                                {item.completed ? (
                                    <span className="status-badge approved">Graded</span>
                                ) : (
                                    <span className="status-badge pending">Pending</span>
                                )}
                            </div>
                        </div>
                        <div className="progress-bar-container" style={{ height: 8 }}>
                            <div className="progress-bar-fill" style={{
                                width: item.maxMarks > 0 ? `${(item.marks / item.maxMarks) * 100}%` : '0%',
                                background: item.color
                            }}></div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Credit Mapping */}
            <div className="card" style={{ marginTop: 20 }}>
                <div className="card-header">
                    <h2><FiAward style={{ marginRight: 8, verticalAlign: 'middle' }} /> Credit Mapping</h2>
                </div>
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Marks Range</th>
                                <th>Credits Awarded</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {[
                                { range: '90 – 100', credits: 8, highlight: totalMarks >= 90 },
                                { range: '80 – 89', credits: 7, highlight: totalMarks >= 80 && totalMarks < 90 },
                                { range: '70 – 79', credits: 6, highlight: totalMarks >= 70 && totalMarks < 80 },
                                { range: '60 – 69', credits: 5, highlight: totalMarks >= 60 && totalMarks < 70 },
                                { range: '50 – 59', credits: 4, highlight: totalMarks >= 50 && totalMarks < 60 },
                                { range: '< 50', credits: 0, highlight: totalMarks < 50 && totalMarks > 0, label: 'Incomplete / Re-internship required' },
                            ].map((row, i) => (
                                <tr key={i} style={{ background: row.highlight ? 'rgba(158, 27, 50, 0.05)' : 'transparent' }}>
                                    <td style={{ fontWeight: row.highlight ? 700 : 400 }}>{row.range}</td>
                                    <td style={{ fontWeight: row.highlight ? 700 : 400 }}>
                                        <span style={{ color: row.highlight ? 'var(--primary)' : undefined }}>
                                            {row.credits} {row.credits > 0 ? 'credits' : ''}
                                        </span>
                                        {row.label && <span style={{ fontSize: '0.78rem', color: 'var(--danger)', marginLeft: 8 }}>{row.label}</span>}
                                    </td>
                                    <td>
                                        {row.highlight && <span className="status-badge internship-started">Your Range</span>}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
