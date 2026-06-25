const AnchorSidebar = ({ activePage, onNav, profile }) => {
  const ni = (page) => `ni${activePage === page ? ' on' : ''}`;
  const name = profile?.name || 'Student';
  const initial = name.charAt(0).toUpperCase();
  const examTarget = profile?.studentProfile?.examTarget || '';
  const targetYear = profile?.studentProfile?.targetYear || '';

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/';
  };

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sb-logo">
        <svg width="36" height="36" viewBox="0 0 100 100" fill="none">
          <path d="M50 5L90 28V72L50 95L10 72V28L50 5Z" stroke="#E8A830" strokeWidth="6" strokeLinejoin="round"/>
          <path d="M68 32C68 32 60 25 50 25C40 25 32 32 32 40C32 55 68 50 68 65C68 73 60 80 50 80C40 80 32 73 32 73" stroke="#EAF4EC" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <div className="sb-words">
          <div className="w1">STUDY<span>VERSE</span></div>
          <div className="w2">JEE &amp; NEET</div>
        </div>
      </div>

      {/* Anchor tier */}
      <div className="tier-strip">
        <div className="tier-plan">⚓ ANCHOR</div>
        <div className="tier-sub">Someone in your corner, every day</div>
      </div>

      {/* Mentor card */}
      <div className="sb-mentor">
        <div className="sb-mentor-av">A</div>
        <div>
          <div className="sb-mentor-name">Ajay Sharma</div>
          <div className="sb-mentor-role">Your Mentor · Next call: Fri 6PM</div>
        </div>
        <div className="online-dot"></div>
      </div>

      {/* My Anchor nav */}
      <div className="nb">
        <div className="nl">My Anchor</div>
        <div className={ni('dashboard')} onClick={() => onNav('dashboard')}>
          <svg className="nic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>
          Dashboard
        </div>
        <div className={ni('report')} onClick={() => onNav('report')}>
          <svg className="nic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          Daily Report
          <span className="nbadge nb-gold">Due Today</span>
        </div>
        <div className={ni('calls')} onClick={() => onNav('calls')}>
          <svg className="nic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.39 2 2 0 0 1 3.6 1.21h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.38a16 16 0 0 0 6 6l.94-.94a2 2 0 0 1 2.25-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.73 16z"/></svg>
          Weekly Calls
        </div>
        <div className={ni('habits')} onClick={() => onNav('habits')}>
          <svg className="nic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          Habit Tracker
        </div>
        <div className={ni('plan')} onClick={() => onNav('plan')}>
          <svg className="nic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
          My Study Plan
        </div>
      </div>

      {/* From Spark */}
      <div className="nb">
        <div className="nl">From Spark</div>
        <div className={ni('topics')} onClick={() => onNav('topics')}>
          <svg className="nic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
          Topic Map
          <span className="nbadge nb-dim">Diagnostic</span>
        </div>
        <div className={ni('resources')} onClick={() => onNav('resources')}>
          <svg className="nic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          Resources
        </div>
      </div>

      {/* Reports */}
      <div className="nb">
        <div className="nl">Reports</div>
        <div className={ni('history')} onClick={() => onNav('history')}>
          <svg className="nic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"/></svg>
          Report History
        </div>
        <div className={ni('parent')} onClick={() => onNav('parent')}>
          <svg className="nic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          Parent View
        </div>
      </div>

      {/* Bottom */}
      <div className="sb-bottom">
        <div className="sb-user">
          <div className="user-av">{initial}</div>
          <div>
            <div className="sb-uname">{name}</div>
            <div className="sb-uexam">{examTarget}{targetYear ? ` ${targetYear}` : ''} · Anchor</div>
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

export default AnchorSidebar;
