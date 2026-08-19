const PAGE_TITLES = {
  dashboard: 'Dashboard',
  tasks:     'Assignment Tasks',
  pipeline:  'Enrollment Pipeline',
  revenue:   'Revenue',
  students:  'Students',
  faculty:   'Faculty',
  assign:    'Assign Faculty & Mentor',
  approvals: 'Approvals',
  reports:   'Parent Reports',
  feedback:  'Feedback',
  messages:  'Messages',
  admins:    'Admin Accounts',
  settings:  'Platform Settings',
};

const PAGE_ICONS = {
  dashboard: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>,
  students:  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  faculty:   <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 1 0-16 0"/></svg>,
  approvals: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>,
  messages:  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
};

const AdminTopbar = ({ activePage, isSuperAdmin, onOpenModal, onNav, onMenuClick, unreadTasks = 0 }) => {
  const title = PAGE_TITLES[activePage] || 'Dashboard';
  const icon  = PAGE_ICONS[activePage] || null;

  return (
    <header className="adm-topbar">
      <button className="adm-tb-hamburger" onClick={onMenuClick} aria-label="Open menu">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
      </button>
      <div className="adm-tb-page">
        <div className="adm-tb-bar" />
        {icon && <span className="adm-tb-icon">{icon}</span>}
        <span className="adm-tb-title">{title}</span>
      </div>

      <div className="adm-tbr">
        {isSuperAdmin && (
          <div className="adm-tb-super">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            Super Admin
          </div>
        )}

        <button className="adm-tb-enroll" onClick={() => onOpenModal('enroll-modal')}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 5v14M5 12h14"/>
          </svg>
          <span className="adm-tb-enroll-label">Enroll Student</span>
        </button>

        <button className="adm-tbb" onClick={() => onNav('tasks')} title="Assignment Tasks" style={{ position: 'relative' }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={unreadTasks > 0 ? 'var(--gold, #E8A830)' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
          {unreadTasks > 0 && (
            <>
              <span className="adm-tb-pip" style={{ background: '#EF4444' }} />
              <span style={{ position: 'absolute', top: -6, right: -8, minWidth: '16px', height: '16px', padding: '0 4px', borderRadius: '10px', background: '#EF4444', color: '#fff', fontSize: '10px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{unreadTasks > 9 ? '9+' : unreadTasks}</span>
            </>
          )}
        </button>

        <div className="adm-tbb" onClick={() => onNav('approvals')} title="Approvals">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
          </svg>
          <span className="adm-tb-pip" />
        </div>
      </div>
    </header>
  );
};

export default AdminTopbar;
