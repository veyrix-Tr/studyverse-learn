import { useState, useEffect } from 'react';
import DiagnosticForm from '../common/DiagnosticForm';
import { useParams } from 'react-router-dom';

// ── Journey helpers (shared logic with apex My Journey) ──────────────────────
const getExamMax = (t) => (!t ? 360 : t.toLowerCase().includes('neet') ? 720 : 360);
const getExamDate = (examTarget, targetYear) => {
  if (!targetYear) return null;
  const t = (examTarget || '').toLowerCase();
  if (t.includes('mains') || t.includes('main')) return new Date(`${targetYear}-01-25`);
  if (t.includes('advanced')) return new Date(`${targetYear}-05-17`);
  if (t.includes('neet')) return new Date(`${targetYear}-05-03`);
  return new Date(`${targetYear}-05-15`);
};
const getDaysRemaining = (examTarget, targetYear) => {
  const d = getExamDate(examTarget, targetYear);
  if (!d) return null;
  const diff = Math.ceil((d - new Date()) / 86400000);
  return diff > 0 ? diff : null;
};
const arcPoints = (n, W, H) => {
  if (n <= 1) return [{ x: 20, y: H * 0.84 }];
  const xS = 20, xE = W - 20, yMax = H * 0.84, yMin = H * 0.36;
  return Array.from({ length: n }, (_, i) => ({
    x: xS + (xE - xS) * i / (n - 1),
    y: yMax - (yMax - yMin) * Math.sin(i / (n - 1) * Math.PI / 2),
  }));
};
const ptsToPath = (pts) => {
  if (!pts || !pts.length) return '';
  if (pts.length === 1) return `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
  let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
  for (let i = 1; i < pts.length; i++) {
    const p = pts[i - 1], c = pts[i], cx = ((p.x + c.x) / 2).toFixed(1);
    d += ` C ${cx} ${p.y.toFixed(1)} ${cx} ${c.y.toFixed(1)} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`;
  }
  return d;
};
const buildArc = (weeks, examTarget, W, H, cH) => {
  const max = getExamMax(examTarget), toM = (p) => Math.round(p * max / 100), target = toM(90);
  const nData = weeks ? weeks.length : 0, toPb = (pt) => `${Math.round(cH * (1 - pt.y / H))}px`;
  if (nData === 0) {
    const pts = arcPoints(4, W, H);
    return { nodes: pts.map((pt, i) => ({ type: 'future', pb: toPb(pt), label: i === 0 ? 'Baseline<br><span style="font-size:10px;">—</span>' : i === 3 ? `Target<br><span style="font-size:10px;">${target}</span>` : '·' })), solidPath: `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`, dashedPath: ptsToPath(pts), fillPath: null };
  }
  const nTotal = nData + 2, allPts = arcPoints(nTotal, W, H), last = weeks[nData - 1], currentM = toM(last.avgPct), near = Math.min(currentM + Math.round((target - currentM) * 0.5), target);
  const nodes = allPts.map((pt, i) => {
    const pb = toPb(pt);
    if (i < nData) { const w = weeks[i], m = toM(w.avgPct); if (nData === 1) return { type: 'current', pb, label: `This Week<br><strong style="font-size:10px;">${m} marks</strong>` }; if (i === 0) return { type: 'done', pb, label: `Baseline<br><strong style="color:var(--gold);font-size:10px;">${m} marks</strong>` }; if (i === nData - 1) return { type: 'current', pb, label: `This Week<br><strong style="font-size:10px;">${m} marks</strong>` }; return { type: 'done', pb, label: `Wk ${w.weekNumber}<br><strong style="color:var(--gold);font-size:10px;">${m} marks</strong>` }; }
    if (i === nTotal - 2) return { type: 'future', pb, label: `Near Goal<br><span style="font-size:10px;">~${near}</span>` };
    if (i === nTotal - 1) return { type: 'future', pb, label: `Target<br><span style="font-size:10px;">${target}</span>` };
    return { type: 'future', pb, label: '·' };
  });
  const solidPts = allPts.slice(0, nData), dashedPts = allPts.slice(nData - 1), solidPath = ptsToPath(solidPts), dashedPath = ptsToPath(dashedPts), last0 = solidPts[solidPts.length - 1];
  const fillPath = nData > 1 ? solidPath + ` L ${last0.x.toFixed(1)} ${H} L ${solidPts[0].x.toFixed(1)} ${H} Z` : null;
  return { nodes, solidPath, dashedPath, fillPath };
};
const ArcTrack = ({ height = 120, viewBox = '0 0 800 110', solidPath, dashedPath, fillPath, nodes }) => (
  <div className="arc-track" style={{ height, position: 'relative', margin: '0 0 24px' }}>
    <svg className="arc-svg" viewBox={viewBox} preserveAspectRatio="none" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
      <path d={solidPath} stroke="#E8A830" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.8"/>
      <path d={dashedPath} stroke="rgba(253,248,240,0.2)" strokeWidth="2" fill="none" strokeLinecap="round" strokeDasharray="6 4"/>
      {fillPath && <path d={fillPath} fill="rgba(232,168,48,0.06)"/>}
    </svg>
    <div className="arc-milestones" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', padding: '0 8px' }}>
      {nodes.map((n, i) => (<div key={i} className={`arc-node ${n.type}`} style={{ paddingBottom: n.pb }}><div className={`arc-dot ${n.type}`}/><div className="arc-node-label" dangerouslySetInnerHTML={{ __html: n.label }}/></div>))}
    </div>
  </div>
);
const ScoreDeltas = ({ items }) => (
  <div className="score-deltas">
    {items.map((d, i) => (<div key={i} className="delta-box"><div className="delta-label">{d.label}</div><div className={`delta-val ${d.valClass}`}>{d.val}</div><div className={`delta-change${d.neutral ? ' neutral' : ''}`} style={d.changeStyle}>{d.change}</div></div>))}
  </div>
);
const WeeklyReport = ({ week, meta, score, change, changeClass, isOpen, onToggle, children }) => (
  <div className="weekly-report">
    <div className="wr-header" onClick={onToggle}>
      <div><div className="wr-week">{week}</div><div className="wr-meta">{meta}</div></div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div><div style={{ fontSize: '10px', color: 'var(--text3)', textAlign: 'right', marginBottom: '2px' }}>{changeClass === 'start' ? 'Baseline' : 'Score'}</div><div className="wr-score">{score}</div></div>
        <span className={`wr-change${changeClass === 'up' ? ' wr-up' : changeClass === 'down' ? ' wr-down' : ''}`} style={changeClass === 'start' ? { background: 'rgba(15,31,61,0.06)', color: 'var(--text3)' } : {}}>{change}</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth="2" style={{ transform: isOpen ? 'rotate(180deg)' : '', transition: 'transform 0.2s' }}><path d="M6 9l6 6 6-6"/></svg>
      </div>
    </div>
    <div className={`wr-body${isOpen ? ' open' : ''}`}>{children}</div>
  </div>
);
// ─────────────────────────────────────────────────────────────────────────────




const habitItems = [
  { key: 'sleep', icon: '🌙', name: 'Slept before midnight', desc: 'Your brain consolidates memory during sleep. 11 PM is the target.' },
  { key: 'study', icon: '📖', name: 'Studied for at least 4 hours', desc: 'Focused study, not just sitting with a book.' },
  { key: 'revision', icon: '🔁', name: "Revised yesterday's topics", desc: 'Revision within 24h improves retention by 80%.' },
  { key: 'phone', icon: '📵', name: 'No social media during study hours', desc: 'Even 5-minute breaks break your flow completely.' },
  { key: 'problems', icon: '❓', name: 'Solved at least 10 problems', desc: 'Competitive exams are problem-solving exams. Read less, solve more.' },
];

const HABIT_KEYS = ['sleep', 'study', 'revision', 'phone', 'problems'];
const HABIT_LABELS = { sleep: 'Sleep', study: 'Study 4h', revision: 'Revision', phone: 'No phone', problems: '10 probs' };

// Get today's date in IST as YYYY-MM-DD
const getTodayIST = () => {
  const now = new Date();
  const ist = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
  return ist.toISOString().slice(0, 10);
};

// Compute current streak — consecutive days (ending today or yesterday) where all 5 habits = true
const computeStreak = (logs) => {
  if (!logs.length) return 0;
  const sorted = [...logs].sort((a, b) => b.date.localeCompare(a.date));
  const today = getTodayIST();
  const yesterday = (() => { const d = new Date(new Date().getTime() + 5.5*60*60*1000 - 86400000); return d.toISOString().slice(0,10); })();
  if (sorted[0].date !== today && sorted[0].date !== yesterday) return 0;
  let streak = 0;
  let expected = sorted[0].date;
  for (const log of sorted) {
    if (log.date !== expected) break;
    const allDone = HABIT_KEYS.every(k => log[k] === true);
    if (!allDone) break;
    streak++;
    const d = new Date(expected);
    d.setDate(d.getDate() - 1);
    expected = d.toISOString().slice(0, 10);
  }
  return streak;
};

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};




const FreeContent = ({ activePage, onNav, onOpenModal, onShowToast, profile, habitLogs = [], onHabitSaved, notifications = [], onMarkNotifRead, onMarkAllNotifRead, isAnchor = false, sessionRequests = [], onSessionRequestSubmitted }) => {
  const { id: userId } = useParams();
  const p = (name) => `page${activePage === name ? ' on' : ''}`;
  const firstName = profile?.name?.split(' ')[0] || 'there';
  const examTarget = profile?.studentProfile?.examTarget || 'your exam';
  const plan = profile?.studentProfile?.plan || 'spark';
  const isForge = plan === 'forge';

  // Session request form state
  const [sessName, setSessName] = useState('');
  const [sessPhone, setSessPhone] = useState('');
  const [sessTopic, setSessTopic] = useState('');
  const [sessTime, setSessTime] = useState('');
  const [sessSending, setSessSending] = useState(false);
  const [sessDone, setSessDone] = useState(false);

  const submitSessionRequest = async () => {
    if (!sessTopic.trim()) { onShowToast('Please describe the topic you need help with'); return; }
    setSessSending(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/student/${userId}/session-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ topic: sessTopic.trim(), phone: sessPhone.trim() || null, preferredTime: sessTime.trim() || null }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      onSessionRequestSubmitted?.({ id: data.id, topic: sessTopic.trim(), phone: sessPhone.trim() || null, preferredTime: sessTime.trim() || null, status: 'pending', createdAt: new Date().toISOString() });
      setSessDone(true);
      onShowToast('Request sent! Our team will reach out within 24h ✓');
    } catch { onShowToast('Failed to send request. Try again.'); }
    finally { setSessSending(false); }
  };

  // Question bank + resources + scores (forge only)
  const [questionBank, setQuestionBank] = useState([]);
  const [qbTab, setQbTab] = useState(0);
  const [resources, setResources] = useState([]);
  const [resTab, setResTab] = useState(0);
  const [scores, setScores] = useState([]);
  const [openWR, setOpenWR] = useState(new Set([0]));
  const toggleWR = (i) => setOpenWR(prev => { const n = new Set(prev); n.has(i) ? n.delete(i) : n.add(i); return n; });
  useEffect(() => {
    if (!isForge || !userId) return;
    const token = localStorage.getItem('token');
    fetch(`${import.meta.env.VITE_API_URL}/api/student/${userId}/question-bank`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : []).then(d => { if (Array.isArray(d)) setQuestionBank(d); }).catch(() => {});
    fetch(`${import.meta.env.VITE_API_URL}/api/student/${userId}/resources`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : []).then(d => { if (Array.isArray(d)) setResources(d); }).catch(() => {});
    fetch(`${import.meta.env.VITE_API_URL}/api/student/${userId}/scores`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : { weeks: [] }).then(d => { if (Array.isArray(d?.weeks)) setScores(d.weeks); }).catch(() => {});
  }, [isForge, userId]);

  // Diagnostic done state (from DB)
  const [diagDone, setDiagDone]         = useState(false);
  const [studyPlan, setStudyPlan]           = useState(null);
  const [studyPlanError, setStudyPlanError] = useState(false);
  const [studyPlanRetry, setStudyPlanRetry] = useState(0);

  useEffect(() => {
    const sp = profile?.studentProfile;
    if (sp?.diagnosticScore !== null && sp?.diagnosticScore !== undefined) {
      setDiagDone(true);
    }
  }, [profile]);

  // Fetch study plan when diagnostic is done
  useEffect(() => {
    if (!diagDone || !userId) return;
    const token = localStorage.getItem('token');
    setStudyPlanError(false);
    fetch(`${import.meta.env.VITE_API_URL}/api/student/${userId}/study-plan`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => {
        if (data && !data.error) setStudyPlan(data);
        else setStudyPlanError(true);
      })
      .catch(() => setStudyPlanError(true));
  }, [diagDone, userId, studyPlanRetry]);

  // Habit state
  const [habitState, setHabitState] = useState({});
  const [habitSaving, setHabitSaving] = useState(false);

  // Topic map state
  const [openSubj, setOpenSubj] = useState(new Set(['physics']));
  const [tmFilter, setTmFilter] = useState('all');
  const [openTopicGroups, setOpenTopicGroups] = useState(new Set(['Important|Physics', 'Important|Biology', 'Maintain|Physics', 'Maintain|Biology']));
  const toggleTopicGroup = (key) => {
    setOpenTopicGroups(prev => {
      const next = new Set(prev);
      if (next.has(key)) { next.delete(key); } else { next.add(key); }
      return next;
    });
  };

  const toggleSubj = (key) => {
    setOpenSubj(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const [openWeeks, setOpenWeeks] = useState(new Set([0]));
  const [notifFilter, setNotifFilter] = useState('all');
  const toggleWeek = (i) => setOpenWeeks(prev => { const n = new Set(prev); n.has(i) ? n.delete(i) : n.add(i); return n; });
  const [showDiagSummary, setShowDiagSummary] = useState(false);

  // Toggle topic completion for current week
  const [confirmTopic, setConfirmTopic] = useState(null); // topic name pending confirmation

  const toggleTopic = async (topicName, subject) => {
    if (!studyPlan) return;
    const weekNumber = studyPlan.currentWeekNum;
    const token = localStorage.getItem('token');
    const isNowDone = !studyPlan.completedThisWeek.includes(topicName);
    if (isNowDone) {
      // Optimistic: immediately move to completed list
      setStudyPlan(prev => ({
        ...prev,
        completedThisWeek: [...prev.completedThisWeek, topicName],
        thisWeek: prev.thisWeek.filter(t => t.topic !== topicName),
      }));
    } else {
      // Optimistic: immediately remove from completed list so user sees reaction
      setStudyPlan(prev => ({
        ...prev,
        completedThisWeek: prev.completedThisWeek.filter(t => t !== topicName),
      }));
    }
    await fetch(`${import.meta.env.VITE_API_URL}/api/student/${userId}/topics/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ topicName, subject, weekNumber }),
    }).catch(() => {});
    if (isNowDone) {
      onShowToast(`${topicName} marked as done ✓`);
    } else {
      onShowToast(`${topicName} moved back to your list`);
      setStudyPlanRetry(r => r + 1);
    }
  };

  // Live countdown to diagnostic retake (3 months from diagnosticTakenAt)
  const [retakeSecs, setRetakeSecs] = useState(0);
  useEffect(() => {
    const takenAt = profile?.studentProfile?.diagnosticTakenAt;
    if (!takenAt) return;
    const retakeAt = new Date(new Date(takenAt).getTime() + 3 * 30 * 24 * 60 * 60 * 1000);
    let id;
    const tick = () => {
      const secs = Math.max(0, Math.floor((retakeAt - Date.now()) / 1000));
      setRetakeSecs(secs);
      if (secs === 0) clearInterval(id);
    };
    tick();
    id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [profile?.studentProfile?.diagnosticTakenAt]);

  const today = getTodayIST();
  const todayLog = habitLogs.find(l => l.date === today) || null;
  const alreadyCheckedIn = !!todayLog;
  const streak = computeStreak(habitLogs);

  // If today already checked in, show saved values; else show in-progress state
  const effectiveState = alreadyCheckedIn
    ? Object.fromEntries(HABIT_KEYS.map(k => [k, todayLog[k] ? 'yes' : 'no']))
    : habitState;

  const habitCount = alreadyCheckedIn
    ? HABIT_KEYS.filter(k => todayLog[k]).length
    : Object.keys(habitState).filter(k => habitState[k] === 'yes').length;
  const allHabitsDone = Object.keys(habitState).length === 5;

  const logHabit = (key, val) => {
    if (alreadyCheckedIn) return;
    setHabitState(prev => ({ ...prev, [key]: val }));
  };

  const saveHabits = async () => {
    if (habitSaving || alreadyCheckedIn) return;
    setHabitSaving(true);
    const token = localStorage.getItem('token');
    try {
      const body = Object.fromEntries(HABIT_KEYS.map(k => [k, habitState[k] === 'yes']));
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/student/${userId}/habits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      onHabitSaved?.(data.log);
      setHabitState({});
      onShowToast('Check-in saved for today ✓');
    } catch {
      onShowToast('Failed to save. Try again.');
    } finally {
      setHabitSaving(false);
    }
  };

  // Build 14-day dot grid from real logs
  const buildDotGrid = () => {
    const logMap = Object.fromEntries(habitLogs.map(l => [l.date, l]));
    return HABIT_KEYS.map(k => {
      const dots = [];
      for (let i = 13; i >= 0; i--) {
        const d = new Date(new Date().getTime() + 5.5*60*60*1000 - i*86400000);
        const dateStr = d.toISOString().slice(0, 10);
        if (dateStr === today) { dots.push(logMap[dateStr] ? (logMap[dateStr][k] ? 'y' : 'n') : 't'); }
        else if (logMap[dateStr]) { dots.push(logMap[dateStr][k] ? 'y' : 'n'); }
        else { dots.push('e'); } // no data
      }
      return { label: HABIT_LABELS[k], dots };
    });
  };
  const dotGrid = buildDotGrid();



  return (
    <div className="content">

      {/* ══════════ HOME ══════════ */}
      <div className={p('home')}>
        {isForge ? (() => {
          // ── FORGE DASHBOARD ──────────────────────────────────────────────
          const examTarget = profile?.studentProfile?.examTarget || 'your exam';
          const targetYear = parseInt(profile?.studentProfile?.targetYear) || null;
          const daysLeft = targetYear ? Math.max(0, Math.ceil((new Date(targetYear, 3, 1) - new Date()) / 86400000)) : null;
          const sortedWeeks = [...scores].sort((a, b) => a.weekNumber - b.weekNumber);
          const latestWeek  = sortedWeeks[sortedWeeks.length - 1] || null;
          const firstWeek   = sortedWeeks[0] || null;
          const latestPct   = latestWeek?.avgPct ?? null;
          const firstPct    = firstWeek?.avgPct  ?? null;
          const improvement = latestPct !== null && firstPct !== null ? Math.round(latestPct - firstPct) : null;
          const latestSubjects = latestWeek?.subjects || [];
          const subjectColor = (pct) => pct >= 70 ? '#22c55e' : pct >= 50 ? 'var(--gold)' : '#ef4444';

          return (
            <>
              {/* Hero */}
              <div className="fr-hero">
                <div className="fr-hero-ring fr-hero-ring-1" />
                <div className="fr-hero-ring fr-hero-ring-2" />
                <div className="fr-hero-top">
                  <div>
                    <div className="fr-hero-badge" style={{ display:'flex',alignItems:'center',gap:'5px' }}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                      Forge Plan
                    </div>
                    <div style={{ fontSize: '11px', color: 'rgba(253,248,240,.35)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: '7px' }}>
                      {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </div>
                    <div className="fr-hero-name">{getGreeting()}, {firstName}.</div>
                    <div className="fr-hero-sub">
                      {latestWeek
                        ? <><strong>{latestPct}%</strong> last test · {sortedWeeks.length} week{sortedWeeks.length !== 1 ? 's' : ''} tracked</>
                        : <>Personalised {examTarget} prep — question bank, resources &amp; score tracking.</>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexShrink: 0 }}>
                    <button className="btn btn-ghost-inv btn-sm" onClick={() => onNav(diagDone ? 'guidance' : 'diagnostic')}>
                      {diagDone ? 'Study Plan →' : 'Start Diagnostic →'}
                    </button>
                    {daysLeft !== null && (
                      <div className="fr-countdown">
                        <div className="fr-countdown-num">{daysLeft}</div>
                        <div className="fr-countdown-lbl">Days to {examTarget}</div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="fr-stats">
                  {[
                    { l: 'Latest Score',   v: latestPct !== null ? latestPct + '%' : '—', gold: true,  click: 'progress' },
                    { l: 'Improvement',    v: improvement !== null ? (improvement >= 0 ? '+' : '') + improvement + '%' : '—', gold: false, click: 'progress' },
                    { l: 'Habit Streak',   v: streak > 0 ? streak + ' days' : alreadyCheckedIn ? habitCount + '/5' : '—', gold: false, click: 'habits' },
                    { l: 'Resources',      v: resources.length || '—', gold: false, click: 'resources' },
                  ].map((s, i) => (
                    <div key={s.l} className={`fr-stat${s.gold ? ' fr-stat-gold' : ''}`}
                      style={{ animationDelay: `${0.08 + i * 0.07}s` }} onClick={() => onNav(s.click)}>
                      <div className="fr-stat-v">{s.v}</div>
                      <div className="fr-stat-l">{s.l}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Score breakdown or CTA */}
              {latestSubjects.length > 0 ? (
                <div className="fr-score-card">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                    <div>
                      <div style={{ fontFamily: 'var(--fs)', fontSize: '16px', fontWeight: 700, color: 'var(--text)' }}>
                        Latest Test — Week {latestWeek.weekNumber}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '2px' }}>
                        {new Date(latestWeek.testDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        {improvement !== null && (
                          <span style={{ marginLeft: '10px', color: improvement >= 0 ? '#22c55e' : '#ef4444', fontWeight: 600 }}>
                            {improvement >= 0 ? '+' : ''}{improvement}% vs Week 1
                          </span>
                        )}
                      </div>
                    </div>
                    <button className="btn btn-ghost btn-sm" onClick={() => onNav('progress')}>Full Journey →</button>
                  </div>
                  {latestSubjects.map((s, i) => {
                    const pct = s.totalMarks > 0 ? Math.round(s.score / s.totalMarks * 100) : 0;
                    const col = subjectColor(pct);
                    return (
                      <div key={s.subject} className="fr-score-subject" style={{ animationDelay: `${0.15 + i * 0.07}s` }}>
                        <div style={{ width: '80px', fontSize: '13px', fontWeight: 500, color: 'var(--text)', flexShrink: 0 }}>{s.subject}</div>
                        <div className="fr-score-bar">
                          <div style={{ background: 'var(--cream2)', borderRadius: '4px', height: '6px', overflow: 'hidden' }}>
                            <div className="fr-score-bar-fill" style={{ '--fw': pct + '%', background: col, animationDelay: `${0.3 + i * 0.07}s` }} />
                          </div>
                        </div>
                        <div style={{ width: '42px', textAlign: 'right', fontSize: '13px', fontWeight: 700, color: col, flexShrink: 0 }}>{pct}%</div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ background: 'linear-gradient(135deg,var(--navy) 0%,var(--navy3) 100%)', borderRadius: 'var(--rl)', padding: '22px 26px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '22px', border: '1px solid var(--gold-b)', animation: 'frSlideUp .4s .08s both' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: diagDone ? 'rgba(34,197,94,.15)' : 'rgba(232,168,48,.14)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {diagDone
                      ? <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                      : <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/><line x1="12" y1="2" x2="12" y2="5"/><line x1="12" y1="19" x2="12" y2="22"/><line x1="2" y1="12" x2="5" y2="12"/><line x1="19" y1="12" x2="22" y2="12"/></svg>}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: 'var(--fs)', fontSize: '17px', fontWeight: 700, color: 'var(--inv)', marginBottom: '5px' }}>
                      {diagDone ? 'Your study plan is active' : 'Start with your diagnostic'}
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--inv2)', lineHeight: 1.7 }}>
                      {diagDone
                        ? 'Topic map, priority order, and weekly plan ready. Your weekly test scores will appear here once logged by admin.'
                        : 'Rate yourself on each topic, confirm with MCQs — get a precise weak area map before touching the question bank.'}
                    </div>
                  </div>
                  <button className="btn btn-gold" style={{ flexShrink: 0 }} onClick={() => onNav(diagDone ? 'guidance' : 'diagnostic')}>
                    {diagDone ? 'Open Plan →' : 'Begin Now →'}
                  </button>
                </div>
              )}

              {/* Forge feature quick-access */}
              <div className="sh"><div className="sh-t">Your Forge Features</div></div>
              <div className="g3 mb">
                {[
                  { svg: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>, label: 'Question Bank', meta: questionBank.length > 0 ? `${questionBank.length} questions available` : 'Questions matched to your weak topics', count: questionBank.length || null, nav: 'questions', bg: 'var(--gold-dim)', color: 'var(--gold)', delay: .2 },
                  { svg: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>, label: 'Resources', meta: resources.length > 0 ? `${resources.length} items from faculty` : 'Study materials and formula sheets', count: resources.length || null, nav: 'resources', bg: 'rgba(34,197,94,.1)', color: '#22c55e', delay: .27 },
                  { svg: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>, label: 'Score Journey', meta: sortedWeeks.length > 0 ? `${sortedWeeks.length} weeks tracked` : 'Weekly test scores and progress', count: sortedWeeks.length || null, nav: 'progress', bg: 'rgba(99,102,241,.1)', color: '#818cf8', delay: .34 },
                  { svg: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>, label: 'Diagnostic', meta: diagDone ? 'Completed — study plan active' : 'Take the diagnostic to unlock your plan', count: null, nav: 'diagnostic', bg: diagDone ? 'rgba(34,197,94,.1)' : 'rgba(239,68,68,.08)', color: diagDone ? '#22c55e' : '#ef4444', delay: .41 },
                  { svg: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>, label: 'Habit Tracker', meta: streak > 0 ? `${streak}-day streak` : alreadyCheckedIn ? 'Checked in today' : 'Check in daily', count: null, nav: 'habits', bg: 'rgba(232,168,48,.08)', color: 'var(--gold)', delay: .48 },
                  { svg: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z"/></svg>, label: 'Topic Map', meta: diagDone ? 'See your weak chapters' : 'Complete diagnostic first', count: null, nav: 'topics', bg: 'var(--navy)', color: 'var(--inv2)', delay: .55 },
                ].map(f => (
                  <div key={f.label} className="fr-feature-card" style={{ animationDelay: `${f.delay}s` }} onClick={() => onNav(f.nav)}>
                    <div className="fr-feature-icon" style={{ background: f.bg, color: f.color }}>{f.svg}</div>
                    <div className="fr-feature-name">{f.label}</div>
                    <div className="fr-feature-meta">{f.meta}</div>
                    {f.count !== null && f.count > 0 && <div className="fr-feature-count">{f.count} available</div>}
                  </div>
                ))}
              </div>

              {/* Request a Session */}
              {(() => {
                const active = sessionRequests.find(r => r.status === 'pending' || r.status === 'assigned');
                const fmtDt = iso => new Date(iso).toLocaleString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' });
                return (
                  <div style={{ background: 'var(--navy)', borderRadius: 'var(--rl)', padding: '18px 22px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '16px', border: '1px solid rgba(255,255,255,.08)' }}>
                    <div style={{ width: '42px', height: '42px', borderRadius: '11px', background: active?.status === 'assigned' ? 'rgba(232,168,48,.14)' : 'rgba(255,255,255,.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {active?.status === 'assigned'
                        ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
                        : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(253,248,240,.5)" strokeWidth="2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: 'var(--fs)', fontSize: '15px', fontWeight: 700, color: '#FDF8F0', marginBottom: '2px' }}>
                        {active ? (active.status === 'assigned' ? 'Session confirmed' : 'Request in review') : 'Book a 1-on-1 Session'}
                      </div>
                      <div style={{ fontSize: '12px', color: 'rgba(253,248,240,.45)', lineHeight: 1.5 }}>
                        {active?.status === 'assigned'
                          ? `${active.facultyName ? active.facultyName + ' · ' : ''}${fmtDt(active.scheduledAt)} · ${active.durationMin} min`
                          : active?.status === 'pending'
                          ? `Topic: ${active.topic.length > 55 ? active.topic.slice(0, 55) + '...' : active.topic}`
                          : '60 min with one of our faculty. Pick your topic, we confirm the time.'}
                      </div>
                    </div>
                    <button className="btn btn-sm" style={{ background: active ? 'rgba(255,255,255,.07)' : 'var(--gold)', color: active ? 'rgba(253,248,240,.6)' : 'var(--navy)', flexShrink: 0 }} onClick={() => onNav('sessions')}>
                      {active ? 'View →' : 'Request →'}
                    </button>
                  </div>
                );
              })()}
            </>
          );
        })() : (
          // ── SPARK HOME (unchanged) ──────────────────────────────────────
          <>
        <div style={{ marginBottom: '22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.1em', fontWeight: 500, marginBottom: '5px' }}>{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div>
            <div style={{ fontFamily: 'var(--fs)', fontSize: '24px', fontWeight: 700, color: 'var(--text)' }}>{getGreeting()}, {firstName}.</div>
            <div style={{ fontSize: '13.5px', color: 'var(--text2)', marginTop: '4px' }}>You're on the <strong style={{ color: 'var(--text)' }}>Free Plan</strong>. Your personalised <strong style={{ color: 'var(--text)' }}>{examTarget}</strong> guidance is ready.</div>
          </div>
          <button className="btn btn-gold" style={{ flexShrink: 0 }} onClick={() => onNav(diagDone ? 'guidance' : 'diagnostic')}>
            {diagDone ? 'View Study Plan →' : 'Start Diagnostic →'}
          </button>
        </div>

        <div style={{ background: 'linear-gradient(135deg,var(--navy) 0%,var(--navy3) 100%)', borderRadius: 'var(--rxl)', padding: '26px 28px', marginBottom: '22px', display: 'flex', alignItems: 'center', gap: '24px', border: '1px solid var(--gold-b)' }}>
          <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: diagDone ? 'rgba(34,197,94,.15)' : 'rgba(232,168,48,.14)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {diagDone
              ? <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
              : <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/><line x1="12" y1="2" x2="12" y2="5"/><line x1="12" y1="19" x2="12" y2="22"/><line x1="2" y1="12" x2="5" y2="12"/><line x1="19" y1="12" x2="22" y2="12"/></svg>}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'var(--fs)', fontSize: '19px', fontWeight: 700, color: 'var(--inv)', marginBottom: '5px' }}>
              {diagDone ? 'Your study plan is ready' : 'Take your free diagnostic first'}
            </div>
            <div style={{ fontSize: '13px', color: 'var(--inv2)', lineHeight: 1.7 }}>
              {diagDone
                ? 'Priorities, weekly roadmap, daily structure — all built from your diagnostic answers and latest test scores.'
                : 'Rate yourself on each topic, confirm with a quick MCQ round — and we\'ll map exactly where you stand and what to fix first.'}
            </div>
          </div>
          <div style={{ flexShrink: 0 }}>
            <button className="btn btn-gold" onClick={() => onNav(diagDone ? 'guidance' : 'diagnostic')}>
              {diagDone ? 'Open Plan →' : 'Begin Now →'}
            </button>
            {!diagDone && <div style={{ fontSize: '10.5px', color: 'var(--inv3)', textAlign: 'center', marginTop: '6px' }}>~10 minutes</div>}
          </div>
        </div>

        <div className="g4 mb">
          <div className="stat sa-gold">
            <div className="stat-l">Diagnostic</div>
            <div className="stat-v" style={{ fontSize: '20px', color: diagDone ? 'var(--green)' : 'var(--text3)' }}>{diagDone ? 'Done ✓' : 'Not done'}</div>
            <div className="stat-n warn" style={diagDone ? { color: 'var(--green)', cursor: 'pointer' } : {}} onClick={() => onNav('diagnostic')}>{diagDone ? 'View results →' : '→ Start now'}</div>
          </div>
          <div className="stat sa-green">
            <div className="stat-l">Habit Streak</div>
            <div className="stat-v">{streak > 0 ? streak : alreadyCheckedIn ? `${habitCount}/5` : '0/5'}</div>
            <div className="stat-n up" style={{ cursor: 'pointer' }} onClick={() => onNav('habits')}>{streak > 0 ? `${streak}-day streak` : alreadyCheckedIn ? 'Done today ✓' : 'Check in today'}</div>
          </div>
          <div className="stat sa-navy">
            <div className="stat-l">Topics Prioritised</div>
            <div className="stat-v">{studyPlan ? Object.values(studyPlan.subjectTopics || {}).flat().length : diagDone ? '...' : 0}</div>
            <div className="stat-n neu" style={{ cursor: diagDone ? 'pointer' : 'default' }} onClick={() => diagDone && onNav('topics')}>{diagDone ? 'in your topic map →' : 'After diagnostic'}</div>
          </div>
          <div className="stat sa-red">
            <div className="stat-l">Need Focus</div>
            <div className="stat-v">{studyPlan ? Object.values(studyPlan.subjectTopics || {}).flat().filter(t => t.label === 'Urgent' || t.label === 'High').length : diagDone ? '...' : 0}</div>
            <div className="stat-n neu" style={{ cursor: diagDone ? 'pointer' : 'default' }} onClick={() => diagDone && onNav('topics')}>{diagDone ? 'urgent + high priority' : 'After diagnostic'}</div>
          </div>
        </div>

        {/* Book a session CTA */}
        <div style={{ background: 'var(--navy)', borderRadius: 'var(--rl)', padding: '18px 22px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '18px', border: '1px solid rgba(232,168,48,.18)' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(232,168,48,.14)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.39 2 2 0 0 1 3.6 1.21h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8.38a16 16 0 0 0 6 6l.94-.94a2 2 0 0 1 2.25-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'var(--fs)', fontSize: '16px', fontWeight: 700, color: '#FDF8F0', marginBottom: '3px' }}>Book a 1-to-1 Session</div>
            <div style={{ fontSize: '12.5px', color: 'rgba(253,248,240,.5)', lineHeight: 1.5 }}>60 minutes with a subject faculty — focused on your exact weak areas. Confirm within 24h.</div>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--gold)', background: 'rgba(232,168,48,.12)', borderRadius: '20px', padding: '4px 12px' }}>₹99 / session</span>
            <button className="btn btn-gold btn-sm" onClick={() => onNav('sessions')}>Book Now →</button>
          </div>
        </div>

        <div className="sh"><div className="sh-t">What's free on Studyverse</div></div>
        <div className="g3 mb">
          <div className="card" style={{ borderTop: '3px solid var(--green)' }}>
            <div style={{ width:'36px',height:'36px',borderRadius:'9px',background:'rgba(34,197,94,.1)',display:'flex',alignItems:'center',justifyContent:'center',marginBottom:'12px' }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg></div>
            <div style={{ fontFamily: 'var(--fs)', fontSize: '15px', fontWeight: 600, color: 'var(--text)', marginBottom: '6px' }}>Personalised Diagnostic</div>
            <div style={{ fontSize: '12.5px', color: 'var(--text2)', lineHeight: 1.7 }}>Self-rate each topic, confirm with MCQs, get a precise weakness map.</div>
            <div style={{ marginTop: '12px' }}><span className="pill pp">Free forever</span></div>
          </div>
          <div className="card" style={{ borderTop: '3px solid var(--gold)' }}>
            <div style={{ width:'36px',height:'36px',borderRadius:'9px',background:'var(--gold-dim)',display:'flex',alignItems:'center',justifyContent:'center',marginBottom:'12px' }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2" strokeLinecap="round"><path d="M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z"/></svg></div>
            <div style={{ fontFamily: 'var(--fs)', fontSize: '15px', fontWeight: 600, color: 'var(--text)', marginBottom: '6px' }}>Topic Weakness Map</div>
            <div style={{ fontSize: '12.5px', color: 'var(--text2)', lineHeight: 1.7 }}>Your exact weak chapters ranked by exam weight.</div>
            <div style={{ marginTop: '12px' }}><span className="pill pp">Free forever</span></div>
          </div>
          <div className="card" style={{ borderTop: '3px solid var(--navy3)' }}>
            <div style={{ width:'36px',height:'36px',borderRadius:'9px',background:'rgba(15,31,61,.07)',display:'flex',alignItems:'center',justifyContent:'center',marginBottom:'12px' }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--navy3)" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg></div>
            <div style={{ fontFamily: 'var(--fs)', fontSize: '15px', fontWeight: 600, color: 'var(--text)', marginBottom: '6px' }}>Study Guidance</div>
            <div style={{ fontSize: '12.5px', color: 'var(--text2)', lineHeight: 1.7 }}>Which topics, in which order, how much time — built from your diagnostic.</div>
            <div style={{ marginTop: '12px' }}><span className="pill pp">Free forever</span></div>
          </div>
          <div className="card" style={{ borderTop: '3px solid var(--green)' }}>
            <div style={{ width:'36px',height:'36px',borderRadius:'9px',background:'rgba(34,197,94,.1)',display:'flex',alignItems:'center',justifyContent:'center',marginBottom:'12px' }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg></div>
            <div style={{ fontFamily: 'var(--fs)', fontSize: '15px', fontWeight: 600, color: 'var(--text)', marginBottom: '6px' }}>Daily Habit Tracker</div>
            <div style={{ fontSize: '12.5px', color: 'var(--text2)', lineHeight: 1.7 }}>5 habits every serious aspirant needs. Check in daily. Build the discipline that separates rankers.</div>
            <div style={{ marginTop: '12px' }}><span className="pill pp">Free forever</span></div>
          </div>
          <div className="card" style={{ borderTop: '3px solid var(--gold)', opacity: .7 }}>
            <div style={{ width:'36px',height:'36px',borderRadius:'9px',background:'var(--gold-dim)',display:'flex',alignItems:'center',justifyContent:'center',marginBottom:'12px' }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2" strokeLinecap="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg></div>
            <div style={{ fontFamily: 'var(--fs)', fontSize: '15px', fontWeight: 600, color: 'var(--text)', marginBottom: '6px' }}>Custom Question Bank</div>
            <div style={{ fontSize: '12.5px', color: 'var(--text2)', lineHeight: 1.7 }}>Questions matched to your weak topics, difficulty level, and exam pattern.</div>
            <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span className="pill po">Unlock</span>
              <button className="btn btn-sm btn-gold" onClick={() => onNav('plans')}>Get Access</button>
            </div>
          </div>
          <div className="card" style={{ borderTop: '3px solid var(--navy3)' }}>
            <div style={{ width:'36px',height:'36px',borderRadius:'9px',background:'rgba(15,31,61,.07)',display:'flex',alignItems:'center',justifyContent:'center',marginBottom:'12px' }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--navy3)" strokeWidth="2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg></div>
            <div style={{ fontFamily: 'var(--fs)', fontSize: '15px', fontWeight: 600, color: 'var(--text)', marginBottom: '6px' }}>1-to-1 Faculty Session</div>
            <div style={{ fontSize: '12.5px', color: 'var(--text2)', lineHeight: 1.7 }}>Book a single session with our faculty. Get your doubts resolved, weak topics explained.</div>
            <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span className="pill po">Pay per session</span>
              <button className="btn btn-sm btn-navy" onClick={() => onNav('sessions')}>Book Now</button>
            </div>
          </div>
        </div>
          </>
        )}
      </div>

      {/* ══════════ DIAGNOSTIC ══════════ */}
      <div className={p('diagnostic')}>
        {diagDone ? (
          <div style={{ maxWidth: '680px', margin: '0 auto', padding: '32px 16px' }}>

            {/* Header card — dark navy */}
            <div style={{ background: 'linear-gradient(135deg, #0F1F3D 0%, #1C2E50 100%)', borderRadius: '20px', padding: '28px 28px 24px', marginBottom: '20px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: -40, right: -40, width: 140, height: 140, borderRadius: '50%', background: 'rgba(232,168,48,0.07)', pointerEvents: 'none' }}/>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '18px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(34,197,94,0.15)', border: '1.5px solid rgba(34,197,94,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <div>
                  <div style={{ fontFamily: 'var(--fs)', fontSize: '20px', fontWeight: 700, color: '#FDF8F0' }}>Diagnostic Completed</div>
                  <div style={{ fontSize: '12px', color: 'rgba(253,248,240,0.5)', marginTop: '3px' }}>
                    Submitted {new Date(profile?.studentProfile?.diagnosticTakenAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </div>
                </div>
                <button className="btn btn-gold" style={{ marginLeft: 'auto', flexShrink: 0 }} onClick={() => onNav('guidance')}>View Plan →</button>
              </div>

              {/* Retake countdown */}
              {retakeSecs > 0 && (
                <div>
                  <div style={{ fontSize: '10px', color: 'rgba(253,248,240,0.4)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: '8px' }}>Next retake in</div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {[{v: Math.floor(retakeSecs/86400), l:'days'},{v: Math.floor((retakeSecs%86400)/3600), l:'hrs'},{v: Math.floor((retakeSecs%3600)/60), l:'min'},{v: retakeSecs%60, l:'sec'}].map(({v,l}) => (
                      <div key={l} style={{ background: 'rgba(255,255,255,0.07)', borderRadius: '10px', padding: '8px 12px', textAlign: 'center', minWidth: '52px' }}>
                        <div style={{ fontFamily: 'var(--fs)', fontSize: '18px', fontWeight: 700, color: '#FDF8F0', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{String(v).padStart(2,'0')}</div>
                        <div style={{ fontSize: '9px', color: 'rgba(253,248,240,0.4)', marginTop: '3px', textTransform: 'uppercase' }}>{l}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Toggle summary card */}
            {studyPlan && (
              <div
                onClick={() => setShowDiagSummary(v => !v)}
                style={{ background: 'var(--cream)', border: '1px solid var(--b)', borderRadius: '14px', padding: '14px 18px', marginBottom: showDiagSummary ? '16px' : '0', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: 'var(--sh)', transition: 'border-color .15s', userSelect: 'none' }}
                onMouseOver={e => e.currentTarget.style.borderColor = 'var(--gold)'}
                onMouseOut={e => e.currentTarget.style.borderColor = 'var(--b)'}
              >
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, #0F1F3D, #1C2E50)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#E8A830" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                  </svg>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text)' }}>View Diagnostic Summary</div>
                  <div style={{ fontSize: '11.5px', color: 'var(--text3)', marginTop: '2px' }}>Scores, priorities, this week's topics, habits</div>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth="2" style={{ flexShrink: 0, transform: showDiagSummary ? 'rotate(180deg)' : '', transition: 'transform .2s' }}>
                  <path d="M6 9l6 6 6-6"/>
                </svg>
              </div>
            )}

            {studyPlan && showDiagSummary && (() => {
              const CLR = { red:'#EF4444', orange:'#F97316', yellow:'#D97706', green:'#22C55E', gray:'#94A3B8' };
              const CLB = { red:'rgba(239,68,68,0.1)', orange:'rgba(249,115,22,0.1)', yellow:'rgba(245,158,11,0.1)', green:'rgba(34,197,94,0.1)', gray:'rgba(148,163,184,0.1)' };
              const trendColor = studyPlan.mockTrend?.trend === 'improving' ? '#16A34A' : studyPlan.mockTrend?.trend === 'declining' ? '#DC2626' : '#8896B3';
              const maxMock = studyPlan.mockTrend ? Math.max(...studyPlan.mockTrend.scores) : 1;
              return (
                <>
                <style dangerouslySetInnerHTML={{ __html:
                  '@keyframes dsBackdrop{from{opacity:0}to{opacity:1}}' +
                  '@keyframes dsCard{from{opacity:0;transform:translateY(40px) scale(0.95)}to{opacity:1;transform:translateY(0) scale(1)}}' +
                  '@keyframes dsStat{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}' +
                  '@keyframes dsSubj{from{opacity:0;transform:translateY(20px) scale(0.92)}to{opacity:1;transform:translateY(0) scale(1)}}' +
                  '@keyframes dsRight{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)}}' +
                  '@keyframes dsLeft{from{opacity:0;transform:translateX(-20px)}to{opacity:1;transform:translateX(0)}}' +
                  '@keyframes dsBarGrow{from{transform:scaleY(0)}to{transform:scaleY(1)}}' +
                  '.ds-bar{transform-origin:bottom;animation:dsBarGrow .6s cubic-bezier(0.34,1.4,0.64,1) both}' +
                  '.ds-week-item{transition:transform .18s,box-shadow .18s}' +
                  '.ds-week-item:hover{transform:translateX(4px);box-shadow:0 4px 12px rgba(15,31,61,0.1)}' +
                  '.ds-habit-card{transition:transform .18s,box-shadow .18s}' +
                  '.ds-habit-card:hover{transform:translateY(-2px);box-shadow:0 6px 16px rgba(15,31,61,0.1)}'
                }} />
                <div onClick={e => { if (e.target === e.currentTarget) setShowDiagSummary(false); }}
                  style={{ position:'fixed', inset:0, background:'rgba(15,31,61,0.6)', backdropFilter:'blur(8px)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', padding:'32px 40px', animation:'dsBackdrop .25s ease' }}>
                <div style={{ background:'#FDF8F0', borderRadius:'24px', border:'1px solid rgba(15,31,61,0.08)', boxShadow:'0 32px 80px rgba(15,31,61,0.28), 0 4px 16px rgba(15,31,61,0.08)', overflow:'hidden', width:'860px', maxWidth:'100%', maxHeight:'100%', overflowY:'auto', animation:'dsCard .42s cubic-bezier(0.34,1.4,0.64,1)' }}>

                  {/* Dark header — same as admin modal */}
                  <div style={{ background: 'linear-gradient(135deg,#0F1F3D 0%,#1C2E50 100%)', padding: '18px 24px', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position:'absolute', top:-40, right:-40, width:160, height:160, borderRadius:'50%', background:'rgba(232,168,48,0.07)', pointerEvents:'none' }}/>
                    <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom: studyPlan.mockTrend ? '14px' : '0' }}>
                      <div>
                        <div style={{ fontSize:'11px', color:'rgba(253,248,240,0.45)', textTransform:'uppercase', letterSpacing:'.1em', marginBottom:'4px' }}>Diagnostic Report</div>
                        <div style={{ fontFamily:'var(--fs)', fontSize:'18px', fontWeight:700, color:'#FDF8F0' }}>{firstName}'s Results</div>
                      </div>
                      <button onClick={() => setShowDiagSummary(false)} style={{ border:'none', background:'rgba(255,255,255,0.1)', borderRadius:'8px', width:'30px', height:'30px', cursor:'pointer', fontSize:'16px', color:'rgba(253,248,240,0.7)' }}>×</button>
                    </div>

                    {/* Stats in header — stagger in */}
                    <div style={{ display:'flex', gap:'10px', marginTop:'12px' }}>
                      {[
                        { val: studyPlan.overview.daysToExam, lbl: 'Days left', color: '#E8A830' },
                        { val: studyPlan.overview.studyHoursPerDay+'h', lbl: 'Daily', color: '#FDF8F0' },
                      ].map(({ val, lbl, color }, i) => (
                        <div key={lbl} style={{ flex:1, background:'rgba(255,255,255,0.08)', borderRadius:'12px', padding:'10px 12px', textAlign:'center', animation:`dsStat .4s cubic-bezier(0.34,1.4,0.64,1) ${0.15+i*0.07}s both` }}>
                          <div style={{ fontSize:'20px', fontWeight:800, color, lineHeight:1 }}>{val}</div>
                          <div style={{ fontSize:'10px', color:'rgba(253,248,240,0.45)', marginTop:'3px', textTransform:'uppercase' }}>{lbl}</div>
                        </div>
                      ))}
                      {studyPlan.mockTrend && (
                        <div style={{ flex:1.4, background:'rgba(255,255,255,0.08)', borderRadius:'12px', padding:'10px 12px', animation:'dsStat .4s cubic-bezier(0.34,1.4,0.64,1) .29s both' }}>
                          <div style={{ display:'flex', alignItems:'flex-end', gap:'3px', height:'24px', marginBottom:'3px' }}>
                            {studyPlan.mockTrend.scores.map((s, i) => (
                              <div key={i} className="ds-bar" style={{ flex:1, borderRadius:'3px 3px 0 0', background: i === studyPlan.mockTrend.scores.length-1 ? trendColor : 'rgba(255,255,255,0.25)', height:`${Math.round((s/maxMock)*24)}px`, animationDelay:`${0.4+i*0.08}s` }}/>
                            ))}
                          </div>
                          <div style={{ fontSize:'10px', color:'rgba(253,248,240,0.45)', textTransform:'uppercase', display:'flex', alignItems:'center', gap:'3px' }}>
                            <span style={{ color:trendColor, fontWeight:700 }}>{studyPlan.mockTrend.trend === 'improving' ? '↑' : studyPlan.mockTrend.trend === 'declining' ? '↓' : '→'}</span> Mock trend
                          </div>
                        </div>
                      )}
                      {studyPlan.overview.targetScore && (
                        <div style={{ flex:1, background:'rgba(255,255,255,0.08)', borderRadius:'12px', padding:'10px 12px', textAlign:'center' }}>
                          <div style={{ fontSize:'18px', fontWeight:800, color:'#FDF8F0', lineHeight:1 }}>{studyPlan.overview.targetScore}</div>
                          <div style={{ fontSize:'10px', color:'rgba(253,248,240,0.45)', marginTop:'3px', textTransform:'uppercase' }}>Target</div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 2-column body */}
                  <div style={{ padding:'16px 20px', display:'grid', gridTemplateColumns:'1fr 1.2fr', gap:'18px' }}>

                    {/* LEFT — habits + maintain */}
                    <div style={{ animation:'dsLeft .45s cubic-bezier(0.4,0,0.2,1) .2s both' }}>
                      <div style={{ fontSize:'10px', fontWeight:700, color:'#8896B3', textTransform:'uppercase', letterSpacing:'.07em', marginBottom:'8px' }}>Habits to Fix</div>
                      {studyPlan.habits.length > 0 ? studyPlan.habits.map((h, i) => (
                        <div key={i} className="ds-habit-card" style={{ display:'flex', gap:'10px', padding:'10px 12px', background:'#fff', borderRadius:'12px', marginBottom:'7px', border:'1px solid rgba(15,31,61,0.08)', animation:`dsLeft .35s ease ${0.3+i*0.08}s both` }}>
                          <span style={{ fontSize:'18px', flexShrink:0 }}>{h.icon}</span>
                          <div>
                            <div style={{ fontSize:'12px', fontWeight:700, color:'#0F1F3D', marginBottom:'3px' }}>{h.title}</div>
                            <div style={{ fontSize:'11px', color:'#4A5568', lineHeight:1.5 }}>{h.body}</div>
                            <span style={{ display:'inline-block', marginTop:'5px', fontSize:'10px', fontWeight:700, color:'#16A34A', background:'rgba(34,197,94,0.1)', padding:'2px 8px', borderRadius:'99px' }}>{h.impact}</span>
                          </div>
                        </div>
                      )) : (
                        <div style={{ fontSize:'12px', color:'#8896B3', padding:'12px', background:'#fff', borderRadius:'12px', border:'1px solid rgba(15,31,61,0.08)' }}>No habit issues detected — great discipline!</div>
                      )}

                      {studyPlan.maintainTopics?.length > 0 && (
                        <>
                          <div style={{ fontSize:'10px', fontWeight:700, color:'#8896B3', textTransform:'uppercase', letterSpacing:'.07em', margin:'12px 0 8px' }}>Keep These Warm</div>
                          <div style={{ background:'#fff', borderRadius:'12px', padding:'4px 12px', border:'1px solid rgba(15,31,61,0.08)' }}>
                            {studyPlan.maintainTopics.map((t, i) => (
                              <div key={i} style={{ display:'flex', alignItems:'center', gap:'8px', padding:'7px 0', borderBottom: i < studyPlan.maintainTopics.length-1 ? '1px solid rgba(15,31,61,0.05)' : 'none' }}>
                                <div style={{ width:7, height:7, borderRadius:'50%', background:'#22C55E', flexShrink:0 }}/>
                                <div style={{ flex:1, fontSize:'12px', color:'#0F1F3D', fontWeight:500 }}>{t.topic}</div>
                                <span style={{ fontSize:'10px', color:'#16A34A', background:'rgba(34,197,94,0.08)', padding:'2px 7px', borderRadius:'99px', fontWeight:600 }}>30m/3d</span>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>

                    {/* RIGHT — subject cards + this week */}
                    <div style={{ animation:'dsRight .45s cubic-bezier(0.4,0,0.2,1) .25s both' }}>
                      <div style={{ fontSize:'10px', fontWeight:700, color:'#8896B3', textTransform:'uppercase', letterSpacing:'.07em', marginBottom:'8px' }}>Subject Priority</div>
                      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'8px', marginBottom:'14px' }}>
                        {studyPlan.subjectFocus.map((s, i) => (
                          <div key={i} style={{ background:'#fff', border:'1px solid rgba(15,31,61,0.08)', borderRadius:'13px', padding:'12px 8px', textAlign:'center', borderTop:`3px solid ${CLR[s.urgencyColor]||CLR.gray}`, animation:`dsSubj .45s cubic-bezier(0.34,1.4,0.64,1) ${0.3+i*0.08}s both` }}>
                            <div style={{ fontSize:'18px', fontWeight:800, color:'#0F1F3D', lineHeight:1, marginBottom:'4px' }}>{s.scorePct !== null ? s.scorePct+'%' : 'N/A'}</div>
                            <div style={{ fontSize:'11px', fontWeight:700, color:'#0F1F3D', marginBottom:'5px' }}>{s.subject}</div>
                            <span style={{ fontSize:'10px', fontWeight:700, padding:'2px 7px', borderRadius:'99px', background:CLB[s.urgencyColor]||CLB.gray, color:CLR[s.urgencyColor]||CLR.gray }}>{s.urgency}</span>
                          </div>
                        ))}
                      </div>

                      <div style={{ fontSize:'10px', fontWeight:700, color:'#8896B3', textTransform:'uppercase', letterSpacing:'.07em', marginBottom:'8px' }}>This Week — Focus</div>
                      {studyPlan.thisWeek.map((t, i) => (
                        <div key={i} className="ds-week-item" style={{ display:'flex', alignItems:'center', gap:'10px', padding:'9px 12px', background:'#fff', borderRadius:'10px', marginBottom:'6px', border:'1px solid rgba(15,31,61,0.07)', borderLeft:`3px solid ${CLR[t.color]||CLR.gray}`, animation:`dsRight .35s ease ${0.4+i*0.06}s both` }}>
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ fontSize:'12px', fontWeight:700, color:'#0F1F3D', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{t.topic}</div>
                            <div style={{ fontSize:'10px', color:'#8896B3', marginTop:'1px' }}>{t.subject}</div>
                          </div>
                          <div style={{ textAlign:'right', flexShrink:0 }}>
                            <span style={{ fontSize:'10px', fontWeight:700, padding:'2px 7px', borderRadius:'99px', background:CLB[t.color]||CLB.gray, color:CLR[t.color]||CLR.gray, display:'block', marginBottom:'2px' }}>{t.label}</span>
                            <span style={{ fontSize:'10px', color:'#8896B3' }}>{t.hours}h</span>
                          </div>
                        </div>
                      ))}

                      <button className="btn btn-gold" style={{ width:'100%', justifyContent:'center', marginTop:'12px' }} onClick={() => onNav('guidance')}>
                        Open Full Study Plan →
                      </button>
                    </div>
                  </div>
                </div>
                </div>
                </>
              );
            })()}
          </div>

        ) : (
          <DiagnosticForm profile={profile} onComplete={() => setDiagDone(true)} />
        )}
      </div>

      {/* ══════════ TOPIC MAP ══════════ */}
      <div className={p('topics')}>

        {/* Page header */}
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:'16px', marginBottom:'16px', flexWrap:'wrap' }}>
          <div>
            <div style={{ fontFamily:'var(--fs)', fontSize:'22px', fontWeight:800, color:'var(--text)' }}>Topic Mastery Map</div>
            <div style={{ fontSize:'12.5px', color:'var(--text3)', marginTop:'3px' }}>
              {studyPlan
                ? Object.values(studyPlan.subjectTopics || {}).flat().length + ' chapters analysed · built from your diagnostic'
                : diagDone ? 'Loading your map...' : 'Complete diagnostic to unlock your map'}
            </div>
          </div>
          {diagDone && (
            <button className="btn btn-ghost btn-sm" onClick={() => onNav('guidance')} style={{ flexShrink:0 }}>View Full Plan →</button>
          )}
        </div>

        {!diagDone && (
          <div className="tm2-locked">
            <div className="tm2-lock-blur">
              <div style={{ padding:'0 0 20px' }}>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'10px', marginBottom:'14px' }}>
                  {['Physics','Mathematics','Chemistry'].map(s => (
                    <div key={s} style={{ background:'var(--cream)', border:'1px solid var(--b)', borderRadius:'16px', padding:'14px 12px', display:'flex', alignItems:'center', gap:'10px' }}>
                      <div style={{ width:'68px', height:'68px', borderRadius:'50%', background:'var(--cream2)', flexShrink:0 }} />
                      <div style={{ flex:1 }}>
                        <div className="sk" style={{ height:13, width:'75%', marginBottom:6 }} />
                        <div className="sk" style={{ height:10, width:'55%', marginBottom:5 }} />
                        <div className="sk" style={{ height:16, width:'45%', borderRadius:'20px' }} />
                      </div>
                    </div>
                  ))}
                </div>
                {/* Section label skeleton */}
                <div style={{ display:'flex', alignItems:'center', gap:'8px', margin:'16px 0 10px' }}>
                  <div className="sk" style={{ width:9, height:9, borderRadius:'50%', flexShrink:0 }} />
                  <div className="sk" style={{ height:10, width:'12%' }} />
                  <div className="sk" style={{ height:10, width:'8%' }} />
                  <div style={{ flex:1, height:1, background:'var(--b)' }} />
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px' }}>
                  {[1,2,3,4].map(i => (
                    <div key={i} style={{ background:'var(--cream)', border:'1px solid var(--b)', borderRadius:'14px', padding:'14px 14px 12px 18px', display:'flex', flexDirection:'column', gap:'8px' }}>
                      <div style={{ display:'flex', gap:'10px', alignItems:'flex-start' }}>
                        <div className="sk" style={{ flex:1, height:14 }} />
                        <div className="sk" style={{ width:44, height:44, borderRadius:'50%', flexShrink:0 }} />
                      </div>
                      <div className="sk" style={{ height:10, width:'60%' }} />
                      <div className="sk" style={{ height:4, borderRadius:'10px' }} />
                      <div style={{ display:'flex', gap:'8px' }}>
                        <div className="sk" style={{ height:11, width:'35%' }} />
                        <div className="sk" style={{ height:11, width:'25%' }} />
                      </div>
                    </div>
                  ))}
                </div>
                {/* Second section */}
                <div style={{ display:'flex', alignItems:'center', gap:'8px', margin:'16px 0 10px' }}>
                  <div className="sk" style={{ width:9, height:9, borderRadius:'50%', flexShrink:0 }} />
                  <div className="sk" style={{ height:10, width:'10%' }} />
                  <div className="sk" style={{ height:10, width:'9%' }} />
                  <div style={{ flex:1, height:1, background:'var(--b)' }} />
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px' }}>
                  {[1,2,3,4].map(i => (
                    <div key={i} style={{ background:'var(--cream)', border:'1px solid var(--b)', borderRadius:'14px', padding:'14px 14px 12px 18px', display:'flex', flexDirection:'column', gap:'8px' }}>
                      <div style={{ display:'flex', gap:'10px', alignItems:'flex-start' }}>
                        <div className="sk" style={{ flex:1, height:14 }} />
                        <div className="sk" style={{ width:44, height:44, borderRadius:'50%', flexShrink:0 }} />
                      </div>
                      <div className="sk" style={{ height:10, width:'55%' }} />
                      <div className="sk" style={{ height:4, borderRadius:'10px' }} />
                      <div style={{ display:'flex', gap:'8px' }}>
                        <div className="sk" style={{ height:11, width:'30%' }} />
                        <div className="sk" style={{ height:11, width:'28%' }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="tm2-lock-overlay">
              <div className="sp-lock-card" style={{ background:'#fff', borderRadius:'20px', padding:'36px 28px', textAlign:'center', boxShadow:'0 20px 60px rgba(15,31,61,.16), 0 4px 16px rgba(15,31,61,.08)', maxWidth:'340px', width:'100%', border:'1px solid rgba(15,31,61,.07)' }}>
                <div style={{ width:'56px', height:'56px', borderRadius:'16px', background:'linear-gradient(135deg,#0F1F3D,#1C2E50)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#E8A830" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                </div>
                <div style={{ fontFamily:'var(--fs)', fontSize:'18px', fontWeight:700, color:'var(--text)', marginBottom:'8px', lineHeight:1.3 }}>Take the diagnostic first</div>
                <div style={{ fontSize:'12.5px', color:'var(--text2)', lineHeight:1.75, marginBottom:'20px' }}>Your chapter-level weakness map unlocks after the diagnostic. See exactly which topics need the most work.</div>
                <button className="btn btn-gold" style={{ width:'100%', justifyContent:'center' }} onClick={() => onNav('diagnostic')}>Take Diagnostic →</button>
                <div style={{ fontSize:'11px', color:'var(--text3)', marginTop:'10px' }}>Free · 26 questions · ~10 minutes</div>
              </div>
            </div>
          </div>
        )}

        {diagDone && !studyPlan && !studyPlanError && (
          <div style={{ textAlign:'center', padding:'48px 0', color:'var(--text3)', fontSize:'13px' }}>Loading your topic map...</div>
        )}

        {studyPlan && (() => {
          const isNEET = examTarget.toLowerCase().includes('neet');
          const R_SUBJ = 32, CIRC_SUBJ = 201;
          const R_TOPIC = 18, CIRC_TOPIC = 113;

          const PRIORITY_STYLE = {
            Urgent:    { color:'#DC2626', bg:'rgba(220,38,38,.1)',  cls:'tm2-c-urgent',    label:'Urgent',    dot:'#DC2626' },
            High:      { color:'#EA580C', bg:'rgba(234,88,12,.1)',  cls:'tm2-c-high',      label:'High',      dot:'#EA580C' },
            Important: { color:'#B45309', bg:'rgba(217,119,6,.1)',  cls:'tm2-c-important', label:'Important', dot:'#D97706' },
            Maintain:  { color:'#15803D', bg:'rgba(34,197,94,.1)',  cls:'tm2-c-maintain',  label:'Strong',    dot:'#22C55E' },
          };
          const LABEL_PCT  = { Urgent:22, High:48, Important:70, Maintain:88 };
          const LABEL_HOURS = { Urgent:'3–4h', High:'2–3h', Important:'1–2h', Maintain:'30m' };
          const PRIORITY_ORDER = { Urgent:0, High:1, Important:2, Maintain:3 };

          const TOPIC_MARKS_MAP = {
            'electrostatics':{ jee:9,neet:8 }, 'current electricity':{ jee:7,neet:7 },
            'mechanics':{ jee:8,neet:7 }, 'kinematics':{ jee:6,neet:6 },
            'work':{ jee:6,neet:6 }, 'waves':{ jee:5,neet:6 },
            'optics':{ jee:6,neet:8 }, 'thermodynamics':{ jee:7,neet:8 },
            'magnetism':{ jee:6,neet:7 }, 'rotation':{ jee:6,neet:5 },
            'gravitation':{ jee:5,neet:6 }, 'fluid':{ jee:5,neet:5 },
            'modern physics':{ jee:6,neet:8 }, 'semiconductor':{ jee:5,neet:6 },
            'integration':{ jee:10,neet:0 }, 'limits':{ jee:7,neet:0 },
            'coordinate':{ jee:8,neet:0 }, 'probability':{ jee:6,neet:0 },
            'vectors':{ jee:5,neet:0 }, 'calculus':{ jee:8,neet:0 },
            'matrices':{ jee:5,neet:0 }, 'complex':{ jee:5,neet:0 },
            'differential':{ jee:7,neet:0 }, 'binomial':{ jee:5,neet:0 },
            'trigonometry':{ jee:5,neet:0 }, 'permutation':{ jee:5,neet:0 },
            'mole':{ jee:7,neet:7 }, 'equilibrium':{ jee:7,neet:8 },
            'organic':{ jee:9,neet:12 }, 'inorganic':{ jee:5,neet:8 },
            'electrochemistry':{ jee:6,neet:6 }, 'solution':{ jee:5,neet:6 },
            'kinetics':{ jee:5,neet:5 }, 'chemical bonding':{ jee:6,neet:7 },
            'reaction':{ jee:6,neet:8 }, 'surface':{ jee:4,neet:5 },
            'genetics':{ jee:0,neet:10 }, 'ecology':{ jee:0,neet:7 },
            'cell':{ jee:0,neet:8 }, 'plant':{ jee:0,neet:7 },
            'human physiology':{ jee:0,neet:9 }, 'evolution':{ jee:0,neet:6 },
            'biomolecule':{ jee:0,neet:6 }, 'reproduction':{ jee:0,neet:8 },
          };

          const SUBJ_COLOR = isAnchor ? {
            Physics:     { bg:'rgba(125,211,252,0.12)', color:'#7DD3FC', border:'rgba(125,211,252,0.22)' },
            Mathematics: { bg:'rgba(196,181,253,0.12)', color:'#C4B5FD', border:'rgba(196,181,253,0.22)' },
            Chemistry:   { bg:'rgba(251,191,36,0.12)',  color:'#FCD34D', border:'rgba(251,191,36,0.22)'  },
            Biology:     { bg:'rgba(134,239,172,0.12)', color:'#86EFAC', border:'rgba(134,239,172,0.22)' },
          } : {
            Physics:     { bg:'rgba(51,82,138,0.09)',  color:'#33528A', border:'rgba(51,82,138,0.2)'   },
            Mathematics: { bg:'rgba(80,66,128,0.09)',  color:'#504280', border:'rgba(80,66,128,0.2)'   },
            Chemistry:   { bg:'rgba(160,100,50,0.1)',  color:'#8A5033', border:'rgba(160,100,50,0.22)' },
            Biology:     { bg:'rgba(51,120,80,0.09)',  color:'#337850', border:'rgba(51,120,80,0.2)'   },
          };

          const getEstMarks = (name) => {
            const n = name.toLowerCase();
            let best = 4;
            for (const k in TOPIC_MARKS_MAP) {
              if (n.includes(k)) {
                const v = isNEET ? TOPIC_MARKS_MAP[k].neet : TOPIC_MARKS_MAP[k].jee;
                if (v > best) best = v;
              }
            }
            return best;
          };

          const subjDefs = isNEET
            ? [{ key:'Biology', icon:'🧬' }, { key:'Physics', icon:'⚡' }, { key:'Chemistry', icon:'⚛️' }]
            : [{ key:'Physics', icon:'⚡' }, { key:'Mathematics', icon:'📐' }, { key:'Chemistry', icon:'⚛️' }];

          const thisWeekNames = new Set((studyPlan.thisWeek || []).map(t => t.topic));

          const allTopicsFlat = subjDefs.flatMap(s =>
            (studyPlan.subjectTopics?.[s.key] || []).map(t => ({
              ...t, subject: s.key, icon: s.icon,
              estMarks: getEstMarks(t.name),
              hours: LABEL_HOURS[t.label] || '1–2h',
              isThisWeek: thisWeekNames.has(t.name),
            }))
          ).sort((a, b) => (PRIORITY_ORDER[a.label] ?? 4) - (PRIORITY_ORDER[b.label] ?? 4));

          const urgentList   = allTopicsFlat.filter(t => t.label === 'Urgent');
          const highList     = allTopicsFlat.filter(t => t.label === 'High');
          const importantList= allTopicsFlat.filter(t => t.label === 'Important');
          const maintainList = allTopicsFlat.filter(t => t.label === 'Maintain');
          const potentialMarks = urgentList.concat(highList).reduce((s, t) => s + t.estMarks, 0);
          const topInsight = urgentList[0] || highList[0] || null;

          const filteredFlat = tmFilter === 'urgent' ? urgentList
            : tmFilter === 'high' ? highList
            : tmFilter === 'week' ? allTopicsFlat.filter(t => t.isThisWeek)
            : allTopicsFlat;

          const groups = tmFilter !== 'all' ? [
            { key: tmFilter, label: tmFilter === 'urgent' ? 'Urgent' : tmFilter === 'high' ? 'High Priority' : 'This Week', topics: filteredFlat },
          ] : [
            { key: 'Urgent',    label: 'Urgent',               topics: urgentList },
            { key: 'High',      label: 'High Priority',         topics: highList },
            { key: 'Important', label: 'Important',             topics: importantList },
            { key: 'Maintain',  label: 'Strong — Maintain',     topics: maintainList },
          ].filter(g => g.topics.length > 0);

          return (
            <>
              {/* #1 priority insight — only when Urgent topics exist */}
              {topInsight && topInsight.label === 'Urgent' && (
                <div className="tm2-top-insight">
                  <div className="tm2-insight-dot" />
                  <div className="tm2-insight-body">
                    <div className="tm2-insight-title">Focus on {topInsight.name} right now</div>
                    <div className="tm2-insight-sub">
                      {topInsight.subject} · Urgent ·
                      {topInsight.estMarks > 0 ? ' ~' + topInsight.estMarks + (isNEET ? ' NEET marks' : ' JEE marks') + ' ·' : ''}
                      {topInsight.isThisWeek ? ' In this week\'s plan' : ' Not yet scheduled'}
                    </div>
                  </div>
                  <button className="btn btn-sm btn-gold" style={{ flexShrink:0 }} onClick={() => onNav('guidance')}>
                    Study Plan →
                  </button>
                </div>
              )}

              {/* Filter tabs */}
              <div className="tm2-filters">
                {[
                  { key:'all',    label:'All Topics (' + allTopicsFlat.length + ')' },
                  { key:'urgent', label:urgentList.length + ' Urgent' },
                  { key:'high',   label:highList.length + ' High' },
                  { key:'week',   label:'📅 This Week' },
                ].map(f => (
                  <button key={f.key} className={'tm2-filter' + (tmFilter === f.key ? ' on' : '')} onClick={() => setTmFilter(f.key)}>
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Subject summary rings — only when showing all */}
              {tmFilter === 'all' && (
                <div className="tm2-subj-row">
                  {subjDefs.map((s, si) => {
                    const spSubj = studyPlan.subjectFocus?.find(sf => sf.subject === s.key);
                    const scorePct = spSubj?.scorePct ?? 0;
                    const urg = spSubj?.urgency || 'no data';
                    const urgColor = { urgent:'#DC2626', high:'#EA580C', moderate:'#D97706', maintain:'#22C55E', 'no data':'#94A3B8' }[urg] || '#94A3B8';
                    const urgLabel = { urgent:'Urgent', high:'High', moderate:'Important', maintain:'Strong', 'no data':'No data' }[urg] || urg;
                    const sTopics = studyPlan.subjectTopics?.[s.key] || [];
                    const uCnt = sTopics.filter(t => t.label === 'Urgent').length;
                    const hCnt = sTopics.filter(t => t.label === 'High').length;
                    const dash = Math.round((scorePct / 100) * CIRC_SUBJ);
                    const dashOff = CIRC_SUBJ - dash;
                    const spHours = spSubj?.hoursPerWeek || 0;
                    return (
                      <div key={s.key} className="tm2-subj-card" style={{ animationDelay: (si * 0.08) + 's' }}>
                        <div className="tm2-subj-top" style={{ background: urgColor }} />
                        <div className="tm2-subj-inner">
                          <div className="tm2-subj-ring-wrap">
                            <svg width="68" height="68" viewBox="0 0 68 68">
                              <circle className="tm2-ring-track" cx="34" cy="34" r={R_SUBJ} />
                              <circle className="tm2-ring-fill" cx="34" cy="34" r={R_SUBJ} stroke={urgColor} style={{ '--ring-dash': dashOff }} />
                            </svg>
                            <div className="tm2-subj-pct">
                              <div className="tm2-subj-pct-val">{scorePct !== null ? scorePct + '%' : '—'}</div>
                              <div className="tm2-subj-icon">{s.icon}</div>
                            </div>
                          </div>
                          <div className="tm2-subj-info">
                            <div className="tm2-subj-name">{s.key}</div>
                            <div className="tm2-subj-stat">
                              {uCnt > 0 ? uCnt + ' urgent' : ''}
                              {uCnt > 0 && hCnt > 0 ? ' · ' : ''}
                              {hCnt > 0 ? hCnt + ' high' : ''}
                              {uCnt === 0 && hCnt === 0 ? 'Looking good' : ''}
                              {spHours > 0 ? ' · ' + spHours + 'h/wk' : ''}
                            </div>
                            <div className="tm2-subj-urgbadge" style={{ background: urgColor + '1a', color: urgColor }}>{urgLabel}</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Score potential banner */}
              {potentialMarks > 0 && (urgentList.length + highList.length) > 0 && tmFilter === 'all' && (
                <div className="tm2-potential">
                  <div className="tm2-potential-left">
                    <div className="tm2-pot-num">+{potentialMarks}</div>
                    <div className="tm2-pot-divider" />
                    <div>
                      <div className="tm2-pot-text">marks you can gain by fixing your priority topics</div>
                      <div className="tm2-pot-sub">
                        Based on {isNEET ? 'NEET' : 'JEE'} paper analysis · {urgentList.length} Urgent · {highList.length} High priority
                      </div>
                    </div>
                  </div>
                  <button className="btn btn-sm" style={{ background:'rgba(220,38,38,.08)', color:'#DC2626', border:'1px solid rgba(220,38,38,.18)', flexShrink:0 }} onClick={() => onNav('guidance')}>
                    See Plan →
                  </button>
                </div>
              )}

              {/* Topic grid — grouped by priority, subject-collapsed for Important/Maintain */}
              {filteredFlat.length === 0 ? (
                <div className="tm2-empty">
                  {tmFilter === 'week' ? 'No topics planned for this week yet.' : 'No topics in this category.'}
                </div>
              ) : groups.map((group, gi) => {
                const ps = PRIORITY_STYLE[group.key] || PRIORITY_STYLE.Maintain;
                const useSubGroups = tmFilter === 'all' && (group.key === 'Important' || group.key === 'Maintain');

                const renderCard = (t, ci, delayBase) => {
                  const ts = PRIORITY_STYLE[t.label] || PRIORITY_STYLE.Maintain;
                  const pct = LABEL_PCT[t.label] || 80;
                  const dashOff = CIRC_TOPIC - Math.round((pct / 100) * CIRC_TOPIC);
                  return (
                    <div key={ci} className={'tm2-card ' + ts.cls} style={{ animationDelay: (delayBase + ci * 0.04) + 's' }}>
                      <div className="tm2-card-accent" />
                      <div className="tm2-card-top">
                        <div className="tm2-card-name">{t.name}</div>
                        <div className="tm2-card-ring-wrap">
                          <svg width="44" height="44" viewBox="0 0 44 44">
                            <circle className="tm2-topic-ring-track" cx="22" cy="22" r={R_TOPIC} />
                            <circle className="tm2-topic-ring-fill" cx="22" cy="22" r={R_TOPIC} stroke={ts.color} style={{ '--ring-dash': dashOff, animationDelay: (delayBase + ci * 0.04 + 0.12) + 's' }} />
                          </svg>
                          <div className="tm2-card-ring-val" style={{ color: ts.color }}>{pct}%</div>
                        </div>
                      </div>
                      <div className="tm2-badges">
                        <span className="tm2-badge-subj" style={{ background: (SUBJ_COLOR[t.subject] || {}).bg, color: (SUBJ_COLOR[t.subject] || {}).color, borderColor: (SUBJ_COLOR[t.subject] || {}).border }}>{t.subject}</span>
                        <span className="tm2-badge-priority" style={{ background: ts.bg, color: ts.color }}>{ts.label}</span>
                        {t.isThisWeek && <span className="tm2-badge-week">📅 This Week</span>}
                      </div>
                      <div className="tm2-bar-wrap">
                        <div className="tm2-bar">
                          <div className="tm2-bar-fill" style={{ '--bar-w': pct + '%', background: ts.color + 'cc', animationDelay: (delayBase + ci * 0.04 + 0.2) + 's' }} />
                        </div>
                      </div>
                      <div className="tm2-stats">
                        {t.estMarks > 0 && (
                          <>
                            <div className="tm2-stat">
                              <div className="tm2-stat-val" style={{ color: ts.color }}>~{t.estMarks}</div>
                              <div className="tm2-stat-lbl">{isNEET ? 'NEET' : 'JEE'} marks</div>
                            </div>
                            <div className="tm2-stat-div" />
                          </>
                        )}
                        <div className="tm2-stat">
                          <div className="tm2-stat-val">{t.hours}</div>
                          <div className="tm2-stat-lbl">this week</div>
                        </div>
                      </div>
                      <div className="tm2-card-footer">
                        <button className="tm2-study-btn" onClick={() => onNav('guidance')}>Study this →</button>
                      </div>
                    </div>
                  );
                };

                return (
                  <div key={group.key}>
                    <div className="tm2-section-hdr">
                      <div className="tm2-section-dot" style={{ background: ps.dot || '#94A3B8' }} />
                      <div className="tm2-section-label" style={{ color: ps.color || 'var(--text3)' }}>{group.label}</div>
                      <div className="tm2-section-count">{group.topics.length} topic{group.topics.length !== 1 ? 's' : ''}</div>
                      <div className="tm2-section-line" />
                    </div>

                    {useSubGroups ? (() => {
                      const bySubj = {};
                      for (const t of group.topics) {
                        if (!bySubj[t.subject]) { bySubj[t.subject] = { topics: [], icon: t.icon }; }
                        bySubj[t.subject].topics.push(t);
                      }
                      return Object.entries(bySubj).map(([subj, data], si) => {
                        const grpKey = group.key + '|' + subj;
                        const isGrpOpen = openTopicGroups.has(grpKey);
                        const doneCount = data.topics.filter(t => studyPlan.completedThisWeek?.includes(t.name)).length;
                        const sc = SUBJ_COLOR[subj] || { bg:'rgba(15,31,61,.07)', color:'var(--navy3)', border:'rgba(15,31,61,.12)' };
                        const spSubjInfo = studyPlan.subjectFocus?.find(sf => sf.subject === subj);
                        const subjPct = spSubjInfo?.scorePct ?? null;
                        return (
                          <div key={subj} className="tm2-subgrp-wrap">
                            <div className="tm2-subgrp-hdr" style={{ borderLeftColor: sc.color, background: sc.bg }} onClick={() => toggleTopicGroup(grpKey)}>
                              <div className="tm2-subgrp-icon-box" style={{ background: sc.bg, borderColor: sc.border }}>
                                {data.icon}
                              </div>
                              <div className="tm2-subgrp-info">
                                <span className="tm2-subgrp-name">{subj}</span>
                                {subjPct !== null && (
                                  <span className="tm2-subgrp-score">{subjPct}%</span>
                                )}
                              </div>
                              {doneCount > 0 && (
                                <span className="tm2-subgrp-done">{doneCount} done ✓</span>
                              )}
                              <span className="tm2-subgrp-count-pill" style={{ background: sc.bg, color: sc.color, borderColor: sc.border }}>
                                {data.topics.length} topic{data.topics.length !== 1 ? 's' : ''}
                              </span>
                              <svg className="tm2-subgrp-arrow" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth="2" style={{ transform: isGrpOpen ? 'rotate(180deg)' : '' }}>
                                <path d="M6 9l6 6 6-6"/>
                              </svg>
                            </div>
                            <div className={'tm2-subgrp-body' + (isGrpOpen ? ' open' : '')}>
                              <div className="tm2-grid" style={{ padding: '4px 0 8px' }}>
                                {data.topics.map((t, ci) => renderCard(t, ci, si * 0.1))}
                              </div>
                            </div>
                          </div>
                        );
                      });
                    })() : (
                      <div className="tm2-grid">
                        {group.topics.map((t, ci) => renderCard(t, ci, gi * 0.12))}
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          );
        })()}

      </div>

      {/* ══════════ STUDY PLAN ══════════ */}
      <div className={p('guidance')}>
        {diagDone && studyPlanError && !studyPlan && (
          <div style={{ textAlign:'center', padding:'48px 24px', background:'var(--cream)', border:'1px solid var(--b)', borderRadius:'16px', marginBottom:'16px' }}>
            <div style={{ fontSize:'28px', marginBottom:'12px' }}>⚠️</div>
            <div style={{ fontFamily:'var(--fs)', fontSize:'16px', fontWeight:700, color:'var(--text)', marginBottom:'8px' }}>Couldn't load your study plan</div>
            <div style={{ fontSize:'13px', color:'var(--text2)', marginBottom:'20px' }}>Your diagnostic is saved — this is a temporary issue. Try refreshing.</div>
            <button className="btn btn-gold" onClick={() => { setStudyPlanError(false); setStudyPlan(null); setStudyPlanRetry(r => r + 1); }}>Retry</button>
          </div>
        )}
        {studyPlan ? (() => {
          const UC = { red: '#EF4444', orange: '#F97316', yellow: '#D97706', green: '#22C55E', gray: '#94A3B8' };
          const UB = { red: 'rgba(239,68,68,0.1)', orange: 'rgba(249,115,22,0.1)', yellow: 'rgba(245,158,11,0.1)', green: 'rgba(34,197,94,0.1)', gray: 'rgba(148,163,184,0.1)' };

          return (
            <>
              {/* Live score update banner */}
              {studyPlan.hasLiveScores && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.22)', borderRadius: '10px', padding: '10px 14px', marginBottom: '18px' }}>
                  <span style={{ fontSize: '15px' }}>🔄</span>
                  <div style={{ fontSize: '12.5px', color: '#15803D', fontWeight: 500 }}>
                    Plan updated — priorities reflect your latest weekly test scores, not just the diagnostic.
                  </div>
                </div>
              )}

              {/* Overview strip */}
              <div className="sp-overview">
                <div className="sp-ov-box">
                  <div className="sp-ov-val">{studyPlan.overview.daysToExam}</div>
                  <div className="sp-ov-lbl">Days left</div>
                </div>
                <div className="sp-ov-box">
                  <div className="sp-ov-val">{studyPlan.overview.studyHoursPerDay}h</div>
                  <div className="sp-ov-lbl">Daily study</div>
                </div>
                <div className="sp-ov-box">
                  <div className="sp-ov-val">{studyPlan.overview.weeklyHours}h</div>
                  <div className="sp-ov-lbl">This week</div>
                </div>
                {studyPlan.overview.targetScore && (
                  <div className="sp-ov-box">
                    <div className="sp-ov-val">{studyPlan.overview.targetScore}</div>
                    <div className="sp-ov-lbl">Target marks</div>
                  </div>
                )}
                {studyPlan.mockTrend && (
                  <div className="sp-ov-box">
                    <div className="sp-ov-val" style={{ color: studyPlan.mockTrend.trend === 'improving' ? '#22C55E' : studyPlan.mockTrend.trend === 'declining' ? '#EF4444' : 'var(--text)' }}>
                      {studyPlan.mockTrend.latest}
                    </div>
                    <div className="sp-ov-lbl">Last mock</div>
                    <div className="sp-ov-sub" style={{ color: studyPlan.mockTrend.trend === 'improving' ? '#22C55E' : studyPlan.mockTrend.trend === 'declining' ? '#EF4444' : 'var(--text3)' }}>
                      {studyPlan.mockTrend.trend === 'improving' ? '↑ improving' : studyPlan.mockTrend.trend === 'declining' ? '↓ declining' : '→ stable'}
                    </div>
                  </div>
                )}
              </div>

              {/* Subject priority — circular arc cards */}
              <div className="sh sp-in" style={{ animationDelay: '.08s' }}><div className="sh-t">Subject Priority This Week</div></div>
              <div className="sp-subj-grid">
                {studyPlan.subjectFocus.map((s, i) => {
                  const color = UC[s.urgencyColor] || UC.gray;
                  const bgColor = UB[s.urgencyColor] || UB.gray;
                  const r = 28, circ = 2 * Math.PI * r;
                  const dash = ((s.scorePct ?? 50) / 100) * circ;
                  return (
                    <div key={i} className="sp-subj-card sp-in" style={{ animationDelay: `${0.1 + i * 0.07}s`, '--arc-len': circ - dash }}>
                      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: color, borderRadius: '16px 16px 0 0' }}/>
                      <div className="sp-subj-arc">
                        <svg width="72" height="72" viewBox="0 0 72 72">
                          <circle className="track" cx="36" cy="36" r={r}/>
                          <circle className="fill" cx="36" cy="36" r={r}
                            stroke={color}
                            strokeDasharray={`${dash} ${circ}`}
                            style={{ '--arc-len': circ - dash }}
                          />
                        </svg>
                        <div className="sp-subj-arc-val">{s.scorePct !== null ? `${Math.round(s.scorePct)}%` : 'N/A'}</div>
                      </div>
                      <div className="sp-subj-card-name">{s.subject}</div>
                      <span className="sp-subj-card-badge" style={{ background: bgColor, color }}>{s.urgency}</span>
                      <div className="sp-subj-card-hours">{s.hoursPerWeek}h / week</div>
                      <div className="sp-subj-card-reason">{s.reason}</div>
                    </div>
                  );
                })}
              </div>

              <style dangerouslySetInnerHTML={{ __html:
                '@keyframes spDoneRowIn{from{opacity:0;transform:translateY(-8px) scale(.97)}to{opacity:1;transform:none}}' +
                '@keyframes spConfirmIn{from{opacity:0;transform:scale(.85) translateY(4px)}to{opacity:1;transform:none}}' +
                '@keyframes spUndoFade{from{opacity:1;transform:none}to{opacity:0;transform:translateX(-10px)}}' +
                '@keyframes spCheckPop{0%{transform:scale(0)}60%{transform:scale(1.3)}100%{transform:scale(1)}}' +
                '.sp-done-row{animation:spDoneRowIn .32s cubic-bezier(.34,1.4,.64,1) both}' +
                '.sp-confirm-btns{animation:spConfirmIn .22s cubic-bezier(.34,1.4,.64,1) both}' +
                '.sp-done-check{animation:spCheckPop .3s cubic-bezier(.34,1.56,.64,1) both}' +
                '.sp-mark-btn{transition:all .15s}' +
                '.sp-mark-btn:hover{background:rgba(34,197,94,.15) !important;border-color:rgba(34,197,94,.7) !important;transform:translateY(-1px)}' +
                '.sp-undo-btn{transition:all .15s}' +
                '.sp-undo-btn:hover{background:rgba(34,197,94,.08) !important;border-color:rgba(34,197,94,.5) !important}' +
                '.sp-yes-btn{transition:all .15s}' +
                '.sp-yes-btn:hover{background:#15803D !important;transform:translateY(-1px);box-shadow:0 4px 12px rgba(21,128,61,.35)}' +
                '.sp-cancel-btn{transition:all .15s}' +
                '.sp-cancel-btn:hover{background:var(--cream3) !important}'
              }} />

              {/* This week focus */}
              <div className="sh sp-in" style={{ animationDelay: '.22s' }}><div className="sh-t">This Week — What to Study</div><span className="pill pp">Personalised</span></div>

              {/* Completed topics this week */}
              {studyPlan.completedThisWeek?.length > 0 && (
                <div className="card sp-in" style={{ marginBottom:'12px', padding:'14px 18px', border:'1.5px solid rgba(34,197,94,.25)', background:'rgba(34,197,94,.04)', animationDelay:'.24s' }}>
                  <div style={{ fontSize:'12px', fontWeight:700, color:'#15803D', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:'10px', display:'flex', alignItems:'center', gap:'6px' }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    Completed this week ({studyPlan.completedThisWeek.length})
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', gap:'7px' }}>
                    {studyPlan.completedThisWeek.map((topicName, i) => {
                      // derive subject from subjectTopics keys — topic objects don't carry a subject field
                      let topicSubject = '';
                      for (const [subj, topics] of Object.entries(studyPlan.subjectTopics || {})) {
                        if (topics.some(t => t.name === topicName)) { topicSubject = subj; break; }
                      }
                      return (
                        <div key={i} className="sp-done-row" style={{ display:'flex', alignItems:'center', gap:'10px', padding:'8px 12px', background:'rgba(34,197,94,.07)', borderRadius:'8px', border:'1px solid rgba(34,197,94,.18)', animationDelay: (i * 0.06) + 's' }}>
                          <div className="sp-done-check" style={{ width:'20px', height:'20px', borderRadius:'50%', background:'rgba(34,197,94,.15)', border:'1.5px solid rgba(34,197,94,.35)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, animationDelay: (i * 0.06 + 0.1) + 's' }}>
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                          </div>
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ fontSize:'13px', fontWeight:600, color:'var(--text)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{topicName}</div>
                            {topicSubject && <div style={{ fontSize:'11px', color:'var(--text3)', marginTop:'1px' }}>{topicSubject}</div>}
                          </div>
                          <button className="sp-undo-btn" onClick={() => toggleTopic(topicName, topicSubject)}
                            style={{ border:'1px solid rgba(34,197,94,.3)', background:'none', borderRadius:'6px', padding:'4px 10px', fontSize:'11.5px', fontWeight:600, color:'#15803D', cursor:'pointer', flexShrink:0 }}>
                            Undo
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* All done — research-backed activity panel */}
              {studyPlan.thisWeek.length === 0 && (() => {
                const nowIST = new Date(Date.now() + 5.5 * 60 * 60 * 1000);
                const dayIST = nowIST.getDay(); // 0=Sun,1=Mon,...,6=Sat
                const isWeekend = dayIST === 0 || dayIST === 5 || dayIST === 6; // Fri/Sat/Sun
                const daysEarlyMap = { 1:'4 days', 2:'3 days', 3:'2 days', 4:'1 day', 5:'', 6:'', 0:'' };
                const daysEarly = daysEarlyMap[dayIST];
                const nextWeekTopic = (studyPlan.weeklyRoadmap || []).find(w => !w.isCurrent && w.topics?.length > 0);

                return (
                  <div className="sp-in" style={{ animationDelay: '.27s' }}>
                    {/* Header */}
                    <div style={{ background: 'linear-gradient(135deg,var(--navy) 0%,var(--navy3) 100%)', borderRadius: '16px', padding: '18px 22px', marginBottom: '14px', position: 'relative', overflow: 'hidden' }}>
                      <div style={{ position: 'absolute', top: -30, right: -30, width: 110, height: 110, borderRadius: '50%', background: 'rgba(34,197,94,.08)', pointerEvents: 'none' }} />
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(34,197,94,.15)', border: '1.5px solid rgba(34,197,94,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        </div>
                        <div>
                          <div style={{ fontFamily: 'var(--fs)', fontSize: '16px', fontWeight: 700, color: '#FDF8F0', marginBottom: '2px' }}>This week is complete</div>
                          <div style={{ fontSize: '12px', color: 'rgba(253,248,240,.45)' }}>
                            {isWeekend ? 'Use the weekend to consolidate — revision now beats starting new topics.' : `You're ${daysEarly} ahead. Research shows retrieval practice this week builds lasting memory.`}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Activity cards */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>

                      {/* 1. Retrieval Practice — highest impact always */}
                      <div className="card sp-in" style={{ padding: '16px 18px', animationDelay: '.3s', borderLeft: '3px solid var(--gold)' }}>
                        <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                          <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'var(--gold-dim)', border: '1px solid var(--gold-b)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontFamily: 'var(--fs)', fontSize: '13px', fontWeight: 800, color: 'var(--gold)' }}>1</div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)', marginBottom: '3px' }}>Retrieval Practice</div>
                            <div style={{ fontSize: '12.5px', color: 'var(--text3)', lineHeight: 1.6, marginBottom: '10px' }}>Without looking at notes, write down everything you remember from this week. Studies show this beats re-reading by 50% for long-term retention.</div>
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                              <button className="btn btn-sm btn-gold" onClick={() => onNav('topics')}>Review Topic Map</button>
                              <span style={{ fontSize: '11px', color: 'var(--text3)', alignSelf: 'center' }}>Highest impact</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 2. Interleaved Practice Problems */}
                      <div className="card sp-in" style={{ padding: '16px 18px', animationDelay: '.35s', borderLeft: '3px solid var(--navy3)' }}>
                        <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                          <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(28,46,80,.08)', border: '1px solid rgba(28,46,80,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontFamily: 'var(--fs)', fontSize: '13px', fontWeight: 800, color: 'var(--navy3)' }}>2</div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)', marginBottom: '3px' }}>Mixed Problem Practice</div>
                            <div style={{ fontSize: '12.5px', color: 'var(--text3)', lineHeight: 1.6, marginBottom: '10px' }}>Solve problems across different topics from this week, not one subject at a time. Interleaving feels harder but produces 2x better long-term results.</div>
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                              <button className="btn btn-sm btn-ghost" onClick={() => onNav('questions')}>Question Bank</button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 3. Weak area consolidation */}
                      <div className="card sp-in" style={{ padding: '16px 18px', animationDelay: '.40s', borderLeft: '3px solid var(--orange)' }}>
                        <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                          <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(249,115,22,.08)', border: '1px solid rgba(249,115,22,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontFamily: 'var(--fs)', fontSize: '13px', fontWeight: 800, color: 'var(--orange)' }}>3</div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)', marginBottom: '3px' }}>Consolidate Weak Areas</div>
                            <div style={{ fontSize: '12.5px', color: 'var(--text3)', lineHeight: 1.6, marginBottom: '10px' }}>For each topic you found hard this week, write: "Why does this concept work?" and "How does this connect to what I already know?" This elaborative interrogation deepens understanding.</div>
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                              <button className="btn btn-sm btn-ghost" onClick={() => onNav('topics')}>See Urgent Topics</button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 4. Get Ahead — Mon-Thu only, opt-in */}
                      {!isWeekend && nextWeekTopic && (
                        <div className="card sp-in" style={{ padding: '16px 18px', animationDelay: '.45s', background: 'rgba(232,168,48,.04)', border: '1.5px solid var(--gold-b)' }}>
                          <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                            <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'var(--gold-dim)', border: '1px solid var(--gold-b)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontFamily: 'var(--fs)', fontSize: '13px', fontWeight: 800, color: 'var(--gold)' }}>4</div>
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)' }}>Get Ahead — Next Week Preview</div>
                                <span style={{ fontSize: '10.5px', fontWeight: 600, color: '#B45309', background: 'rgba(232,168,48,.15)', borderRadius: '20px', padding: '2px 8px', border: '1px solid var(--gold-b)' }}>Optional</span>
                              </div>
                              <div style={{ fontSize: '12.5px', color: 'var(--text3)', lineHeight: 1.6, marginBottom: '10px' }}>A light preview only — read definitions and key formulas, nothing more. Early exposure improves next week's learning speed by 30%.</div>
                              <div style={{ background: 'var(--cream2)', borderRadius: '8px', padding: '10px 14px', marginBottom: '10px' }}>
                                <div style={{ fontSize: '11px', color: 'var(--text3)', marginBottom: '3px' }}>Next week starts with</div>
                                <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text)' }}>{nextWeekTopic.topics[0]?.topic || 'Next week topics'}</div>
                                <div style={{ fontSize: '11.5px', color: 'var(--text3)', marginTop: '1px' }}>{nextWeekTopic.topics[0]?.subject}</div>
                              </div>
                              <div style={{ fontSize: '11.5px', color: 'var(--text3)', fontStyle: 'italic' }}>Do this only after completing activities 1–3 above.</div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Weekend message */}
                      {isWeekend && (
                        <div style={{ fontSize: '12px', color: 'var(--text3)', textAlign: 'center', padding: '8px 0', lineHeight: 1.6 }}>
                          Weekend is for consolidation — new topics start Monday. Sleep is your best study tool right now.
                        </div>
                      )}

                    </div>
                  </div>
                );
              })()}

              {/* Previous week pending topics */}
              {(() => {
                const prevPending = (studyPlan.weeklyRoadmap || []).filter(w => !w.isCurrent && w.daysLeft <= 0 && w.topics?.length > 0);
                if (!prevPending.length) return null;
                return (
                  <div className="card sp-in" style={{ marginBottom:'12px', padding:'14px 18px', border:'1.5px solid rgba(249,115,22,.2)', background:'rgba(249,115,22,.03)', animationDelay:'.25s' }}>
                    <div style={{ fontSize:'12px', fontWeight:700, color:'#C2410C', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:'10px', display:'flex', alignItems:'center', gap:'6px' }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#F97316" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                      Pending from previous weeks
                    </div>
                    {prevPending.flatMap(w => w.topics).slice(0, 5).map((t, i) => (
                      <div key={i} style={{ display:'flex', alignItems:'center', gap:'8px', padding:'6px 0', borderBottom:'1px solid rgba(249,115,22,.1)' }}>
                        <div style={{ width:'6px', height:'6px', borderRadius:'50%', background:'#F97316', flexShrink:0 }} />
                        <div style={{ fontSize:'13px', color:'var(--text2)', flex:1 }}>{t.topic}</div>
                        <div style={{ fontSize:'11px', color:'var(--text3)' }}>{t.subject}</div>
                      </div>
                    ))}
                    <div style={{ fontSize:'11.5px', color:'var(--text3)', marginTop:'10px' }}>These topics were in your previous plan — consider covering them this week.</div>
                  </div>
                );
              })()}

              {studyPlan.thisWeek.map((item, i) => (
                <div key={i} className="sp-focus sp-in" style={{ animationDelay: `${0.26 + i * 0.07}s` }}>
                  <div className="sp-focus-bar" style={{ background: UC[item.color] || UC.gray }} />
                  <div className="sp-focus-body">
                    <div className="sp-focus-top">
                      <div>
                        <div className="sp-focus-subject">{item.subject}</div>
                        <div className="sp-focus-topic">{item.topic}</div>
                      </div>
                      <div className="sp-focus-right">
                        <div className="sp-focus-hours">{item.hours}h this week</div>
                        <span className="sp-focus-label" style={{ background: UB[item.color], color: UC[item.color] }}>{item.label}</span>
                        {confirmTopic === item.topic ? (
                          <div className="sp-confirm-btns" style={{ display:'flex', gap:'6px', marginTop:'4px' }}>
                            <button className="sp-yes-btn" onClick={() => { toggleTopic(item.topic, item.subject); setConfirmTopic(null); }}
                              style={{ border:'none', background:'#16A34A', borderRadius:'7px', padding:'6px 14px', fontSize:'12.5px', fontWeight:700, color:'#fff', cursor:'pointer' }}>
                              Yes, done
                            </button>
                            <button className="sp-cancel-btn" onClick={() => setConfirmTopic(null)}
                              style={{ border:'1px solid var(--b)', background:'var(--cream2)', borderRadius:'7px', padding:'6px 12px', fontSize:'12.5px', fontWeight:600, color:'var(--text2)', cursor:'pointer' }}>
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button className="sp-mark-btn" onClick={() => setConfirmTopic(item.topic)}
                            style={{ border:'1.5px solid rgba(34,197,94,0.45)', background:'rgba(34,197,94,0.08)', borderRadius:'8px', padding:'6px 14px', fontSize:'12.5px', fontWeight:700, color:'#16A34A', cursor:'pointer', display:'flex', alignItems:'center', gap:'7px', marginTop:'4px', whiteSpace:'nowrap' }}>
                            <span style={{ width:'14px', height:'14px', borderRadius:'3px', border:'2px solid rgba(34,197,94,0.6)', background:'transparent', display:'inline-block', flexShrink:0 }} />
                            Mark as Done
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="sp-focus-reason">{item.reason}</div>
                    <div className="sp-focus-approach"><strong>How:</strong> {item.approach}</div>
                  </div>
                </div>
              ))}

              {/* Mock trend message */}
              {studyPlan.mockTrend && studyPlan.mockTrend.scores.length >= 2 && (
                <div className="sp-trend">
                  <div className="sp-trend-scores">
                    {studyPlan.mockTrend.scores.map((s, i) => (
                      <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        {i > 0 && <span className="sp-trend-arrow">→</span>}
                        <span className="sp-trend-score">{s}</span>
                      </span>
                    ))}
                  </div>
                  <div className="sp-trend-msg">{studyPlan.mockTrend.message}</div>
                </div>
              )}

              {/* Weekly roadmap — rolling window, auto-opens current week */}
              <div className="sh sp-in" style={{ marginTop: '8px', animationDelay: '.44s' }}><div className="sh-t">Week-by-Week Roadmap</div></div>
              {studyPlan.weeklyRoadmap.map((week, i) => (
                <div key={i} className="sp-week sp-in" style={{ animationDelay: `${0.46 + i * 0.05}s`, border: week.isCurrent ? '1.5px solid var(--gold)' : undefined }}>
                  <div className="sp-week-head" onClick={() => toggleWeek(i)}>
                    <div className="sp-week-num" style={week.isCurrent ? { background: 'var(--gold)', color: 'var(--navy)', fontWeight: 800 } : {}}>
                      {week.isCurrent ? '▶ Now' : `Wk ${week.week}`}
                    </div>
                    <div className="sp-week-theme">{week.theme}</div>
                    <div className="sp-week-days">{week.daysLeft}d left</div>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth="2" style={{ flexShrink: 0, transform: openWeeks.has(i) ? 'rotate(180deg)' : '', transition: 'transform .2s' }}><path d="M6 9l6 6 6-6"/></svg>
                  </div>
                  <div className={`sp-week-body${openWeeks.has(i) ? ' open' : ''}`}>
                    {week.topics.map((t, j) => (
                      <div key={j} className="sp-week-topic">
                        <div className="sp-week-subj">{t.subject}</div>
                        <div>{t.topic}</div>
                        <span style={{ marginLeft: 'auto', fontSize: '10px', fontWeight: 600, color: UC[t.label === 'Urgent' ? 'red' : t.label === 'High' ? 'orange' : t.label === 'Important' ? 'yellow' : 'green'] }}>{t.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {/* Daily structure */}
              <div className="sh sp-in" style={{ marginTop: '8px', animationDelay: '.5s' }}><div className="sh-t">Your Daily Structure</div></div>
              <div className="sp-slots sp-in" style={{ animationDelay: '.55s' }}>
                {studyPlan.dailyStructure.map((slot, i) => {
                  const dotColors = ['#F97316','#3B82F6','#A855F7','#22C55E','#94A3B8'];
                  return (
                    <div key={i} className="sp-slot">
                      <div className="sp-slot-dot" style={{ background: dotColors[i] || '#94A3B8' }}/>
                      <div className="sp-slot-time">{slot.time}</div>
                      <div style={{ flex: 1 }}>
                        <div className="sp-slot-subject">{slot.label}</div>
                        {slot.note && <div className="sp-slot-note">{slot.note}</div>}
                      </div>
                      <div className="sp-slot-hours">{slot.hours}h</div>
                    </div>
                  );
                })}
              </div>

              {/* Habit nudges */}
              {studyPlan.habits.length > 0 && (
                <>
                  <div className="sh" style={{ marginTop: '8px' }}><div className="sh-t">Fix These Habits</div></div>
                  {studyPlan.habits.map((h, i) => (
                    <div key={i} className="sp-habit sp-in" style={{ animationDelay: `${0.62 + i * 0.07}s` }}>
                      <div className="sp-habit-icon">{h.icon}</div>
                      <div>
                        <div className="sp-habit-title">{h.title}</div>
                        <div className="sp-habit-body">{h.body}</div>
                        <span className="sp-habit-impact">{h.impact}</span>
                      </div>
                    </div>
                  ))}
                </>
              )}

              {/* Maintain topics */}
              {studyPlan.maintainTopics?.length > 0 && (
                <>
                  <div className="sh" style={{ marginTop: '8px' }}><div className="sh-t">Keep These Warm — Don't Let Them Slip</div></div>
                  <div className="card mb" style={{ padding: '14px 18px' }}>
                    {studyPlan.maintainTopics.map((t, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 0', borderBottom: i < studyPlan.maintainTopics.length - 1 ? '1px solid var(--b)' : 'none' }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22C55E', flexShrink: 0 }}/>
                        <div style={{ flex: 1 }}>
                          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>{t.topic}</span>
                          <span style={{ fontSize: '11.5px', color: 'var(--text3)', marginLeft: 8 }}>{t.subject}</span>
                        </div>
                        <span style={{ fontSize: '11px', color: '#16A34A', background: 'rgba(34,197,94,0.1)', padding: '2px 9px', borderRadius: '99px', fontWeight: 600, flexShrink: 0 }}>{t.frequency}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}

              <div className="upgrade-banner" style={{ marginTop: '20px' }}>
                <div className="ub-text">
                  <div className="ub-label">Next Level</div>
                  <div className="ub-title">Get your plan reviewed by a mentor</div>
                  <div className="ub-sub">1 session. Your specific weak topics. Explained live by one of our faculty — built on your diagnostic results.</div>
                </div>
                <div className="ub-actions">
                  <button className="btn btn-gold" onClick={() => onNav('sessions')}>Book a Session</button>
                </div>
              </div>
            </>
          );
        })() : (
          /* Locked state — skeleton + lock card */
          <div style={{ position: 'relative', borderRadius: '16px', overflow: 'hidden', minHeight: 'calc(100vh - 80px)', background: 'var(--sp-lock-bg, var(--cream2))' }}>
            {/* Skeleton placeholders */}
            <div style={{ padding: '32px 24px 24px', display: 'flex', flexDirection: 'column', gap: '14px', pointerEvents: 'none', userSelect: 'none', filter: 'blur(2.5px)' }}>
              {/* Overview strip */}
              <div style={{ display: 'flex', gap: '15px' }}>
                {[1,2,3,4].map(i => (
                  <div key={i} style={{ flex: 1, background: 'var(--cream)', border: '1px solid var(--b)', borderRadius: '12px', padding: '40px 14px', display: 'flex', flexDirection: 'column', gap: '7px' }}>
                    <div className="sk" style={{ height: 18, width: '60%' }}/>
                    <div className="sk" style={{ height: 10, width: '45%' }}/>
                    <div className="sk" style={{ height: 10, width: '45%' }}/>
                  </div>
                ))}
              </div>
              {/* Subject bars */}
              <div style={{ background: 'var(--cream)', border: '1px solid var(--b)', borderRadius: '12px', padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div className="sk" style={{ height: 15, width: '30%' }}/>
                {[1,2,3].map(i => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div className="sk" style={{ height: 10, width: 90 }}/>
                    <div className="sk" style={{ height: 8, flex: 1, borderRadius: '99px' }}/>
                    <div className="sk" style={{ height: 10, width: 40 }}/>
                  </div>
                ))}
              </div>
              {/* Focus cards */}
              {[1,2,3,4].map(i => (
                <div key={i} style={{ background: 'var(--cream)', border: '1px solid var(--b)', borderRadius: '12px', padding: '14px 16px', display: 'flex', gap: '12px' }}>
                  <div className="sk" style={{ width: 4, borderRadius: '99px', flexShrink: 0, alignSelf: 'stretch' }}/>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '7px' }}>
                    <div className="sk" style={{ height: 13, width: '25%' }}/>
                    <div className="sk" style={{ height: 17, width: '70%' }}/>
                    <div className="sk" style={{ height: 13, width: '90%' }}/>
                    <div className="sk" style={{ height: 13, width: '55%' }}/>
                  </div>
                </div>
              ))}
            </div>

            {/* Lock card centred on top */}
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
              <div className="sp-lock-card" style={{ background: '#fff', borderRadius: '20px', padding: '36px 30px', textAlign: 'center', boxShadow: '0 20px 60px rgba(15,31,61,0.16), 0 4px 16px rgba(15,31,61,0.08)', maxWidth: '360px', width: '100%', border: '1px solid rgba(15,31,61,0.07)' }}>
                <div style={{ width: '58px', height: '58px', borderRadius: '16px', background: 'linear-gradient(135deg, #0F1F3D 0%, #1C2E50 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#E8A830" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                </div>
                <div style={{ fontFamily: 'var(--fs)', fontSize: '19px', fontWeight: 700, color: 'var(--text)', marginBottom: '10px', lineHeight: 1.3 }}>Your study plan is waiting</div>
                <div style={{ fontSize: '13px', color: 'var(--text2)', lineHeight: 1.75, marginBottom: '24px' }}>Take the diagnostic once — we'll build your personalised week-by-week plan around your exact weak topics, mock scores, and time left.</div>
                <button className="btn btn-gold" style={{ width: '100%', justifyContent: 'center', padding: '13px 0', fontSize: '14px' }} onClick={() => onNav('diagnostic')}>Take the Diagnostic →</button>
                <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '11px' }}>Free · 26 questions · One time only</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ══════════ HABIT TRACKER ══════════ */}
      <div className={p('habits')}>
        <div className="g2 mb">
          <div className="card" style={alreadyCheckedIn
            ? { borderColor: 'rgba(34,197,94,0.35)', borderLeftWidth: '4px', borderLeftColor: 'var(--green)' }
            : { borderColor: 'rgba(232,168,48,0.45)', borderLeftWidth: '4px', borderLeftColor: 'var(--gold)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '6px' }}>
              <div>
                <div style={{ fontFamily: 'var(--fs)', fontSize: '16px', fontWeight: 700, color: 'var(--text)' }}>Today's Check-in</div>
                <div style={{ fontSize: '12px', color: 'var(--text3)' }}>{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div>
              </div>
              {alreadyCheckedIn
                ? <span className="pill pp" style={{ background: 'rgba(34,197,94,0.15)', color: 'var(--green)' }}>Done ✓</span>
                : <span className="pill" style={{ background: 'var(--gold-dim)', color: 'var(--gold)', border: '1px solid var(--gold-b)' }}>Pending</span>}
            </div>
            {alreadyCheckedIn
              ? <div style={{ fontSize: '12.5px', color: 'var(--green)', marginBottom: '18px', fontWeight: 500 }}>✓ Today's check-in is saved. See you tomorrow!</div>
              : <div style={{ fontSize: '12.5px', color: 'var(--text2)', marginBottom: '18px', lineHeight: 1.6 }}>5 habits. Yes or No. Honest answers only — this is for you, not anyone else.</div>
            }

            {habitItems.map((h) => (
              <div key={h.key} className="habit-row" style={alreadyCheckedIn ? { opacity: 0.85 } : {}}>
                <div className="habit-left">
                  <div className="habit-icon">{h.icon}</div>
                  <div>
                    <div className="habit-name">{h.name}</div>
                    <div className="habit-desc">{h.desc}</div>
                  </div>
                </div>
                <div className="habit-toggle">
                  <div className={`ht-yes${effectiveState[h.key] === 'yes' ? ' active' : ''}`} onClick={() => logHabit(h.key, 'yes')}>Yes</div>
                  <div className={`ht-no${effectiveState[h.key] === 'no' ? ' active' : ''}`} onClick={() => logHabit(h.key, 'no')}>No</div>
                </div>
              </div>
            ))}

            {!alreadyCheckedIn && allHabitsDone && (
              <div style={{ marginTop: '16px', textAlign: 'right' }}>
                <button className="btn btn-gold" onClick={saveHabits} disabled={habitSaving}>
                  {habitSaving ? 'Saving…' : 'Save Today\'s Check-in ✓'}
                </button>
              </div>
            )}
          </div>

          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div className="sh-t" style={{ marginBottom: 0 }}>Overview</div>
              {streak > 0 && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '5px', borderRadius: '20px', padding: '4px 12px',
                  background: alreadyCheckedIn ? 'rgba(34,197,94,0.12)' : 'var(--gold-dim)',
                  border: `1px solid ${alreadyCheckedIn ? 'rgba(34,197,94,0.3)' : 'var(--gold-b)'}`,
                }}>
                  <span style={{ fontSize: '15px' }}>🔥</span>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: alreadyCheckedIn ? 'var(--green)' : 'var(--gold)' }}>{streak}-day streak</span>
                  {!alreadyCheckedIn && <span style={{ fontSize: '10px', color: 'var(--gold)', opacity: 0.8 }}>at risk</span>}
                </div>
              )}
            </div>
            <div style={{ textAlign: 'center', padding: '16px 0 20px' }}>
              <div className="habit-week-score" style={{ color: habitCount === 5 ? 'var(--green)' : habitCount >= 3 ? 'var(--gold)' : 'var(--text3)' }}>{habitCount}</div>
              <div style={{ fontSize: '13px', color: 'var(--text3)' }}>{alreadyCheckedIn ? 'habits done today' : 'habits completed today'}</div>
            </div>
            <div className="div"></div>
            <div style={{ fontSize: '12px', color: 'var(--text3)', marginBottom: '10px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '.07em' }}>Last 14 days</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {dotGrid.map((row, ri) => (
                <div key={ri} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text3)', width: '60px' }}>{row.label}</div>
                  <div className="habit-history">
                    {row.dots.map((d, di) => <div key={di} className={`hd ${d}`}></div>)}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '10.5px', color: 'var(--text3)' }}><div className="hd y"></div>Done</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '10.5px', color: 'var(--text3)' }}><div className="hd n"></div>Missed</div>
              {!alreadyCheckedIn && <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '10.5px', color: 'var(--text3)' }}><div className="hd t"></div>Today</div>}
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '10.5px', color: 'var(--text3)' }}><div className="hd e"></div>No data</div>
            </div>
          </div>
        </div>

        <div className="card" style={{ background: 'var(--navy)', borderColor: 'var(--bi)' }}>
          <div style={{ fontFamily: 'var(--fs)', fontSize: '15px', fontWeight: 600, color: 'var(--inv)', marginBottom: '6px' }}>Why habits matter more than you think</div>
          <div style={{ fontSize: '13px', color: 'var(--inv2)', lineHeight: 1.8 }}>The difference between a good rank and a great rank is rarely intelligence. It's the student who slept well, revised consistently, and solved problems every single day — vs. the one who studied 8 hours randomly. <strong style={{ color: 'var(--gold)' }}>Consistency is the actual exam strategy.</strong></div>
        </div>
      </div>

      {/* ══════════ QUESTION BANK ══════════ */}
      <div className={p('questions')}>
        {isForge ? (
          <>
            <div className="tabs" style={{ marginBottom: '16px' }}>
              {['All', 'MCQ Bank', 'Previous Year Papers', 'Practice Set'].map((t, i) => (
                <div key={t} className={`tab${qbTab === i ? ' on' : ''}`} onClick={() => setQbTab(i)}>{t}</div>
              ))}
            </div>
            {(() => {
              const typeMap = [null, 'MCQ Bank', 'Previous Year Papers', 'Practice Set'];
              const filtered = qbTab === 0 ? questionBank : questionBank.filter(r => r.type === typeMap[qbTab]);
              if (filtered.length === 0) return (
                <div style={{ fontSize: '13px', color: 'var(--text3)', padding: '32px 0', textAlign: 'center' }}>
                  No question bank items available{qbTab > 0 ? ` for ${typeMap[qbTab]}` : ''}.
                </div>
              );
              return filtered.map(r => (
                <div key={r.id} className="res-item">
                  <div className="res-icon">📝</div>
                  <div>
                    <div className="res-name">{r.title}</div>
                    <div className="res-meta">{r.subject} · Grade {r.grade} · {r.type} · By {r.facultyName}</div>
                    {r.description && <div style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '3px' }}>{r.description}</div>}
                  </div>
                  <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
                    <a href={`${import.meta.env.VITE_API_URL}/api/files/proxy?url=${encodeURIComponent(r.cloudinaryUrl)}`} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm" style={{ textDecoration: 'none' }}>↗ View</a>
                    <a href={`${import.meta.env.VITE_API_URL}/api/files/proxy?url=${encodeURIComponent(r.cloudinaryUrl)}&download=1`} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm" style={{ textDecoration: 'none' }}>↓ Download</a>
                  </div>
                </div>
              ));
            })()}
          </>
        ) : (() => {
            const isNEET = examTarget.toLowerCase().includes('neet');
            const weakTopics = studyPlan
              ? Object.values(studyPlan.subjectTopics || {}).flat()
                  .filter(t => t.label === 'Urgent' || t.label === 'High')
                  .slice(0, 4)
              : [];
            const topicNames = weakTopics.length > 0
              ? weakTopics.map(t => t.name)
              : isNEET
                ? ['Genetics', 'Organic Chemistry', 'Human Physiology']
                : ['Electrostatics', 'Integration', 'Mechanics'];
            const previewTitle = weakTopics.length > 0
              ? topicNames[0] + ' — Your Weak Area'
              : isNEET ? 'Genetics — Weak Area Questions' : 'Electrostatics — Weak Area Questions';
            const TOPIC_CLR = { Urgent: '#DC2626', High: '#EA580C', Important: '#D97706', Maintain: '#22C55E' };
            return (
              <div className="lock-wrap">
                <div className="lock-blur">
                  <div className="card mb">
                    <div className="sh-t" style={{ marginBottom: '14px' }}>{previewTitle}</div>
                    <div className="mcq-card">
                      <div className="mcq-q">Q1. Based on your diagnostic, this topic has the highest impact on your score. Unlock to see curated questions.</div>
                      <div className="mcq-opts">
                        <div className="mcq-opt">A. Option A</div><div className="mcq-opt">B. Option B</div>
                        <div className="mcq-opt">C. Option C</div><div className="mcq-opt">D. Option D</div>
                      </div>
                    </div>
                    <div className="mcq-card">
                      <div className="mcq-q">Q2. Previous year {isNEET ? 'NEET' : 'JEE Mains'} question matched to your level.</div>
                      <div className="mcq-opts">
                        <div className="mcq-opt">A. Option A</div><div className="mcq-opt">B. Option B</div>
                        <div className="mcq-opt">C. Option C</div><div className="mcq-opt">D. Option D</div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="lock-overlay">
                  <div style={{ background: 'linear-gradient(135deg,#0F1F3D 0%,#1C2E50 100%)', borderRadius: '20px', padding: '32px 28px', textAlign: 'center', boxShadow: '0 24px 64px rgba(15,31,61,.3), 0 4px 16px rgba(15,31,61,.15)', maxWidth: '380px', width: '100%', border: '1px solid rgba(232,168,48,.2)', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: -40, right: -40, width: 140, height: 140, borderRadius: '50%', background: 'rgba(232,168,48,.06)', pointerEvents: 'none' }} />
                    <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(232,168,48,.15)', border: '1.5px solid rgba(232,168,48,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#E8A830" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    </div>
                    <div style={{ fontFamily: 'var(--fs)', fontSize: '19px', fontWeight: 700, color: '#FDF8F0', marginBottom: '8px', lineHeight: 1.3 }}>
                      {diagDone ? 'Your question bank is ready' : 'Personalised Question Bank'}
                    </div>
                    <div style={{ fontSize: '13px', color: 'rgba(253,248,240,.5)', lineHeight: 1.7, marginBottom: diagDone && weakTopics.length > 0 ? '14px' : '20px' }}>
                      {diagDone
                        ? 'Questions matched to your exact weak topics from the diagnostic — sorted by difficulty and exam pattern.'
                        : 'Take the diagnostic first, then unlock questions matched to your specific weak topics.'}
                    </div>
                    {diagDone && topicNames.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'center', marginBottom: '20px' }}>
                        {weakTopics.length > 0
                          ? weakTopics.map((t, i) => (
                              <span key={i} style={{ fontSize: '11px', fontWeight: 700, color: TOPIC_CLR[t.label] || '#E8A830', background: (TOPIC_CLR[t.label] || '#E8A830') + '1a', border: '1px solid ' + (TOPIC_CLR[t.label] || '#E8A830') + '44', borderRadius: '20px', padding: '3px 10px' }}>{t.name}</span>
                            ))
                          : topicNames.map((name, i) => (
                              <span key={i} style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(253,248,240,.6)', background: 'rgba(255,255,255,.08)', borderRadius: '20px', padding: '3px 10px' }}>{name}</span>
                            ))
                        }
                      </div>
                    )}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px', textAlign: 'left' }}>
                      {[
                        'Matched to your diagnostic weak areas',
                        'Previous ' + (isNEET ? 'NEET' : 'JEE Mains') + ' papers · sorted by difficulty',
                        'Progress tracked question-by-question',
                      ].map((f, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'rgba(253,248,240,.6)' }}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                          {f}
                        </div>
                      ))}
                    </div>
                    <button className="btn btn-gold btn-full" onClick={() => onNav('plans')} style={{ width: '100%', justifyContent: 'center', padding: '12px 0', fontSize: '14px' }}>
                      Unlock Question Bank →
                    </button>
                    <div style={{ fontSize: '11px', color: 'rgba(253,248,240,.3)', marginTop: '10px' }}>Upgrade to Forge · Instant access</div>
                  </div>
                </div>
              </div>
            );
          })()
        }
      </div>

      {/* ══════════ BOOK SESSION ══════════ */}
      <div className={p('sessions')}>
        {/* Confirmed / upcoming sessions */}
        {(() => {
          const confirmed = sessionRequests.filter(r => r.status === 'assigned' || r.status === 'done');
          if (!confirmed.length) return null;
          const fmtDt = iso => new Date(iso).toLocaleString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' });
          return (
            <div style={{ marginBottom: '28px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: '10px' }}>Your Sessions</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {confirmed.map(r => (
                  <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '13px 16px', background: r.status === 'assigned' ? 'var(--cream)' : 'var(--cream2)', border: '1px solid var(--b)', borderLeft: `3px solid ${r.status === 'assigned' ? 'var(--gold)' : '#22C55E'}`, borderRadius: 'var(--r)', boxShadow: 'var(--sh)' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '9px', background: r.status === 'assigned' ? 'var(--gold-dim)' : 'rgba(34,197,94,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {r.status === 'assigned'
                        ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
                        : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2" strokeLinecap="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text)', marginBottom: '2px' }}>
                        {r.status === 'assigned' ? 'Upcoming Session' : 'Completed Session'}
                        {r.facultyName && <span style={{ fontWeight: 400, color: 'var(--text3)', marginLeft: '6px' }}>with {r.facultyName}</span>}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text3)' }}>
                        {r.scheduledAt ? fmtDt(r.scheduledAt) + (r.durationMin ? ` · ${r.durationMin} min` : '') : 'Time TBD'}
                        {r.topic && <span style={{ marginLeft: '8px' }}>· {r.topic.length > 60 ? r.topic.slice(0, 60) + '…' : r.topic}</span>}
                      </div>
                      {r.adminNote && <div style={{ fontSize: '12px', color: 'var(--navy3)', marginTop: '4px', fontStyle: 'italic' }}>"{r.adminNote}"</div>}
                    </div>
                    <span style={{ fontSize: '10px', fontWeight: 700, padding: '3px 9px', borderRadius: '20px', background: r.status === 'assigned' ? 'rgba(232,168,48,.12)' : 'rgba(34,197,94,.1)', color: r.status === 'assigned' ? 'var(--gold)' : '#16a34a', textTransform: 'capitalize' }}>{r.status}</span>
                  </div>
                ))}
              </div>
              <div style={{ height: '1px', background: 'var(--b)', margin: '24px 0' }} />
            </div>
          );
        })()}

        {/* Header */}
        <div style={{ marginBottom: '28px' }}>
          <div style={{ fontFamily: 'var(--fs)', fontSize: '22px', fontWeight: 700, color: 'var(--text)', marginBottom: '6px' }}>Request a 1-on-1 Session</div>
          <div style={{ fontSize: '13.5px', color: 'var(--text2)', lineHeight: 1.7 }}>
            Pick your topic, leave your number, and we'll confirm a time with you directly.
          </div>
        </div>

        {/* Block form if there's already an active request */}
        {(() => {
          const active = sessionRequests.find(r => r.status === 'pending' || r.status === 'assigned');
          if (active) {
            return (
              <div className="card mb" style={{ borderTop: `3px solid ${active.status === 'assigned' ? 'var(--gold)' : 'var(--text3)'}`, textAlign: 'center', padding: '32px 24px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: active.status === 'assigned' ? 'var(--gold-dim)' : 'var(--cream2)', border: `1px solid ${active.status === 'assigned' ? 'var(--gold-b)' : 'var(--b)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  {active.status === 'assigned'
                    ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
                    : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>}
                </div>
                <div style={{ fontFamily: 'var(--fs)', fontSize: '17px', fontWeight: 700, color: 'var(--text)', marginBottom: '8px' }}>
                  {active.status === 'assigned' ? 'Session scheduled' : 'Request sent'}
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text2)', lineHeight: 1.7, maxWidth: '340px', margin: '0 auto 12px' }}>
                  {active.status === 'assigned'
                    ? 'Check the section above for the date, time, and faculty details.'
                    : 'We will call or WhatsApp you to set the time. You can request another once this one is done.'}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text3)', padding: '8px 12px', background: 'var(--cream2)', borderRadius: '6px', display: 'inline-block' }}>
                  {active.topic.length > 80 ? active.topic.slice(0, 80) + '...' : active.topic}
                </div>
              </div>
            );
          }
          return null;
        })()}

        <div className="g2 mb" style={{ alignItems: 'start', display: sessionRequests.find(r => r.status === 'pending' || r.status === 'assigned') ? 'none' : 'grid' }}>
          {/* Request form */}
          <div className="card" style={{ borderTop: '3px solid var(--gold)' }}>
            {sessDone ? (
              <div style={{ textAlign: 'center', padding: '32px 16px' }}>
                <div style={{ fontSize: '40px', marginBottom: '14px' }}>✅</div>
                <div style={{ fontFamily: 'var(--fs)', fontSize: '18px', fontWeight: 700, color: 'var(--text)', marginBottom: '8px' }}>Request received!</div>
                <div style={{ fontSize: '13px', color: 'var(--text2)', lineHeight: 1.7, marginBottom: '20px' }}>Our team will reach out within 24 hours to confirm your session.</div>
              </div>
            ) : (
              <>
                <div style={{ fontFamily: 'var(--fs)', fontSize: '16px', fontWeight: 700, color: 'var(--text)', marginBottom: '18px' }}>Tell us what you need</div>

                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text2)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '.06em' }}>What topic do you need help with? *</label>
                  <textarea
                    rows={3}
                    placeholder="e.g. Electrostatics — I understand the theory but keep losing marks on Gauss's Law problems. Need someone to walk me through the approach."
                    value={sessTopic}
                    onChange={e => setSessTopic(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', border: '1.5px solid var(--b)', borderRadius: 'var(--r)', fontSize: '13px', color: 'var(--text)', fontFamily: 'var(--fb)', resize: 'vertical', outline: 'none', background: 'var(--cream2)', lineHeight: 1.6, transition: 'border-color .2s' }}
                    onFocus={e => e.target.style.borderColor = 'var(--gold)'}
                    onBlur={e => e.target.style.borderColor = 'var(--b)'}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text2)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '.06em' }}>Your phone number</label>
                    <input
                      type="tel"
                      placeholder="+91 98765 43210"
                      value={sessPhone}
                      onChange={e => setSessPhone(e.target.value)}
                      style={{ width: '100%', padding: '9px 12px', border: '1.5px solid var(--b)', borderRadius: 'var(--r)', fontSize: '13px', color: 'var(--text)', fontFamily: 'var(--fb)', outline: 'none', background: 'var(--cream2)', transition: 'border-color .2s' }}
                      onFocus={e => e.target.style.borderColor = 'var(--gold)'}
                      onBlur={e => e.target.style.borderColor = 'var(--b)'}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text2)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '.06em' }}>Preferred time <span style={{ fontWeight: 400, color: 'var(--text3)' }}>(optional)</span></label>
                    <input
                      type="text"
                      placeholder="e.g. Weekday evenings after 6pm"
                      value={sessTime}
                      onChange={e => setSessTime(e.target.value)}
                      style={{ width: '100%', padding: '9px 12px', border: '1.5px solid var(--b)', borderRadius: 'var(--r)', fontSize: '13px', color: 'var(--text)', fontFamily: 'var(--fb)', outline: 'none', background: 'var(--cream2)', transition: 'border-color .2s' }}
                      onFocus={e => e.target.style.borderColor = 'var(--gold)'}
                      onBlur={e => e.target.style.borderColor = 'var(--b)'}
                    />
                  </div>
                </div>

                <button
                  className="btn btn-gold btn-full"
                  onClick={submitSessionRequest}
                  disabled={sessSending || !sessTopic.trim()}
                >
                  {sessSending ? 'Sending…' : 'Send Request →'}
                </button>
                <div style={{ fontSize: '11.5px', color: 'var(--text3)', marginTop: '10px', textAlign: 'center' }}>
                  We'll contact you within 24 hours to confirm the session.
                </div>
              </>
            )}
          </div>

          {/* What to expect */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className="card">
              <div style={{ fontFamily: 'var(--fs)', fontSize: '15px', fontWeight: 600, marginBottom: '14px' }}>What happens next</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[
                  { n: '1', t: 'We review your request', d: 'Our team looks at your topic and matches you to the right faculty.' },
                  { n: '2', t: 'We reach out within 24h', d: 'You get a call or WhatsApp to confirm the time and share the meeting link.' },
                  { n: '3', t: '60-minute focused session', d: 'Just you and the faculty — on exactly the topic you mentioned.' },
                  { n: '4', t: 'You leave with clarity', d: 'A clear next-step plan for that topic, from someone who knows where you are.' },
                ].map(step => (
                  <div key={step.n} style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--navy)', color: 'var(--gold)', fontSize: '11px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '1px' }}>{step.n}</div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)', marginBottom: '2px' }}>{step.t}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text3)', lineHeight: 1.6 }}>{step.d}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card" style={{ background: 'var(--navy)', borderColor: 'var(--bi)' }}>
              <div style={{ fontSize: '12.5px', color: 'var(--inv2)', lineHeight: 1.75, fontStyle: 'italic' }}>
                "If a single session makes you feel like you finally understand the topic — that's the entire point."
              </div>
              <div style={{ fontSize: '11px', color: 'var(--inv3)', marginTop: '10px' }}>— Studyverse</div>
            </div>
          </div>
        </div>

        {/* Enrollment CTA */}
        <div style={{ background: 'linear-gradient(135deg,var(--navy) 0%,#1a2f5e 100%)', border: '1px solid var(--gold-b)', borderRadius: 'var(--rxl)', padding: '28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: '10px', color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '.1em', fontWeight: 600, marginBottom: '6px' }}>Full Program</div>
            <div style={{ fontFamily: 'var(--fs)', fontSize: '20px', fontWeight: 700, color: 'var(--inv)', marginBottom: '6px' }}>Want a dedicated mentor, not just a session?</div>
            <div style={{ fontSize: '13px', color: 'var(--inv2)', maxWidth: '500px' }}>Weekly 1-on-1 calls, daily check-ins, parent reports — everything built around your preparation. For students who want consistent mentorship, not just one-off help.</div>
            <div style={{ display: 'flex', gap: '16px', marginTop: '14px' }}>
              {[{ val: '1-on-1', lbl: 'Weekly Calls' }, { val: 'Daily', lbl: 'Check-ins' }, { val: '100%', lbl: 'Personalised' }].map((s, i) => (
                <div key={i} style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: 'var(--fs)', fontSize: '20px', fontWeight: 700, color: 'var(--gold)' }}>{s.val}</div>
                  <div style={{ fontSize: '10px', color: 'var(--inv3)' }}>{s.lbl}</div>
                </div>
              ))}
            </div>
          </div>
          <button className="btn btn-gold" style={{ fontSize: '14px', padding: '13px 26px', flexShrink: 0 }} onClick={() => onNav('plans')}>Learn About Anchor →</button>
        </div>
      </div>

      {/* ══════════ RESOURCES ══════════ */}
      <div className={p('resources')}>
        {isForge ? (
          <>
            <div className="tabs" style={{ marginBottom: '16px' }}>
              {['All', 'Study Material', 'Formula Sheet', 'Session Notes'].map((t, i) => (
                <div key={t} className={`tab${resTab === i ? ' on' : ''}`} onClick={() => setResTab(i)}>{t}</div>
              ))}
            </div>
            {(() => {
              const typeMap = [null, 'Study Material', 'Formula Sheet', 'Session Notes'];
              const filtered = resTab === 0 ? resources : resources.filter(r => r.type === typeMap[resTab]);
              if (filtered.length === 0) return (
                <div style={{ fontSize: '13px', color: 'var(--text3)', padding: '32px 0', textAlign: 'center' }}>
                  No study materials available{resTab > 0 ? ` for ${typeMap[resTab]}` : ''}.
                </div>
              );
              return filtered.map(r => (
                <div key={r.id} className="res-item">
                  <div className="res-icon">📄</div>
                  <div>
                    <div className="res-name">{r.title}</div>
                    <div className="res-meta">{r.subject} · Grade {r.grade} · {r.type} · By {r.facultyName}</div>
                    {r.description && <div style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '3px' }}>{r.description}</div>}
                  </div>
                  <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
                    <a href={`${import.meta.env.VITE_API_URL}/api/files/proxy?url=${encodeURIComponent(r.cloudinaryUrl)}`} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm" style={{ textDecoration: 'none' }}>↗ View</a>
                    <a href={`${import.meta.env.VITE_API_URL}/api/files/proxy?url=${encodeURIComponent(r.cloudinaryUrl)}&download=1`} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm" style={{ textDecoration: 'none' }}>↓ Download</a>
                  </div>
                </div>
              ));
            })()}
          </>
        ) : (
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {/* Free section header */}
            <div style={{ padding: '14px 20px 10px', borderBottom: '1px solid var(--b)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontFamily: 'var(--fs)', fontSize: '14px', fontWeight: 600, color: 'var(--text)' }}>Free Resources</span>
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--green)', background: 'var(--green-dim)', borderRadius: '20px', padding: '2px 9px', border: '1px solid rgba(34,197,94,.2)' }}>Always free</span>
            </div>
            {/* Free NCERT rows */}
            {[
              { name: 'NCERT Chemistry Class XI', meta: 'PDF • 18.4 MB', url: 'https://ncert.nic.in/textbook.php?kech1=0-14' },
              { name: 'NCERT Mathematics Class XII', meta: 'PDF • 22.1 MB', url: 'https://ncert.nic.in/textbook.php?lemh1=0-13' },
            ].map((r, i, arr) => (
              <div key={i} className="res-row" style={{ cursor: 'pointer', borderBottom: i < arr.length - 1 ? '1px solid var(--b)' : 'none', borderRadius: 0, margin: 0 }} onClick={() => window.open(r.url, '_blank', 'noreferrer')}>
                <div className="rr-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                </div>
                <div><div className="rr-name">{r.name}</div><div className="rr-meta">{r.meta}</div></div>
                <button className="btn btn-sm btn-ghost" style={{ marginLeft: 'auto', flexShrink: 0 }} onClick={e => { e.stopPropagation(); window.open(r.url, '_blank', 'noreferrer'); }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  Download
                </button>
              </div>
            ))}
            {/* Premium section divider */}
            <div style={{ padding: '14px 20px 10px', borderTop: '1px solid var(--b)', borderBottom: '1px solid var(--b)', background: 'var(--cream2)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontFamily: 'var(--fs)', fontSize: '14px', fontWeight: 600, color: 'var(--text)' }}>Premium Resources</span>
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--gold)', background: 'var(--gold-dim)', borderRadius: '20px', padding: '2px 9px', border: '1px solid var(--gold-b)' }}>Forge & above</span>
            </div>
            {/* Locked premium section */}
            <div className="lock-wrap" style={{ minHeight: '460px' }}>
              <div className="lock-blur">
                {[
                  { name: 'H.C. Verma — Concepts of Physics Vol 1 & 2', meta: 'PDF • Curated by mentor' },
                  { name: 'JEE Mains 2023 & 2024 — Papers + Solutions', meta: 'PDF • 4 papers with detailed solutions' },
                  { name: 'Formula Sheet — All 3 Subjects', meta: 'PDF • Mentor-curated, JEE pattern' },
                  { name: 'Electrostatics & Mechanics — Concept Notes', meta: 'PDF • Matched to your weak areas' },
                ].map((r, i) => (
                  <div key={i} className="res-row" style={{ borderRadius: 0, margin: 0 }}>
                    <div className="rr-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                    </div>
                    <div><div className="rr-name">{r.name}</div><div className="rr-meta">{r.meta}</div></div>
                  </div>
                ))}
              </div>
              <div className="lock-overlay">
                <div style={{ background: 'linear-gradient(135deg,#0F1F3D 0%,#1C2E50 100%)', borderRadius: '20px', padding: '32px 28px', textAlign: 'center', boxShadow: '0 24px 64px rgba(15,31,61,.3), 0 4px 16px rgba(15,31,61,.15)', maxWidth: '380px', width: '100%', border: '1px solid rgba(232,168,48,.2)', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: -40, right: -40, width: 140, height: 140, borderRadius: '50%', background: 'rgba(232,168,48,.06)', pointerEvents: 'none' }} />
                  <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(232,168,48,.15)', border: '1.5px solid rgba(232,168,48,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#E8A830" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  </div>
                  <div style={{ fontFamily: 'var(--fs)', fontSize: '19px', fontWeight: 700, color: '#FDF8F0', marginBottom: '8px', lineHeight: 1.3 }}>Premium Resources</div>
                  <div style={{ fontSize: '13px', color: 'rgba(253,248,240,.5)', lineHeight: 1.7, marginBottom: '20px' }}>HC Verma PDFs, PYQ papers with solutions, and mentor-curated formula sheets — all matched to your weak topics.</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px', textAlign: 'left' }}>
                    {[
                      'HC Verma Vol 1 & 2 — full PDFs',
                      'JEE Mains PYQ papers + detailed solutions',
                      'Formula sheets for all 3 subjects',
                    ].map((f, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'rgba(253,248,240,.6)' }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        {f}
                      </div>
                    ))}
                  </div>
                  <button className="btn btn-gold btn-full" onClick={() => onNav('plans')} style={{ width: '100%', justifyContent: 'center', padding: '12px 0', fontSize: '14px' }}>
                    Unlock Resources →
                  </button>
                  <div style={{ fontSize: '11px', color: 'rgba(253,248,240,.3)', marginTop: '10px' }}>Upgrade to Forge · Instant access</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ══════════ PLANS ══════════ */}
      <div className={p('plans')}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ fontFamily: 'var(--fs)', fontSize: '26px', fontWeight: 700, color: 'var(--text)', marginBottom: '6px' }}>Four plans. One mission.</div>
          <div style={{ fontSize: '13.5px', color: 'var(--text2)' }}>Start free with Spark. Upgrade when it makes sense.</div>
        </div>
        <div className="pricing-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
          {/* ── Spark ── */}
          <div className="price-card">
            <div className="pc-name">Spark</div>
            <div className="pc-tagline">The ignition</div>
            <div className="pc-price">₹0</div>
            <div className="pc-sub">Free forever. No card.</div>
            <div className="pc-feats">
              <div className="pc-feat">Deep diagnostic form (JEE &amp; NEET)</div>
              <div className="pc-feat">Chapter-level topic weakness map</div>
              <div className="pc-feat">Personalised study guidance</div>
              <div className="pc-feat">Daily habit tracker (5 habits)</div>
              <div className="pc-feat">Basic NCERT resources</div>
              <div className="pc-feat no">Custom question bank</div>
              <div className="pc-feat no">Faculty sessions</div>
              <div className="pc-feat no">Mentorship &amp; accountability</div>4. createdAt missing from /me endpoint — reverted, breaks enrollment-date logic


            </div>
            <button className="btn btn-ghost btn-full" style={{ opacity: 0.6, cursor: 'default' }}>Current Plan</button>
          </div>

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
            <button className="btn btn-gold btn-full" onClick={() => onNav('plans')}>Get Forge →</button>
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
            <button className="btn btn-gold btn-full" onClick={() => onNav('plans')}>Talk to Us →</button>
          </div>

          {/* ── Anchor ── */}
          <div className="price-card">
            <div className="pc-name">Anchor</div>
            <div className="pc-tagline">Someone in your corner, every day</div>
            <div className="pc-price">₹ 799/-</div>
            <div className="pc-sub">Monthly · Mentorship only</div>
            <div className="pc-feats">
              <div className="pc-feat">Everything in Spark (free features)</div>
              <div className="pc-feat">Daily check-in — you report, mentor reviews</div>
              <div className="pc-feat">Weekly 1-to-1 strategy call with mentor</div>
              <div className="pc-feat">Study plan updated weekly based on your data</div>
              <div className="pc-feat">Direct mentor access during the day</div>
              <div className="pc-feat">Habit consistency tracking by mentor</div>
              <div className="pc-feat no">Live teaching sessions</div>
              <div className="pc-feat no">Question bank</div>
            </div>
            <button className="btn btn-navy btn-full" onClick={() => onNav('plans')}>Talk to Us →</button>
          </div>
        </div>
        <div style={{ background: 'var(--cream)', border: '1px solid var(--gold-b)', borderRadius: 'var(--rl)', padding: '18px 22px', textAlign: 'center', boxShadow: 'var(--sh)', marginTop: '16px' }}>
          <div style={{ fontFamily: 'var(--fs)', fontSize: '15px', fontWeight: 600, marginBottom: '4px' }}>Not ready to commit? That's fine.</div>
          <div style={{ fontSize: '13px', color: 'var(--text2)', marginBottom: '14px' }}>Request a single session with one of our faculty. No subscription needed — we'll confirm details over call.</div>
          <button className="btn btn-gold" onClick={() => onNav('sessions')}>Book a Single Session →</button>
        </div>
      </div>

      {/* ══════════ NOTIFICATIONS ══════════ */}
      <div className={p('notif')}>
        <style dangerouslySetInnerHTML={{ __html:
          '@keyframes nfItemIn{from{opacity:0;transform:translateX(-14px)}to{opacity:1;transform:none}}' +
          '@keyframes nfEmptyIn{from{opacity:0;transform:translateY(16px) scale(.96)}to{opacity:1;transform:none}}' +
          '@keyframes nfIconPop{from{transform:scale(0) rotate(-20deg)}to{transform:scale(1) rotate(0)}}' +
          '@keyframes nfPulseRing{0%{box-shadow:0 0 0 0 rgba(232,168,48,.5)}70%{box-shadow:0 0 0 6px rgba(232,168,48,0)}100%{box-shadow:0 0 0 0 rgba(232,168,48,0)}}' +
          '@keyframes nfReadFade{to{opacity:.55}}' +
          '@keyframes nfHeaderIn{from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:none}}' +
          '.nf-item{animation:nfItemIn .32s cubic-bezier(.4,0,.2,1) both;border-radius:12px;transition:background .15s,box-shadow .15s}' +
          '.nf-item:hover{background:var(--cream2);box-shadow:0 2px 10px rgba(15,31,61,.05)}' +
          '.nf-item.read{animation:nfReadFade .4s ease forwards}' +
          '.nf-icon-box{animation:nfIconPop .35s cubic-bezier(.34,1.56,.64,1) both}' +
          '.nf-unread-dot{animation:nfPulseRing 2s ease infinite}' +
          '.nf-filter-btn{border:1px solid var(--b);background:var(--cream);color:var(--text2);font-size:12px;font-weight:600;padding:5px 14px;border-radius:20px;cursor:pointer;transition:all .15s}' +
          '.nf-filter-btn.on{background:var(--navy);color:var(--gold);border-color:transparent}' +
          '.nf-filter-btn:hover:not(.on){border-color:var(--navy3);color:var(--text)}'
        }} />

        {(() => {
          const timeAgo = (iso) => {
            const secs = Math.floor((Date.now() - new Date(iso)) / 1000);
            if (secs < 60) return 'Just now';
            if (secs < 3600) return Math.floor(secs / 60) + 'm ago';
            if (secs < 86400) return Math.floor(secs / 3600) + 'h ago';
            if (secs < 604800) return Math.floor(secs / 86400) + 'd ago';
            return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
          };

          const TYPE_META = {
            Diagnostic:         { color: '#E8A830', bg: 'rgba(232,168,48,.12)', border: 'rgba(232,168,48,.28)', nav: 'diagnostic',  icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#E8A830" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg> },
            Feedback:           { color: '#22C55E', bg: 'rgba(34,197,94,.1)',   border: 'rgba(34,197,94,.25)',  nav: null,           icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> },
            Announcement:       { color: '#1C2E50', bg: 'rgba(28,46,80,.08)',   border: 'rgba(28,46,80,.18)',   nav: null,           icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1C2E50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg> },
            Reminder:           { color: '#F97316', bg: 'rgba(249,115,22,.1)',  border: 'rgba(249,115,22,.25)', nav: null,           icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> },
            'Motivational Note':{ color: '#A855F7', bg: 'rgba(168,85,247,.1)', border: 'rgba(168,85,247,.25)', nav: null,           icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#A855F7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg> },
            'Schedule Update':  { color: '#3B82F6', bg: 'rgba(59,130,246,.1)', border: 'rgba(59,130,246,.25)', nav: 'sessions',     icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> },
            'Session Note':     { color: '#3B82F6', bg: 'rgba(59,130,246,.1)', border: 'rgba(59,130,246,.25)', nav: 'sessions',     icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> },
          };
          const DEFAULT_META = { color: 'var(--navy3)', bg: 'rgba(15,31,61,.07)', border: 'rgba(15,31,61,.15)', nav: null, icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--navy3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg> };

          const unreadCount = notifications.filter(n => !n.readAt).length;
          const filtered = notifFilter === 'unread' ? notifications.filter(n => !n.readAt) : notifications;

          const handleClick = (n) => {
            const meta = TYPE_META[n.type] || DEFAULT_META;
            if (!n.readAt) onMarkNotifRead(n.id);
            if (meta.nav) onNav(meta.nav);
          };

          return (
            <>
              {/* Header */}
              <div style={{ background: 'linear-gradient(135deg,var(--navy) 0%,var(--navy3) 100%)', borderRadius: '20px', padding: '22px 26px', marginBottom: '16px', position: 'relative', overflow: 'hidden', animation: 'nfHeaderIn .35s cubic-bezier(.4,0,.2,1) both' }}>
                <div style={{ position: 'absolute', top: -40, right: -40, width: 150, height: 150, borderRadius: '50%', background: 'rgba(232,168,48,.06)', pointerEvents: 'none' }} />
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
                  <div>
                    <div style={{ fontFamily: 'var(--fs)', fontSize: '19px', fontWeight: 700, color: '#FDF8F0', marginBottom: '4px' }}>Notifications</div>
                    <div style={{ fontSize: '12.5px', color: 'rgba(253,248,240,.45)' }}>
                      {notifications.length === 0 ? 'Nothing yet — stay tuned' : `${notifications.length} total · ${unreadCount} unread`}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    {unreadCount > 0 && (
                      <div style={{ textAlign: 'center', background: 'rgba(232,168,48,.15)', border: '1px solid rgba(232,168,48,.3)', borderRadius: '12px', padding: '8px 16px' }}>
                        <div style={{ fontFamily: 'var(--fs)', fontSize: '22px', fontWeight: 800, color: 'var(--gold)', lineHeight: 1 }}>{unreadCount}</div>
                        <div style={{ fontSize: '10px', color: 'rgba(253,248,240,.45)', marginTop: '2px', textTransform: 'uppercase' }}>Unread</div>
                      </div>
                    )}
                    {unreadCount > 0 && (
                      <button onClick={onMarkAllNotifRead} style={{ background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.15)', borderRadius: '10px', padding: '8px 14px', color: 'rgba(253,248,240,.8)', fontSize: '12px', fontWeight: 600, cursor: 'pointer', transition: 'all .15s' }}
                        onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,.18)'}
                        onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,.1)'}>
                        Mark all read
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Filter tabs */}
              {notifications.length > 0 && (
                <div style={{ display: 'flex', gap: '6px', marginBottom: '14px' }}>
                  {[{ key: 'all', label: 'All (' + notifications.length + ')' }, { key: 'unread', label: 'Unread (' + unreadCount + ')' }].map(f => (
                    <button key={f.key} className={'nf-filter-btn' + (notifFilter === f.key ? ' on' : '')} onClick={() => setNotifFilter(f.key)}>{f.label}</button>
                  ))}
                </div>
              )}

              {/* Items */}
              {filtered.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '56px 24px', animation: 'nfEmptyIn .45s cubic-bezier(.4,0,.2,1) both' }}>
                  <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: 'var(--cream)', border: '1px solid var(--b)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: 'var(--sh)' }}>
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                  </div>
                  <div style={{ fontFamily: 'var(--fs)', fontSize: '17px', fontWeight: 700, color: 'var(--text)', marginBottom: '6px' }}>
                    {notifFilter === 'unread' ? 'All caught up!' : 'No notifications yet'}
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text3)', lineHeight: 1.6 }}>
                    {notifFilter === 'unread' ? 'You have no unread notifications.' : 'Updates from your admin and faculty will appear here.'}
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {filtered.map((n, i) => {
                    const meta = TYPE_META[n.type] || DEFAULT_META;
                    const isUnread = !n.readAt;
                    const isClickable = isUnread || meta.nav;
                    return (
                      <div
                        key={n.id}
                        className={'nf-item' + (n.readAt ? ' read' : '')}
                        onClick={() => { if (isClickable) handleClick(n); }}
                        style={{ display: 'flex', gap: '14px', padding: '14px 16px', cursor: isClickable ? 'pointer' : 'default', opacity: n.readAt ? 0.6 : 1, animationDelay: (i * 0.05) + 's' }}
                      >
                        {/* Icon box */}
                        <div className="nf-icon-box" style={{ width: '40px', height: '40px', borderRadius: '12px', background: meta.bg, border: '1px solid ' + meta.border, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, animationDelay: (i * 0.05 + 0.08) + 's' }}>
                          {meta.icon}
                        </div>

                        {/* Content */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                            <span style={{ fontSize: '11px', fontWeight: 700, color: meta.color, background: meta.bg, border: '1px solid ' + meta.border, borderRadius: '20px', padding: '2px 8px', flexShrink: 0 }}>{n.type}</span>
                            {meta.nav && <span style={{ fontSize: '10.5px', color: 'var(--text3)' }}>→ {meta.nav === 'diagnostic' ? 'View Diagnostic' : 'View Sessions'}</span>}
                          </div>
                          <div style={{ fontSize: '13.5px', color: 'var(--text)', fontWeight: isUnread ? 500 : 400, lineHeight: 1.55 }}>{n.content}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '5px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span>{timeAgo(n.createdAt)}</span>
                            {isUnread && <span className="nf-unread-dot" style={{ width: '7px', height: '7px', borderRadius: '50%', background: meta.color, display: 'inline-block', flexShrink: 0 }} />}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          );
        })()}
      </div>

      {/* ══════════ MY PROGRESS (forge) ══════════ */}
      <div className={p('progress')}>
        {(() => {
          const weeks = [...scores].sort((a, b) => a.weekNumber - b.weekNumber);
          const max = getExamMax(examTarget);
          const toM = (pct) => Math.round(pct * max / 100);
          const targetMarks = toM(90);
          const first = weeks[0] || null;
          const last = weeks[weeks.length - 1] || null;
          const baselineMarks = first ? toM(first.avgPct) : null;
          const currentMarks = last ? toM(last.avgPct) : null;
          const improvement = baselineMarks !== null && currentMarks !== null ? currentMarks - baselineMarks : null;
          const toGo = currentMarks !== null ? targetMarks - currentMarks : null;
          const daysRemaining = getDaysRemaining(examTarget, profile?.studentProfile?.targetYear);
          const arc = buildArc(weeks, examTarget, 800, 130, 140);
          return (
            <>
              <div className="journey-container mb-lg">
                <div className="journey-header">
                  <div>
                    <div className="journey-title">Your Score Journey</div>
                    <div className="journey-sub">No comparisons. Just you vs. who you were on Day 1.</div>
                  </div>
                  <div className="journey-exam">
                    <div className="journey-exam-name">{examTarget}</div>
                    <div className="journey-exam-days">{daysRemaining ?? 'TBD'}</div>
                    <div className="journey-exam-label">days remaining</div>
                  </div>
                </div>
                <ArcTrack height={140} viewBox="0 0 800 130" solidPath={arc.solidPath} dashedPath={arc.dashedPath} fillPath={arc.fillPath} nodes={arc.nodes} />
                <ScoreDeltas items={[
                  { label: 'Started At (Week 1)', val: baselineMarks ?? 'Pending', valClass: 'white', change: first ? new Date(first.testDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'No data', neutral: true },
                  { label: 'Current Score', val: currentMarks ?? 'Pending', valClass: 'gold', change: improvement !== null ? `+${improvement} marks in ${weeks.length} week${weeks.length !== 1 ? 's' : ''}` : 'No tests yet' },
                  { label: 'Target', val: targetMarks, valClass: 'white', change: toGo !== null ? `${toGo} marks to go` : 'Set target', changeStyle: { color: 'var(--gold)' } },
                ]} />
              </div>
              <div className="sh mb" style={{ marginBottom: '16px' }}>
                <div className="sh-title">Weekly Performance</div>
                <span className="pill pill-navy">{weeks.length} week{weeks.length !== 1 ? 's' : ''} documented</span>
              </div>
              {weeks.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text3)', fontSize: '13px', padding: '32px 0' }}>No test results yet. Complete your first weekly test to see your progress here.</div>
              ) : (
                [...weeks].reverse().map((w, i, arr) => {
                  const prevW = arr[i + 1];
                  const wMarks = toM(w.avgPct);
                  const prevMarks = prevW ? toM(prevW.avgPct) : null;
                  const delta = prevMarks !== null ? wMarks - prevMarks : null;
                  const isFirst = i === arr.length - 1;
                  const dateStr = new Date(w.testDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
                  return (
                    <WeeklyReport key={w.weekNumber} week={`Week ${w.weekNumber} — ${dateStr}`} meta={w.subjects.map(s => s.subject).join(' + ')} score={wMarks} change={isFirst ? 'Start' : delta >= 0 ? `+${delta}` : `${delta}`} changeClass={isFirst ? 'start' : delta >= 0 ? 'up' : 'down'} isOpen={openWR.has(i)} onToggle={() => toggleWR(i)}>
                      {w.subjects.map(s => {
                        const pct = s.totalMarks > 0 ? Math.round(s.score / s.totalMarks * 100) : 0;
                        return (
                          <div key={s.subject} className="subj-row">
                            <div className="subj-name">{s.subject}</div>
                            <div className="subj-bar"><div className="pbar"><div className="pbar-inner pbar-gold" style={{ width: `${pct}%` }}></div></div></div>
                            <div className="subj-score">{pct}%</div>
                          </div>
                        );
                      })}
                    </WeeklyReport>
                  );
                })
              )}
            </>
          );
        })()}
      </div>

      {/* ══════════ WEEKLY TESTS (forge) ══════════ */}
      <div className={p('tests')}>
        {/* Coming Soon banner */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', background: 'var(--gold-dim)', border: '1px solid var(--gold-b)', borderRadius: 'var(--r)', padding: '16px 20px', marginBottom: '28px' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(232,168,48,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text)', marginBottom: '2px' }}>Weekly Tests — Coming Soon</div>
            <div style={{ fontSize: '12px', color: 'var(--text3)', lineHeight: 1.6 }}>Chapter-wise and full-length tests matched to your weak areas. Results will feed directly into your progress tracker.</div>
          </div>
          <span style={{ flexShrink: 0, padding: '4px 12px', borderRadius: '20px', background: 'rgba(232,168,48,0.2)', color: 'var(--gold)', fontSize: '11px', fontWeight: 700, border: '1px solid var(--gold-b)' }}>Coming Soon</span>
        </div>

        {/* Past test history */}
        <div className="sh" style={{ marginBottom: '14px' }}>
          <div className="sh-title">Test History</div>
          <span className="pill pill-navy">{scores.length} week{scores.length !== 1 ? 's' : ''} recorded</span>
        </div>
        {scores.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text3)', fontSize: '13px', padding: '32px 0' }}>No test results yet.</div>
        ) : (() => {
          const sorted = [...scores].sort((a, b) => b.weekNumber - a.weekNumber);
          const avgPct = (w) => Math.round(w.subjects.reduce((s, x) => s + (x.totalMarks > 0 ? x.score / x.totalMarks * 100 : 0), 0) / (w.subjects.length || 1));
          return sorted.map((w, i) => {
            const dateStr = new Date(w.testDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
            const avg = avgPct(w);
            const isLast = i === sorted.length - 1;
            const prevAvg = isLast ? null : avgPct(sorted[i + 1]);
            const delta = prevAvg !== null ? avg - prevAvg : null;
            const change = isLast ? 'Start' : delta >= 0 ? `+${delta}%` : `${delta}%`;
            const changeClass = isLast ? 'start' : delta >= 0 ? 'up' : 'down';
            return (
              <WeeklyReport key={w.weekNumber} week={`Week ${w.weekNumber} — ${dateStr}`} meta={w.subjects.map(s => s.subject).join(' + ')} score={`${avg}%`} change={change} changeClass={changeClass} isOpen={openWR.has(i + 100)} onToggle={() => toggleWR(i + 100)}>
                {w.subjects.map(s => {
                  const pct = s.totalMarks > 0 ? Math.round(s.score / s.totalMarks * 100) : 0;
                  return (
                    <div key={s.subject} className="subj-row">
                      <div className="subj-name">{s.subject}</div>
                      <div className="subj-bar"><div className="pbar"><div className="pbar-inner pbar-gold" style={{ width: `${pct}%` }} /></div></div>
                      <div className="subj-score">{pct}%</div>
                    </div>
                  );
                })}
              </WeeklyReport>
            );
          });
        })()}
      </div>

    </div>
  );
};

export default FreeContent;
