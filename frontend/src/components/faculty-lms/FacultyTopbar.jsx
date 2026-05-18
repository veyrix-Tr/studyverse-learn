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
  return (
    <header className="topbar">
      <div className="ph">{pageTitles[activePage] || 'Dashboard'}</div>
      <div className="tbr">
        <button className="join-btn" onClick={() => onShowToast('Launching session: Atomic Structure with Rahul...')}>
          <span className="live-dot"></span>
          Join Live Session
        </button>
        <div className="tbb" onClick={() => onNav('doubts')}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          <span className="npip"></span>
        </div>
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
