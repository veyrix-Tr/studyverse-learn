import React, { useState } from 'react';

const ArcTrack = ({ height = 120, viewBox = '0 0 800 110', solidPath, dashedPath, fillPath, nodes }) => (
  <div className="arc-track" style={{ height, position: 'relative', margin: '0 0 24px' }}>
    <svg className="arc-svg" viewBox={viewBox} preserveAspectRatio="none" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
      <path d={solidPath} stroke="#E8A830" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.8"/>
      <path d={dashedPath} stroke="rgba(253,248,240,0.2)" strokeWidth="2" fill="none" strokeLinecap="round" strokeDasharray="6 4"/>
      {fillPath && <path d={fillPath} fill="rgba(232,168,48,0.06)"/>}
    </svg>
    <div className="arc-milestones" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', padding: '0 8px' }}>
      {nodes.map((n, i) => (
        <div key={i} className={`arc-node ${n.type}`} style={{ paddingBottom: n.pb }}>
          <div className={`arc-dot ${n.type}`}></div>
          <div className="arc-node-label" dangerouslySetInnerHTML={{ __html: n.label }}></div>
        </div>
      ))}
    </div>
  </div>
);

const ScoreDeltas = ({ items }) => (
  <div className="score-deltas">
    {items.map((d, i) => (
      <div key={i} className="delta-box">
        <div className="delta-label">{d.label}</div>
        <div className={`delta-val ${d.valClass}`}>{d.val}</div>
        <div className={`delta-change${d.neutral ? ' neutral' : ''}`} style={d.changeStyle}>{d.change}</div>
      </div>
    ))}
  </div>
);

const WeeklyReport = ({ week, meta, score, change, changeClass, isOpen, onToggle, children }) => (
  <div className="weekly-report">
    <div className="wr-header" onClick={onToggle}>
      <div>
        <div className="wr-week">{week}</div>
        <div className="wr-meta">{meta}</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div>
          <div style={{ fontSize: '10px', color: 'var(--text3)', textAlign: 'right', marginBottom: '2px' }}>{changeClass === 'start' ? 'Baseline' : 'Score'}</div>
          <div className="wr-score">{score}</div>
        </div>
        <span className={`wr-change${changeClass === 'up' ? ' wr-up' : changeClass === 'down' ? ' wr-down' : ''}`}
          style={changeClass === 'start' ? { background: 'rgba(15,31,61,0.06)', color: 'var(--text3)' } : {}}>{change}</span>
        {onToggle && (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth="2"
            style={{ transform: isOpen ? 'rotate(180deg)' : '', transition: 'transform 0.2s' }}>
            <path d="M6 9l6 6 6-6"/>
          </svg>
        )}
      </div>
    </div>
    {onToggle && <div className={`wr-body${isOpen ? ' open' : ''}`}>{children}</div>}
  </div>
);

const dashboardArcNodes = [
  { type: 'done', pb: '18px', label: 'Day 1 Diagnostic<br><strong style="color:var(--gold);font-size:10px;">420 marks</strong>' },
  { type: 'done', pb: '54px', label: 'Week 4<br><strong style="color:var(--gold);font-size:10px;">458 marks</strong>' },
  { type: 'done', pb: '68px', label: 'Week 8<br><strong style="color:var(--gold);font-size:10px;">487 marks</strong>' },
  { type: 'current', pb: '60px', label: 'Today<br><strong style="font-size:10px;">512 marks</strong>' },
  { type: 'future', pb: '74px', label: 'Week 20<br><span style="font-size:10px;">~540 marks</span>' },
  { type: 'future', pb: '63px', label: 'Final Target<br><span style="font-size:10px;">600 marks</span>' },
];

const journeyArcNodes = [
  { type: 'done', pb: '20px', label: 'Day 1 Diagnostic<br><strong style="color:var(--gold);font-size:10px;">420 marks</strong>' },
  { type: 'done', pb: '62px', label: 'Wk 4 Test<br><strong style="color:var(--gold);font-size:10px;">458</strong>' },
  { type: 'done', pb: '80px', label: 'Wk 8 Test<br><strong style="color:var(--gold);font-size:10px;">487</strong>' },
  { type: 'current', pb: '72px', label: 'Today<br><strong style="font-size:10px;">512</strong>' },
  { type: 'future', pb: '86px', label: 'Wk 20 Goal<br><span style="font-size:10px;">~540</span>' },
  { type: 'future', pb: '70px', label: 'Target<br><span style="font-size:10px;">600</span>' },
];

const StudentContent = ({ activePage, onOpenModal, onNav, onShowToast }) => {
  const [coursesTab, setCoursesTab] = useState(0);
  const [videoTab, setVideoTab] = useState(0);
  const [sessionsTab, setSessionsTab] = useState(0);
  const [resourcesTab, setResourcesTab] = useState(0);
  const [doubtTab, setDoubtTab] = useState(0);
  const [openWR, setOpenWR] = useState(new Set([0]));

  const toggleWR = (i) => {
    setOpenWR(prev => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  };

  const p = (name) => `page${activePage === name ? ' active' : ''}`;

  return (
    <div className="content">

      {/* ══════════ DASHBOARD ══════════ */}
      <div className={p('dashboard')}>
        <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 500, marginBottom: '6px' }}>Wednesday, 15 April 2026</div>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: '26px', fontWeight: 700, color: 'var(--text)' }}>Good morning, Aryan.</div>
            <div style={{ fontSize: '14px', color: 'var(--text2)', marginTop: '4px' }}>You have <strong style={{ color: 'var(--text)' }}>2 sessions</strong> today. JEE Advanced is in <strong style={{ color: 'var(--gold)' }}>187 days</strong>.</div>
          </div>
          <button className="btn btn-primary" style={{ flexShrink: 0, width: 'fit-content' }} onClick={() => onNav('journey')}>View My Journey →</button>
        </div>

        <div className="journey-container mb">
          <div className="journey-header">
            <div>
              <div className="journey-title">Your Score Journey</div>
              <div className="journey-sub">From Day 1 diagnostic to today — every step is yours alone</div>
            </div>
            <div className="journey-exam">
              <div className="journey-exam-name">JEE Advanced</div>
              <div className="journey-exam-days">187</div>
              <div className="journey-exam-label">days remaining</div>
            </div>
          </div>

          <ArcTrack
            height={120}
            viewBox="0 0 800 110"
            solidPath="M 20 90 Q 100 20 180 60 Q 260 90 340 45 Q 420 10 500 50"
            dashedPath="M 500 50 Q 580 20 660 35 Q 720 45 780 15"
            nodes={dashboardArcNodes}
          />

          <ScoreDeltas items={[
            { label: 'Started At', val: '420', valClass: 'white', change: 'Day 1 diagnostic', neutral: true },
            { label: "Today's Score", val: '512', valClass: 'gold', change: '+92 marks improvement' },
            { label: 'Target Score', val: '600', valClass: 'white', change: '88 marks to go', changeStyle: { color: 'var(--gold)' } },
          ]} />
        </div>

        <div className="g2 mb">
          <div className="card">
            <div className="sh">
              <div className="sh-title">Today's Sessions</div>
              <span className="sh-action" onClick={() => onNav('sessions')}>All sessions →</span>
            </div>
            <div className="sess-item">
              <div className="sess-subj" style={{ background: 'rgba(232,168,48,0.1)' }}>⚛️</div>
              <div className="sess-info">
                <div className="sess-name">Atomic Structure — Quantum Numbers</div>
                <div className="sess-meta">with Ajay Sharma • Chemistry</div>
              </div>
              <div className="sess-status s-live">● Live</div>
            </div>
            <div className="sess-item">
              <div className="sess-subj" style={{ background: 'rgba(15,31,61,0.06)' }}>📐</div>
              <div className="sess-info">
                <div className="sess-name">Integration — By Parts &amp; Substitution</div>
                <div className="sess-meta">with Ajay Sharma • Mathematics</div>
              </div>
              <div className="sess-status s-up">4:00 PM</div>
            </div>
          </div>

          <div className="card card-gold-accent">
            <div className="sh">
              <div className="sh-title">Mentor's Note</div>
              <span className="pill pill-gold">This Week</span>
            </div>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: '14px', fontStyle: 'italic', color: 'var(--text2)', lineHeight: 1.8, marginBottom: '16px' }}>
              "Aryan, your Maths accuracy has jumped 11% since we rebuilt integration from scratch. Focus this week is Organic Chemistry reaction mechanisms — that's the gap holding your Chemistry below 75%."
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', border: '2px solid var(--gold)', background: 'var(--gold-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-serif)', fontSize: '13px', fontWeight: 700, color: 'var(--gold)' }}>A</div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>Ajay Sharma</div>
                <div style={{ fontSize: '11px', color: 'var(--text3)' }}>JEE &amp; NEET Senior Mentor</div>
              </div>
            </div>
          </div>
        </div>

        <div className="sh"><div className="sh-title">This Week's Insights</div></div>
        <div className="g3 mb">
          <div className="insight">
            <div className="insight-icon">📈</div>
            <div>
              <div className="insight-title">Maths Accuracy Up 11%</div>
              <div className="insight-body">Your integration chapter score moved from 52% to 63% — exactly where we targeted last session.</div>
            </div>
          </div>
          <div className="insight" style={{ background: 'var(--red-dim)', borderColor: 'rgba(239,68,68,0.2)' }}>
            <div className="insight-icon">⚠️</div>
            <div>
              <div className="insight-title">Chemistry Still at 68%</div>
              <div className="insight-body">Organic mechanisms need attention. Mentor has flagged this for today's session focus.</div>
            </div>
          </div>
          <div className="insight" style={{ background: 'var(--green-dim)', borderColor: 'rgba(34,197,94,0.2)' }}>
            <div className="insight-icon">🔥</div>
            <div>
              <div className="insight-title">14-Day Study Streak</div>
              <div className="insight-body">You've shown up every single day for 2 weeks. That discipline compounds.</div>
            </div>
          </div>
        </div>

        <div className="card mb">
          <div className="sh"><div className="sh-title">Subject Progress — vs. Your Baseline</div></div>
          <div className="subj-row">
            <div className="subj-name">Chemistry</div>
            <div className="subj-bar"><div className="pbar"><div className="pbar-inner pbar-gold" style={{ width: '68%' }}></div></div></div>
            <div className="subj-score">68%</div>
            <div className="subj-delta" style={{ color: 'var(--green)' }}>+14%</div>
          </div>
          <div className="subj-row">
            <div className="subj-name">Mathematics</div>
            <div className="subj-bar"><div className="pbar"><div className="pbar-inner pbar-green" style={{ width: '82%' }}></div></div></div>
            <div className="subj-score">82%</div>
            <div className="subj-delta" style={{ color: 'var(--green)' }}>+22%</div>
          </div>
          <div className="subj-row">
            <div className="subj-name">Physics</div>
            <div className="subj-bar"><div className="pbar"><div className="pbar-inner" style={{ width: '61%', background: 'var(--navy3)' }}></div></div></div>
            <div className="subj-score">61%</div>
            <div className="subj-delta" style={{ color: 'var(--green)' }}>+9%</div>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '12px', textAlign: 'right' }}>Deltas calculated from Day 1 diagnostic baseline • Apr 15, 2026</div>
        </div>
      </div>

      {/* ══════════ JOURNEY ══════════ */}
      <div className={p('journey')}>
        <div className="journey-container mb-lg">
          <div className="journey-header">
            <div>
              <div className="journey-title">Your Score Journey</div>
              <div className="journey-sub">No comparisons. Just you vs. who you were on Day 1.</div>
            </div>
            <div className="journey-exam">
              <div className="journey-exam-name">JEE Advanced 2026</div>
              <div className="journey-exam-days">187</div>
              <div className="journey-exam-label">days remaining</div>
            </div>
          </div>

          <ArcTrack
            height={140}
            viewBox="0 0 800 130"
            solidPath="M 20 110 Q 100 30 180 70 Q 260 110 340 55 Q 420 15 500 60"
            dashedPath="M 500 60 Q 580 30 660 45 Q 720 55 780 15"
            fillPath="M 20 110 Q 100 30 180 70 Q 260 110 340 55 Q 420 15 500 60 L 500 130 L 20 130 Z"
            nodes={journeyArcNodes}
          />

          <ScoreDeltas items={[
            { label: 'Started At (Day 1)', val: '420', valClass: 'white', change: 'Jan 28, 2026', neutral: true },
            { label: 'Current Score', val: '512', valClass: 'gold', change: '+92 marks in 78 days' },
            { label: 'Target', val: '600', valClass: 'white', change: '88 marks to go', changeStyle: { color: 'var(--gold)' } },
          ]} />
        </div>

        <div className="sh mb" style={{ marginBottom: '16px' }}>
          <div className="sh-title">Weekly Performance Reports</div>
          <span className="pill pill-navy">11 weeks documented</span>
        </div>

        <WeeklyReport week="Week 11 — Apr 7–13" meta="Focus: Organic Chemistry + Integration" score="512" change="+25" changeClass="up" isOpen={openWR.has(0)} onToggle={() => toggleWR(0)}>
          <div style={{ fontSize: '13px', fontStyle: 'italic', color: 'var(--text2)', borderLeft: '3px solid var(--gold)', paddingLeft: '14px', marginBottom: '16px', lineHeight: 1.7 }}>
            "Strong week. Integration accuracy hit 68% — best ever. Chemistry organic still needs two more focused sessions before it clicks. Keep the Physics momentum going."<br/>
            <span style={{ fontSize: '11px', color: 'var(--text3)' }}>— Ajay Sharma</span>
          </div>
          <div className="subj-row" style={{ padding: '8px 0' }}>
            <div className="subj-name">Chemistry</div>
            <div className="subj-bar"><div className="pbar"><div className="pbar-inner pbar-gold" style={{ width: '68%' }}></div></div></div>
            <div className="subj-score">68%</div><div className="subj-delta" style={{ color: 'var(--green)' }}>+6%</div>
          </div>
          <div className="subj-row" style={{ padding: '8px 0' }}>
            <div className="subj-name">Mathematics</div>
            <div className="subj-bar"><div className="pbar"><div className="pbar-inner pbar-green" style={{ width: '82%' }}></div></div></div>
            <div className="subj-score">82%</div><div className="subj-delta" style={{ color: 'var(--green)' }}>+11%</div>
          </div>
          <div className="subj-row" style={{ padding: '8px 0' }}>
            <div className="subj-name">Physics</div>
            <div className="subj-bar"><div className="pbar"><div className="pbar-inner pbar-navy" style={{ width: '61%' }}></div></div></div>
            <div className="subj-score">61%</div><div className="subj-delta" style={{ color: 'var(--green)' }}>+4%</div>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '12px' }}>Sessions: 6 completed • Hours: 14.5 hrs • Doubts resolved: 8</div>
        </WeeklyReport>

        <WeeklyReport week="Week 10 — Mar 31 – Apr 6" meta="Focus: Electrostatics + Calculus" score="487" change="+18" changeClass="up" isOpen={openWR.has(1)} onToggle={() => toggleWR(1)}>
          <div style={{ fontSize: '13px', fontStyle: 'italic', color: 'var(--text2)', borderLeft: '3px solid var(--gold)', paddingLeft: '14px', marginBottom: '16px', lineHeight: 1.7 }}>
            "Good progress on electrostatics. Calculus fundamentals are now solid — moving to applications next week."<br/>
            <span style={{ fontSize: '11px', color: 'var(--text3)' }}>— Ajay Sharma</span>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text3)' }}>Sessions: 5 completed • Hours: 12 hrs</div>
        </WeeklyReport>

        <WeeklyReport week="Week 8 — Mar 17–23" meta="Focus: Atomic Structure + Limits" score="469" change="+11" changeClass="up" isOpen={openWR.has(2)} onToggle={() => toggleWR(2)}>
        </WeeklyReport>

        <WeeklyReport week="Week 4 — Feb 18–24" meta="First full mock after baseline" score="458" change="+38" changeClass="up" isOpen={openWR.has(3)} onToggle={() => toggleWR(3)}>
        </WeeklyReport>

        <WeeklyReport week="Day 1 Diagnostic — Jan 28" meta="Baseline established" score="420" change="Start" changeClass="start">
        </WeeklyReport>
      </div>

      {/* ══════════ COURSES ══════════ */}
      <div className={p('courses')}>
        <div className="tabs">
          {['In Progress', 'Completed', 'All Subjects'].map((t, i) => (
            <div key={t} className={`tab${coursesTab === i ? ' on' : ''}`} onClick={() => setCoursesTab(i)}>{t}</div>
          ))}
        </div>

        <div className="g3 mb">
          {[
            { emoji: '⚛️', name: 'Physical Chemistry', pill: 'JEE', meta: '36 of 48 lectures • Baseline: 54% → Now: 68%', pct: 74, pbarClass: 'pbar-gold', goVideo: true },
            { emoji: '📐', name: 'Calculus & Algebra', pill: 'JEE', meta: '51 of 62 lectures • Baseline: 60% → Now: 82%', pct: 82, pbarClass: 'pbar-green' },
            { emoji: '⚡', name: 'Mechanics & Electrostatics', pill: 'JEE', meta: '34 of 55 lectures • Baseline: 52% → Now: 61%', pct: 61, pctText: '62', pbarStyle: { background: 'var(--navy3)' } },
          ].map((c, i) => (
            <div key={i} className="card"
              style={{ cursor: 'pointer', transition: 'all 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--gold)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
              onClick={c.goVideo ? () => onNav('video') : undefined}>
              <div style={{ background: 'var(--navy)', borderRadius: '10px', height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '36px', marginBottom: '16px' }}>{c.emoji}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                <div style={{ fontFamily: 'var(--font-serif)', fontSize: '15px', fontWeight: 600 }}>{c.name}</div>
                <span className="pill pill-gold">{c.pill}</span>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text3)', marginBottom: '14px' }}>{c.meta}</div>
              <div className="pbar"><div className={`pbar-inner${c.pbarClass ? ' ' + c.pbarClass : ''}`} style={{ width: `${c.pct}%`, ...(c.pbarStyle || {}) }}></div></div>
              <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '5px', marginBottom: '14px' }}>{c.pctText || c.pct}% complete</div>
              <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={c.goVideo ? (e) => { e.stopPropagation(); onNav('video'); } : undefined}>▶ Continue</button>
            </div>
          ))}
        </div>
      </div>

      {/* ══════════ VIDEO ══════════ */}
      <div className={p('video')}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <button className="btn btn-ghost btn-sm" onClick={() => onNav('courses')}>← Back</button>
          <div style={{ fontSize: '12px', color: 'var(--text3)' }}>Physical Chemistry / Atomic Structure</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '22px' }}>
          <div>
            <div className="vplayer" onClick={() => onShowToast('Playing lecture...')}>
              <div className="vthumb">
                <div className="play-circle">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="var(--navy)"><polygon points="5,3 19,12 5,21"/></svg>
                </div>
                <div className="vthumb-label">Lecture 24 — Quantum Numbers &amp; Orbitals</div>
              </div>
            </div>
            <div className="card">
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: '17px', fontWeight: 700, marginBottom: '4px' }}>Lecture 24: Quantum Numbers &amp; Orbitals</div>
              <div style={{ fontSize: '12px', color: 'var(--text3)', marginBottom: '16px' }}>47 min • Physical Chemistry • Mentor: Ajay Sharma</div>
              <div className="tabs">
                {['Overview', 'Notes', 'Resources'].map((t, i) => (
                  <div key={t} className={`tab${videoTab === i ? ' on' : ''}`} onClick={() => setVideoTab(i)}>{t}</div>
                ))}
              </div>
              <div style={{ fontSize: '13.5px', color: 'var(--text2)', lineHeight: 1.85 }}>In this lecture, we cover the four quantum numbers — principal (n), azimuthal (l), magnetic (m<sub>l</sub>), and spin (m<sub>s</sub>) — and how they uniquely describe the state of every electron. We also explore orbital shapes and their significance for JEE problems.</div>
            </div>
          </div>
          <div className="card" style={{ height: 'fit-content' }}>
            <div className="sh-title" style={{ marginBottom: '14px' }}>Course Content</div>
            <div className="ch-item done-ch"><span className="ch-num">✓</span><span className="ch-title">Bohr Model</span><span className="ch-dur">38m</span></div>
            <div className="ch-item done-ch"><span className="ch-num">✓</span><span className="ch-title">De Broglie &amp; Wave Nature</span><span className="ch-dur">44m</span></div>
            <div className="ch-item done-ch"><span className="ch-num">✓</span><span className="ch-title">Heisenberg's Principle</span><span className="ch-dur">52m</span></div>
            <div className="ch-item active-ch"><span className="ch-num">24</span><span className="ch-title">Quantum Numbers</span><span className="ch-dur">47m</span></div>
            <div className="ch-item"><span className="ch-num">25</span><span className="ch-title">Electronic Configuration</span><span className="ch-dur">41m</span></div>
            <div className="ch-item"><span className="ch-num">26</span><span className="ch-title">Periodic Trends</span><span className="ch-dur">35m</span></div>
            <div className="ch-item"><span className="ch-num">27</span><span className="ch-title">Ionic Radius &amp; Patterns</span><span className="ch-dur">29m</span></div>
          </div>
        </div>
      </div>

      {/* ══════════ SESSIONS ══════════ */}
      <div className={p('sessions')}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px' }}>
          <div className="tabs" style={{ marginBottom: 0 }}>
            {['Upcoming', 'Past', 'Recordings'].map((t, i) => (
              <div key={t} className={`tab${sessionsTab === i ? ' on' : ''}`} onClick={() => setSessionsTab(i)}>{t}</div>
            ))}
          </div>
          <button className="btn btn-primary" onClick={() => onOpenModal('book-modal')}>+ Book Session</button>
        </div>
        <div className="card mb">
          <table className="tbl">
            <thead>
              <tr><th>Session Topic</th><th>Subject</th><th>Date &amp; Time</th><th>Duration</th><th>Status</th><th></th></tr>
            </thead>
            <tbody>
              <tr><td>Atomic Structure — Quantum Numbers</td><td><span className="pill pill-gold">Chemistry</span></td><td>Today, 2:00 PM</td><td>60 min</td><td><span className="sess-status s-live">● Live Now</span></td><td><button className="btn btn-primary btn-sm" onClick={() => onShowToast('Joining...')}>Join</button></td></tr>
              <tr><td>Integration — By Parts</td><td><span className="pill pill-navy">Maths</span></td><td>Today, 4:00 PM</td><td>75 min</td><td><span className="sess-status s-up">Upcoming</span></td><td><button className="btn btn-ghost btn-sm">Details</button></td></tr>
              <tr><td>Electrostatics — Gauss's Law</td><td><span className="pill pill-navy">Physics</span></td><td>Apr 17, 7:00 PM</td><td>60 min</td><td><span className="sess-status s-up">Upcoming</span></td><td><button className="btn btn-ghost btn-sm">Details</button></td></tr>
              <tr><td>Organic Chemistry — Mechanisms</td><td><span className="pill pill-gold">Chemistry</span></td><td>Apr 19, 3:00 PM</td><td>90 min</td><td><span className="sess-status s-up">Upcoming</span></td><td><button className="btn btn-ghost btn-sm">Details</button></td></tr>
              <tr><td>Binomial Theorem &amp; Series</td><td><span className="pill pill-navy">Maths</span></td><td>Apr 21, 5:00 PM</td><td>60 min</td><td><span className="sess-status s-up">Upcoming</span></td><td><button className="btn btn-ghost btn-sm">Details</button></td></tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ══════════ TESTS ══════════ */}
      <div className={p('tests')}>
        <div className="g4 mb">
          <div className="stat"><div className="stat-accent accent-gold"></div><div className="stat-lbl">Tests Taken</div><div className="stat-val">18</div><div className="stat-note up">vs 0 at start</div></div>
          <div className="stat"><div className="stat-accent accent-green"></div><div className="stat-lbl">Latest Score</div><div className="stat-val">512</div><div className="stat-note up">+92 from baseline</div></div>
          <div className="stat"><div className="stat-accent accent-gold"></div><div className="stat-lbl">Best Accuracy</div><div className="stat-val">83%</div><div className="stat-note up">Maths this week</div></div>
          <div className="stat"><div className="stat-accent accent-navy"></div><div className="stat-lbl">Weak Areas</div><div className="stat-val">7</div><div className="stat-note warn">flagged by mentor</div></div>
        </div>
        <div className="g2 mb">
          <div className="test-card">
            <div className="test-pills"><span className="pill pill-gold">JEE Advanced</span><span className="pill pill-navy">Full Mock</span></div>
            <div className="test-name">JEE Advanced Simulation #12</div>
            <div className="test-meta"><span>⏱ 180 min</span><span>📝 90 questions</span><span>🎯 +4 / −1</span></div>
            <div className="div" style={{ margin: '10px 0' }}></div>
            <div className="test-cta" onClick={() => onShowToast('Launching test environment...')}>Start Test →</div>
          </div>
          <div className="test-card">
            <div className="test-pills"><span className="pill pill-navy">Chemistry</span><span className="pill pill-gold">Weak Area</span></div>
            <div className="test-name">Organic Chemistry Mechanisms — Targeted Test</div>
            <div className="test-meta"><span>⏱ 45 min</span><span>📝 25 questions</span><span>🎯 +4 / −1</span></div>
            <div style={{ fontSize: '12px', color: 'var(--gold)', background: 'var(--gold-dim)', padding: '8px 10px', borderRadius: '6px', marginBottom: '14px', border: '1px solid var(--border-gold)' }}>Mentor-assigned: address your weakest chapter</div>
            <div className="test-cta" onClick={() => onShowToast('Launching test environment...')}>Start Test →</div>
          </div>
          <div className="test-card">
            <div className="test-pills"><span className="pill pill-navy">JEE 2023</span><span className="pill pill-navy">Previous Year</span></div>
            <div className="test-name">JEE Advanced 2023 — Paper 1 (Full)</div>
            <div className="test-meta"><span>⏱ 180 min</span><span>📝 90 questions</span><span>🎯 +4 / −1</span></div>
            <div className="div" style={{ margin: '10px 0' }}></div>
            <div className="test-cta" onClick={() => onShowToast('Launching test environment...')}>Start Test →</div>
          </div>
          <div className="test-card">
            <div className="test-pills"><span className="pill pill-navy">Maths</span><span className="pill pill-green" style={{ background: 'var(--green-dim)', color: 'var(--green)' }}>High Accuracy</span></div>
            <div className="test-name">Calculus — Integration Chapter Test</div>
            <div className="test-meta"><span>⏱ 60 min</span><span>📝 30 questions</span><span>🎯 +4 / −1</span></div>
            <div className="div" style={{ margin: '10px 0' }}></div>
            <div className="test-cta" onClick={() => onShowToast('Launching test environment...')}>Start Test →</div>
          </div>
        </div>
      </div>

      {/* ══════════ MY MENTOR ══════════ */}
      <div className={p('mentor')}>
        <div className="g2 mb">
          <div className="card-dark" style={{ borderRadius: 'var(--r-lg)', padding: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', border: '3px solid var(--gold)', background: 'rgba(232,168,48,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-serif)', fontSize: '24px', fontWeight: 700, color: 'var(--gold)', flexShrink: 0 }}>A</div>
              <div>
                <div style={{ fontFamily: 'var(--font-serif)', fontSize: '20px', fontWeight: 700, color: 'var(--text-inv)' }}>Ajay Sharma</div>
                <div style={{ fontSize: '13px', color: 'var(--gold)', fontWeight: 500, marginTop: '2px' }}>JEE &amp; NEET Senior Mentor</div>
                <div style={{ fontSize: '12px', color: 'var(--text-inv3)', marginTop: '2px' }}>Your dedicated 1-to-1 mentor since Jan 2026</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
              <span className="cred">JEE Mains &amp; Advanced</span>
              <span className="cred">NEET UG</span>
              <span className="cred">10+ Yrs Teaching</span>
              <span className="cred">500+ Students Mentored</span>
              <span className="cred">Physics &amp; Chemistry</span>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => onOpenModal('book-modal')}>Book Session</button>
              <button className="btn" style={{ background: 'rgba(255,255,255,0.08)', color: 'var(--text-inv2)', flex: 1, justifyContent: 'center' }} onClick={() => onShowToast('Opening chat...')}>Send Message</button>
            </div>
          </div>
          <div>
            <div className="card mb">
              <div className="sh-title" style={{ marginBottom: '14px' }}>Your Progress Together</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {[
                  { val: '47', color: 'var(--text)', label: 'Sessions Completed' },
                  { val: '+92', color: 'var(--gold)', label: 'Marks Improved' },
                  { val: '78', color: 'var(--text)', label: 'Days Together' },
                  { val: '14', color: 'var(--green)', label: 'Streak Days' },
                ].map((s, i) => (
                  <div key={i} style={{ textAlign: 'center', padding: '14px', background: 'var(--cream2)', borderRadius: 'var(--r)' }}>
                    <div style={{ fontFamily: 'var(--font-serif)', fontSize: '24px', fontWeight: 700, color: s.color }}>{s.val}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '2px' }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="card">
              <div className="sh-title" style={{ marginBottom: '12px' }}>This Week's Focus</div>
              <div className="insight"><div className="insight-icon">🎯</div><div><div className="insight-title">Priority: Organic Chemistry</div><div className="insight-body">Reaction mechanisms are your current gap. 2 targeted sessions this week.</div></div></div>
              <div className="insight" style={{ background: 'var(--green-dim)', borderColor: 'rgba(34,197,94,0.2)' }}><div className="insight-icon">✅</div><div><div className="insight-title">Integration is Unlocked</div><div className="insight-body">Accuracy stable at 68%+. Mentor moving you to applications now.</div></div></div>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════ RESOURCES ══════════ */}
      <div className={p('resources')}>
        <div className="tabs">
          {['Study Material', 'Previous Years', 'Formula Sheets', 'Session Notes'].map((t, i) => (
            <div key={t} className={`tab${resourcesTab === i ? ' on' : ''}`} onClick={() => setResourcesTab(i)}>{t}</div>
          ))}
        </div>
        {[
          { icon: '📕', name: 'NCERT Chemistry Class XI', meta: 'PDF • 18.4 MB • Uploaded by Vinay' },
          { icon: '📗', name: 'NCERT Mathematics Class XII', meta: 'PDF • 22.1 MB' },
          { icon: '📘', name: 'H.C. Verma — Concepts of Physics Vol. 1', meta: 'PDF • 31.6 MB' },
          { icon: '📄', name: 'Session Notes — Quantum Numbers (Apr 15)', meta: "PDF • 1.2 MB • From today's session" },
          { icon: '📑', name: "Chemistry Formula Sheet — Vinay's", meta: 'PDF • 0.9 MB • Mentor-curated' },
          { icon: '📄', name: 'JEE Advanced 2023 — Paper + Solutions', meta: 'PDF • 4.2 MB' },
        ].map((r, i) => (
          <div key={i} className="res-item" onClick={() => onShowToast('Downloading...')}>
            <div className="res-icon">{r.icon}</div>
            <div>
              <div className="res-name">{r.name}</div>
              <div className="res-meta">{r.meta}</div>
            </div>
            <button className="btn btn-ghost btn-sm" style={{ marginLeft: 'auto' }}>↓ Download</button>
          </div>
        ))}
      </div>

      {/* ══════════ DOUBT DESK ══════════ */}
      <div className={p('doubt')}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px' }}>
          <div className="tabs" style={{ marginBottom: 0 }}>
            {['Open Doubts', 'Resolved', 'All'].map((t, i) => (
              <div key={t} className={`tab${doubtTab === i ? ' on' : ''}`} onClick={() => setDoubtTab(i)}>{t}</div>
            ))}
          </div>
          <button className="btn btn-primary" onClick={() => onOpenModal('doubt-modal')}>+ Ask a Doubt</button>
        </div>
        <div className="doubt-item">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span className="pill pill-gold">Chemistry</span>
            <span style={{ fontSize: '11px', color: 'var(--text3)' }}>2 hours ago</span>
          </div>
          <div className="doubt-q">How to determine the shape of complex molecules using VSEPR theory?</div>
          <div className="doubt-footer"><span>Awaiting Vinay's response</span><span>3 views</span></div>
        </div>
        <div className="doubt-item" style={{ borderColor: 'rgba(34,197,94,0.25)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span className="pill pill-navy">Maths</span>
            <span style={{ fontSize: '11px', color: 'var(--green)' }}>✓ Answered by Vinay</span>
          </div>
          <div className="doubt-q">Explain the difference between definite and improper integrals with examples from JEE problems</div>
          <div className="doubt-footer"><span>Replied 1 hour ago</span><span>Read</span></div>
        </div>
        <div className="doubt-item">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span className="pill pill-navy">Physics</span>
            <span style={{ fontSize: '11px', color: 'var(--text3)' }}>Yesterday</span>
          </div>
          <div className="doubt-q">Why does current lead voltage in a capacitor but lag in an inductor?</div>
          <div className="doubt-footer"><span>Awaiting response</span><span>1 view</span></div>
        </div>
      </div>

      {/* ══════════ PARENT VIEW ══════════ */}
      <div className={p('parent')}>
        <div style={{ background: 'var(--navy)', borderRadius: 'var(--r-xl)', padding: '28px', marginBottom: '22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: '20px', fontWeight: 700, color: 'var(--text-inv)', marginBottom: '4px' }}>Parent Dashboard</div>
            <div style={{ fontSize: '13px', color: 'var(--text-inv2)' }}>Weekly report sent every Sunday • Next report: Apr 20</div>
          </div>
          <button className="btn btn-primary" style={{ flexShrink: 0, width: 'fit-content' }} onClick={() => onShowToast('Report downloaded!')}>↓ Download Full Report</button>
        </div>

        <div className="g2 mb">
          <div className="card">
            <div className="sh-title" style={{ marginBottom: '16px' }}>Score This Week vs. Last Week</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
              <div><div style={{ fontSize: '11px', color: 'var(--text3)', marginBottom: '4px' }}>Last Week</div><div style={{ fontFamily: 'var(--font-serif)', fontSize: '32px', fontWeight: 700, color: 'var(--text)' }}>487</div></div>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              <div><div style={{ fontSize: '11px', color: 'var(--text3)', marginBottom: '4px' }}>This Week</div><div style={{ fontFamily: 'var(--font-serif)', fontSize: '32px', fontWeight: 700, color: 'var(--gold)' }}>512</div></div>
              <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                <div style={{ fontSize: '11px', color: 'var(--text3)' }}>Improvement</div>
                <div style={{ fontFamily: 'var(--font-serif)', fontSize: '24px', fontWeight: 700, color: 'var(--green)' }}>+25</div>
                <div style={{ fontSize: '11px', color: 'var(--green)' }}>marks this week</div>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="sh-title" style={{ marginBottom: '16px' }}>Attendance &amp; Engagement</div>
            <div style={{ display: 'flex', gap: '18px' }}>
              {[
                { val: '6/6', color: 'var(--green)', label: 'Sessions attended' },
                { val: '14.5h', color: 'var(--gold)', label: 'Study this week' },
                { val: '🔥14', color: 'var(--text)', label: 'Day streak' },
              ].map((s, i) => (
                <div key={i} style={{ flex: 1, textAlign: 'center', padding: '14px', background: 'var(--cream2)', borderRadius: 'var(--r)' }}>
                  <div style={{ fontFamily: 'var(--font-serif)', fontSize: '24px', fontWeight: 700, color: s.color }}>{s.val}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text3)' }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card mb">
          <div className="sh-title" style={{ marginBottom: '14px' }}>Mentor's Note to Parents — Week 11</div>
          <div style={{ background: 'var(--cream2)', borderRadius: 'var(--r)', padding: '18px', borderLeft: '4px solid var(--gold)' }}>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: '14px', fontStyle: 'italic', color: 'var(--text2)', lineHeight: 1.85, marginBottom: '12px' }}>
              "Aryan has had a genuinely strong week. His Mathematics accuracy is now consistently above 80% — a transformation from where he started. The one area requiring your awareness: Organic Chemistry is still below target. We have scheduled two extra sessions this week to address this specifically. No concern needed — this is expected at this stage and is being actively managed. The trajectory is on track for the June milestone."
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', border: '2px solid var(--gold)', background: 'var(--gold-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-serif)', fontSize: '13px', fontWeight: 700, color: 'var(--gold)' }}>A</div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>Ajay Sharma</div>
                <div style={{ fontSize: '11px', color: 'var(--text3)' }}>IIT-JEE &amp; NEET Specialist • Apr 13, 2026</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════ NOTIFICATIONS ══════════ */}
      <div className={p('notif')}>
        <div className="card">
          <div className="sh">
            <div className="sh-title">Notifications</div>
            <span className="sh-action" onClick={() => onShowToast('All marked as read')}>Mark all read</span>
          </div>
          <div className="notif-row"><div className="notif-dot" style={{ background: 'var(--green)' }}></div><div><div className="notif-text"><strong>Session Live</strong> — "Atomic Structure" with Vinay is live right now</div><div className="notif-time">Just now</div></div></div>
          <div className="notif-row"><div className="notif-dot" style={{ background: 'var(--gold)' }}></div><div><div className="notif-text"><strong>New Assigned Test</strong> — Organic Chemistry Targeted Test assigned by your mentor</div><div className="notif-time">2 hours ago</div></div></div>
          <div className="notif-row"><div className="notif-dot" style={{ background: 'var(--gold)' }}></div><div><div className="notif-text"><strong>Doubt Answered</strong> — Vinay replied to your integration doubt</div><div className="notif-time">3 hours ago</div></div></div>
          <div className="notif-row"><div className="notif-dot" style={{ background: 'var(--text3)' }}></div><div><div className="notif-text"><strong>Weekly Report Ready</strong> — Week 11 parent report has been sent to your parent's email</div><div className="notif-time">Sunday, Apr 13</div></div></div>
          <div className="notif-row"><div className="notif-dot" style={{ background: 'var(--text3)' }}></div><div><div className="notif-text"><strong>Score Update</strong> — Your Journey arc updated: 512 marks (+25 this week)</div><div className="notif-time">Sunday, Apr 13</div></div></div>
        </div>
      </div>

    </div>
  );
};

export default StudentContent;
