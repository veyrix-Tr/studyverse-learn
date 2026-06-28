const PAGE_TITLES = {
  dashboard:      'Dashboard',
  journey:        'My Journey',
  courses:        'Courses',
  video:          'Course Player',
  sessions:       'Sessions',
  tests:          'Mock Tests',
  mentor:         'My Mentor',
  resources:      'Study Materials',
  'question-bank':'Question Bank',
  doubt:          'Doubt Desk',
  parent:         'Parent View',
  feedback:       'Weekly Feedback',
  notif:          'Notifications',
};

const PAGE_ICONS = {
  dashboard:      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>,
  journey:        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  courses:        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>,
  video:          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/></svg>,
  sessions:       <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>,
  tests:          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>,
  mentor:         <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  'question-bank':<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01"/></svg>,
  doubt:          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  resources:      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
  parent:         <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  feedback:       <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  notif:          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
};

const PLAN_CONFIG = {
  forge: { label: 'Forge',  color: '#6366F1', bg: 'rgba(99,102,241,0.1)',  border: 'rgba(99,102,241,0.25)',  dot: '#818CF8' },
  apex:  { label: 'Apex',   color: '#E8A830', bg: 'rgba(232,168,48,0.1)',  border: 'rgba(232,168,48,0.28)',  dot: '#F5C842' },
  spark: { label: 'Spark',  color: '#8896B3', bg: 'rgba(136,150,179,0.1)', border: 'rgba(136,150,179,0.22)', dot: '#94A3B8' },
  anchor:{ label: 'Anchor', color: '#22C55E', bg: 'rgba(34,197,94,0.1)',   border: 'rgba(34,197,94,0.25)',   dot: '#4ADE80' },
};

const StudentTopbar = ({ activePage, onOpenModal, onNav, unreadCount = 0, profile }) => {
  const plan     = profile?.studentProfile?.plan || null;
  const planCfg  = plan ? PLAN_CONFIG[plan] : null;
  const pageIcon = PAGE_ICONS[activePage] || null;
  const name     = profile?.name?.split(' ')[0] || null;

  return (
    <header className="st-topbar">

      {/* Left — page title */}
      <div className="st-tb-page">
        <div className="st-tb-bar" />
        {pageIcon && <span className="st-tb-icon">{pageIcon}</span>}
        <span className="st-tb-title">{PAGE_TITLES[activePage] || 'Dashboard'}</span>
      </div>

      {/* Centre — plan chip */}
      {planCfg && (
        <div className="st-tb-plan" style={{ '--plan-color': planCfg.color, '--plan-bg': planCfg.bg, '--plan-border': planCfg.border, '--plan-dot': planCfg.dot }}>
          <span className="st-tb-plan-dot" />
          <span className="st-tb-plan-label">{planCfg.label}</span>
          {name && <span className="st-tb-plan-name">{name}</span>}
        </div>
      )}

      {/* Right — actions */}
      <div className="st-tbr">
        <button className="st-tb-book" onClick={() => onOpenModal('book-modal')} title="Book a session">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
          </svg>
          Book Session
        </button>

        <div className="st-tb-bell" onClick={() => onNav('notif')} title="Notifications">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke={unreadCount > 0 ? 'var(--gold)' : 'currentColor'} strokeWidth="2">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
          {unreadCount > 0 && (
            <span className="st-tb-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
          )}
        </div>
      </div>
    </header>
  );
};

export default StudentTopbar;
