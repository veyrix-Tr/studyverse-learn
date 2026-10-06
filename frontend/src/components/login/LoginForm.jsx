import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const LoginForm = ({ onSwitchToRegister }) => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetOtp, setResetOtp] = useState('');
  const [resetPass, setResetPass] = useState('');
  const [resetConfirm, setResetConfirm] = useState('');
  const [resetSending, setResetSending] = useState(false);
  const [resetOtpSent, setResetOtpSent] = useState(false);
  const [resetOtpVerified, setResetOtpVerified] = useState(false);
  const [resetVerifying, setResetVerifying] = useState(false);
  const [resetMsg, setResetMsg] = useState('');
  const [resetDone, setResetDone] = useState(false);
  const [showEnroll, setShowEnroll] = useState(false);
  const [enrollName, setEnrollName] = useState('');
  const [enrollEmail, setEnrollEmail] = useState('');
  const [enrollSubject, setEnrollSubject] = useState('');
  const [enrollQualification, setEnrollQualification] = useState('');
  const [enrollDepartment, setEnrollDepartment] = useState('');
  const [enrollMsg, setEnrollMsg] = useState('');
  const [enrollSubmitting, setEnrollSubmitting] = useState(false);
  const [enrollDone, setEnrollDone] = useState(false);

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

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    if (!resetEmail) {
      setResetMsg('Please enter your email');
      return;
    }
    setResetSending(true);
    setResetMsg('');
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail }),
      });
      const data = await res.json();
      if (!res.ok) {
        setResetMsg(data.error || 'Something went wrong');
      } else {
        setResetOtp('');
        setResetPass('');
        setResetOtpSent(true);
        setResetOtpVerified(false);
        setResetMsg(data.message || 'OTP sent to your email');
        setShowReset(true);
      }
    } catch {
      setResetMsg('Cannot connect to server');
    } finally {
      setResetSending(false);
    }
  };

  // Step 2 — verify the OTP (does NOT consume it); reveals the password fields
  const handleOtpVerify = async (e) => {
    e.preventDefault();
    if (!resetOtp) {
      setResetMsg('Enter the OTP sent to your email');
      return;
    }
    setResetVerifying(true);
    setResetMsg('');
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail, otp: resetOtp }),
      });
      const data = await res.json();
      if (!res.ok) {
        setResetMsg(data.error || 'Incorrect OTP');
      } else {
        setResetOtpVerified(true);
        setResetPass('');
        setResetConfirm('');
        setResetMsg('');
      }
    } catch {
      setResetMsg('Cannot connect to server');
    } finally {
      setResetVerifying(false);
    }
  };

  // Step 3 — set the new password (OTP was already verified, but backend re-checks it)
  const handleResetSubmit = async (e) => {
    e.preventDefault();
    if (!resetPass || !resetConfirm) {
      setResetMsg('Enter both the new password and its confirmation');
      return;
    }
    if (resetPass.length < 8) {
      setResetMsg('Password must be at least 8 characters long');
      return;
    }
    if (resetPass !== resetConfirm) {
      setResetMsg('Passwords do not match');
      return;
    }
    setResetSending(true);
    setResetMsg('');
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail, otp: resetOtp, password: resetPass }),
      });
      const data = await res.json();
      if (!res.ok) {
        setResetMsg(data.error || 'Something went wrong');
      } else {
        setResetDone(true);
      }
    } catch {
      setResetMsg('Cannot connect to server');
    } finally {
      setResetSending(false);
    }
  };

  const handleEnrollSubmit = async (e) => {
    e.preventDefault();
    if (!enrollName || !enrollEmail || !enrollSubject) {
      setEnrollMsg('Please fill in all required fields');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(enrollEmail)) {
      setEnrollMsg('Please enter a valid email address');
      return;
    }
    setEnrollSubmitting(true);
    setEnrollMsg('');
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/faculty-enroll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: enrollName,
          email: enrollEmail,
          subject: enrollSubject,
          qualification: enrollQualification,
          department: enrollDepartment,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setEnrollMsg(data.error || 'Something went wrong');
      } else {
        setEnrollDone(true);
      }
    } catch {
      setEnrollMsg('Cannot connect to server');
    } finally {
      setEnrollSubmitting(false);
    }
  };

  const closeEnroll = () => {
    setShowEnroll(false);
    setEnrollDone(false);
    setEnrollMsg('');
    setEnrollName('');
    setEnrollEmail('');
    setEnrollSubject('');
    setEnrollQualification('');
    setEnrollDepartment('');
  };

  const closeReset = () => {
    setShowReset(false);
    setResetDone(false);
    setResetOtpSent(false);
    setResetOtpVerified(false);
    setResetMsg('');
    setResetEmail('');
    setResetOtp('');
    setResetPass('');
    setResetConfirm('');
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
          <a href="#" className="forgot-link" onClick={(e) => { e.preventDefault(); setShowReset(true); setResetDone(false); setResetMsg(''); }}>
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

      <div className="signup-row" style={{ marginTop: '8px' }}>
        <a href="#" onClick={(e) => { e.preventDefault(); setShowEnroll(true); setEnrollDone(false); setEnrollMsg(''); }}>
          Are you a faculty member? Enroll here →
        </a>
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

      {showReset && (
        <div className="reset-modal-overlay" onClick={closeReset}>
          <div className="reset-modal" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="reset-modal-close" onClick={closeReset} aria-label="Close">×</button>
            <div className="reset-modal-title">Reset your password</div>

            {resetDone ? (
              <>
                <p className="reset-modal-sub">Password reset successfully. You can now log in with your new password.</p>
                <button type="button" className="btn-primary" style={{ width: '100%' }} onClick={closeReset}>
                  Back to sign in
                </button>
              </>
            ) : (
              <>
                {resetMsg && <p className="reset-msg">{resetMsg}</p>}
                {!resetOtpSent && (
                  <form onSubmit={handleForgotSubmit}>
                    <div className="form-group">
                      <label className="form-label">Email Address</label>
                      <input
                        type="email"
                        className="form-input"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        placeholder="you@example.com"
                        autoComplete="email"
                        required
                      />
                    </div>
                    <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={resetSending}>
                      {resetSending ? 'Sending…' : 'Send OTP'}
                    </button>
                  </form>
                )}
                {resetOtpSent && !resetOtpVerified && (
                  <form onSubmit={handleOtpVerify}>
                    <p className="reset-modal-sub">Enter the 6-digit code sent to {resetEmail}</p>
                    <div className="form-group">
                      <label className="form-label">OTP</label>
                      <input
                        type="text"
                        className="form-input"
                        value={resetOtp}
                        onChange={(e) => setResetOtp(e.target.value)}
                        placeholder="6-digit code"
                        autoComplete="one-time-code"
                        required
                      />
                    </div>
                    <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={resetVerifying}>
                      {resetVerifying ? 'Verifying…' : 'Verify OTP'}
                    </button>
                  </form>
                )}
                {resetOtpVerified && (
                  <form onSubmit={handleResetSubmit}>
                    <p className="reset-modal-sub">OTP verified. Choose your new password.</p>
                    <div className="form-group">
                      <label className="form-label">New Password</label>
                      <input
                        type="password"
                        className="form-input"
                        value={resetPass}
                        onChange={(e) => setResetPass(e.target.value)}
                        placeholder="At least 8 characters"
                        autoComplete="new-password"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Confirm Password</label>
                      <input
                        type="password"
                        className="form-input"
                        value={resetConfirm}
                        onChange={(e) => setResetConfirm(e.target.value)}
                        placeholder="Re-enter your new password"
                        autoComplete="new-password"
                        required
                      />
                    </div>
                    <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={resetSending}>
                      {resetSending ? 'Resetting…' : 'Reset Password'}
                    </button>
                  </form>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {showEnroll && (
        <div className="reset-modal-overlay" onClick={closeEnroll}>
          <div className="reset-modal" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="reset-modal-close" onClick={closeEnroll} aria-label="Close">×</button>
            <div className="reset-modal-title">Faculty Enrollment</div>

            {enrollDone ? (
              <>
                <p className="reset-modal-sub">Application submitted successfully! An admin will review your request. You will receive an email with login credentials once approved.</p>
                <button type="button" className="btn-primary" style={{ width: '100%' }} onClick={closeEnroll}>
                  Back to sign in
                </button>
              </>
            ) : (
              <>
                {enrollMsg && <p className="reset-msg">{enrollMsg}</p>}
                <p className="reset-modal-sub">Fill in your details to request a faculty account. An admin will review and approve your application.</p>
                <form onSubmit={handleEnrollSubmit}>
                  <div className="form-group">
                    <label className="form-label">Full Name *</label>
                    <input
                      type="text"
                      className="form-input"
                      value={enrollName}
                      onChange={(e) => setEnrollName(e.target.value)}
                      placeholder="Dr. Ananya Singh"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email Address *</label>
                    <input
                      type="email"
                      className="form-input"
                      value={enrollEmail}
                      onChange={(e) => setEnrollEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Subject *</label>
                    <select
                      className="form-input"
                      value={enrollSubject}
                      onChange={(e) => setEnrollSubject(e.target.value)}
                      required
                    >
                      <option value="">Select subject</option>
                      <option>Physics</option>
                      <option>Chemistry</option>
                      <option>Mathematics</option>
                      <option>Biology</option>
                      <option>Maths</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Qualification</label>
                    <input
                      type="text"
                      className="form-input"
                      value={enrollQualification}
                      onChange={(e) => setEnrollQualification(e.target.value)}
                      placeholder="Ph.D, M.Sc..."
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Department</label>
                    <input
                      type="text"
                      className="form-input"
                      value={enrollDepartment}
                      onChange={(e) => setEnrollDepartment(e.target.value)}
                      placeholder="Science"
                    />
                  </div>
                  <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={enrollSubmitting}>
                    {enrollSubmitting ? 'Submitting…' : 'Submit Application'}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default LoginForm;
