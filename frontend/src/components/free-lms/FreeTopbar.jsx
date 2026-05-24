import React from 'react';

const pageTitles = {
  home: 'Dashboard',
  diagnostic: 'Diagnostic Test',
  topics: 'Topic Map',
  guidance: 'Study Guidance',
  habits: 'Habit Tracker',
  questions: 'Question Bank',
  sessions: 'Book a Session',
  resources: 'Resources',
  plans: 'Plans & Pricing',
  notif: 'Notifications',
};

const FreeTopbar = ({ activePage, onNav }) => (
  <header className="topbar">
    <div className="ph">{pageTitles[activePage] || 'Dashboard'}</div>
    <div className="tbr">
      <div className="srch">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
        <input type="text" placeholder="Search topics..." />
      </div>
      <div className="tbb" onClick={() => onNav('notif')}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"/></svg>
        <span className="npip"></span>
      </div>
    </div>
  </header>
);

export default FreeTopbar;
