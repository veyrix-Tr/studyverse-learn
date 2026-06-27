const PAGE_TITLES = {
  dashboard: 'Dashboard',
  schedule:  'Schedule',
  students:  'My Students',
  doubts:    'Doubt Queue',
  resources: 'Resources',
  tests:     'Assign Tests',
  reports:   'Weekly Reports',
  feedback:  'Weekly Feedback',
  mentor:    'My Mentees',
};

const PAGE_ICONS = {
  dashboard: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>,
  schedule:  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>,
  doubts:    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  mentor:    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
};

const FacultyTopbar = ({ activePage, onOpenModal, onNav, onShowToast, pendingDoubts = 0 }) => {
  const title = PAGE_TITLES[activePage] || 'Dashboard';
  const icon  = PAGE_ICONS[activePage] || null;

  return (
    <header className="fac-topbar">
      <div className="fac-tb-page">
        <div className="fac-tb-bar" />
        {icon && <span className="fac-tb-icon">{icon}</span>}
        <span className="fac-tb-title">{title}</span>
      </div>

      <div className="fac-tbr">
        {pendingDoubts > 0 && (
          <div className="fac-tb-doubts" onClick={() => onNav('doubts')}>
            <span className="fac-tb-doubts-dot" />
            {pendingDoubts} doubt{pendingDoubts !== 1 ? 's' : ''} pending
          </div>
        )}

        <button className="fac-tb-live" onClick={() => onShowToast('Launching session...')}>
          <span className="fac-tb-live-ring" />
          <span className="fac-tb-live-dot" />
          Join Live Session
        </button>

        <div className="fac-tbb" onClick={() => onOpenModal('quick-note-modal')} title="Quick note">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        </div>
      </div>
    </header>
  );
};

export default FacultyTopbar;
