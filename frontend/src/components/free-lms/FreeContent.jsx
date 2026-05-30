import React, { useState, useRef, useEffect } from 'react';

const mcqData = [
  { id: 1, qHtml: 'Q1. If f(x) = x² – 3x + 2, find lim<sub>x→2</sub> [f(x)/(x–2)]', opts: ['A. 0', 'B. 1', 'C. 2', "D. Doesn't exist"], correct: 'B' },
  { id: 2, qHtml: 'Q2. ∫(2x + 3)dx equals:', opts: ['A. x² + 3x + C', 'B. 2x² + 3 + C', 'C. x + 3 + C', 'D. 2 + C'], correct: 'A' },
  { id: 3, qHtml: 'Q3. A body of mass 5 kg is moving at 10 m/s. What is its kinetic energy?', opts: ['A. 50 J', 'B. 100 J', 'C. 250 J', 'D. 500 J'], correct: 'C' },
  { id: 4, qHtml: 'Q4. Two charges of +2μC and –2μC are placed 0.1m apart. The force between them is: (k = 9×10⁹)', opts: ['A. 3.6 N (attractive)', 'B. 3.6 N (repulsive)', 'C. 36 N (attractive)', 'D. 0.36 N'], correct: 'A' },
  { id: 5, qHtml: 'Q5. The number of moles in 44g of CO₂ (M = 44 g/mol) is:', opts: ['A. 1 mol', 'B. 2 mol', 'C. 0.5 mol', 'D. 44 mol'], correct: 'A' },
  { id: 6, qHtml: 'Q6. In a nucleophilic substitution (SN2) reaction, the attacking nucleophile approaches from:', opts: ['A. The same side as the leaving group', 'B. The back side (180° to leaving group)', 'C. The top face only', 'D. Any side — no preference'], correct: 'B' },
];

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

const ratingLabels = [
  { emoji: '😟', label: 'Very Weak' },
  { emoji: '😕', label: 'Weak' },
  { emoji: '😐', label: 'Average' },
  { emoji: '🙂', label: 'Good' },
  { emoji: '😎', label: 'Strong' },
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

const topicIcons = {
  electro: '⚡', mechanics: '⚙️', integration: '∫',
  limits: '📈', coordinate: '📐', 'physical-chem': '🧪', organic: '🔬',
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

const FreeContent = ({ activePage, onNav, onOpenModal, onShowToast, profile, onDiagnosticSaved, habitLogs = [], onHabitSaved }) => {
  const p = (name) => `page${activePage === name ? ' on' : ''}`;
  const firstName = profile?.name?.split(' ')[0] || 'there';
  const examTarget = profile?.studentProfile?.examTarget || 'your exam';

  // Diagnostic state
  const [diagStep, setDiagStep] = useState(1);
  const [diagDone, setDiagDone] = useState(false);
  const [ratings, setRatings] = useState({});
  const [mcqCurrent, setMcqCurrent] = useState(1);
  const [mcqFeedback, setMcqFeedback] = useState(null);
  const [mcqDone, setMcqDone] = useState(false);
  const [mcqCorrect, setMcqCorrect] = useState(0);
  const [savedScore, setSavedScore] = useState(null);
  const mcqTimer = useRef(null);

  const THREE_MONTHS_MS = 3 * 30 * 24 * 60 * 60 * 1000;

  const getNextAllowedDate = (takenAt) => takenAt ? new Date(new Date(takenAt).getTime() + THREE_MONTHS_MS) : null;
  const isRetakeUnlocked = (takenAt) => { const next = getNextAllowedDate(takenAt); return next ? new Date() >= next : true; };

  // If diagnostic already done (from DB), show completed state
  useEffect(() => {
    const sp = profile?.studentProfile;
    if (sp?.diagnosticScore !== null && sp?.diagnosticScore !== undefined) {
      setDiagDone(true);
      setSavedScore(sp.diagnosticScore);
    }
  }, [profile]);

  // Save to DB when MCQ round finishes
  useEffect(() => {
    if (!mcqDone) return;
    const pcts = [mathPct, physPct, chemPct].filter(p => p !== null);
    const selfAvg = pcts.length ? Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length) : 50;
    const mcqScore = Math.round((mcqCorrect / 6) * 100);
    saveDiagnostic(selfAvg, mcqScore);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mcqDone]);

  const startRetake = () => {
    setDiagStep(1);
    setDiagDone(false);
    setSavedScore(null);
    setRatings({});
    setMcqCurrent(1);
    setMcqFeedback(null);
    setMcqDone(false);
    setMcqCorrect(0);
  };

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

  const rate = (topicKey, val) => {
    setRatings(prev => ({ ...prev, [topicKey]: val }));
  };

  const answerMCQ = (chosen, correct) => {
    if (mcqFeedback) return;
    const isCorrect = chosen === correct;
    setMcqFeedback({ chosen, correct, isCorrect });
    if (isCorrect) setMcqCorrect(c => c + 1);
    clearTimeout(mcqTimer.current);
    mcqTimer.current = setTimeout(() => {
      setMcqFeedback(null);
      if (mcqCurrent >= 6) {
        setMcqDone(true);
        setDiagDone(true);
        setDiagStep(3);
      } else {
        setMcqCurrent(c => c + 1);
      }
    }, 1200);
  };

  const saveDiagnostic = async (selfAvg, mcqScore) => {
    const finalScore = Math.round(selfAvg * 0.7 + mcqScore * 0.3);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('http://localhost:5000/api/student/diagnostic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ score: finalScore }),
      });
      if (res.ok) {
        const data = await res.json();
        setSavedScore(finalScore);
        onDiagnosticSaved?.(finalScore, new Date().toISOString());
      }
    } catch { /* silent — result is still shown */ }
  };

  const mcqProgress = mcqDone ? 100 : ((mcqCurrent - 1) / 6 * 100);

  const stepStyle = (step) => {
    if (diagStep > step) return { background: 'rgba(34,197,94,0.15)', color: 'var(--green)' };
    if (diagStep === step) return { background: 'var(--navy)', color: 'var(--gold)' };
    return { background: 'var(--cream2)', color: 'var(--text3)' };
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
      const res = await fetch('http://localhost:5000/api/student/habits', {
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
  const weakTopicsList = allRatedTopics.filter(t => t.pct <= 60).slice(0, 4);
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
        {savedScore !== null && !mcqDone && (() => {
          const takenAt = profile?.studentProfile?.diagnosticTakenAt;
          const nextDate = getNextAllowedDate(takenAt);
          const unlocked = isRetakeUnlocked(takenAt);
          const nextStr = nextDate ? nextDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : null;
          return (
            <div style={{ background: unlocked ? 'var(--gold-dim)' : 'var(--green-dim)', border: `1px solid ${unlocked ? 'var(--gold-b)' : 'rgba(34,197,94,0.3)'}`, borderRadius: 'var(--r)', padding: '14px 18px', marginBottom: '22px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: unlocked ? 'var(--gold)' : 'var(--green)', marginBottom: '2px' }}>
                    {unlocked ? '🔓 Retake now available!' : '✓ Diagnostic completed — 3-month plan active'}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text2)' }}>
                    Your score: <strong style={{ color: 'var(--text)' }}>{savedScore}%</strong>
                    {!unlocked && nextStr && <span> — next test unlocks on <strong style={{ color: 'var(--text)' }}>{nextStr}</strong></span>}
                    {unlocked && <span> — retake to get a fresh 3-month plan</span>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexShrink: 0, flexWrap: 'wrap' }}>
                  <button className="btn btn-sm btn-ghost" onClick={() => onNav('topics')}>Topic Map →</button>
                  <button className="btn btn-sm btn-ghost" onClick={() => onNav('guidance')}>Study Plan →</button>
                  {unlocked && <button className="btn btn-sm btn-gold" onClick={startRetake}>Retake Test →</button>}
                </div>
              </div>
            </div>
          );
        })()}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, ...stepStyle(1) }}>
            <span>①</span> Self-Rating
          </div>
          <div style={{ width: '24px', height: '1px', background: 'var(--b)', flexShrink: 0 }}></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, ...stepStyle(2) }}>
            <span>②</span> Confirm with MCQs
          </div>
          <div style={{ width: '24px', height: '1px', background: 'var(--b)', flexShrink: 0 }}></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, ...stepStyle(3) }}>
            <span>③</span> Your Results
          </div>
        </div>

        {/* Step 1: Self Rating */}
        <div className={`diag-step${diagStep === 1 ? ' on' : ''}`}>
          <div className="card mb">
            <div style={{ fontFamily: 'var(--fs)', fontSize: '18px', fontWeight: 700, color: 'var(--text)', marginBottom: '4px' }}>How confident are you in each topic?</div>
            <div style={{ fontSize: '13px', color: 'var(--text3)', marginBottom: '20px' }}>Be honest — this helps us find your real gaps. Nobody sees this except you.</div>

            {ratingTopics.map((group, gi) => (
              <div key={gi}>
                <div style={{ fontSize: '11px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.1em', fontWeight: 600, marginBottom: '10px', paddingBottom: '8px', borderBottom: '1px solid var(--b)', marginTop: gi > 0 ? '4px' : 0 }}>{group.group}</div>
                {group.topics.map((topic, ti) => (
                  <div key={ti} style={{ marginBottom: ti === group.topics.length - 1 && gi < ratingTopics.length - 1 ? '18px' : '14px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text)', marginBottom: '6px' }}>{topic.label}</div>
                    <div className="rating-row">
                      {ratingLabels.map((r, ri) => (
                        <div key={ri} className={`rating-btn${ratings[topic.key] === ri + 1 ? ' sel' : ''}`} onClick={() => rate(topic.key, ri + 1)}>
                          <span className="rb-emoji">{r.emoji}</span>{r.label}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ))}

            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-gold" onClick={() => setDiagStep(2)}>Confirm with MCQs →</button>
            </div>
          </div>
        </div>

        {/* Step 2: MCQ */}
        <div className={`diag-step${diagStep === 2 ? ' on' : ''}`}>
          <div className="card mb">
            <div style={{ fontFamily: 'var(--fs)', fontSize: '18px', fontWeight: 700, color: 'var(--text)', marginBottom: '4px' }}>Confirm your level — 6 quick questions</div>
            <div style={{ fontSize: '13px', color: 'var(--text3)', marginBottom: '16px' }}>Based on your self-rating, we picked topics to verify. Attempt honestly.</div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${mcqProgress}%` }}></div>
            </div>

            {!mcqDone ? mcqData.map((q, qi) => {
              if (q.id !== mcqCurrent) return null;
              return (
                <div key={qi} className="mcq-card">
                  <div className="mcq-q" dangerouslySetInnerHTML={{ __html: q.qHtml }}></div>
                  <div className="mcq-opts">
                    {q.opts.map((opt, oi) => {
                      const letter = String.fromCharCode(65 + oi);
                      const fb = mcqFeedback;
                      const isAnswered = !!fb;
                      const isChosen = isAnswered && fb.chosen === letter;
                      const isCorrectOpt = letter === q.correct;
                      let cls = 'mcq-opt';
                      if (isAnswered) {
                        cls += ' done';
                        if (isChosen && isCorrectOpt) cls += ' correct sel-opt';
                        else if (isChosen && !isCorrectOpt) cls += ' wrong sel-opt';
                        else if (isCorrectOpt) cls += ' correct';
                      }
                      return (
                        <div key={oi} className={cls} onClick={() => answerMCQ(letter, q.correct)}>{opt}</div>
                      );
                    })}
                  </div>
                </div>
              );
            }) : (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ fontSize: '32px', marginBottom: '10px' }}>✅</div>
                <div style={{ fontFamily: 'var(--fs)', fontSize: '17px', fontWeight: 600, color: 'var(--text)', marginBottom: '6px' }}>All 6 questions done!</div>
                <div style={{ fontSize: '13px', color: 'var(--text3)', marginBottom: '18px' }}>Generating your personalised weakness map...</div>
                <button className="btn btn-gold" onClick={() => setDiagStep(3)}>See My Results →</button>
              </div>
            )}
          </div>
        </div>

        {/* Step 3: Results */}
        <div className={`diag-step${diagStep === 3 ? ' on' : ''}`}>
          <div className="card-dark" style={{ borderRadius: 'var(--rxl)', padding: '28px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '22px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <div style={{ fontFamily: 'var(--fs)', fontSize: '21px', fontWeight: 700, color: 'var(--inv)', marginBottom: '4px' }}>Your Diagnostic Results</div>
                <div style={{ fontSize: '13px', color: 'var(--inv2)' }}>Based on your self-rating + MCQ performance • JEE Mains pattern</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                <span className="pill pp" style={{ fontSize: '11px' }}>Completed ✓</span>
                {savedScore !== null && <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--gold)' }}>Overall: {savedScore}%</span>}
                {(() => {
                  const takenAt = profile?.studentProfile?.diagnosticTakenAt;
                  const nextDate = getNextAllowedDate(takenAt);
                  if (!nextDate) return null;
                  const nextStr = nextDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
                  return <span style={{ fontSize: '11px', color: 'var(--inv3)' }}>Next test: {nextStr}</span>;
                })()}
              </div>
            </div>
            <div className="g3" style={{ marginBottom: 0 }}>
              {[
                { subj: 'Mathematics', raw: mathPct },
                { subj: 'Physics', raw: physPct },
                { subj: 'Chemistry', raw: chemPct },
              ].map((s, i) => {
                const m = pctMeta(s.raw);
                return (
                  <div key={i} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--bi)', borderRadius: 'var(--rl)', padding: '16px', textAlign: 'center' }}>
                    <div style={{ fontSize: '11px', color: 'var(--inv3)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '6px' }}>{s.subj}</div>
                    <div style={{ fontFamily: 'var(--fs)', fontSize: '28px', fontWeight: 700, color: m.color }}>{s.raw !== null ? `${s.raw}%` : '—'}</div>
                    <div style={{ fontSize: '11px', color: m.color, marginTop: '3px' }}>{m.note}</div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="g2 mb">
            <div className="card">
              <div className="sh-t" style={{ marginBottom: '14px' }}>Your Weak Topics (Priority Order)</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {weakTopicsList.length > 0 ? weakTopicsList.map((item, i) => {
                  const isRed = item.pct <= 40;
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: isRed ? 'var(--red-dim)' : 'var(--orange-dim)', borderRadius: 'var(--r)', border: `1px solid ${isRed ? 'rgba(239,68,68,0.2)' : 'rgba(249,115,22,0.2)'}` }}>
                      <span style={{ fontSize: '16px' }}>{topicIcons[item.key] || '📌'}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>{item.label}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text3)' }}>{item.subject} • {pctMeta(item.pct).note} — {item.pct}%</div>
                      </div>
                      <span className={`cr-tag ${isRed ? 'weak-tag' : 'ok-tag'}`}>#{i + 1} Fix</span>
                    </div>
                  );
                }) : (
                  <div style={{ fontSize: '13px', color: 'var(--text3)', padding: '10px 0' }}>No weak topics identified — all topics rated above average.</div>
                )}
              </div>
            </div>
            <div className="card">
              <div className="sh-t" style={{ marginBottom: '14px' }}>What to do next</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ padding: '12px 14px', background: 'var(--green-dim)', borderRadius: 'var(--r)', border: '1px solid rgba(34,197,94,0.2)' }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--green)', marginBottom: '3px' }}>✓ Free — View your Topic Map</div>
                  <div style={{ fontSize: '12px', color: 'var(--text2)' }}>See exactly where each chapter stands across all subjects.</div>
                  <button className="btn btn-sm btn-ghost" style={{ marginTop: '8px' }} onClick={() => onNav('topics')}>View Topic Map →</button>
                </div>
                <div style={{ padding: '12px 14px', background: 'var(--green-dim)', borderRadius: 'var(--r)', border: '1px solid rgba(34,197,94,0.2)' }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--green)', marginBottom: '3px' }}>✓ Free — Get Study Guidance</div>
                  <div style={{ fontSize: '12px', color: 'var(--text2)' }}>A day-by-day plan based on your results.</div>
                  <button className="btn btn-sm btn-ghost" style={{ marginTop: '8px' }} onClick={() => onNav('guidance')}>See My Plan →</button>
                </div>
                <div style={{ padding: '12px 14px', background: 'var(--gold-dim)', borderRadius: 'var(--r)', border: '1px solid var(--gold-b)' }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--gold)', marginBottom: '3px' }}>🔒 Unlock — Practice questions on your weak topics</div>
                  <div style={{ fontSize: '12px', color: 'var(--text2)' }}>Questions matched to electrostatics, mechanics &amp; integration.</div>
                  <button className="btn btn-sm btn-gold" style={{ marginTop: '8px' }} onClick={() => onOpenModal('upgrade-modal')}>Unlock Questions →</button>
                </div>
              </div>
            </div>
          </div>
        </div>
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
          <div className="card" style={{ marginBottom: '12px', color: 'var(--text3)', fontSize: '13px', padding: '16px 20px' }}>Complete your diagnostic to get a personalised study plan.</div>
        )}

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
              Complete your diagnostic to identify your strong topics and keep them warm.
            </div>
          )}
        </div>

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

      {/* ══════════ QUESTION BANK (locked) ══════════ */}
      <div className={p('questions')}>
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
              <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '10px' }}>Or book a single session to get them explained by Ajay</div>
            </div>
          </div>
        </div>
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
        {[
          { icon: '📕', name: 'NCERT Chemistry Class XI', meta: 'PDF • 18.4 MB • Free' },
          { icon: '📗', name: 'NCERT Mathematics Class XII', meta: 'PDF • 22.1 MB • Free' },
        ].map((r, i) => (
          <div key={i} className="res-row" style={{ cursor: 'pointer' }} onClick={() => onShowToast('Downloading...')}>
            <div className="rr-icon">{r.icon}</div>
            <div><div className="rr-name">{r.name}</div><div className="rr-meta">{r.meta}</div></div>
            <button className="btn btn-sm btn-ghost" style={{ marginLeft: 'auto', flexShrink: 0 }}>↓ Download</button>
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
      </div>

      {/* ══════════ PLANS ══════════ */}
      <div className={p('plans')}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ fontFamily: 'var(--fs)', fontSize: '26px', fontWeight: 700, color: 'var(--text)', marginBottom: '6px' }}>Simple, honest pricing</div>
          <div style={{ fontSize: '13.5px', color: 'var(--text2)' }}>Start free. Upgrade when it makes sense for you.</div>
        </div>
        <div className="pricing-grid">
          <div className="price-card">
            <div className="pc-name">Free Explorer</div>
            <div className="pc-price">₹0</div>
            <div className="pc-sub">No card. No login needed.</div>
            <div className="pc-feats">
              <div className="pc-feat">Personalised diagnostic (self-rate + MCQs)</div>
              <div className="pc-feat">Full topic weakness map</div>
              <div className="pc-feat">Study guidance (prioritised plan)</div>
              <div className="pc-feat">Daily habit tracker (5 habits)</div>
              <div className="pc-feat">Basic NCERT resources</div>
              <div className="pc-feat no">Custom question bank</div>
              <div className="pc-feat no">Faculty sessions</div>
              <div className="pc-feat no">Advanced PYQ resources</div>
            </div>
            <button className="btn btn-ghost btn-full">Current Plan</button>
          </div>
          <div className="price-card featured">
            <div className="pc-badge">MOST USEFUL</div>
            <div className="pc-name">Unlock</div>
            <div className="pc-price" style={{ color: 'var(--gold)' }}>₹ XX</div>
            <div className="pc-sub">One-time or monthly</div>
            <div className="pc-feats">
              <div className="pc-feat">Everything in Free</div>
              <div className="pc-feat">Question bank matched to your weak topics</div>
              <div className="pc-feat">Full diagnostic with detailed score report</div>
              <div className="pc-feat">Premium resources (HC Verma, PYQs, formula sheets)</div>
              <div className="pc-feat">Progress tracking over time</div>
              <div className="pc-feat no">1-to-1 faculty sessions</div>
              <div className="pc-feat no">Dedicated mentor</div>
            </div>
            <button className="btn btn-gold btn-full" onClick={() => onOpenModal('upgrade-modal')}>Get Access</button>
          </div>
          <div className="price-card">
            <div className="pc-name">Full Program</div>
            <div className="pc-price">₹ XX</div>
            <div className="pc-sub">Per month · Personalised</div>
            <div className="pc-feats">
              <div className="pc-feat">Everything in Unlock</div>
              <div className="pc-feat">Dedicated 1-to-1 mentor (Ajay Sharma)</div>
              <div className="pc-feat">Weekly live sessions (personalised)</div>
              <div className="pc-feat">Weekly parent reports every Sunday</div>
              <div className="pc-feat">Your personal Score Journey arc</div>
              <div className="pc-feat">Doubt desk (mentor replies within 4h)</div>
              <div className="pc-feat">Mentor-assigned tests based on your gaps</div>
            </div>
            <button className="btn btn-navy btn-full" onClick={() => onOpenModal('enroll-modal')}>Talk to Us →</button>
          </div>
        </div>
        <div style={{ background: 'var(--cream)', border: '1px solid var(--gold-b)', borderRadius: 'var(--rl)', padding: '18px 22px', textAlign: 'center', boxShadow: 'var(--sh)' }}>
          <div style={{ fontFamily: 'var(--fs)', fontSize: '15px', fontWeight: 600, marginBottom: '4px' }}>Not ready to commit? That's fine.</div>
          <div style={{ fontSize: '13px', color: 'var(--text2)', marginBottom: '14px' }}>Book a single session with Ajay for <strong>₹ XX</strong>. No subscription. Pay only for the session you need. If it helps, you'll know.</div>
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

    </div>
  );
};

export default FreeContent;
