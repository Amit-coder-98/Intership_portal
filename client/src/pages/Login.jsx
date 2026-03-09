import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiMail, FiLock, FiArrowRight, FiCheck, FiBook, FiUpload, FiCalendar, FiEye, FiEyeOff } from 'react-icons/fi';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const result = await login(email, password);

        if (result.success) {
            navigate('/loading');
        } else {
            setError(result.message || 'Login failed. Please try again.');
        }

        setLoading(false);
    };

    return (
        <div className="auth-page">
            <div className="auth-left">
                <img src="/logocut.png" alt="MIT VPU" style={{ width: 80, height: 80, objectFit: 'contain', marginBottom: 16, backgroundColor: '#fff', borderRadius: '50%', padding: 8 }} />
                <h1>MIT Vishwaprayag<br />University</h1>
                <p>School of Computing — MCA Internship Portal for managing your Semester IV industry placement seamlessly.</p>

                <div className="auth-features">
                    <div className="auth-feature">
                        <div className="feature-icon"><FiUpload /></div>
                        <span>Upload documents & track progress</span>
                    </div>
                    <div className="auth-feature">
                        <div className="feature-icon"><FiBook /></div>
                        <span>Submit weekly reports online</span>
                    </div>
                    <div className="auth-feature">
                        <div className="feature-icon"><FiCalendar /></div>
                        <span>Stay on top of every deadline</span>
                    </div>
                    <div className="auth-feature">
                        <div className="feature-icon"><FiCheck /></div>
                        <span>Get graded & earn 8 credits</span>
                    </div>
                </div>
            </div>

            <div className="auth-right">
                <div className="auth-form-container">
                    <h1>Welcome back</h1>
                    <p className="subtitle">Sign in to continue to your internship dashboard</p>

                    <div className="auth-form-card">
                        {error && <div className="alert alert-danger">{error}</div>}

                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label htmlFor="login-email"><FiMail style={{ marginRight: 6, verticalAlign: 'middle' }} /> Email Address</label>
                                <input
                                    id="login-email"
                                    type="email"
                                    className="form-control"
                                    placeholder="you@mitvpu.ac.in"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="login-password"><FiLock style={{ marginRight: 6, verticalAlign: 'middle' }} /> Password</label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        id="login-password"
                                        type={showPassword ? 'text' : 'password'}
                                        className="form-control"
                                        placeholder="Enter your password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        style={{ paddingRight: 44 }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        style={{
                                            position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                                            background: 'none', border: 'none', color: 'var(--text-muted)',
                                            cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center'
                                        }}
                                    >
                                        {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="btn btn-primary btn-lg"
                                style={{ width: '100%', marginTop: 8 }}
                                disabled={loading}
                            >
                                {loading ? 'Signing in...' : 'Sign In'} <FiArrowRight />
                            </button>
                        </form>

                        <div className="form-footer">
                            Don't have an account? <Link to="/register">Create Account</Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
