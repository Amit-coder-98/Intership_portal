import { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Preloader() {
    const { user, loading } = useAuth();
    const navigate = useNavigate();
    const [progress, setProgress] = useState(0);

    if (!loading && !user) {
        return <Navigate to="/login" replace />;
    }

    useEffect(() => {
        const timers = [];
        let current = 0;

        // Phase 1: Ramp quickly to ~60% (over ~2s)
        const rampInterval = setInterval(() => {
            const increment = Math.random() * 12 + 6; // 6-18%
            current = Math.min(current + increment, 60);
            setProgress(Math.round(current));
            if (current >= 60) clearInterval(rampInterval);
        }, 300);
        timers.push(rampInterval);

        // Phase 2: After reaching 60%, pause for 5 seconds, then ramp to 100%
        const resumeTimer = setTimeout(() => {
            let phase2 = 60;
            const finishInterval = setInterval(() => {
                const increment = Math.random() * 10 + 5; // 5-15%
                phase2 = Math.min(phase2 + increment, 100);
                setProgress(Math.round(phase2));
                if (phase2 >= 100) {
                    clearInterval(finishInterval);
                    setTimeout(() => {
                        if (user?.role === 'admin') navigate('/admin', { replace: true });
                        else if (user?.role === 'mentor') navigate('/mentor', { replace: true });
                        else navigate('/dashboard', { replace: true });
                    }, 400);
                }
            }, 300);
            timers.push(finishInterval);
        }, 7000); // 2s ramp + 5s pause
        timers.push(resumeTimer);

        return () => timers.forEach(t => { clearInterval(t); clearTimeout(t); });
    }, [user, navigate]);

    return (
        <div className="preloader-page">
            <div className="preloader-center">
                <img src="/logocut.png" alt="MIT VPU" className="preloader-logo" />
                <h1 className="preloader-title">MIT Vishwaprayag University</h1>
                <p className="preloader-subtitle">School of Computing — MCA Internship Portal</p>

                <div className="preloader-bar-container">
                    <div className="preloader-bar" style={{ width: `${progress}%` }} />
                </div>
                <span className="preloader-percent">{progress}%</span>
                <span className="preloader-powered">Powered by <strong>Spanda</strong></span>
            </div>
        </div>
    );
}
