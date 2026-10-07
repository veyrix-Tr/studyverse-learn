import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DailyReportForm from '../common/DailyReportForm';
import CashfreePayModal from '../payment/CashfreePayModal';

// Join button — opens the embedded Zoom call room; active 10 min before call, disabled after it ends
const JoinCallButton = ({ userId, callId, scheduledAt, durationMin }) => {
  const navigate = useNavigate();
  const [active, setActive] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!callId) return;
    const check = () => {
      const now = Date.now();
      const start = new Date(scheduledAt).getTime();
      const end   = start + durationMin * 60 * 1000;
      setActive(now >= start - 10 * 60 * 1000 && now <= end);
    };
    check();
    timerRef.current = setInterval(check, 15000);
    return () => clearInterval(timerRef.current);
  }, [scheduledAt, durationMin, callId]);

  if (!callId) return null;

  return (
    <button
      onClick={() => active && navigate(`/anchor/${userId}/call/${callId}`)}
      disabled={!active}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '6px',
        padding: '7px 16px', borderRadius: '8px', fontSize: '12.5px', fontWeight: 700,
        border: 'none', cursor: active ? 'pointer' : 'not-allowed',
        background: active ? 'linear-gradient(135deg,#22C55E,#16a34a)' : 'rgba(234,244,236,0.06)',
        color: active ? '#fff' : 'var(--t4)',
        boxShadow: active ? '0 3px 12px rgba(34,197,94,0.35)' : 'none',
        opacity: active ? 1 : 0.7,
      }}
      title={active ? 'Join Zoom call' : 'Activates 10 minutes before the call'}
    >
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/>
      </svg>
      {active ? 'Join Now' : 'Join Now (opens closer to call)'}
    </button>
  );
};

const HABIT_ICONS = {
  sleep: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#86EFAC" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>,
  study: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#86EFAC" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>,
  revision: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#86EFAC" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>,
  phone: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" stroke="#86EFAC"/><line x1="9" y1="7" x2="15" y2="7" stroke="#86EFAC"/><line x1="9" y1="10" x2="15" y2="10" stroke="#86EFAC"/><circle cx="17" cy="17" r="4" fill="#0A1F12" stroke="#F87171" strokeWidth="1.8"/><line x1="14.5" y1="19.5" x2="19.5" y2="14.5" stroke="#F87171" strokeWidth="1.8"/></svg>,
  problems: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#86EFAC" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>,
};

const HABIT_ITEMS = [
  { key: 'sleep',    name: 'Slept before midnight',              desc: 'Your brain consolidates during sleep.' },
  { key: 'study',    name: 'Studied for at least 4 hours',       desc: 'Focused. Not just open books.' },
  { key: 'revision', name: "Revised yesterday's topics",         desc: '24h revision = 80% better retention.' },
  { key: 'phone',    name: 'No social media during study hours', desc: 'Phone breaks destroy flow state.' },
  { key: 'problems', name: 'Solved at least 10 problems',        desc: 'Competitive exams reward consistent problem-solving.' },
];

const HABIT_KEYS = ['sleep', 'study', 'revision', 'phone', 'problems'];
const HABIT_LABELS = { sleep: 'Sleep', study: 'Study 4h', revision: 'Revision', phone: 'No phone', problems: '10 probs' };

const getTodayIST = () => {
  const ist = new Date(Date.now() + 5.5 * 60 * 60 * 1000);
  return ist.toISOString().slice(0, 10);
};

const computeStreak = (logs) => {
  if (!logs.length) return 0;
  const sorted = [...logs].sort((a, b) => b.date.localeCompare(a.date));
  const today = getTodayIST();
  const yesterday = new Date(Date.now() + 5.5 * 60 * 60 * 1000 - 86400000).toISOString().slice(0, 10);
  if (sorted[0].date !== today && sorted[0].date !== yesterday) return 0;
  let streak = 0;
  let expected = sorted[0].date;
  for (const log of sorted) {
    if (log.date !== expected) break;
    if (!HABIT_KEYS.every(k => log[k] === true)) break;
    streak++;
    const d = new Date(expected);
    d.setDate(d.getDate() - 1);
    expected = d.toISOString().slice(0, 10);
  }
  return streak;
};

const fmtDate = (iso) => {
  // Date-only strings (YYYY-MM-DD) are treated as UTC midnight by Date; appending IST time
  // ensures the displayed date matches the IST date the note/call was created.
  const normalized = /^\d{4}-\d{2}-\d{2}$/.test(iso) ? iso + 'T05:30:00' : iso;
  const d = new Date(normalized);
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
};
const fmtTime = (iso) => new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' });
const timeAgo = (iso) => {
  const s = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return Math.floor(s / 60) + 'm ago';
  if (s < 86400) return Math.floor(s / 3600) + 'h ago';
  if (s < 604800) return Math.floor(s / 86400) + 'd ago';
  return fmtDate(iso);
};

const NotifTypeMeta = {
  'Motivational Note': { color: '#86EFAC', bg: 'rgba(134,239,172,.10)', icon: '💬', page: 'notes'      },
  'Reminder':          { color: '#93C5FD', bg: 'rgba(147,197,253,.10)', icon: '📞', page: 'calls'      },
  'Announcement':      { color: '#E8A830', bg: 'rgba(232,168,48,.10)',  icon: '📢', page: 'dashboard'  },
  'Feedback':          { color: '#86EFAC', bg: 'rgba(134,239,172,.08)', icon: '📋', page: 'history'    },
  'Diagnostic':        { color: '#FBBF24', bg: 'rgba(251,191,36,.10)',  icon: '🎯', page: 'diagnostic' },
};

const AnchorContent = ({
  activePage, onNav, onShowToast,
  habitLogs = [], onHabitSaved,
  resources = [], dailyReports = [],
  mentorNotes = [], mentorCalls = [],
  sessions = [],
  notifications = [], onMarkNotifRead, onMarkAllNotifRead,
  profile, onReportSubmitted,
}) => {
  const { id: userId } = useParams();
  const navigate = useNavigate();
  const pg = (name) => `page${activePage === name ? ' on' : ''}`;
  const mentorName = profile?.studentProfile?.mentor?.user?.name || null;
  const mentorFirst = mentorName ? mentorName.split(' ')[0] : 'your mentor';
  const mentorInitial = mentorName ? mentorName[0].toUpperCase() : '?';

  const [resTab, setResTab] = useState(0);
  const [openSections, setOpenSections] = useState(new Set());
  const [notifFilter, setNotifFilter] = useState('all');

  // Payment modal state for plan upgrades
  const [payModal, setPayModal] = useState({ open: false, mode: 'plan', plan: 'forge' });

  const openPlanCheckout = (planName) => setPayModal({ open: true, mode: 'plan', plan: planName });

  const toggleSection = (key) => setOpenSections(prev => {
    const next = new Set(prev);
    next.has(key) ? next.delete(key) : next.add(key);
    return next;
  });

  // ── Habits ────────────────────────────────────────────────────────────────
  const [habitState, setHabitState] = useState({});
  const [habitSaving, setHabitSaving] = useState(false);

  const today = getTodayIST();
  const todayLog = habitLogs.find(l => l.date === today) || null;
  const alreadyCheckedIn = !!todayLog;
  const streak = computeStreak(habitLogs);

  const effectiveState = alreadyCheckedIn
    ? Object.fromEntries(HABIT_KEYS.map(k => [k, todayLog[k] ? 'yes' : 'no']))
    : habitState;
  const habitCount = alreadyCheckedIn
    ? HABIT_KEYS.filter(k => todayLog[k]).length
    : Object.keys(habitState).filter(k => habitState[k] === 'yes').length;
  const allHabitsDone = Object.keys(habitState).length === 5;

  const logHabit = (key, val) => { if (!alreadyCheckedIn) setHabitState(p => ({ ...p, [key]: val })); };
  const saveHabits = async () => {
    if (habitSaving || alreadyCheckedIn) return;
    setHabitSaving(true);
    const token = localStorage.getItem('token');
    try {
      const body = Object.fromEntries(HABIT_KEYS.map(k => [k, habitState[k] === 'yes']));
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/student/${userId}/habits`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      onHabitSaved?.(data.log);
      setHabitState({});
      onShowToast('Check-in saved for today ✓');
    } catch { onShowToast('Failed to save. Try again.'); }
    finally { setHabitSaving(false); }
  };

  const logMap = Object.fromEntries(habitLogs.map(l => [l.date, l]));
  const hdRow = HABIT_KEYS.map(k => {
    const dots = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(Date.now() + 5.5 * 60 * 60 * 1000 - i * 86400000);
      const ds = d.toISOString().slice(0, 10);
      if (ds === today && !alreadyCheckedIn) dots.push('t');
      else if (logMap[ds]) dots.push(logMap[ds][k] ? 'y' : 'n');
      else dots.push('e');
    }
    return { label: HABIT_LABELS[k], dots };
  });

  // ── Daily-report stats ────────────────────────────────────────────────────
  const drStreak = (() => {
    if (!dailyReports.length) return 0;
    const sorted = [...dailyReports].sort((a, b) => b.date.localeCompare(a.date));
    const yesterday = new Date(Date.now() + 5.5 * 60 * 60 * 1000 - 86400000).toISOString().slice(0, 10);
    let exp = sorted[0]?.date === today ? today : yesterday;
    let s = 0;
    for (const r of sorted) {
      if (r.date !== exp) break;
      s++;
      const dd = new Date(exp + 'T00:00:00'); dd.setDate(dd.getDate() - 1);
      exp = dd.toISOString().slice(0, 10);
    }
    return s;
  })();

  const drLast7 = (() => {
    const cutoff = new Date(Date.now() + 5.5 * 60 * 60 * 1000 - 6 * 86400000).toISOString().slice(0, 10);
    return dailyReports.filter(r => r.date >= cutoff);
  })();
  const drAvgHrs = drLast7.length
    ? (drLast7.reduce((s, r) => s + (r.hrsPhysics || 0) + (r.hrsChemistry || 0) + (r.hrsThird || 0), 0) / drLast7.length).toFixed(1)
    : null;
  const drAvgFocus = drLast7.length
    ? (drLast7.reduce((s, r) => s + r.focusQuality, 0) / drLast7.length).toFixed(1)
    : null;
  const drQsSolved7 = drLast7.reduce((s, r) => s + (r.questionsSolved || 0), 0);

  // ── Month grid ────────────────────────────────────────────────────────────
  const nowIST = new Date(Date.now() + 5.5 * 60 * 60 * 1000);
  const cyear = nowIST.getUTCFullYear();
  const cmonth = nowIST.getUTCMonth();
  const daysInMonth = new Date(cyear, cmonth + 1, 0).getDate();
  const todayDay = nowIST.getUTCDate();
  const reportDateSet = new Set(dailyReports.map(r => r.date));
  const todayDRDone = reportDateSet.has(today);
  const monthLabel = nowIST.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  let submittedThisMonth = 0;
  const monthDays = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const ds = cyear + '-' + String(cmonth + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0');
    let s = 'future';
    if (ds === today) { s = todayDRDone ? 'logged' : 'today'; }
    else if (ds < today) { s = reportDateSet.has(ds) ? 'logged' : 'missed'; }
    if (s === 'logged') submittedThisMonth++;
    monthDays.push({ d, s });
  }
  const ringPct = todayDay > 0 ? Math.round((submittedThisMonth / todayDay) * 100) : 0;

  // ── Calls ─────────────────────────────────────────────────────────────────
  const now = new Date();
  const callEndsAt = (c) => new Date(c.scheduledAt).getTime() + c.durationMin * 60 * 1000;
  const upcomingCalls = mentorCalls.filter(c => !c.completed && callEndsAt(c) > now)
    .sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt));
  const pastCalls = mentorCalls.filter(c => c.completed || callEndsAt(c) <= now)
    .sort((a, b) => new Date(b.scheduledAt) - new Date(a.scheduledAt));
  const nextCall = upcomingCalls[0] || null;

  // ── Live classes (mentor → mentee Zoom sessions) ─────────────────────────
  const sessionEndsAt = (s) => new Date(s.scheduledAt).getTime() + (s.duration || 45) * 60 * 1000;
  const liveNow = (s) => {
    const t = new Date(s.scheduledAt).getTime();
    return now.getTime() >= t && now.getTime() <= sessionEndsAt(s);
  };
  // Students can join shortly before the session starts (and while it's live),
  // but not hours/days ahead — the Zoom meeting won't have started yet.
  const JOIN_WINDOW_MIN = 30;
  const canJoin = (s) => now.getTime() >= new Date(s.scheduledAt).getTime() - JOIN_WINDOW_MIN * 60 * 1000;
  const upcomingSessions = (Array.isArray(sessions) ? sessions : []).filter(s => s.hasZoom && sessionEndsAt(s) > now)
    .sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt));
  const nextSession = upcomingSessions[0] || null;

  // ── Latest mentor note ────────────────────────────────────────────────────
  const latestNote = mentorNotes[0] || null;

  // ── Notifications ─────────────────────────────────────────────────────────
  const unreadCount = notifications.filter(n => !n.readAt).length;
  const filteredNotifs = notifFilter === 'unread' ? notifications.filter(n => !n.readAt) : notifications;

  return (
    <div className="content">

      {/* ══════════ DASHBOARD ══════════ */}
      <div className={pg('dashboard')}>
        {/* Header */}
        <div style={{ marginBottom: '22px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '.1em', fontWeight: 600, marginBottom: '4px' }}>
              {new Date(Date.now() + 5.5 * 60 * 60 * 1000).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
            <div style={{ fontFamily: 'var(--fs)', fontSize: '24px', fontWeight: 700, color: 'var(--t1)' }}>
              {(() => { const h = new Date(Date.now() + 5.5 * 60 * 60 * 1000).getUTCHours(); return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'; })()}, {profile?.name?.split(' ')[0] || 'there'}.
            </div>
            <div style={{ fontSize: '13.5px', color: 'var(--t2)', marginTop: '4px' }}>
              {todayDRDone
                ? <span>Today's report is <strong style={{ color: 'var(--sage)' }}>in. ✓</strong> See you tomorrow.</span>
                : dailyReports.length === 0
                  ? <span>Start strong — <strong style={{ color: 'var(--gold)' }}>submit your first daily report.</strong></span>
                  : <span>Today's report is <strong style={{ color: 'var(--gold)' }}>due before 10 PM.</strong></span>}
            </div>
          </div>
        </div>

        {/* Mentorship session hero banner */}
        {nextSession && (
          <div style={{
            background: liveNow(nextSession)
              ? 'linear-gradient(135deg, rgba(232,168,48,.22), rgba(232,168,48,.06))'
              : 'linear-gradient(135deg, rgba(94,177,144,.18), rgba(94,177,144,.05))',
            border: '1px solid ' + (liveNow(nextSession) ? 'rgba(232,168,48,.5)' : 'rgba(94,177,144,.35)'),
            borderRadius: 'var(--rl)',
            padding: '20px 24px',
            display: 'flex', alignItems: 'center', gap: '20px',
            marginBottom: '22px', flexWrap: 'wrap',
          }}>
            <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: 'rgba(232,168,48,.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#E8A830" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="13" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
            </div>
            <div style={{ flex: 1, minWidth: 220 }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: liveNow(nextSession) ? '#E8A830' : 'var(--sage)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '4px' }}>
                {liveNow(nextSession) ? '● LIVE NOW' : 'UPCOMING · MENTORSHIP SESSION'}
              </div>
              <div style={{ fontFamily: 'var(--fs)', fontSize: '18px', fontWeight: 700, color: 'var(--t1)', marginBottom: '3px' }}>{nextSession.title}</div>
              <div style={{ fontSize: '13px', color: 'var(--t2)' }}>{mentorName || 'Your mentor'} · {fmtDate(nextSession.scheduledAt)} · {fmtTime(nextSession.scheduledAt)} · {nextSession.duration || 45} min</div>
            </div>
            <button
              className={`btn ${canJoin(nextSession) ? 'btn-gold' : 'btn-ghost'}`}
              disabled={!canJoin(nextSession)}
              onClick={() => canJoin(nextSession) && navigate(`/anchor/${userId}/live/${nextSession.id}`)}
            >
              {liveNow(nextSession) ? 'Join Live Class →'
                : canJoin(nextSession) ? 'Join Class →'
                : `Starts ${fmtTime(nextSession.scheduledAt)}`}
            </button>
          </div>
        )}

        {/* Stats row */}
        <div className="g4 mb">
          <div className="stat sa-amber">
            <div className="stat-l">Day Streak</div>
            <div className="stat-v" style={{ fontSize: drStreak > 0 ? undefined : '15px' }}>{drStreak > 0 ? drStreak : '—'}</div>
            <div className="stat-n up">{drStreak > 0 ? 'days straight' : 'start today'}</div>
          </div>
          <div className="stat sa-green">
            <div className="stat-l">Reports Submitted</div>
            <div className="stat-v">{dailyReports.length}</div>
            <div className="stat-n up">{submittedThisMonth} this month</div>
          </div>
          <div className="stat sa-gold">
            <div className="stat-l">Mentor Notes</div>
            <div className="stat-v" style={{ fontSize: mentorNotes.length === 0 ? '15px' : undefined }}>{mentorNotes.length > 0 ? mentorNotes.length : '—'}</div>
            <div className="stat-n" style={{ color: 'var(--sage)' }}>{mentorNotes.length > 0 ? 'total received' : 'none yet'}</div>
          </div>
          <div className="stat sa-blue">
            <div className="stat-l">Calls Completed</div>
            <div className="stat-v" style={{ fontSize: pastCalls.length === 0 ? '15px' : undefined }}>{pastCalls.length > 0 ? pastCalls.length : '—'}</div>
            <div className="stat-n up">{nextCall ? '↑ Next: ' + fmtDate(nextCall.scheduledAt).split(',')[0] : 'none scheduled'}</div>
          </div>
        </div>

        {/* Consistency + Mentor card */}
        <div className="g2 mb">
          <div className="card">
            <div className="sh">
              <div className="sh-t">Your Consistency</div>
              <span style={{ fontSize: '12px', color: 'var(--t3)' }}>{monthLabel}</span>
            </div>
            <div className="streak-ring">
              <div className="ring-outer">
                <div className="ring-fill" style={{ background: 'conic-gradient(var(--sage) 0% ' + ringPct + '%, var(--bg4) ' + ringPct + '%)' }} />
                <div className="ring-val">{drStreak}</div>
              </div>
              <div className="ring-emoji">{drStreak > 0 ? '🔥' : '📅'} Day streak · {ringPct}% of month</div>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--t3)', fontWeight: 500, marginBottom: '8px' }}>This month — daily reports</div>
            <div className="week-grid">
              {monthDays.map(({ d, s }) => <div key={d} className={`wg-day ${s}`}>{s !== 'future' ? d : ''}</div>)}
            </div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '10.5px', color: 'var(--t3)' }}><div className="wg-day logged" style={{ width: '16px', height: '16px', borderRadius: '4px', fontSize: 0 }} />Submitted</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '10.5px', color: 'var(--t3)' }}><div className="wg-day missed" style={{ width: '16px', height: '16px', borderRadius: '4px', fontSize: 0 }} />Missed</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '10.5px', color: 'var(--t3)' }}><div className="wg-day today" style={{ width: '16px', height: '16px', borderRadius: '4px', fontSize: 0 }} />Today</div>
            </div>
          </div>

          {/* Mentor card */}
          <div className="mcv2">
            {/* Compact horizontal hero */}
            <div className="mcv2-hero">
              <div className="mcv2-av">{mentorInitial}</div>
              <div className="mcv2-hero-info">
                <div className="mcv2-name">{mentorName || 'No mentor assigned'}</div>
                <div className="mcv2-role">
                  {mentorName ? 'Your Mentor · Anchor Program' : 'Admin will assign your mentor soon'}
                </div>
              </div>
              {latestNote && (
                <div className="mcv2-note-age">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                  {timeAgo(latestNote.createdAt)}
                </div>
              )}
            </div>

            {/* Note */}
            {latestNote ? (
              <div className="mcv2-note-wrap">
                <div className="mcv2-note-label">This week's note</div>
                <blockquote className="mcv2-note-text">"{latestNote.content}"</blockquote>
                <div className="mcv2-note-date">{fmtDate(latestNote.weekOf || latestNote.createdAt)}</div>
              </div>
            ) : (
              <div className="mcv2-note-empty">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                {mentorName ? `${mentorFirst} hasn't written a note yet this week.` : 'Notes from your mentor will appear here.'}
              </div>
            )}

            {/* Stats */}
            <div className="mcv2-stats">
              <div className="mcv2-stat">
                <div className="mcv2-stat-v">{dailyReports.length}</div>
                <div className="mcv2-stat-l">Reports</div>
              </div>
              <div className="mcv2-stat">
                <div className="mcv2-stat-v">{drStreak > 0 ? drStreak : '—'}</div>
                <div className="mcv2-stat-l">Streak</div>
              </div>
              <div className="mcv2-stat">
                <div className="mcv2-stat-v">{ringPct}%</div>
                <div className="mcv2-stat-l">This Month</div>
              </div>
            </div>

            {/* Next call row */}
            {nextCall ? (
              <div className="mcv2-next-call" onClick={() => onNav('calls')}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--blue)" strokeWidth="2" strokeLinecap="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.39 2 2 0 0 1 3.6 1.21h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.38a16 16 0 0 0 6 6l.94-.94a2 2 0 0 1 2.25-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.73 16z"/></svg>
                <span className="mcv2-nc-label">Next call</span>
                <span className="mcv2-nc-date">{fmtDate(nextCall.scheduledAt)} · {fmtTime(nextCall.scheduledAt)}</span>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginLeft: 'auto', opacity: .4 }}><path d="M9 18l6-6-6-6"/></svg>
              </div>
            ) : mentorName ? (
              <div className="mcv2-next-call mcv2-nc-empty">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.39 2 2 0 0 1 3.6 1.21h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.38a16 16 0 0 0 6 6l.94-.94a2 2 0 0 1 2.25-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.73 16z"/></svg>
                No call scheduled yet
              </div>
            ) : null}

            {/* CTA */}
            <button className="mcv2-cta" onClick={() => onNav('notes')}>
              View all mentor notes →
            </button>
          </div>
        </div>

        {/* Upgrade CTA */}
        <div style={{ background: 'linear-gradient(135deg,rgba(232,168,48,.12),rgba(232,168,48,.06))', border: '1px solid rgba(232,168,48,.35)', borderRadius: 'var(--rl)', padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '22px' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(232,168,48,.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#E8A830" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'var(--fs)', fontSize: '16px', fontWeight: 700, color: 'var(--t1)', marginBottom: '4px' }}>Upgrade your plan</div>
            <div style={{ fontSize: '13px', color: 'var(--t2)' }}>Get the question bank, weekly tests, and premium resources with Forge or Apex.</div>
          </div>
          <button className="btn btn-gold" onClick={() => onNav('plans')}>View Plans →</button>
        </div>

        {/* Today's report CTA */}
        <div style={{ background: todayDRDone ? 'linear-gradient(135deg,rgba(74,222,128,.08),rgba(74,222,128,.04))' : 'linear-gradient(135deg,var(--bg3),var(--bg4))', border: '1px solid ' + (todayDRDone ? 'rgba(74,222,128,.25)' : 'var(--gb)'), borderRadius: 'var(--rl)', padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '22px' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: todayDRDone ? 'rgba(74,222,128,.15)' : 'rgba(232,168,48,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {todayDRDone
              ? <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#4ADE80" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              : <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#E8A830" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'var(--fs)', fontSize: '16px', fontWeight: 700, color: 'var(--t1)', marginBottom: '4px' }}>{todayDRDone ? "Today's report is in." : "Today's report — not submitted yet"}</div>
            <div style={{ fontSize: '13px', color: 'var(--t2)' }}>{todayDRDone ? `${mentorFirst === 'your mentor' ? 'Your mentor' : mentorFirst} will read this before your next session.` : '2 minutes. Your mentor reads this before every session. Be honest.'}</div>
          </div>
          {todayDRDone
            ? <button className="btn btn-ghost btn-sm" onClick={() => onNav('report')}>View →</button>
            : <button className="btn btn-gold" onClick={() => onNav('report')}>Submit Now →</button>}
        </div>

        {/* This week */}
        <div className="sh"><div className="sh-t">This Week</div></div>
        {nextCall ? (
          <div className="call-card" style={{ marginBottom: '10px' }}>
            <div className="call-icon" style={{ background: 'var(--gd)' }}>📞</div>
            <div className="call-info">
              <div className="call-title">Weekly Mentor Call</div>
              <div className="call-meta">{mentorName || 'Mentor'} · {fmtDate(nextCall.scheduledAt)} · {fmtTime(nextCall.scheduledAt)} · {nextCall.durationMin} min</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px', flexShrink: 0 }}>
              <JoinCallButton userId={userId} callId={nextCall.id} scheduledAt={nextCall.scheduledAt} durationMin={nextCall.durationMin} />
              <span className="call-badge c-upcoming" onClick={() => onNav('calls')} style={{ cursor: 'pointer' }}>View →</span>
            </div>
          </div>
        ) : (
          <div className="call-card" style={{ marginBottom: '10px', opacity: .7 }}>
            <div className="call-icon" style={{ background: 'var(--bg4)' }}>📞</div>
            <div className="call-info">
              <div className="call-title">No call scheduled yet</div>
              <div className="call-meta">Your mentor will share the time via WhatsApp closer to the week.</div>
            </div>
          </div>
        )}
        {nextSession && (
          <>
            <div className="sh"><div className="sh-t">Live Class with Your Mentor</div></div>
            <div className="call-card" style={{ marginBottom: '10px' }}>
              <div className="call-icon" style={{ background: 'var(--gd)' }}>🎥</div>
              <div className="call-info">
                <div className="call-title">{nextSession.title}</div>
                <div className="call-meta">{mentorName || 'Mentor'} · {fmtDate(nextSession.scheduledAt)} · {fmtTime(nextSession.scheduledAt)} · {nextSession.duration || 45} min</div>
              </div>
              <button
                className={`btn ${canJoin(nextSession) ? 'btn-gold' : 'btn-ghost'} btn-sm`}
                disabled={!canJoin(nextSession)}
                onClick={() => canJoin(nextSession) && navigate(`/anchor/${userId}/live/${nextSession.id}`)}
                style={{ flexShrink: 0 }}
              >
                {canJoin(nextSession) ? 'Join Live Class →' : fmtTime(nextSession.scheduledAt)}
              </button>
            </div>
          </>
        )}
        <div className="call-card">
          <div className="call-icon" style={{ background: 'var(--bg4)' }}>📋</div>
          <div className="call-info">
            <div className="call-title">Study Guidance</div>
            <div className="call-meta">Diagnostic-based topic map and study plan — updated as your weak areas shift.</div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={() => onNav('guidance')}>Open →</button>
        </div>
      </div>

      {/* ══════════ DAILY REPORT ══════════ */}
      <div className={pg('report')}>
        {(() => {
          const todayReport = dailyReports.find(r => r.date === today) || null;
          return (
            <DailyReportForm
              profile={profile}
              mentorName={mentorFirst}
              todayReport={todayReport}
              dailyReports={dailyReports}
              onShowToast={onShowToast}
              onComplete={(report) => { onReportSubmitted?.(report); onShowToast('Report submitted ✓'); }}
            />
          );
        })()}
      </div>

      {/* ══════════ WEEKLY CALLS ══════════ */}
      <div className={pg('calls')}>
        <div style={{ background: 'var(--bg3)', border: '1px solid var(--b)', borderRadius: 'var(--rl)', padding: '14px 18px', marginBottom: '20px', borderLeft: '3px solid var(--sage)', fontSize: '13px', color: 'var(--t2)' }}>
          📞 Weekly calls are 45-minute honest conversations about your preparation — what's working, what isn't, and what to change. Not teaching sessions.
        </div>

        {/* Upcoming */}
        <div className="sh"><div className="sh-t">Upcoming</div></div>
        {upcomingCalls.length === 0 ? (
          <div className="ac-empty-card" style={{ marginBottom: '20px' }}>
            <div className="ac-empty-icon">📞</div>
            <div className="ac-empty-title">No call scheduled yet</div>
            <div className="ac-empty-sub">Your mentor will share the time over WhatsApp. It will appear here once scheduled.</div>
          </div>
        ) : upcomingCalls.map(c => (
          <div key={c.id} className="call-card" style={{ borderColor: 'var(--gb)', marginBottom: '10px' }}>
            <div className="call-icon" style={{ background: 'var(--gd)' }}>📞</div>
            <div className="call-info">
              <div className="call-title">{c.mentorName} · Weekly Call</div>
              <div className="call-meta">{fmtDate(c.scheduledAt)} · {fmtTime(c.scheduledAt)} · {c.durationMin} min</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px', flexShrink: 0 }}>
              <JoinCallButton userId={userId} callId={c.id} scheduledAt={c.scheduledAt} durationMin={c.durationMin} />
              <span className="call-badge c-upcoming">Upcoming</span>
            </div>
          </div>
        ))}

        {/* Mentorship sessions */}
        {upcomingSessions.length > 0 && (
          <>
            <div className="sh" style={{ marginTop: '24px' }}><div className="sh-t">Mentorship Sessions</div></div>
            {upcomingSessions.map(s => (
              <div key={s.id} className="call-card" style={{ borderColor: 'var(--gb)', marginBottom: '10px' }}>
                <div className="call-icon" style={{ background: 'var(--gd)' }}>🎥</div>
                <div className="call-info">
                  <div className="call-title">{s.title}</div>
                  <div className="call-meta">{mentorName || 'Mentor'} · {fmtDate(s.scheduledAt)} · {fmtTime(s.scheduledAt)} · {s.duration || 45} min</div>
                </div>
                <button
                  className={`btn ${canJoin(s) ? 'btn-gold' : 'btn-ghost'} btn-sm`}
                  disabled={!canJoin(s)}
                  onClick={() => canJoin(s) && navigate(`/anchor/${userId}/live/${s.id}`)}
                  style={{ flexShrink: 0 }}
                >
                  {canJoin(s) ? 'Join Live →' : fmtTime(s.scheduledAt)}
                </button>
              </div>
            ))}
          </>
        )}


        {/* Past calls */}
        <div className="sh" style={{ marginTop: '8px' }}><div className="sh-t">Past Calls</div></div>
        {pastCalls.length === 0 ? (
          <div className="ac-empty-card">
            <div className="ac-empty-icon">🕐</div>
            <div className="ac-empty-title">No calls yet</div>
            <div className="ac-empty-sub">Completed calls and their notes will appear here after each session.</div>
          </div>
        ) : pastCalls.map((c) => (
          <div key={c.id} className="plan-week" style={{ marginBottom: '8px' }}>
            <div className="pw-header" onClick={() => toggleSection('call-' + c.id)}>
              <div>
                <div className="pw-title">{c.mentorName} · {fmtDate(c.scheduledAt)}</div>
                <div className="pw-sub">{c.notes ? c.notes.slice(0, 60) + (c.notes.length > 60 ? '…' : '') : 'No notes added'} · {c.durationMin} min</div>
              </div>
              <svg className="tms-arrow" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: openSections.has('call-' + c.id) ? 'rotate(180deg)' : '' }}><path d="M6 9l6 6 6-6"/></svg>
            </div>
            {openSections.has('call-' + c.id) && (
              <div className="pw-body">
                {c.notes ? (
                  <div style={{ fontSize: '13px', color: 'var(--t2)', fontStyle: 'italic', borderLeft: '3px solid var(--gold)', paddingLeft: '13px', marginBottom: '10px', lineHeight: 1.8 }}>"{c.notes}"</div>
                ) : (
                  <div style={{ fontSize: '12.5px', color: 'var(--t3)', marginBottom: '10px' }}>No notes from this call.</div>
                )}
                <div style={{ fontSize: '12px', color: 'var(--t3)' }}>{fmtDate(c.scheduledAt)} · {fmtTime(c.scheduledAt)} · {c.durationMin} min</div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ══════════ MENTOR NOTES ══════════ */}
      <div className={pg('notes')}>
        <div style={{ background: 'var(--bg3)', border: '1px solid var(--b)', borderRadius: 'var(--rl)', padding: '14px 18px', marginBottom: '20px', borderLeft: '3px solid var(--gold)', fontSize: '13px', color: 'var(--t2)' }}>
          💬 Your mentor writes a note at the end of each week — based on your daily reports, habits, and call. Honest, direct, and just for you.
        </div>

        {mentorNotes.length === 0 ? (
          <div className="ac-empty-card">
            <div className="ac-empty-icon">💬</div>
            <div className="ac-empty-title">No notes yet</div>
            <div className="ac-empty-sub">{mentorName ? `${mentorFirst} will write your first note after reviewing your reports this week.` : 'Once a mentor is assigned, their weekly notes will appear here.'}</div>
          </div>
        ) : mentorNotes.map((n, i) => (
          <div key={n.id} className="mentor-note-card" style={{ animationDelay: i * 0.06 + 's' }}>
            <div className="mnc-header">
              <div className="mnc-av">{n.mentorName?.[0] || '?'}</div>
              <div>
                <div className="mnc-name">{n.mentorName}</div>
                <div className="mnc-week">Week of {fmtDate(n.weekOf)} · {timeAgo(n.createdAt)}</div>
              </div>
            </div>
            <div className="mnc-body">"{n.content}"</div>
          </div>
        ))}
      </div>

      {/* ══════════ HABIT TRACKER ══════════ */}
      <div className={pg('habits')}>
        <div className="g2 mb">
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div>
                <div style={{ fontFamily: 'var(--fs)', fontSize: '16px', fontWeight: 700, color: 'var(--t1)' }}>Today's Habits</div>
                <div style={{ fontSize: '12px', color: 'var(--t3)' }}>{new Date(Date.now() + 5.5 * 60 * 60 * 1000).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div>
              </div>
              {streak > 0 && <span style={{ fontFamily: 'var(--fs)', fontSize: '20px', color: 'var(--amber)' }}>🔥 {streak}</span>}
            </div>
            {alreadyCheckedIn && <div style={{ fontSize: '12.5px', color: 'var(--green)', fontWeight: 500, marginBottom: '14px' }}>✓ Today's check-in is saved. See you tomorrow!</div>}
            {HABIT_ITEMS.map(h => (
              <div key={h.key} className="habit-row" style={alreadyCheckedIn ? { opacity: 0.85 } : {}}>
                <div className="habit-left">
                  <div className="habit-icon">{HABIT_ICONS[h.key]}</div>
                  <div><div className="habit-name">{h.name}</div><div className="habit-desc">{h.desc}</div></div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <div className={`ht-yes${effectiveState[h.key] === 'yes' ? ' active' : ''}`} onClick={() => logHabit(h.key, 'yes')}>Yes</div>
                  <div className={`ht-no${effectiveState[h.key] === 'no' ? ' active' : ''}`} onClick={() => logHabit(h.key, 'no')}>No</div>
                </div>
              </div>
            ))}
            {!alreadyCheckedIn && allHabitsDone && (
              <div style={{ marginTop: '14px', textAlign: 'right' }}>
                <button className="btn btn-gold btn-sm" onClick={saveHabits} disabled={habitSaving}>
                  {habitSaving ? 'Saving…' : 'Save ✓'}
                </button>
              </div>
            )}
          </div>

          <div className="card">
            <div style={{ fontFamily: 'var(--fs)', fontSize: '15px', fontWeight: 600, color: 'var(--t1)', marginBottom: '14px' }}>Last 14 Days</div>
            <div style={{ textAlign: 'center', padding: '10px 0 16px' }}>
              <div style={{ fontFamily: 'var(--fs)', fontSize: '38px', fontWeight: 700, color: 'var(--sage)' }}>{habitCount}</div>
              <div style={{ fontSize: '13px', color: 'var(--t3)' }}>habits today</div>
            </div>
            <div className="div" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {hdRow.map(row => (
                <div key={row.label} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--t3)', width: '60px' }}>{row.label}</div>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {row.dots.map((d, i) => <div key={i} className={`hd ${d}`} />)}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '10.5px', color: 'var(--t3)' }}><div className="hd y" />Done</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '10.5px', color: 'var(--t3)' }}><div className="hd n" />Missed</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '10.5px', color: 'var(--t3)' }}><div className="hd t" />Today</div>
            </div>
          </div>
        </div>

        <div className="card" style={{ background: 'var(--bg3)', borderColor: 'var(--gb)' }}>
          <div style={{ fontFamily: 'var(--fs)', fontSize: '14px', fontWeight: 600, color: 'var(--t1)', marginBottom: '6px' }}>Your mentor sees this</div>
          <div style={{ fontSize: '13px', color: 'var(--t2)', lineHeight: 1.8 }}>{mentorFirst === 'your mentor' ? 'Your mentor' : mentorFirst} reviews your habit history before every weekly call. Patterns — like skipping revision on Sundays or phone usage spiking mid-week — come up on the call. You don't need to explain yourself. The data speaks.</div>
        </div>
      </div>

      {/* ══════════ REPORT HISTORY ══════════ */}
      <div className={pg('history')}>
        {dailyReports.length === 0 ? (
          <div className="ac-empty-card">
            <div className="ac-empty-icon">📋</div>
            <div className="ac-empty-title">No reports yet</div>
            <div className="ac-empty-sub">Submit your first daily report to see your history here.</div>
          </div>
        ) : (
          <>
            <div style={{ fontSize: '13px', color: 'var(--t2)', marginBottom: '18px' }}>
              {dailyReports.length} report{dailyReports.length !== 1 ? 's' : ''} submitted. Your mentor reads every one.
            </div>
            {dailyReports.map(r => {
              const key = 'r-' + r.id;
              const d = new Date(r.date + 'T00:00:00');
              const dateLabel = d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' });
              const totalHrs = ((r.hrsPhysics || 0) + (r.hrsChemistry || 0) + (r.hrsThird || 0)).toFixed(1);
              const moodEmojis = ['', '😩', '😐', '🙂', '💪', '🔥'];
              const summaryParts = [];
              if (parseFloat(totalHrs) > 0) summaryParts.push(totalHrs + 'h studied');
              summaryParts.push('Focus: ' + r.focusQuality + '/5');
              summaryParts.push('Showed up ' + (r.showedUp === 'Yes' ? '✓' : '✗'));
              return (
                <div key={key} className="report-item">
                  <div className="ri-header" onClick={() => toggleSection(key)}>
                    <div>
                      <div className="ri-date">{dateLabel}</div>
                      <div className="ri-summary">{summaryParts.join(' · ')}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div className="ri-mood">{moodEmojis[parseInt(r.mood)] || ''}</div>
                      <svg className="tms-arrow" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: openSections.has(key) ? 'rotate(180deg)' : '' }}><path d="M6 9l6 6 6-6"/></svg>
                    </div>
                  </div>
                  {openSections.has(key) && (
                    <div className="ri-body open">
                      {r.topicsDone    && <div className="ri-field"><div className="ri-field-label">Topics Done</div><div className="ri-field-val">{r.topicsDone}</div></div>}
                      {r.questionsSolved && <div className="ri-field"><div className="ri-field-label">Problems</div><div className="ri-field-val">{r.questionsSolved} solved</div></div>}
                      {r.mockToday === 'Yes' && <div className="ri-field"><div className="ri-field-label">Mock / Test</div><div className="ri-field-val">{r.mockScore || 'Attempted'}</div></div>}
                      {r.wentWell     && <div className="ri-field"><div className="ri-field-label">Went Well</div><div className="ri-field-val">{r.wentWell}</div></div>}
                      {r.wentHard     && <div className="ri-field"><div className="ri-field-label">Felt Hard</div><div className="ri-field-val">{r.wentHard}</div></div>}
                      {r.tomorrowOne  && <div className="ri-field"><div className="ri-field-label">Tomorrow</div><div className="ri-field-val">{r.tomorrowOne}</div></div>}
                      {r.noteForMentor && <div className="ri-field"><div className="ri-field-label">For Mentor</div><div className="ri-field-val" style={{ fontStyle: 'italic' }}>{r.noteForMentor}</div></div>}
                    </div>
                  )}
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* ══════════ RESOURCES ══════════ */}
      <div className={pg('resources')}>
        <div className="ac-res-tabs" style={{ display: 'flex', gap: '2px', background: 'var(--bg3)', border: '1px solid var(--b)', padding: '4px', borderRadius: '9px', width: 'fit-content', marginBottom: '20px' }}>
          {['All', 'Study Material', 'Formula Sheet'].map((t, i) => (
            <div key={t} onClick={() => setResTab(i)} style={{ padding: '7px 17px', borderRadius: '6px', fontSize: '13px', fontWeight: resTab === i ? 600 : 500, cursor: 'pointer', transition: 'all .15s', background: resTab === i ? 'var(--bg4)' : 'transparent', color: resTab === i ? 'var(--t1)' : 'var(--t3)', boxShadow: resTab === i ? '0 1px 4px rgba(0,0,0,0.3)' : 'none', whiteSpace: 'nowrap', flexShrink: 0 }}>{t}</div>
          ))}
        </div>
        {(() => {
          const TYPE_MAP = [null, 'Study Material', 'Formula Sheet'];
          const filtered = resTab === 0 ? resources : resources.filter(r => r.type === TYPE_MAP[resTab]);
          if (filtered.length === 0 && resources.length === 0) {
            return (
              <>
                <div style={{ fontSize: '10.5px', color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '.09em', fontWeight: 600, marginBottom: '10px' }}>Free Resources</div>
                {[{ name: 'NCERT Chemistry Class XI', meta: 'PDF • 18.4 MB', url: 'https://ncert.nic.in/textbook.php?kech1=0-14' }, { name: 'NCERT Mathematics Class XII', meta: 'PDF • 22.1 MB', url: 'https://ncert.nic.in/textbook.php?lemh1=0-13' }].map((r, i) => (
                  <div key={i} className="ac-res-row" style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '13px 16px', borderRadius: 'var(--r)', background: 'var(--bg2)', border: '1px solid var(--b)', marginBottom: '8px', cursor: 'pointer', transition: 'all .15s' }} onClick={() => window.open(r.url, '_blank', 'noreferrer')} onMouseOver={e => e.currentTarget.style.borderColor = 'var(--gb)'} onMouseOut={e => e.currentTarget.style.borderColor = 'var(--b)'}>
                    <div style={{ width: '38px', height: '38px', borderRadius: '9px', background: 'var(--gd)', border: '1px solid var(--gb)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg></div>
                    <div className="ac-res-info"><div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--t1)' }}>{r.name}</div><div style={{ fontSize: '11.5px', color: 'var(--t3)', marginTop: '2px' }}>{r.meta}</div></div>
                    <button className="btn btn-sm btn-ghost ac-res-btn" onClick={e => { e.stopPropagation(); window.open(r.url, '_blank', 'noreferrer'); }}>↓ Download</button>
                  </div>
                ))}
              </>
            );
          }
          if (filtered.length === 0) return <div style={{ fontSize: '13px', color: 'var(--t3)', padding: '32px 0', textAlign: 'center' }}>No {TYPE_MAP[resTab] || 'materials'} available yet.</div>;
          return filtered.map(r => (
            <div key={r.id} className="ac-res-row" style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 16px', borderRadius: 'var(--rl)', background: 'var(--bg2)', border: '1px solid var(--b)', marginBottom: '10px', transition: 'all .15s', cursor: 'pointer' }} onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--b2)'; e.currentTarget.style.background = 'var(--bg3)'; }} onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--b)'; e.currentTarget.style.background = 'var(--bg2)'; }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--gd)', border: '1px solid var(--gb)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg></div>
              <div className="ac-res-info" style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--t1)', marginBottom: '2px' }}>{r.title} {r.targeted && <span className="pill pill-gold">For you</span>}</div>
                <div style={{ fontSize: '12px', color: 'var(--t3)' }}>{r.subject} · {r.type} · By {r.facultyName}</div>
                {r.description && <div style={{ fontSize: '11.5px', color: 'var(--t3)', marginTop: '3px', fontStyle: 'italic' }}>{r.description}</div>}
              </div>
              <div className="ac-res-actions" style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                <a href={`${import.meta.env.VITE_API_URL}/api/files/proxy?url=${encodeURIComponent(r.cloudinaryUrl)}`} target="_blank" rel="noreferrer" className="btn btn-sm btn-ghost" style={{ textDecoration: 'none' }}>↗ View</a>
                <a href={`${import.meta.env.VITE_API_URL}/api/files/proxy?url=${encodeURIComponent(r.cloudinaryUrl)}&download=1`} target="_blank" rel="noreferrer" className="btn btn-sm btn-green" style={{ textDecoration: 'none' }}>↓ Download</a>
              </div>
            </div>
          ));
        })()}
      </div>

      {/* ══════════ PARENT VIEW ══════════ */}
      <div className={pg('parent')}>
        <div className="parent-hero">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <div style={{ fontFamily: 'var(--fs)', fontSize: '20px', fontWeight: 700, color: 'var(--t1)', marginBottom: '4px' }}>Parent View</div>
              <div style={{ fontSize: '13px', color: 'var(--t2)' }}>Your child's progress — updated each time they submit a daily report.</div>
            </div>
          </div>
          <div className="parent-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '12px' }}>
            {[
              { v: dailyReports.length > 0 ? String(dailyReports.length) : '—', l: 'Reports (last 30d)', c: 'var(--sage)' },
              { v: drStreak > 0 ? String(drStreak) : '—', l: 'Day Streak', c: 'var(--amber)' },
              { v: drAvgFocus ? drAvgFocus + ' / 5' : '—', l: 'Avg Focus', c: 'var(--gold)' },
            ].map(s => (
              <div key={s.l} style={{ background: 'rgba(234,244,236,0.05)', border: '1px solid var(--b)', borderRadius: 'var(--r)', padding: '14px', textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--fs)', fontSize: '22px', fontWeight: 700, color: s.c }}>{s.v}</div>
                <div style={{ fontSize: '10.5px', color: 'var(--t3)', marginTop: '3px' }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>
        {dailyReports.length === 0 ? (
          <div className="ac-empty-card">
            <div className="ac-empty-icon">📊</div>
            <div className="ac-empty-title">No data yet</div>
            <div className="ac-empty-sub">Data will appear here once your child starts submitting daily reports.</div>
          </div>
        ) : (
          <>
            <div style={{ background: 'var(--bg2)', border: '1px solid var(--b)', borderRadius: 'var(--rl)', padding: '18px 20px', marginBottom: '18px' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: '14px' }}>Last 7 Days</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                {[
                  { label: 'Reports submitted', val: drLast7.length + ' / 7', c: drLast7.length >= 6 ? 'var(--sage)' : drLast7.length >= 4 ? 'var(--gold)' : 'var(--t1)' },
                  { label: 'Avg study hours / day', val: drAvgHrs ? drAvgHrs + ' hrs' : 'Not logged', c: 'var(--t1)' },
                  { label: 'Avg focus quality', val: drAvgFocus ? drAvgFocus + ' / 5' : 'Not logged', c: 'var(--gold)' },
                  { label: 'Problems solved', val: drQsSolved7 > 0 ? drQsSolved7 + ' problems' : 'Not logged', c: 'var(--t1)' },
                ].map((row, i, arr) => (
                  <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: i < arr.length - 1 ? '1px solid var(--b)' : 'none' }}>
                    <span style={{ fontSize: '13px', color: 'var(--t2)' }}>{row.label}</span>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: row.c }}>{row.val}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ background: 'var(--bg2)', border: '1px solid var(--b)', borderRadius: 'var(--rl)', padding: '18px 20px' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: '14px' }}>Recent Reports</div>
              {dailyReports.slice(0, 7).map((r, i, arr) => {
                const moods = ['', '😩', '😐', '🙂', '💪', '🔥'];
                const totalHrs = ((r.hrsPhysics || 0) + (r.hrsChemistry || 0) + (r.hrsThird || 0)).toFixed(1);
                const d = new Date(r.date + 'T00:00:00');
                const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                const label = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()] + ', ' + d.getDate() + ' ' + months[d.getMonth()];
                return (
                  <div key={r.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '10px 0', borderBottom: i < arr.length - 1 ? '1px solid var(--b)' : 'none' }}>
                    <div style={{ fontSize: '18px', flexShrink: 0, marginTop: '1px' }}>{moods[parseInt(r.mood)] || ''}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--t1)' }}>{label}</span>
                        <span style={{ fontSize: '11px', color: 'var(--t3)' }}>Focus {r.focusQuality}/5{parseFloat(totalHrs) > 0 ? ' · ' + totalHrs + 'h' : ''}</span>
                      </div>
                      {r.wentWell && <div style={{ fontSize: '12.5px', color: 'var(--t2)', lineHeight: 1.5 }}>Went well: {r.wentWell}</div>}
                      {r.wentHard && <div style={{ fontSize: '12.5px', color: 'var(--t3)', lineHeight: 1.5, marginTop: '2px' }}>Felt hard: {r.wentHard}</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* ══════════ NOTIFICATIONS ══════════ */}
      <div className={pg('notif')}>
        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg,var(--bg3) 0%,var(--bg4) 100%)', borderRadius: 'var(--rl)', padding: '20px 22px', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontFamily: 'var(--fs)', fontSize: '18px', fontWeight: 700, color: 'var(--t1)', marginBottom: '3px' }}>Notifications</div>
            <div style={{ fontSize: '12.5px', color: 'var(--t3)' }}>
              {notifications.length === 0 ? 'Nothing yet — stay tuned' : `${notifications.length} total · ${unreadCount} unread`}
            </div>
          </div>
          {unreadCount > 0 && (
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <div style={{ textAlign: 'center', background: 'rgba(232,168,48,.12)', border: '1px solid rgba(232,168,48,.25)', borderRadius: '10px', padding: '7px 14px' }}>
                <div style={{ fontFamily: 'var(--fs)', fontSize: '20px', fontWeight: 800, color: 'var(--gold)', lineHeight: 1 }}>{unreadCount}</div>
                <div style={{ fontSize: '10px', color: 'var(--t3)', marginTop: '2px', textTransform: 'uppercase' }}>Unread</div>
              </div>
              <button onClick={onMarkAllNotifRead} style={{ background: 'rgba(234,244,236,.08)', border: '1px solid var(--b)', borderRadius: '9px', padding: '7px 13px', color: 'var(--t2)', fontSize: '12px', fontWeight: 600, cursor: 'pointer', transition: 'all .15s' }}
                onMouseOver={e => e.currentTarget.style.background = 'rgba(234,244,236,.14)'}
                onMouseOut={e => e.currentTarget.style.background = 'rgba(234,244,236,.08)'}>
                Mark all read
              </button>
            </div>
          )}
        </div>

        {/* Filter tabs */}
        {notifications.length > 0 && (
          <div style={{ display: 'flex', gap: '6px', marginBottom: '14px' }}>
            {[{ key: 'all', label: 'All (' + notifications.length + ')' }, { key: 'unread', label: 'Unread (' + unreadCount + ')' }].map(f => (
              <button key={f.key} onClick={() => setNotifFilter(f.key)}
                style={{ border: '1px solid var(--b)', background: notifFilter === f.key ? 'var(--bg4)' : 'var(--bg2)', color: notifFilter === f.key ? 'var(--sage)' : 'var(--t3)', fontSize: '12px', fontWeight: 600, padding: '5px 14px', borderRadius: '20px', cursor: 'pointer', transition: 'all .15s' }}>
                {f.label}
              </button>
            ))}
          </div>
        )}

        {/* Items */}
        {filteredNotifs.length === 0 ? (
          <div className="ac-empty-card">
            <div className="ac-empty-icon">🔔</div>
            <div className="ac-empty-title">{notifFilter === 'unread' ? 'All caught up!' : 'No notifications yet'}</div>
            <div className="ac-empty-sub">{notifFilter === 'unread' ? 'No unread notifications.' : 'Updates from your mentor and Studyverse will appear here.'}</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {filteredNotifs.map((n) => {
              const meta = NotifTypeMeta[n.type] || { color: 'var(--t3)', bg: 'rgba(234,244,236,.06)', icon: '🔔' };
              const isUnread = !n.readAt;
              return (
                <div key={n.id} onClick={() => {
                    if (isUnread) onMarkNotifRead(n.id);
                    if (meta.page) onNav(meta.page);
                  }}
                  style={{ display: 'flex', gap: '13px', padding: '14px 16px', borderRadius: 'var(--rl)', background: isUnread ? 'var(--bg3)' : 'var(--bg2)', border: '1px solid ' + (isUnread ? 'var(--b2)' : 'var(--b)'), cursor: 'pointer', opacity: n.readAt ? 0.72 : 1, transition: 'all .15s' }}
                  onMouseOver={e => { e.currentTarget.style.background = 'var(--bg4)'; }}
                  onMouseOut={e => { e.currentTarget.style.background = isUnread ? 'var(--bg3)' : 'var(--bg2)'; }}>
                  <div style={{ width: '38px', height: '38px', borderRadius: '11px', background: meta.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '18px' }}>{meta.icon}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: meta.color, background: meta.bg, borderRadius: '20px', padding: '2px 8px' }}>{n.type}</span>
                      {isUnread && <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: meta.color, display: 'inline-block', flexShrink: 0 }} />}
                    </div>
                    <div style={{ fontSize: '13.5px', color: 'var(--t1)', fontWeight: isUnread ? 500 : 400, lineHeight: 1.55 }}>{n.content}</div>
                    <div style={{ fontSize: '11px', color: 'var(--t3)', marginTop: '5px' }}>{timeAgo(n.createdAt)}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ══════════ PLANS ══════════ */}
      <div className={pg('plans')}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ fontFamily: 'var(--fs)', fontSize: '26px', fontWeight: 700, color: 'var(--t1)', marginBottom: '6px' }}>Upgrade Your Plan</div>
          <div style={{ fontSize: '13.5px', color: 'var(--t2)' }}>Get question bank, weekly tests, and live sessions.</div>
        </div>
        <div className="pricing-grid">
          {/* ── Forge ── */}
          <div className="price-card featured">
            <div className="pc-badge">GET STARTED</div>
            <div className="pc-name">Forge</div>
            <div className="pc-tagline">Build your score, problem by problem</div>
            <div className="pc-price" style={{ color: 'var(--gold)' }}>₹ 999/-</div>
            <div className="pc-sub">Monthly</div>
            <div className="pc-feats">
              <div className="pc-feat">Everything in Spark</div>
              <div className="pc-feat">Custom question bank (matched to your gaps)</div>
              <div className="pc-feat">Weekly tests based on current weak topics</div>
              <div className="pc-feat">Progress tracking — map updates with each test</div>
              <div className="pc-feat">Premium resources (HC Verma, PYQs, formula sheets)</div>
              <div className="pc-feat no">Live faculty sessions</div>
              <div className="pc-feat no">Dedicated mentor</div>
            </div>
            <button className="btn btn-gold btn-full" onClick={() => openPlanCheckout('forge')}>Get Forge →</button>
          </div>

          {/* ── Apex ── */}
          <div className="price-card" style={{ background: 'var(--navy)', color: '#fff', border: '2px solid var(--gold)' }}>
            <div className="pc-badge" style={{ background: 'var(--gold)', color: '#0F1F3D' }}>COMPLETE PROGRAM</div>
            <div className="pc-name" style={{ color: '#fff' }}>Apex</div>
            <div className="pc-tagline" style={{ color: 'rgba(253,248,240,0.6)' }}>The highest point</div>
            <div className="pc-price" style={{ color: 'var(--gold)' }}>₹ 2499/-</div>
            <div className="pc-sub" style={{ color: 'rgba(253,248,240,0.6)' }}>Per month · Personalised</div>
            <div className="pc-feats">
              <div className="pc-feat" style={{ color: 'rgba(253,248,240,0.9)' }}>Everything in Forge</div>
              <div className="pc-feat" style={{ color: 'rgba(253,248,240,0.9)' }}>Dedicated 1-to-1 faculty</div>
              <div className="pc-feat" style={{ color: 'rgba(253,248,240,0.9)' }}>Weekly live sessions — personalised to your gaps</div>
              <div className="pc-feat" style={{ color: 'rgba(253,248,240,0.9)' }}>Mentorship + daily accountability</div>
              <div className="pc-feat" style={{ color: 'rgba(253,248,240,0.9)' }}>Score Journey arc (baseline → target)</div>
              <div className="pc-feat" style={{ color: 'rgba(253,248,240,0.9)' }}>Weekly parent reports every Sunday</div>
              <div className="pc-feat" style={{ color: 'rgba(253,248,240,0.9)' }}>Doubt desk — reply within 4 hours</div>
              <div className="pc-feat" style={{ color: 'rgba(253,248,240,0.9)' }}>Mentor-assigned tests based on your progress</div>
            </div>
            <button className="btn btn-gold btn-full" onClick={() => openPlanCheckout('apex')}>Get Apex →</button>
          </div>
        </div>
      </div>

      {/* Cashfree payment modal for plan upgrades */}
      <CashfreePayModal
        open={payModal.open}
        onClose={() => setPayModal(m => ({ ...m, open: false }))}
        mode={payModal.mode}
        plan={payModal.plan}
        userId={userId}
        profile={profile}
        onSuccess={(res) => {
          if (res?.goal === 'plan') {
            onShowToast('Plan activated! Please log in again to continue.');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            navigate('/', { replace: true });
          }
        }}
      />

    </div>
  );
};

export default AnchorContent;
