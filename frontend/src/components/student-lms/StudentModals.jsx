import React from 'react';

const StudentModals = ({ openModal, onClose, onShowToast, toast }) => {
  const isOpen = (id) => openModal === id ? ' open' : '';

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
          <div className="fg"><label>Any specific doubt to address?</label><textarea className="fi" rows="2" placeholder="Optional — helps Vinay prepare before the session"></textarea></div>
          <div className="ma">
            <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" onClick={() => { onClose(); onShowToast('Session request sent to Vinay! 🎉'); }}>Send Request</button>
          </div>
        </div>
      </div>

      {/* Doubt Modal */}
      <div className={`overlay${isOpen('doubt-modal')}`} onClick={e => e.target.classList.contains('overlay') && onClose()}>
        <div className="modal">
          <div className="modal-title">Ask a Doubt</div>
          <div className="modal-sub">Post your doubt — Vinay typically responds within 4 hours.</div>
          <div className="fg">
            <label>Subject</label>
            <select className="fi"><option>Chemistry</option><option>Mathematics</option><option>Physics</option></select>
          </div>
          <div className="fg"><label>Your Question</label><textarea className="fi" rows="4" placeholder="Write your doubt clearly — include the concept, where you're stuck, and what you've tried..."></textarea></div>
          <div className="ma">
            <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" onClick={() => { onClose(); onShowToast('Doubt posted! Vinay will respond shortly.'); }}>Post Doubt</button>
          </div>
        </div>
      </div>

      {/* Toast */}
      <div className={`toast${toast.show ? ' show' : ''}`}>
        <div className="toast-pip"></div>
        <span>{toast.msg}</span>
      </div>
    </>
  );
};

export default StudentModals;
