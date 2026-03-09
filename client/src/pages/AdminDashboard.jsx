import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLocation } from 'react-router-dom';
import { FiUsers, FiFileText, FiCheckCircle, FiClock, FiUserPlus, FiSettings, FiBarChart2, FiCalendar, FiX, FiMail, FiLock, FiPhone, FiBookOpen, FiEdit3, FiSearch, FiTrash2, FiUser, FiExternalLink, FiAward, FiSave, FiPlus, FiMinus, FiBriefcase, FiShield } from 'react-icons/fi';
import { toast } from 'react-toastify';

export default function AdminDashboard() {
    const { token } = useAuth();
    const location = useLocation();
    const [students, setStudents] = useState([]);
    const [dashStats, setDashStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showCreateUser, setShowCreateUser] = useState(false);
    const [createUserForm, setCreateUserForm] = useState({ name: '', email: '', password: '', role: 'mentor', phone: '', department: '', designation: '', mentorType: 'faculty' });
    const [createUserError, setCreateUserError] = useState('');
    const [createUserLoading, setCreateUserLoading] = useState(false);
    const [editStudent, setEditStudent] = useState(null);
    const [editStatus, setEditStatus] = useState('');
    const [editLoading, setEditLoading] = useState(false);
    const [mentors, setMentors] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');

    const [documents, setDocuments] = useState([]);
    const [docActionLoading, setDocActionLoading] = useState(null);

    const [studentDetail, setStudentDetail] = useState(null);
    const [studentDetailLoading, setStudentDetailLoading] = useState(false);

    // Settings state
    const [settingsData, setSettingsData] = useState(null);
    const [editingDates, setEditingDates] = useState(false);
    const [editingAssessment, setEditingAssessment] = useState(false);
    const [settingsSaving, setSettingsSaving] = useState(false);
    const [draftDates, setDraftDates] = useState([]);
    const [draftAssessment, setDraftAssessment] = useState(null);

    // Determine active section from URL
    const section = location.pathname.endsWith('/students') ? 'students' :
        location.pathname.endsWith('/mentors') ? 'mentors' :
        location.pathname.endsWith('/documents') ? 'documents' :
        location.pathname.endsWith('/reports') ? 'reports' :
        location.pathname.endsWith('/settings') ? 'settings' : 'dashboard';

    // Reset search when navigating between sections
    useEffect(() => { setSearchQuery(''); }, [section]);

    useEffect(() => {
        (async () => {
            try {
                const [dashRes, studRes, mentorRes, docsRes, settingsRes] = await Promise.all([
                    fetch('/api/admin/dashboard', { headers: { 'Authorization': `Bearer ${token}` } }),
                    fetch('/api/admin/students', { headers: { 'Authorization': `Bearer ${token}` } }),
                    fetch('/api/admin/mentors', { headers: { 'Authorization': `Bearer ${token}` } }),
                    fetch('/api/admin/documents', { headers: { 'Authorization': `Bearer ${token}` } }),
                    fetch('/api/admin/settings', { headers: { 'Authorization': `Bearer ${token}` } }),
                ]);
                if (dashRes.ok) {
                    const dj = await dashRes.json();
                    setDashStats(dj.data);
                }
                if (studRes.ok) {
                    const sj = await studRes.json();
                    setStudents(sj.data || []);
                }
                if (mentorRes.ok) {
                    const mj = await mentorRes.json();
                    setMentors(mj.data || []);
                }
                if (docsRes.ok) {
                    const dj = await docsRes.json();
                    setDocuments(dj.data || []);
                }
                if (settingsRes.ok) {
                    const sj = await settingsRes.json();
                    setSettingsData(sj.data);
                }
            } catch { /* backend unreachable */ }
            setLoading(false);
        })();
    }, []);

    if (loading) {
        return <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}><div className="spinner"></div></div>;
    }

    const handleCreateUser = async (e) => {
        e.preventDefault();
        setCreateUserError('');
        setCreateUserLoading(true);
        try {
            const res = await fetch('/api/admin/create-user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(createUserForm)
            });
            const data = await res.json();
            if (res.ok && data.success) {
                setShowCreateUser(false);
                setCreateUserForm({ name: '', email: '', password: '', role: 'mentor', phone: '', department: '', designation: '', mentorType: 'faculty' });
                // Refresh dashboard
                const [dashRes, studRes] = await Promise.all([
                    fetch('/api/admin/dashboard', { headers: { 'Authorization': `Bearer ${token}` } }),
                    fetch('/api/admin/students', { headers: { 'Authorization': `Bearer ${token}` } }),
                ]);
                if (dashRes.ok) setDashStats((await dashRes.json()).data);
                if (studRes.ok) setStudents((await studRes.json()).data || []);
            } else {
                setCreateUserError(data.detail || data.message || 'Failed to create user');
            }
        } catch {
            toast.error('Cannot connect to server');
        }
        setCreateUserLoading(false);
    };

    const handleUpdateStatus = async () => {
        if (!editStudent || !editStatus) return;
        setEditLoading(true);
        try {
            const res = await fetch(`/api/admin/update-student-status/${editStudent._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ internshipStatus: editStatus })
            });
            if (res.ok) {
                setStudents(prev => prev.map(s => s._id === editStudent._id ? { ...s, internshipStatus: editStatus } : s));
                setEditStudent(null);
            } else {
                const err = await res.json().catch(() => ({}));
                toast.error(err.detail || 'Failed to update status');
            }
        } catch { toast.error('Cannot connect to server'); }
        setEditLoading(false);
    };

    const handleAssignMentor = async (studentId, mentorId, mentorType) => {
        if (!mentorId) return;
        try {
            const res = await fetch('/api/admin/assign-mentor', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ studentId, mentorId, mentorType })
            });
            if (res.ok) {
                const mentor = mentors.find(m => m._id === mentorId);
                const field = mentorType === 'company' ? 'companyMentor' : 'facultyMentor';
                setStudents(prev => prev.map(s => s._id === studentId ? { ...s, [field]: mentor ? { _id: mentor._id, name: mentor.name, email: mentor.email } : mentorId } : s));
            }
        } catch { /* silent */ }
    };

    const totalStudents = dashStats?.totalStudents || students.length;
    const registered = dashStats?.registeredStudents || students.filter(s => s.internshipStatus !== 'not_registered').length;
    const started = students.filter(s => s.internshipStatus === 'internship_started').length;
    const notRegistered = students.filter(s => s.internshipStatus === 'not_registered').length;

    // Filter students by search query
    const filteredStudents = students.filter(s => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (s.name?.toLowerCase().includes(q) || s.prn?.toLowerCase().includes(q) || s.email?.toLowerCase().includes(q) || s.companyName?.toLowerCase().includes(q));
    });

    // Filter mentors by search query
    const filteredMentors = mentors.filter(m => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (m.name?.toLowerCase().includes(q) || m.email?.toLowerCase().includes(q) || m.department?.toLowerCase().includes(q) || m.designation?.toLowerCase().includes(q));
    });

    const handleDeleteMentor = async (mentorId) => {
        if (!window.confirm('Are you sure you want to remove this mentor?')) return;
        try {
            const res = await fetch(`/api/admin/delete-user/${mentorId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setMentors(prev => prev.filter(m => m._id !== mentorId));
            } else {
                const err = await res.json().catch(() => ({}));
                toast.error(err.detail || 'Failed to delete');
            }
        } catch { toast.error('Cannot connect to server'); }
    };

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

    // Filter documents by search query
    const filteredDocuments = documents.filter(d => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (d.studentName?.toLowerCase().includes(q) || d.studentPrn?.toLowerCase().includes(q) || d.documentType?.toLowerCase().includes(q) || d.fileName?.toLowerCase().includes(q));
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

    const saveKeyDates = async () => {
        setSettingsSaving(true);
        try {
            const res = await fetch('/api/admin/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ keyDates: draftDates })
            });
            if (res.ok) {
                const json = await res.json();
                setSettingsData(json.data);
                setEditingDates(false);
                toast.success('Key Dates saved');
            } else {
                const err = await res.json().catch(() => ({}));
                toast.error(err.detail || 'Save failed');
            }
        } catch { toast.error('Cannot connect to server'); }
        setSettingsSaving(false);
    };

    const saveAssessment = async () => {
        setSettingsSaving(true);
        try {
            const res = await fetch('/api/admin/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ assessmentStructure: draftAssessment })
            });
            if (res.ok) {
                const json = await res.json();
                setSettingsData(json.data);
                setEditingAssessment(false);
                toast.success('Assessment Structure saved');
            } else {
                const err = await res.json().catch(() => ({}));
                toast.error(err.detail || 'Save failed');
            }
        } catch { toast.error('Cannot connect to server'); }
        setSettingsSaving(false);
    };

    return (
        <div>
            {/* ═══════════ DASHBOARD OVERVIEW ═══════════ */}
            {section === 'dashboard' && (
                <>
                    <div style={{ marginBottom: 24 }}>
                        <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Admin / HOD Dashboard</h2>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 4 }}>
                            Oversee the entire internship process, manage mappings, and finalize credits
                        </p>
                    </div>

                    <div className="stats-grid">
                        <div className="stat-card">
                            <div className="stat-icon red"><FiUsers /></div>
                            <div className="stat-info"><h3>{totalStudents}</h3><p>Total Students</p></div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon blue"><FiCheckCircle /></div>
                            <div className="stat-info">
                                <h3>{registered}</h3><p>Registered</p>
                                <span className="stat-detail">{totalStudents > 0 ? Math.round((registered / totalStudents) * 100) : 0}% completion</span>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon yellow"><FiClock /></div>
                            <div className="stat-info"><h3>{notRegistered}</h3><p>Not Registered</p><span className="stat-detail negative">Needs attention</span></div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon green"><FiBarChart2 /></div>
                            <div className="stat-info"><h3>{started}</h3><p>Internship Active</p></div>
                        </div>
                    </div>

                    <div className="grid-2" style={{ marginTop: 20 }}>
                        <div className="card">
                            <div className="card-header">
                                <h2><FiCalendar style={{ marginRight: 8, verticalAlign: 'middle', color: 'var(--primary)' }} /> Key Dates</h2>
                            </div>
                            <div style={{ fontSize: '0.85rem' }}>
                                {(settingsData?.keyDates || []).map((item, i) => (
                                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--accent-light)' }}>
                                        <span style={{ fontWeight: 600 }}>{item.label}</span>
                                        <span style={{ color: 'var(--text-muted)' }}>{item.date}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="card">
                            <div className="card-header">
                                <h2><FiBarChart2 style={{ marginRight: 8, verticalAlign: 'middle', color: 'var(--info)' }} /> Quick Summary</h2>
                            </div>
                            <div style={{ fontSize: '0.85rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--accent-light)' }}>
                                    <span style={{ fontWeight: 600 }}>Total Mentors</span>
                                    <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{dashStats?.totalMentors || mentors.length}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--accent-light)' }}>
                                    <span style={{ fontWeight: 600 }}>Total Reports Submitted</span>
                                    <span style={{ fontWeight: 700, color: 'var(--info)' }}>{dashStats?.totalReports || 0}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--accent-light)' }}>
                                    <span style={{ fontWeight: 600 }}>Pending Documents</span>
                                    <span style={{ fontWeight: 700, color: 'var(--warning)' }}>{dashStats?.pendingDocuments || 0}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--accent-light)' }}>
                                    <span style={{ fontWeight: 600 }}>Completed Internships</span>
                                    <span style={{ fontWeight: 700, color: 'var(--success)' }}>{dashStats?.completedStudents || 0}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* ═══════════ STUDENTS SECTION ═══════════ */}
            {section === 'students' && (
                <>
                    <div style={{ marginBottom: 24 }}>
                        <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>All Students</h2>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 4 }}>
                            Manage student registrations, assign mentors, and update statuses
                        </p>
                    </div>

                    <div className="stats-grid">
                        <div className="stat-card">
                            <div className="stat-icon red"><FiUsers /></div>
                            <div className="stat-info"><h3>{totalStudents}</h3><p>Total Students</p></div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon blue"><FiCheckCircle /></div>
                            <div className="stat-info"><h3>{registered}</h3><p>Registered</p></div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon yellow"><FiClock /></div>
                            <div className="stat-info"><h3>{notRegistered}</h3><p>Not Registered</p></div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon green"><FiBarChart2 /></div>
                            <div className="stat-info"><h3>{started}</h3><p>Internship Active</p></div>
                        </div>
                    </div>

                    <div className="card">
                        <div className="card-header">
                            <h2><FiUsers style={{ marginRight: 8, verticalAlign: 'middle' }} /> Student Master List</h2>
                        </div>
                        {/* Search Bar */}
                        <div style={{ padding: '0 0 16px 0' }}>
                            <div style={{ position: 'relative' }}>
                                <FiSearch style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Search by name, PRN, email, or company..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    style={{ paddingLeft: 36 }}
                                />
                            </div>
                        </div>
                        <div className="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>PRN</th>
                                        <th>Student</th>
                                        <th>Company</th>
                                        <th>Company Mentor</th>
                                        <th>Faculty Mentor</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredStudents.length === 0 ? (
                                        <tr><td colSpan={7} style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>
                                            {searchQuery ? 'No students match your search' : 'No students registered yet'}
                                        </td></tr>
                                    ) : filteredStudents.map(student => (
                                        <tr key={student._id}>
                                            <td><strong>{student.prn}</strong></td>
                                            <td><span onClick={() => openStudentDetail(student._id)} style={{ color: 'var(--primary)', cursor: 'pointer', fontWeight: 500 }}>{student.name}</span></td>
                                            <td>{student.companyName || <span style={{ color: 'var(--danger)', fontSize: '0.8rem' }}>Not assigned</span>}</td>
                                            <td>{(student.companyMentor?.name || student.companyMentor) || <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                                            <td>{(student.facultyMentor?.name || student.facultyMentor) || <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                                            <td>
                                                <span className={`status-badge ${student.internshipStatus.replace(/_/g, '-')}`}>
                                                    {student.internshipStatus.replace(/_/g, ' ')}
                                                </span>
                                            </td>
                                            <td>
                                                <button className="btn btn-sm btn-secondary" onClick={() => { setEditStudent(student); setEditStatus(student.internshipStatus); }}><FiEdit3 /> Manage</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}

            {/* ═══════════ MENTORS SECTION ═══════════ */}
            {section === 'mentors' && (
                <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
                        <div>
                            <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Mentors</h2>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 4 }}>
                                Manage faculty and industry mentors
                            </p>
                        </div>
                        <button className="btn btn-primary" onClick={() => setShowCreateUser(true)}><FiUserPlus /> Create Mentor / Admin</button>
                    </div>

                    <div className="stats-grid">
                        <div className="stat-card">
                            <div className="stat-icon blue"><FiBookOpen /></div>
                            <div className="stat-info"><h3>{mentors.length}</h3><p>Total Mentors</p></div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon green"><FiUsers /></div>
                            <div className="stat-info"><h3>{mentors.filter(m => m.mentorType === 'faculty').length}</h3><p>Faculty Mentors</p></div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon yellow"><FiUsers /></div>
                            <div className="stat-info"><h3>{mentors.filter(m => m.mentorType === 'company').length}</h3><p>Industry Mentors</p></div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon red"><FiUsers /></div>
                            <div className="stat-info"><h3>{mentors.reduce((a, m) => a + (m.assignedStudents?.length || 0), 0)}</h3><p>Total Assignments</p></div>
                        </div>
                    </div>

                    <div className="card">
                        <div className="card-header">
                            <h2><FiBookOpen style={{ marginRight: 8, verticalAlign: 'middle' }} /> Mentor List</h2>
                        </div>
                        <div style={{ padding: '0 0 16px 0' }}>
                            <div style={{ position: 'relative' }}>
                                <FiSearch style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Search by name, email, department..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    style={{ paddingLeft: 36 }}
                                />
                            </div>
                        </div>
                        <div className="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Email</th>
                                        <th>Type</th>
                                        <th>Department</th>
                                        <th>Designation</th>
                                        <th>Students Assigned</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredMentors.length === 0 ? (
                                        <tr><td colSpan={7} style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>
                                            {searchQuery ? 'No mentors match your search' : 'No mentors created yet'}
                                        </td></tr>
                                    ) : filteredMentors.map(mentor => (
                                        <tr key={mentor._id}>
                                            <td><strong>{mentor.name}</strong></td>
                                            <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{mentor.email}</td>
                                            <td>
                                                <span className={`status-badge ${mentor.mentorType === 'company' ? 'internship-started' : 'registered'}`}>
                                                    {mentor.mentorType === 'company' ? 'Industry' : 'Faculty'}
                                                </span>
                                            </td>
                                            <td>{mentor.department || <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                                            <td>{mentor.designation || <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                                            <td style={{ fontWeight: 600 }}>{mentor.assignedStudents?.length || 0}</td>
                                            <td>
                                                <button className="btn btn-sm btn-danger" onClick={() => handleDeleteMentor(mentor._id)} style={{ background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca' }}>
                                                    <FiTrash2 /> Remove
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}

            {/* ═══════════ DOCUMENTS SECTION ═══════════ */}
            {section === 'documents' && (
                <>
                    <div style={{ marginBottom: 24 }}>
                        <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Document Review</h2>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 4 }}>
                            Review and approve/reject student document submissions
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
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Search by student name, PRN, or document type..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    style={{ paddingLeft: 36 }}
                                />
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

            {/* ═══════════ REPORTS SECTION ═══════════ */}
            {section === 'reports' && (
                <>
                    <div style={{ marginBottom: 24 }}>
                        <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Reports Overview</h2>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 4 }}>
                            Track weekly report submissions and document status across all students
                        </p>
                    </div>

                    <div className="stats-grid">
                        <div className="stat-card">
                            <div className="stat-icon blue"><FiFileText /></div>
                            <div className="stat-info"><h3>{dashStats?.totalReports || 0}</h3><p>Total Reports Submitted</p></div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon yellow"><FiClock /></div>
                            <div className="stat-info"><h3>{dashStats?.pendingDocuments || 0}</h3><p>Pending Documents</p></div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon red"><FiUsers /></div>
                            <div className="stat-info"><h3>{totalStudents}</h3><p>Total Students</p></div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon green"><FiCheckCircle /></div>
                            <div className="stat-info"><h3>{totalStudents > 0 ? Math.round((dashStats?.totalReports || 0) / totalStudents) : 0}</h3><p>Avg. Reports / Student</p></div>
                        </div>
                    </div>

                    <div className="card">
                        <div className="card-header">
                            <h2><FiFileText style={{ marginRight: 8, verticalAlign: 'middle' }} /> Student Report Status</h2>
                        </div>
                        <div style={{ padding: '0 0 16px 0' }}>
                            <div style={{ position: 'relative' }}>
                                <FiSearch style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Search students..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    style={{ paddingLeft: 36 }}
                                />
                            </div>
                        </div>
                        <div className="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>PRN</th>
                                        <th>Student</th>
                                        <th>Company</th>
                                        <th>Faculty Mentor</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredStudents.length === 0 ? (
                                        <tr><td colSpan={5} style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>No students found</td></tr>
                                    ) : filteredStudents.map(student => (
                                        <tr key={student._id}>
                                            <td><strong>{student.prn}</strong></td>
                                            <td><span onClick={() => openStudentDetail(student._id)} style={{ color: 'var(--primary)', cursor: 'pointer', fontWeight: 500 }}>{student.name}</span></td>
                                            <td>{student.companyName || <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                                            <td>{(student.facultyMentor?.name || student.facultyMentor) || <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                                            <td>
                                                <span className={`status-badge ${student.internshipStatus.replace(/_/g, '-')}`}>
                                                    {student.internshipStatus.replace(/_/g, ' ')}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}

            {/* ═══════════ SETTINGS SECTION ═══════════ */}
            {section === 'settings' && settingsData && (() => {
                const kd = settingsData.keyDates || [];
                const as = settingsData.assessmentStructure || {};
                const indTotal = as.industryMentor?.total || 0;
                const facTotal = as.facultyCoordinator?.total || 0;
                return (
                <>
                    <div style={{ marginBottom: 24 }}>
                        <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Settings</h2>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 4 }}>
                            Internship program configuration and assessment structure
                        </p>
                    </div>

                    <div className="grid-2">
                        {/* ── Key Dates Card ── */}
                        <div className="card">
                            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h2><FiCalendar style={{ marginRight: 8, verticalAlign: 'middle', color: 'var(--primary)' }} /> Key Dates</h2>
                                {!editingDates ? (
                                    <button onClick={() => { setDraftDates(kd.map(d => ({ ...d }))); setEditingDates(true); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', fontSize: '1rem' }} title="Edit"><FiEdit3 /></button>
                                ) : (
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        <button className="btn btn-primary" style={{ padding: '4px 12px', fontSize: '0.78rem' }} onClick={saveKeyDates} disabled={settingsSaving}><FiSave style={{ marginRight: 4 }} />{settingsSaving ? 'Saving...' : 'Save'}</button>
                                        <button className="btn" style={{ padding: '4px 12px', fontSize: '0.78rem', background: 'var(--accent-light)' }} onClick={() => setEditingDates(false)}>Cancel</button>
                                    </div>
                                )}
                            </div>
                            <div style={{ fontSize: '0.85rem' }}>
                                {!editingDates ? (
                                    kd.map((item, i) => (
                                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--accent-light)' }}>
                                            <span style={{ fontWeight: 600 }}>{item.label}</span>
                                            <span style={{ color: 'var(--text-muted)' }}>{item.date}</span>
                                        </div>
                                    ))
                                ) : (
                                    <>
                                        {draftDates.map((item, i) => (
                                            <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '6px 0', borderBottom: '1px solid var(--accent-light)' }}>
                                                <input className="form-control" style={{ flex: 1, fontSize: '0.82rem' }} value={item.label} onChange={e => { const n = [...draftDates]; n[i] = { ...n[i], label: e.target.value }; setDraftDates(n); }} placeholder="Label" />
                                                <input className="form-control" style={{ flex: 1, fontSize: '0.82rem' }} value={item.date} onChange={e => { const n = [...draftDates]; n[i] = { ...n[i], date: e.target.value }; setDraftDates(n); }} placeholder="Date / value" />
                                                <button onClick={() => setDraftDates(draftDates.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', fontSize: '0.9rem' }} title="Remove"><FiMinus /></button>
                                            </div>
                                        ))}
                                        <button onClick={() => setDraftDates([...draftDates, { label: '', date: '' }])} style={{ marginTop: 8, background: 'none', border: '1px dashed var(--accent)', borderRadius: 6, padding: '6px 14px', cursor: 'pointer', fontSize: '0.82rem', color: 'var(--primary)', width: '100%' }}><FiPlus style={{ marginRight: 4, verticalAlign: 'middle' }} /> Add Date</button>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* ── Assessment Structure Card ── */}
                        <div className="card">
                            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h2><FiBarChart2 style={{ marginRight: 8, verticalAlign: 'middle', color: 'var(--info)' }} /> Assessment Structure</h2>
                                {!editingAssessment ? (
                                    <button onClick={() => { setDraftAssessment(JSON.parse(JSON.stringify(as))); setEditingAssessment(true); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--info)', fontSize: '1rem' }} title="Edit"><FiEdit3 /></button>
                                ) : (
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        <button className="btn btn-primary" style={{ padding: '4px 12px', fontSize: '0.78rem' }} onClick={saveAssessment} disabled={settingsSaving}><FiSave style={{ marginRight: 4 }} />{settingsSaving ? 'Saving...' : 'Save'}</button>
                                        <button className="btn" style={{ padding: '4px 12px', fontSize: '0.78rem', background: 'var(--accent-light)' }} onClick={() => setEditingAssessment(false)}>Cancel</button>
                                    </div>
                                )}
                            </div>
                            <div style={{ fontSize: '0.85rem' }}>
                                {!editingAssessment ? (
                                    <>
                                        <h4 style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: 8, color: 'var(--primary)' }}>Industry Mentor — {indTotal} Marks</h4>
                                        {(as.industryMentor?.items || []).map((it, i) => (
                                            <div key={i} style={{ padding: '6px 0' }}>{it.label}: {it.marks} marks</div>
                                        ))}
                                        <h4 style={{ fontSize: '0.85rem', fontWeight: 600, marginTop: 16, marginBottom: 8, color: 'var(--info)' }}>Faculty Coordinator — {facTotal} Marks</h4>
                                        {(as.facultyCoordinator?.items || []).map((it, i) => (
                                            <div key={i} style={{ padding: '6px 0' }}>{it.label}: {it.marks} marks</div>
                                        ))}
                                        <div style={{ marginTop: 12, padding: '10px 14px', background: 'var(--accent-light)', borderRadius: 'var(--radius-sm)', fontWeight: 700 }}>
                                            Total: {indTotal + facTotal} Marks = 8 Credits (max)
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        {['industryMentor', 'facultyCoordinator'].map(section => {
                                            const sec = draftAssessment[section] || { total: 0, items: [] };
                                            const sectionLabel = section === 'industryMentor' ? 'Industry Mentor' : 'Faculty Coordinator';
                                            const sectionColor = section === 'industryMentor' ? 'var(--primary)' : 'var(--info)';
                                            return (
                                                <div key={section} style={{ marginBottom: 16 }}>
                                                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                                                        <span style={{ fontWeight: 600, color: sectionColor, fontSize: '0.85rem' }}>{sectionLabel} —</span>
                                                        <input type="number" className="form-control" style={{ width: 70, fontSize: '0.82rem', textAlign: 'center' }} value={sec.total} onChange={e => { const n = { ...draftAssessment }; n[section] = { ...sec, total: parseInt(e.target.value) || 0 }; setDraftAssessment(n); }} />
                                                        <span style={{ fontSize: '0.82rem' }}>Marks</span>
                                                    </div>
                                                    {(sec.items || []).map((it, i) => (
                                                        <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '4px 0' }}>
                                                            <input className="form-control" style={{ flex: 1, fontSize: '0.82rem' }} value={it.label} onChange={e => { const n = { ...draftAssessment }; const items = [...sec.items]; items[i] = { ...items[i], label: e.target.value }; n[section] = { ...sec, items }; setDraftAssessment(n); }} placeholder="Label" />
                                                            <input type="number" className="form-control" style={{ width: 70, fontSize: '0.82rem', textAlign: 'center' }} value={it.marks} onChange={e => { const n = { ...draftAssessment }; const items = [...sec.items]; items[i] = { ...items[i], marks: parseInt(e.target.value) || 0 }; n[section] = { ...sec, items }; setDraftAssessment(n); }} />
                                                            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>marks</span>
                                                            <button onClick={() => { const n = { ...draftAssessment }; n[section] = { ...sec, items: sec.items.filter((_, j) => j !== i) }; setDraftAssessment(n); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', fontSize: '0.9rem' }}><FiMinus /></button>
                                                        </div>
                                                    ))}
                                                    <button onClick={() => { const n = { ...draftAssessment }; n[section] = { ...sec, items: [...(sec.items || []), { label: '', marks: 0 }] }; setDraftAssessment(n); }} style={{ marginTop: 4, background: 'none', border: '1px dashed var(--accent)', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: '0.78rem', color: sectionColor }}><FiPlus style={{ marginRight: 4, verticalAlign: 'middle' }} /> Add Item</button>
                                                </div>
                                            );
                                        })}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </>
                );
            })()}

            {/* ═══════════ MODALS (shared) ═══════════ */}

            {/* Edit Student Modal */}
            {editStudent && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setEditStudent(null)}>
                    <div style={{ background: '#fff', borderRadius: 'var(--radius-lg, 12px)', padding: '28px 32px', width: '100%', maxWidth: 480, maxHeight: '90vh', overflow: 'auto', position: 'relative' }} onClick={e => e.stopPropagation()}>
                        <button onClick={() => setEditStudent(null)} style={{ position: 'absolute', top: 12, right: 12, background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: 'var(--text-muted)' }}><FiX /></button>
                        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 4 }}>Manage Student</h2>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 20 }}>
                            {editStudent.name} — PRN: {editStudent.prn || 'N/A'}
                        </p>

                        <div style={{ marginBottom: 16 }}>
                            <label style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: 6, display: 'block' }}>Internship Status</label>
                            <select className="form-control" value={editStatus} onChange={e => setEditStatus(e.target.value)}>
                                <option value="not_registered">Not Registered</option>
                                <option value="registered">Registered</option>
                                <option value="internship_started">Internship Started</option>
                                <option value="mid_term">Mid-Term</option>
                                <option value="completed">Completed</option>
                            </select>
                        </div>

                        <button className="btn btn-primary" style={{ width: '100%', marginBottom: 20 }} onClick={handleUpdateStatus} disabled={editLoading}>
                            {editLoading ? 'Updating...' : 'Update Status'}
                        </button>

                        <hr style={{ border: 'none', borderTop: '1px solid var(--accent)', margin: '16px 0' }} />

                        <div style={{ marginBottom: 14 }}>
                            <label style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: 6, display: 'block' }}>Assign Faculty Mentor</label>
                            <select className="form-control" value={editStudent.facultyMentor?._id || ''} onChange={e => handleAssignMentor(editStudent._id, e.target.value, 'faculty')}>
                                <option value="">— Select Faculty Mentor —</option>
                                {mentors.filter(m => !m.mentorType || m.mentorType === 'faculty').map(m => (
                                    <option key={m._id} value={m._id}>{m.name} ({m.email})</option>
                                ))}
                            </select>
                        </div>

                        <div style={{ marginBottom: 14 }}>
                            <label style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: 6, display: 'block' }}>Assign Company Mentor</label>
                            <select className="form-control" value={editStudent.companyMentor?._id || ''} onChange={e => handleAssignMentor(editStudent._id, e.target.value, 'company')}>
                                <option value="">— Select Company Mentor —</option>
                                {mentors.filter(m => !m.mentorType || m.mentorType === 'company').map(m => (
                                    <option key={m._id} value={m._id}>{m.name} ({m.email})</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            )}

            {/* Create User Modal */}
            {showCreateUser && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setShowCreateUser(false)}>
                    <div style={{ background: '#fff', borderRadius: 'var(--radius-lg, 12px)', padding: '22px 28px', width: '100%', maxWidth: 520, maxHeight: '90vh', overflow: 'auto', position: 'relative' }} onClick={e => e.stopPropagation()}>
                        <button onClick={() => setShowCreateUser(false)} style={{ position: 'absolute', top: 10, right: 10, background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem', color: 'var(--text-muted)' }}><FiX /></button>
                        <h2 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 2 }}>Create Mentor / Admin Account</h2>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 14 }}>Students register themselves via the registration page</p>

                        {createUserError && <div style={{ background: '#fef2f2', color: '#b91c1c', padding: '8px 12px', borderRadius: 8, fontSize: '0.8rem', marginBottom: 12 }}>{createUserError}</div>}

                        <form onSubmit={handleCreateUser}>
                            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                                {['mentor', 'admin'].map(r => (
                                    <div key={r} onClick={() => setCreateUserForm({ ...createUserForm, role: r })} style={{ flex: 1, padding: '7px 0', textAlign: 'center', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem', border: createUserForm.role === r ? '2px solid var(--primary)' : '2px solid var(--accent)', background: createUserForm.role === r ? 'var(--primary)' : 'transparent', color: createUserForm.role === r ? '#fff' : 'var(--text)', transition: 'all 0.2s ease', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                                        {r === 'mentor' ? <><FiUser size={14} /> Mentor</> : <><FiShield size={14} /> Admin</>}
                                    </div>
                                ))}
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label><FiUser size={13} style={{ marginRight: 5, verticalAlign: 'middle' }} /> Full Name *</label>
                                    <input type="text" value={createUserForm.name} onChange={e => setCreateUserForm({ ...createUserForm, name: e.target.value })} required className="form-control" placeholder="Enter full name" />
                                </div>
                                <div className="form-group">
                                    <label><FiLock size={13} style={{ marginRight: 5, verticalAlign: 'middle' }} /> Password *</label>
                                    <input type="password" value={createUserForm.password} onChange={e => setCreateUserForm({ ...createUserForm, password: e.target.value })} required minLength={6} className="form-control" placeholder="Min 6 characters" />
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label><FiMail size={13} style={{ marginRight: 5, verticalAlign: 'middle' }} /> Email *</label>
                                    <input type="email" value={createUserForm.email} onChange={e => setCreateUserForm({ ...createUserForm, email: e.target.value })} required className="form-control" placeholder="user@mitvpu.ac.in" />
                                </div>
                                <div className="form-group">
                                    <label><FiPhone size={13} style={{ marginRight: 5, verticalAlign: 'middle' }} /> Phone</label>
                                    <input type="tel" value={createUserForm.phone} onChange={e => setCreateUserForm({ ...createUserForm, phone: e.target.value })} className="form-control" placeholder="94210XXXXX" />
                                </div>
                            </div>

                            {createUserForm.role === 'mentor' && (
                                <>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label><FiBookOpen size={13} style={{ marginRight: 5, verticalAlign: 'middle' }} /> Department</label>
                                            <input type="text" value={createUserForm.department} onChange={e => setCreateUserForm({ ...createUserForm, department: e.target.value })} className="form-control" placeholder="e.g. School of Computing" />
                                        </div>
                                        <div className="form-group">
                                            <label><FiBriefcase size={13} style={{ marginRight: 5, verticalAlign: 'middle' }} /> Designation</label>
                                            <input type="text" value={createUserForm.designation} onChange={e => setCreateUserForm({ ...createUserForm, designation: e.target.value })} className="form-control" placeholder="e.g. Associate Professor" />
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label><FiUsers size={13} style={{ marginRight: 5, verticalAlign: 'middle' }} /> Mentor Type</label>
                                        <select value={createUserForm.mentorType} onChange={e => setCreateUserForm({ ...createUserForm, mentorType: e.target.value })} className="form-control">
                                            <option value="faculty">Faculty Mentor</option>
                                            <option value="company">Company / Industry Mentor</option>
                                        </select>
                                    </div>
                                </>
                            )}

                            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 6 }} disabled={createUserLoading}>
                                {createUserLoading ? 'Creating...' : `Create ${createUserForm.role === 'mentor' ? 'Mentor' : 'Admin'} Account`}
                            </button>
                        </form>
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
