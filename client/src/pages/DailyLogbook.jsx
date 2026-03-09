import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
    FiBookOpen, FiPlus, FiEdit3, FiTrash2, FiClock, FiCheckCircle,
    FiCalendar, FiChevronLeft, FiChevronRight, FiSave, FiX
} from 'react-icons/fi';
import { toast } from 'react-toastify';

export default function DailyLogbook() {
    const { token } = useAuth();
    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [saving, setSaving] = useState(false);

    // Form state
    const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
    const [formTasks, setFormTasks] = useState('');
    const [formHours, setFormHours] = useState('');
    const [formRemarks, setFormRemarks] = useState('');

    // Month navigation
    const [viewMonth, setViewMonth] = useState(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    });

    useEffect(() => { fetchEntries(); }, []);

    const fetchEntries = async () => {
        try {
            const res = await fetch('/api/student/daily-logbook', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setEntries(data.data || []);
            }
        } catch { /* backend unreachable */ }
        setLoading(false);
    };

    const resetForm = () => {
        setFormDate(new Date().toISOString().split('T')[0]);
        setFormTasks('');
        setFormHours('');
        setFormRemarks('');
        setEditingId(null);
        setShowForm(false);
    };

    const openNewEntry = () => {
        resetForm();
        setShowForm(true);
    };

    const openEditEntry = (entry) => {
        setFormDate(entry.date);
        setFormTasks(entry.tasksPerformed);
        setFormHours(String(entry.hoursWorked || ''));
        setFormRemarks(entry.supervisorRemarks || '');
        setEditingId(entry._id);
        setShowForm(true);
    };

    const handleSave = async () => {
        if (!formTasks.trim()) {
            toast.error('Please enter tasks performed');
            return;
        }

        setSaving(true);
        try {
            const body = {
                date: formDate,
                tasksPerformed: formTasks.trim(),
                hoursWorked: parseFloat(formHours) || 0,
                supervisorRemarks: formRemarks.trim(),
            };

            let res;
            if (editingId) {
                res = await fetch(`/api/student/daily-logbook/${editingId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify(body),
                });
            } else {
                res = await fetch('/api/student/daily-logbook', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify(body),
                });
            }

            if (res.ok) {
                toast.success(editingId ? 'Entry updated!' : 'Entry saved!');
                resetForm();
                fetchEntries();
            } else {
                const err = await res.json().catch(() => ({}));
                toast.error(err.detail || 'Save failed');
            }
        } catch {
            toast.error('Cannot connect to server');
        }
        setSaving(false);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this logbook entry?')) return;
        try {
            const res = await fetch(`/api/student/daily-logbook/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (res.ok) {
                toast.success('Entry deleted');
                setEntries(entries.filter(e => e._id !== id));
            }
        } catch {
            toast.error('Failed to delete');
        }
    };

    // Month helpers
    const [viewYear, viewMon] = viewMonth.split('-').map(Number);
    const filteredEntries = entries.filter(e => {
        const [y, m] = e.date.split('-').map(Number);
        return y === viewYear && m === viewMon;
    });

    const prevMonth = () => {
        const d = new Date(viewYear, viewMon - 2, 1);
        setViewMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    };
    const nextMonth = () => {
        const d = new Date(viewYear, viewMon, 1);
        setViewMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    };

    const monthLabel = new Date(viewYear, viewMon - 1).toLocaleString('default', { month: 'long', year: 'numeric' });

    const totalHoursMonth = filteredEntries.reduce((s, e) => s + (e.hoursWorked || 0), 0);

    // Calendar grid
    const daysInMonth = new Date(viewYear, viewMon, 0).getDate();
    const entryMap = {};
    filteredEntries.forEach(e => {
        const day = parseInt(e.date.split('-')[2], 10);
        entryMap[day] = e;
    });

    const formatDateDisplay = (dateStr) => {
        const d = new Date(dateStr + 'T00:00:00');
        return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
    };

    if (loading) {
        return <div className="loader"><div className="spinner"></div></div>;
    }

    return (
        <div>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
                <div>
                    <h1 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
                        <FiBookOpen style={{ color: 'var(--primary)' }} /> Daily Logbook
                    </h1>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '4px 0 0' }}>
                        Record your daily internship activities, tasks, and hours worked.
                    </p>
                </div>
                <button className="btn btn-primary" onClick={openNewEntry} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <FiPlus /> New Entry
                </button>
            </div>

            {/* Stats Bar */}
            <div className="stats-grid" style={{ marginBottom: 24 }}>
                <div className="stat-card">
                    <div className="stat-icon red"><FiBookOpen /></div>
                    <div className="stat-info">
                        <h3>{entries.length}</h3>
                        <p>Total Entries</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon blue"><FiCalendar /></div>
                    <div className="stat-info">
                        <h3>{filteredEntries.length}</h3>
                        <p>This Month</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon green"><FiClock /></div>
                    <div className="stat-info">
                        <h3>{totalHoursMonth.toFixed(1)}h</h3>
                        <p>Hours This Month</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon purple"><FiCheckCircle /></div>
                    <div className="stat-info">
                        <h3>{entries.reduce((s, e) => s + (e.hoursWorked || 0), 0).toFixed(1)}h</h3>
                        <p>Total Hours Logged</p>
                    </div>
                </div>
            </div>

            {/* Month Navigation */}
            <div className="card" style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <button className="btn btn-secondary" onClick={prevMonth} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <FiChevronLeft /> Prev
                    </button>
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>{monthLabel}</h2>
                    <button className="btn btn-secondary" onClick={nextMonth} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        Next <FiChevronRight />
                    </button>
                </div>

                {/* Calendar dots */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 16 }}>
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                        <div key={d} style={{ textAlign: 'center', fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', padding: '4px 0' }}>{d}</div>
                    ))}
                    {Array.from({ length: new Date(viewYear, viewMon - 1, 1).getDay() }).map((_, i) => (
                        <div key={`blank-${i}`} />
                    ))}
                    {Array.from({ length: daysInMonth }).map((_, i) => {
                        const day = i + 1;
                        const hasEntry = !!entryMap[day];
                        const isToday = new Date().toISOString().split('T')[0] === `${viewYear}-${String(viewMon).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                        return (
                            <div
                                key={day}
                                onClick={() => {
                                    if (hasEntry) {
                                        openEditEntry(entryMap[day]);
                                    } else {
                                        resetForm();
                                        setFormDate(`${viewYear}-${String(viewMon).padStart(2, '0')}-${String(day).padStart(2, '0')}`);
                                        setShowForm(true);
                                    }
                                }}
                                style={{
                                    textAlign: 'center', padding: '8px 0', borderRadius: 8, cursor: 'pointer',
                                    fontSize: '0.82rem', fontWeight: isToday ? 800 : 500,
                                    background: hasEntry ? 'var(--success-light)' : isToday ? 'var(--accent-light)' : 'transparent',
                                    color: hasEntry ? 'var(--success)' : isToday ? 'var(--primary)' : 'var(--text)',
                                    border: isToday ? '2px solid var(--primary)' : '1px solid transparent',
                                    transition: 'background 0.15s',
                                    position: 'relative'
                                }}
                                title={hasEntry ? `${entryMap[day].hoursWorked}h logged` : 'No entry'}
                            >
                                {day}
                                {hasEntry && <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--success)', margin: '2px auto 0' }} />}
                            </div>
                        );
                    })}
                </div>

                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--success-light)', border: '1px solid var(--success)', display: 'inline-block' }} /> Entry logged
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--accent-light)', border: '2px solid var(--primary)', display: 'inline-block' }} /> Today
                    </span>
                    <span>Click any day to add or edit an entry</span>
                </div>
            </div>

            {/* Entry Form */}
            {showForm && (
                <div className="card" style={{ marginBottom: 24, border: '2px solid var(--primary)', background: 'linear-gradient(135deg, #fff 0%, #fdf2f5 100%)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <FiEdit3 style={{ color: 'var(--primary)' }} />
                            {editingId ? 'Edit Entry' : 'New Entry'} — {formatDateDisplay(formDate)}
                        </h3>
                        <button onClick={resetForm} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '1.1rem' }}>
                            <FiX />
                        </button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                        <div className="form-group">
                            <label style={{ fontSize: '0.82rem', fontWeight: 600, marginBottom: 6, display: 'block' }}>
                                <FiCalendar style={{ verticalAlign: 'middle', marginRight: 4 }} /> Date
                            </label>
                            <input
                                type="date"
                                className="form-control"
                                value={formDate}
                                onChange={e => setFormDate(e.target.value)}
                                disabled={!!editingId}
                            />
                        </div>
                        <div className="form-group">
                            <label style={{ fontSize: '0.82rem', fontWeight: 600, marginBottom: 6, display: 'block' }}>
                                <FiClock style={{ verticalAlign: 'middle', marginRight: 4 }} /> Hours Worked
                            </label>
                            <input
                                type="number"
                                className="form-control"
                                placeholder="e.g. 8"
                                min="0"
                                max="24"
                                step="0.5"
                                value={formHours}
                                onChange={e => setFormHours(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="form-group" style={{ marginBottom: 16 }}>
                        <label style={{ fontSize: '0.82rem', fontWeight: 600, marginBottom: 6, display: 'block' }}>
                            Tasks Performed <span style={{ color: 'var(--primary)' }}>*</span>
                        </label>
                        <textarea
                            className="form-control"
                            rows={4}
                            placeholder="Describe the tasks you worked on today..."
                            value={formTasks}
                            onChange={e => setFormTasks(e.target.value)}
                            style={{ resize: 'vertical' }}
                        />
                    </div>

                    <div className="form-group" style={{ marginBottom: 20 }}>
                        <label style={{ fontSize: '0.82rem', fontWeight: 600, marginBottom: 6, display: 'block' }}>
                            Supervisor Remarks (optional)
                        </label>
                        <textarea
                            className="form-control"
                            rows={2}
                            placeholder="Any feedback or remarks from your supervisor..."
                            value={formRemarks}
                            onChange={e => setFormRemarks(e.target.value)}
                            style={{ resize: 'vertical' }}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                        <button className="btn btn-secondary" onClick={resetForm}>Cancel</button>
                        <button className="btn btn-primary" onClick={handleSave} disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <FiSave /> {saving ? 'Saving...' : editingId ? 'Update Entry' : 'Save Entry'}
                        </button>
                    </div>
                </div>
            )}

            {/* Entries List */}
            <div className="card">
                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 16 }}>
                    Entries for {monthLabel} ({filteredEntries.length})
                </h3>

                {filteredEntries.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                        <FiBookOpen size={40} style={{ marginBottom: 12, opacity: 0.4 }} />
                        <p style={{ fontSize: '0.9rem' }}>No entries for this month yet.</p>
                        <p style={{ fontSize: '0.82rem' }}>Click a day on the calendar or the "New Entry" button to start logging.</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {filteredEntries.sort((a, b) => a.date.localeCompare(b.date)).map(entry => (
                            <div
                                key={entry._id}
                                style={{
                                    padding: '16px 18px', borderRadius: 12,
                                    background: 'var(--accent-light)', border: '1px solid var(--accent)',
                                    transition: 'box-shadow 0.15s'
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                                    <div>
                                        <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text)' }}>
                                            {formatDateDisplay(entry.date)}
                                        </span>
                                        {entry.hoursWorked > 0 && (
                                            <span style={{ fontSize: '0.75rem', fontWeight: 600, marginLeft: 10, padding: '2px 8px', borderRadius: 12, background: 'var(--info-light)', color: 'var(--info)' }}>
                                                <FiClock style={{ verticalAlign: 'middle', marginRight: 3 }} />
                                                {entry.hoursWorked}h
                                            </span>
                                        )}
                                    </div>
                                    <div style={{ display: 'flex', gap: 6 }}>
                                        <button
                                            onClick={() => openEditEntry(entry)}
                                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--info)', padding: 4 }}
                                            title="Edit"
                                        >
                                            <FiEdit3 size={15} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(entry._id)}
                                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#b91c1c', padding: 4 }}
                                            title="Delete"
                                        >
                                            <FiTrash2 size={15} />
                                        </button>
                                    </div>
                                </div>
                                <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', margin: 0, whiteSpace: 'pre-line', lineHeight: 1.6 }}>
                                    {entry.tasksPerformed}
                                </p>
                                {entry.supervisorRemarks && (
                                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 8, fontStyle: 'italic', borderTop: '1px solid var(--accent)', paddingTop: 8 }}>
                                        Supervisor: {entry.supervisorRemarks}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
