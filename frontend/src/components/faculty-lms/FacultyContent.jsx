import React, { useState } from 'react';

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
      {statusBadge && <div style={{ marginLeft: 'auto' }}>{statusBadge}</div>}
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

const FacultyContent = ({ activePage, onOpenModal, onOpenStudentDetail, onNav, onShowToast }) => {
  const [scheduleTab, setScheduleTab] = useState(0);
  const [doubtsTab, setDoubtsTab] = useState(0);
  const [openReplies, setOpenReplies] = useState(new Set());
  const [repliedDoubts, setRepliedDoubts] = useState(new Set());

  const toggleReply = (i) => {
    setOpenReplies(prev => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  };

  const markReplied = (i) => {
    setRepliedDoubts(prev => new Set([...prev, i]));
    setOpenReplies(prev => { const next = new Set(prev); next.delete(i); return next; });
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
        <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.1em', fontWeight: 500, marginBottom: '4px' }}>Wednesday, 15 April 2026</div>
            <div style={{ fontFamily: 'var(--fs)', fontSize: '23px', fontWeight: 700, color: 'var(--text)' }}>Good morning, Ajay.</div>
            <div style={{ fontSize: '13.5px', color: 'var(--text2)', marginTop: '3px' }}>You have <strong style={{ color: 'var(--text)' }}>2 sessions</strong> today and <strong style={{ color: 'var(--red)' }}>5 doubts</strong> pending reply.</div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-ghost btn-sm" onClick={() => onNav('reports')}>Weekly Report Due Sunday →</button>
            <button className="btn btn-gold btn-sm" onClick={() => onOpenModal('schedule-modal')}>+ Schedule Session</button>
          </div>
        </div>

        <div className="g4 mb">
          <div className="stat sa-navy">
            <div className="stat-l">Active Students</div>
            <div className="stat-v">8</div>
            <div className="stat-n neu">2 new this month</div>
          </div>
          <div className="stat sa-red">
            <div className="stat-l">Doubts Pending</div>
            <div className="stat-v">5</div>
            <div className="stat-n bad">Oldest: 18h ago</div>
          </div>
          <div className="stat sa-gold">
            <div className="stat-l">Sessions This Week</div>
            <div className="stat-v">11</div>
            <div className="stat-n up">↑ vs 9 last week</div>
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
            <div className="sched-item">
              <div className="sched-time">2:00 PM</div>
              <div className="sched-dot" style={{ background: 'var(--green)', boxShadow: '0 0 0 3px rgba(34,197,94,0.2)' }}></div>
              <div className="sched-info">
                <div className="sched-name">Rahul M. — Atomic Structure</div>
                <div className="sched-meta">Chemistry • 60 min • JEE Mains</div>
              </div>
              <div className="sched-status s-live">● Live Now</div>
            </div>
            <div className="sched-item">
              <div className="sched-time">4:00 PM</div>
              <div className="sched-dot" style={{ background: 'var(--gold)' }}></div>
              <div className="sched-info">
                <div className="sched-name">Sneha K. — Integration (By Parts)</div>
                <div className="sched-meta">Mathematics • 75 min • JEE Mains</div>
              </div>
              <div className="sched-status s-up">Upcoming</div>
            </div>
            <div style={{ padding: '10px 0 2px', fontSize: '12px', color: 'var(--text3)', textAlign: 'center' }}>No more sessions today</div>
          </div>

          <div className="card">
            <div className="sh">
              <div className="sh-t">Doubts Needing Reply</div>
              <span className="sh-a" onClick={() => onNav('doubts')}>Reply all →</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '10px 12px', background: 'var(--rdim)', borderRadius: 'var(--r)', border: '1px solid rgba(239,68,68,0.2)', cursor: 'pointer' }} onClick={() => onNav('doubts')}>
                <div className="di-av">R</div>
                <div>
                  <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text)' }}>Rahul M. <span style={{ color: 'var(--red)', fontSize: '10px', fontWeight: 400 }}>18h ago</span></div>
                  <div style={{ fontSize: '12.5px', color: 'var(--text2)' }}>How does Gauss's law apply when charge is outside the surface?</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '10px 12px', background: 'var(--odim)', borderRadius: 'var(--r)', border: '1px solid rgba(249,115,22,0.2)', cursor: 'pointer' }} onClick={() => onNav('doubts')}>
                <div className="di-av">S</div>
                <div>
                  <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text)' }}>Sneha K. <span style={{ color: 'var(--orange)', fontSize: '10px', fontWeight: 400 }}>6h ago</span></div>
                  <div style={{ fontSize: '12.5px', color: 'var(--text2)' }}>Integration by parts — when to choose u and v?</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '10px 12px', background: 'var(--cream2)', borderRadius: 'var(--r)', border: '1px solid var(--b)', cursor: 'pointer' }} onClick={() => onNav('doubts')}>
                <div className="di-av">P</div>
                <div>
                  <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text)' }}>Priya D. <span style={{ color: 'var(--text3)', fontSize: '10px', fontWeight: 400 }}>2h ago</span></div>
                  <div style={{ fontSize: '12.5px', color: 'var(--text2)' }}>Markovnikov vs anti-Markovnikov — explain with example</div>
                </div>
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--text3)', textAlign: 'center', paddingTop: '4px' }}>+2 more doubts pending</div>
            </div>
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
            {['Today', 'This Week', 'All'].map((t, i) => (
              <div key={t} className={`tab${scheduleTab === i ? ' on' : ''}`} onClick={() => setScheduleTab(i)}>{t}</div>
            ))}
          </div>
          <button className="btn btn-gold btn-sm" onClick={() => onOpenModal('schedule-modal')}>+ Schedule Session</button>
        </div>

        <div className="card mb">
          <table className="tbl">
            <thead>
              <tr><th>Student</th><th>Topic</th><th>Subject</th><th>Time</th><th>Duration</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              <tr key="sched-rahul">
                <td><div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div className="di-av">R</div>Rahul Mehta</div></td>
                <td>Atomic Structure — Quantum Numbers</td>
                <td><span className="pill pg">Chemistry</span></td>
                <td>Today, 2:00 PM</td><td>60 min</td>
                <td><span className="sched-status s-live">● Live Now</span></td>
                <td><button className="btn btn-green btn-sm" onClick={() => onShowToast('Launching session...')}>Join</button></td>
              </tr>
              <tr key="sched-sneha">
                <td><div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div className="di-av">S</div>Sneha Kapoor</div></td>
                <td>Integration — By Parts</td>
                <td><span className="pill pn">Mathematics</span></td>
                <td>Today, 4:00 PM</td><td>75 min</td>
                <td><span className="sched-status s-up">Upcoming</span></td>
                <td><div style={{ display: 'flex', gap: '6px' }}><button className="btn btn-ghost btn-sm" onClick={() => onOpenModal('session-note-modal')}>Add Note</button><button className="btn btn-gold btn-sm" onClick={() => onShowToast('Reminder set!')}>Remind</button></div></td>
              </tr>
              <tr key="sched-priya">
                <td><div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div className="di-av">P</div>Priya Desai</div></td>
                <td>Organic Chemistry — Reaction Mechanisms</td>
                <td><span className="pill pg">Chemistry</span></td>
                <td>Apr 17, 3:00 PM</td><td>90 min</td>
                <td><span className="sched-status s-up">Upcoming</span></td>
                <td><button className="btn btn-ghost btn-sm">Details</button></td>
              </tr>
              <tr key="sched-arjun">
                <td><div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div className="di-av">A</div>Arjun Singh</div></td>
                <td>Electrostatics — Gauss's Law</td>
                <td><span className="pill pn">Physics</span></td>
                <td>Apr 18, 5:00 PM</td><td>60 min</td>
                <td><span className="sched-status s-up">Upcoming</span></td>
                <td><button className="btn btn-ghost btn-sm">Details</button></td>
              </tr>
              <tr key="sched-vanya">
                <td><div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div className="di-av">V</div>Vanya Rao</div></td>
                <td>Limits &amp; Continuity — L'Hôpital's Rule</td>
                <td><span className="pill pn">Mathematics</span></td>
                <td>Apr 19, 6:00 PM</td><td>60 min</td>
                <td><span className="sched-status s-up">Upcoming</span></td>
                <td><button className="btn btn-ghost btn-sm">Details</button></td>
              </tr>
              <tr key="sched-rahul2">
                <td><div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div className="di-av">R</div>Rahul Mehta</div></td>
                <td>Chemical Bonding — VSEPR Theory</td>
                <td><span className="pill pg">Chemistry</span></td>
                <td>Apr 12, 2:00 PM</td><td>60 min</td>
                <td><span className="sched-status s-done">Completed</span></td>
                <td><button className="btn btn-ghost btn-sm" onClick={() => onOpenModal('session-note-modal')}>View Notes</button></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="sh">
          <div className="sh-t">Recent Session Notes</div>
          <span style={{ fontSize: '12px', color: 'var(--text3)' }}>These feed into weekly parent reports</span>
        </div>
        <div className="card" style={{ padding: '14px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '12px 0', borderBottom: '1px solid var(--b)' }}>
            <div className="di-av">R</div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>Rahul Mehta — Chemical Bonding</div>
                <div style={{ fontSize: '11px', color: 'var(--text3)' }}>Apr 12</div>
              </div>
              <div style={{ fontSize: '12.5px', color: 'var(--text2)', marginTop: '5px', lineHeight: 1.7, fontStyle: 'italic' }}>"Good session. VSEPR shapes are now clear. Struggled with bond angle exceptions in NH₃ vs H₂O — covered thoroughly. Next: quantum numbers and orbital filling."</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '12px 0' }}>
            <div className="di-av">S</div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>Sneha Kapoor — Integration Substitution</div>
                <div style={{ fontSize: '11px', color: 'var(--text3)' }}>Apr 11</div>
              </div>
              <div style={{ fontSize: '12.5px', color: 'var(--text2)', marginTop: '5px', lineHeight: 1.7, fontStyle: 'italic' }}>"Excellent session. Accuracy moved to 68%. Substitution method is now solid. Moving to integration by parts next — she's ready for it."</div>
            </div>
          </div>
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
          <div style={{ fontSize: '13px', color: 'var(--text2)' }}><span style={{ color: 'var(--red)', fontWeight: 600 }}>5 unanswered</span> • Oldest: 18 hours ago. Aim to reply within 4 hours.</div>
          <div className="tabs" style={{ marginBottom: 0 }}>
            {['Pending (5)', 'Answered', 'All'].map((t, i) => (
              <div key={t} className={`tab${doubtsTab === i ? ' on' : ''}`} onClick={() => setDoubtsTab(i)}>{t}</div>
            ))}
          </div>
        </div>

        <DoubtItem idx={0} priority="urgent" av="R" name="Rahul Mehta" time="18 hours ago"
          pills={<><span className="pill pg">Chemistry</span><span className="pill pr">Overdue</span></>}
          question="How does Gauss's law apply when the charge is placed outside the Gaussian surface? The net flux should be zero but the field isn't — I'm confused."
          placeholder="Type your reply — Rahul will see this immediately..."
          extraActions={<>
            <button className="btn btn-ghost btn-sm" onClick={() => onShowToast('Marked for session discussion')}>Discuss in session</button>
            <button className="btn btn-ghost btn-sm" onClick={() => onOpenModal('assign-test-modal')}>Assign practice Q</button>
          </>}
          isOpen={openReplies.has(0)} isReplied={repliedDoubts.has(0)}
          onToggle={() => toggleReply(0)} onReply={() => markReplied(0)} />

        <DoubtItem idx={1} priority="medium" av="S" name="Sneha Kapoor" time="6 hours ago"
          pills={<span className="pill pn">Mathematics</span>}
          question="Integration by parts — I get the formula ∫u dv = uv − ∫v du, but I don't know when to choose u and when to choose dv. Is there a rule?"
          placeholder="Tip: mention the ILATE rule — Sneha will appreciate the mnemonic..."
          extraActions={<button className="btn btn-ghost btn-sm" onClick={() => onShowToast("Flagged for today's 4PM session")}>Flag for today's session</button>}
          isOpen={openReplies.has(1)} isReplied={repliedDoubts.has(1)}
          onToggle={() => toggleReply(1)} onReply={() => markReplied(1)} />

        <DoubtItem idx={2} priority="medium" av="P" name="Priya Desai" time="2 hours ago"
          pills={<span className="pill pg">Chemistry</span>}
          question="Can you explain the difference between Markovnikov and anti-Markovnikov addition with a real example? I keep mixing them up in tests."
          placeholder="Write reply..."
          extraActions={<button className="btn btn-ghost btn-sm" onClick={() => onShowToast('Assigned practice question')}>Assign practice Q</button>}
          isOpen={openReplies.has(2)} isReplied={repliedDoubts.has(2)}
          onToggle={() => toggleReply(2)} onReply={() => markReplied(2)} />

        <DoubtItem idx={3} priority="low" av="A" name="Arjun Singh" time="1 hour ago"
          pills={<span className="pill pb">Physics</span>}
          question="In the potential energy diagram for SHM, at mean position why is KE maximum but PE minimum? The formula says PE = ½kx² — so at x=0, PE=0, that makes sense but I want to understand it intuitively."
          placeholder="Write reply..."
          extraActions={<button className="btn btn-ghost btn-sm" onClick={() => onShowToast('Marked for session discussion')}>Discuss in session</button>}
          isOpen={openReplies.has(3)} isReplied={repliedDoubts.has(3)}
          onToggle={() => toggleReply(3)} onReply={() => markReplied(3)} />

        <DoubtItem idx={4} priority="low" av="V" name="Vanya Rao" time="30 min ago"
          pills={<span className="pill pn">Mathematics</span>}
          question="Is there a shortcut to find limits using L'Hôpital's rule only, or do I have to always check the 0/0 form first?"
          placeholder="Write reply..."
          extraActions={null}
          isOpen={openReplies.has(4)} isReplied={repliedDoubts.has(4)}
          onToggle={() => toggleReply(4)} onReply={() => markReplied(4)} />
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
              <textarea className="sn-textarea" style={{ width: '100%', minHeight: '90px' }} defaultValue="Rahul had a strong week in Chemistry — quantum numbers are now well-understood and atomic structure is becoming a strength. Mathematics is progressing steadily. The area needing attention is Physics: electrostatics accuracy dropped slightly this week due to confusion around Gauss's Law applications. We have scheduled a targeted session on Apr 18 specifically to address this. Overall trajectory remains on track." />
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
