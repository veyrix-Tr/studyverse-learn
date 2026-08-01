import React from 'react';

const isToday = (iso) => {
  const d = new Date(iso), n = new Date();
  return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate();
};

const FacultySidebar = ({ activePage, onNav, onShowToast, profile, sessions = [], doubts = [], students = [], weeklyReports = [], mentorStudents = [], mentorDailyReports = [], unreadAlerts = 0, isOpen = false, onClose }) => {
  const name = profile?.name || 'Faculty';
  const initial = name.charAt(0).toUpperCase();
  const subject = profile?.facultyProfile?.subject || '';

  const todayCount = sessions.filter(s => isToday(s.scheduledAt)).length;
  const pendingDoubts = doubts.filter(d => !d.answeredAt).length;

  const now = new Date();
  const day = now.getDay();
  const isSatOrSun = day === 0 || day === 6;
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);
  const jan4 = new Date(monday.getFullYear(), 0, 4);
  const jan4Day = jan4.getDay() || 7;
  const jan4Monday = new Date(jan4);
  jan4Monday.setDate(jan4.getDate() - jan4Day + 1);
  const isoWeek = Math.round((monday - jan4Monday) / (7 * 86400000)) + 1;
  const weekNum = monday.getFullYear() * 100 + isoWeek;
  const submittedThisWeek = weeklyReports.filter(r => r.weekNumber === weekNum && ['submitted', 'approved', 'sent'].includes(r.status)).length;
  const showReportBadge = isSatOrSun && submittedThisWeek < students.length;

  return (
    <aside className={`sidebar${isOpen ? ' open' : ''}`}>
      <div className="sb-logo">
        <svg className="sb-mark" viewBox="0 0 100 100" fill="none">
          <path d="M50 5L90 28V72L50 95L10 72V28L50 5Z" stroke="#E8A830" strokeWidth="6" strokeLinejoin="round"/>
          <path d="M68 32C68 32 60 25 50 25C40 25 32 32 32 40C32 55 68 50 68 65C68 73 60 80 50 80C40 80 32 73 32 73" stroke="#FDF8F0" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <div className="sb-words">
          <div className="w1">STUDY<span>VERSE</span></div>
          <div className="w2">Faculty Portal</div>
        </div>
        <button className="sb-close" onClick={onClose} aria-label="Close menu">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>
      </div>

      <div className="faculty-strip">
        <div className="fac-av">{initial}</div>
        <div>
          <div className="fac-name">{name}</div>
          <div className="fac-role">{subject ? `${subject} Faculty` : 'Faculty'}</div>
        </div>
      </div>

      <div className="nb">
        <div className="nl">Overview</div>
        <div className={`ni${activePage === 'dashboard' ? ' on' : ''}`} onClick={() => onNav('dashboard')}>
          <svg className="nic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/>
            <rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>
          </svg>
          Dashboard
        </div>
        <div className={`ni${activePage === 'schedule' ? ' on' : ''}`} onClick={() => onNav('schedule')}>
          <svg className="nic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
          </svg>
          Schedule
          {todayCount > 0 && <span className="nbadge green">{todayCount} Now</span>}
        </div>
        <div className={`ni${activePage === 'students' ? ' on' : ''}`} onClick={() => onNav('students')}>
          <svg className="nic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
          My Students
          {students.length > 0 && <span className="nbadge circle">{students.length}</span>}
        </div>
      </div>

      <div className="nb">
        <div className="nl">Teaching</div>
        <div className={`ni${activePage === 'doubts' ? ' on' : ''}`} onClick={() => onNav('doubts')}>
          <svg className="nic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          Doubt Queue
          {pendingDoubts > 0 && <span className="nbadge red">{pendingDoubts} Open</span>}
        </div>
        <div className={`ni${activePage === 'resources' ? ' on' : ''}`} onClick={() => onNav('resources')}>
          <svg className="nic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
          </svg>
          Resources
        </div>
        <div className={`ni${activePage === 'tests' ? ' on' : ''}`} onClick={() => onNav('tests')}>
          <svg className="nic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
          </svg>
          Test Suggestions
        </div>
      </div>

      <div className="nb">
        <div className="nl">As Mentor</div>
        <div className={`ni${activePage === 'mentor' ? ' on' : ''}`} onClick={() => onNav('mentor')}>
          <svg className="nic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
          My Mentees
          {mentorStudents.length > 0 && <span className="nbadge circle">{mentorStudents.length}</span>}
        </div>
        <div className={`ni${activePage === 'dailylogs' ? ' on' : ''}`} onClick={() => onNav('dailylogs')}>
          <svg className="nic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
          Daily Logs
          {(() => {
            const today = new Date(Date.now() + 5.5 * 60 * 60 * 1000).toISOString().slice(0, 10);
            const todayCount = mentorStudents.filter(s => s.reportedToday).length;
            return todayCount > 0
              ? <span className="nbadge green">{todayCount} Today</span>
              : mentorDailyReports.length > 0
                ? <span className="nbadge circle">{mentorDailyReports.length}</span>
                : null;
          })()}
        </div>
        <div className={`ni${activePage === 'notifications' ? ' on' : ''}`} onClick={() => onNav('notifications')}>
          <svg className="nic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
          Notifications
          {unreadAlerts > 0 && <span className="nbadge gold">{unreadAlerts > 9 ? '9+' : unreadAlerts}</span>}
        </div>
      </div>

      <div className="nb">
        <div className="nl">Reports</div>
        <div className={`ni${activePage === 'reports' ? ' on' : ''}`} onClick={() => onNav('reports')}>
          <svg className="nic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 20V10M12 20V4M6 20v-6"/>
          </svg>
          Weekly Reports
          {showReportBadge && <span className="nbadge gold">Due Sun</span>}
        </div>
        <div className={`ni${activePage === 'feedback' ? ' on' : ''}`} onClick={() => onNav('feedback')}>
          <svg className="nic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
          Parent Feedback
          {weeklyReports.filter(r => r.status === 'sent').length > 0 && (
            <span className="nbadge blue">{weeklyReports.filter(r => r.status === 'sent').length}</span>
          )}
        </div>
      </div>

      <div className="sb-bottom">
        <div className="logout-btn" onClick={() => { localStorage.removeItem('token'); onShowToast('Signing out...'); setTimeout(() => { window.location.href = '/'; }, 1000); }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>
          </svg>
          Sign Out
        </div>
      </div>
    </aside>
  );
};

export default FacultySidebar;
