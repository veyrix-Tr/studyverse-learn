import { useState } from 'react';
import { useParams } from 'react-router-dom';
import CashfreePayModal from '../payment/CashfreePayModal';

const EXAM_SUBJECTS = {
  'JEE Mains':    ['Physics', 'Chemistry', 'Maths'],
  'JEE Advanced': ['Physics', 'Chemistry', 'Maths'],
  'NEET':         ['Physics', 'Chemistry', 'Biology'],
};

const StudentModals = ({ openModal, onClose, onShowToast, toast, profile, onDoubtPosted }) => {
  const { id: userId } = useParams();
  const isOpen = (id) => openModal === id ? ' open' : '';

  const subjects = EXAM_SUBJECTS[profile?.studentProfile?.examTarget] || ['Physics', 'Chemistry', 'Maths'];
  const [doubtSubject, setDoubtSubject] = useState('');
  const [doubtQuestion, setDoubtQuestion] = useState('');
  const [posting, setPosting] = useState(false);

  const [sessionTopic, setSessionTopic] = useState('');
  const [sessionDate, setSessionDate] = useState('');
  const [sessionTime, setSessionTime] = useState('Morning (9–12)');
  const [sessionPhone, setSessionPhone] = useState('');
  const [sessionNote, setSessionNote] = useState('');
  const [sending, setSending] = useState(false);
  const [payOpen, setPayOpen] = useState(false);

  const isApex = profile?.studentProfile?.plan === 'apex' || false;

  // Apex students get a free request; everyone else pays ₹99 via Cashfree
  // (the backend /session-request only serves Apex, pay-per-session is ₹99).
  const startBooking = async () => {
    if (!sessionTopic.trim()) { onShowToast('Please enter a topic'); return; }
    if (!sessionDate) { onShowToast('Please pick a preferred date'); return; }
    if (!isApex) {
      if (!/^\d{10}$/.test(sessionPhone.replace(/\D/g, ''))) { onShowToast('Please enter a valid 10-digit phone number so we can reach you'); return; }
      setPayOpen(true);
      return;
    }
    await submitFreeRequest();
  };

  const submitFreeRequest = async () => {
    setSending(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/student/${userId}/session-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          topic: sessionTopic.trim(),
          preferredTime: `${sessionDate} — ${sessionTime}${sessionNote ? ' · ' + sessionNote : ''}`,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send request');
      setSessionTopic(''); setSessionDate(''); setSessionTime('Morning (9–12)'); setSessionNote('');
      onClose();
      onShowToast('Session request sent! Your mentor will confirm shortly.');
    } catch (err) {
      onShowToast(err.message || 'Failed to send request. Try again.');
    } finally {
      setSending(false);
    }
  };

  const handlePostDoubt = async () => {
    if (!doubtQuestion.trim()) { onShowToast('Please write your question'); return; }
    const subject = doubtSubject || subjects[0];
    setPosting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/student/${userId}/doubts`, {
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
          <div className="fg"><label>Topic / Area</label><input className="fi" type="text" placeholder="e.g. Organic Chemistry — Reaction Mechanisms" value={sessionTopic} onChange={e => setSessionTopic(e.target.value)} /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="fg"><label>Preferred Date</label><input className="fi" type="date" value={sessionDate} onChange={e => setSessionDate(e.target.value)} /></div>
            <div className="fg">
              <label>Preferred Time</label>
              <select className="fi" value={sessionTime} onChange={e => setSessionTime(e.target.value)}>
                <option>Morning (9–12)</option>
                <option>Afternoon (12–4)</option>
                <option>Evening (4–8 PM)</option>
                <option>Night (8–10 PM)</option>
              </select>
            </div>
          </div>
          <div className="fg"><label>Any specific doubt to address?</label><textarea className="fi" rows="2" placeholder="Optional — helps your faculty prepare before the session" value={sessionNote} onChange={e => setSessionNote(e.target.value)} /></div>
          {!isApex && (
            <div className="fg"><label>Phone number (for the faculty to reach you)</label><input className="fi" type="tel" inputMode="numeric" maxLength={10} placeholder="10-digit number" value={sessionPhone} onChange={e => setSessionPhone(e.target.value.replace(/\D/g, ''))} /></div>
          )}
          <div className="ma">
            <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" onClick={startBooking} disabled={sending}>{sending ? 'Sending…' : (isApex ? 'Send Request' : 'Continue to Payment ₹99')}</button>
          </div>
        </div>
      </div>

      <CashfreePayModal
        open={payOpen}
        onClose={() => setPayOpen(false)}
        mode="session"
        userId={userId}
        profile={profile}
        sessionData={{ topic: sessionTopic.trim(), phone: sessionPhone, preferredTime: `${sessionDate} — ${sessionTime}${sessionNote ? ' · ' + sessionNote : ''}` }}
        onSuccess={() => { setPayOpen(false); setSessionTopic(''); setSessionDate(''); setSessionTime('Morning (9–12)'); setSessionNote(''); setSessionPhone(''); onClose(); onShowToast('Payment received! We\'ll reach out within 24h ✓'); }}
      />

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
