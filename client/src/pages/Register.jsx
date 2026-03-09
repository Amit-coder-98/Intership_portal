import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiUser, FiMail, FiLock, FiHash, FiPhone, FiArrowRight, FiBookOpen, FiCalendar, FiBarChart2, FiCheckCircle, FiKey, FiUpload } from 'react-icons/fi';

export default function Register() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'student',
        prn: '',
        class: 'MCA',
        phone: '',
        companyName: ''
    });
    const [offerLetterFile, setOfferLetterFile] = useState(null);
    const offerLetterRef = useRef(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        if (!offerLetterFile) {
            setError('Please upload your Offer Letter');
            return;
        }

        setLoading(true);
        const result = await register(formData);

        if (result.success) {
            // Upload offer letter
            if (offerLetterFile) {
                try {
                    const token = localStorage.getItem('token');
                    const fd = new FormData();
                    fd.append('documentType', 'offer_letter');
                    fd.append('document', offerLetterFile);
                    await fetch('/api/student/upload-document', {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${token}` },
                        body: fd
                    });
                } catch { /* upload failed — student can re-upload later */ }
            }
            navigate('/loading');
        } else {
            setError(result.message || 'Registration failed');
        }
        setLoading(false);
    };

    return (
        <div className="auth-page">
            <div className="auth-left">
                <img src="/logocut.png" alt="MIT VPU" style={{ width: 80, height: 80, objectFit: 'contain', marginBottom: 16, backgroundColor: '#fff', borderRadius: '50%', padding: 8 }} />
                <h1>Join MIT VPU<br />Internship Portal</h1>
                <p>Register to manage your MCA Semester IV internship journey. Track documents, submit reports, and earn your 8 credits.</p>

                <div className="auth-features" style={{ marginTop: 32 }}>
                    <div className="auth-feature">
                        <div className="feature-icon"><FiBookOpen /></div>
                        <span>Total Credits: 8 (100 Marks)</span>
                    </div>
                    <div className="auth-feature">
                        <div className="feature-icon"><FiCalendar /></div>
                        <span>Duration: Jan 15 – May 31</span>
                    </div>
                    <div className="auth-feature">
                        <div className="feature-icon"><FiBarChart2 /></div>
                        <span>20 Weekly Reports Required</span>
                    </div>
                    <div className="auth-feature">
                        <div className="feature-icon"><FiCheckCircle /></div>
                        <span>85% Minimum Attendance</span>
                    </div>
                </div>
            </div>

            <div className="auth-right">
                <div className="auth-form-container">
                    <h1>Student Registration</h1>
                    <p className="subtitle">Register as a student to manage your internship</p>

                    <div className="auth-form-card">
                        {error && <div className="alert alert-danger">{error}</div>}

                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label><FiUser style={{ marginRight: 6, verticalAlign: 'middle' }} /> Full Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    className="form-control"
                                    placeholder="Enter your full name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label><FiMail style={{ marginRight: 6, verticalAlign: 'middle' }} /> Email</label>
                                    <input
                                        type="email"
                                        name="email"
                                        className="form-control"
                                        placeholder="you@mitvpu.ac.in"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label><FiPhone style={{ marginRight: 6, verticalAlign: 'middle' }} /> Phone</label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        className="form-control"
                                        placeholder="94210XXXXX"
                                        value={formData.phone}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label><FiHash style={{ marginRight: 6, verticalAlign: 'middle' }} /> PRN</label>
                                <input
                                    type="text"
                                    name="prn"
                                    className="form-control"
                                    placeholder="e.g. MCA401"
                                    value={formData.prn}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label><FiUpload style={{ marginRight: 6, verticalAlign: 'middle' }} /> Offer Letter <span style={{ color: 'var(--danger)', fontSize: '0.75rem' }}>*Required</span></label>
                                <div
                                    onClick={() => offerLetterRef.current?.click()}
                                    style={{
                                        border: '2px dashed var(--accent)',
                                        borderRadius: 'var(--radius-md)',
                                        padding: '14px 18px',
                                        textAlign: 'center',
                                        cursor: 'pointer',
                                        background: offerLetterFile ? 'var(--success-light)' : 'var(--accent-light)',
                                        fontSize: '0.85rem',
                                        color: offerLetterFile ? 'var(--success)' : 'var(--text-muted)',
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    <input
                                        ref={offerLetterRef}
                                        type="file"
                                        accept=".pdf,.doc,.docx,.jpeg,.jpg,.png"
                                        style={{ display: 'none' }}
                                        onChange={(e) => { if (e.target.files[0]) setOfferLetterFile(e.target.files[0]); }}
                                    />
                                    {offerLetterFile ? (
                                        <span style={{ fontWeight: 600 }}><FiCheckCircle style={{ marginRight: 6, verticalAlign: 'middle' }} /> {offerLetterFile.name}</span>
                                    ) : (
                                        <span>Click to upload your Offer Letter (PDF, DOC, DOCX)</span>
                                    )}
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label><FiLock style={{ marginRight: 6, verticalAlign: 'middle' }} /> Password</label>
                                    <input
                                        type="password"
                                        name="password"
                                        className="form-control"
                                        placeholder="Min 6 characters"
                                        value={formData.password}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label><FiLock style={{ marginRight: 6, verticalAlign: 'middle' }} /> Confirm Password</label>
                                    <input
                                        type="password"
                                        name="confirmPassword"
                                        className="form-control"
                                        placeholder="Re-enter password"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="btn btn-primary btn-lg"
                                style={{ width: '100%', marginTop: 8 }}
                                disabled={loading}
                            >
                                {loading ? 'Creating Account...' : 'Create Account'} <FiArrowRight />
                            </button>
                        </form>

                        <div className="form-footer">
                            Already have an account? <Link to="/login">Sign In</Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
