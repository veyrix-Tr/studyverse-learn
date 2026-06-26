import { useState } from 'react';
import { useParams } from 'react-router-dom';
import DailyReportForm from '../common/DailyReportForm';

const HABIT_ICONS = {
  sleep: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#86EFAC" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  ),
  study: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#86EFAC" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
    </svg>
  ),
  revision: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#86EFAC" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
      <path d="M3 3v5h5"/>
    </svg>
  ),
  phone: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#86EFAC" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="2" width="14" height="20" rx="2"/>
      <line x1="9" y1="7" x2="15" y2="7"/>
      <line x1="9" y1="10" x2="15" y2="10"/>
      <circle cx="17" cy="17" r="4" fill="#102D1E" stroke="#F87171" strokeWidth="1.8"/>
      <line x1="14.5" y1="19.5" x2="19.5" y2="14.5" stroke="#F87171" strokeWidth="1.8"/>
    </svg>
  ),
  problems: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#86EFAC" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9"/>
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
    </svg>
  ),
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

const AnchorContent = ({ activePage, onNav, onShowToast, habitLogs = [], onHabitSaved, resources = [], dailyReports = [], profile, onReportSubmitted }) => {
  const { id: userId } = useParams();
  const pg = (name) => `page${activePage === name ? ' on' : ''}`;

  const [resTab, setResTab] = useState(0);

  // Expandable sections
  const [openSections, setOpenSections] = useState(new Set(['call-week6', 'subj-physics']));
  const toggleSection = (key) => setOpenSections(prev => {
    const next = new Set(prev);
    if (next.has(key)) { next.delete(key); } else { next.add(key); }
    return next;
  });

  // Habits
  const [habitState, setHabitState] = useState({});
  const [habitSaving, setHabitSaving] = useState(false);

  const today = getTodayIST();
  const todayLog = habitLogs.find(l => l.date === today) || null;
  const alreadyCheckedIn = !!todayLog;
  const streak = computeStreak(habitLogs);

  // Daily report stats for parent view
  const drStreak = (() => {
    if (!dailyReports.length) return 0;
    const sorted = [...dailyReports].sort((a, b) => b.date.localeCompare(a.date));
    const yesterday = new Date(Date.now() + 5.5 * 60 * 60 * 1000 - 86400000).toISOString().slice(0, 10);
    let exp = (sorted[0]?.date === today) ? today : yesterday;
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
  const drSubmitted7 = drLast7.length;
  const drAvgHrs = drLast7.length
    ? (drLast7.reduce((s, r) => s + (r.hrsPhysics || 0) + (r.hrsChemistry || 0) + (r.hrsThird || 0), 0) / drLast7.length).toFixed(1)
    : null;
  const drAvgFocus = drLast7.length
    ? (drLast7.reduce((s, r) => s + r.focusQuality, 0) / drLast7.length).toFixed(1)
    : null;
  const drQsSolved7 = drLast7.reduce((s, r) => s + (r.questionsSolved || 0), 0);

  // Current-month grid + ring for dashboard consistency card
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

  // Build real 14-day dot grid from habitLogs
  const logMap = Object.fromEntries(habitLogs.map(l => [l.date, l]));
  const hdRow = HABIT_KEYS.map(k => {
    const dots = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(Date.now() + 5.5 * 60 * 60 * 1000 - i * 86400000);
      const dateStr = d.toISOString().slice(0, 10);
      if (dateStr === today && !alreadyCheckedIn) { dots.push('t'); }
      else if (logMap[dateStr]) { dots.push(logMap[dateStr][k] ? 'y' : 'n'); }
      else { dots.push('e'); }
    }
    return { label: HABIT_LABELS[k], dots };
  });

  return (
    <div className="content">

      {/* ══════════ DASHBOARD ══════════ */}
      <div className={pg('dashboard')}>
        <div style={{ marginBottom:'22px', display:'flex', alignItems:'flex-end', justifyContent:'space-between', flexWrap:'wrap', gap:'12px' }}>
          <div>
            <div style={{ fontSize:'11px', color:'var(--t3)', textTransform:'uppercase', letterSpacing:'.1em', fontWeight:600, marginBottom:'4px' }}>
              {new Date().toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}
            </div>
            <div style={{ fontFamily:'var(--fs)', fontSize:'24px', fontWeight:700, color:'var(--t1)' }}>{(() => { const h = new Date(Date.now() + 5.5*60*60*1000).getUTCHours(); return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'; })()}, {profile?.name?.split(' ')[0] || 'there'}.</div>
            <div style={{ fontSize:'13.5px', color:'var(--t2)', marginTop:'4px' }}>{(() => {
              const yesterdayStr = new Date(Date.now() + 5.5 * 60 * 60 * 1000 - 86400000).toISOString().slice(0, 10);
              const hadYesterday = dailyReports.some(r => r.date === yesterdayStr);
              if (todayDRDone) return <span>Today's report is <strong style={{ color:'var(--sage)' }}>in. ✓</strong> See you tomorrow.</span>;
              if (hadYesterday) return <span>Yesterday's report was received. Today's report is <strong style={{ color:'var(--gold)' }}>due before 10 PM.</strong></span>;
              if (dailyReports.length === 0) return <span>Start strong — <strong style={{ color:'var(--gold)' }}>submit your first daily report.</strong></span>;
              return <span>Today's report is <strong style={{ color:'var(--gold)' }}>due before 10 PM.</strong></span>;
            })()}</div>
          </div>
        </div>

        <div className="g4 mb">
          <div className="stat sa-amber">
            <div className="stat-l">Day Streak</div>
            <div className="stat-v" style={{ fontSize: drStreak > 0 ? undefined : '15px' }}>{drStreak > 0 ? drStreak : 'None yet'}</div>
            <div className="stat-n up">{drStreak > 0 ? 'days straight' : 'submit first report'}</div>
          </div>
          <div className="stat sa-green">
            <div className="stat-l">Reports Submitted</div>
            <div className="stat-v">{dailyReports.length}</div>
            <div className="stat-n up">{submittedThisMonth} this month</div>
          </div>
          <div className="stat sa-gold">
            <div className="stat-l">Mentor Responses</div>
            <div className="stat-v">41</div>
            <div className="stat-n" style={{ color:'var(--sage)' }}>every reply counts</div>
          </div>
          <div className="stat sa-blue">
            <div className="stat-l">Calls Completed</div>
            <div className="stat-v">6</div>
            <div className="stat-n up">↑ Next: Fri 6PM</div>
          </div>
        </div>

        <div className="g2 mb">
          {/* Streak ring + consistency grid */}
          <div className="card">
            <div className="sh">
              <div className="sh-t">Your Consistency</div>
              <span style={{ fontSize:'12px', color:'var(--t3)' }}>{monthLabel}</span>
            </div>
            <div className="streak-ring">
              <div className="ring-outer">
                <div className="ring-fill" style={{ background: 'conic-gradient(var(--sage) 0% ' + ringPct + '%, var(--bg4) ' + ringPct + '%)' }} />
                <div className="ring-val">{drStreak}</div>
              </div>
              <div className="ring-emoji">{drStreak > 0 ? '🔥' : '📅'} Day streak · {ringPct}% of month</div>
            </div>
            <div className="sh" style={{ marginBottom:'8px' }}>
              <div style={{ fontSize:'12px', color:'var(--t3)', fontWeight:500 }}>This month — daily reports</div>
            </div>
            <div className="week-grid">
              {monthDays.map(({ d, s }) => (
                <div key={d} className={`wg-day ${s}`}>{s !== 'future' ? d : ''}</div>
              ))}
            </div>
            <div style={{ display:'flex', gap:'12px', marginTop:'12px' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'5px', fontSize:'10.5px', color:'var(--t3)' }}><div className="wg-day logged" style={{ width:'16px', height:'16px', borderRadius:'4px', fontSize:0 }} />Submitted</div>
              <div style={{ display:'flex', alignItems:'center', gap:'5px', fontSize:'10.5px', color:'var(--t3)' }}><div className="wg-day today" style={{ width:'16px', height:'16px', borderRadius:'4px', fontSize:0 }} />Today</div>
              <div style={{ display:'flex', alignItems:'center', gap:'5px', fontSize:'10.5px', color:'var(--t3)' }}><div className="wg-day" style={{ width:'16px', height:'16px', borderRadius:'4px', fontSize:0, opacity:.5 }} />Future</div>
            </div>
          </div>

          {/* Mentor card */}
          <div className="mentor-card">
            <div className="mc-top">
              <div className="mc-av">A</div>
              <div>
                <div className="mc-name">Ajay Sharma</div>
                <div className="mc-role">Your Mentor · Anchor Program</div>
              </div>
            </div>
            <div className="mentor-note">
              "You've shown up 14 days straight. I read every report. The pattern I'm noticing — your focus quality drops on days when you skip morning study. Let's talk about this on Friday's call. For now: commit to starting before noon every day this week."
            </div>
            <div className="mc-stats">
              <div className="mc-stat"><div className="mc-stat-v">{dailyReports.length}</div><div className="mc-stat-l">Reports Read</div></div>
              <div className="mc-stat"><div className="mc-stat-v" style={{ fontSize: drStreak > 0 ? undefined : '13px' }}>{drStreak > 0 ? drStreak : 'None yet'}</div><div className="mc-stat-l">Day Streak</div></div>
              <div className="mc-stat"><div className="mc-stat-v">{ringPct}%</div><div className="mc-stat-l">Month Rate</div></div>
            </div>
          </div>
        </div>

        {/* Today's report CTA */}
        <div style={{ background: todayDRDone ? 'linear-gradient(135deg,rgba(74,222,128,.08),rgba(74,222,128,.04))' : 'linear-gradient(135deg,var(--bg3),var(--bg4))', border: '1px solid ' + (todayDRDone ? 'rgba(74,222,128,.25)' : 'var(--gb)'), borderRadius:'var(--rl)', padding:'20px 24px', display:'flex', alignItems:'center', gap:'20px', marginBottom:'22px' }}>
          <div style={{ width:'44px', height:'44px', borderRadius:'12px', background: todayDRDone ? 'rgba(74,222,128,.15)' : 'rgba(232,168,48,.12)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            {todayDRDone
              ? <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#4ADE80" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              : <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#E8A830" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>}
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontFamily:'var(--fs)', fontSize:'16px', fontWeight:700, color:'var(--t1)', marginBottom:'4px' }}>{todayDRDone ? "Today's report is in." : "Today's report — not submitted yet"}</div>
            <div style={{ fontSize:'13px', color:'var(--t2)' }}>{todayDRDone ? 'Your mentor will read this before your next session. Come back tomorrow.' : '2 minutes. Your mentor reads this before every session. Be honest.'}</div>
          </div>
          {todayDRDone
            ? <button className="btn btn-ghost btn-sm" onClick={() => onNav('report')}>View →</button>
            : <button className="btn btn-gold" onClick={() => onNav('report')}>Submit Now →</button>}
        </div>

        <div className="sh"><div className="sh-t">This Week</div></div>
        <div className="call-card">
          <div className="call-icon" style={{ background:'var(--gd)' }}>📞</div>
          <div className="call-info">
            <div className="call-title">Weekly Mentor Call</div>
            <div className="call-meta">Ajay Sharma · Friday, Apr 18 · 6:00 PM · 45 min</div>
          </div>
          <span className="call-badge c-upcoming">Fri 6PM</span>
        </div>
        <div className="call-card">
          <div className="call-icon" style={{ background:'var(--bg4)' }}>📋</div>
          <div className="call-info">
            <div className="call-title">Study Plan Updated</div>
            <div className="call-meta">Ajay revised your plan based on last week's reports · Apr 14</div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={() => onNav('guidance')}>Study Guidance →</button>
        </div>
      </div>

      {/* ══════════ DAILY REPORT ══════════ */}
      <div className={pg('report')}>
        {(() => {
          const today = new Date(Date.now() + 5.5 * 60 * 60 * 1000).toISOString().slice(0, 10);
          const todayReport = dailyReports.find(r => r.date === today) || null;
          return (
            <DailyReportForm
              profile={profile}
              mentorName="Ajay"
              todayReport={todayReport}
              dailyReports={dailyReports}
              onComplete={(report) => { onReportSubmitted?.(report); onShowToast('Report submitted ✓'); }}
            />
          );
        })()}
      </div>

      {/* ══════════ WEEKLY CALLS ══════════ */}
      <div className={pg('calls')}>
        <div style={{ background:'var(--bg3)', border:'1px solid var(--b)', borderRadius:'var(--rl)', padding:'14px 18px', marginBottom:'20px', borderLeft:'3px solid var(--sage)', fontSize:'13px', color:'var(--t2)' }}>
          📞 Weekly calls are not teaching sessions. They are 45 minutes of honest conversation about your preparation — what's working, what isn't, and what needs to change this week.
        </div>

        <div className="sh"><div className="sh-t">Upcoming</div></div>
        <div className="call-card" style={{ borderColor:'var(--gb)' }}>
          <div className="call-icon" style={{ background:'var(--gd)' }}>📞</div>
          <div className="call-info">
            <div className="call-title">Weekly Mentor Call — Week 7</div>
            <div className="call-meta">Mentor: Ajay Sharma · Friday, Apr 18 · 6:00 PM · 45 min</div>
          </div>
          <button className="btn btn-gold btn-sm" onClick={() => onShowToast('Call link will be sent to your WhatsApp before Friday')}>Details</button>
        </div>

        <div className="sh" style={{ marginTop:'8px' }}><div className="sh-t">Past Calls</div></div>

        <div className="plan-week">
          <div className="pw-header" onClick={() => toggleSection('call-week6')}>
            <div><div className="pw-title">Week 6 Call — Apr 11</div><div className="pw-sub">Focus: study schedule restructure + Physics gap</div></div>
            <svg className="tms-arrow" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: openSections.has('call-week6') ? 'rotate(180deg)' : '' }}><path d="M6 9l6 6 6-6"/></svg>
          </div>
          {openSections.has('call-week6') && (
            <div className="pw-body">
              <div style={{ fontSize:'13px', color:'var(--t2)', fontStyle:'italic', borderLeft:'3px solid var(--gold)', paddingLeft:'13px', marginBottom:'12px', lineHeight:1.8 }}>"We identified that the afternoon slump is the real problem — not lack of motivation. Moving high-focus work to mornings. Physics daily target reduced from 3h to 2h but with guaranteed problem-solving minimum."</div>
              <div style={{ fontSize:'12px', color:'var(--t3)' }}>Duration: 42 min · Apr 11, 6:00 PM</div>
              <div style={{ marginTop:'10px', padding:'10px 12px', background:'var(--bg)', borderRadius:'8px' }}>
                <div style={{ fontSize:'11px', color:'var(--t3)', fontWeight:600, textTransform:'uppercase', letterSpacing:'.07em', marginBottom:'6px' }}>Action items from this call</div>
                <div style={{ fontSize:'12.5px', color:'var(--t2)', display:'flex', flexDirection:'column', gap:'5px' }}>
                  <div>✓ Start Physics before noon every day</div>
                  <div>✓ 10 problems minimum — no exceptions</div>
                  <div>✓ Log energy level in daily report</div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="plan-week">
          <div className="pw-header" onClick={() => toggleSection('call-week5')}>
            <div><div className="pw-title">Week 5 Call — Apr 4</div><div className="pw-sub">Exam anxiety + mock test strategy</div></div>
            <svg className="tms-arrow" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: openSections.has('call-week5') ? 'rotate(180deg)' : '' }}><path d="M6 9l6 6 6-6"/></svg>
          </div>
          {openSections.has('call-week5') && (
            <div className="pw-body">
              <div style={{ fontSize:'13px', color:'var(--t2)', fontStyle:'italic', borderLeft:'3px solid var(--gold)', paddingLeft:'13px', lineHeight:1.8 }}>"Talked about performance anxiety on mocks vs. practice. Shifted approach — mocks are data, not grades. Agreed on one full mock per fortnight strategy."</div>
            </div>
          )}
        </div>
      </div>

      {/* ══════════ HABIT TRACKER ══════════ */}
      <div className={pg('habits')}>
        <div className="g2 mb">
          <div className="card">
            <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'16px' }}>
              <div>
                <div style={{ fontFamily:'var(--fs)', fontSize:'16px', fontWeight:700, color:'var(--t1)' }}>Today's Habits</div>
                <div style={{ fontSize:'12px', color:'var(--t3)' }}>{new Date().toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}</div>
              </div>
              {streak > 0 && <span style={{ fontFamily:'var(--fs)', fontSize:'20px', color:'var(--amber)' }}>🔥 {streak}</span>}
            </div>
            {alreadyCheckedIn && <div style={{ fontSize:'12.5px', color:'var(--green)', fontWeight:500, marginBottom:'14px' }}>✓ Today's check-in is saved. See you tomorrow!</div>}
            {HABIT_ITEMS.map(h => (
              <div key={h.key} className="habit-row" style={alreadyCheckedIn ? { opacity: 0.85 } : {}}>
                <div className="habit-left">
                  <div className="habit-icon">{HABIT_ICONS[h.key]}</div>
                  <div><div className="habit-name">{h.name}</div><div className="habit-desc">{h.desc}</div></div>
                </div>
                <div style={{ display:'flex', gap:'8px' }}>
                  <div className={`ht-yes${effectiveState[h.key] === 'yes' ? ' active' : ''}`} onClick={() => logHabit(h.key, 'yes')}>Yes</div>
                  <div className={`ht-no${effectiveState[h.key] === 'no' ? ' active' : ''}`} onClick={() => logHabit(h.key, 'no')}>No</div>
                </div>
              </div>
            ))}
            {!alreadyCheckedIn && allHabitsDone && (
              <div style={{ marginTop:'14px', textAlign:'right' }}>
                <button className="btn btn-gold btn-sm" onClick={saveHabits} disabled={habitSaving}>
                  {habitSaving ? 'Saving…' : 'Save ✓'}
                </button>
              </div>
            )}
          </div>

          <div className="card">
            <div style={{ fontFamily:'var(--fs)', fontSize:'15px', fontWeight:600, color:'var(--t1)', marginBottom:'14px' }}>Last 14 Days</div>
            <div style={{ textAlign:'center', padding:'10px 0 16px' }}>
              <div style={{ fontFamily:'var(--fs)', fontSize:'38px', fontWeight:700, color:'var(--sage)' }}>{habitCount}</div>
              <div style={{ fontSize:'13px', color:'var(--t3)' }}>today</div>
            </div>
            <div className="div" />
            <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
              {hdRow.map(row => (
                <div key={row.label} style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                  <div style={{ fontSize:'11px', color:'var(--t3)', width:'60px' }}>{row.label}</div>
                  <div style={{ display:'flex', gap:'4px' }}>
                    {row.dots.map((d, i) => <div key={i} className={`hd ${d}`} />)}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display:'flex', gap:'10px', marginTop:'12px' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'5px', fontSize:'10.5px', color:'var(--t3)' }}><div className="hd y" />Done</div>
              <div style={{ display:'flex', alignItems:'center', gap:'5px', fontSize:'10.5px', color:'var(--t3)' }}><div className="hd n" />Missed</div>
              <div style={{ display:'flex', alignItems:'center', gap:'5px', fontSize:'10.5px', color:'var(--t3)' }}><div className="hd t" />Today</div>
            </div>
          </div>
        </div>

        <div className="card" style={{ background:'var(--bg3)', borderColor:'var(--gb)' }}>
          <div style={{ fontFamily:'var(--fs)', fontSize:'14px', fontWeight:600, color:'var(--t1)', marginBottom:'6px' }}>Your mentor sees this</div>
          <div style={{ fontSize:'13px', color:'var(--t2)', lineHeight:1.8 }}>Ajay reviews your habit history before every weekly call. Patterns in your data — like skipping revision on Sundays or phone usage spiking mid-week — inform what he brings up on the call. You don't need to explain yourself. The data speaks.</div>
        </div>
      </div>

      {/* ══════════ REPORT HISTORY ══════════ */}
      <div className={pg('history')}>
        {dailyReports.length === 0 ? (
          <div style={{ textAlign:'center', padding:'48px 0', color:'var(--t3)', fontSize:'14px' }}>
            <div style={{ fontSize:'32px', marginBottom:'12px', opacity:.4 }}>📋</div>
            No reports yet. Submit your first daily report to see your history here.
          </div>
        ) : (
          <>
            <div style={{ fontSize:'13px', color:'var(--t2)', marginBottom:'18px' }}>
              {dailyReports.length} report{dailyReports.length !== 1 ? 's' : ''} submitted. Your mentor reads every one.
            </div>
            {dailyReports.map(r => {
              const key = 'r-' + r.id;
              const d = new Date(r.date + 'T00:00:00');
              const dateLabel = d.toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'short', year:'numeric' });
              const totalHrs = ((r.hrsPhysics || 0) + (r.hrsChemistry || 0) + (r.hrsThird || 0)).toFixed(1);
              const moodEmojis = ['','😩','😐','🙂','💪','🔥'];
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
                    <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
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
                      {r.noteForMentor && <div className="ri-field"><div className="ri-field-label">For Mentor</div><div className="ri-field-val" style={{ fontStyle:'italic' }}>{r.noteForMentor}</div></div>}
                    </div>
                  )}
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* ══════════ TOPIC MAP ══════════ */}
      <div className={pg('topics')}>
        <div style={{ background:'var(--bg3)', border:'1px solid var(--b)', borderRadius:'var(--rl)', padding:'12px 16px', marginBottom:'18px', borderLeft:'3px solid var(--sage)', fontSize:'13px', color:'var(--t2)' }}>
          📊 From your diagnostic. Your mentor uses this to understand your starting point — but Anchor doesn't teach subjects. If you need help on a specific topic, consider upgrading to Apex.
        </div>

        {[
          {
            key: 'subj-physics', icon: '⚡', name: 'Physics', pct: 41, barCls: 'pb-amber', color: 'var(--amber)',
            chapters: [
              { name: 'Electrostatics', pct: 31, color: 'var(--red)', tag: 'weak-tag', label: 'Weak' },
              { name: 'Mechanics', pct: 44, color: 'var(--amber)', barCls: 'pb-amber', tag: 'ok-tag', label: 'Avg' },
              { name: 'Waves & Optics', pct: 72, color: 'var(--green)', barCls: 'pb-green', tag: 'good-tag', label: 'Good' },
            ]
          },
          {
            key: 'subj-maths', icon: '📐', name: 'Mathematics', pct: 54, barCls: 'pb-amber', color: 'var(--amber)',
            chapters: [
              { name: 'Integration', pct: 42, color: 'var(--red)', tag: 'weak-tag', label: 'Weak' },
              { name: 'Trigonometry', pct: 74, color: 'var(--green)', barCls: 'pb-green', tag: 'good-tag', label: 'Good' },
            ]
          }
        ].map(subj => (
          <div key={subj.key} className="tm-subject">
            <div className="tms-header" onClick={() => toggleSection(subj.key)}>
              <div className="tms-icon">{subj.icon}</div>
              <div className="tms-name">{subj.name}</div>
              <div className="pbar" style={{ width:'110px', flexShrink:0 }}>
                <div className={`pbar-inner ${subj.barCls}`} style={{ width:`${subj.pct}%` }} />
              </div>
              <div className="tms-score" style={{ color: subj.color, width:'38px', textAlign:'right' }}>{subj.pct}%</div>
              <svg className="tms-arrow" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: openSections.has(subj.key) ? 'rotate(180deg)' : '' }}><path d="M6 9l6 6 6-6"/></svg>
            </div>
            {openSections.has(subj.key) && (
              <div style={{ padding:'12px 16px' }}>
                {subj.chapters.map((ch, i) => (
                  <div key={i} className="cr-row">
                    <div className="cr-name">{ch.name}</div>
                    <div className="cr-bar"><div className="pbar"><div className="pbar-inner" style={{ width:`${ch.pct}%`, background: ch.color }} /></div></div>
                    <div className="cr-pct" style={{ color: ch.color }}>{ch.pct}%</div>
                    <div className={`cr-tag ${ch.tag}`}>{ch.label}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        <div style={{ background:'linear-gradient(135deg,var(--bg3),var(--bg4))', border:'1px solid var(--gb)', borderRadius:'var(--rl)', padding:'18px 20px', marginTop:'16px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:'14px', flexWrap:'wrap' }}>
          <div>
            <div style={{ fontSize:'10px', color:'var(--gold)', fontWeight:700, textTransform:'uppercase', letterSpacing:'.1em', marginBottom:'4px' }}>Want these gaps fixed?</div>
            <div style={{ fontFamily:'var(--fs)', fontSize:'15px', fontWeight:700, color:'var(--t1)', marginBottom:'3px' }}>Upgrade to Apex for 1-to-1 subject sessions</div>
            <div style={{ fontSize:'12.5px', color:'var(--t2)' }}>Anchor gives you a mentor. Apex adds a subject faculty who teaches specifically to your gaps.</div>
          </div>
          <button className="btn btn-gold btn-sm" onClick={() => onShowToast('Contacting Studyverse about Apex upgrade...')}>Enquire About Apex →</button>
        </div>
      </div>

      {/* ══════════ RESOURCES ══════════ */}
      <div className={pg('resources')}>
        {/* Tabs — anchor theme */}
        <div style={{ display:'flex', gap:'2px', background:'var(--bg3)', border:'1px solid var(--b)', padding:'4px', borderRadius:'9px', width:'fit-content', marginBottom:'20px' }}>
          {['All', 'Study Material', 'Formula Sheet', 'Session Notes'].map((t, i) => (
            <div key={t} onClick={() => setResTab(i)}
              style={{ padding:'7px 17px', borderRadius:'6px', fontSize:'13px', fontWeight: resTab === i ? 600 : 500, cursor:'pointer', transition:'all .15s',
                background: resTab === i ? 'var(--bg4)' : 'transparent',
                color: resTab === i ? 'var(--t1)' : 'var(--t3)',
                boxShadow: resTab === i ? '0 1px 4px rgba(0,0,0,0.3)' : 'none' }}>
              {t}
            </div>
          ))}
        </div>

        {(() => {
          const TYPE_MAP = [null, 'Study Material', 'Formula Sheet', 'Session Notes'];
          const filtered = resTab === 0 ? resources : resources.filter(r => r.type === TYPE_MAP[resTab]);

          if (filtered.length === 0 && resources.length === 0) {
            // No resources from backend yet — show free NCERT
            return (
              <>
                <div style={{ fontSize:'10.5px', color:'var(--t3)', textTransform:'uppercase', letterSpacing:'.09em', fontWeight:600, marginBottom:'10px' }}>Free Resources</div>
                {[
                  { name: 'NCERT Chemistry Class XI',   meta: 'PDF • 18.4 MB', url: 'https://ncert.nic.in/textbook.php?kech1=0-14' },
                  { name: 'NCERT Mathematics Class XII', meta: 'PDF • 22.1 MB', url: 'https://ncert.nic.in/textbook.php?lemh1=0-13' },
                ].map((r, i) => (
                  <div key={i}
                    style={{ display:'flex', alignItems:'center', gap:'14px', padding:'13px 16px', borderRadius:'var(--r)', background:'var(--bg2)', border:'1px solid var(--b)', marginBottom:'8px', cursor:'pointer', transition:'all .15s' }}
                    onClick={() => window.open(r.url, '_blank', 'noreferrer')}
                    onMouseOver={e => e.currentTarget.style.borderColor = 'var(--gb)'}
                    onMouseOut={e => e.currentTarget.style.borderColor = 'var(--b)'}>
                    <div style={{ width:'38px', height:'38px', borderRadius:'9px', background:'var(--gd)', border:'1px solid var(--gb)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                    </div>
                    <div>
                      <div style={{ fontSize:'13px', fontWeight:500, color:'var(--t1)' }}>{r.name}</div>
                      <div style={{ fontSize:'11.5px', color:'var(--t3)', marginTop:'2px' }}>{r.meta}</div>
                    </div>
                    <button className="btn btn-sm btn-ghost" style={{ marginLeft:'auto', flexShrink:0 }} onClick={e => { e.stopPropagation(); window.open(r.url, '_blank', 'noreferrer'); }}>↓ Download</button>
                  </div>
                ))}
              </>
            );
          }

          if (filtered.length === 0) {
            return (
              <div style={{ fontSize:'13px', color:'var(--t3)', padding:'32px 0', textAlign:'center' }}>
                No {TYPE_MAP[resTab] || 'materials'} available yet.
              </div>
            );
          }

          return filtered.map(r => (
            <div key={r.id}
              style={{ display:'flex', alignItems:'center', gap:'14px', padding:'14px 16px', borderRadius:'var(--rl)', background:'var(--bg2)', border:'1px solid var(--b)', marginBottom:'10px', transition:'all .15s', cursor:'pointer' }}
              onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--b2)'; e.currentTarget.style.background = 'var(--bg3)'; }}
              onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--b)'; e.currentTarget.style.background = 'var(--bg2)'; }}>
              <div style={{ width:'40px', height:'40px', borderRadius:'10px', background:'var(--gd)', border:'1px solid var(--gb)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:'13.5px', fontWeight:600, color:'var(--t1)', marginBottom:'2px' }}>{r.title}</div>
                <div style={{ fontSize:'12px', color:'var(--t3)' }}>{r.subject} · {r.type} · By {r.facultyName}</div>
                {r.description && <div style={{ fontSize:'11.5px', color:'var(--t3)', marginTop:'3px', fontStyle:'italic' }}>{r.description}</div>}
              </div>
              <div style={{ display:'flex', gap:'6px', flexShrink:0 }}>
                <a href={`${import.meta.env.VITE_API_URL}/api/files/proxy?url=${encodeURIComponent(r.cloudinaryUrl)}`}
                  target="_blank" rel="noreferrer" className="btn btn-sm btn-ghost" style={{ textDecoration:'none' }}>↗ View</a>
                <a href={`${import.meta.env.VITE_API_URL}/api/files/proxy?url=${encodeURIComponent(r.cloudinaryUrl)}&download=1`}
                  target="_blank" rel="noreferrer" className="btn btn-sm btn-green" style={{ textDecoration:'none' }}>↓ Download</a>
              </div>
            </div>
          ));
        })()}
      </div>

      {/* ══════════ PARENT VIEW ══════════ */}
      <div className={pg('parent')}>
        <div className="parent-hero">
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'16px', flexWrap:'wrap', gap:'12px' }}>
            <div>
              <div style={{ fontFamily:'var(--fs)', fontSize:'20px', fontWeight:700, color:'var(--t1)', marginBottom:'4px' }}>Parent View</div>
              <div style={{ fontSize:'13px', color:'var(--t2)' }}>Your child's progress — updated each time they submit a daily report.</div>
            </div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'12px' }}>
            {[
              { v: dailyReports.length > 0 ? String(dailyReports.length) : 'None yet', l: 'Reports (last 30d)', c: 'var(--sage)' },
              { v: drStreak > 0 ? String(drStreak) : 'None yet', l: 'Day Streak', c: 'var(--amber)' },
              { v: drAvgFocus ? drAvgFocus + ' / 5' : 'No data', l: 'Avg Focus', c: 'var(--gold)' },
            ].map(s => (
              <div key={s.l} style={{ background:'rgba(234,244,236,0.05)', border:'1px solid var(--b)', borderRadius:'var(--r)', padding:'14px', textAlign:'center' }}>
                <div style={{ fontFamily:'var(--fs)', fontSize:'22px', fontWeight:700, color: s.c }}>{s.v}</div>
                <div style={{ fontSize:'10.5px', color:'var(--t3)', marginTop:'3px' }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        {dailyReports.length === 0 ? (
          <div style={{ background:'var(--bg2)', border:'1px solid var(--b)', borderRadius:'var(--rl)', padding:'36px 22px', textAlign:'center' }}>
            <div style={{ fontSize:'28px', marginBottom:'10px', opacity:.4 }}>📊</div>
            <div style={{ fontSize:'14px', color:'var(--t3)' }}>No reports submitted yet. Data will appear here once your child starts submitting daily reports.</div>
          </div>
        ) : (
          <div style={{ background:'var(--bg2)', border:'1px solid var(--b)', borderRadius:'var(--rl)', padding:'18px 20px', marginBottom:'18px' }}>
            <div style={{ fontSize:'12px', fontWeight:600, color:'var(--t3)', textTransform:'uppercase', letterSpacing:'.07em', marginBottom:'14px' }}>Last 7 Days</div>
            <div style={{ display:'flex', flexDirection:'column', gap:'0' }}>
              {[
                { label: 'Reports submitted', val: drSubmitted7 + ' / 7', c: drSubmitted7 >= 6 ? 'var(--sage)' : drSubmitted7 >= 4 ? 'var(--gold)' : 'var(--t1)' },
                { label: 'Avg study hours / day', val: drAvgHrs ? drAvgHrs + ' hrs' : 'Not logged', c: 'var(--t1)' },
                { label: 'Avg focus quality', val: drAvgFocus ? drAvgFocus + ' / 5' : 'Not logged', c: 'var(--gold)' },
                { label: 'Problems solved', val: drQsSolved7 > 0 ? drQsSolved7 + ' problems' : 'Not logged', c: 'var(--t1)' },
              ].map((row, i, arr) => (
                <div key={row.label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderBottom: i < arr.length - 1 ? '1px solid var(--b)' : 'none' }}>
                  <span style={{ fontSize:'13px', color:'var(--t2)' }}>{row.label}</span>
                  <span style={{ fontSize:'13px', fontWeight:700, color: row.c }}>{row.val}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {dailyReports.length > 0 && (
          <div style={{ background:'var(--bg2)', border:'1px solid var(--b)', borderRadius:'var(--rl)', padding:'18px 20px' }}>
            <div style={{ fontSize:'12px', fontWeight:600, color:'var(--t3)', textTransform:'uppercase', letterSpacing:'.07em', marginBottom:'14px' }}>Recent Reports</div>
            {dailyReports.slice(0, 7).map((r, i, arr) => {
              const moods = ['','😩','😐','🙂','💪','🔥'];
              const totalHrs = ((r.hrsPhysics || 0) + (r.hrsChemistry || 0) + (r.hrsThird || 0)).toFixed(1);
              const d = new Date(r.date + 'T00:00:00');
              const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
              const label = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d.getDay()] + ', ' + d.getDate() + ' ' + months[d.getMonth()];
              return (
                <div key={r.id} style={{ display:'flex', alignItems:'flex-start', gap:'12px', padding:'10px 0', borderBottom: i < arr.length - 1 ? '1px solid var(--b)' : 'none' }}>
                  <div style={{ fontSize:'18px', flexShrink:0, marginTop:'1px' }}>{moods[parseInt(r.mood)] || ''}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'3px' }}>
                      <span style={{ fontSize:'13px', fontWeight:600, color:'var(--t1)' }}>{label}</span>
                      <span style={{ fontSize:'11px', color:'var(--t3)' }}>Focus {r.focusQuality}/5{parseFloat(totalHrs) > 0 ? ' · ' + totalHrs + 'h' : ''}</span>
                    </div>
                    {r.wentWell && <div style={{ fontSize:'12.5px', color:'var(--t2)', lineHeight:1.5 }}>Went well: {r.wentWell}</div>}
                    {r.wentHard && <div style={{ fontSize:'12.5px', color:'rgba(234,244,236,.38)', lineHeight:1.5, marginTop:'2px' }}>Felt hard: {r.wentHard}</div>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ══════════ NOTIFICATIONS ══════════ */}
      <div className={pg('notif')}>
        <div className="card">
          <div className="sh">
            <div className="sh-t">Notifications</div>
            <span className="sh-a" onClick={() => onShowToast('All marked as read')}>Mark all read</span>
          </div>
          {[
            { dot: 'var(--gold)', title: 'Mentor Reply', body: '— Ajay replied to your Apr 14 daily report.', time: '7:48 AM today' },
            { dot: 'var(--gold)', title: 'Study Plan Updated', body: '— Ajay revised your plan for this week.', time: 'Yesterday' },
            { dot: 'var(--sage)', title: 'Call Reminder', body: '— Weekly mentor call this Friday at 6:00 PM. Block your calendar.', time: '2 days ago' },
            { dot: 'var(--t4)', title: 'Weekly Parent Report', body: '— Week 7 report sent to your parents. Sunday, Apr 13.', time: 'Sunday' },
          ].map((n, i, arr) => (
            <div key={i} style={{ display:'flex', gap:'12px', padding:'13px 0', borderBottom: i < arr.length - 1 ? '1px solid var(--b)' : 'none' }}>
              <div style={{ width:'7px', height:'7px', borderRadius:'50%', background: n.dot, flexShrink:0, marginTop:'5px' }} />
              <div>
                <div style={{ fontSize:'13px', color:'var(--t2)' }}><strong style={{ color:'var(--t1)' }}>{n.title}</strong> {n.body}</div>
                <div style={{ fontSize:'11px', color:'var(--t3)', marginTop:'2px' }}>{n.time}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default AnchorContent;
