const PAGE_TITLES = {
  dashboard: 'Dashboard',
  report: 'Daily Report',
  calls: 'Weekly Calls',
  habits: 'Habit Tracker',
  plan: 'My Study Plan',
  topics: 'Topic Map',
  resources: 'Resources',
  history: 'Report History',
  parent: 'Parent View',
  notif: 'Notifications',
};

const AnchorTopbar = ({ activePage, onNav }) => (
  <header className="topbar">
    <div className="ph">{PAGE_TITLES[activePage] || 'Dashboard'}</div>
    <div className="anchor-badge">⚓ ANCHOR</div>
    <div className="tbr">
      <button className="btn btn-gold btn-sm" onClick={() => onNav('report')}>
        Submit Today's Report →
      </button>
      <div className="tbb" onClick={() => onNav('notif')}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        <span className="npip"></span>
      </div>
    </div>
  </header>
);

export default AnchorTopbar;
