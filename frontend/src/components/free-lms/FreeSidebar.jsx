import React from 'react';

const FreeSidebar = ({ activePage, onNav }) => {
  const ni = (page) => `ni${activePage === page ? ' on' : ''}`;

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
  };

  return (
    <aside className="sidebar">
      <div className="sb-logo">
        <svg className="sb-mark" viewBox="0 0 100 100" fill="none">
          <path d="M50 5L90 28V72L50 95L10 72V28L50 5Z" stroke="#E8A830" strokeWidth="6" strokeLinejoin="round"/>
          <path d="M68 32C68 32 60 25 50 25C40 25 32 32 32 40C32 55 68 50 68 65C68 73 60 80 50 80C40 80 32 73 32 73" stroke="#FDF8F0" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <div className="sb-words">
          <div className="w1">STUDY<span>VERSE</span></div>
          <div className="w2">JEE &amp; NEET</div>
        </div>
      </div>

      <div className="tier-strip">
        <div className="tier-label">Current Plan</div>
        <div className="tier-name">Free Explorer</div>
        <div className="tier-cta" onClick={() => onNav('plans')}>Upgrade for more →</div>
      </div>

      <div className="nb">
        <div className="nl">My Learning</div>
        <div className={ni('home')} onClick={() => onNav('home')}>
          <svg className="nic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>
          Dashboard
        </div>
        <div className={ni('diagnostic')} onClick={() => onNav('diagnostic')}>
          <svg className="nic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
          Diagnostic Test
          <span className="nbadge free">Free</span>
        </div>
        <div className={ni('topics')} onClick={() => onNav('topics')}>
          <svg className="nic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
          Topic Map
          <span className="nbadge free">Free</span>
        </div>
        <div className={ni('guidance')} onClick={() => onNav('guidance')}>
          <svg className="nic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
          Study Guidance
          <span className="nbadge free">Free</span>
        </div>
        <div className={ni('habits')} onClick={() => onNav('habits')}>
          <svg className="nic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.31-8.86c-1.77-.45-2.34-.94-2.34-1.67 0-.84.79-1.43 2.1-1.43 1.38 0 1.9.66 1.94 1.64h1.71c-.05-1.34-.87-2.57-2.49-2.97V5H10.9v1.69c-1.51.32-2.72 1.3-2.72 2.81 0 1.79 1.49 2.69 3.66 3.21 1.95.46 2.34 1.15 2.34 1.86 0 .53-.39 1.39-2.1 1.39-1.6 0-2.23-.72-2.32-1.64H8.04c.1 1.7 1.36 2.66 2.86 2.97V19h2.34v-1.67c1.52-.29 2.72-1.16 2.73-2.77-.01-2.2-1.9-2.96-3.66-3.42z"/></svg>
          Habit Tracker
          <span className="nbadge free">Free</span>
        </div>
      </div>

      <div className="nb">
        <div className="nl">Unlock More</div>
        <div className={ni('questions')} onClick={() => onNav('questions')}>
          <svg className="nic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01"/></svg>
          Question Bank
          <span className="nbadge lock">🔒 Unlock</span>
        </div>
        <div className={ni('sessions')} onClick={() => onNav('sessions')}>
          <svg className="nic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          Book a Session
          <span className="nbadge lock">🔒 Paid</span>
        </div>
        <div className={ni('resources')} onClick={() => onNav('resources')}>
          <svg className="nic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          Resources
          <span className="nbadge lock">🔒 Unlock</span>
        </div>
        <div className={ni('plans')} onClick={() => onNav('plans')}>
          <svg className="nic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          See All Plans
          <span className="nbadge gold">Upgrade</span>
        </div>
      </div>

      <div className="sb-bottom">
        <div className="sb-user">
          <div className="sb-av">S</div>
          <div>
            <div className="sb-uname">Student</div>
            <div className="sb-uexam">JEE Mains 2026 • Free Plan</div>
          </div>
        </div>
        <div className="logout-btn" onClick={handleLogout}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>
          Sign Out
        </div>
      </div>
    </aside>
  );
};

export default FreeSidebar;
