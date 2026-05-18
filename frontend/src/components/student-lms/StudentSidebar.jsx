import React from 'react';

const StudentSidebar = ({ activePage, onNav }) => {
  const ni = (page, extra) => `nav-item${(activePage === page || (extra && activePage === extra)) ? ' active' : ''}`;

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <svg className="logo-mark" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M50 5L90 28V72L50 95L10 72V28L50 5Z" stroke="#E8A830" strokeWidth="6" strokeLinejoin="round"/>
          <path d="M68 32C68 32 60 25 50 25C40 25 32 32 32 40C32 55 68 50 68 65C68 73 60 80 50 80C40 80 32 73 32 73" stroke="#FDF8F0" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <div className="logo-wordmark">
          <div className="l1">STUDY<span style={{ color: 'var(--gold)' }}>VERSE</span></div>
          <div className="l2">JEE &amp; NEET</div>
        </div>
      </div>

      <div className="nav-block">
        <div className="nav-section-label">My Learning</div>

        <div className={ni('dashboard')} onClick={() => onNav('dashboard')}>
          <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/>
            <rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>
          </svg>
          Dashboard
        </div>

        <div className={ni('journey')} onClick={() => onNav('journey')}>
          <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 20 Q8 8 12 12 Q16 16 21 4"/>
            <circle cx="3" cy="20" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="21" cy="4" r="2"/>
          </svg>
          My Journey
          <span className="nav-badge">New</span>
        </div>

        <div className={ni('courses', 'video')} onClick={() => onNav('courses')}>
          <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
          </svg>
          Courses
        </div>

        <div className={ni('sessions')} onClick={() => onNav('sessions')}>
          <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
          </svg>
          Sessions
          <span className="nav-badge">2</span>
        </div>

        <div className={ni('tests')} onClick={() => onNav('tests')}>
          <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 11l3 3L22 4"/>
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
          </svg>
          Mock Tests
        </div>
      </div>

      <div className="nav-block">
        <div className="nav-section-label">Tools</div>

        <div className={ni('mentor')} onClick={() => onNav('mentor')}>
          <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
          My Mentor
        </div>

        <div className={ni('resources')} onClick={() => onNav('resources')}>
          <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
          </svg>
          Resources
        </div>

        <div className={ni('doubt')} onClick={() => onNav('doubt')}>
          <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          Doubt Desk
        </div>

        <div className={ni('parent')} onClick={() => onNav('parent')}>
          <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
          Parent View
        </div>
      </div>

      <div className="sidebar-user">
        <div className="user-row">
          <div className="user-initial">A</div>
          <div className="user-info">
            <div className="uname">Aryan Kumar</div>
            <div className="utarget">JEE Advanced 2026</div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default StudentSidebar;
