import { useState } from 'react';
import { useParams } from 'react-router-dom';

const HABIT_ITEMS = [
  { key: 'sleep',    icon: '🌙', name: 'Slept before midnight',              desc: 'Your brain consolidates during sleep.' },
  { key: 'study',    icon: '📖', name: 'Studied for at least 4 hours',       desc: 'Focused. Not just open books.' },
  { key: 'revision', icon: '🔁', name: "Revised yesterday's topics",         desc: '24h revision = 80% better retention.' },
  { key: 'phone',    icon: '📵', name: 'No social media during study hours', desc: 'Phone breaks destroy flow state.' },
  { key: 'problems', icon: '❓', name: 'Solved at least 10 problems',        desc: 'Competitive exams reward consistent problem-solving.' },
];

const HABIT_KEYS = ['sleep', 'study', 'revision', 'phone', 'problems'];
const HABIT_LABELS = { sleep: 'Sleep', study: 'Study 4h', revision: 'Revision', phone: 'No phone', problems: '10 probs' };

const MONTH_DAYS = [
  { d: 1, s: 'logged' },  { d: 2, s: 'logged' },  { d: 3, s: 'logged' },  { d: 4, s: 'logged' },
  { d: 5, s: 'logged' },  { d: 6, s: 'logged' },  { d: 7, s: 'logged' },  { d: 8, s: 'logged' },
  { d: 9, s: 'logged' },  { d: 10, s: 'logged' }, { d: 11, s: 'logged' }, { d: 12, s: 'logged' },
  { d: 13, s: 'logged' }, { d: 14, s: 'logged' }, { d: 15, s: 'today' },
  { d: 16, s: 'future' }, { d: 17, s: 'future' }, { d: 18, s: 'future' }, { d: 19, s: 'future' },
  { d: 20, s: 'future' }, { d: 21, s: 'future' }, { d: 22, s: 'future' }, { d: 23, s: 'future' },
  { d: 24, s: 'future' }, { d: 25, s: 'future' }, { d: 26, s: 'future' }, { d: 27, s: 'future' },
  { d: 28, s: 'future' }, { d: 29, s: 'future' }, { d: 30, s: 'future' },
];

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

const AnchorContent = ({ activePage, onNav, onShowToast, habitLogs = [], onHabitSaved, resources = [] }) => {
  const { id: userId } = useParams();
  const pg = (name) => `page${activePage === name ? ' on' : ''}`;

  const [resTab, setResTab] = useState(0);

  // Expandable sections
  const [openSections, setOpenSections] = useState(new Set(['plan-this', 'call-week6', 'report-apr14', 'subj-physics']));
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
            <div style={{ fontFamily:'var(--fs)', fontSize:'24px', fontWeight:700, color:'var(--t1)' }}>Good morning, Student.</div>
            <div style={{ fontSize:'13.5px', color:'var(--t2)', marginTop:'4px' }}>Your mentor read yesterday's report. Today's report is <strong style={{ color:'var(--gold)' }}>due before 10 PM.</strong></div>
          </div>
        </div>

        <div className="g4 mb">
          <div className="stat sa-amber">
            <div className="stat-l">Day Streak</div>
            <div className="stat-v">{streak > 0 ? `🔥 ${streak}` : '—'}</div>
            <div className="stat-n up">{streak > 0 ? 'days straight' : 'start today'}</div>
          </div>
          <div className="stat sa-green">
            <div className="stat-l">Reports Submitted</div>
            <div className="stat-v">47</div>
            <div className="stat-n up">of 48 days</div>
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
              <span style={{ fontSize:'12px', color:'var(--t3)' }}>April 2026</span>
            </div>
            <div className="streak-ring">
              <div className="ring-outer">
                <div className="ring-fill" style={{ background: 'conic-gradient(var(--sage) 0% 70%, var(--bg4) 70%)' }} />
                <div className="ring-val">14</div>
              </div>
              <div className="ring-emoji">🔥 Day streak · 70% of month</div>
            </div>
            <div className="sh" style={{ marginBottom:'8px' }}>
              <div style={{ fontSize:'12px', color:'var(--t3)', fontWeight:500 }}>This month — daily reports</div>
            </div>
            <div className="week-grid">
              {MONTH_DAYS.map(({ d, s }) => (
                <div key={d} className={`wg-day ${s}`}>{s !== 'future' ? d : ''}</div>
              ))}
            </div>
            <div style={{ display:'flex', gap:'12px', marginTop:'12px' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'5px', fontSize:'10.5px', color:'var(--t3)' }}><div className="wg-day logged" style={{ width:'14px', height:'14px', borderRadius:'3px', fontSize:0 }} />Submitted</div>
              <div style={{ display:'flex', alignItems:'center', gap:'5px', fontSize:'10.5px', color:'var(--t3)' }}><div className="wg-day today" style={{ width:'14px', height:'14px', borderRadius:'3px', fontSize:0 }} />Today</div>
              <div style={{ display:'flex', alignItems:'center', gap:'5px', fontSize:'10.5px', color:'var(--t3)' }}><div className="wg-day" style={{ width:'14px', height:'14px', borderRadius:'3px', fontSize:0, opacity:.5 }} />Future</div>
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
              <div className="mc-stat"><div className="mc-stat-v">48</div><div className="mc-stat-l">Days Together</div></div>
              <div className="mc-stat"><div className="mc-stat-v">47</div><div className="mc-stat-l">Reports Read</div></div>
              <div className="mc-stat"><div className="mc-stat-v">6</div><div className="mc-stat-l">Calls Done</div></div>
            </div>
          </div>
        </div>

        {/* Today's report CTA */}
        <div style={{ background:'linear-gradient(135deg,var(--bg3),var(--bg4))', border:'1px solid var(--gb)', borderRadius:'var(--rl)', padding:'20px 24px', display:'flex', alignItems:'center', gap:'20px', marginBottom:'22px' }}>
          <div style={{ fontSize:'36px', flexShrink:0 }}>📝</div>
          <div style={{ flex:1 }}>
            <div style={{ fontFamily:'var(--fs)', fontSize:'16px', fontWeight:700, color:'var(--t1)', marginBottom:'4px' }}>Today's report — not submitted yet</div>
            <div style={{ fontSize:'13px', color:'var(--t2)' }}>2 minutes. Ajay reads this before the next session. Be honest with yourself.</div>
          </div>
          <button className="btn btn-gold" onClick={() => onNav('report')}>Submit Now →</button>
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
          <button className="btn btn-ghost btn-sm" onClick={() => onNav('plan')}>View Plan →</button>
        </div>
      </div>

      {/* ══════════ DAILY REPORT ══════════ */}
      <div className={pg('report')}>
        <div className="report-intro">
          <div style={{ fontSize:'36px', flexShrink:0 }}>📝</div>
          <div className="ri-text">
            <div className="ri-title">Daily Report</div>
            <div className="ri-sub">2 minutes. Be honest with yourself. Ajay reads this every morning before reaching out.</div>
            <div className="ri-chips">
              <span className="ri-chip">Submitted daily</span>
              <span className="ri-chip">Mentor reads before 8 AM</span>
              <span className="ri-chip">Builds your streak</span>
            </div>
          </div>
        </div>
        <div style={{ background:'var(--bg2)', border:'2px dashed rgba(74,222,128,0.25)', borderRadius:'var(--rl)', padding:'48px 32px', textAlign:'center' }}>
          <div style={{ fontSize:'36px', marginBottom:'16px' }}>📋</div>
          <div style={{ fontFamily:'var(--fs)', fontSize:'17px', fontWeight:700, color:'var(--t1)', marginBottom:'8px' }}>Daily Report Form</div>
          <div style={{ fontSize:'13px', color:'var(--t3)', maxWidth:'440px', margin:'0 auto 20px', lineHeight:1.7 }}>
            Share how your day went — topics covered, hours studied, what went well, what was hard, and any message for your mentor.
          </div>
          <button className="btn btn-green" onClick={() => onShowToast('Daily report form coming soon')}>Coming Soon</button>
        </div>
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
                  <div className="habit-icon">{h.icon}</div>
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

      {/* ══════════ STUDY PLAN ══════════ */}
      <div className={pg('plan')}>
        <div style={{ background:'var(--bg3)', border:'1px solid var(--b)', borderRadius:'var(--rl)', padding:'14px 18px', marginBottom:'20px', display:'flex', alignItems:'flex-start', gap:'12px' }}>
          <div style={{ fontSize:'20px', flexShrink:0 }}>🗓️</div>
          <div>
            <div style={{ fontSize:'13.5px', fontWeight:600, color:'var(--t1)', marginBottom:'2px' }}>Updated by Ajay · Apr 14</div>
            <div style={{ fontSize:'12.5px', color:'var(--t2)' }}>This plan is reviewed and revised every week based on your daily reports and weekly call. It is not a generic syllabus — it is built around where you actually are right now.</div>
          </div>
        </div>

        {[
          {
            key: 'plan-this', title: 'This Week — Apr 15 to 21', sub: 'Focus: Physics morning routine + Integration',
            items: [
              { color: 'var(--red)', text: 'Start Physics before noon — every single day this week', note: 'Mentor note: "Your focus quality data shows the morning window is your peak. Stop wasting it."' },
              { color: 'var(--amber)', text: 'Integration — 45 min daily. Substitution method first, then by parts', note: "Based on your coaching schedule gap — you haven't covered this yet" },
              { color: 'var(--sage)', text: 'Minimum 10 problems solved per day — no exceptions', note: 'Non-negotiable. From this week\'s call agreement.' },
              { color: 'var(--sage)', text: '30 min revision every evening — yesterday\'s topics only', note: 'Builds long-term retention without extra time investment' },
            ]
          },
          {
            key: 'plan-last', title: 'Last Week — Apr 8 to 14', sub: 'Restructured study schedule',
            items: [
              { color: 'var(--sage)', text: 'Move high-focus work to morning slots', note: '' },
              { color: 'var(--sage)', text: 'Reduce Physics target to 2h — but guarantee problem-solving', note: '' },
              { color: 'var(--sage)', text: 'One full mock every 2 weeks — treat as data, not a test', note: '' },
            ]
          }
        ].map(week => (
          <div key={week.key} className="plan-week">
            <div className="pw-header" onClick={() => toggleSection(week.key)}>
              <div><div className="pw-title">{week.title}</div><div className="pw-sub">{week.sub}</div></div>
              <svg className="tms-arrow" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: openSections.has(week.key) ? 'rotate(180deg)' : '' }}><path d="M6 9l6 6 6-6"/></svg>
            </div>
            {openSections.has(week.key) && (
              <div className="pw-body">
                {week.items.map((item, i) => (
                  <div key={i} className="plan-item">
                    <div className="plan-dot" style={{ background: item.color }} />
                    <div><div className="plan-text">{item.text}</div>{item.note && <div className="plan-note">{item.note}</div>}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ══════════ REPORT HISTORY ══════════ */}
      <div className={pg('history')}>
        <div style={{ fontSize:'13px', color:'var(--t2)', marginBottom:'18px' }}>47 reports submitted since Day 1. Ajay reads every one.</div>

        {[
          {
            key: 'report-apr14', date: 'Tuesday, Apr 14', summary: '4.5h · Focus: 4/5 · Showed up ✓', mood: '💪',
            fields: [
              { label: 'Topics Done', val: 'Integration by parts, Kinematics revision, Organic mechanisms (naming)' },
              { label: 'Problems', val: '18 questions solved' },
              { label: 'Went Well', val: 'ILATE rule finally clicked. Got 6/8 integration questions right.' },
              { label: 'Felt Hard', val: 'Choosing u in non-standard integration forms — still uncertain.' },
              { label: 'For Mentor', val: 'Should I do the mock this weekend or wait until after Electrostatics?' },
            ],
            reply: { text: 'Wait until after Electrostatics. Your Physics gap would pull the mock score down artificially and that\'s not useful data right now. Mock in 2 weeks — once we\'ve done the Gauss\'s Law session.', by: 'Ajay Sharma · Apr 15, 7:48 AM' }
          },
          {
            key: 'report-apr13', date: 'Monday, Apr 13', summary: '3h · Focus: 3/5 · Showed up ✓', mood: '😐',
            fields: [
              { label: 'Topics Done', val: 'Mole concept revision, some Organic reading' },
              { label: 'Went Hard', val: 'Feeling distracted. Instagram kept pulling me in.' },
            ],
            reply: { text: 'Honest report. That\'s what matters. Put phone in another room tomorrow morning. Not negotiable.', by: 'Ajay Sharma · Apr 14, 8:02 AM' }
          },
          {
            key: 'report-apr12', date: 'Sunday, Apr 12', summary: 'Rest day · Showed up ✓', mood: '🙂',
            fields: [{ label: 'Note', val: 'Rest day but did 30 min revision. Feeling recharged.' }],
            reply: { text: 'Good. Rest is part of the plan. See you on the call.', by: 'Ajay Sharma · Apr 13, 8:15 AM' }
          }
        ].map(report => (
          <div key={report.key} className="report-item">
            <div className="ri-header" onClick={() => toggleSection(report.key)}>
              <div><div className="ri-date">{report.date}</div><div className="ri-summary">{report.summary}</div></div>
              <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                <div className="ri-mood">{report.mood}</div>
                <svg className="tms-arrow" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: openSections.has(report.key) ? 'rotate(180deg)' : '' }}><path d="M6 9l6 6 6-6"/></svg>
              </div>
            </div>
            {openSections.has(report.key) && (
              <div className="ri-body open">
                {report.fields.map((f, i) => (
                  <div key={i} className="ri-field">
                    <div className="ri-field-label">{f.label}</div>
                    <div className="ri-field-val">{f.val}</div>
                  </div>
                ))}
                <div className="ri-mentor-reply">
                  <div className="ri-reply-text">{report.reply.text}</div>
                  <div className="ri-reply-by">{report.reply.by}</div>
                </div>
              </div>
            )}
          </div>
        ))}
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
              <div style={{ fontSize:'13px', color:'var(--t2)' }}>Weekly update from your child's mentor. Every Sunday morning.</div>
            </div>
            <button className="btn btn-gold btn-sm" onClick={() => onShowToast('Report downloaded!')}>↓ Download</button>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'12px' }}>
            {[{ v:'47/48', l:'Daily Reports', c:'var(--sage)' }, { v: streak > 0 ? `🔥 ${streak}` : '—', l:'Day Streak', c:'var(--amber)' }, { v:'6', l:'Calls Done', c:'var(--gold)' }].map(s => (
              <div key={s.l} style={{ background:'rgba(234,244,236,0.05)', border:'1px solid var(--b)', borderRadius:'var(--r)', padding:'14px', textAlign:'center' }}>
                <div style={{ fontFamily:'var(--fs)', fontSize:'22px', fontWeight:700, color: s.c }}>{s.v}</div>
                <div style={{ fontSize:'10.5px', color:'var(--t3)', marginTop:'3px' }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background:'var(--bg2)', border:'1px solid var(--b)', borderRadius:'var(--rl)', padding:'20px 22px', marginBottom:'18px' }}>
          <div style={{ fontSize:'11px', color:'var(--t3)', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:'12px', fontWeight:600 }}>Mentor's Note to Parents — Week 7</div>
          <div style={{ fontSize:'14px', fontStyle:'italic', color:'var(--t2)', lineHeight:1.9, borderLeft:'3px solid var(--gold)', paddingLeft:'14px', marginBottom:'12px', fontFamily:'var(--fs)' }}>
            "Your child has submitted 47 of 48 daily reports — an exceptional level of commitment. What I'm noticing in the data: focus quality is higher on days when study begins before noon. We discussed this on Friday's call and agreed to a morning-first approach this week. Mindset is strong. The one area to watch: exam anxiety on mock tests. We are working on this — treating mocks as data rather than judgement. Overall, I am genuinely impressed by the consistency shown so far."
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
            <div className="mc-av" style={{ width:'32px', height:'32px', fontSize:'13px' }}>A</div>
            <div><div style={{ fontSize:'13px', fontWeight:600, color:'var(--t1)' }}>Ajay Sharma</div><div style={{ fontSize:'11px', color:'var(--t3)' }}>Mentor, Studyverse · Apr 13, 2026</div></div>
          </div>
        </div>

        <div style={{ background:'var(--bg2)', border:'1px solid var(--b)', borderRadius:'var(--rl)', padding:'18px 20px' }}>
          <div style={{ fontSize:'12px', fontWeight:600, color:'var(--t3)', textTransform:'uppercase', letterSpacing:'.07em', marginBottom:'14px' }}>This Week's Data</div>
          <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
            {[
              { label: 'Reports submitted', val: '7 / 7', c: 'var(--sage)' },
              { label: 'Avg study hours/day', val: '4.2 hrs', c: 'var(--t1)' },
              { label: 'Avg focus quality', val: '3.8 / 5', c: 'var(--gold)' },
              { label: 'Problems solved', val: '94 problems', c: 'var(--t1)' },
            ].map((row, i, arr) => (
              <div key={row.label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'9px 0', borderBottom: i < arr.length - 1 ? '1px solid var(--b)' : 'none' }}>
                <span style={{ fontSize:'13px', color:'var(--t2)' }}>{row.label}</span>
                <span style={{ fontSize:'13px', fontWeight:700, color: row.c }}>{row.val}</span>
              </div>
            ))}
          </div>
        </div>
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
