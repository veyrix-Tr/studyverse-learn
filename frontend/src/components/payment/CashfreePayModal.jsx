// components/payment/CashfreePayModal.jsx
// Reusable modal that drives the whole Cashfree checkout for two goals:
//   mode 'plan'    → upgrade to a paid plan (Forge / Apex / Anchor)
//   mode 'session' → pay ₹99 for a 1-on-1 session booking
//
// Flow: create order (backend) → open Cashfree SDK → verify (backend) → success.
// On a plan upgrade the JWT plan must refresh, so we offer a re-login CTA.

import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { openCheckout } from '../../utils/cashfree';
import './CashfreePayModal.css';

const DEFAULT_PLAN_PRICING = { forge: 999, apex: 2499, anchor: 799 };

const CashfreePayModal = ({
  open,
  onClose,
  mode = 'plan',
  plan = 'forge',
  sessionData = {},
  userId,
  onSuccess,
}) => {
  const navigate = useNavigate();
  const [stage, setStage] = useState('idle'); // idle | processing | success | error
  const [errorMsg, setErrorMsg] = useState('');
  const [planPricing, setPlanPricing] = useState(DEFAULT_PLAN_PRICING);
  const [sessionPrice, setSessionPrice] = useState(99);
  const [phone, setPhone] = useState('');

  const token = localStorage.getItem('token');
  const api = import.meta.env.VITE_API_URL;

  // Pull authoritative prices from the backend so the UI never shows a stale price.
  useEffect(() => {
    fetch(`${api}/api/payment/config`)
      .then(r => r.ok ? r.json() : null)
      .then(cfg => {
        if (cfg && cfg.plans) setPlanPricing(cfg.plans);
        if (cfg && cfg.sessionPrice) setSessionPrice(cfg.sessionPrice);
      })
      .catch(() => { /* keep defaults */ });
  }, [api]);

  const reset = useCallback(() => {
    setStage('idle');
    setErrorMsg('');
  }, []);

  // Reset the form each time the modal is opened (adjust state during render,
  // the React-sanctioned pattern for deriving state from a prop change).
  const [lastOpen, setLastOpen] = useState(open);
  if (open !== lastOpen) {
    setLastOpen(open);
    if (open) { reset(); setPhone(sessionData.phone || ''); }
  }

  const price = mode === 'plan' ? (planPricing[plan] || DEFAULT_PLAN_PRICING[plan]) : sessionPrice;
  const title = mode === 'plan' ? `Upgrade to ${plan.charAt(0).toUpperCase() + plan.slice(1)}` : 'Book a 1-on-1 Session';
  const detail = mode === 'plan'
    ? `You're all set to start your ${plan} plan. Complete the payment to activate it.`
    : `One focused 60-minute session with a faculty member. ₹${sessionPrice} one-time.`;

  const handlePay = async () => {
    if (!token) { setErrorMsg('Please log in first.'); setStage('error'); return; }
    if (!/^\d{10}$/.test(phone.replace(/\D/g, ''))) {
      setErrorMsg('Please enter a valid 10-digit phone number.'); setStage('error'); return;
    }
    setStage('processing');
    setErrorMsg('');

    try {
      const endpoint = mode === 'plan' ? 'create-plan-order' : 'create-session-order';
      const body = mode === 'plan'
        ? { plan, phone }
        : { topic: sessionData.topic, phone: phone.replace(/\D/g, ''), preferredTime: sessionData.preferredTime };

      const res = await fetch(`${api}/api/payment/${userId}/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not start payment');

      await openCheckout({
        paymentSessionId: data.payment_session_id,
        mode: data.mode,
        onSuccess: () => handleVerify(data.order_id),
        onFailure: () => { setErrorMsg('Payment was not completed. You can try again.'); setStage('error'); },
      });
    } catch (err) {
      setErrorMsg(err.message || 'Something went wrong.');
      setStage('error');
    }
  };

  const handleVerify = async (orderId) => {
    try {
      const res = await fetch(`${api}/api/payment/${userId}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ orderId }),
      });
      const data = await res.json();
      if (data.paid) {
        setStage('success');
        onSuccess && onSuccess(data);
      } else {
        setErrorMsg('Payment is still pending. If you paid, it will be confirmed shortly.');
        setStage('error');
      }
    } catch {
      setErrorMsg('We could not verify the payment. Check your email for a receipt.');
      setStage('error');
    }
  };

  const handleRelogin = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/', { replace: true });
  };

  if (!open) return null;

  return (
    <div className="cf-overlay" onClick={e => e.target.classList.contains('cf-overlay') && onClose()}>
      <div className="cf-modal">

        {stage === 'idle' && (
          <>
            <div className="cf-title">{title}</div>
            <div className="cf-detail">{detail}</div>
            <div className="cf-price">
              <span className="cf-amount">₹ {price}</span>
              <span className="cf-note">{mode === 'plan' ? '/ month' : 'one-time'}</span>
            </div>
            {mode === 'plan' && (
              <div className="cf-warn">After payment you'll need to log in again to activate your new plan.</div>
            )}
            <div className="cf-phone-field">
              <label className="cf-phone-label" htmlFor="cf-phone">Phone number</label>
              <input
                id="cf-phone"
                className="cf-phone-input"
                type="tel"
                inputMode="numeric"
                placeholder="10-digit mobile number"
                value={phone}
                maxLength={10}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
              />
            </div>
            <div className="cf-actions">
              <button className="cf-btn cf-btn-ghost" onClick={onClose}>Cancel</button>
              <button className="cf-btn cf-btn-gold" onClick={handlePay}>Pay ₹ {price}</button>
            </div>
          </>
        )}

        {stage === 'processing' && (
          <div className="cf-center">
            <div className="cf-spinner" />
            <div className="cf-detail">Opening secure checkout…</div>
            <button className="cf-btn cf-btn-ghost" style={{ marginTop: '16px' }} onClick={reset}>
              Cancel
            </button>
          </div>
        )}

        {stage === 'success' && (
          <div className="cf-center">
            <div className="cf-check">✓</div>
            <div className="cf-title">Payment successful!</div>
            <div className="cf-detail">
              {mode === 'plan'
                ? `Your ${plan} plan is now active.`
                : 'Your session request has been submitted. Our team will reach out within 24 hours.'}
            </div>
            {mode === 'plan' ? (
              <button className="cf-btn cf-btn-gold" onClick={handleRelogin}>Continue →</button>
            ) : (
              <button className="cf-btn cf-btn-gold" onClick={onClose}>Done</button>
            )}
          </div>
        )}

        {stage === 'error' && (
          <div className="cf-center">
            <div className="cf-x">!</div>
            <div className="cf-title">Payment not completed</div>
            <div className="cf-detail">{errorMsg}</div>
            <div className="cf-actions">
              <button className="cf-btn cf-btn-ghost" onClick={onClose}>Close</button>
              <button className="cf-btn cf-btn-gold" onClick={handlePay}>Try Again</button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default CashfreePayModal;
