import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../context/AuthContext';
import { FiFileText, FiPlus, FiCheck, FiX, FiClock, FiSend } from 'react-icons/fi';
import { toast } from 'react-toastify';

export default function WeeklyReports() {
    const { user, token } = useAuth();
    const [reports, setReports] = useState([]);
    const [loadingReports, setLoadingReports] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [selectedReport, setSelectedReport] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        weekNumber: 1,
        weekStartDate: '',
        weekEndDate: '',
        tasksPerformed: '',
        keyLearnings: '',
        planForNextWeek: '',
        challengesFaced: '',
        hoursWorked: 40
    });

    useEffect(() => {
        fetchReports();
    }, []);

    const fetchReports = async () => {
        try {
            const res = await fetch('/api/student/weekly-reports', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                const fetched = data.data || [];
                setReports(fetched);
                setFormData(prev => ({ ...prev, weekNumber: fetched.length + 1 }));
            }
        } catch { /* backend unreachable */ }
        setLoadingReports(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const res = await fetch('/api/student/weekly-report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(formData)
            });
            if (res.ok) {
                const data = await res.json();
                setReports([...reports, data.data]);
                setShowForm(false);
                setFormData({
                    weekNumber: reports.length + 2,
                    weekStartDate: '',
                    weekEndDate: '',
                    tasksPerformed: '',
                    keyLearnings: '',
                    planForNextWeek: '',
                    challengesFaced: '',
                    hoursWorked: 40
                });
            } else {
                const err = await res.json().catch(() => ({}));
                toast.error(err.detail || 'Failed to submit report');
            }
        } catch {
            toast.error('Cannot connect to server.');
        }
        setSubmitting(false);
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'approved': return <FiCheck style={{ color: 'var(--success)' }} />;
            case 'reviewed': return <FiClock style={{ color: '#a156b4' }} />;
            case 'submitted': return <FiClock style={{ color: 'var(--info)' }} />;
            case 'revision_needed': return <FiX style={{ color: 'var(--danger)' }} />;
            default: return <FiClock />;
        }
    };

    return (
        <div>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div>
                    <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Weekly Progress Reports</h2>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 4 }}>
                        Submit every Saturday • {reports.length} / 20 submitted • Worth 20 marks
                    </p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowForm(true)}>
                    <FiPlus /> New Report
                </button>
            </div>

            {loadingReports ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
                    <div className="spinner"></div>
                </div>
            ) : (
            /* Report Cards */
            <div className="weekly-reports-table">
                {reports.map(report => (
                    <div
                        key={report._id}
                        className="report-row"
                        onClick={() => setSelectedReport(report)}
                        style={{ cursor: 'pointer' }}
                    >
                        <div className="report-week">{report.weekNumber}</div>
                        <div className="report-info" style={{ flex: 1 }}>
                            <h4>Week {report.weekNumber} Report</h4>
                            <span>Submitted: {report.submittedAt ? new Date(report.submittedAt).toLocaleDateString() : '-'}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            {report.totalScore > 0 ? (
                                <span style={{
                                    fontSize: '0.82rem', fontWeight: 700,
                                    color: report.totalScore >= 16 ? 'var(--success)' : report.totalScore >= 12 ? 'var(--warning)' : 'var(--danger)'
                                }}>
                                    {report.totalScore}/20
                                </span>
                            ) : report.status === 'submitted' ? (
                                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                    Awaiting Review
                                </span>
                            ) : null}
                            <span className={`status-badge ${report.status}`}>
                                {getStatusIcon(report.status)} {report.status.replace('_', ' ')}
                            </span>
                        </div>
                    </div>
                ))}

                {reports.length === 0 && (
                    <div className="empty-state">
                        <div className="empty-icon"><FiFileText /></div>
                        <h3>No Reports Yet</h3>
                        <p>Start submitting your weekly progress reports. They're due every Saturday.</p>
                    </div>
                )}
            </div>
            )}

            {/* Submit Form Modal */}
            {showForm && createPortal(
                <div className="modal-overlay" onClick={() => setShowForm(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 700 }}>
                        <div className="modal-header">
                            <h2>Submit Week {formData.weekNumber} Report</h2>
                            <button className="modal-close" onClick={() => setShowForm(false)}><FiX /></button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Week Start Date</label>
                                    <input type="date" className="form-control" value={formData.weekStartDate}
                                        onChange={(e) => setFormData({ ...formData, weekStartDate: e.target.value })} required />
                                </div>
                                <div className="form-group">
                                    <label>Week End Date</label>
                                    <input type="date" className="form-control" value={formData.weekEndDate}
                                        onChange={(e) => setFormData({ ...formData, weekEndDate: e.target.value })} required />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Tasks Performed *</label>
                                <textarea className="form-control" rows={4} placeholder="Describe the tasks you performed this week..."
                                    value={formData.tasksPerformed}
                                    onChange={(e) => setFormData({ ...formData, tasksPerformed: e.target.value })} required />
                            </div>

                            <div className="form-group">
                                <label>Key Learnings *</label>
                                <textarea className="form-control" rows={3} placeholder="What did you learn this week?"
                                    value={formData.keyLearnings}
                                    onChange={(e) => setFormData({ ...formData, keyLearnings: e.target.value })} required />
                            </div>

                            <div className="form-group">
                                <label>Plan for Next Week *</label>
                                <textarea className="form-control" rows={3} placeholder="What do you plan to work on next week?"
                                    value={formData.planForNextWeek}
                                    onChange={(e) => setFormData({ ...formData, planForNextWeek: e.target.value })} required />
                            </div>

                            <div className="form-group">
                                <label>Challenges Faced</label>
                                <textarea className="form-control" rows={2} placeholder="Any challenges or blockers?"
                                    value={formData.challengesFaced}
                                    onChange={(e) => setFormData({ ...formData, challengesFaced: e.target.value })} />
                            </div>

                            <div className="form-group">
                                <label>Hours Worked This Week</label>
                                <input type="number" className="form-control" min="0" max="60"
                                    value={formData.hoursWorked}
                                    onChange={(e) => setFormData({ ...formData, hoursWorked: parseInt(e.target.value) || 0 })} />
                            </div>

                            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={submitting}>
                                    <FiSend /> {submitting ? 'Submitting...' : 'Submit Report'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>,
            document.body)}

            {/* View Report Modal */}
            {selectedReport && createPortal(
                <div className="modal-overlay" onClick={() => setSelectedReport(null)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Week {selectedReport.weekNumber} Report</h2>
                            <button className="modal-close" onClick={() => setSelectedReport(null)}><FiX /></button>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                            <span className={`status-badge ${selectedReport.status}`}>
                                {selectedReport.status.replace('_', ' ')}
                            </span>
                            {selectedReport.totalScore > 0 ? (
                                <span style={{ fontSize: '0.88rem', fontWeight: 700 }}>Score: {selectedReport.totalScore}/20</span>
                            ) : selectedReport.status === 'submitted' ? (
                                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Score: Awaiting mentor review</span>
                            ) : null}
                            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Submitted: {selectedReport.submittedAt}</span>
                        </div>

                        <div className="form-group">
                            <label style={{ fontWeight: 700 }}>Tasks Performed</label>
                            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6, padding: '10px 14px', background: 'var(--accent-light)', borderRadius: 'var(--radius-sm)' }}>
                                {selectedReport.tasksPerformed}
                            </p>
                        </div>

                        <div className="form-group">
                            <label style={{ fontWeight: 700 }}>Key Learnings</label>
                            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6, padding: '10px 14px', background: 'var(--accent-light)', borderRadius: 'var(--radius-sm)' }}>
                                {selectedReport.keyLearnings}
                            </p>
                        </div>

                        <div className="form-group">
                            <label style={{ fontWeight: 700 }}>Plan for Next Week</label>
                            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6, padding: '10px 14px', background: 'var(--accent-light)', borderRadius: 'var(--radius-sm)' }}>
                                {selectedReport.planForNextWeek}
                            </p>
                        </div>
                    </div>
                </div>,
            document.body)}
        </div>
    );
}
