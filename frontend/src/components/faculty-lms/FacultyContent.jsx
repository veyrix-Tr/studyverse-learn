import { useState } from 'react';

const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const fmtTime = (iso) => new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
const fmtDate = (iso) => new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
const isUpcoming = (iso) => new Date(iso) > new Date();
const timeAgo = (iso) => {
  const mins = Math.round((Date.now() - new Date(iso)) / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
};

const SubjRow = ({ name, pct, bar, color }) => (
  <div className="sc-subj-row">
    <div className="sc-subj-name">{name}</div>
    <div className="sc-subj-bar">
      <div className="pbar"><div className={`pbar-inner ${bar}`} style={{ width: `${pct}%` }}></div></div>
    </div>
    <div className="sc-subj-pct" style={{ color }}>{pct}%</div>
  </div>
);

const StudentCard = ({ av, name, exam, week, statusBadge, base, curr, gain, gainFull, subjects, next, flagClass, flag, onDetail }) => (
  <div className="student-card" onClick={onDetail}>
    <div className="sc-header">
      <div className="sc-av">{av}</div>
      <div><div className="sc-name">{name}</div><div className="sc-exam">{exam} • {week}</div></div>
      {statusBadge && <div style={{ marginLeft: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>{statusBadge}</div>}
    </div>
    <div className="sc-body">
      <div className="sc-delta">
        <span className="sc-baseline">{base}</span>
        <span className="sc-arrow">→</span>
        <span className="sc-current">{curr}</span>
        <span className="sc-gain">+{gain}{gainFull ? ' marks' : ''}</span>
      </div>
      <div className="sc-subjects">{subjects}</div>
      <div className="sc-footer">
        <div className="sc-next">Next: <strong>{next}</strong></div>
        <div className="sc-flags"><span className={`pill ${flagClass}`} style={{ fontSize: '10px' }}>{flag}</span></div>
      </div>
    </div>
  </div>
);

const DoubtItem = ({ priority, av, name, time, pills, question, placeholder, extraActions, isOpen, isReplied, onToggle, onReply }) => (
  <div className={`doubt-item ${priority}`} style={isReplied ? { opacity: 0.5, pointerEvents: 'none' } : {}}>
    <div className="di-top">
      <div className="di-student">
        <div className="di-av">{av}</div>
        <div><div className="di-name">{name}</div><div className="di-time">{time}</div></div>
      </div>
      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>{pills}</div>
    </div>
    <div className="di-q">{question}</div>
    <div className="di-actions">
      <button className="btn btn-gold btn-sm" onClick={onToggle}>Reply →</button>
      {extraActions}
    </div>
    <div className={`reply-box${isOpen ? ' open' : ''}`}>
      <textarea className="reply-textarea" rows="3" placeholder={placeholder}></textarea>
      <div className="reply-actions">
        <button className="btn btn-ghost btn-sm" onClick={onToggle}>Cancel</button>
        <button className="btn btn-gold btn-sm" onClick={onReply}>Send Reply ✓</button>
      </div>
    </div>
  </div>
);

const getGreeting = () => { const h = new Date().getHours(); if (h < 12) return 'Good morning'; if (h < 17) return 'Good afternoon'; return 'Good evening'; };

const FacultyContent = ({ activePage, onOpenModal, onOpenStudentDetail, onNav, onShowToast, profile, sessions = [], doubts = [] }) => {
  const firstName = profile?.name?.split(' ').find(p => !p.startsWith('Dr')) || profile?.name?.split(' ')[0] || 'there';
  const [scheduleTab, setScheduleTab] = useState(0);
  const [doubtsTab, setDoubtsTab] = useState(0);
  const [openReplies, setOpenReplies] = useState(new Set());
  const [repliedDoubts, setRepliedDoubts] = useState(new Set());

  const pending = doubts.filter(d => !d.answeredAt && !repliedDoubts.has(d.id));
  const answered = doubts.filter(d => d.answeredAt || repliedDoubts.has(d.id));

  const today = DAYS[new Date().getDay()];
  const todaySessions = sessions.filter(s => s.dayOfWeek === today);
  const upcomingSessions = sessions.filter(s => isUpcoming(s.scheduledAt));
  const pastSessions = sessions.filter(s => !isUpcoming(s.scheduledAt));
  const activeStudents = new Set(sessions.flatMap(s => s.enrolledStudents || [])).size;

  const toggleReply = (id) => {
    setOpenReplies(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const markReplied = (id) => {
    setRepliedDoubts(prev => new Set([...prev, id]));
    setOpenReplies(prev => { const next = new Set(prev); next.delete(id); return next; });
    onShowToast('Reply sent ✓ Doubt marked as answered');
  };

  const rahulSubjects = <>
    <SubjRow name="Chem" pct={72} bar="pb-gold" color="var(--gold)" />
    <SubjRow name="Maths" pct={80} bar="pb-green" color="var(--green)" />
    <SubjRow name="Phys" pct={58} bar="pb-orange" color="var(--orange)" />
  </>;
  const snehaSubjects = <>
    <SubjRow name="Chem" pct={81} bar="pb-green" color="var(--green)" />
    <SubjRow name="Maths" pct={86} bar="pb-green" color="var(--green)" />
    <SubjRow name="Phys" pct={68} bar="pb-gold" color="var(--gold)" />
  </>;
  const priyaSubjects = <>
    <SubjRow name="Chem" pct={62} bar="pb-orange" color="var(--orange)" />
    <SubjRow name="Bio" pct={77} bar="pb-green" color="var(--green)" />
    <SubjRow name="Phys" pct={44} bar="pb-red" color="var(--red)" />
  </>;
  const arjunSubjects = <>
    <SubjRow name="Chem" pct={75} bar="pb-green" color="var(--green)" />
    <SubjRow name="Maths" pct={62} bar="pb-orange" color="var(--orange)" />
    <SubjRow name="Phys" pct={66} bar="pb-orange" color="var(--orange)" />
  </>;
  const vanyaSubjects = <>
    <SubjRow name="Chem" pct={58} bar="pb-orange" color="var(--orange)" />
    <SubjRow name="Maths" pct={61} bar="pb-orange" color="var(--orange)" />
    <SubjRow name="Phys" pct={48} bar="pb-red" color="var(--red)" />
  </>;
  const kavyaSubjects = <>
    <SubjRow name="Chem" pct={88} bar="pb-green" color="var(--green)" />
    <SubjRow name="Bio" pct={91} bar="pb-green" color="var(--green)" />
    <SubjRow name="Phys" pct={74} bar="pb-gold" color="var(--gold)" />
  </>;

  return (
    <div className="content">

      {/* ══════════ DASHBOARD ══════════ */}
      <div className={`page${activePage === 'dashboard' ? ' on' : ''}`}>
        <div className="db-welcome">
          <div>
            <div className="db-date">{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div>
            <div className="db-greeting">{getGreeting()}, {firstName}.</div>
            <div className="db-sub">You have <strong>{todaySessions.length} session{todaySessions.length !== 1 ? 's' : ''}</strong> today &nbsp;·&nbsp; <span className="db-red">{pending.length} doubt{pending.length !== 1 ? 's' : ''}</span> pending reply</div>
          </div>
          <div className="db-actions">
            <button className="btn btn-ghost-inv btn-sm" onClick={() => onNav('reports')}>Weekly Report Due Sunday →</button>
            <button className="btn btn-gold btn-sm" onClick={() => onOpenModal('schedule-modal')}>+ Schedule Session</button>
          </div>
        </div>

        <div className="g4 mb">
          <div className="stat sa-navy">
            <div className="stat-l">Active Students</div>
            <div className="stat-v">{activeStudents}</div>
            <div className="stat-n neu">{sessions.length} sessions scheduled</div>
          </div>
          <div className="stat sa-red">
            <div className="stat-l">Doubts Pending</div>
            <div className="stat-v">{pending.length}</div>
            <div className="stat-n bad">{pending.length > 0 ? `Oldest: ${timeAgo(pending[pending.length-1].createdAt)}` : 'All clear!'}</div>
          </div>
          <div className="stat sa-gold">
            <div className="stat-l">Upcoming Sessions</div>
            <div className="stat-v">{upcomingSessions.length}</div>
            <div className="stat-n up">{todaySessions.length} today</div>
          </div>
          <div className="stat sa-green">
            <div className="stat-l">Avg Improvement</div>
            <div className="stat-v">+74</div>
            <div className="stat-n up">marks across cohort</div>
          </div>
        </div>

        <div className="g2 mb">
          <div className="card">
            <div className="sh">
              <div className="sh-t">Today's Sessions</div>
              <span className="sh-a" onClick={() => onNav('schedule')}>Full schedule →</span>
            </div>
            {todaySessions.length === 0 ? (
              <div style={{ padding: '12px 0', fontSize: '13px', color: 'var(--text3)' }}>No sessions scheduled for today.</div>
            ) : todaySessions.map(s => (
              <div key={s.id} className="sched-item">
                <div className="sched-time">{fmtTime(s.scheduledAt)}</div>
                <div className="sched-dot" style={{ background: isUpcoming(s.scheduledAt) ? 'var(--gold)' : 'var(--green)', boxShadow: isUpcoming(s.scheduledAt) ? 'none' : '0 0 0 3px rgba(34,197,94,0.2)' }}></div>
                <div className="sched-info">
                  <div className="sched-name">{s.title}</div>
                  <div className="sched-meta">{s.subject} • {s.duration} min • {s.enrolledCount} student{s.enrolledCount !== 1 ? 's' : ''}</div>
                </div>
                <div className={`sched-status ${isUpcoming(s.scheduledAt) ? 's-up' : 's-live'}`}>{isUpcoming(s.scheduledAt) ? 'Upcoming' : '● Live'}</div>
              </div>
            ))}
          </div>

          <div className="card">
            <div className="sh">
              <div className="sh-t">Doubts Needing Reply</div>
              <span className="sh-a" onClick={() => onNav('doubts')}>Reply all →</span>
            </div>
            {pending.length === 0 ? (
              <div style={{ padding: '12px 0', fontSize: '13px', color: 'var(--text3)' }}>All doubts answered. Great work!</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {pending.slice(0, 3).map(d => (
                  <div key={d.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '10px 12px', background: 'var(--cream2)', borderRadius: 'var(--r)', border: '1px solid var(--b)', cursor: 'pointer' }} onClick={() => onNav('doubts')}>
                    <div className="di-av">{d.studentName.charAt(0)}</div>
                    <div>
                      <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text)' }}>{d.studentName} <span style={{ color: 'var(--text3)', fontSize: '10px', fontWeight: 400 }}>{timeAgo(d.createdAt)}</span></div>
                      <div style={{ fontSize: '12.5px', color: 'var(--text2)' }}>{d.question.length > 80 ? d.question.slice(0, 80) + '…' : d.question}</div>
                    </div>
                  </div>
                ))}
                {pending.length > 3 && <div style={{ fontSize: '11.5px', color: 'var(--text3)', textAlign: 'center', paddingTop: '4px' }}>+{pending.length - 3} more doubts pending</div>}
              </div>
            )}
          </div>
        </div>

        <div className="sh">
          <div className="sh-t">Student Snapshot</div>
          <span className="sh-a" onClick={() => onNav('students')}>All students →</span>
        </div>
        <div className="g3 mb">
          <StudentCard av="R" name="Rahul Mehta" exam="JEE Mains 2026" week="Week 9"
            statusBadge={<span className="sched-status s-live" style={{ fontSize: '10px' }}>Live</span>}
            base={388} curr={462} gain={74} gainFull
            subjects={rahulSubjects} next="Today 4PM" flagClass="pr" flag="Phys weak"
            onDetail={() => onOpenStudentDetail('Rahul Mehta', 'R', 'JEE Mains 2026', 'Chemistry', 'Atomic Structure', 388, 462, 74)} />
          <StudentCard av="S" name="Sneha Kapoor" exam="JEE Mains 2026" week="Week 11"
            statusBadge={<span className="sched-status s-up">Today 4PM</span>}
            base={420} curr={511} gain={91} gainFull
            subjects={snehaSubjects} next="Today 4PM" flagClass="pp" flag="On track"
            onDetail={() => onOpenStudentDetail('Sneha Kapoor', 'S', 'JEE Mains 2026', 'Mathematics', 'Integration', 420, 511, 91)} />
          <StudentCard av="P" name="Priya Desai" exam="NEET 2026" week="Week 7"
            statusBadge={<span className="sched-status s-done" style={{ fontSize: '10px' }}>Apr 17</span>}
            base={350} curr={418} gain={68} gainFull
            subjects={priyaSubjects} next="Apr 17" flagClass="pr" flag="Phys critical"
            onDetail={() => onOpenStudentDetail('Priya Desai', 'P', 'NEET 2026', 'Chemistry', 'Organic Mechanisms', 350, 418, 68)} />
        </div>
      </div>

      {/* ══════════ SCHEDULE ══════════ */}
      <div className={`page${activePage === 'schedule' ? ' on' : ''}`}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
          <div className="tabs" style={{ marginBottom: 0 }}>
            {['Today', 'Upcoming', 'All'].map((t, i) => (
              <div key={t} className={`tab${scheduleTab === i ? ' on' : ''}`} onClick={() => setScheduleTab(i)}>{t}</div>
            ))}
          </div>
          <button className="btn btn-gold btn-sm" onClick={() => onOpenModal('schedule-modal')}>+ Schedule Session</button>
        </div>

        <div className="card mb">
          <table className="tbl">
            <thead>
              <tr><th>Students</th><th>Topic</th><th>Subject</th><th>Time</th><th>Duration</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {(() => {
                const shown = scheduleTab === 0 ? todaySessions : scheduleTab === 1 ? upcomingSessions : sessions;
                if (shown.length === 0) return (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: '20px', color: 'var(--text3)', fontSize: '13px' }}>No sessions found.</td></tr>
                );
                return shown.map(s => {
                  const past = !isUpcoming(s.scheduledAt);
                  return (
                    <tr key={s.id}>
                      <td>{s.enrolledStudents?.length > 0 ? s.enrolledStudents.join(', ') : '—'}</td>
                      <td>{s.title}</td>
                      <td><span className="pill pg">{s.subject}</span></td>
                      <td>{fmtDate(s.scheduledAt)}, {fmtTime(s.scheduledAt)}</td>
                      <td>{s.duration} min</td>
                      <td><span className={`sched-status ${past ? 's-done' : 's-up'}`}>{past ? 'Completed' : 'Upcoming'}</span></td>
                      <td>
                        {past
                          ? <button className="btn btn-ghost btn-sm" onClick={() => onOpenModal('session-note-modal')}>View Notes</button>
                          : <div style={{ display: 'flex', gap: '6px' }}><button className="btn btn-ghost btn-sm" onClick={() => onOpenModal('session-note-modal')}>Add Note</button><button className="btn btn-gold btn-sm" onClick={() => onShowToast('Reminder set!')}>Remind</button></div>
                        }
                      </td>
                    </tr>
                  );
                });
              })()}
            </tbody>
          </table>
        </div>

        <div className="sh">
          <div className="sh-t">Recent Session Notes</div>
          <span style={{ fontSize: '12px', color: 'var(--text3)' }}>These feed into weekly parent reports</span>
        </div>
        <div className="card" style={{ padding: '14px 18px' }}>
          {pastSessions.length === 0 ? (
            <div style={{ padding: '12px 0', fontSize: '13px', color: 'var(--text3)' }}>No past sessions yet.</div>
          ) : pastSessions.slice(0, 2).map((s, idx) => (
            <div key={s.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '12px 0', borderBottom: idx < Math.min(pastSessions.length, 2) - 1 ? '1px solid var(--b)' : 'none' }}>
              <div className="di-av">{(s.enrolledStudents?.[0] || '?').charAt(0)}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>{s.enrolledStudents?.join(', ') || 'Students'} — {s.title}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text3)' }}>{fmtDate(s.scheduledAt)}</div>
                </div>
                <div style={{ fontSize: '12.5px', color: 'var(--text2)', marginTop: '5px', lineHeight: 1.7 }}>{s.subject} • {s.duration} min</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ══════════ MY STUDENTS ══════════ */}
      <div className={`page${activePage === 'students' ? ' on' : ''}`}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ fontSize: '13px', color: 'var(--text2)' }}>8 active students • All 1-to-1 or small groups</div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-ghost btn-sm">Filter by Exam</button>
            <button className="btn btn-gold btn-sm" onClick={() => onOpenModal('schedule-modal')}>+ New Session</button>
          </div>
        </div>
        <div className="g3 mb">
          <StudentCard av="R" name="Rahul Mehta" exam="JEE Mains 2026" week="Wk 9"
            statusBadge={<span className="sched-status s-live" style={{ fontSize: '10px' }}>● Live</span>}
            base={388} curr={462} gain={74} subjects={rahulSubjects} next="Today 2PM" flagClass="pr" flag="Phys weak"
            onDetail={() => onOpenStudentDetail('Rahul Mehta', 'R', 'JEE Mains 2026', 'Chemistry', 'Atomic Structure', 388, 462, 74)} />
          <StudentCard av="S" name="Sneha Kapoor" exam="JEE Mains 2026" week="Wk 11"
            statusBadge={<span className="sched-status s-up" style={{ fontSize: '10px' }}>Today 4PM</span>}
            base={420} curr={511} gain={91} subjects={snehaSubjects} next="Today 4PM" flagClass="pp" flag="On track"
            onDetail={() => onOpenStudentDetail('Sneha Kapoor', 'S', 'JEE Mains 2026', 'Mathematics', 'Integration', 420, 511, 91)} />
          <StudentCard av="P" name="Priya Desai" exam="NEET 2026" week="Wk 7"
            base={350} curr={418} gain={68} subjects={priyaSubjects} next="Apr 17" flagClass="pr" flag="Phys critical"
            onDetail={() => onOpenStudentDetail('Priya Desai', 'P', 'NEET 2026', 'Chemistry', 'Organic Mechanisms', 350, 418, 68)} />
          <StudentCard av="A" name="Arjun Singh" exam="JEE Mains 2026" week="Wk 8"
            base={410} curr={478} gain={68} subjects={arjunSubjects} next="Apr 18" flagClass="po" flag="Maths dip"
            onDetail={() => onOpenStudentDetail('Arjun Singh', 'A', 'JEE Mains 2026', 'Physics', 'Electrostatics', 410, 478, 68)} />
          <StudentCard av="V" name="Vanya Rao" exam="JEE Mains 2026" week="Wk 5"
            base={360} curr={402} gain={42} subjects={vanyaSubjects} next="Apr 19" flagClass="pr" flag="Early stage"
            onDetail={() => onOpenStudentDetail('Vanya Rao', 'V', 'JEE Mains 2026', 'Mathematics', 'Limits & Continuity', 360, 402, 42)} />
          <StudentCard av="K" name="Kavya Menon" exam="NEET 2026" week="Wk 12"
            base={440} curr={548} gain={108} subjects={kavyaSubjects} next="Apr 20" flagClass="pp" flag="Excellent"
            onDetail={() => onOpenStudentDetail('Kavya Menon', 'K', 'NEET 2026', 'Biology', 'Human Physiology', 440, 548, 108)} />
        </div>
      </div>

      {/* ══════════ DOUBT QUEUE ══════════ */}
      <div className={`page${activePage === 'doubts' ? ' on' : ''}`}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ fontSize: '13px', color: 'var(--text2)' }}>
            <span style={{ color: 'var(--red)', fontWeight: 600 }}>{pending.length} unanswered</span>
            {pending.length > 0 ? ` • Oldest: ${timeAgo(pending[pending.length - 1].createdAt)}.` : ' • All clear!'} Aim to reply within 4 hours.
          </div>
          <div className="tabs" style={{ marginBottom: 0 }}>
            {[`Pending (${pending.length})`, `Answered (${answered.length})`, 'All'].map((t, i) => (
              <div key={i} className={`tab${doubtsTab === i ? ' on' : ''}`} onClick={() => setDoubtsTab(i)}>{t}</div>
            ))}
          </div>
        </div>

        {(() => {
          const shown = doubtsTab === 0 ? pending : doubtsTab === 1 ? answered : doubts;
          if (shown.length === 0) return (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text3)', fontSize: '13px' }}>
              {doubtsTab === 0 ? 'No pending doubts. Great work!' : doubtsTab === 1 ? 'No answered doubts yet.' : 'No doubts yet.'}
            </div>
          );
          return shown.map(d => {
            const hrs = (Date.now() - new Date(d.createdAt)) / 3600000;
            const priority = hrs > 12 ? 'urgent' : hrs > 4 ? 'medium' : 'low';
            const subj = (d.subject || '').toLowerCase();
            const pillClass = subj.includes('chem') ? 'pg' : subj.includes('math') ? 'pn' : subj.includes('phys') ? 'pb' : subj.includes('bio') ? 'pp' : 'pn';
            return (
              <DoubtItem key={d.id} priority={priority}
                av={d.studentName.charAt(0)} name={d.studentName} time={timeAgo(d.createdAt)}
                pills={<><span className={`pill ${pillClass}`}>{d.subject}</span>{hrs > 12 && !d.answeredAt ? <span className="pill pr">Overdue</span> : null}</>}
                question={d.question}
                placeholder={`Type your reply to ${d.studentName}...`}
                extraActions={<button className="btn btn-ghost btn-sm" onClick={() => onShowToast('Marked for session discussion')}>Discuss in session</button>}
                isOpen={openReplies.has(d.id)} isReplied={repliedDoubts.has(d.id)}
                onToggle={() => toggleReply(d.id)} onReply={() => markReplied(d.id)} />
            );
          });
        })()}
      </div>

      {/* ══════════ RESOURCES ══════════ */}
      <div className={`page${activePage === 'resources' ? ' on' : ''}`}>
        <div style={{ fontSize: '13px', color: 'var(--text2)', marginBottom: '18px', background: 'var(--cream)', border: '1px solid var(--b)', borderRadius: 'var(--r)', padding: '11px 14px' }}>
          📌 Suggest a resource for a specific student → it goes to admin for approval before appearing in their library.
        </div>

        <div className="sh">
          <div className="sh-t">Suggest a Resource</div>
          <button className="btn btn-gold btn-sm" onClick={() => onOpenModal('suggest-res-modal')}>+ Suggest Resource</button>
        </div>

        <div style={{ marginBottom: '22px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.08em', fontWeight: 500, marginBottom: '10px' }}>Pending Admin Approval</div>
          <div className="res-review-item">
            <div className="rri-top">
              <div className="rri-icon">📑</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                  <div className="rri-name">Electrostatics — Previous Year Questions (2018–2024)</div>
                  <span className="pending-badge">Pending</span>
                </div>
                <div className="rri-meta">PDF • For: Rahul Mehta • Suggested Apr 14</div>
              </div>
            </div>
            <div className="rri-request">Suggested reason: "Rahul needs targeted PYQ practice on Gauss's Law and field lines — his doubt volume on this topic is high. These 40 questions map directly to his weak area."</div>
            <div style={{ fontSize: '11.5px', color: 'var(--text3)' }}>Admin will approve and notify student within 24h</div>
          </div>
          <div className="res-review-item">
            <div className="rri-top">
              <div className="rri-icon">📄</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                  <div className="rri-name">Organic Chemistry — Named Reactions Cheat Sheet</div>
                  <span className="pending-badge">Pending</span>
                </div>
                <div className="rri-meta">PDF • For: Priya Desai • Suggested Apr 13</div>
              </div>
            </div>
            <div className="rri-request">Suggested reason: "Priya confuses Markovnikov, Aldol, and Cannizzaro. This one-pager with reaction conditions side by side will help her revise faster."</div>
            <div style={{ fontSize: '11.5px', color: 'var(--text3)' }}>Admin will approve and notify student within 24h</div>
          </div>
        </div>

        <div>
          <div style={{ fontSize: '12px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.08em', fontWeight: 500, marginBottom: '10px' }}>Recently Approved</div>
          <div className="res-review-item" style={{ opacity: 0.8 }}>
            <div className="rri-top">
              <div className="rri-icon">📘</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                  <div className="rri-name">HC Verma — Electrostatics Chapter (Vol 2, Ch 29)</div>
                  <span className="approved-badge">Approved ✓</span>
                </div>
                <div className="rri-meta">PDF • For: Arjun Singh • Approved Apr 12 • Student notified</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════ ASSIGN TESTS ══════════ */}
      <div className={`page${activePage === 'tests' ? ' on' : ''}`}>
        <div style={{ fontSize: '13px', color: 'var(--text2)', marginBottom: '18px', background: 'var(--cream)', border: '1px solid var(--b)', borderRadius: 'var(--r)', padding: '11px 14px' }}>
          📌 Suggest a test for a student → goes to admin for approval. Student sees it as "Mentor-assigned" once approved.
        </div>

        <div className="sh">
          <div className="sh-t">Suggest a Test for a Student</div>
          <button className="btn btn-gold btn-sm" onClick={() => onOpenModal('assign-test-modal')}>+ Suggest Test</button>
        </div>

        <div style={{ marginBottom: '22px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.08em', fontWeight: 500, marginBottom: '10px' }}>Pending Admin Approval</div>
          <div className="card mb" style={{ padding: '16px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <div className="di-av">R</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                  <div>
                    <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text)' }}>Rahul Mehta — Electrostatics Targeted Test</div>
                    <div style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '2px' }}>25 questions • 45 min • Suggested Apr 14</div>
                  </div>
                  <span className="pending-badge">Pending Admin</span>
                </div>
                <div style={{ fontSize: '12.5px', color: 'var(--text2)', marginTop: '8px', background: 'var(--cream2)', padding: '9px 11px', borderRadius: 'var(--r)', borderLeft: '3px solid var(--gold)' }}>
                  Reason: "Rahul's Gauss's Law accuracy is at 31%. This test covers exactly his gap — 15 questions on field lines + 10 on potential. Needs to do this before our Apr 18 session."
                </div>
              </div>
            </div>
          </div>
        </div>

        <div>
          <div style={{ fontSize: '12px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.08em', fontWeight: 500, marginBottom: '10px' }}>Recently Approved &amp; Student Results</div>
          <div className="card" style={{ padding: '14px 18px' }}>
            <table className="tbl">
              <thead><tr><th>Student</th><th>Test</th><th>Assigned</th><th>Completed</th><th>Score</th><th>vs Target</th></tr></thead>
              <tbody>
                <tr key="test-sneha"><td><div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}><div className="di-av">S</div>Sneha Kapoor</div></td><td>Integration — Substitution Test</td><td>Apr 10</td><td>Apr 11</td><td><strong style={{ color: 'var(--green)' }}>68%</strong></td><td><span className="pill pp">+11%</span></td></tr>
                <tr key="test-priya"><td><div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}><div className="di-av">P</div>Priya Desai</div></td><td>Organic Chemistry — Reactions</td><td>Apr 9</td><td>Apr 10</td><td><strong style={{ color: 'var(--orange)' }}>55%</strong></td><td><span className="pill po">Needs work</span></td></tr>
                <tr key="test-arjun"><td><div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}><div className="di-av">A</div>Arjun Singh</div></td><td>Electrostatics — Full Chapter</td><td>Apr 8</td><td>Apr 9</td><td><strong style={{ color: 'var(--gold)' }}>66%</strong></td><td><span className="pill pg">+8%</span></td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ══════════ WEEKLY REPORTS ══════════ */}
      <div className={`page${activePage === 'reports' ? ' on' : ''}`}>
        <div style={{ background: 'var(--gold-dim)', border: '1px solid var(--gold-b)', borderRadius: 'var(--rl)', padding: '14px 18px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '18px' }}>📅</span>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>Weekly reports are due this Sunday (Apr 20)</div>
            <div style={{ fontSize: '12px', color: 'var(--text2)' }}>3 of 8 reports drafted. Parents receive these every Sunday morning — your notes from sessions feed directly into them.</div>
          </div>
          <button className="btn btn-gold btn-sm" style={{ marginLeft: 'auto', flexShrink: 0 }} onClick={() => onShowToast('Sending all completed reports...')}>Send All Ready</button>
        </div>

        <div className="sh"><div className="sh-t">Draft: Rahul Mehta — Week 9 Report</div><span className="pill po">In Progress</span></div>

        <div className="report-section">
          <div className="rs-student">
            <div className="di-av" style={{ width: '40px', height: '40px', fontSize: '15px' }}>R</div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)' }}>Rahul Mehta</div>
              <div style={{ fontSize: '12px', color: 'var(--text3)' }}>JEE Mains 2026 • Parent: Mr. Suresh Mehta</div>
            </div>
            <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
              <div style={{ fontSize: '11px', color: 'var(--text3)' }}>Score this week</div>
              <div style={{ fontFamily: 'var(--fs)', fontSize: '22px', fontWeight: 700, color: 'var(--gold)' }}>462 <span style={{ fontSize: '14px', color: 'var(--green)' }}>+18</span></div>
            </div>
          </div>

          <div className="week-report-row"><div className="wr-label">Sessions done</div><div className="wr-val">4 of 4 scheduled • 100% attendance</div></div>
          <div className="week-report-row"><div className="wr-label">Topics covered</div><div className="wr-val">Chemical Bonding, VSEPR Theory, Atomic Structure (Bohr), Quantum Numbers</div></div>
          <div className="week-report-row">
            <div className="wr-label">Subject scores</div>
            <div className="wr-val">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><span style={{ width: '60px', fontSize: '12px', color: 'var(--text3)' }}>Chemistry</span><div className="pbar" style={{ width: '140px' }}><div className="pbar-inner pb-gold" style={{ width: '72%' }}></div></div><span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--gold)', marginLeft: '6px' }}>72% <span style={{ color: 'var(--green)', fontSize: '11px' }}>+8%</span></span></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><span style={{ width: '60px', fontSize: '12px', color: 'var(--text3)' }}>Mathematics</span><div className="pbar" style={{ width: '140px' }}><div className="pbar-inner pb-green" style={{ width: '80%' }}></div></div><span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--green)', marginLeft: '6px' }}>80% <span style={{ color: 'var(--green)', fontSize: '11px' }}>+4%</span></span></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><span style={{ width: '60px', fontSize: '12px', color: 'var(--text3)' }}>Physics</span><div className="pbar" style={{ width: '140px' }}><div className="pbar-inner pb-orange" style={{ width: '58%' }}></div></div><span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--orange)', marginLeft: '6px' }}>58% <span style={{ color: 'var(--red)', fontSize: '11px' }}>−2%</span></span></div>
              </div>
            </div>
          </div>
          <div className="week-report-row">
            <div className="wr-label">Mentor's note</div>
            <div className="wr-val">
              <textarea className="sn-textarea" id="mentor-note-rahul" style={{ width: '100%', minHeight: '90px' }} placeholder="Write your note for Rahul's parents — be honest and specific. This is what they're paying for..." defaultValue="Rahul had a strong week in Chemistry — quantum numbers are now well-understood and atomic structure is becoming a strength. Mathematics is progressing steadily. The area needing attention is Physics: electrostatics accuracy dropped slightly this week due to confusion around Gauss's Law applications. We have scheduled a targeted session on Apr 18 specifically to address this. Overall trajectory remains on track." />
              <div className="sn-hint">This will be sent to Rahul's parents on Sunday morning.</div>
            </div>
          </div>
          <div className="week-report-row">
            <div className="wr-label">Next week plan</div>
            <div className="wr-val">
              <textarea className="sn-textarea" style={{ width: '100%', minHeight: '60px' }} defaultValue="Electrostatics deep-dive (Apr 18) • Continue Atomic Structure • Begin Chemical Equilibrium basics" />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '14px' }}>
            <button className="btn btn-ghost btn-sm">Save Draft</button>
            <button className="btn btn-gold btn-sm" onClick={() => onShowToast('Report queued for Sunday delivery to Mr. Suresh Mehta ✓')}>Mark Ready to Send</button>
          </div>
        </div>

        <div className="sh" style={{ marginTop: '8px' }}><div className="sh-t">All Students — Report Status</div></div>
        <div className="card" style={{ padding: '14px 18px' }}>
          <table className="tbl">
            <thead><tr><th>Student</th><th>Exam</th><th>Score This Week</th><th>Report Status</th><th></th></tr></thead>
            <tbody>
              <tr key="rep-rahul"><td><div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}><div className="di-av">R</div>Rahul Mehta</div></td><td>JEE Mains</td><td><span style={{ color: 'var(--gold)', fontWeight: 600 }}>462 <span style={{ color: 'var(--green)', fontSize: '11px' }}>+18</span></span></td><td><span className="pill po">In Progress</span></td><td><button className="btn btn-ghost btn-sm">Edit</button></td></tr>
              <tr key="rep-sneha"><td><div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}><div className="di-av">S</div>Sneha Kapoor</div></td><td>JEE Mains</td><td><span style={{ color: 'var(--green)', fontWeight: 600 }}>511 <span style={{ color: 'var(--green)', fontSize: '11px' }}>+25</span></span></td><td><span className="pill pp">Ready ✓</span></td><td><button className="btn btn-ghost btn-sm">Review</button></td></tr>
              <tr key="rep-priya"><td><div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}><div className="di-av">P</div>Priya Desai</div></td><td>NEET</td><td><span style={{ color: 'var(--orange)', fontWeight: 600 }}>418 <span style={{ color: 'var(--green)', fontSize: '11px' }}>+12</span></span></td><td><span className="pill pp">Ready ✓</span></td><td><button className="btn btn-ghost btn-sm">Review</button></td></tr>
              <tr key="rep-arjun"><td><div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}><div className="di-av">A</div>Arjun Singh</div></td><td>JEE Mains</td><td><span style={{ color: 'var(--orange)', fontWeight: 600 }}>478 <span style={{ color: 'var(--green)', fontSize: '11px' }}>+8</span></span></td><td><span className="pill pn">Not started</span></td><td><button className="btn btn-gold btn-sm" onClick={() => onShowToast('Opening report for Arjun...')}>Draft Now</button></td></tr>
              <tr key="rep-vanya"><td><div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}><div className="di-av">V</div>Vanya Rao</div></td><td>JEE Mains</td><td><span style={{ color: 'var(--orange)', fontWeight: 600 }}>402 <span style={{ color: 'var(--green)', fontSize: '11px' }}>+14</span></span></td><td><span className="pill pn">Not started</span></td><td><button className="btn btn-gold btn-sm" onClick={() => onShowToast('Opening report for Vanya...')}>Draft Now</button></td></tr>
              <tr key="rep-kavya"><td><div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}><div className="di-av">K</div>Kavya Menon</div></td><td>NEET</td><td><span style={{ color: 'var(--green)', fontWeight: 600 }}>548 <span style={{ color: 'var(--green)', fontSize: '11px' }}>+18</span></span></td><td><span className="pill pn">Not started</span></td><td><button className="btn btn-gold btn-sm" onClick={() => onShowToast('Opening report for Kavya...')}>Draft Now</button></td></tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ══════════ PARENT FEEDBACK ══════════ */}
      <div className={`page${activePage === 'feedback' ? ' on' : ''}`}>
        <div style={{ fontSize: '13px', color: 'var(--text2)', marginBottom: '18px' }}>Parent feedback collected after each weekly report. Read them — they tell you what matters most to each family.</div>

        <div className="feedback-item">
          <div className="fi-top">
            <div>
              <div className="fi-student">Rahul Mehta's Parents</div>
              <div className="fi-parent">Mr. Suresh Mehta • Apr 13, after Week 8 report</div>
            </div>
            <div style={{ textAlign: 'right' }}><div className="fi-stars">★★★★★</div><div style={{ fontSize: '10px', color: 'var(--text3)', marginTop: '2px' }}>5 / 5</div></div>
          </div>
          <div className="fi-quote">"Ajay's weekly notes are the most useful thing about this program. We finally understand exactly where Rahul stands each week — not just a number, but what actually happened in the sessions. The Physics gap you flagged early helped us have a real conversation with Rahul at home. Thank you."</div>
          <div className="fi-date">Week 8 • Received Apr 13</div>
        </div>

        <div className="feedback-item">
          <div className="fi-top">
            <div>
              <div className="fi-student">Sneha Kapoor's Parents</div>
              <div className="fi-parent">Mrs. Anita Kapoor • Apr 13, after Week 10 report</div>
            </div>
            <div style={{ textAlign: 'right' }}><div className="fi-stars">★★★★★</div><div style={{ fontSize: '10px', color: 'var(--text3)', marginTop: '2px' }}>5 / 5</div></div>
          </div>
          <div className="fi-quote">"Sneha has gone from dreading Maths to looking forward to her sessions. I asked her what changed and she said 'Ajay explains it like it makes sense.' The score going from 420 to 511 in 11 weeks is proof. We are extremely happy."</div>
          <div className="fi-date">Week 10 • Received Apr 13</div>
        </div>

        <div className="feedback-item">
          <div className="fi-top">
            <div>
              <div className="fi-student">Priya Desai's Parents</div>
              <div className="fi-parent">Mr. Nilesh Desai • Apr 6, after Week 6 report</div>
            </div>
            <div style={{ textAlign: 'right' }}><div className="fi-stars">★★★★☆</div><div style={{ fontSize: '10px', color: 'var(--text3)', marginTop: '2px' }}>4 / 5</div></div>
          </div>
          <div className="fi-quote">"Progress in Biology and Chemistry is clear. Physics is still a concern for us — Priya mentioned she finds it hard to follow when the pace increases. Can the Physics sessions be slightly slower in the beginning? She understands when given time."</div>
          <div className="fi-date">Week 6 • Received Apr 6</div>
          <div style={{ marginTop: '12px', background: 'var(--gold-dim)', border: '1px solid var(--gold-b)', borderRadius: 'var(--r)', padding: '10px 12px', fontSize: '12.5px', color: 'var(--text2)' }}>
            <strong style={{ color: 'var(--text)' }}>Action taken:</strong> Reduced Physics pace for Priya — spending more time on intuition building before formula application. Will note in Week 7 report.
          </div>
        </div>
      </div>

    </div>
  );
};

export default FacultyContent;
