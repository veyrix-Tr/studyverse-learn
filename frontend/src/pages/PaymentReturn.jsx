// pages/PaymentReturn.jsx
// Landing page after Cashfree redirects the browser back following a payment.
// Reads userId + order_id from the query string, asks the backend to verify the
// order (it applies the plan/session only if Cashfree confirms the order is
// actually PAID), then nudges the user back into the app.

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { homeForRole, getTokenPayload } from '../App';

const fetchWithTimeout = (url, options = {}, timeoutMs = 12000) => {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  return fetch(url, { ...options, signal: ctrl.signal })
    .finally(() => clearTimeout(timer));
};

const PaymentReturn = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const orderId = searchParams.get('order_id');
  const userIdFromUrl = searchParams.get('userId');
  const [state, setState] = useState('verifying'); // verifying | success | error
  const [detail, setDetail] = useState('');
  const [goalInfo, setGoalInfo] = useState(null);   // { goal, plan } from verify

  const api = import.meta.env.VITE_API_URL;
  const token = localStorage.getItem('token');

  const onPaid = useCallback(async () => {
    const t = localStorage.getItem('token');
    if (t) {
      try {
        const res = await fetchWithTimeout(`${api}/api/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` },
        });
        const data = await res.json();
        if (data.token) {
          localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify(data.user));
        }
      } catch { /* keep prior session if refresh fails */ }
    }
    setState('success');
  }, [api]);

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
        const res = await fetchWithTimeout(`${api}/api/payment/${pro}/verify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ orderId }),
        });
        const data = await res.json();
        if (cancelled) return;
        if (data.paid) {
          setGoalInfo({ goal: data.goal, plan: data.plan });
          return onPaid();
        }
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

    verify(0);
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, userIdFromUrl, api, token, onPaid]);

  const goHome = () => {
    const payload = getTokenPayload();
    const id = payload?.id;
    if (!id) { navigate('/'); return; }
    if (isSession) navigate(`/student/${id}/sessions`);
    else navigate(homeForRole(payload.role, id));
  };

  const isSession = goalInfo?.goal === 'session';
  const heading = state === 'success'
    ? (isSession ? 'Session requested!' : 'Payment successful!')
    : state === 'error' ? 'Payment not confirmed' : 'Confirming your payment…';
  const subText = state === 'success'
    ? (isSession
        ? 'Your 1-on-1 session request has been received. We\'ll reach out within 24 hours to confirm the time.'
        : (goalInfo?.plan ? `Your ${goalInfo.plan} plan is now active.` : 'Your plan is now active.'))
    : state === 'error'
      ? (detail || 'Something went wrong while confirming your payment.')
      : 'Please wait a moment while we confirm your order with the gateway.';

  return (
    <div className="pr-page">
      <style>{`
        .pr-page{min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;background:linear-gradient(135deg,#FDF8F0 0%,#F5EAD3 55%,#EAD9BC 100%);font-family:'Segoe UI',system-ui,-apple-system,sans-serif}
        .pr-card{width:100%;max-width:430px;background:#fff;border-radius:22px;box-shadow:0 30px 70px rgba(15,31,61,.18);overflow:hidden;text-align:center}
        .pr-top{height:6px;background:linear-gradient(90deg,#E8A830,#0F1F3D)}
        .pr-body{padding:40px 34px 34px}
        .pr-icon{width:72px;height:72px;margin:0 auto 20px;border-radius:50%;display:flex;align-items:center;justify-content:center;position:relative}
        .pr-spinner{width:72px;height:72px;border-radius:50%;border:5px solid rgba(232,168,48,.2);border-top-color:#E8A830;animation:prSpin 1s linear infinite}
        @keyframes prSpin{to{transform:rotate(360deg)}}
        .pr-icon-ok{background:#16A34A;color:#fff;font-size:32px;animation:prPop .4s ease}
        .pr-icon-err{background:#DC2626;color:#fff;font-size:28px;animation:prPop .4s ease}
        @keyframes prPop{0%{transform:scale(.5);opacity:0}100%{transform:scale(1);opacity:1}}
        .pr-h{font-size:20px;font-weight:700;color:#0F1F3D;margin:0 0 10px}
        .pr-s{font-size:14px;line-height:1.65;color:#5A6B84;margin:0 0 24px}
        .pr-order{font-size:12px;color:#9AA6B8;background:#F4F6FA;border-radius:8px;padding:8px 12px;display:inline-block;margin-bottom:24px}
        .pr-btn{width:100%;padding:13px 0;border:none;border-radius:12px;font-size:14.5px;font-weight:600;color:#fff;cursor:pointer;transition:transform .12s ease,box-shadow .12s ease}
        .pr-btn:hover{transform:translateY(-1px)}
        .pr-btn-gold{background:#E8A830;box-shadow:0 8px 18px rgba(232,168,48,.35)}
        .pr-btn-navy{background:#0F1F3D;box-shadow:0 8px 18px rgba(15,31,61,.25)}
        .pr-note{font-size:12px;color:#9AA6B8;margin-top:16px}
        .pr-brand{display:flex;align-items:center;justify-content:center;gap:8px;margin-bottom:6px}
        .pr-brand-mark{width:30px;height:30px;border-radius:9px;background:linear-gradient(135deg,#E8A830,#0F1F3D);color:#fff;font-weight:800;font-size:15px;display:flex;align-items:center;justify-content:center}
        .pr-brand-name{font-weight:800;color:#0F1F3D;letter-spacing:.02em}
      `}</style>

      <div className="pr-card">
        <div className="pr-top" />
        <div className="pr-body">
          <div className="pr-brand">
            <div className="pr-brand-mark">S</div>
            <div className="pr-brand-name">Studyverse</div>
          </div>

          <div className="pr-icon">
            {state === 'verifying' && <div className="pr-spinner" />}
            {state === 'success' && <div className="pr-icon-ok">✓</div>}
            {state === 'error' && <div className="pr-icon-err">!</div>}
          </div>

          <h3 className="pr-h">{heading}</h3>
          <p className="pr-s">{subText}</p>

          {orderId && <div className="pr-order">Order ID · {orderId}</div>}

          {state === 'verifying' && (
            <>
              <button className="pr-btn pr-btn-gold" disabled style={{ opacity: 0.6, cursor: 'default' }}>Checking…</button>
              <div className="pr-note">If this takes too long, your payment will be confirmed automatically.</div>
            </>
          )}
          {state === 'success' && (
            <>
              <button className="pr-btn pr-btn-gold" onClick={goHome}>Continue →</button>
              <div className="pr-note">{isSession ? 'You can track the status on the Sessions page.' : 'Your access is now unlocked.'}</div>
            </>
          )}
          {state === 'error' && (
            <>
              <button className="pr-btn pr-btn-navy" onClick={goHome}>Back to dashboard</button>
              <div className="pr-note">Already paid? Your confirmation will still arrive shortly.</div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentReturn;
