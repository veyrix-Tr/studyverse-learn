import React from 'react';

const pageTitles = {
  dashboard: 'Dashboard',
  schedule: 'Schedule',
  students: 'My Students',
  doubts: 'Doubt Queue',
  resources: 'Resources',
  tests: 'Assign Tests',
  reports: 'Weekly Reports',
  feedback: 'Parent Feedback'
};

const FacultyTopbar = ({ activePage, onOpenModal, onNav, onShowToast }) => {
  const title = pageTitles[activePage] || 'Dashboard';
  return (
    <header className="topbar" style={activePage === 'dashboard' ? { paddingTop: 16, paddingBottom: 16 } : undefined}>
      <div className="ph-wrap">
        <div className="ph-trail">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          </svg>
          Faculty Portal
          <span className="ph-sep">›</span>
          {title}
        </div>
        <div className="ph">{title}</div>
      </div>
      <div className="tbr">
        <div className="tb-doubts-chip" onClick={() => onNav('doubts')}>
          <span className="td-dot"></span>
          5 doubts pending
        </div>
        <button className="join-btn" onClick={() => onShowToast('Launching session: Atomic Structure with Rahul...')}>
          <span className="live-ring"></span>
          <span className="live-dot"></span>
          Join Live Session
        </button>
        <div className="tbb" onClick={() => onOpenModal('quick-note-modal')}>
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
