import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const LoginForm = ({ onSwitchToRegister }) => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    const email    = e.target.email.value;
    const password = e.target.password.value;

    if (!email || !password) {
      triggerToast('Please fill in all fields');
      return;
    }

    setLoading(true);
    setToastMessage('Signing in...');
    setShowToast(true);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setLoading(false);
        triggerToast(data.error || 'Login failed');
        return;
      }

      localStorage.setItem('token', data.token);

      const { id, role, plan } = data.user;
      if (role === 'superadmin')    navigate(`/superadmin/${id}/dashboard`, { replace: true });
      else if (role === 'admin')    navigate(`/admin/${id}/dashboard`, { replace: true });
      else if (role === 'faculty')  navigate(`/faculty/${id}/dashboard`, { replace: true });
      else if (plan === 'apex')    navigate(`/student-v2/${id}/dashboard`, { replace: true });
      else if (plan === 'anchor')  navigate(`/anchor/${id}/dashboard`, { replace: true });
      else                         navigate(`/student/${id}/home`, { replace: true });

    } catch {
      setLoading(false);
      triggerToast('Cannot connect to server');
    }
  };

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  return (
    <>
      <div className="login-header">
        <div className="login-eyebrow">Welcome to Studyverse</div>
        <div className="login-title">Sign in to your account</div>
        <div className="login-sub">Access your personalised JEE preparation dashboard</div>
      </div>

      <div className="free-trial-card">
        <svg className="free-trial-icon" width="28" height="22" viewBox="0 0 30 24" fill="none">
          <rect x="1" y="4" width="28" height="16" rx="3" fill="#64748b" stroke="#64748b" strokeWidth="1"/>
          <rect x="1" y="9" width="28" height="5" fill="#f59e0b"/>
          <text x="7" y="12.8" textAnchor="middle" fill="#000" fontSize="3.2" fontFamily="monospace" fontWeight="bold">1234</text>
          <text x="16" y="12.8" textAnchor="middle" fill="#000" fontSize="3.2" fontFamily="monospace" fontWeight="bold">5678</text>
          <text x="25" y="12.8" textAnchor="middle" fill="#000" fontSize="3.2" fontFamily="monospace" fontWeight="bold">9012</text>
          <path d="M1 23L29 1" stroke="#000" strokeWidth="1.2" strokeLinecap="round"/>
        </svg>
        <div className="free-trial-text">
          <div className="free-trial-title">Start your <span className="free-highlight">free</span> trial</div>
          <div className="free-trial-sub">No credit card required</div>
        </div>
        <svg className="free-trial-arrow" width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M5 12h14M13 5l7 7-7 7" stroke="#d97706" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>

      <form onSubmit={handleLogin}>
        <div className="form-group">
          <label className="form-label">Email Address</label>
          <div className="input-wrap">
            <svg className="input-icon" viewBox="0 0 20 20" fill="none">
              <path d="M2.5 5.833A1.667 1.667 0 014.167 4.167h11.666A1.667 1.667 0 0117.5 5.833v8.334a1.667 1.667 0 01-1.667 1.666H4.167A1.667 1.667 0 012.5 14.167V5.833z" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M2.5 6.667l7.5 5 7.5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <input
              type="email"
              className="form-input"
              name="email"
              placeholder="you@example.com"
              autoComplete="email"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Password</label>
          <div className="input-wrap">
            <svg className="input-icon" viewBox="0 0 20 20" fill="none">
              <rect x="3.333" y="9.167" width="13.334" height="9.166" rx="2" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M6.667 9.167V6.667a3.333 3.333 0 016.666 0v2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <circle cx="10" cy="13.75" r="1.25" fill="currentColor"/>
            </svg>
            <input
              type={showPassword ? 'text' : 'password'}
              className="form-input form-input--has-eye"
              name="password"
              placeholder="Enter your password"
              autoComplete="current-password"
              required
            />
            <button type="button" className="eye-btn" onClick={() => setShowPassword(p => !p)}>
              {showPassword ? (
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                  <path d="M2 10s3-6 8-6 8 6 8 6-3 6-8 6-8-6-8-6z" stroke="currentColor" strokeWidth="1.5"/>
                  <circle cx="10" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M3 3l14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                  <path d="M2 10s3-6 8-6 8 6 8 6-3 6-8 6-8-6-8-6z" stroke="currentColor" strokeWidth="1.5"/>
                  <circle cx="10" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
                </svg>
              )}
            </button>
          </div>
        </div>

        <div className="form-row">
          <label className="remember-label">
            <input type="checkbox" /> Remember me
          </label>
          <a href="#" className="forgot-link" onClick={(e) => { e.preventDefault(); triggerToast('Password reset coming soon!'); }}>
            Forgot password?
          </a>
        </div>

        <button type="submit" className="btn-primary" disabled={loading} style={loading ? { opacity: 0.7, cursor: 'not-allowed' } : undefined}>
          {loading ? 'Signing in…' : 'Sign In'}
          {!loading && (
            <div className="btn-arrow">
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M2 5h6M5.5 2.5L8 5l-2.5 2.5" stroke="#0F1F3D" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          )}
        </button>
      </form>

      <div className="divider"><span>or continue with</span></div>

      <button className="social-btn" onClick={() => window.location.href = `${import.meta.env.VITE_API_URL}/api/auth/google`}>
        <svg className="social-icon" viewBox="0 0 18 18" fill="none">
          <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
          <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
          <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
          <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
        </svg>
        Continue with Google
      </button>

      <div className="signup-row">
        New to Studyverse? <a href="#" onClick={(e) => { e.preventDefault(); onSwitchToRegister(); }}>Create a free account →</a>
      </div>

      <div className="security-note">
        <svg className="lock-icon" width="12" height="12" viewBox="0 0 20 20" fill="none">
          <rect x="3.333" y="9.167" width="13.334" height="9.166" rx="2" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M6.667 9.167V6.667a3.333 3.333 0 016.666 0v2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        256-bit SSL encrypted · Your data is safe
      </div>

      {showToast && (
        <div className="toast show" style={{ background: '#0F1F3D', color: '#fff' }}>
          <div className="toast-pip"></div>
          <span style={{ color: '#fff' }}>{toastMessage}</span>
        </div>
      )}
    </>
  );
};

export default LoginForm;
