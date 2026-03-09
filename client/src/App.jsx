import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import StudentDashboard from './pages/StudentDashboard';
import WeeklyReports from './pages/WeeklyReports';
import Documents from './pages/Documents';
import Downloads from './pages/Downloads';
import Timeline from './pages/Timeline';
import Grades from './pages/Grades';
import MentorDashboard from './pages/MentorDashboard';
import AdminDashboard from './pages/AdminDashboard';
import DailyLogbook from './pages/DailyLogbook';
import Preloader from './pages/Preloader';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './index.css';

// Protected route wrapper
function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to appropriate dashboard based on role
    if (user.role === 'admin') return <Navigate to="/admin" replace />;
    if (user.role === 'mentor') return <Navigate to="/mentor" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

// Redirect if already logged in
function PublicRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/loading" replace />;
  }

  return children;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

      {/* Preloader Route */}
      <Route path="/loading" element={<Preloader />} />

      {/* Student Routes */}
      <Route path="/" element={
        <ProtectedRoute allowedRoles={['student']}>
          <Layout />
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<StudentDashboard />} />
        <Route path="weekly-reports" element={<WeeklyReports />} />
        <Route path="daily-logbook" element={<DailyLogbook />} />
        <Route path="documents" element={<Documents />} />
        <Route path="downloads" element={<Downloads />} />
        <Route path="timeline" element={<Timeline />} />
        <Route path="grades" element={<Grades />} />
      </Route>

      {/* Mentor Routes */}
      <Route path="/mentor" element={
        <ProtectedRoute allowedRoles={['mentor']}>
          <Layout />
        </ProtectedRoute>
      }>
        <Route index element={<MentorDashboard />} />
        <Route path="students" element={<MentorDashboard />} />
        <Route path="documents" element={<MentorDashboard />} />
        <Route path="reviews" element={<MentorDashboard />} />
        <Route path="evaluations" element={<MentorDashboard />} />
      </Route>

      {/* Admin Routes */}
      <Route path="/admin" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <Layout />
        </ProtectedRoute>
      }>
        <Route index element={<AdminDashboard />} />
        <Route path="students" element={<AdminDashboard />} />
        <Route path="mentors" element={<AdminDashboard />} />
        <Route path="documents" element={<AdminDashboard />} />
        <Route path="reports" element={<AdminDashboard />} />
        <Route path="settings" element={<AdminDashboard />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
        <ToastContainer
          position="top-right"
          autoClose={4000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="colored"
        />
      </AuthProvider>
    </Router>
  );
}
