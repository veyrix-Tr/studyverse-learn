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
    return { nodes: pts.map((pt, i) => ({ type: 'future', pb: toPb(pt), label: i === 0 ? 'Baseline<br><span style="font-size:10px;">—</span>' : i === 3 ? `Target<br><span style="font-size:10px;">${target}</span>` : '—' })), solidPath: `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`, dashedPath: ptsToPath(pts), fillPath: null };
  }
  const nTotal = nData + 2, allPts = arcPoints(nTotal, W, H), last = weeks[nData - 1], currentM = toM(last.avgPct), near = Math.min(currentM + Math.round((target - currentM) * 0.5), target);
  const nodes = allPts.map((pt, i) => {
    const pb = toPb(pt);
    if (i < nData) { const w = weeks[i], m = toM(w.avgPct); if (nData === 1) return { type: 'current', pb, label: `This Week<br><strong style="font-size:10px;">${m} marks</strong>` }; if (i === 0) return { type: 'done', pb, label: `Baseline<br><strong style="color:var(--gold);font-size:10px;">${m} marks</strong>` }; if (i === nData - 1) return { type: 'current', pb, label: `This Week<br><strong style="font-size:10px;">${m} marks</strong>` }; return { type: 'done', pb, label: `Wk ${w.weekNumber}<br><strong style="color:var(--gold);font-size:10px;">${m} marks</strong>` }; }
    if (i === nTotal - 2) return { type: 'future', pb, label: `Near Goal<br><span style="font-size:10px;">~${near}</span>` };
    if (i === nTotal - 1) return { type: 'future', pb, label: `Target<br><span style="font-size:10px;">${target}</span>` };
    return { type: 'future', pb, label: '—' };
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


const ratingTopics = [
  { group: '📐 Mathematics', topics: [
    { key: 'limits', label: 'Limits & Continuity' },
    { key: 'integration', label: 'Integration' },
    { key: 'coordinate', label: 'Coordinate Geometry' },
  ]},
  { group: '⚡ Physics', topics: [
    { key: 'mechanics', label: "Mechanics (Newton's Laws, Work-Energy)" },
    { key: 'electro', label: 'Electrostatics & Current Electricity' },
  ]},
  { group: '⚛️ Chemistry', topics: [
    { key: 'physical-chem', label: 'Physical Chemistry (Mole Concept, Equilibrium)' },
    { key: 'organic', label: 'Organic Chemistry (Reactions, Mechanisms)' },
  ]},
];


const habitItems = [
  { key: 'sleep', icon: '🌙', name: 'Slept before midnight', desc: 'Your brain consolidates memory during sleep. 11 PM is the target.' },
  { key: 'study', icon: '📖', name: 'Studied for at least 4 hours', desc: 'Focused study, not just sitting with a book.' },
  { key: 'revision', icon: '🔁', name: "Revised yesterday's topics", desc: 'Revision within 24h improves retention by 80%.' },
  { key: 'phone', icon: '📵', name: 'No social media during study hours', desc: 'Even 5-minute breaks break your flow completely.' },
  { key: 'problems', icon: '❓', name: 'Solved at least 10 problems', desc: 'JEE is a problem-solving exam. Read less, solve more.' },
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


const guidanceConfig = [
  { key: 'electro', icon: '⚡', title: 'Start with Electrostatics — 3 days',
    body: (p) => `This is your lowest-scoring topic with the highest JEE Mains frequency (6–8 questions). Even moving from ${p}% to ${Math.min(p + 20, 100)}% here adds approximately 8–10 marks. Begin with Coulomb's Law → Electric Field → Gauss's Law. Study NCERT first, then attempt previous year questions.` },
  { key: 'mechanics', icon: '⚙️', title: "Mechanics — Newton's Laws & Energy — 2 days",
    body: (p) => `Mechanics is the backbone of JEE Physics. You're at ${p}% — this chapter rewards practice more than theory. Spend 2 focused days on Free Body Diagrams and Energy Conservation. These are directly connected to your integration weakness too.` },
  { key: 'integration', icon: '∫', title: 'Integration — 2 days in parallel with Maths revision',
    body: (p) => `You're at ${p}% in Integration. Don't skip this — it bleeds into 4–5 guaranteed questions. Study substitution method, then integration by parts. Use NCERT examples first. This is fixable in 2 focused sessions.` },
  { key: 'organic', icon: '🧪', title: 'Organic Reactions — Keep it light this week (1 day)',
    body: (p) => `You're at ${p}% in Organic Chemistry. Spend 1 day revising key named reactions (Aldol, Cannizzaro, Markovnikov) and mechanism logic. Do not go deep here until Physics improves.` },
];


const FreeContent = ({ activePage, onNav, onOpenModal, onShowToast, profile, habitLogs = [], onHabitSaved }) => {
  const { id: userId } = useParams();
  const p = (name) => `page${activePage === name ? ' on' : ''}`;
  const firstName = profile?.name?.split(' ')[0] || 'there';
  const examTarget = profile?.studentProfile?.examTarget || 'your exam';
  const plan = profile?.studentProfile?.plan || 'spark';
  const isForge = plan === 'forge';

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
  const [diagDone, setDiagDone] = useState(false);
  const [ratings] = useState({});

  useEffect(() => {
    const sp = profile?.studentProfile;
    if (sp?.diagnosticScore !== null && sp?.diagnosticScore !== undefined) {
      setDiagDone(true);
    }
  }, [profile]);

  // Habit state
  const [habitState, setHabitState] = useState({});
  const [habitSaving, setHabitSaving] = useState(false);

  // Topic map state — physics open by default
  const [openSubj, setOpenSubj] = useState(new Set(['physics']));

  const toggleSubj = (key) => {
    setOpenSubj(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

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

  // Rating helpers — converts 1–5 scale to 0–100 percentage
  const ratingToPct = (r) => Math.round((r / 5) * 100);
  const subjectAvg = (keys) => {
    const rated = keys.filter(k => ratings[k]);
    if (!rated.length) return null;
    return Math.round(rated.reduce((s, k) => s + ratingToPct(ratings[k]), 0) / rated.length);
  };
  const pctMeta = (pct) => {
    if (pct === null) return { color: 'var(--text3)', barCls: 'pb-navy', note: '—', tag: '—', tagCls: 'ok-tag' };
    if (pct <= 40) return { color: 'var(--red)', barCls: 'pb-red', note: 'Critical Gap', tag: 'Weak', tagCls: 'weak-tag' };
    if (pct <= 55) return { color: 'var(--orange)', barCls: 'pb-orange', note: 'Needs Work', tag: 'Avg', tagCls: 'ok-tag' };
    if (pct <= 70) return { color: 'var(--gold)', barCls: 'pb-gold', note: 'Average', tag: 'Avg', tagCls: 'ok-tag' };
    return { color: 'var(--green)', barCls: 'pb-green', note: 'Good', tag: 'Good', tagCls: 'good-tag' };
  };
  const mathPct = subjectAvg(['limits', 'integration', 'coordinate']);
  const physPct = subjectAvg(['mechanics', 'electro']);
  const chemPct = subjectAvg(['physical-chem', 'organic']);

  const allRatedTopics = ratingTopics.flatMap((g, gi) =>
    g.topics.map(t => ({
      ...t,
      subject: ['Maths', 'Physics', 'Chemistry'][gi],
      pct: ratings[t.key] ? ratingToPct(ratings[t.key]) : null,
    }))
  ).filter(t => t.pct !== null).sort((a, b) => a.pct - b.pct);
  const strongTopicsList = allRatedTopics.filter(t => t.pct >= 72);
  const guidanceCards = guidanceConfig
    .map(g => ({ ...g, pct: ratings[g.key] ? ratingToPct(ratings[g.key]) : null }))
    .filter(g => g.pct !== null)
    .sort((a, b) => a.pct - b.pct)
    .map((g, i) => ({
      ...g,
      pCls: i === 0 ? 'gp-high' : i === 1 ? 'gp-high' : i === 2 ? 'gp-mid' : 'gp-low',
      pLabel: i === 0 ? '🔴 Highest Priority' : i === 1 ? '🔴 High Priority' : i === 2 ? '🟠 Medium Priority' : '🟢 Lower Priority',
    }));

  return (
    <div className="content">

      {/* ══════════ DIAGNOSTIC GATE OVERLAY ══════════ */}
      {!diagDone && activePage !== 'diagnostic' && (
        <div style={{
          position: 'fixed', top: 0, left: '268px', right: 0, bottom: 0,
          backdropFilter: 'blur(10px)',
          background: 'rgba(253,248,240,0.75)',
          zIndex: 200,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {/* Skeleton dashboard — mirrors real layout with shimmer */}
          <div style={{ position: 'absolute', inset: 0, padding: '28px 32px', overflowY: 'hidden', pointerEvents: 'none', display: 'flex', flexDirection: 'column', gap: '18px' }}>

            {/* Greeting */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div className="sk" style={{ height: 13, width: '38%' }}/>
              <div className="sk" style={{ height: 22, width: '55%' }}/>
            </div>

            {/* Stats row — 4 boxes */}
            <div style={{ display: 'flex', gap: '12px' }}>
              {[1,2,3,4].map(i => (
                <div key={i} style={{ flex: 1, background: 'rgba(253,248,240,0.9)', border: '1px solid rgba(15,31,61,0.08)', borderRadius: '12px', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div className="sk" style={{ height: 10, width: '50%' }}/>
                  <div className="sk" style={{ height: 26, width: '70%' }}/>
                  <div className="sk" style={{ height: 9, width: '40%' }}/>
                </div>
              ))}
            </div>

            {/* Banner card */}
            <div style={{ background: 'rgba(240, 244, 253, 0.9)', border: '1px solid rgba(15,31,61,0.08)', borderRadius: '14px', padding: '20px 22px', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div className="sk" style={{ width: 44, height: 44, borderRadius: '50%', flexShrink: 0 }}/>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '7px' }}>
                <div className="sk" style={{ height: 11, width: '45%' }}/>
                <div className="sk" style={{ height: 16, width: '70%' }}/>
              </div>
              <div className="sk" style={{ height: 36, width: 110, borderRadius: '8px' }}/>
            </div>

            {/* Two column section */}
            <div style={{ display: 'flex', gap: '14px' }}>
              {/* Left — study plan card */}
              <div style={{ flex: 1.5, background: 'rgba(253,248,240,0.9)', border: '1px solid rgba(15,31,61,0.08)', borderRadius: '12px', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div className="sk" style={{ height: 11, width: '35%' }}/>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <div className="sk" style={{ width: 36, height: 36, borderRadius: '8px', flexShrink: 0 }}/>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div className="sk" style={{ height: 11, width: '80%' }}/>
                    <div className="sk" style={{ height: 9, width: '95%' }}/>
                    <div className="sk" style={{ height: 9, width: '60%' }}/>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <div className="sk" style={{ width: 36, height: 36, borderRadius: '8px', flexShrink: 0 }}/>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div className="sk" style={{ height: 11, width: '65%' }}/>
                    <div className="sk" style={{ height: 9, width: '85%' }}/>
                    <div className="sk" style={{ height: 9, width: '50%' }}/>
                  </div>
                </div>
              </div>
              {/* Right — habit tracker card */}
              <div style={{ flex: 1, background: 'rgba(253,248,240,0.9)', border: '1px solid rgba(15,31,61,0.08)', borderRadius: '12px', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div className="sk" style={{ height: 11, width: '55%' }}/>
                {[1,2,3,4].map(i => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div className="sk" style={{ width: 18, height: 18, borderRadius: '4px', flexShrink: 0 }}/>
                    <div className="sk" style={{ height: 9, flex: 1 }}/>
                  </div>
                ))}
              </div>
            </div>

            {/* Progress section */}
            <div style={{ background: 'rgba(253,248,240,0.9)', border: '1px solid rgba(15,31,61,0.08)', borderRadius: '12px', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div className="sk" style={{ height: 11, width: '28%' }}/>
              <div className="sk" style={{ height: 8, borderRadius: '99px', width: '100%' }}/>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div className="sk" style={{ height: 9, width: '20%' }}/>
                <div className="sk" style={{ height: 9, width: '15%' }}/>
              </div>
            </div>

          </div>

          <div style={{
            background: '#fff',
            borderRadius: '22px',
            padding: '40px 36px',
            textAlign: 'center',
            boxShadow: '0 20px 60px rgba(15,31,61,0.16), 0 4px 16px rgba(15,31,61,0.08)',
            maxWidth: '380px',
            width: '90%',
            border: '1px solid rgba(15,31,61,0.07)',
            position: 'relative', zIndex: 1,
          }}>
            <div style={{ width: '60px', height: '60px', borderRadius: '16px', background: 'linear-gradient(135deg, #0F1F3D 0%, #1C2E50 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#E8A830" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </div>
            <div style={{ fontFamily: 'var(--fs)', fontSize: '20px', fontWeight: 700, color: 'var(--text)', marginBottom: '10px', lineHeight: 1.3 }}>
              Start with your diagnostic
            </div>
            <div style={{ fontSize: '13.5px', color: 'var(--text2)', lineHeight: 1.75, marginBottom: '26px' }}>
              Your study plan, topic map, resources, and progress tracking are all built from your diagnostic. It takes 8 minutes — do it once, unlock everything.
            </div>
            <button className="btn btn-gold" style={{ width: '100%', justifyContent: 'center', padding: '13px 0', fontSize: '14px' }} onClick={() => onNav('diagnostic')}>
              Take the Diagnostic →
            </button>
            <div style={{ fontSize: '11.5px', color: 'var(--text3)', marginTop: '12px' }}>
              Free · 26 questions · One time only
            </div>
          </div>
        </div>
      )}

      {/* ══════════ HOME ══════════ */}
      <div className={p('home')}>
        <div style={{ marginBottom: '22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.1em', fontWeight: 500, marginBottom: '5px' }}>{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div>
            <div style={{ fontFamily: 'var(--fs)', fontSize: '24px', fontWeight: 700, color: 'var(--text)' }}>{getGreeting()}, {firstName}.</div>
            <div style={{ fontSize: '13.5px', color: 'var(--text2)', marginTop: '4px' }}>You're on the <strong style={{ color: 'var(--text)' }}>Free Plan</strong>. Your personalised <strong style={{ color: 'var(--text)' }}>{examTarget}</strong> guidance is ready.</div>
          </div>
          <button className="btn btn-gold" style={{ flexShrink: 0 }} onClick={() => onNav('diagnostic')}>Start Diagnostic →</button>
        </div>

        <div style={{ background: 'linear-gradient(135deg,var(--navy) 0%,var(--navy3) 100%)', borderRadius: 'var(--rxl)', padding: '26px 28px', marginBottom: '22px', display: 'flex', alignItems: 'center', gap: '24px', border: '1px solid var(--gold-b)' }}>
          <div style={{ fontSize: '44px', flexShrink: 0 }}>🎯</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'var(--fs)', fontSize: '19px', fontWeight: 700, color: 'var(--inv)', marginBottom: '5px' }}>Take your free diagnostic first</div>
            <div style={{ fontSize: '13px', color: 'var(--inv2)', lineHeight: 1.7 }}>Rate yourself on each topic, confirm with a quick MCQ round — and we'll map exactly where you stand and what to fix first.</div>
          </div>
          <div style={{ flexShrink: 0 }}>
            <button className="btn btn-gold" onClick={() => onNav('diagnostic')}>Begin Now →</button>
            <div style={{ fontSize: '10.5px', color: 'var(--inv3)', textAlign: 'center', marginTop: '6px' }}>~10 minutes</div>
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
            <div className="stat-v">{streak > 0 ? `🔥 ${streak}` : alreadyCheckedIn ? `${habitCount}/5` : '—'}</div>
            <div className="stat-n up" style={{ cursor: 'pointer' }} onClick={() => onNav('habits')}>{streak > 0 ? `${streak}-day streak` : alreadyCheckedIn ? 'Done today ✓' : 'Check in today'}</div>
          </div>
          <div className="stat sa-navy">
            <div className="stat-l">Topics Identified</div>
            <div className="stat-v">{diagDone ? Object.keys(ratings).length : '—'}</div>
            <div className="stat-n neu">{diagDone ? 'topics rated' : 'After diagnostic'}</div>
          </div>
          <div className="stat sa-red">
            <div className="stat-l">Weak Areas</div>
            <div className="stat-v">{diagDone ? Object.values(ratings).filter(v => v <= 2).length : '—'}</div>
            <div className="stat-n neu">{diagDone ? 'need focus' : 'After diagnostic'}</div>
          </div>
        </div>

        <div className="sh"><div className="sh-t">What's free on Studyverse</div></div>
        <div className="g3 mb">
          <div className="card" style={{ borderTop: '3px solid var(--green)' }}>
            <div style={{ fontSize: '28px', marginBottom: '10px' }}>🩺</div>
            <div style={{ fontFamily: 'var(--fs)', fontSize: '15px', fontWeight: 600, color: 'var(--text)', marginBottom: '6px' }}>Personalised Diagnostic</div>
            <div style={{ fontSize: '12.5px', color: 'var(--text2)', lineHeight: 1.7 }}>Self-rate each topic → confirm with MCQs → get a precise weakness map. No guesswork.</div>
            <div style={{ marginTop: '12px' }}><span className="pill pp">Free forever</span></div>
          </div>
          <div className="card" style={{ borderTop: '3px solid var(--gold)' }}>
            <div style={{ fontSize: '28px', marginBottom: '10px' }}>🗺️</div>
            <div style={{ fontFamily: 'var(--fs)', fontSize: '15px', fontWeight: 600, color: 'var(--text)', marginBottom: '6px' }}>Topic Weakness Map</div>
            <div style={{ fontSize: '12.5px', color: 'var(--text2)', lineHeight: 1.7 }}>See your exact weak chapters across Physics, Chemistry, and Maths — prioritised by JEE weight.</div>
            <div style={{ marginTop: '12px' }}><span className="pill pp">Free forever</span></div>
          </div>
          <div className="card" style={{ borderTop: '3px solid var(--navy3)' }}>
            <div style={{ fontSize: '28px', marginBottom: '10px' }}>📋</div>
            <div style={{ fontFamily: 'var(--fs)', fontSize: '15px', fontWeight: 600, color: 'var(--text)', marginBottom: '6px' }}>Study Guidance</div>
            <div style={{ fontSize: '12.5px', color: 'var(--text2)', lineHeight: 1.7 }}>Exactly which topics to study, in which order, and how much time to give each — based on your diagnostic.</div>
            <div style={{ marginTop: '12px' }}><span className="pill pp">Free forever</span></div>
          </div>
          <div className="card" style={{ borderTop: '3px solid var(--green)' }}>
            <div style={{ fontSize: '28px', marginBottom: '10px' }}>✅</div>
            <div style={{ fontFamily: 'var(--fs)', fontSize: '15px', fontWeight: 600, color: 'var(--text)', marginBottom: '6px' }}>Daily Habit Tracker</div>
            <div style={{ fontSize: '12.5px', color: 'var(--text2)', lineHeight: 1.7 }}>5 habits every serious JEE student needs. Check in daily. Build the discipline that separates rankers.</div>
            <div style={{ marginTop: '12px' }}><span className="pill pp">Free forever</span></div>
          </div>
          <div className="card" style={{ borderTop: '3px solid var(--gold)', opacity: .7 }}>
            <div style={{ fontSize: '28px', marginBottom: '10px' }}>📝</div>
            <div style={{ fontFamily: 'var(--fs)', fontSize: '15px', fontWeight: 600, color: 'var(--text)', marginBottom: '6px' }}>Custom Question Bank</div>
            <div style={{ fontSize: '12.5px', color: 'var(--text2)', lineHeight: 1.7 }}>Questions matched to your weak topics, difficulty level, and exam pattern.</div>
            <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span className="pill po">Unlock</span>
              <button className="btn btn-sm btn-gold" onClick={() => onOpenModal('upgrade-modal')}>Get Access</button>
            </div>
          </div>
          <div className="card" style={{ borderTop: '3px solid var(--navy3)', opacity: .7 }}>
            <div style={{ fontSize: '28px', marginBottom: '10px' }}>👨‍🏫</div>
            <div style={{ fontFamily: 'var(--fs)', fontSize: '15px', fontWeight: 600, color: 'var(--text)', marginBottom: '6px' }}>1-to-1 Faculty Session</div>
            <div style={{ fontSize: '12.5px', color: 'var(--text2)', lineHeight: 1.7 }}>Book a single session with Ajay Sharma. Get your doubts resolved, weak topics explained.</div>
            <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span className="pill po">Pay per session</span>
              <button className="btn btn-sm btn-navy" onClick={() => onNav('sessions')}>Book Now</button>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════ DIAGNOSTIC ══════════ */}
      <div className={p('diagnostic')}>
        <DiagnosticForm profile={profile} onComplete={() => setDiagDone(true)} />
      </div>

      {/* ══════════ TOPIC MAP ══════════ */}
      <div className={p('topics')}>
        <div style={{ fontSize: '13px', color: 'var(--text2)', marginBottom: '20px', background: 'var(--cream)', border: '1px solid var(--b)', borderRadius: 'var(--r)', padding: '12px 16px' }}>
          📊 Based on your diagnostic results. Chapters marked <span className="cr-tag weak-tag" style={{ display: 'inline' }}>Weak</span> need immediate attention — these are your score multipliers.
        </div>

        <div className="topic-map mb">
          {[
            { key: 'physics', icon: '⚡', name: 'Physics', raw: physPct, group: ratingTopics[1] },
            { key: 'maths',   icon: '📐', name: 'Mathematics', raw: mathPct, group: ratingTopics[0] },
            { key: 'chem',    icon: '⚛️', name: 'Chemistry', raw: chemPct, group: ratingTopics[2] },
          ].map((subj) => {
            const sm = pctMeta(subj.raw);
            const ratedChapters = subj.group.topics
              .filter(t => ratings[t.key])
              .map(t => {
                const p = ratingToPct(ratings[t.key]);
                const m = pctMeta(p);
                return { name: t.label, pct: p, barCls: m.barCls, pctColor: m.color, tag: m.tag, tagCls: m.tagCls };
              });
            return (
              <div key={subj.key} className="tm-subject">
                <div className="tms-header" onClick={() => toggleSubj(subj.key)}>
                  <div className="tms-icon">{subj.icon}</div>
                  <div className="tms-name">{subj.name}</div>
                  <div className="pbar" style={{ width: '120px', flexShrink: 0 }}><div className={`pbar-inner ${subj.raw !== null ? sm.barCls : 'pb-navy'}`} style={{ width: `${subj.raw ?? 0}%` }}></div></div>
                  <div className="tms-score" style={{ color: sm.color, width: '40px', textAlign: 'right' }}>{subj.raw !== null ? `${subj.raw}%` : '—'}</div>
                  <svg className="tms-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: openSubj.has(subj.key) ? 'rotate(180deg)' : '' }}><path d="M6 9l6 6 6-6"/></svg>
                </div>
                <div className={`tms-body${openSubj.has(subj.key) ? ' open' : ''}`}>
                  {ratedChapters.length > 0 ? ratedChapters.map((ch, ci) => (
                    <div key={ci} className="chapter-row">
                      <div className="cr-name">{ch.name}</div>
                      <div className="cr-bar"><div className="pbar"><div className={`pbar-inner ${ch.barCls}`} style={{ width: `${ch.pct}%` }}></div></div></div>
                      <div className="cr-pct" style={{ color: ch.pctColor }}>{ch.pct}%</div>
                      <div className={`cr-tag ${ch.tagCls}`}>{ch.tag}</div>
                    </div>
                  )) : (
                    <div style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--text3)' }}>Complete diagnostic to see chapter breakdown.</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="upgrade-banner">
          <div className="ub-text">
            <div className="ub-label">Unlock Feature</div>
            <div className="ub-title">Practice questions matched to your weak chapters</div>
            <div className="ub-sub">Electrostatics, Mechanics, Integration — questions at exactly your level, from previous JEE papers.</div>
          </div>
          <div className="ub-actions">
            <button className="btn btn-gold" onClick={() => onOpenModal('upgrade-modal')}>Unlock Question Bank</button>
          </div>
        </div>
      </div>

      {/* ══════════ STUDY GUIDANCE ══════════ */}
      <div className={p('guidance')}>
        <div style={{ background: 'var(--cream)', border: '1px solid var(--b)', borderRadius: 'var(--rl)', padding: '18px 22px', marginBottom: '22px', display: 'flex', alignItems: 'flex-start', gap: '14px', boxShadow: 'var(--sh)' }}>
          <div style={{ fontSize: '24px', flexShrink: 0 }}>📋</div>
          <div>
            <div style={{ fontFamily: 'var(--fs)', fontSize: '15px', fontWeight: 700, color: 'var(--text)', marginBottom: '3px' }}>Your Personalised Study Plan</div>
            <div style={{ fontSize: '12.5px', color: 'var(--text2)', lineHeight: 1.7 }}>Built from your diagnostic. Based on {examTarget} pattern — topics are ordered by <strong>impact per hour</strong>: what will gain you the most marks the fastest.</div>
          </div>
        </div>

        <div className="sh"><div className="sh-t">This Week — Priority Order</div><span className="pill pp">Free</span></div>

        {guidanceCards.length > 0 ? guidanceCards.map((g, i) => (
          <div key={i} className="guide-card">
            <div className="gc-top">
              <div className="gc-icon">{g.icon}</div>
              <div><div className="gc-title">{g.title}</div><div className="gc-body">{g.body(g.pct)}</div></div>
            </div>
            <span className={`gc-priority ${g.pCls}`}>{g.pLabel}</span>
          </div>
        )) : (
          <div style={{ position: 'relative', borderRadius: '14px', overflow: 'hidden', marginBottom: '12px' }}>
            {/* Ghost cards — heavily blurred, just shapes */}
            <div style={{ filter: 'blur(7px)', opacity: 0.45, pointerEvents: 'none', userSelect: 'none', transform: 'scale(1.02)' }}>
              {[
                { icon: '⚡', title: 'Your #1 Priority Topic — Start Here', body: 'This chapter has the highest score impact based on your level and syllabus coverage. A focused 3-day sprint moves you from where you are to guaranteed marks in the exam.', pLabel: 'High Priority', pCls: 'high' },
                { icon: '⚙️', title: 'Second Priority — Fix Your Foundation', body: 'Based on your mock scores, this is where you are losing the most marks right now. Fixing this unlocks 8–12 more marks without any extra effort on other topics.', pLabel: 'High Priority', pCls: 'high' },
                { icon: '∫', title: 'Quick Win — 2 Day Sprint', body: 'Your diagnostic suggests this is fixable fast. A targeted 2-day revision here adds guaranteed marks before your next mock test.', pLabel: 'Medium Priority', pCls: 'med' },
              ].map((g, i) => (
                <div key={i} className="guide-card">
                  <div className="gc-top">
                    <div className="gc-icon">{g.icon}</div>
                    <div><div className="gc-title">{g.title}</div><div className="gc-body">{g.body}</div></div>
                  </div>
                  <span className={`gc-priority ${g.pCls}`}>{g.pLabel}</span>
                </div>
              ))}
            </div>

            {/* Full overlay — gradient so nothing bleeds through */}
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(180deg, rgba(253,248,240,0.72) 0%, rgba(253,248,240,0.96) 40%, rgba(253,248,240,0.98) 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '32px 16px',
            }}>
              <div style={{
                background: '#fff',
                borderRadius: '18px',
                padding: '32px 30px',
                textAlign: 'center',
                boxShadow: '0 12px 40px rgba(15,31,61,0.13), 0 2px 8px rgba(15,31,61,0.07)',
                maxWidth: '320px',
                width: '100%',
                border: '1px solid rgba(15,31,61,0.07)',
              }}>
                {/* Lock icon */}
                <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: 'linear-gradient(135deg, #0F1F3D 0%, #1C2E50 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#E8A830" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                </div>
                <div style={{ fontFamily: 'var(--fs)', fontSize: '17px', fontWeight: 700, color: 'var(--text)', marginBottom: '8px', lineHeight: 1.3 }}>Your plan is ready — locked</div>
                <div style={{ fontSize: '12.5px', color: 'var(--text2)', lineHeight: 1.7, marginBottom: '22px' }}>
                  Take the diagnostic once. We'll build your week-by-week study plan around your exact weak topics, mock scores, and time left.
                </div>
                <button className="btn btn-gold" style={{ width: '100%', justifyContent: 'center' }} onClick={() => onNav('diagnostic')}>
                  Take the Diagnostic →
                </button>
                <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '10px' }}>Takes 8 min · 26 questions · Free</div>
              </div>
            </div>
          </div>
        )}

        {(diagDone || strongTopicsList.length > 0) && (
          <>
            <div className="sh" style={{ marginTop: '8px' }}><div className="sh-t">Your Strong Topics — Don't Ignore</div></div>
            <div className="card mb" style={{ padding: '16px 20px' }}>
              {strongTopicsList.length > 0 ? (
                <div style={{ fontSize: '13px', color: 'var(--text2)', lineHeight: 1.8 }}>
                  You're doing well in {strongTopicsList.map((t, i) => (
                    <span key={i}><strong>{t.label} ({t.pct}%)</strong>{i < strongTopicsList.length - 1 ? ', ' : ''}</span>
                  ))}. Spend 30 minutes every 3 days keeping these warm — don't let them slip while you rebuild weak areas. These are your <strong style={{ color: 'var(--green)' }}>guaranteed marks</strong>.
                </div>
              ) : (
                <div style={{ fontSize: '13px', color: 'var(--text2)', lineHeight: 1.8 }}>
                  Your strong topics will appear here once ratings are available.
                </div>
              )}
            </div>
          </>
        )}

        <div className="upgrade-banner">
          <div className="ub-text">
            <div className="ub-label">Next Level</div>
            <div className="ub-title">Get Ajay Sharma to walk you through Electrostatics personally</div>
            <div className="ub-sub">1 session. Your specific doubts. Cleared in 60 minutes. Pay only for what you need.</div>
          </div>
          <div className="ub-actions">
            <button className="btn btn-gold" onClick={() => onNav('sessions')}>Book a Session</button>
            <button className="btn" style={{ background: 'rgba(255,255,255,0.1)', color: 'var(--inv)', fontSize: '13px' }} onClick={() => onOpenModal('upgrade-modal')}>See All Plans</button>
          </div>
        </div>
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
          <div style={{ fontSize: '13px', color: 'var(--inv2)', lineHeight: 1.8 }}>The difference between a 120-scorer and a 160-scorer in JEE Mains is rarely intelligence. It's the student who slept well, revised consistently, and solved problems every single day — vs. the one who studied 8 hours randomly. <strong style={{ color: 'var(--gold)' }}>Consistency is the actual exam strategy.</strong></div>
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
        ) : (
          <div className="lock-wrap">
            <div className="lock-blur">
              <div className="card mb">
                <div className="sh-t" style={{ marginBottom: '14px' }}>Electrostatics — Weak Area Questions</div>
                <div className="mcq-card"><div className="mcq-q">Q1. A charge of 4μC is placed at the origin. What is the electric field at a point 2m away?</div><div className="mcq-opts"><div className="mcq-opt">A. 4500 N/C</div><div className="mcq-opt">B. 9000 N/C</div><div className="mcq-opt">C. 18000 N/C</div><div className="mcq-opt">D. 2250 N/C</div></div></div>
                <div className="mcq-card"><div className="mcq-q">Q2. The work done in moving a charge of 3C from A to B across a potential difference of 12V is:</div><div className="mcq-opts"><div className="mcq-opt">A. 4 J</div><div className="mcq-opt">B. 36 J</div><div className="mcq-opt">C. 0.25 J</div><div className="mcq-opt">D. 15 J</div></div></div>
              </div>
            </div>
            <div className="lock-overlay">
              <div className="lock-box">
                <div className="lock-icon">🔒</div>
                <div className="lock-title">Unlock Question Bank</div>
                <div className="lock-sub">Get questions matched exactly to your weak topics — Electrostatics, Mechanics, Integration — from JEE Mains papers. Sorted by difficulty.</div>
                <button className="btn btn-gold btn-full" onClick={() => onOpenModal('upgrade-modal')}>Unlock Access</button>
                <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '10px' }}>Or upgrade to Forge to get instant access</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ══════════ BOOK SESSION ══════════ */}
      <div className={p('sessions')}>
        <div style={{ fontFamily: 'var(--fs)', fontSize: '18px', fontWeight: 700, color: 'var(--text)', marginBottom: '4px' }}>Book a Session with Ajay Sharma</div>
        <div style={{ fontSize: '13px', color: 'var(--text3)', marginBottom: '22px' }}>Pay only for the session you need. No subscription required.</div>

        <div className="g2 mb">
          <div className="session-teaser">
            <div className="st-faculty">
              <div className="st-av">A</div>
              <div>
                <div className="st-name">Ajay Sharma</div>
                <div className="st-creds">JEE Mains &amp; Advanced • NEET UG • 10+ Years • 500+ Students</div>
              </div>
            </div>
            <div style={{ fontSize: '12.5px', color: 'var(--text2)', lineHeight: 1.7, marginBottom: '14px' }}>
              A focused 60-minute session on exactly what you need. Come with your doubts from the diagnostic. Ajay will build your understanding from where you actually are — not from a standard slide deck.
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '14px' }}>
              {['Electrostatics', 'Mechanics', 'Integration', 'Organic Chem', 'Any topic'].map(t => (
                <span key={t} className="pill pn">{t}</span>
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '12px', borderTop: '1px solid var(--b)' }}>
              <div>
                <div style={{ fontFamily: 'var(--fs)', fontSize: '22px', fontWeight: 700, color: 'var(--text)' }}>₹ XX</div>
                <div style={{ fontSize: '11px', color: 'var(--text3)' }}>per 60-minute session</div>
              </div>
              <button className="btn btn-gold" onClick={() => onOpenModal('book-modal')}>Book Now →</button>
            </div>
            <div className="st-price-badge">Pay per session</div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className="card">
              <div style={{ fontFamily: 'var(--fs)', fontSize: '15px', fontWeight: 600, marginBottom: '12px' }}>What happens in a session</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[
                  'Ajay reviews your diagnostic results before the call',
                  '60 minutes on your chosen topic — your pace, your doubts',
                  'You leave with a clear next-step plan for that topic',
                  'Optional: continue with the full program if it\'s the right fit',
                ].map((step, i) => (
                  <div key={i} style={{ display: 'flex', gap: '10px' }}>
                    <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'var(--navy)', color: 'var(--gold)', fontSize: '11px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{i + 1}</div>
                    <div style={{ fontSize: '12.5px', color: 'var(--text2)' }}>{step}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="card" style={{ background: 'var(--navy)', borderColor: 'var(--bi)' }}>
              <div style={{ fontSize: '12.5px', color: 'var(--inv2)', lineHeight: 1.75, fontStyle: 'italic' }}>"If a single session makes you feel like you finally understand the topic — that's the entire point. We don't need to sell you anything. You'll know."</div>
              <div style={{ fontSize: '11px', color: 'var(--inv3)', marginTop: '10px' }}>— Studyverse</div>
            </div>
          </div>
        </div>

        <div style={{ background: 'linear-gradient(135deg,var(--navy) 0%,#1a2f5e 100%)', border: '1px solid var(--gold-b)', borderRadius: 'var(--rxl)', padding: '28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: '10px', color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '.1em', fontWeight: 600, marginBottom: '6px' }}>Full Program</div>
            <div style={{ fontFamily: 'var(--fs)', fontSize: '20px', fontWeight: 700, color: 'var(--inv)', marginBottom: '6px' }}>Enroll in the complete personalised program</div>
            <div style={{ fontSize: '13px', color: 'var(--inv2)', maxWidth: '500px' }}>Dedicated mentor, weekly sessions, parent reports, full journey tracking — everything built around you personally. For students serious about cracking JEE Mains 2026.</div>
            <div style={{ display: 'flex', gap: '16px', marginTop: '14px' }}>
              {[{ val: '1-to-1', lbl: 'Dedicated Mentor' }, { val: 'Weekly', lbl: 'Parent Reports' }, { val: '100%', lbl: 'Personalised' }].map((s, i) => (
                <div key={i} style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: 'var(--fs)', fontSize: '20px', fontWeight: 700, color: 'var(--gold)' }}>{s.val}</div>
                  <div style={{ fontSize: '10px', color: 'var(--inv3)' }}>{s.lbl}</div>
                </div>
              ))}
            </div>
          </div>
          <button className="btn btn-gold" style={{ fontSize: '14px', padding: '13px 26px', flexShrink: 0 }} onClick={() => onOpenModal('enroll-modal')}>Talk to Us About Enrollment →</button>
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
          <>
            {[
              { icon: '📕', name: 'NCERT Chemistry Class XI',   meta: 'PDF • 18.4 MB • Free', url: 'https://ncert.nic.in/textbook.php?kech1=0-14' },
              { icon: '📗', name: 'NCERT Mathematics Class XII', meta: 'PDF • 22.1 MB • Free', url: 'https://ncert.nic.in/textbook.php?lemh1=0-13' },
            ].map((r, i) => (
              <div key={i} className="res-row" style={{ cursor: 'pointer' }} onClick={() => window.open(r.url, '_blank', 'noreferrer')}>
                <div className="rr-icon">{r.icon}</div>
                <div><div className="rr-name">{r.name}</div><div className="rr-meta">{r.meta}</div></div>
                <button className="btn btn-sm btn-ghost" style={{ marginLeft: 'auto', flexShrink: 0 }} onClick={e => { e.stopPropagation(); window.open(r.url, '_blank', 'noreferrer'); }}>↓ Download</button>
              </div>
            ))}
            <div className="lock-wrap" style={{ marginTop: '4px' }}>
              <div className="lock-blur">
                {[
                  { icon: '📘', name: 'H.C. Verma — Concepts of Physics Vol 1 & 2', meta: 'PDF • Curated by Ajay' },
                  { icon: '📑', name: 'JEE Mains 2023 & 2024 — Papers + Solutions', meta: 'PDF • 4 papers with detailed solutions' },
                  { icon: '📄', name: "Formula Sheet — All 3 Subjects (Ajay's Edition)", meta: 'PDF • Mentor-curated, JEE pattern' },
                  { icon: '🗒️', name: 'Electrostatics & Mechanics — Concept Notes', meta: 'PDF • Matched to your weak areas' },
                ].map((r, i) => (
                  <div key={i} className="res-row">
                    <div className="rr-icon">{r.icon}</div>
                    <div><div className="rr-name">{r.name}</div><div className="rr-meta">{r.meta}</div></div>
                  </div>
                ))}
              </div>
              <div className="lock-overlay">
                <div className="lock-box">
                  <div className="lock-icon">🔒</div>
                  <div className="lock-title">Unlock Premium Resources</div>
                  <div className="lock-sub">HC Verma PDFs, PYQ papers with solutions, and Ajay's personal formula sheets — matched to your weak topics.</div>
                  <button className="btn btn-gold btn-full" onClick={() => onOpenModal('upgrade-modal')}>Unlock Resources</button>
                </div>
              </div>
            </div>
          </>
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
              <div className="pc-feat no">Mentorship &amp; accountability</div>
            </div>
            <button className="btn btn-ghost btn-full" style={{ opacity: 0.6, cursor: 'default' }}>Current Plan</button>
          </div>

          {/* ── Forge ── */}
          <div className="price-card featured">
            <div className="pc-badge">GET STARTED</div>
            <div className="pc-name">Forge</div>
            <div className="pc-tagline">Build your score, problem by problem</div>
            <div className="pc-price" style={{ color: 'var(--gold)' }}>₹ XX</div>
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
            <button className="btn btn-gold btn-full" onClick={() => onOpenModal('upgrade-modal')}>Get Forge →</button>
          </div>

          {/* ── Apex ── */}
          <div className="price-card" style={{ background: 'var(--navy)', color: '#fff', border: '2px solid var(--gold)' }}>
            <div className="pc-badge" style={{ background: 'var(--gold)', color: '#0F1F3D' }}>COMPLETE PROGRAM</div>
            <div className="pc-name" style={{ color: '#fff' }}>Apex</div>
            <div className="pc-tagline" style={{ color: 'rgba(253,248,240,0.6)' }}>The highest point</div>
            <div className="pc-price" style={{ color: 'var(--gold)' }}>₹ XX</div>
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
            <button className="btn btn-gold btn-full" onClick={() => onOpenModal('enroll-modal')}>Talk to Us →</button>
          </div>

          {/* ── Anchor ── */}
          <div className="price-card">
            <div className="pc-name">Anchor</div>
            <div className="pc-tagline">Someone in your corner, every day</div>
            <div className="pc-price">₹ XX</div>
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
            <button className="btn btn-navy btn-full" onClick={() => onOpenModal('enroll-modal')}>Talk to Us →</button>
          </div>
        </div>
        <div style={{ background: 'var(--cream)', border: '1px solid var(--gold-b)', borderRadius: 'var(--rl)', padding: '18px 22px', textAlign: 'center', boxShadow: 'var(--sh)', marginTop: '16px' }}>
          <div style={{ fontFamily: 'var(--fs)', fontSize: '15px', fontWeight: 600, marginBottom: '4px' }}>Not ready to commit? That's fine.</div>
          <div style={{ fontSize: '13px', color: 'var(--text2)', marginBottom: '14px' }}>Book a single session with Ajay for <strong>₹ XX</strong>. No plan needed. Pay only for what you need.</div>
          <button className="btn btn-gold" onClick={() => onNav('sessions')}>Book a Single Session →</button>
        </div>
      </div>

      {/* ══════════ NOTIFICATIONS ══════════ */}
      <div className={p('notif')}>
        <div className="card">
          <div className="sh"><div className="sh-t">Notifications</div><span className="sh-a" onClick={() => onShowToast('All marked as read')}>Mark all read</span></div>
          {[
            { dot: 'var(--gold)', title: 'Diagnostic Ready', body: '— Your topic weakness map has been generated. See your results.', time: 'Just now' },
            { dot: 'var(--text3)', title: 'Habit Check-in', body: "— You haven't logged today's habits yet.", time: '2 hours ago' },
            { dot: 'var(--text3)', title: 'Study Tip', body: '— Electrostatics is your #1 weak area. Even 90 minutes today moves the needle.', time: 'Yesterday' },
          ].map((n, i) => (
            <div key={i} style={{ display: 'flex', gap: '12px', padding: '13px 0', borderBottom: i < 2 ? '1px solid var(--b)' : 'none' }}>
              <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: n.dot, flexShrink: 0, marginTop: '5px' }}></div>
              <div>
                <div style={{ fontSize: '13px', color: 'var(--text2)' }}><strong style={{ color: 'var(--text)' }}>{n.title}</strong>{n.body}</div>
                <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '3px' }}>{n.time}</div>
              </div>
            </div>
          ))}
        </div>
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
                    <div className="journey-exam-days">{daysRemaining ?? '—'}</div>
                    <div className="journey-exam-label">days remaining</div>
                  </div>
                </div>
                <ArcTrack height={140} viewBox="0 0 800 130" solidPath={arc.solidPath} dashedPath={arc.dashedPath} fillPath={arc.fillPath} nodes={arc.nodes} />
                <ScoreDeltas items={[
                  { label: 'Started At (Week 1)', val: baselineMarks ?? '—', valClass: 'white', change: first ? new Date(first.testDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'No data', neutral: true },
                  { label: 'Current Score', val: currentMarks ?? '—', valClass: 'gold', change: improvement !== null ? `+${improvement} marks in ${weeks.length} week${weeks.length !== 1 ? 's' : ''}` : 'No tests yet' },
                  { label: 'Target', val: targetMarks, valClass: 'white', change: toGo !== null ? `${toGo} marks to go` : '—', changeStyle: { color: 'var(--gold)' } },
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
