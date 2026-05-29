import React, { useState } from 'react';

const FacultyModals = ({ openModal, onClose, onShowToast, toast, detailOpen, selectedStudent, onCloseDetail, onOpenModal, onNav }) => {
  const isOpen = (id) => openModal === id ? ' open' : '';
  const s = selectedStudent || {};
  const [broadcastText, setBroadcastText] = useState('');
  const [broadcasting, setBroadcasting] = useState(false);

  const sendBroadcast = async () => {
    if (!broadcastText.trim()) { onShowToast('Please type a message first'); return; }
    const token = localStorage.getItem('token');
    setBroadcasting(true);
    try {
      const res = await fetch('http://localhost:5000/api/faculty/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message: broadcastText.trim() }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setBroadcastText('');
      onClose();
      onShowToast(`Message sent to ${data.notified} student${data.notified !== 1 ? 's' : ''} ✓`);
    } catch {
      onShowToast('Failed to send message. Try again.');
    } finally {
      setBroadcasting(false);
    }
  };

  return (
    <>
      {/* Student Detail Panel */}
      <div className={`detail-panel${detailOpen ? ' open' : ''}`}>
        <div className="dp-header" style={{ position: 'relative' }}>
          <div className="dp-close" onClick={onCloseDetail}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div className="sc-av" style={{ width: '48px', height: '48px', fontSize: '19px' }}>{s.init}</div>
            <div>
              <div style={{ fontFamily: 'var(--fs)', fontSize: '18px', fontWeight: 700, color: 'var(--inv)' }}>{s.name}</div>
              <div style={{ fontSize: '12px', color: 'var(--inv3)' }}>{s.exam}</div>
            </div>
          </div>
        </div>
        <div className="dp-content">
          <div className="journey-mini">
            <div style={{ fontSize: '11px', color: 'var(--inv3)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '10px', fontWeight: 500 }}>Score Journey</div>
            <div className="jm-scores">
              <div className="jm-point">
                <div className="jm-val" style={{ color: 'var(--inv2)' }}>{s.base}</div>
                <div className="jm-label">Day 1</div>
              </div>
              <div className="jm-point">
                <div className="jm-val" style={{ color: 'var(--gold)' }}>{s.curr}</div>
                <div className="jm-label">Today</div>
              </div>
              <div className="jm-point">
                <div className="jm-val" style={{ color: 'var(--green)' }}>{s.gain ? `+${s.gain}` : ''}</div>
                <div className="jm-label">Gained</div>
              </div>
            </div>
          </div>

          <div className="card mb" style={{ padding: '14px 16px' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: '10px' }}>Current Focus</div>
            <div style={{ fontSize: '13.5px', fontWeight: 500, color: 'var(--text)' }}>{s.topic}</div>
            <div style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '3px' }}>{s.subject}</div>
          </div>

          <div className="card mb" style={{ padding: '14px 16px' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: '12px' }}>Quick Actions</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button className="btn btn-gold btn-full" onClick={() => { onOpenModal('schedule-modal'); onCloseDetail(); }}>+ Schedule Session</button>
              <button className="btn btn-navy btn-full" onClick={() => { onOpenModal('assign-test-modal'); onCloseDetail(); }}>Suggest a Test</button>
              <button className="btn btn-ghost btn-full" onClick={() => { onOpenModal('suggest-res-modal'); onCloseDetail(); }}>Suggest Resource</button>
              <button className="btn btn-ghost btn-full" onClick={() => { onNav('reports'); onCloseDetail(); }}>Draft Weekly Report</button>
            </div>
          </div>

          <div className="card" style={{ padding: '14px 16px' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: '10px' }}>Session Note</div>
            <textarea className="sn-textarea" rows="3" placeholder="Quick note after this student's last session — feeds into their weekly report..."></textarea>
            <button className="btn btn-gold btn-sm" style={{ marginTop: '8px', width: '100%', justifyContent: 'center' }} onClick={() => { onShowToast('Note saved ✓'); onCloseDetail(); }}>Save Note</button>
          </div>
        </div>
      </div>
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,31,61,0.3)', display: detailOpen ? 'block' : 'none', zIndex: 140 }} onClick={onCloseDetail} />

      {/* Schedule Modal */}
      <div className={`overlay${isOpen('schedule-modal')}`} onClick={e => e.target.classList.contains('overlay') && onClose()}>
        <div className="modal">
          <div className="mt">Schedule a Session</div>
          <div className="ms">Set the time, topic, and student. Student will be notified automatically.</div>
          <div className="fg"><label>Student</label>
            <select className="finput"><option>Rahul Mehta</option><option>Sneha Kapoor</option><option>Priya Desai</option><option>Arjun Singh</option><option>Vanya Rao</option><option>Kavya Menon</option></select>
          </div>
          <div className="fg"><label>Topic</label><input className="finput" type="text" placeholder="e.g. Electrostatics — Gauss's Law" /></div>
          <div className="fg"><label>Subject</label>
            <select className="finput"><option>Chemistry</option><option>Mathematics</option><option>Physics</option><option>Biology</option></select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="fg"><label>Date</label><input className="finput" type="date" /></div>
            <div className="fg"><label>Time</label><input className="finput" type="time" /></div>
          </div>
          <div className="fg"><label>Duration</label>
            <select className="finput"><option>45 minutes</option><option>60 minutes</option><option>75 minutes</option><option>90 minutes</option></select>
          </div>
          <div className="ma">
            <button className="btn btn-ghost btn-sm" onClick={onClose}>Cancel</button>
            <button className="btn btn-gold btn-sm" onClick={() => { onClose(); onShowToast('Session scheduled. Student notified ✓'); }}>Schedule →</button>
          </div>
        </div>
      </div>

      {/* Quick Note Modal */}
      <div className={`overlay${isOpen('quick-note-modal')}`} onClick={e => e.target.classList.contains('overlay') && onClose()}>
        <div className="modal">
          <div className="mt">Quick Session Note</div>
          <div className="ms">Notes feed into weekly parent reports. Be specific — vague notes make weak reports.</div>
          <div className="fg"><label>Student</label>
            <select className="finput"><option>Rahul Mehta</option><option>Sneha Kapoor</option><option>Priya Desai</option><option>Arjun Singh</option></select>
          </div>
          <div className="fg"><label>Session Note</label>
            <textarea className="finput" rows="4" placeholder="What happened in the session? What clicked, what didn't, what's next?"></textarea>
          </div>
          <div className="ma">
            <button className="btn btn-ghost btn-sm" onClick={onClose}>Cancel</button>
            <button className="btn btn-gold btn-sm" onClick={() => { onClose(); onShowToast('Note saved. Will appear in Sunday report ✓'); }}>Save Note →</button>
          </div>
        </div>
      </div>

      {/* Session Note Modal */}
      <div className={`overlay${isOpen('session-note-modal')}`} onClick={e => e.target.classList.contains('overlay') && onClose()}>
        <div className="modal">
          <div className="mt">Session Notes — Sneha Kapoor</div>
          <div className="ms">Integration — By Parts • Today, 4:00 PM</div>
          <div className="fg"><label>What was covered</label>
            <input className="finput" type="text" defaultValue="Integration — By Parts & ILATE Rule" />
          </div>
          <div className="fg"><label>What went well</label>
            <textarea className="finput" rows="2" defaultValue="Substitution method now solid. ILATE rule understood quickly."></textarea>
          </div>
          <div className="fg"><label>What needs work</label>
            <textarea className="finput" rows="2" defaultValue="Choosing u vs dv in non-standard forms — needs more practice."></textarea>
          </div>
          <div className="fg"><label>Next session plan</label>
            <input className="finput" type="text" defaultValue="Integration — Definite Integrals and limits applications" />
          </div>
          <div className="ma">
            <button className="btn btn-ghost btn-sm" onClick={onClose}>Cancel</button>
            <button className="btn btn-gold btn-sm" onClick={() => { onClose(); onShowToast('Session notes saved ✓'); }}>Save Notes →</button>
          </div>
        </div>
      </div>

      {/* Suggest Resource Modal */}
      <div className={`overlay${isOpen('suggest-res-modal')}`} onClick={e => e.target.classList.contains('overlay') && onClose()}>
        <div className="modal">
          <div className="mt">Suggest a Resource</div>
          <div className="ms">Your suggestion goes to admin for review before the student sees it.</div>
          <div className="fg"><label>Student</label>
            <select className="finput"><option>Rahul Mehta</option><option>Sneha Kapoor</option><option>Priya Desai</option><option>Arjun Singh</option><option>All students</option></select>
          </div>
          <div className="fg"><label>Resource Name</label><input className="finput" type="text" placeholder="e.g. HC Verma — Chapter 29 Electrostatics" /></div>
          <div className="fg"><label>Resource Type</label>
            <select className="finput"><option>PDF / Notes</option><option>Practice Questions</option><option>PYQ Paper</option><option>Formula Sheet</option><option>Video Link</option></select>
          </div>
          <div className="fg"><label>Why does this student need this?</label>
            <textarea className="finput" rows="3" placeholder="Be specific — admin needs your reasoning to approve quickly..."></textarea>
          </div>
          <div className="approval-notice">⏳ Admin will review and approve within 24h. Student notified on approval.</div>
          <div className="ma">
            <button className="btn btn-ghost btn-sm" onClick={onClose}>Cancel</button>
            <button className="btn btn-gold btn-sm" onClick={() => { onClose(); onShowToast('Resource suggestion sent for admin approval ✓'); }}>Send for Approval →</button>
          </div>
        </div>
      </div>

      {/* Assign Test Modal */}
      <div className={`overlay${isOpen('assign-test-modal')}`} onClick={e => e.target.classList.contains('overlay') && onClose()}>
        <div className="modal">
          <div className="mt">Suggest a Test</div>
          <div className="ms">Your suggestion goes to admin. Once approved it appears as a "Mentor-assigned" test for the student.</div>
          <div className="fg"><label>Student</label>
            <select className="finput"><option>Rahul Mehta</option><option>Sneha Kapoor</option><option>Priya Desai</option><option>Arjun Singh</option></select>
          </div>
          <div className="fg"><label>Test Topic / Name</label><input className="finput" type="text" placeholder="e.g. Electrostatics — Targeted 25Q Test" /></div>
          <div className="fg"><label>Why is this test needed now?</label>
            <textarea className="finput" rows="3" placeholder="Admin needs your reasoning — what gap does this test address?"></textarea>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="fg"><label>No. of Questions</label><input className="finput" type="number" placeholder="e.g. 25" /></div>
            <div className="fg"><label>Suggested Deadline</label><input className="finput" type="date" /></div>
          </div>
          <div className="approval-notice">⏳ Admin will review and approve within 24h.</div>
          <div className="ma">
            <button className="btn btn-ghost btn-sm" onClick={onClose}>Cancel</button>
            <button className="btn btn-gold btn-sm" onClick={() => { onClose(); onShowToast('Test suggestion sent for admin approval ✓'); }}>Send for Approval →</button>
          </div>
        </div>
      </div>

      {/* Broadcast Modal */}
      <div className={`overlay${isOpen('broadcast-modal')}`} onClick={e => e.target.classList.contains('overlay') && onClose()}>
        <div className="modal">
          <div className="mt">📢 Message All Students</div>
          <div className="ms">Sends a notification to all your assigned students instantly.</div>
          <div className="fg">
            <label>Message</label>
            <textarea className="finput" rows="4" placeholder="e.g. No session this Friday. Revise chapters 3–5 before Monday." value={broadcastText} onChange={e => setBroadcastText(e.target.value)} />
          </div>
          <div className="ma">
            <button className="btn btn-ghost btn-sm" onClick={onClose}>Cancel</button>
            <button className="btn btn-gold btn-sm" disabled={broadcasting} onClick={sendBroadcast}>
              {broadcasting ? 'Sending…' : 'Send to All Students →'}
            </button>
          </div>
        </div>
      </div>

      {/* Toast */}
      <div className={`toast${toast.show ? ' show' : ''}`}>
        <div className="tpip"></div>
        <span>{toast.msg}</span>
      </div>
    </>
  );
};

export default FacultyModals;
