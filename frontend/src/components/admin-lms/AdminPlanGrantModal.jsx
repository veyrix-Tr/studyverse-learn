import { useEffect, useState } from 'react';

// Superadmin-only panel for changing a student's plan by hand: a time-boxed
// Apex upgrade, an immediate move back to the free Spark plan, or revoking a
// grant that is still running. Also shows the full PlanGrant ledger so past
// paid and comped periods are visible in one place.
const AdminPlanGrantModal = ({ student, adminUserId, onClose, onShowToast, onPlanUpdated }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [current, setCurrent] = useState(null);
  const [grants, setGrants] = useState([]);
  const [action, setAction] = useState('apex');
  const [days, setDays] = useState('7');
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (!student || !adminUserId) return;
    const token = localStorage.getItem('token');
    fetch(`${import.meta.env.VITE_API_URL}/api/admin/${adminUserId}/student/${student.userId}/plan-grants`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => (r.ok ? r.json() : Promise.reject(new Error('Failed to load plan history'))))
      .then(data => {
        setCurrent(data.current);
        setGrants(data.grants || []);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [student, adminUserId]);

  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!student) return null;

  const activeGrant = grants.find(g => g.source === 'manual' && g.status === 'active' && g.durationDays > 0);
  const PLAN_LABEL = { forge: 'Forge', apex: 'Apex', anchor: 'Anchor', spark: 'Spark' };
  // Free students may be put on any plan; an active paid plan can only be
  // upgraded to Apex (or moved back to Spark).
  const isFree = (current?.effectivePlan || 'spark') === 'spark';
  const target = isFree ? action : (action === 'spark' ? 'spark' : 'apex');
  const fmt = d => (d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—');
  const api = (path, body) => fetch(`${import.meta.env.VITE_API_URL}/api/admin/${adminUserId}/student/${student.userId}${path}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
    body: JSON.stringify(body),
  }).then(async r => {
    const data = await r.json();
    if (!r.ok) throw new Error(data.error || 'Request failed');
    return data;
  });

  const apply = async () => {
    setSaving(true);
    setError('');
    try {
      // An active paid plan can only ever go to Apex (or back to Spark).
      const body = target === 'spark'
        ? { plan: 'spark', reason: reason.trim() || null }
        : { plan: target, durationDays: Number(days), reason: reason.trim() || null };
      const next = await api('/plan', body);
      setCurrent(next);
      setReason('');
      setAction('apex');
      onPlanUpdated?.(student.userId, next.plan);
      onShowToast(target === 'spark'
        ? `${student.name} moved to Spark ✓`
        : `${PLAN_LABEL[target]} granted to ${student.name} for ${days} day${Number(days) === 1 ? '' : 's'} ✓`);
      reload();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const revoke = async () => {
    setSaving(true);
    setError('');
    try {
      const next = await api('/plan/revoke', {});
      setCurrent(next);
      onPlanUpdated?.(student.userId, next.plan);
      onShowToast(`Grant revoked — ${student.name} is now on ${next.plan} ✓`);
      reload();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const reload = () => {
    fetch(`${import.meta.env.VITE_API_URL}/api/admin/${adminUserId}/student/${student.userId}/plan-grants`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    })
      .then(r => (r.ok ? r.json() : null))
      .then(data => { if (data) { setCurrent(data.current); setGrants(data.grants || []); } })
      .catch(() => {});
  };

  const statusColor = s => (s === 'active' ? '#22C55E' : s === 'revoked' ? '#EF4444' : s === 'replaced' ? '#F97316' : 'var(--text3)');

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(15,31,61,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '36px 40px', zIndex: 310, backdropFilter: 'blur(6px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background: 'var(--cream)', borderRadius: '18px', width: '560px', maxWidth: '100%', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 28px 70px rgba(15,31,61,0.28)' }}>
        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg,#0F1F3D 0%,#1C2E50 100%)', borderRadius: '18px 18px 0 0', padding: '18px 24px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: '10.5px', color: 'rgba(253,248,240,.45)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: '4px' }}>Plan grant · Superadmin</div>
            <div style={{ fontFamily: 'var(--fs)', fontSize: '19px', fontWeight: 700, color: '#FDF8F0' }}>{student.name}</div>
            <div style={{ fontSize: '12px', color: 'rgba(253,248,240,.55)', marginTop: '3px' }}>{student.examTarget || 'Exam not set'}{student.grade ? ` · Grade ${student.grade}` : ''}</div>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,.1)', border: 'none', borderRadius: '8px', width: '32px', height: '32px', cursor: 'pointer', fontSize: '16px', color: 'rgba(253,248,240,.7)' }}>×</button>
        </div>

        <div style={{ overflowY: 'auto', padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {loading ? (
            <div style={{ fontSize: '13px', color: 'var(--text3)', padding: '20px', textAlign: 'center' }}>Loading plan history…</div>
          ) : (
            <>
              {/* Current state */}
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <Stat label="Current plan" value={current?.effectivePlan || 'spark'} accent />
                <Stat label="Period ends" value={fmt(current?.planEndDate)} />
                {current?.fallbackPlan && <Stat label="Reverts to" value={`${current.fallbackPlan} · ${fmt(current.fallbackEndDate)}`} />}
              </div>

              {/* Actions */}
              <div>
                <SectionTitle>Change plan</SectionTitle>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
                  {isFree ? (
                    <>
                      <Radio active={action === 'forge'} onClick={() => setAction('forge')} title="Assign Forge" sub="Time-boxed grant" />
                      <Radio active={action === 'apex'} onClick={() => setAction('apex')} title="Assign Apex" sub="Time-boxed grant" />
                      <Radio active={action === 'anchor'} onClick={() => setAction('anchor')} title="Assign Anchor" sub="Time-boxed grant" />
                    </>
                  ) : (
                    <Radio active={action === 'apex'} onClick={() => setAction('apex')} title="Upgrade to Apex" sub="Time-boxed grant" />
                  )}
                  <Radio active={action === 'spark'} onClick={() => setAction('spark')} title="Move to Spark" sub="Free plan, immediate" />
                </div>

                {action !== 'spark' && (
                  <label style={{ display: 'block', marginBottom: '12px' }}>
                    <FieldLabel>Duration (days, 1–365)</FieldLabel>
                    <input
                      type="number" min="1" max="365" value={days}
                      onChange={e => setDays(e.target.value)}
                      style={inputStyle}
                    />
                  </label>
                )}

                <label style={{ display: 'block', marginBottom: '14px' }}>
                  <FieldLabel>Reason (kept in the audit log)</FieldLabel>
                  <textarea
                    rows={2} value={reason} placeholder="e.g. Scholarship comp for 15 days"
                    onChange={e => setReason(e.target.value)}
                    style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
                  />
                </label>

                {error && <div style={{ fontSize: '12.5px', color: '#EF4444', marginBottom: '10px' }}>{error}</div>}

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button className="btn btn-gold btn-sm" disabled={saving} onClick={apply}>
                    {saving ? 'Saving…' : target === 'spark' ? 'Move to Spark' : `Grant ${PLAN_LABEL[target]}`}
                  </button>
                  {activeGrant && (
                    <button className="btn btn-ghost btn-sm" disabled={saving} onClick={revoke}>
                      Revoke active grant
                    </button>
                  )}
                  <button className="btn btn-ghost btn-sm" onClick={onClose}>Close</button>
                </div>
              </div>

              {/* History */}
              <div>
                <SectionTitle>Plan history</SectionTitle>
                {grants.length === 0 ? (
                  <div style={{ fontSize: '12.5px', color: 'var(--text3)', padding: '14px', background: 'var(--cream2)', borderRadius: '10px', border: '1px solid var(--b)' }}>
                    No recorded plan grants yet — this student was set up before plan history was tracked.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {grants.map(g => (
                      <div key={g.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: 'var(--cream2)', border: '1px solid var(--b)', borderRadius: '10px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', color: g.plan === 'spark' ? 'var(--text3)' : 'var(--gold)', minWidth: '46px' }}>{g.plan}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '12.5px', color: 'var(--text2)', fontWeight: 600 }}>
                            {g.source === 'paid' ? 'Paid' : `Granted by ${g.grantedByName || 'superadmin'}`}
                            {g.durationDays > 0 ? ` · ${g.durationDays}d` : ''}
                          </div>
                          <div style={{ fontSize: '11.5px', color: 'var(--text3)', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {fmt(g.startDate)} → {fmt(g.endDate)}{g.reason ? ` · ${g.reason}` : ''}
                          </div>
                        </div>
                        <span style={{ fontSize: '10.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', color: statusColor(g.status), flexShrink: 0 }}>{g.status}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const inputStyle = {
  width: '100%', padding: '9px 12px', borderRadius: '8px',
  border: '1px solid var(--b)', background: 'var(--cream2)',
  fontSize: '13.5px', color: 'var(--text)', boxSizing: 'border-box',
};

const FieldLabel = ({ children }) => (
  <span style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '6px' }}>{children}</span>
);

const SectionTitle = ({ children }) => (
  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.09em', marginBottom: '12px' }}>{children}</div>
);

const Stat = ({ label, value, accent }) => (
  <div style={{ flex: '1 1 140px', background: 'var(--cream2)', border: '1px solid var(--b)', borderRadius: '10px', padding: '10px 14px' }}>
    <div style={{ fontSize: '10.5px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: '4px' }}>{label}</div>
    <div style={{ fontFamily: 'var(--fs)', fontSize: '15px', fontWeight: 700, color: accent ? 'var(--gold)' : 'var(--text)', textTransform: accent ? 'uppercase' : 'none' }}>{value}</div>
  </div>
);

const Radio = ({ active, onClick, title, sub }) => (
  <button
    onClick={onClick}
    style={{
      flex: 1, textAlign: 'left', cursor: 'pointer', padding: '10px 12px', borderRadius: '10px',
      border: `2px solid ${active ? 'var(--gold)' : 'var(--b)'}`,
      background: active ? 'var(--gdim)' : 'var(--cream2)',
      color: 'var(--text)',
    }}
  >
    <div style={{ fontSize: '13px', fontWeight: 700 }}>{title}</div>
    <div style={{ fontSize: '11.5px', color: 'var(--text3)', marginTop: '2px' }}>{sub}</div>
  </button>
);

export default AdminPlanGrantModal;
