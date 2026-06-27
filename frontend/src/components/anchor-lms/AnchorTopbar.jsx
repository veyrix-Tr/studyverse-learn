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
  dashboard: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>
  ),
  report: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
  ),
  habits: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
  ),
  notes: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
  ),
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

        <div className="tbb" onClick={() => onNav('notif')} title="Notifications">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke={unreadCount > 0 ? 'var(--gold)' : 'currentColor'} strokeWidth="2">
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
