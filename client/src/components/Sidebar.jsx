import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    FiHome, FiFileText, FiUpload, FiCalendar, FiBook, FiUsers,
    FiSettings, FiLogOut, FiBarChart2, FiClipboard, FiAward, FiDownload, FiBookOpen
} from 'react-icons/fi';

export default function Sidebar({ isOpen, onClose }) {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const getInitials = (name) => {
        return name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'U';
    };

    const studentLinks = [
        {
            section: 'Main', items: [
                { to: '/dashboard', icon: <FiHome />, label: 'Dashboard' },
                { to: '/weekly-reports', icon: <FiFileText />, label: 'Weekly Reports' },
                { to: '/daily-logbook', icon: <FiBookOpen />, label: 'Daily Logbook' },
                { to: '/documents', icon: <FiUpload />, label: 'Documents' },
                { to: '/downloads', icon: <FiDownload />, label: 'Downloads' },
            ]
        },
        {
            section: 'Track', items: [
                { to: '/timeline', icon: <FiCalendar />, label: 'Timeline' },
                { to: '/grades', icon: <FiAward />, label: 'Grades & Credits' },
            ]
        }
    ];

    const mentorLinks = [
        {
            section: 'Main', items: [
                { to: '/mentor', icon: <FiHome />, label: 'Dashboard' },
                { to: '/mentor/students', icon: <FiUsers />, label: 'Students' },
                { to: '/mentor/documents', icon: <FiFileText />, label: 'Documents' },
                { to: '/mentor/reviews', icon: <FiClipboard />, label: 'Reviews' },
                { to: '/mentor/evaluations', icon: <FiBarChart2 />, label: 'Evaluations' },
            ]
        }
    ];

    const adminLinks = [
        {
            section: 'Management', items: [
                { to: '/admin', icon: <FiHome />, label: 'Dashboard' },
                { to: '/admin/students', icon: <FiUsers />, label: 'All Students' },
                { to: '/admin/mentors', icon: <FiBook />, label: 'Mentors' },
                { to: '/admin/documents', icon: <FiFileText />, label: 'Documents' },
                { to: '/admin/reports', icon: <FiBarChart2 />, label: 'Reports' },
                { to: '/admin/settings', icon: <FiSettings />, label: 'Settings' },
            ]
        }
    ];

    const links = user?.role === 'admin' ? adminLinks : user?.role === 'mentor' ? mentorLinks : studentLinks;

    return (
        <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
            <div className="sidebar-header">
                <div className="sidebar-brand">
                    <img src="/logocut.png" alt="MIT VPU" className="sidebar-brand-icon" style={{ background: 'transparent', boxShadow: 'none', objectFit: 'contain' }} />
                    <div className="sidebar-brand-text">
                        <h2>MIT VPU</h2>
                        <span>School of Computing</span>
                    </div>
                </div>
            </div>

            <nav className="sidebar-nav">
                {links.map((section, i) => (
                    <div key={i}>
                        <div className="sidebar-section-title">{section.section}</div>
                        {section.items.map((link) => (
                            <NavLink
                                key={link.to}
                                to={link.to}
                                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                                onClick={onClose}
                                end={link.to === '/dashboard' || link.to === '/mentor' || link.to === '/admin'}
                            >
                                <span className="icon">{link.icon}</span>
                                {link.label}
                            </NavLink>
                        ))}
                    </div>
                ))}
            </nav>

            <div className="sidebar-footer">
                <div className="sidebar-user">
                    <div className="sidebar-user-avatar">{getInitials(user?.name)}</div>
                    <div className="sidebar-user-info" style={{ flex: 1 }}>
                        <h4>{user?.name || 'User'}</h4>
                        <span>{user?.role} {user?.prn ? `• ${user.prn}` : ''}</span>
                    </div>
                    <button
                        onClick={handleLogout}
                        style={{
                            background: '#F8F9FA',
                            border: '1px solid #E1E4E8',
                            borderRadius: '6px',
                            width: 32, height: 32,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: '#404041',
                            cursor: 'pointer'
                        }}
                        title="Logout"
                    >
                        <FiLogOut />
                    </button>
                </div>
            </div>
        </aside>
    );
}
