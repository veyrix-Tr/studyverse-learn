import { useEffect } from 'react';

// The JWT carries the student's plan and the route guards read it from there,
// so a plan change made while the student is sitting on the page — a superadmin
// grant, a revoke, or the expiry sweep dropping them back to Spark — stays
// invisible until the token is re-issued. Re-check every minute; only reload
// when the plan claim actually changed, so the guards can re-route them to the
// right portal without a manual refresh.
const REFRESH_MS = 60000;

const readPlan = (token) => {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64)).plan || 'spark';
  } catch {
    return null;
  }
};

const usePlanRefresh = () => {
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const id = setInterval(() => {
      const current = localStorage.getItem('token');
      if (!current) return clearInterval(id);

      fetch(`${import.meta.env.VITE_API_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${current}` },
      })
        .then(r => (r.ok ? r.json() : null))
        .then(data => {
          if (!data?.token) return;
          const before = readPlan(current);
          const after = readPlan(data.token);
          localStorage.setItem('token', data.token);
          if (before !== after) window.location.reload();
        })
        .catch(() => {});
    }, REFRESH_MS);

    return () => clearInterval(id);
  }, []);
};

export default usePlanRefresh;
