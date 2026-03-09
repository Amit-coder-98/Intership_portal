import { useState, useEffect, useRef } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { FiMenu, FiBell, FiSearch, FiMail, FiPhone, FiX, FiFileText, FiUsers, FiClipboard, FiAward, FiHome, FiUpload, FiDownload, FiCalendar, FiBarChart2, FiSettings, FiBook, FiLogOut, FiUser, FiEdit3, FiSave, FiShield, FiBriefcase } from 'react-icons/fi';

export default function Layout() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [notifOpen, setNotifOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [notifLoading, setNotifLoading] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);
    const [editProfileOpen, setEditProfileOpen] = useState(false);
    const [profileForm, setProfileForm] = useState({ name: '', phone: '', companyName: '' });
    const [profileSaving, setProfileSaving] = useState(false);
    const { user, token, logout, updateUser } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const searchInputRef = useRef(null);
    const notifRef = useRef(null);
    const profileRef = useRef(null);

    const getPageTitle = () => {
        const path = location.pathname;
        if (path === '/dashboard') return 'Student Dashboard';
        if (path.includes('weekly-reports')) return 'Weekly Reports';
        if (path.includes('documents')) return 'Documents';
        if (path.includes('downloads')) return 'Downloads & Resources';
        if (path.includes('timeline')) return 'Internship Timeline';
        if (path.includes('grades')) return 'Grades & Credits';
        if (path.includes('/mentor')) return 'Mentor Dashboard';
        if (path.includes('/admin')) return 'Admin Dashboard';
        return 'Internship Portal';
    };

    // Navigation items per role for search
    const navItems = user?.role === 'admin' ? [
        { to: '/admin', label: 'Dashboard', icon: <FiHome /> },
        { to: '/admin/students', label: 'All Students', icon: <FiUsers /> },
        { to: '/admin/mentors', label: 'Mentors', icon: <FiBook /> },
        { to: '/admin/documents', label: 'Documents', icon: <FiFileText /> },
        { to: '/admin/reports', label: 'Reports', icon: <FiBarChart2 /> },
        { to: '/admin/settings', label: 'Settings', icon: <FiSettings /> },
    ] : user?.role === 'mentor' ? [
        { to: '/mentor', label: 'Dashboard', icon: <FiHome /> },
        { to: '/mentor/students', label: 'Students', icon: <FiUsers /> },
        { to: '/mentor/documents', label: 'Documents', icon: <FiFileText /> },
        { to: '/mentor/reviews', label: 'Reviews', icon: <FiClipboard /> },
        { to: '/mentor/evaluations', label: 'Evaluations', icon: <FiBarChart2 /> },
    ] : [
        { to: '/dashboard', label: 'Dashboard', icon: <FiHome /> },
        { to: '/weekly-reports', label: 'Weekly Reports', icon: <FiFileText /> },
        { to: '/documents', label: 'Documents', icon: <FiUpload /> },
        { to: '/downloads', label: 'Downloads', icon: <FiDownload /> },
        { to: '/timeline', label: 'Timeline', icon: <FiCalendar /> },
        { to: '/grades', label: 'Grades & Credits', icon: <FiAward /> },
    ];

    const filteredNav = searchQuery
        ? navItems.filter(item => item.label.toLowerCase().includes(searchQuery.toLowerCase()))
        : navItems;

    // Focus search input when overlay opens
    useEffect(() => {
        if (searchOpen) {
            setTimeout(() => searchInputRef.current?.focus(), 100);
        } else {
            setSearchQuery('');
        }
    }, [searchOpen]);

    // Close notification dropdown on outside click
    useEffect(() => {
        const handleClick = (e) => {
            if (notifRef.current && !notifRef.current.contains(e.target)) {
                setNotifOpen(false);
            }
            if (profileRef.current && !profileRef.current.contains(e.target)) {
                setProfileOpen(false);
            }
        };
        if (notifOpen || profileOpen) document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [notifOpen, profileOpen]);

    // Keyboard shortcut: Ctrl+K for search
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                setSearchOpen(prev => !prev);
            }
            if (e.key === 'Escape') {
                setSearchOpen(false);
                setNotifOpen(false);
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Fetch notifications
    const fetchNotifications = async () => {
        setNotifLoading(true);
        try {
            const res = await fetch('/api/auth/notifications', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setNotifications(data.data || []);
            }
        } catch { /* backend unreachable */ }
        setNotifLoading(false);
    };

    const handleNotifToggle = () => {
        if (!notifOpen) fetchNotifications();
        setNotifOpen(prev => !prev);
    };

    const handleSearchNav = (to) => {
        navigate(to);
        setSearchOpen(false);
    };

    const getTimeAgo = (dateStr) => {
        if (!dateStr) return '';
        const diff = Date.now() - new Date(dateStr).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'Just now';
        if (mins < 60) return `${mins}m ago`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        if (days < 7) return `${days}d ago`;
        return new Date(dateStr).toLocaleDateString();
    };

    const getNotifColor = (status) => {
        if (status === 'approved' || status === 'reviewed') return '#059669';
        if (status === 'rejected') return '#b91c1c';
        if (status === 'pending') return '#d97706';
        return 'var(--primary)';
    };

    const handleLogout = () => {
        setProfileOpen(false);
        logout();
        navigate('/login');
    };

    const openEditProfile = () => {
        setProfileForm({
            name: user?.name || '',
            phone: user?.phone || '',
            companyName: user?.companyName || '',
        });
        setProfileOpen(false);
        setEditProfileOpen(true);
    };

    const handleSaveProfile = async () => {
        setProfileSaving(true);
        try {
            const res = await fetch('/api/auth/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(profileForm),
            });
            if (res.ok) {
                const data = await res.json();
                updateUser(data.user);
                setEditProfileOpen(false);
            } else {
                const err = await res.json().catch(() => ({}));
                toast.error(err.detail || 'Failed to update profile');
            }
        } catch { toast.error('Cannot connect to server'); }
        setProfileSaving(false);
    };

    const getRoleBadge = () => {
        const r = user?.role;
        if (r === 'admin') return { label: 'Admin', bg: '#fef2f2', color: '#b91c1c' };
        if (r === 'mentor') return { label: 'Mentor', bg: '#eff6ff', color: '#1d4ed8' };
        return { label: 'Student', bg: '#ecfdf5', color: '#059669' };
    };

    const roleBadge = getRoleBadge();

    return (
        <div className="app-layout">
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            {sidebarOpen && (
                <div
                    className="sidebar-backdrop visible"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            <div className="main-content">
                <header className="top-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <button className="mobile-menu-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
                            <FiMenu />
                        </button>
                        <h1>{getPageTitle()}</h1>
                    </div>

                    <div className="top-header-actions">
                        <button className="header-btn" title="Search (Ctrl+K)" onClick={() => setSearchOpen(true)}>
                            <FiSearch />
                        </button>
                        <div ref={notifRef} style={{ position: 'relative' }}>
                            <button className="header-btn" title="Notifications" onClick={handleNotifToggle}>
                                <FiBell />
                                {notifications.length > 0 && <span className="badge">{notifications.length > 9 ? '9+' : notifications.length}</span>}
                            </button>

                            {/* Notification Dropdown */}
                            {notifOpen && (
                                <div style={{
                                    position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                                    width: 360, maxHeight: 420, background: '#fff',
                                    borderRadius: 12, boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
                                    border: '1px solid var(--accent)', overflow: 'hidden', zIndex: 200
                                }}>
                                    <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--accent)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <h3 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Notifications</h3>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{notifications.length} items</span>
                                    </div>
                                    <div style={{ maxHeight: 340, overflowY: 'auto' }}>
                                        {notifLoading ? (
                                            <div style={{ padding: 32, textAlign: 'center' }}><div className="spinner" style={{ width: 24, height: 24 }}></div></div>
                                        ) : notifications.length === 0 ? (
                                            <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                                No notifications
                                            </div>
                                        ) : notifications.map((n, i) => (
                                            <div key={n.id + '-' + i} style={{
                                                padding: '12px 18px', borderBottom: '1px solid var(--accent-light)',
                                                display: 'flex', gap: 12, alignItems: 'flex-start',
                                                transition: 'background 0.15s', cursor: 'default'
                                            }}
                                            onMouseEnter={e => e.currentTarget.style.background = 'var(--accent-light)'}
                                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                            >
                                                <div style={{
                                                    width: 8, height: 8, borderRadius: '50%', marginTop: 6, flexShrink: 0,
                                                    background: getNotifColor(n.status)
                                                }} />
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <p style={{ fontSize: '0.84rem', fontWeight: 500, lineHeight: 1.4, margin: 0 }}>{n.message}</p>
                                                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{getTimeAgo(n.date)}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                        <div ref={profileRef} style={{ position: 'relative' }}>
                            <div
                                onClick={() => { setProfileOpen(prev => !prev); setNotifOpen(false); }}
                                style={{
                                    width: 36, height: 36,
                                    borderRadius: '50%',
                                    background: 'var(--primary-gradient)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: 'white', fontWeight: 700, fontSize: '0.8rem',
                                    cursor: 'pointer', transition: 'box-shadow 0.2s',
                                    boxShadow: profileOpen ? '0 0 0 3px rgba(178,13,53,0.25)' : 'none'
                                }}
                            >
                                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                            </div>

                            {/* Profile Dropdown */}
                            {profileOpen && (
                                <div style={{
                                    position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                                    width: 300, background: '#fff',
                                    borderRadius: 12, boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
                                    border: '1px solid var(--accent)', overflow: 'hidden', zIndex: 200
                                }}>
                                    {/* Profile Header */}
                                    <div style={{ padding: '20px 18px 16px', background: 'linear-gradient(135deg, #fff 0%, #fdf2f5 100%)', borderBottom: '1px solid var(--accent)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                            <div style={{
                                                width: 48, height: 48, borderRadius: '50%',
                                                background: 'var(--primary-gradient)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                color: '#fff', fontWeight: 800, fontSize: '1.2rem', flexShrink: 0
                                            }}>
                                                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                                            </div>
                                            <div style={{ minWidth: 0 }}>
                                                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name || 'User'}</h4>
                                                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</p>
                                                {user?.prn && (
                                                    <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', margin: '2px 0 0', fontWeight: 600 }}>PRN: {user.prn}</p>
                                                )}
                                            </div>
                                        </div>
                                        <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                            <span style={{
                                                fontSize: '0.7rem', fontWeight: 600, padding: '3px 10px',
                                                borderRadius: 20, background: roleBadge.bg, color: roleBadge.color,
                                                display: 'inline-flex', alignItems: 'center', gap: 4,
                                                textTransform: 'capitalize'
                                            }}>
                                                {user?.role === 'admin' ? <FiShield size={11} /> : user?.role === 'mentor' ? <FiBook size={11} /> : <FiUser size={11} />}
                                                {roleBadge.label}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Profile Details */}
                                    <div style={{ padding: '12px 18px' }}>
                                        {user?.phone && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                                                <FiPhone size={14} style={{ color: 'var(--text-muted)' }} />
                                                {user.phone}
                                            </div>
                                        )}
                                        {user?.companyName && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                                                <FiBriefcase size={14} style={{ color: 'var(--text-muted)' }} />
                                                {user.companyName}
                                            </div>
                                        )}
                                        {user?.department && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                                                <FiBook size={14} style={{ color: 'var(--text-muted)' }} />
                                                {user.department}
                                            </div>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div style={{ borderTop: '1px solid var(--accent)', padding: '8px' }}>
                                        <button
                                            onClick={openEditProfile}
                                            style={{
                                                width: '100%', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10,
                                                background: 'transparent', border: 'none', borderRadius: 8, cursor: 'pointer',
                                                fontSize: '0.85rem', fontWeight: 500, color: 'var(--text)', transition: 'background 0.15s'
                                            }}
                                            onMouseEnter={e => e.currentTarget.style.background = 'var(--accent-light)'}
                                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                        >
                                            <FiEdit3 size={15} /> Edit Profile
                                        </button>
                                        <button
                                            onClick={handleLogout}
                                            style={{
                                                width: '100%', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10,
                                                background: 'transparent', border: 'none', borderRadius: 8, cursor: 'pointer',
                                                fontSize: '0.85rem', fontWeight: 500, color: '#b91c1c', transition: 'background 0.15s'
                                            }}
                                            onMouseEnter={e => e.currentTarget.style.background = '#fef2f2'}
                                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                        >
                                            <FiLogOut size={15} /> Logout
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                {/* Edit Profile Modal */}
                {editProfileOpen && (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)',
                        zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }} onClick={() => setEditProfileOpen(false)}>
                        <div style={{
                            background: '#fff', borderRadius: 16, width: '100%', maxWidth: 420,
                            boxShadow: '0 16px 50px rgba(0,0,0,0.2)', overflow: 'hidden', position: 'relative'
                        }} onClick={e => e.stopPropagation()}>
                            <button onClick={() => setEditProfileOpen(false)} style={{
                                position: 'absolute', top: 14, right: 14, background: 'none',
                                border: 'none', cursor: 'pointer', fontSize: '1.1rem', color: 'var(--text-muted)'
                            }}><FiX /></button>

                            <div style={{ padding: '24px 28px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                                    <div style={{
                                        width: 44, height: 44, borderRadius: '50%',
                                        background: 'var(--primary-gradient)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        color: '#fff', fontWeight: 800, fontSize: '1.1rem'
                                    }}>
                                        {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                                    </div>
                                    <div>
                                        <h2 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>Edit Profile</h2>
                                        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>{user?.email}</p>
                                    </div>
                                </div>

                                <div style={{ marginBottom: 16 }}>
                                    <label style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: 6, display: 'block' }}>
                                        <FiUser style={{ verticalAlign: 'middle', marginRight: 4 }} /> Full Name
                                    </label>
                                    <input
                                        type="text" className="form-control" value={profileForm.name}
                                        onChange={e => setProfileForm({ ...profileForm, name: e.target.value })}
                                        placeholder="Enter your name"
                                    />
                                </div>

                                <div style={{ marginBottom: 16 }}>
                                    <label style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: 6, display: 'block' }}>
                                        <FiPhone style={{ verticalAlign: 'middle', marginRight: 4 }} /> Phone Number
                                    </label>
                                    <input
                                        type="tel" className="form-control" value={profileForm.phone}
                                        onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })}
                                        placeholder="Enter phone number"
                                    />
                                </div>

                                {user?.role === 'student' && (
                                    <div style={{ marginBottom: 16 }}>
                                        <label style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: 6, display: 'block' }}>
                                            <FiBriefcase style={{ verticalAlign: 'middle', marginRight: 4 }} /> Company Name
                                        </label>
                                        <input
                                            type="text" className="form-control" value={profileForm.companyName}
                                            onChange={e => setProfileForm({ ...profileForm, companyName: e.target.value })}
                                            placeholder="Enter company name"
                                        />
                                    </div>
                                )}

                                <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
                                    <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setEditProfileOpen(false)}>Cancel</button>
                                    <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSaveProfile} disabled={profileSaving}>
                                        <FiSave /> {profileSaving ? 'Saving...' : 'Save Changes'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Search Overlay */}
                {searchOpen && (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)',
                        zIndex: 1000, display: 'flex', justifyContent: 'center', paddingTop: 80
                    }} onClick={() => setSearchOpen(false)}>
                        <div style={{
                            background: '#fff', borderRadius: 16, width: '100%', maxWidth: 520,
                            boxShadow: '0 16px 50px rgba(0,0,0,0.2)', overflow: 'hidden',
                            height: 'fit-content', maxHeight: 'calc(100vh - 160px)'
                        }} onClick={e => e.stopPropagation()}>
                            <div style={{ display: 'flex', alignItems: 'center', padding: '14px 20px', borderBottom: '1px solid var(--accent)', gap: 12 }}>
                                <FiSearch style={{ fontSize: '1.1rem', color: 'var(--text-muted)', flexShrink: 0 }} />
                                <input
                                    ref={searchInputRef}
                                    type="text"
                                    placeholder="Search pages..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    style={{
                                        flex: 1, border: 'none', outline: 'none', fontSize: '0.95rem',
                                        background: 'transparent', color: 'var(--text)'
                                    }}
                                    onKeyDown={e => {
                                        if (e.key === 'Enter' && filteredNav.length > 0) {
                                            handleSearchNav(filteredNav[0].to);
                                        }
                                    }}
                                />
                                <kbd style={{
                                    fontSize: '0.7rem', padding: '2px 8px', borderRadius: 6,
                                    background: 'var(--accent-light)', border: '1px solid var(--accent)',
                                    color: 'var(--text-muted)', fontFamily: 'inherit'
                                }}>ESC</kbd>
                            </div>
                            <div style={{ padding: '8px 0', maxHeight: 320, overflowY: 'auto' }}>
                                {filteredNav.length === 0 ? (
                                    <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                        No pages found
                                    </div>
                                ) : (
                                    <>
                                        <div style={{ padding: '6px 20px', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
                                            Navigate to
                                        </div>
                                        {filteredNav.map(item => (
                                            <div
                                                key={item.to}
                                                onClick={() => handleSearchNav(item.to)}
                                                style={{
                                                    display: 'flex', alignItems: 'center', gap: 14,
                                                    padding: '11px 20px', cursor: 'pointer',
                                                    transition: 'background 0.15s',
                                                    background: location.pathname === item.to ? 'var(--accent-light)' : 'transparent'
                                                }}
                                                onMouseEnter={e => e.currentTarget.style.background = 'var(--accent-light)'}
                                                onMouseLeave={e => e.currentTarget.style.background = location.pathname === item.to ? 'var(--accent-light)' : 'transparent'}
                                            >
                                                <span style={{ fontSize: '1.05rem', color: location.pathname === item.to ? 'var(--primary)' : 'var(--text-muted)' }}>
                                                    {item.icon}
                                                </span>
                                                <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{item.label}</span>
                                                {location.pathname === item.to && (
                                                    <span style={{ marginLeft: 'auto', fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 600 }}>Current</span>
                                                )}
                                            </div>
                                        ))}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                <div className="page-content">
                    <Outlet />
                </div>

                <footer className="app-footer">
                    <span>© 2025-26 MIT Vishwaprayag University — School of Computing</span>
                    <div className="footer-contact">
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><FiMail size={13} /> darshan.ruikar@mitvpu.ac.in</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><FiPhone size={13} /> 94210 47344</span>
                    </div>
                </footer>
            </div>
        </div>
    );
}
