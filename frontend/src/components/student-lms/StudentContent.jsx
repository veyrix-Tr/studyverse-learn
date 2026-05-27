import { useState } from 'react';

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

const getExamMax = (examTarget) => {
  if (!examTarget) return 360;
  const t = examTarget.toLowerCase();
  if (t.includes('neet')) return 720;
  return 360; // JEE Mains & Advanced
};

// Compute N evenly-spaced arc points along a quarter-sine curve (bottom-left → top-right)
const arcPoints = (nNodes, viewBoxW, viewBoxH) => {
  if (nNodes <= 1) return [{ x: 20, y: viewBoxH * 0.84 }];
  const xStart = 20, xEnd = viewBoxW - 20;
  const yMax = viewBoxH * 0.84, yMin = viewBoxH * 0.36;
  return Array.from({ length: nNodes }, (_, i) => ({
    x: xStart + (xEnd - xStart) * i / (nNodes - 1),
    y: yMax - (yMax - yMin) * Math.sin(i / (nNodes - 1) * Math.PI / 2),
  }));
};

// Convert point array to smooth SVG cubic-bezier path string
const ptsToPath = (pts) => {
  if (!pts || pts.length === 0) return '';
  if (pts.length === 1) return `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
  let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
  for (let i = 1; i < pts.length; i++) {
    const p = pts[i - 1], c = pts[i];
    const cx = ((p.x + c.x) / 2).toFixed(1);
    d += ` C ${cx} ${p.y.toFixed(1)} ${cx} ${c.y.toFixed(1)} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`;
  }
  return d;
};

// Build arc data: exactly N data nodes + 2 future nodes (N = weeks.length)
const buildArc = (weeks, examTarget, viewBoxW, viewBoxH, containerH) => {
  const max = getExamMax(examTarget);
  const toM = (pct) => Math.round(pct * max / 100);
  const target = toM(90);
  const nData = weeks ? weeks.length : 0;
  const toPb = (pt) => `${Math.round(containerH * (1 - pt.y / viewBoxH))}px`;

  if (nData === 0) {
    const allPts = arcPoints(4, viewBoxW, viewBoxH);
    return {
      nodes: allPts.map((pt, i) => ({
        type: 'future', pb: toPb(pt),
        label: i === 0 ? 'Baseline<br><span style="font-size:10px;">—</span>'
             : i === 2 ? `Near Goal<br><span style="font-size:10px;">—</span>`
             : i === 3 ? `Target<br><span style="font-size:10px;">${target}</span>`
             : '—',
      })),
      solidPath: `M ${arcPoints(4, viewBoxW, viewBoxH)[0].x.toFixed(1)} ${arcPoints(4, viewBoxW, viewBoxH)[0].y.toFixed(1)}`,
      dashedPath: ptsToPath(arcPoints(4, viewBoxW, viewBoxH)),
      fillPath: null,
    };
  }

  const nTotal = nData + 2;
  const allPts = arcPoints(nTotal, viewBoxW, viewBoxH);
  const last = weeks[nData - 1];
  const currentM = toM(last.avgPct);
  const near = Math.min(currentM + Math.round((target - currentM) * 0.5), target);

  const nodes = allPts.map((pt, i) => {
    const pb = toPb(pt);
    if (i < nData) {
      const w = weeks[i];
      const m = toM(w.avgPct);
      if (nData === 1) return { type: 'current', pb, label: `This Week<br><strong style="font-size:10px;">${m} marks</strong>` };
      if (i === 0) return { type: 'done', pb, label: `Baseline<br><strong style="color:var(--gold);font-size:10px;">${m} marks</strong>` };
      if (i === nData - 1) return { type: 'current', pb, label: `This Week<br><strong style="font-size:10px;">${m} marks</strong>` };
      return { type: 'done', pb, label: `Wk ${w.weekNumber}<br><strong style="color:var(--gold);font-size:10px;">${m} marks</strong>` };
    }
    if (i === nTotal - 2) return { type: 'future', pb, label: `Near Goal<br><span style="font-size:10px;">~${near}</span>` };
    if (i === nTotal - 1) return { type: 'future', pb, label: `Target<br><span style="font-size:10px;">${target}</span>` };
    return { type: 'future', pb, label: '—' };
  });

  const solidPts = allPts.slice(0, nData);
  const dashedPts = allPts.slice(nData - 1);
  const solidPath = ptsToPath(solidPts);
  const dashedPath = ptsToPath(dashedPts);
  const last0 = solidPts[solidPts.length - 1];
  const fillPath = nData > 1
    ? solidPath + ` L ${last0.x.toFixed(1)} ${viewBoxH} L ${solidPts[0].x.toFixed(1)} ${viewBoxH} Z`
    : null;

  return { nodes, solidPath, dashedPath, fillPath };
};

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

const getExamDate = (examTarget, targetYear) => {
  if (!targetYear) return null;
  const t = (examTarget || '').toLowerCase();
  if (t.includes('mains') || t.includes('main')) return new Date(`${targetYear}-01-25`);
  if (t.includes('advanced'))                     return new Date(`${targetYear}-05-17`);
  if (t.includes('neet'))                         return new Date(`${targetYear}-05-03`);
  return new Date(`${targetYear}-05-15`); // fallback
};

const getDaysRemaining = (examTarget, targetYear) => {
  const examDate = getExamDate(examTarget, targetYear);
  if (!examDate) return null;
  const diff = Math.ceil((examDate - new Date()) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : null;
};

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const fmtTime = (iso) => new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
const fmtDate = (iso) => new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
const isUpcoming = (iso) => new Date(iso) > new Date();

const StudentContent = ({ activePage, onOpenModal, onNav, onShowToast, profile, scores, sessions = [], doubts = [] }) => {
  const firstName = profile?.name?.split(' ')[0] || 'there';
  const examTarget = profile?.studentProfile?.examTarget || 'your exam';
  const targetYear = profile?.studentProfile?.targetYear;
  const daysRemaining = getDaysRemaining(examTarget, targetYear);

  const weeks = scores || [];
  const max = getExamMax(examTarget);
  const toM = (pct) => Math.round(pct * max / 100);
  const targetMarks = toM(90);
  const first = weeks[0] || null;
  const last = weeks[weeks.length - 1] || null;
  const baselineMarks = first ? toM(first.avgPct) : null;
  const currentMarks = last ? toM(last.avgPct) : null;
  const improvement = baselineMarks !== null && currentMarks !== null ? currentMarks - baselineMarks : null;
  const toGo = currentMarks !== null ? targetMarks - currentMarks : null;

  const dashArc    = buildArc(weeks, examTarget, 800, 110, 120);
  const journeyArc = buildArc(weeks, examTarget, 800, 130, 140);

  // Per-subject stats: first vs latest score across all weeks
  const subjectStats = (() => {
    if (weeks.length === 0) return [];
    const map = {};
    for (const w of weeks) {
      for (const s of w.subjects) {
        if (!map[s.subject]) map[s.subject] = { first: s, last: s };
        map[s.subject].last = s;
      }
    }
    return Object.entries(map).map(([name, { first, last }]) => {
      const firstPct = Math.round(first.score / first.totalMarks * 100);
      const lastPct  = Math.round(last.score  / last.totalMarks  * 100);
      return { name, firstPct, lastPct, delta: lastPct - firstPct };
    });
  })();

  const topImprover    = subjectStats.length > 0 ? subjectStats.reduce((a, b) => a.delta  > b.delta  ? a : b) : null;
  const weakestSubject = subjectStats.length > 0 ? subjectStats.reduce((a, b) => a.lastPct < b.lastPct ? a : b) : null;

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
            <div style={{ fontSize: '12px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 500, marginBottom: '6px' }}>{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: '26px', fontWeight: 700, color: 'var(--text)' }}>{getGreeting()}, {firstName}.</div>
            <div style={{ fontSize: '14px', color: 'var(--text2)', marginTop: '4px' }}>You have <strong style={{ color: 'var(--text)' }}>{sessions.filter(s => s.dayOfWeek === DAYS[new Date().getDay()]).length} session{sessions.filter(s => s.dayOfWeek === DAYS[new Date().getDay()]).length !== 1 ? 's' : ''}</strong> today. {examTarget} is in <strong style={{ color: 'var(--gold)' }}>{daysRemaining ?? '—'} days</strong>.</div>
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
              <div className="journey-exam-name">{examTarget}</div>
              <div className="journey-exam-days">{daysRemaining ?? '—'}</div>
              <div className="journey-exam-label">days remaining</div>
            </div>
          </div>

          <ArcTrack
            height={120}
            viewBox="0 0 800 110"
            solidPath={dashArc.solidPath}
            dashedPath={dashArc.dashedPath}
            nodes={dashArc.nodes}
          />

          <ScoreDeltas items={[
            { label: 'Started At', val: baselineMarks ?? '—', valClass: 'white', change: first ? `Week ${first.weekNumber}` : 'No tests yet', neutral: true },
            { label: "This Week's Score", val: currentMarks ?? '—', valClass: 'gold', change: improvement !== null ? `+${improvement} marks improvement` : 'No data yet' },
            { label: 'Target Score', val: targetMarks, valClass: 'white', change: toGo !== null ? `${toGo} marks to go` : '—', changeStyle: { color: 'var(--gold)' } },
          ]} />
        </div>

        <div className="g2 mb">
          <div className="card">
            <div className="sh">
              <div className="sh-title">Today's Sessions</div>
              <span className="sh-action" onClick={() => onNav('sessions')}>All sessions →</span>
            </div>
            {(() => {
              const today = DAYS[new Date().getDay()];
              const todaySessions = sessions.filter(s => s.dayOfWeek === today);
              if (todaySessions.length === 0) return (
                <div style={{ fontSize: '13px', color: 'var(--text3)', padding: '12px 0' }}>No sessions scheduled for today.</div>
              );
              return todaySessions.map(s => (
                <div key={s.id} className="sess-item">
                  <div className="sess-subj" style={{ background: 'rgba(15,31,61,0.06)', fontSize: '18px' }}>📚</div>
                  <div className="sess-info">
                    <div className="sess-name">{s.title}</div>
                    <div className="sess-meta">with {s.facultyName} • {s.subject}</div>
                  </div>
                  <div className={`sess-status ${isUpcoming(s.scheduledAt) ? 's-up' : 's-live'}`}>
                    {isUpcoming(s.scheduledAt) ? fmtTime(s.scheduledAt) : '● Live'}
                  </div>
                </div>
              ));
            })()}
          </div>

          <div className="card card-gold-accent">
            <div className="sh">
              <div className="sh-title">Mentor's Note</div>
              <span className="pill pill-gold">This Week</span>
            </div>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: '14px', fontStyle: 'italic', color: 'var(--text2)', lineHeight: 1.8, marginBottom: '16px' }}>
              {`"${firstName}, your Maths accuracy has jumped 11% since we rebuilt integration from scratch. Focus this week is Organic Chemistry reaction mechanisms — that's the gap holding your Chemistry below 75%."`}
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
          {topImprover ? (
            <div className="insight">
              <div className="insight-icon">📈</div>
              <div>
                <div className="insight-title">{topImprover.name} Up {topImprover.delta}%</div>
                <div className="insight-body">Score moved from {topImprover.firstPct}% to {topImprover.lastPct}% since Week 1 — your strongest growth subject.</div>
              </div>
            </div>
          ) : (
            <div className="insight"><div className="insight-icon">📊</div><div><div className="insight-title">No Tests Yet</div><div className="insight-body">Complete your first weekly test to see your insights here.</div></div></div>
          )}
          {weakestSubject ? (
            <div className="insight" style={{ background: 'var(--red-dim)', borderColor: 'rgba(239,68,68,0.2)' }}>
              <div className="insight-icon">⚠️</div>
              <div>
                <div className="insight-title">{weakestSubject.name} at {weakestSubject.lastPct}%</div>
                <div className="insight-body">Your weakest subject this week. Prioritise this to close the gap before {examTarget}.</div>
              </div>
            </div>
          ) : null}
          <div className="insight" style={{ background: 'var(--green-dim)', borderColor: 'rgba(34,197,94,0.2)' }}>
            <div className="insight-icon">🔥</div>
            <div>
              <div className="insight-title">{weeks.length} Week{weeks.length !== 1 ? 's' : ''} Documented</div>
              <div className="insight-body">{weeks.length > 0 ? `${weeks.length} week${weeks.length !== 1 ? 's' : ''} of tests recorded. Each week builds a clearer picture of your progress.` : 'Your first test result will appear here automatically.'}</div>
            </div>
          </div>
        </div>

        <div className="card mb">
          <div className="sh"><div className="sh-title">Subject Progress — vs. Your Baseline</div></div>
          {subjectStats.length > 0 ? subjectStats.map(s => (
            <div className="subj-row" key={s.name}>
              <div className="subj-name">{s.name}</div>
              <div className="subj-bar"><div className="pbar"><div className="pbar-inner pbar-gold" style={{ width: `${s.lastPct}%` }}></div></div></div>
              <div className="subj-score">{s.lastPct}%</div>
              <div className="subj-delta" style={{ color: s.delta >= 0 ? 'var(--green)' : 'var(--red)' }}>{s.delta >= 0 ? '+' : ''}{s.delta}%</div>
            </div>
          )) : (
            <div style={{ color: 'var(--text3)', fontSize: '13px', padding: '12px 0' }}>No test data yet. Your subject breakdown will appear here after your first weekly test.</div>
          )}
          {first && (
            <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '12px', textAlign: 'right' }}>
              Deltas from Week 1 baseline &bull; {new Date(first.testDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </div>
          )}
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
              <div className="journey-exam-name">{examTarget}</div>
              <div className="journey-exam-days">{daysRemaining ?? '—'}</div>
              <div className="journey-exam-label">days remaining</div>
            </div>
          </div>

          <ArcTrack
            height={140}
            viewBox="0 0 800 130"
            solidPath={journeyArc.solidPath}
            dashedPath={journeyArc.dashedPath}
            fillPath={journeyArc.fillPath}
            nodes={journeyArc.nodes}
          />

          <ScoreDeltas items={[
            { label: 'Started At (Week 1)', val: baselineMarks ?? '—', valClass: 'white', change: first ? new Date(first.testDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'No data', neutral: true },
            { label: 'Current Score', val: currentMarks ?? '—', valClass: 'gold', change: improvement !== null ? `+${improvement} marks in ${weeks.length} week${weeks.length !== 1 ? 's' : ''}` : 'No tests yet' },
            { label: 'Target', val: targetMarks, valClass: 'white', change: toGo !== null ? `${toGo} marks to go` : '—', changeStyle: { color: 'var(--gold)' } },
          ]} />
        </div>

        <div className="sh mb" style={{ marginBottom: '16px' }}>
          <div className="sh-title">Weekly Performance Reports</div>
          <span className="pill pill-navy">{weeks.length} week{weeks.length !== 1 ? 's' : ''} documented</span>
        </div>

        {weeks.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text3)', fontSize: '13px', padding: '32px 0' }}>
            No test results yet. Complete your first weekly test to see your journey here.
          </div>
        ) : (
          [...weeks].reverse().map((w, i, arr) => {
            const prevW = arr[i + 1];
            const wMarks = toM(w.avgPct);
            const prevMarks = prevW ? toM(prevW.avgPct) : null;
            const delta = prevMarks !== null ? wMarks - prevMarks : null;
            const isFirst = i === arr.length - 1;
            const dateStr = new Date(w.testDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
            return (
              <WeeklyReport
                key={w.weekNumber}
                week={`Week ${w.weekNumber} — ${dateStr}`}
                meta={w.subjects.map(s => s.subject).join(' + ')}
                score={wMarks}
                change={isFirst ? 'Start' : delta >= 0 ? `+${delta}` : `${delta}`}
                changeClass={isFirst ? 'start' : delta >= 0 ? 'up' : 'down'}
                isOpen={openWR.has(i)}
                onToggle={() => toggleWR(i)}
              >
                {w.subjects.map(s => {
                  const pct = Math.round(s.score / s.totalMarks * 100);
                  return (
                    <div key={s.subject} className="subj-row" style={{ padding: '8px 0' }}>
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
            {['Upcoming', 'Past'].map((t, i) => (
              <div key={t} className={`tab${sessionsTab === i ? ' on' : ''}`} onClick={() => setSessionsTab(i)}>{t}</div>
            ))}
          </div>
        </div>
        <div className="card mb">
          {(() => {
            const filtered = sessions.filter(s => sessionsTab === 0 ? isUpcoming(s.scheduledAt) : !isUpcoming(s.scheduledAt));
            if (filtered.length === 0) return (
              <div style={{ fontSize: '13px', color: 'var(--text3)', padding: '16px 0', textAlign: 'center' }}>
                {sessionsTab === 0 ? 'No upcoming sessions.' : 'No past sessions yet.'}
              </div>
            );
            return (
              <table className="tbl">
                <thead>
                  <tr><th>Session Topic</th><th>Subject</th><th>Day &amp; Time</th><th>Duration</th><th>Status</th><th></th></tr>
                </thead>
                <tbody>
                  {filtered.map(s => (
                    <tr key={s.id}>
                      <td>{s.title}</td>
                      <td><span className="pill pill-navy">{s.subject}</span></td>
                      <td>{s.dayOfWeek}, {fmtTime(s.scheduledAt)}</td>
                      <td>{s.duration} min</td>
                      <td><span className={`sess-status ${isUpcoming(s.scheduledAt) ? 's-up' : ''}`}>{isUpcoming(s.scheduledAt) ? 'Upcoming' : 'Completed'}</span></td>
                      <td><button className="btn btn-ghost btn-sm" onClick={() => onShowToast('Opening session details...')}>Details</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            );
          })()}
        </div>
      </div>

      {/* ══════════ TESTS ══════════ */}
      <div className={p('tests')}>
        <div className="g4 mb">
          <div className="stat"><div className="stat-accent accent-gold"></div><div className="stat-lbl">Tests Taken</div><div className="stat-val">18</div><div className="stat-note up">vs 0 at start</div></div>
          <div className="stat"><div className="stat-accent accent-green"></div><div className="stat-lbl">Latest Score</div><div className="stat-val">{currentMarks ?? '—'}</div><div className="stat-note up">{improvement !== null ? `+${improvement} from baseline` : 'No data yet'}</div></div>
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
            {['Open', 'Resolved', 'All'].map((t, i) => (
              <div key={t} className={`tab${doubtTab === i ? ' on' : ''}`} onClick={() => setDoubtTab(i)}>{t}</div>
            ))}
          </div>
          <button className="btn btn-primary" onClick={() => onOpenModal('doubt-modal')}>+ Ask a Doubt</button>
        </div>
        {(() => {
          const filtered = doubts.filter(d =>
            doubtTab === 0 ? !d.answeredAt :
            doubtTab === 1 ?  d.answeredAt : true
          );
          if (filtered.length === 0) return (
            <div style={{ fontSize: '13px', color: 'var(--text3)', padding: '24px 0', textAlign: 'center' }}>
              {doubtTab === 0 ? 'No open doubts.' : doubtTab === 1 ? 'No resolved doubts yet.' : 'No doubts raised yet.'}
            </div>
          );
          return filtered.map(d => (
            <div key={d.id} className="doubt-item" style={d.answeredAt ? { borderColor: 'rgba(34,197,94,0.25)' } : {}}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span className="pill pill-navy">{d.subject || 'General'}</span>
                {d.answeredAt
                  ? <span style={{ fontSize: '11px', color: 'var(--green)' }}>✓ Answered by {d.facultyName}</span>
                  : <span style={{ fontSize: '11px', color: 'var(--text3)' }}>{fmtDate(d.createdAt || new Date())}</span>
                }
              </div>
              <div className="doubt-q">{d.question}</div>
              {d.answeredAt && d.answer && (
                <div style={{ marginTop: '8px', fontSize: '12.5px', color: 'var(--text2)', background: 'var(--cream2)', padding: '10px 12px', borderRadius: 'var(--r)', lineHeight: 1.7 }}>{d.answer}</div>
              )}
              <div className="doubt-footer">
                <span>{d.answeredAt ? `Replied ${fmtDate(d.answeredAt)}` : `Awaiting ${d.facultyName}'s response`}</span>
              </div>
            </div>
          ));
        })()}
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
              <div><div style={{ fontSize: '11px', color: 'var(--text3)', marginBottom: '4px' }}>Last Week</div><div style={{ fontFamily: 'var(--font-serif)', fontSize: '32px', fontWeight: 700, color: 'var(--text)' }}>{weeks.length >= 2 ? toM(weeks[weeks.length - 2].avgPct) : '—'}</div></div>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              <div><div style={{ fontSize: '11px', color: 'var(--text3)', marginBottom: '4px' }}>This Week</div><div style={{ fontFamily: 'var(--font-serif)', fontSize: '32px', fontWeight: 700, color: 'var(--gold)' }}>{currentMarks ?? '—'}</div></div>
              <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                <div style={{ fontSize: '11px', color: 'var(--text3)' }}>Improvement</div>
                <div style={{ fontFamily: 'var(--font-serif)', fontSize: '24px', fontWeight: 700, color: 'var(--green)' }}>{weeks.length >= 2 ? `+${toM(weeks[weeks.length - 1].avgPct) - toM(weeks[weeks.length - 2].avgPct)}` : '—'}</div>
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
              {`"${firstName} has had a genuinely strong week. His Mathematics accuracy is now consistently above 80% — a transformation from where he started. The one area requiring your awareness: Organic Chemistry is still below target. We have scheduled two extra sessions this week to address this specifically. No concern needed — this is expected at this stage and is being actively managed. The trajectory is on track for the June milestone."`}
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
