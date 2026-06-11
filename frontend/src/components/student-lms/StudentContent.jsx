import { useState, useEffect, Fragment } from 'react';
import { useParams } from 'react-router-dom';

const SUBJ_COLOR = {
  Physics:     '#4F8EF7',
  Chemistry:   '#22C55E',
  Mathematics: '#A855F7',
  Maths:       '#A855F7',
  Biology:     '#F97316',
};

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


const fmtTime = (iso) => new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
const fmtDate = (iso) => new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
const isUpcoming = (iso) => new Date(iso) > new Date();
const isToday = (iso) => {
  const d = new Date(iso), n = new Date();
  return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate();
};

const timeAgo = (iso) => {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
};

const TYPE_DOT = { 'Reminder': 'var(--gold)', 'Motivational Note': 'var(--green)', 'Schedule Update': 'var(--navy)', 'Announcement': 'var(--gold)', 'Session Note': 'var(--navy)', 'Doubt Answered': 'var(--green)', 'Weekly Report': 'var(--gold)' };

const StudentContent = ({ activePage, onOpenModal, onNav, onShowToast, profile, scores, sessions = [], doubts = [], notifications = [], onMarkNotificationsRead, onNotificationClick, resources = [], questionBank = [], parentReports = null }) => {
  const { id: userId } = useParams();
  const firstName = profile?.name?.split(' ')[0] || 'there';
  const examTarget = profile?.studentProfile?.examTarget || 'your exam';
  const targetYear = profile?.studentProfile?.targetYear;
  const daysRemaining = getDaysRemaining(examTarget, targetYear);

  const weeks = scores ? [...scores].sort((a, b) => a.weekNumber - b.weekNumber) : [];
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
      const firstPct = first.totalMarks > 0 ? Math.round(first.score / first.totalMarks * 100) : 0;
      const lastPct  = last.totalMarks  > 0 ? Math.round(last.score  / last.totalMarks  * 100) : 0;
      return { name, firstPct, lastPct, delta: lastPct - firstPct };
    });
  })();

  const topImprover    = subjectStats.length > 0 ? subjectStats.reduce((a, b) => a.delta  > b.delta  ? a : b) : null;
  const weakestSubject = subjectStats.length > 0 ? subjectStats.reduce((a, b) => a.lastPct < b.lastPct ? a : b) : null;

  const [coursesTab, setCoursesTab] = useState(0);
  const [videoTab, setVideoTab] = useState(0);
  const [sessionsTab, setSessionsTab] = useState(0);
  const [resourcesTab, setResourcesTab] = useState(0);
  const [questionBankTab, setQuestionBankTab] = useState(0);
  const [doubtTab, setDoubtTab] = useState(0);
  const [openWR, setOpenWR] = useState(new Set([0]));
  const [openSessionNote, setOpenSessionNote] = useState(null);
  const [helpfulState, setHelpfulState] = useState({});

  // When doubts refresh from server (e.g. faculty re-answered → helpful reset to null),
  // drop any local override so the UI reflects the server state.
  useEffect(() => {
    setHelpfulState(prev => {
      const next = { ...prev };
      let changed = false;
      doubts.forEach(d => {
        if (d.helpful === null && next[d.id] !== undefined) {
          delete next[d.id];
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [doubts]);

  const [expandedWeek, setExpandedWeek] = useState(null); // null=first open, -1=all closed, N=weekNumber open
  const [expandedReportId, setExpandedReportId] = useState(null);
  const [feedbackState, setFeedbackState] = useState({}); // { [reportId]: { rating, comment, submitted, submitting } }

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
            <div style={{ fontSize: '14px', color: 'var(--text2)', marginTop: '4px' }}>You have <strong style={{ color: 'var(--text)' }}>{sessions.filter(s => isToday(s.scheduledAt)).length} session{sessions.filter(s => isToday(s.scheduledAt)).length !== 1 ? 's' : ''}</strong> today. {examTarget} is in <strong style={{ color: 'var(--gold)' }}>{daysRemaining ?? '—'} days</strong>.</div>
          </div>
          <button className="btn btn-primary" style={{ flexShrink: 0, width: 'fit-content' }} onClick={() => onNav('journey')}>View My Journey →</button>
        </div>

        {(() => {
          const planEndDate = profile?.studentProfile?.planEndDate;
          const plan = profile?.studentProfile?.plan;
          if (!planEndDate || plan !== 'premium') return null;
          const daysLeft = Math.ceil((new Date(planEndDate) - new Date()) / (1000 * 60 * 60 * 24));
          const isDev = import.meta.env.VITE_ENV === 'dev';
          if (daysLeft <= 0 || (!isDev && daysLeft > 5)) return null;
          return (
            <div style={{
              background: '#fef3c7', border: '2px solid #f59e0b',
              borderRadius: 'var(--r)', padding: '16px 20px', marginBottom: '20px',
              display: 'flex', alignItems: 'center', gap: '14px',
            }}>
              <div style={{
                width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0,
                background: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#92400e', marginBottom: '2px' }}>
                  Subscription expires in {daysLeft} day{daysLeft !== 1 ? 's' : ''}
                </div>
                <div style={{ fontSize: '12.5px', color: '#b45309' }}>
                  Contact your admin to renew and keep full access to sessions, doubts, and reports.
                </div>
              </div>
            </div>
          );
        })()}

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
              const todaySessions = sessions.filter(s => isToday(s.scheduledAt));
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

          {(() => {
            const latest = notifications.find(n => !n.readAt);
            if (latest) {
              const dot = TYPE_DOT[latest.type] || 'var(--gold)';
              const isFaculty = latest.type === 'Session Note';
              const senderLabel = isFaculty ? 'Faculty' : 'Studyverse Admin';
              const senderInit = isFaculty ? 'F' : 'S';
              const destPage = latest.type === 'Session Note' || latest.type === 'Schedule Update' ? 'sessions'
                : latest.type === 'Reminder' || latest.type === 'Motivational Note' ? 'dashboard' : 'notif';
              return (
                <div className="card card-gold-accent" style={{ borderColor: dot, position: 'relative', cursor: 'pointer' }}
                  onClick={() => onNotificationClick?.(latest.id, latest.type)}>
                  <div className="sh">
                    <div className="sh-title">{latest.type}</div>
                    <span className="pill pill-gold" style={{ background: dot, color: '#fff', border: 'none' }}>New</span>
                  </div>
                  <div style={{ fontFamily: 'var(--font-serif)', fontSize: '14px', fontStyle: 'italic', color: 'var(--text2)', lineHeight: 1.8, marginBottom: '16px' }}>
                    "{latest.content}"
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '50%', border: `2px solid ${dot}`, background: 'var(--gold-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-serif)', fontSize: '13px', fontWeight: 700, color: dot }}>{senderInit}</div>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>{senderLabel}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text3)' }}>{timeAgo(latest.createdAt)}</div>
                      </div>
                    </div>
                    <button className="btn btn-ghost btn-sm" onClick={e => { e.stopPropagation(); onNotificationClick?.(latest.id, latest.type); }}>
                      {destPage === 'sessions' ? 'Go to Sessions →' : destPage === 'dashboard' ? 'Go to Dashboard →' : 'View all →'}
                    </button>
                  </div>
                </div>
              );
            }
            return (
              <div className="card card-gold-accent">
                <div className="sh">
                  <div className="sh-title">From the Team</div>
                  <span className="pill pill-gold">Motivational</span>
                </div>
                <div style={{ fontFamily: 'var(--font-serif)', fontSize: '14px', fontStyle: 'italic', color: 'var(--text2)', lineHeight: 1.8, marginBottom: '16px' }}>
                  "{firstName}, every session you show up for is a brick in something that cannot be bought or shortcut. Stay consistent — the results are already in motion."
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', border: '2px solid var(--gold)', background: 'var(--gold-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-serif)', fontSize: '13px', fontWeight: 700, color: 'var(--gold)' }}>S</div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>Studyverse Admin</div>
                    <div style={{ fontSize: '11px', color: 'var(--text3)' }}>Your team is with you</div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>

        <div className="sh"><div className="sh-title">This Week's Insights</div></div>
        <div className="g3 mb">
          {subjectStats.length > 0 ? subjectStats.map(s => {
            const isWeakest = s.name === weakestSubject?.name;
            const isBest    = s.name === topImprover?.name;
            const bg     = isWeakest ? 'var(--red-dim)'   : isBest ? 'var(--green-dim)' : undefined;
            const border = isWeakest ? 'rgba(239,68,68,0.2)' : isBest ? 'rgba(34,197,94,0.2)' : undefined;
            const icon   = isWeakest ? '⚠️' : isBest ? '📈' : '📊';
            return (
              <div key={s.name} className="insight" style={{ background: bg, borderColor: border }}>
                <div className="insight-icon">{icon}</div>
                <div>
                  <div className="insight-title">{s.name} — {s.lastPct}% <span style={{ fontSize: '12px', fontWeight: 600, color: s.delta >= 0 ? 'var(--green)' : 'var(--red)' }}>{s.delta >= 0 ? '+' : ''}{s.delta}%</span></div>
                  <div className="insight-body">
                    {isWeakest ? `Weakest subject this week. Prioritise before ${examTarget}.` : isBest ? `Strongest growth — up from ${s.firstPct}% since Week 1.` : `Baseline ${s.firstPct}% → now ${s.lastPct}%.`}
                  </div>
                </div>
              </div>
            );
          }) : (
            <div className="insight"><div className="insight-icon">📊</div><div><div className="insight-title">No Tests Yet</div><div className="insight-body">Complete your first weekly test to see subject insights here.</div></div></div>
          )}
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
                  const pct = s.totalMarks > 0 ? Math.round(s.score / s.totalMarks * 100) : 0;
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
                  {filtered.map(s => {
                    const noteOpen = openSessionNote === s.id;
                    return (
                      <Fragment key={s.id}>
                        <tr>
                          <td>{s.title}</td>
                          <td><span className="pill pill-navy">{s.subject}</span></td>
                          <td>{s.dayOfWeek}, {fmtTime(s.scheduledAt)}</td>
                          <td>{s.duration} min</td>
                          <td><span className={`sess-status ${isUpcoming(s.scheduledAt) ? 's-up' : ''}`}>{isUpcoming(s.scheduledAt) ? 'Upcoming' : 'Completed'}</span></td>
                          <td>
                            {!isUpcoming(s.scheduledAt) && (
                              <button
                                className={`btn btn-sm ${s.note ? (noteOpen ? 'btn-gold' : 'btn-ghost') : 'btn-ghost'}`}
                                style={!s.note ? { opacity: 0.4, cursor: 'default' } : {}}
                                onClick={() => s.note && setOpenSessionNote(noteOpen ? null : s.id)}
                              >
                                {noteOpen ? 'Hide Note' : 'See Note'}
                              </button>
                            )}
                          </td>
                        </tr>
                        {noteOpen && s.note && (
                          <tr>
                            <td colSpan={6} style={{ padding: '0 0 12px 0', background: 'var(--cream)' }}>
                              <div style={{ padding: '12px 16px', borderLeft: '3px solid var(--gold)', margin: '0 16px', background: 'var(--cream2)', borderRadius: '0 var(--r) var(--r) 0' }}>
                                <div style={{ fontSize: '11px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.07em', fontWeight: 500, marginBottom: '6px' }}>
                                  Note from {s.facultyName} — {fmtDate(s.scheduledAt)}
                                </div>
                                <div style={{ fontSize: '13px', color: 'var(--text2)', lineHeight: 1.75 }}>{s.note}</div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
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
          {['Study Material', 'Previous Years', 'Formula Sheet', 'Session Notes', 'All'].map((t, i) => (
            <div key={t} className={`tab${resourcesTab === i ? ' on' : ''}`} onClick={() => setResourcesTab(i)}>{t}</div>
          ))}
        </div>
        {(() => {
          const typeMap = ['Study Material', 'Previous Years', 'Formula Sheet', 'Session Notes'];
          const filtered = resourcesTab < 4 ? resources.filter(r => r.type === typeMap[resourcesTab]) : resources;
          if (filtered.length === 0) return (
            <div style={{ fontSize: '13px', color: 'var(--text3)', padding: '32px 0', textAlign: 'center' }}>
              No resources available{resourcesTab < 4 ? ` for ${typeMap[resourcesTab]}` : ''}.
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
      </div>

      {/* ══════════ QUESTION BANK ══════════ */}
      <div className={p('question-bank')}>
        <div className="tabs">
          {['MCQ Bank', 'Previous Papers', 'Practice Set', 'All'].map((t, i) => (
            <div key={t} className={`tab${questionBankTab === i ? ' on' : ''}`} onClick={() => setQuestionBankTab(i)}>{t}</div>
          ))}
        </div>
        {(() => {
          const typeMap = ['MCQ Bank', 'Previous Papers', 'Practice Set'];
          const filtered = questionBankTab < 3 ? questionBank.filter(r => r.type === typeMap[questionBankTab]) : questionBank;
          if (filtered.length === 0) return (
            <div style={{ fontSize: '13px', color: 'var(--text3)', padding: '32px 0', textAlign: 'center' }}>
              No question bank items available{questionBankTab < 3 ? ` for ${typeMap[questionBankTab]}` : ''}.
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
      </div>

      {/* ══════════ DOUBT DESK ══════════ */}
      <div className={p('doubt')}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px' }}>
          <div className="tabs" style={{ marginBottom: 0 }}>
            {['Resolved', 'Open', 'All'].map((t, i) => (
              <div key={t} className={`tab${doubtTab === i ? ' on' : ''}`} onClick={() => setDoubtTab(i)}>{t}</div>
            ))}
          </div>
          <button className="btn btn-primary" onClick={() => onOpenModal('doubt-modal')}>+ Ask a Doubt</button>
        </div>
        {(() => {
          const filtered = doubts.filter(d =>
            doubtTab === 0 ?  d.answeredAt :
            doubtTab === 1 ? !d.answeredAt : true
          );
          if (filtered.length === 0) return (
            <div style={{ fontSize: '13px', color: 'var(--text3)', padding: '24px 0', textAlign: 'center' }}>
              {doubtTab === 0 ? 'No resolved doubts yet.' : doubtTab === 1 ? 'No open doubts.' : 'No doubts raised yet.'}
            </div>
          );
          return filtered.map(d => {
            const isHelpful = helpfulState[d.id] !== undefined ? helpfulState[d.id] : d.helpful;
            const markHelpful = async (val) => {
              const token = localStorage.getItem('token');
              try {
                const res = await fetch(`${import.meta.env.VITE_API_URL}/api/student/${userId}/doubts/${d.id}/helpful`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                  body: JSON.stringify({ helpful: val }),
                });
                if (!res.ok) throw new Error();
                setHelpfulState(prev => ({ ...prev, [d.id]: val }));
              } catch {
                onShowToast('Failed to save feedback.');
              }
            };
            return (
              <div key={d.id} className="doubt-item" style={d.answeredAt ? { borderColor: 'rgba(34,197,94,0.3)', background: 'var(--cream)' } : {}}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span className="pill pill-navy">{d.subject || 'General'}</span>
                  {d.answeredAt
                    ? <span style={{ fontSize: '11px', color: 'var(--green)', fontWeight: 600 }}>✓ Answered by {d.facultyName}</span>
                    : <span style={{ fontSize: '11px', color: 'var(--text3)' }}>{fmtDate(d.createdAt || new Date())}</span>
                  }
                </div>
                <div className="doubt-q" style={{ marginBottom: d.answeredAt ? '12px' : '6px' }}>{d.question}</div>
                {d.answeredAt && d.answer && (
                  <div style={{ borderLeft: '3px solid var(--green)', background: 'rgba(34,197,94,0.06)', padding: '12px 14px', borderRadius: '0 var(--r) var(--r) 0', marginBottom: '12px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--green)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '6px' }}>
                      {d.facultyName}'s Answer
                    </div>
                    <div style={{ fontSize: '13.5px', color: 'var(--text)', lineHeight: 1.75 }}>{d.answer}</div>
                  </div>
                )}
                <div className="doubt-footer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>{d.answeredAt ? `Replied ${fmtDate(d.answeredAt)}` : `Awaiting ${d.facultyName}'s response`}</span>
                  {d.answeredAt && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {isHelpful === null || isHelpful === undefined ? (
                        <>
                          <span style={{ fontSize: '11px', color: 'var(--text3)' }}>Helpful?</span>
                          <button className="btn btn-ghost btn-sm" style={{ padding: '2px 8px', fontSize: '13px' }} onClick={() => markHelpful(true)}>👍</button>
                          <button className="btn btn-ghost btn-sm" style={{ padding: '2px 8px', fontSize: '13px' }} onClick={() => markHelpful(false)}>👎</button>
                        </>
                      ) : (
                        <span style={{ fontSize: '11px', color: isHelpful ? 'var(--green)' : 'var(--text3)' }}>
                          {isHelpful ? '👍 Marked as helpful' : '👎 Marked as not helpful'}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          });
        })()}
      </div>

      {/* ══════════ PARENT VIEW ══════════ */}
      <div className={p('parent')}>
        {(() => {
          const prSubjects = parentReports?.subjects || [];
          const prAllReports = parentReports?.reports || [];

          // Group all reports by weekNumber, newest first
          const weekMap = {};
          for (const r of prAllReports) {
            if (!weekMap[r.weekNumber]) weekMap[r.weekNumber] = { weekNumber: r.weekNumber, weekStartDate: r.weekStartDate, reports: [] };
            weekMap[r.weekNumber].reports.push(r);
          }
          const weekGroups = Object.values(weekMap).sort((a, b) => b.weekNumber - a.weekNumber);

          // Helpers
          const fmtShortDate = (iso) => new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
          const fmtWeekRange = (wsd) => {
            const mon = new Date(wsd + 'T00:00:00');
            const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
            return `${fmtShortDate(mon.toISOString())} – ${fmtShortDate(sun.toISOString())}`;
          };

          // Next Sunday
          const now = new Date();
          const daysUntilSun = now.getDay() === 0 ? 7 : 7 - now.getDay();
          const nextSun = new Date(now); nextSun.setDate(now.getDate() + daysUntilSun);
          const nextSunStr = nextSun.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

          // Current ISO week number (YYYYWW)
          const d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
          const dayNum = d.getUTCDay() || 7;
          d.setUTCDate(d.getUTCDate() + 4 - dayNum);
          const ys = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
          const curWeekNum = parseInt(`${d.getUTCFullYear()}${String(Math.ceil((((d - ys) / 86400000) + 1) / 7)).padStart(2, '0')}`);

          // Toggle week expansion: null=first open, -1=all closed, N=week N open
          const isWeekOpen = (wn, i) => expandedWeek === null ? i === 0 : expandedWeek === wn;
          const toggleWeekOpen = (wn, i) => {
            if (expandedWeek === null) setExpandedWeek(i === 0 ? -1 : wn);
            else setExpandedWeek(prev => prev === wn ? -1 : wn);
          };

          return (
            <>
              {/* ═══ HERO HEADER ═══ */}
              <div style={{
                background: 'linear-gradient(135deg, #0F1F3D 0%, #162848 60%, #0F1F3D 100%)',
                borderRadius: '18px', padding: '32px 36px', marginBottom: '28px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                position: 'relative', overflow: 'hidden',
              }}>
                <div style={{ position: 'absolute', right: '-30px', top: '-50px', width: '220px', height: '220px', borderRadius: '50%', border: '1px solid rgba(232,168,48,0.1)', background: 'rgba(232,168,48,0.04)' }} />
                <div style={{ position: 'absolute', right: '100px', bottom: '-70px', width: '150px', height: '150px', borderRadius: '50%', border: '1px solid rgba(232,168,48,0.06)' }} />
                <div style={{ position: 'relative' }}>
                  <div style={{ fontSize: '10px', color: 'rgba(232,168,48,0.65)', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 600, marginBottom: '10px' }}>Parent Dashboard</div>
                  <div style={{ fontFamily: 'var(--font-serif)', fontSize: '26px', fontWeight: 700, color: '#FDF8F0', marginBottom: '6px', lineHeight: 1.2 }}>{firstName}'s Progress Report</div>
                  <div style={{ fontSize: '13px', color: 'rgba(253,248,240,0.45)', marginBottom: '4px' }}>
                    {profile?.studentProfile?.examTarget || 'Exam'} {profile?.studentProfile?.targetYear || ''} · {profile?.studentProfile?.grade || ''} Batch
                  </div>
                  <div style={{ fontSize: '13px', color: 'rgba(253,248,240,0.4)' }}>
                    Sent every Sunday · <span style={{ color: 'var(--gold)', fontWeight: 500 }}>Next: {nextSunStr}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '14px', position: 'relative' }}>
                  {[
                    { val: prAllReports.length, label: 'Reports Sent' },
                    { val: prSubjects.filter(s => s.latestReport).length, label: 'Subjects Active' },
                  ].map(({ val, label }) => (
                    <div key={label} style={{ textAlign: 'center', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: '14px', padding: '18px 22px', minWidth: '90px' }}>
                      <div style={{ fontFamily: 'var(--font-serif)', fontSize: '36px', fontWeight: 700, color: 'var(--gold)', lineHeight: 1 }}>{val}</div>
                      <div style={{ fontSize: '10px', color: 'rgba(253,248,240,0.45)', marginTop: '6px', textTransform: 'uppercase', letterSpacing: '0.8px' }}>{label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ═══ SUBJECT MENTOR CARDS ═══ */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '28px' }}>
                {prSubjects.map((sf) => {
                  const r = sf.latestReport;
                  const col = SUBJ_COLOR[sf.subject] || 'var(--gold)';
                  const initial = sf.facultyName?.charAt(0).toUpperCase() || '?';
                  const isThisWeek = r && r.weekNumber === curWeekNum;
                  const pct = r?.testScore != null ? Math.round(r.testScore / (r.testTotalMarks || 100) * 100) : null;
                  return (
                    <div key={sf.subject} style={{ background: 'var(--cream)', borderRadius: '14px', border: '1px solid var(--border)', boxShadow: '0 2px 12px rgba(15,31,61,0.06)', overflow: 'hidden' }}>
                      {/* 4px color bar */}
                      <div style={{ height: '4px', background: col }} />
                      <div style={{ padding: '18px 20px 20px' }}>
                        {/* Subject + badge */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                          <span style={{ fontSize: '11px', fontWeight: 800, color: col, textTransform: 'uppercase', letterSpacing: '1px' }}>{sf.subject}</span>
                          {isThisWeek && <span style={{ fontSize: '9px', fontWeight: 700, color: 'var(--text3)', background: 'var(--cream2)', padding: '2px 8px', borderRadius: '20px', border: '1px solid var(--border)' }}>This week</span>}
                        </div>
                        {r ? (
                          <>
                            {/* Faculty avatar + info */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--cream2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 700, color: 'var(--text2)', flexShrink: 0 }}>{initial}</div>
                              <div>
                                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>{sf.facultyName}</div>
                                <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '1px' }}>Sent {fmtShortDate(r.sentAt)}</div>
                              </div>
                            </div>
                            {/* Stars + score inline */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: pct != null ? '12px' : '0' }}>
                              {r.overallRating != null && (
                                <div style={{ display: 'flex', gap: '2px' }}>
                                  {Array.from({ length: 5 }, (_, i) => (
                                    <span key={i} style={{ fontSize: '14px', color: i < r.overallRating ? '#E8A830' : 'rgba(15,31,61,0.12)', lineHeight: 1 }}>★</span>
                                  ))}
                                </div>
                              )}
                              {pct != null && (
                                <span style={{ fontSize: '12px', color: 'var(--text3)' }}>
                                  <strong style={{ fontSize: '14px', color: 'var(--text)', fontWeight: 700 }}>{r.testScore}</strong>/{r.testTotalMarks ?? 100} · {pct}%
                                </span>
                              )}
                            </div>
                            {/* Progress bar */}
                            {pct != null && (
                              <div style={{ height: '5px', background: 'rgba(15,31,61,0.08)', borderRadius: '10px', overflow: 'hidden', marginBottom: r.mentorNote ? '12px' : '0' }}>
                                <div style={{ height: '100%', width: `${pct}%`, background: 'var(--gold)', borderRadius: '10px', transition: 'width 0.6s ease' }} />
                              </div>
                            )}
                            {/* Note — single line */}
                            {r.mentorNote && (
                              <div style={{ fontSize: '11.5px', fontStyle: 'italic', color: 'var(--text3)', lineHeight: 1.5, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                                "{r.mentorNote}"
                              </div>
                            )}
                          </>
                        ) : (
                          <div style={{ padding: '16px 0 4px' }}>
                            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text3)', marginBottom: '3px' }}>No report yet</div>
                            <div style={{ fontSize: '11px', color: 'var(--text3)', opacity: 0.7 }}>Dispatched every Sunday</div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* ═══ PERFORMANCE SNAPSHOT ═══ */}
              {weeks.length > 0 && (
                <div style={{ background: 'var(--cream)', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px 28px', marginBottom: '28px', boxShadow: '0 2px 16px rgba(15,31,61,0.06)' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '20px' }}>Score Snapshot</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '28px' }}>
                    {/* Last week */}
                    <div style={{ textAlign: 'center', flexShrink: 0 }}>
                      <div style={{ fontSize: '11px', color: 'var(--text3)', marginBottom: '6px' }}>Last Week</div>
                      <div style={{ fontFamily: 'var(--font-serif)', fontSize: '42px', fontWeight: 700, color: 'var(--text)', lineHeight: 1 }}>{weeks.length >= 2 ? toM(weeks[weeks.length - 2].avgPct) : '—'}</div>
                    </div>
                    {/* Trend */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                      <div style={{ width: '100%', height: '2px', background: 'linear-gradient(90deg, rgba(15,31,61,0.08) 0%, var(--gold) 100%)', borderRadius: '2px' }} />
                      {weeks.length >= 2 && (() => {
                        const diff = toM(weeks[weeks.length - 1].avgPct) - toM(weeks[weeks.length - 2].avgPct);
                        return <span style={{ fontSize: '12px', fontWeight: 700, color: diff >= 0 ? 'var(--green)' : '#ef4444' }}>{diff >= 0 ? '+' : ''}{diff} marks</span>;
                      })()}
                    </div>
                    {/* This week */}
                    <div style={{ textAlign: 'center', flexShrink: 0 }}>
                      <div style={{ fontSize: '11px', color: 'var(--text3)', marginBottom: '6px' }}>This Week</div>
                      <div style={{ fontFamily: 'var(--font-serif)', fontSize: '42px', fontWeight: 700, color: 'var(--gold)', lineHeight: 1 }}>{currentMarks ?? '—'}</div>
                    </div>
                    {/* Divider */}
                    <div style={{ width: '1px', height: '70px', background: 'var(--border)', flexShrink: 0 }} />
                    {/* Per-subject bars */}
                    <div style={{ flex: 2, minWidth: 0 }}>
                      {(weeks[weeks.length - 1]?.subjects || []).map(s => {
                        const sPct = s.totalMarks > 0 ? Math.round(s.score / s.totalMarks * 100) : 0;
                        const sCol = SUBJ_COLOR[s.subject] || 'var(--gold)';
                        return (
                          <div key={s.subject} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                            <span style={{ fontSize: '11px', color: 'var(--text3)', width: '76px', flexShrink: 0 }}>{s.subject}</span>
                            <div style={{ flex: 1, height: '7px', background: 'rgba(15,31,61,0.07)', borderRadius: '10px', overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${sPct}%`, background: 'var(--gold)', borderRadius: '10px', transition: 'width 0.6s ease' }} />
                            </div>
                            <span style={{ fontSize: '12px', fontWeight: 700, color: sCol, width: '32px', textAlign: 'right', flexShrink: 0 }}>{s.score}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* ═══ REPORT HISTORY ═══ */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <div style={{ fontFamily: 'var(--font-serif)', fontSize: '18px', fontWeight: 700, color: 'var(--text)' }}>Report History</div>
                  <span style={{ fontSize: '11px', color: 'var(--text3)' }}>{weekGroups.length} week{weekGroups.length !== 1 ? 's' : ''} · newest first</span>
                </div>

                {weekGroups.length === 0 ? (
                  <div style={{ background: 'var(--cream)', border: '1px solid var(--border)', borderRadius: '16px', textAlign: 'center', padding: '52px 24px', boxShadow: '0 2px 12px rgba(15,31,61,0.05)' }}>
                    <div style={{ fontSize: '40px', marginBottom: '14px', opacity: 0.2 }}>📋</div>
                    <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text2)', marginBottom: '6px' }}>No reports sent yet</div>
                    <div style={{ fontSize: '13px', color: 'var(--text3)' }}>Reports appear here after approval and Sunday dispatch.</div>
                  </div>
                ) : weekGroups.map(({ weekNumber, weekStartDate, reports: wReports }, i) => {
                  const open = isWeekOpen(weekNumber, i);
                  return (
                    <div key={weekNumber} style={{ marginBottom: '12px' }}>
                      {/* Week header */}
                      <div
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '14px 22px',
                          background: open ? 'linear-gradient(135deg, #0F1F3D 0%, #162848 100%)' : 'var(--cream)',
                          borderRadius: open ? '16px 16px 0 0' : '16px',
                          border: `1px solid ${open ? 'transparent' : 'var(--border)'}`,
                          borderBottom: open ? 'none' : undefined,
                          cursor: 'pointer', userSelect: 'none',
                          boxShadow: open ? '0 4px 20px rgba(15,31,61,0.25)' : '0 2px 10px rgba(15,31,61,0.06)',
                        }}
                        onClick={() => toggleWeekOpen(weekNumber, i)}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                          <div style={{ fontFamily: 'var(--font-serif)', fontSize: '15px', fontWeight: 700, color: open ? '#FDF8F0' : 'var(--text)' }}>Week {weekNumber % 100}</div>
                          <span style={{ fontSize: '12px', color: open ? 'rgba(253,248,240,0.5)' : 'var(--text3)' }}>{fmtWeekRange(weekStartDate)}</span>
                          {weekNumber === curWeekNum && <span style={{ fontSize: '10px', fontWeight: 700, background: 'var(--gold)', color: '#0F1F3D', padding: '3px 10px', borderRadius: '20px', letterSpacing: '0.3px' }}>CURRENT</span>}
                          <span style={{ fontSize: '11px', background: open ? 'rgba(255,255,255,0.09)' : 'var(--cream2)', border: `1px solid ${open ? 'rgba(255,255,255,0.1)' : 'var(--border)'}`, borderRadius: '20px', padding: '2px 10px', color: open ? 'rgba(253,248,240,0.55)' : 'var(--text3)' }}>
                            {wReports.length} report{wReports.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={open ? 'rgba(253,248,240,0.45)' : 'var(--text3)'} strokeWidth="2.5" style={{ transform: open ? 'rotate(180deg)' : '', transition: 'transform 0.2s', flexShrink: 0 }}>
                          <path d="M6 9l6 6 6-6"/>
                        </svg>
                      </div>

                      {/* Report cards */}
                      {open && (
                        <div style={{ background: 'rgba(15,31,61,0.03)', border: '1px solid var(--border)', borderTop: 'none', borderRadius: '0 0 16px 16px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          {wReports.map(r => {
                            const col = SUBJ_COLOR[r.subject] || 'var(--gold)';
                            const init = r.facultyName?.charAt(0).toUpperCase() || '?';
                            const isExpanded = expandedReportId === r.id;
                            const sPct = r.testScore != null ? Math.round(r.testScore / (r.testTotalMarks || 100) * 100) : null;
                            return (
                              <div key={r.id} style={{ background: 'var(--cream)', borderRadius: '14px', border: '1px solid var(--border)', boxShadow: '0 2px 10px rgba(15,31,61,0.06)', overflow: 'hidden', display: 'flex' }}>
                                {/* Left color strip */}
                                <div style={{ width: '5px', background: `linear-gradient(180deg, ${col} 0%, ${col}66 100%)`, flexShrink: 0 }} />
                                <div style={{ flex: 1, padding: '14px 18px' }}>
                                  {/* Report summary row */}
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: `linear-gradient(135deg, ${col}28 0%, ${col}0E 100%)`, border: `2px solid ${col}35`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 700, color: col, flexShrink: 0 }}>{init}</div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                        <span style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text)' }}>{r.facultyName}</span>
                                        <span style={{ fontSize: '10px', fontWeight: 800, background: col + '18', color: col, padding: '2px 8px', borderRadius: '20px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>{r.subject}</span>
                                      </div>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        {r.overallRating && <span style={{ fontSize: '13px', color: 'var(--gold)', letterSpacing: '1.5px' }}>{'★'.repeat(r.overallRating)}{'☆'.repeat(5 - r.overallRating)}</span>}
                                        {r.testScore != null && <span style={{ fontSize: '12px', color: 'var(--text3)' }}>· <strong style={{ color: col, fontSize: '13px' }}>{r.testScore}</strong><span style={{ fontSize: '10px' }}>/{r.testTotalMarks ?? 100}</span></span>}
                                        <span style={{ fontSize: '11px', color: 'var(--text3)' }}>· {fmtShortDate(r.sentAt)}</span>
                                      </div>
                                    </div>
                                    <button
                                      className="btn btn-ghost btn-sm"
                                      style={{ flexShrink: 0, minWidth: '72px' }}
                                      onClick={() => setExpandedReportId(isExpanded ? null : r.id)}
                                    >{isExpanded ? 'Hide ▲' : 'View ▼'}</button>
                                  </div>

                                  {/* Full detail */}
                                  {isExpanded && (
                                    <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                      {r.testScore != null && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                          <span style={{ fontSize: '11px', color: 'var(--text3)', flexShrink: 0 }}>Score</span>
                                          <strong style={{ fontSize: '14px', color: 'var(--text)' }}>{r.testScore}/{r.testTotalMarks ?? 100}</strong>
                                          <div style={{ flex: 1, height: '5px', background: 'rgba(15,31,61,0.08)', borderRadius: '10px', overflow: 'hidden' }}>
                                            <div style={{ height: '100%', width: `${sPct}%`, background: 'var(--gold)', borderRadius: '10px' }} />
                                          </div>
                                          <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text2)', flexShrink: 0 }}>{sPct}%</span>
                                        </div>
                                      )}
                                      {r.mentorNote && (
                                        <div>
                                          <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '5px' }}>Note to Parents</div>
                                          <div style={{ fontSize: '13px', fontStyle: 'italic', color: 'var(--text2)', lineHeight: 1.7 }}>"{r.mentorNote}"</div>
                                        </div>
                                      )}
                                      {r.strengths && (
                                        <div>
                                          <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '5px' }}>Strengths</div>
                                          <div style={{ fontSize: '13px', color: 'var(--text2)', lineHeight: 1.65 }}>{r.strengths}</div>
                                        </div>
                                      )}
                                      {r.improvements && (
                                        <div>
                                          <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '5px' }}>Areas to Work On</div>
                                          <div style={{ fontSize: '13px', color: 'var(--text2)', lineHeight: 1.65 }}>{r.improvements}</div>
                                        </div>
                                      )}
                                      {r.nextWeekPlan && (
                                        <div>
                                          <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '5px' }}>Plan for Next Week</div>
                                          <div style={{ fontSize: '13px', color: 'var(--text2)', lineHeight: 1.65 }}>{r.nextWeekPlan}</div>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          );
        })()}
      </div>

      {/* ══════════ PARENT FEEDBACK ══════════ */}
      <div className={p('feedback')}>
        {(() => {
          const allReports = parentReports?.reports || [];
          const fmtShortDate = (iso) => new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
          const fmtWeekRange = (wsd) => {
            const mon = new Date(wsd + 'T00:00:00');
            const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
            return `${fmtShortDate(mon.toISOString())} – ${fmtShortDate(sun.toISOString())}`;
          };
          const SUBJ_COLOR = { Physics: '#4F8EF7', Chemistry: '#22C55E', Mathematics: '#A855F7', Biology: '#F97316', Maths: '#A855F7' };

          // Group by week, newest first
          const weekMap = {};
          for (const r of allReports) {
            if (!weekMap[r.weekNumber]) weekMap[r.weekNumber] = { weekNumber: r.weekNumber, weekStartDate: r.weekStartDate, reports: [] };
            weekMap[r.weekNumber].reports.push(r);
          }
          const weekGroups = Object.values(weekMap).sort((a, b) => b.weekNumber - a.weekNumber);

          // Deadline = Sunday 23:59:59 of the week the report was sent
          const isWindowOpen = (sentAt) => {
            if (!sentAt) return false;
            const d = new Date(sentAt);
            const daysUntilSun = d.getDay() === 0 ? 0 : 7 - d.getDay();
            const deadline = new Date(d);
            deadline.setDate(d.getDate() + daysUntilSun);
            deadline.setHours(23, 59, 59, 999);
            return new Date() <= deadline;
          };

          const submitFeedback = async (r) => {
            const fb = feedbackState[r.id] || {};
            if (!fb.rating) return;
            setFeedbackState(prev => ({ ...prev, [r.id]: { ...prev[r.id], submitting: true } }));
            const token = localStorage.getItem('token');
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/student/${userId}/feedback`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
              body: JSON.stringify({ reportId: r.id, rating: fb.rating, comment: fb.comment || '' }),
            }).catch(() => null);
            if (res?.ok || res?.status === 409) {
              setFeedbackState(prev => ({ ...prev, [r.id]: { ...prev[r.id], submitting: false, submitted: true } }));
            } else {
              setFeedbackState(prev => ({ ...prev, [r.id]: { ...prev[r.id], submitting: false } }));
              onShowToast?.('Failed to submit feedback. Please try again.');
            }
          };

          return (
            <>
              <div className="sh" style={{ marginBottom: '20px' }}>
                <div className="sh-title">Weekly Feedback</div>
                <div style={{ fontSize: '13px', color: 'var(--text3)' }}>{weekGroups.length} week{weekGroups.length !== 1 ? 's' : ''} · one feedback per report</div>
              </div>

              {weekGroups.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '40px 24px', color: 'var(--text3)', fontSize: '14px' }}>
                  No reports sent yet. Feedback will appear here once your faculty's reports are delivered.
                </div>
              ) : weekGroups.map(({ weekNumber, weekStartDate, reports: wReports }) => {
                const windowOpen = isWindowOpen(wReports[0]?.sentAt);
                const submittedCount = wReports.filter(r => r.feedback || feedbackState[r.id]?.submitted).length;
                return (
                  <div key={weekNumber} style={{ marginBottom: '28px' }}>
                    {/* Week header */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text2)' }}>
                        Week {String(weekNumber).slice(-2)}
                        {weekStartDate ? ` · ${fmtWeekRange(weekStartDate)}` : ''}
                      </div>
                      {windowOpen
                        ? <span style={{ fontSize: '11px', color: 'var(--gold)', fontWeight: 600, background: 'rgba(232,168,48,0.1)', borderRadius: '20px', padding: '2px 10px' }}>
                            {submittedCount}/{wReports.length} submitted · window open
                          </span>
                        : submittedCount === wReports.length
                          ? <span style={{ fontSize: '11px', color: 'var(--green)', fontWeight: 600, background: 'rgba(34,197,94,0.1)', borderRadius: '20px', padding: '2px 10px' }}>All submitted</span>
                          : <span style={{ fontSize: '11px', color: 'var(--text3)', fontWeight: 600, background: 'rgba(0,0,0,0.05)', borderRadius: '20px', padding: '2px 10px' }}>
                              {submittedCount}/{wReports.length} submitted · window closed
                            </span>
                      }
                    </div>

                    {wReports.map(r => {
                      const fb = feedbackState[r.id] || {};
                      const existing = r.feedback;
                      const hasSubmitted = existing || fb.submitted;
                      const missed = !hasSubmitted && !windowOpen;
                      const dispRating = fb.submitted ? fb.rating : existing?.rating;
                      const dispComment = fb.submitted ? fb.comment : existing?.comment;
                      const dotColor = SUBJ_COLOR[r.testSubject] || 'var(--gold)';

                      return (
                        <div key={r.id} className="card" style={{ marginBottom: '10px', padding: '18px 20px', opacity: missed ? 0.55 : 1 }}>
                          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <div style={{ width: '9px', height: '9px', borderRadius: '50%', background: dotColor, flexShrink: 0 }} />
                              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)' }}>{r.testSubject}</div>
                              <div style={{ fontSize: '12px', color: 'var(--text3)' }}>{r.facultyName || ''}</div>
                            </div>
                            {r.testScore != null && (
                              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text2)', flexShrink: 0 }}>{r.testScore}/{r.testTotalMarks ?? 100}</div>
                            )}
                          </div>

                          {hasSubmitted ? (
                            <div style={{ paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: dispComment ? '5px' : 0 }}>
                                <span style={{ color: '#E8A830', fontSize: '17px', letterSpacing: '2px' }}>{'★'.repeat(dispRating)}{'☆'.repeat(5 - dispRating)}</span>
                                <span style={{ fontSize: '12px', color: 'var(--text3)' }}>Your feedback</span>
                              </div>
                              {dispComment && <div style={{ fontSize: '13px', color: 'var(--text2)', fontStyle: 'italic' }}>"{dispComment}"</div>}
                            </div>
                          ) : missed ? (
                            <div style={{ paddingTop: '12px', borderTop: '1px solid var(--border)', fontSize: '12px', color: 'var(--text3)', fontStyle: 'italic' }}>
                              Missed — feedback window closed
                            </div>
                          ) : (
                            <div style={{ paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
                              <div style={{ display: 'flex', gap: '1px', marginBottom: '10px' }}>
                                {[1, 2, 3, 4, 5].map(star => (
                                  <button
                                    key={star}
                                    onClick={() => setFeedbackState(prev => ({ ...prev, [r.id]: { ...prev[r.id], rating: star } }))}
                                    style={{
                                      background: 'none', border: 'none', cursor: 'pointer', padding: '3px 4px',
                                      fontSize: '26px', color: (fb.rating >= star) ? '#E8A830' : 'var(--border)',
                                      lineHeight: 1, transition: 'color 0.15s',
                                    }}
                                  >★</button>
                                ))}
                              </div>
                              <textarea
                                placeholder="Any comments for the faculty? (optional)"
                                value={fb.comment || ''}
                                onChange={e => setFeedbackState(prev => ({ ...prev, [r.id]: { ...prev[r.id], comment: e.target.value } }))}
                                rows={2}
                                style={{
                                  width: '100%', boxSizing: 'border-box', resize: 'none',
                                  border: '1px solid var(--border)', borderRadius: '8px',
                                  padding: '8px 12px', fontSize: '13px', color: 'var(--text)',
                                  background: 'var(--card)', fontFamily: 'inherit', marginBottom: '10px',
                                }}
                              />
                              <button
                                className="btn btn-gold btn-sm"
                                disabled={!fb.rating || fb.submitting}
                                onClick={() => submitFeedback(r)}
                              >{fb.submitting ? 'Submitting…' : 'Submit Feedback'}</button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </>
          );
        })()}
      </div>

      {/* ══════════ NOTIFICATIONS ══════════ */}
      <div className={p('notif')}>
        <div className="card">
          <div className="sh">
            <div className="sh-title">Notifications</div>
            {notifications.some(n => !n.readAt) && (
              <button className="btn btn-ghost btn-sm" style={{ fontSize: '11px', padding: '4px 10px' }} onClick={onMarkNotificationsRead}>Mark all read</button>
            )}
          </div>
          {notifications.length === 0 ? (
            <div style={{ fontSize: '13px', color: 'var(--text3)', padding: '12px 0' }}>No messages yet.</div>
          ) : notifications.map(n => (
            <div key={n.id} className="notif-row"
              onClick={() => onNotificationClick?.(n.id, n.type)}
              style={{
                cursor: 'pointer',
                ...((!n.readAt) ? { background: 'var(--cream2)', borderRadius: 'var(--r)', padding: '8px 10px', marginBottom: '4px' } : {}),
              }}
            >
              <div className="notif-dot" style={{ background: TYPE_DOT[n.type] || 'var(--gold)', flexShrink: 0 }}></div>
              <div style={{ flex: 1 }}>
                <div className="notif-text"><strong>{n.type}</strong> — {n.content}</div>
                <div className="notif-time">{timeAgo(n.createdAt)}</div>
              </div>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth="2" style={{ flexShrink: 0 }}>
                <path d="M9 18l6-6-6-6"/>
              </svg>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default StudentContent;
