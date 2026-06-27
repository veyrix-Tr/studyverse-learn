const PAGE_TITLES = {
  home:       'Dashboard',
  diagnostic: 'Diagnostic Test',
  topics:     'Topic Map',
  guidance:   'Study Guidance',
  habits:     'Habit Tracker',
  questions:  'Question Bank',
  sessions:   'Book a Session',
  resources:  'Resources',
  plans:      'Plans & Pricing',
  notif:      'Notifications',
  progress:   'My Progress',
  tests:      'Weekly Tests',
  feedback:   'Weekly Feedback',
};

const FreeTopbar = ({ activePage, onNav, unreadCount = 0 }) => (
  <header className="fr-topbar">
    <div className="fr-tb-page">
      <div className="fr-tb-bar" />
      <span className="fr-tb-title">{PAGE_TITLES[activePage] || 'Dashboard'}</span>
    </div>

    <div className="fr-tb-spark">
      <span className="fr-tb-spark-dot" />
      <span className="fr-tb-spark-label">SPARK</span>
      <span className="fr-tb-spark-sub">Free Plan</span>
    </div>

    <div className="fr-tbr">
      <div className="fr-tb-bell" onClick={() => onNav('notif')} title="Notifications">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
          stroke={unreadCount > 0 ? 'var(--gold)' : 'rgba(253,248,240,0.55)'} strokeWidth="2">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        {unreadCount > 0 && (
          <span className="fr-tb-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
        )}
      </div>
    </div>
  </header>
);

export default FreeTopbar;
