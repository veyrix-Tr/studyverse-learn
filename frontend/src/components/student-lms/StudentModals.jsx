import { useState } from 'react';

const EXAM_SUBJECTS = {
  'JEE Mains':    ['Physics', 'Chemistry', 'Maths'],
  'JEE Advanced': ['Physics', 'Chemistry', 'Maths'],
  'NEET':         ['Physics', 'Chemistry', 'Biology'],
};

const StudentModals = ({ openModal, onClose, onShowToast, toast, profile, onDoubtPosted }) => {
  const isOpen = (id) => openModal === id ? ' open' : '';

  const subjects = EXAM_SUBJECTS[profile?.studentProfile?.examTarget] || ['Physics', 'Chemistry', 'Maths'];
  const [doubtSubject, setDoubtSubject] = useState('');
  const [doubtQuestion, setDoubtQuestion] = useState('');
  const [posting, setPosting] = useState(false);

  const handlePostDoubt = async () => {
    if (!doubtQuestion.trim()) { onShowToast('Please write your question'); return; }
    const subject = doubtSubject || subjects[0];
    setPosting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/student/doubts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ question: doubtQuestion.trim(), subject }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      onDoubtPosted?.(data);
      setDoubtQuestion('');
      setDoubtSubject('');
      onClose();
      onShowToast(`Doubt posted! ${data.facultyName} will respond shortly.`);
    } catch (err) {
      onShowToast(err.message || 'Failed to post doubt. Try again.');
    } finally {
      setPosting(false);
    }
  };

  return (
    <>
      {/* Book Modal */}
      <div className={`overlay${isOpen('book-modal')}`} onClick={e => e.target.classList.contains('overlay') && onClose()}>
        <div className="modal">
          <div className="modal-title">Book a 1-to-1 Session</div>
          <div className="modal-sub">Every session is built around your specific need. No templates.</div>
          <div className="fg"><label>Topic / Area</label><input className="fi" type="text" placeholder="e.g. Organic Chemistry — Reaction Mechanisms" /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="fg"><label>Preferred Date</label><input className="fi" type="date" /></div>
            <div className="fg">
              <label>Preferred Time</label>
              <select className="fi">
                <option>Morning (9–12)</option>
                <option>Afternoon (12–4)</option>
                <option>Evening (4–8 PM)</option>
                <option>Night (8–10 PM)</option>
              </select>
            </div>
          </div>
          <div className="fg"><label>Any specific doubt to address?</label><textarea className="fi" rows="2" placeholder="Optional — helps your faculty prepare before the session"></textarea></div>
          <div className="ma">
            <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" onClick={() => { onClose(); onShowToast('Session request sent!'); }}>Send Request</button>
          </div>
        </div>
      </div>

      {/* Doubt Modal */}
      <div className={`overlay${isOpen('doubt-modal')}`} onClick={e => e.target.classList.contains('overlay') && onClose()}>
        <div className="modal">
          <div className="modal-title">Ask a Doubt</div>
          <div className="modal-sub">Your faculty typically responds within 4 hours.</div>
          <div className="fg">
            <label>Subject</label>
            <select className="fi" value={doubtSubject || subjects[0]} onChange={e => setDoubtSubject(e.target.value)}>
              {subjects.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="fg">
            <label>Your Question</label>
            <textarea className="fi" rows="4" placeholder="Write your doubt clearly — include the concept, where you're stuck, and what you've tried..." value={doubtQuestion} onChange={e => setDoubtQuestion(e.target.value)}></textarea>
          </div>
          <div className="ma">
            <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" onClick={handlePostDoubt} disabled={posting}>{posting ? 'Posting…' : 'Post Doubt'}</button>
          </div>
        </div>
      </div>

      {/* Toast */}
      <div
        className={`toast${toast.show ? ' show' : ''}${toast.onClick ? ' toast-action' : ''}`}
        onClick={toast.onClick || undefined}
        style={toast.onClick ? { cursor: 'pointer' } : {}}
      >
        <div className="toast-pip"></div>
        <span>{toast.msg}</span>
      </div>
    </>
  );
};

export default StudentModals;
