import React from 'react';

const FreeModals = ({ openModal, onClose, onShowToast, toast }) => {
  const isOpen = (id) => openModal === id ? ' open' : '';

  return (
    <>
      {/* Upgrade Modal */}
      <div className={`overlay${isOpen('upgrade-modal')}`} onClick={e => e.target.classList.contains('overlay') && onClose()}>
        <div className="modal">
          <div className="mt">Unlock Full Access</div>
          <div className="ms">Get the question bank, premium resources, and full diagnostic report.</div>
          <div style={{ background: 'var(--gold-dim)', border: '1px solid var(--gold-b)', borderRadius: 'var(--rl)', padding: '16px 18px', marginBottom: '18px' }}>
            <div style={{ fontFamily: 'var(--fs)', fontSize: '22px', fontWeight: 700, color: 'var(--text)', marginBottom: '2px' }}>₹ 999 <span style={{ fontSize: '13px', fontWeight: 400, color: 'var(--text3)' }}>/ month</span></div>
            <div style={{ fontSize: '12px', color: 'var(--text2)' }}>Questions matched to your weak topics • PYQ papers • HC Verma • Formula sheets</div>
          </div>
          <div className="fg"><label>Your Name</label><input className="fi" type="text" placeholder="Full name" /></div>
          <div className="fg"><label>Phone Number</label><input className="fi" type="tel" placeholder="+91 XXXXX XXXXX" /></div>
          <div className="fg">
            <label>What are you preparing for?</label>
            <select className="fi">
              <option>JEE Mains 2026</option>
              <option>JEE Advanced 2026</option>
              <option>NEET 2026</option>
              <option>JEE 2027</option>
              <option>NEET 2027</option>
            </select>
          </div>
          <div className="ma">
            <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button className="btn btn-gold" onClick={() => { onClose(); onShowToast("Request received! We'll contact you within 24h."); }}>Get Access →</button>
          </div>
        </div>
      </div>

      {/* Book Session Modal */}
      <div className={`overlay${isOpen('book-modal')}`} onClick={e => e.target.classList.contains('overlay') && onClose()}>
        <div className="modal">
          <div className="mt">Request a 1-on-1 Session</div>
          <div className="ms">Tell us your topic and preferred time. Our team will confirm within 24 hours.</div>
          <div className="fg"><label>Your Name</label><input className="fi" type="text" placeholder="Full name" /></div>
          <div className="fg"><label>Phone Number</label><input className="fi" type="tel" placeholder="+91 XXXXX XXXXX" /></div>
          <div className="fg"><label>Topic / Subject</label><input className="fi" type="text" placeholder="e.g. Electrostatics — Gauss's Law" /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="fg"><label>Preferred Date</label><input className="fi" type="date" /></div>
            <div className="fg">
              <label>Preferred Time</label>
              <select className="fi">
                <option>Morning (9–12 AM)</option>
                <option>Afternoon (12–4 PM)</option>
                <option>Evening (4–8 PM)</option>
                <option>Night (8–10 PM)</option>
              </select>
            </div>
          </div>
          <div className="ma">
            <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button className="btn btn-gold" onClick={() => { onClose(); onShowToast('Session request sent! Our team will reach out within 24h ✓'); }}>Send Request →</button>
          </div>
        </div>
      </div>

      {/* Enroll Modal */}
      <div className={`overlay${isOpen('enroll-modal')}`} onClick={e => e.target.classList.contains('overlay') && onClose()}>
        <div className="modal">
          <div className="mt">Full Program Enquiry</div>
          <div className="ms">Tell us about yourself. The team will reach out within 24 hours to discuss fit.</div>
          <div className="fg"><label>Student Name</label><input className="fi" type="text" placeholder="Full name" /></div>
          <div className="fg"><label>Parent Mobile Number</label><input className="fi" type="tel" placeholder="+91 XXXXX XXXXX" /></div>
          <div className="fg">
            <label>Preparing For</label>
            <select className="fi">
              <option>JEE Mains 2026</option>
              <option>JEE Advanced 2026</option>
              <option>NEET 2026</option>
              <option>JEE 2027</option>
            </select>
          </div>
          <div className="fg"><label>Biggest challenge right now</label><textarea className="fi" rows="2" placeholder="What's your child struggling with most?"></textarea></div>
          <div className="ma">
            <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button className="btn btn-gold" onClick={() => { onClose(); onShowToast("Enquiry submitted! We'll call you within 24 hours."); }}>Submit Enquiry →</button>
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

export default FreeModals;
