import React from 'react';

const pageTitles = {
  dashboard: 'Dashboard',
  journey: 'My Journey',
  courses: 'Courses',
  video: 'Course Player',
  sessions: 'Sessions',
  tests: 'Mock Tests',
  mentor: 'My Mentor',
  resources: 'Resources',
  doubt: 'Doubt Desk',
  parent: 'Parent View',
  notif: 'Notifications',
};

const StudentTopbar = ({ activePage, onOpenModal, onNav }) => (
  <header className="topbar">
    <div className="page-heading">{pageTitles[activePage] || 'Dashboard'}</div>
    <div className="topbar-right">
      <div className="search-box">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth="2">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
        <input type="text" placeholder="Search topics, sessions..." />
      </div>
      <div className="tb-btn" onClick={() => onOpenModal('book-modal')}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
        </svg>
      </div>
      <div className="tb-btn" onClick={() => onNav('notif')}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        <span className="notif-pip"></span>
      </div>
    </div>
  </header>
);

export default StudentTopbar;
