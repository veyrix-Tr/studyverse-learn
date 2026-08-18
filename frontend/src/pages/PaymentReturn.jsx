// pages/PaymentReturn.jsx
// Landing page after Cashfree redirects the browser back following a payment.
// Reads userId + order_id from the query string, asks the backend to verify the
// order (it applies the plan/session only if Cashfree confirms the order is
// actually PAID), then nudges the user back into the app.

import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { homeForRole, getTokenPayload } from '../App';

const PaymentReturn = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const orderId = searchParams.get('order_id');
  const userIdFromUrl = searchParams.get('userId');
  const [state, setState] = useState('verifying'); // verifying | success | error
  const [detail, setDetail] = useState('');

  const api = import.meta.env.VITE_API_URL;
  const token = localStorage.getItem('token');

  useEffect(() => {
    let cancelled = false;
    const payload = getTokenPayload();
    const pro = userIdFromUrl || payload?.id;
    if (!orderId || !token) { setState('error'); setDetail('Missing order or session. Please try again.'); return; }
    if (!pro) { setState('error'); setDetail('Please log in to continue.'); return; }

    // The gateway can take a beat to propagate an order as PAID; retry a few times
    // before declaring failure so we don't flash "failed" right after paying.
    const verify = async (attempt) => {
      try {
        const res = await fetch(`${api}/api/payment/${pro}/verify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ orderId }),
        });
        const data = await res.json();
        if (cancelled) return;
        if (data.paid) return onPaid();
        if (attempt < 3) {
          setTimeout(() => verify(attempt + 1), 2000);
        } else {
          setState('error');
          setDetail(data.error || 'Payment is still pending. If you paid, it will be confirmed shortly.');
        }
      } catch {
        if (cancelled) return;
        if (attempt < 3) setTimeout(() => verify(attempt + 1), 2000);
        else { setState('error'); setDetail('We could not verify the payment. Check your email for a receipt.'); }
      }
    };

    // Success: refresh the JWT so the app sees the new plan — no logout needed.
    const onPaid = async () => {
      try {
        const res = await fetch(`${api}/api/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (cancelled) return;
        if (data.token) {
          localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify(data.user));
        }
      } catch { /* keep prior session if refresh fails */ }
      if (cancelled) return;
      setState('success');
    };

    verify(0);
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, userIdFromUrl, api, token]);

  const goHome = () => {
    const payload = getTokenPayload();
    navigate(payload ? homeForRole(payload.role, payload.id) : '/');
  };

  const fullHeight = { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--cream, #FDF8F0)' };

  return (
    <div style={fullHeight}>
      <div style={{ maxWidth: 420, width: '100%', margin: '0 20px', background: '#fff', borderRadius: 18, padding: 28, boxShadow: '0 24px 60px rgba(0,0,0,0.25)', textAlign: 'center' }}>
        {state === 'verifying' && (
          <>
            <div style={{ fontSize: 30 }}>⏳</div>
            <h3>Verifying payment…</h3>
            <p style={{ color: '#4A5568', fontSize: 14 }}>Confirming your {orderId ? 'order' : ''} with the payment gateway.</p>
          </>
        )}
        {state === 'success' && (
          <>
            <div style={{ width: 54, height: 54, margin: '0 auto 14px', borderRadius: '50%', background: '#16A34A', color: '#fff', fontSize: 26, lineHeight: '54px' }}>✓</div>
            <h3>Payment successful!</h3>
            <p style={{ color: '#4A5568', fontSize: 14 }}>Your plan has been activated.</p>
            <button onClick={goHome} style={{ marginTop: 16, width: '100%', padding: '12px 0', borderRadius: 10, border: 'none', background: '#E8A830', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Continue →</button>
          </>
        )}
        {state === 'error' && (
          <>
            <div style={{ width: 54, height: 54, margin: '0 auto 14px', borderRadius: '50%', background: '#DC2626', color: '#fff', fontSize: 24, lineHeight: '54px' }}>!</div>
            <h3>Payment not confirmed</h3>
            <p style={{ color: '#4A5568', fontSize: 14 }}>{detail}</p>
            <button onClick={goHome} style={{ marginTop: 16, width: '100%', padding: '12px 0', borderRadius: 10, border: 'none', background: '#0F1F3D', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Back to dashboard</button>
          </>
        )}
      </div>
    </div>
  );
};

export default PaymentReturn;