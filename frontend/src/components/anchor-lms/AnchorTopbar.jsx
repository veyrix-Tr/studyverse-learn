const PAGE_TITLES = {
  dashboard: 'Dashboard',
  report:    'Daily Report',
  calls:     'Weekly Calls',
  notes:     'Mentor Notes',
  habits:    'Habit Tracker',
  diagnostic:'Diagnostic Test',
  topics:    'Topic Map',
  guidance:  'My Study Plan',
  resources: 'Resources',
  history:   'Report History',
  parent:    'Parent View',
  notif:     'Notifications',
};

const PAGE_ICONS = {
  dashboard:  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>,
  report:     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  habits:     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
  notes:      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  calls:      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  diagnostic: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>,
  topics:     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z"/></svg>,
  guidance:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>,
  resources:  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
  history:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v4H3zM14 14h7v4h-7z"/></svg>,
  parent:     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  notif:      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
};

const AnchorTopbar = ({ activePage, onNav, unreadCount = 0, profile }) => {
  const mentorName = profile?.studentProfile?.mentor?.user?.name || null;
  const mentorInitial = mentorName ? mentorName[0].toUpperCase() : null;
  const pageIcon = PAGE_ICONS[activePage] || null;

  return (
    <header className="topbar">
      {/* Page title with accent bar */}
      <div className="tb-page">
        <div className="tb-page-bar" />
        {pageIcon && <span className="tb-page-icon">{pageIcon}</span>}
        <div className="ph">{PAGE_TITLES[activePage] || 'Dashboard'}</div>
      </div>

      {/* Mentor chip — centred */}
      <div
        className={`tb-mentor-chip${mentorName ? ' has-mentor' : ''}`}
        onClick={() => onNav('notes')}
        title={mentorName ? `View notes from ${mentorName}` : ''}
      >
        {mentorName ? (
          <>
            <div className="tbmc-av">{mentorInitial}</div>
            <div className="tbmc-info">
              <div className="tbmc-name">{mentorName}</div>
              <div className="tbmc-role">Your Mentor</div>
            </div>
            <div className="tbmc-dot" />
          </>
        ) : (
          <>
            <div className="tbmc-av tbmc-av-empty">⚓</div>
            <div className="tbmc-info">
              <div className="tbmc-name" style={{ color: 'var(--t3)' }}>No mentor yet</div>
              <div className="tbmc-role">Admin will assign soon</div>
            </div>
          </>
        )}
      </div>

      {/* Right actions */}
      <div className="tbr">
        <button className="btn btn-gold btn-sm tb-report-btn" onClick={() => onNav('report')}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
          Submit Report
        </button>

        <div
          className={`tbb${activePage === 'notif' ? ' tbb-active' : ''}`}
          onClick={() => onNav('notif')}
          title="Notifications"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke={activePage === 'notif' ? '#0A1F12' : unreadCount > 0 ? 'var(--gold)' : 'currentColor'}
            strokeWidth="2">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
          {unreadCount > 0 && (
            <span className="tb-notif-badge">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </div>
      </div>
    </header>
  );
};

export default AnchorTopbar;
