import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const EyeIcon = ({ crossed }) => crossed ? (
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
);

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);

const RegisterForm = ({ onSwitchToLogin, googleName = '', googleEmail = '', isGoogle = false }) => {
  const navigate = useNavigate();
  const [step, setStep]                               = useState(1);
  const [otpSent, setOtpSent]                         = useState(false);
  const [showPassword, setShowPassword]               = useState(false);
  const [showConfirm, setShowConfirm]                 = useState(false);

  const [toast, setToast]                             = useState('');

  const [formData, setFormData] = useState({
    name: googleName, email: googleEmail, otp: '',
    password: '', confirm: '',
    exam: '', targetYear: '', city: '', grade: '',
  });

  const update = (field, value) => setFormData(p => ({ ...p, [field]: value }));

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const emailAlreadyExists = async (email) => {
    try {
      const res = await fetch('http://localhost:5000/api/auth/check-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      return data.exists;
    } catch {
      return false;
    }
  };

  // ── Step 1 ──────────────────────────────────────────
  const handleSendOtp = async () => {
    if (!formData.name.trim() || !formData.email.trim()) {
      showToast('Please enter your name and email');
      return;
    }
    const exists = await emailAlreadyExists(formData.email);
    if (exists) {
      showToast('This email is already registered. Please sign in.');
      return;
    }
    showToast('Sending OTP...');
    try {
      const res = await fetch('http://localhost:5000/api/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email }),
      });
      const data = await res.json();
      if (!res.ok) { showToast(data.error || 'Failed to send OTP'); return; }
      setOtpSent(true);
      showToast('OTP sent! Check your email.');
    } catch {
      showToast('Cannot connect to server');
    }
  };

  const handleStep1 = async () => {
    if (isGoogle) {
      const exists = await emailAlreadyExists(formData.email);
      if (exists) {
        showToast('This email is already registered. Please sign in.');
        return;
      }
      setStep(2);
      return;
    }
    const alreadyExists = await emailAlreadyExists(formData.email);
    if (alreadyExists) { showToast('This email is already registered. Please sign in.'); return; }
    if (!otpSent) { showToast('Please send OTP first'); return; }
    if (formData.otp.length !== 6) { showToast('Enter a 6-digit OTP'); return; }

    try {
      const res = await fetch('http://localhost:5000/api/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, otp: formData.otp }),
      });
      const data = await res.json();
      if (!res.ok) { showToast(data.error || 'Incorrect OTP'); return; }
      setStep(2);
    } catch {
      showToast('Cannot connect to server');
    }
  };

  // ── Step 2 ──────────────────────────────────────────
  const handleStep2 = () => {
    if (!formData.password || !formData.confirm) { showToast('Please fill both fields'); return; }
    if (formData.password.length < 6) { showToast('Password must be at least 6 characters'); return; }
    if (formData.password !== formData.confirm) { showToast('Passwords do not match'); return; }
    setStep(3);
  };

  // ── Step 3 ──────────────────────────────────────────
  const handleStep3 = async () => {
    if (!formData.exam || !formData.targetYear || !formData.city || !formData.grade) {
      showToast('Please fill all fields');
      return;
    }

    showToast('Creating account...');

    try {
      const res = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:        formData.name,
          email:       formData.email,
          password:    formData.password,
          examTarget: formData.exam,
          targetYear: formData.targetYear,
          grade:      formData.grade,
          city:       formData.city,
        }),
      });

      const data = await res.json();
      if (!res.ok) { showToast(data.error || 'Registration failed'); return; }

      // Auto-login after registration
      const loginRes = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, password: formData.password }),
      });
      const loginData = await loginRes.json();

      if (loginRes.ok) {
        localStorage.setItem('token', loginData.token);
        const { id, plan } = loginData.user;
        navigate(plan === 'premium' ? `/student-v2/${id}/dashboard` : `/student/${id}/home`, { replace: true });
      } else {
        navigate('/login', { replace: true });
      }
    } catch {
      showToast('Cannot connect to server');
    }
  };

  // ── Step indicator ──────────────────────────────────
  const StepBar = () => (
    <div className="step-bar">
      {[1, 2, 3].map(n => (
        <div key={n} className={`step-item ${step === n ? 'active' : step > n ? 'done' : ''}`}>
          <div className="step-circle">
            {step > n
              ? <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              : n
            }
          </div>
          <span className="step-label">
            {n === 1 ? 'Verify' : n === 2 ? 'Password' : 'Profile'}
          </span>
        </div>
      ))}
      <div className="step-track">
        <div className="step-fill" style={{ width: `${((step - 1) / 2) * 100}%` }} />
      </div>
    </div>
  );


  return (
    <>
      <div className="login-header" style={{ marginBottom: '20px' }}>
        <div className="plan-badge"><span className="plan-badge-dot" />Free Plan — No credit card required</div>
        <div className="login-title">Create your account</div>
      </div>

      <StepBar />

      {/* ── STEP 1 ── */}
      {step === 1 && (
        <div className="step-content">
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <div className="input-wrap">
              <svg className="input-icon" viewBox="0 0 20 20" fill="none" style={isGoogle ? { color: '#4A5568' } : undefined}>
                <circle cx="10" cy="7" r="3" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M3 17c0-3.314 3.134-6 7-6s7 2.686 7 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <input
                type="text"
                className="form-input"
                placeholder="Your full name"
                value={formData.name}
                readOnly={isGoogle}
                onChange={isGoogle ? undefined : e => update('name', e.target.value)}
                style={isGoogle ? { cursor: 'default', background: '#f4f5f7', borderColor: 'rgba(15,31,61,0.15)', color: '#4A5568' } : undefined}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div className={`input-wrap${isGoogle ? '' : ' input-wrap--btn'}`}>
              <svg className="input-icon" viewBox="0 0 20 20" fill="none" style={isGoogle ? { color: '#4A5568' } : undefined}>
                <path d="M2.5 5.833A1.667 1.667 0 014.167 4.167h11.666A1.667 1.667 0 0117.5 5.833v8.334a1.667 1.667 0 01-1.667 1.666H4.167A1.667 1.667 0 012.5 14.167V5.833z" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M2.5 6.667l7.5 5 7.5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <input
                type="email"
                className={`form-input${isGoogle ? '' : ` form-input--has-action ${formData.email && isValidEmail(formData.email) ? 'form-input--valid' : formData.email ? 'form-input--error' : ''}`}`}
                placeholder="you@example.com"
                value={formData.email}
                readOnly={isGoogle}
                onChange={isGoogle ? undefined : e => update('email', e.target.value)}
                style={isGoogle ? { cursor: 'default', background: '#f4f5f7', borderColor: 'rgba(15,31,61,0.15)', color: '#4A5568' } : undefined}
              />
              {isGoogle ? (
                <span className="input-valid-check">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <circle cx="7" cy="7" r="6" fill="#9ca3af"/>
                    <path d="M4 7l2 2 4-4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
              ) : (
                <>
                  {formData.email && isValidEmail(formData.email) && (
                    <span className="input-valid-check">
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <circle cx="7" cy="7" r="6" fill="#22c55e"/>
                        <path d="M4 7l2 2 4-4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </span>
                  )}
                  <button type="button" className="input-action-btn" onClick={handleSendOtp} disabled={!isValidEmail(formData.email)}>
                    {otpSent ? 'Resend' : 'Send OTP'}
                  </button>
                </>
              )}
            </div>
          </div>

          {!isGoogle && otpSent && (
            <div className="form-group">
              <label className="form-label">Enter OTP</label>
              <div className="input-wrap">
                <svg className="input-icon" viewBox="0 0 20 20" fill="none">
                  <rect x="3" y="8" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M7 8V6a3 3 0 016 0v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  <circle cx="10" cy="13" r="1.5" fill="currentColor"/>
                </svg>
                <input
                  type="text"
                  inputMode="numeric"
                  className="form-input otp-input"
                  placeholder="6-digit OTP"
                  maxLength={6}
                  value={formData.otp}
                  onChange={e => update('otp', e.target.value.replace(/\D/g, ''))}
                />
              </div>
            </div>
          )}

          {isGoogle && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 14px', background: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0', marginBottom: '14px', marginTop: '29px' }}>
              <svg width="12" height="12" viewBox="0 0 18 18" fill="none" style={{ flexShrink: 0 }}>
                <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
                <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
              </svg>
              <span style={{ fontSize: '13px', color: '#15803cd3', fontWeight: 500 }}>Email verified with Google — details auto-filled</span>
            </div>
          )}

          <button className="btn-primary" style={{ marginTop: isGoogle ? '0' : '8px' }} onClick={handleStep1}>
            Next →
          </button>

          {!isGoogle && (
            <>
              <div className="divider" style={{ margin: '18px 0' }}><span>or</span></div>
              <button className="social-btn" onClick={() => window.location.href = 'http://localhost:5000/api/auth/google'}>
                <svg className="social-icon" viewBox="0 0 18 18" fill="none">
                  <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                  <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
                  <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                  <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </button>
            </>
          )}
        </div>
      )}

      {/* ── STEP 2 ── */}
      {step === 2 && (
        <div className="step-content">
          <div className="step-hint">Set your Studyverse password for <strong>{formData.email}</strong></div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="input-wrap">
              <svg className="input-icon" viewBox="0 0 20 20" fill="none">
                <rect x="3.333" y="9.167" width="13.334" height="9.166" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M6.667 9.167V6.667a3.333 3.333 0 016.666 0v2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <input type={showPassword ? 'text' : 'password'} className="form-input form-input--has-eye" placeholder="Min 6 characters" value={formData.password} onChange={e => update('password', e.target.value)} />
              <button type="button" className="eye-btn" onClick={() => setShowPassword(p => !p)}><EyeIcon crossed={showPassword} /></button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Confirm Password</label>
            <div className="input-wrap">
              <svg className="input-icon" viewBox="0 0 20 20" fill="none">
                <rect x="3.333" y="9.167" width="13.334" height="9.166" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M6.667 9.167V6.667a3.333 3.333 0 016.666 0v2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <input type={showConfirm ? 'text' : 'password'} className="form-input form-input--has-eye" placeholder="Repeat password" value={formData.confirm} onChange={e => update('confirm', e.target.value)} />
              <button type="button" className="eye-btn" onClick={() => setShowConfirm(p => !p)}><EyeIcon crossed={showConfirm} /></button>
            </div>
          </div>

          <div className="step-nav" style={{ marginTop: '32px' }}>
            <button className="btn-back" onClick={() => setStep(1)}>← Back</button>
            <button className="btn-primary btn-primary--grow" onClick={handleStep2}>Save Password →</button>
          </div>
        </div>
      )}

      {/* ── STEP 3 ── */}
      {step === 3 && (
        <div className="step-content">
          <div className="step-hint">Almost done! Tell us about your preparation.</div>

          <div className="form-group">
            <label className="form-label">Target Exam</label>
            <div className="input-wrap">
              <svg className="input-icon" viewBox="0 0 20 20" fill="none">
                <path d="M10 2l2.4 4.8 5.6.8-4 3.9.9 5.5L10 14.5l-4.9 2.5.9-5.5L2 7.6l5.6-.8L10 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
              </svg>
              <select className="form-input form-select" value={formData.exam} onChange={e => update('exam', e.target.value)}>
                <option value="">Select exam</option>
                <option>JEE Mains</option>
                <option>JEE Advanced</option>
                <option>NEET</option>
                <option>UPSC</option>
                <option>Other</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Target Year</label>
            <div className="input-wrap">
              <svg className="input-icon" viewBox="0 0 20 20" fill="none">
                <rect x="3" y="4" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M3 8h14M8 4V2M12 4V2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <select className="form-input form-select" value={formData.targetYear} onChange={e => update('targetYear', e.target.value)}>
                <option value="">Select year</option>
                <option>2026</option>
                <option>2027</option>
                <option>2028</option>
              </select>
            </div>
          </div>

          <div className="form-row-two">
            <div className="form-group">
              <label className="form-label">City</label>
              <div className="input-wrap">
                <svg className="input-icon" viewBox="0 0 20 20" fill="none">
                  <path d="M10 2C7.24 2 5 4.24 5 7c0 4 5 11 5 11s5-7 5-11c0-2.76-2.24-5-5-5z" stroke="currentColor" strokeWidth="1.5"/>
                  <circle cx="10" cy="7" r="1.5" stroke="currentColor" strokeWidth="1.5"/>
                </svg>
                <input type="text" className="form-input" placeholder="Your city" value={formData.city} onChange={e => update('city', e.target.value)} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Class / Grade</label>
              <div className="input-wrap">
                <svg className="input-icon" viewBox="0 0 20 20" fill="none">
                  <path d="M3 5h14M3 10h14M3 15h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                <select className="form-input form-select" value={formData.grade} onChange={e => update('grade', e.target.value)}>
                  <option value="">Select</option>
                  <option>11</option>
                  <option>12</option>
                  <option>Dropper</option>
                  <option>Other</option>
                </select>
              </div>
            </div>
          </div>

          <div className="step-nav" style={{ marginTop: '13px' }}>
            <button className="btn-back" onClick={() => setStep(2)}>← Back</button>
            <button className="btn-primary btn-primary--grow" onClick={handleStep3}>Create Account →</button>
          </div>
        </div>
      )}

      <div className="signup-row" style={{ marginTop: '16px' }}>
        Already have an account? <a href="#" onClick={(e) => { e.preventDefault(); onSwitchToLogin(); }}>Sign in →</a>
      </div>

      {toast && (
        <div className="toast show" style={{ background: '#0F1F3D', color: '#fff' }}>
          <div className="toast-pip" />
          <span style={{ color: '#fff' }}>{toast}</span>
        </div>
      )}
    </>
  );
};

export default RegisterForm;
