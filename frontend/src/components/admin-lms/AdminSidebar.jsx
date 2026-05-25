import React from 'react';

const AdminSidebar = ({ activePage, superMode, onNav, onSetRole, onShowToast }) => {
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    onShowToast('Signing out...');
    setTimeout(() => { window.location.href = '/'; }, 1000);
  };

  const niClass = (page, extra = '') => {
    let cls = 'ni';
    if (extra) cls += ' ' + extra;
    if (activePage === page) cls += ' on';
    return cls;
  };

  return (
    <aside className={`sidebar${superMode ? ' supermode' : ''}`} id="sidebar">
      <div className="sb-logo">
        <svg className="sb-mark" viewBox="0 0 100 100" fill="none">
          <path d="M50 5L90 28V72L50 95L10 72V28L50 5Z" stroke="#E8A830" strokeWidth="6" strokeLinejoin="round"/>
          <path d="M68 32C68 32 60 25 50 25C40 25 32 32 32 40C32 55 68 50 68 65C68 73 60 80 50 80C40 80 32 73 32 73" stroke="#FDF8F0" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <div>
          <div className="sb-w1">STUDY<span>VERSE</span></div>
          <div className="sb-w2">Control Panel</div>
        </div>
      </div>

      <div className={`role-badge ${superMode ? 'rb-super' : 'rb-admin'}`}>
        <div className={`rb-av ${superMode ? 'rb-av-super' : 'rb-av-admin'}`}>
          {superMode ? 'V' : 'M'}
        </div>
        <div>
          <div className="rb-name">{superMode ? 'Vinay Raj Pareta' : 'Meera Krishnan'}</div>
          <div className={superMode ? 'rb-role-super' : 'rb-role-admin'}>
            {superMode ? '⬡ SUPER ADMIN' : '◈ ADMIN'}
          </div>
        </div>
      </div>

      <div className="role-switcher">
        <button className={`rs-btn${superMode ? ' on super-on' : ''}`} onClick={() => onSetRole('super')}>Super Admin</button>
        <button className={`rs-btn${!superMode ? ' on' : ''}`} onClick={() => onSetRole('admin')}>Admin View</button>
      </div>

      <div className="nb">
        <div className="nl">Overview</div>
        <div className={niClass('dashboard')} onClick={() => onNav('dashboard')}>
          <svg className="nic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/>
            <rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>
          </svg>
          Dashboard
        </div>
        <div className={niClass('pipeline')} onClick={() => onNav('pipeline')}>
          <svg className="nic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 12H3M22 6H3M22 18H3"/>
          </svg>
          Enrollment Pipeline
          <span className="nbadge nb-gold">3 New</span>
        </div>
        <div className={niClass('revenue')} onClick={() => onNav('revenue')}>
          <svg className="nic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
          </svg>
          Revenue & Fees
          <span className="nbadge nb-red">2 Overdue</span>
        </div>
      </div>

      <div className="nb">
        <div className="nl">People</div>
        <div className={niClass('students')} onClick={() => onNav('students')}>
          <svg className="nic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
          Students
          <span className="nbadge nb-dim">12</span>
        </div>
        <div className={niClass('faculty')} onClick={() => onNav('faculty')}>
          <svg className="nic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 1 0-16 0"/>
          </svg>
          Faculty
          <span className="nbadge nb-dim">3</span>
        </div>
        <div className={niClass('assign')} onClick={() => onNav('assign')}>
          <svg className="nic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
            <line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/>
          </svg>
          Assign Faculty
        </div>
      </div>

      <div className="nb">
        <div className="nl">Controls</div>
        <div className={niClass('approvals')} onClick={() => onNav('approvals')}>
          <svg className="nic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
          </svg>
          Approvals
          <span className="nbadge nb-red">4</span>
        </div>
        <div className={niClass('messages')} onClick={() => onNav('messages')}>
          <svg className="nic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          Messages
        </div>
        <div className={niClass('admins', 'sa-only')} onClick={() => onNav('admins')}>
          <svg className="nic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
          Admin Accounts
          <span className="nbadge nb-purple">Super</span>
        </div>
        <div className={niClass('settings', 'sa-only')} onClick={() => onNav('settings')}>
          <svg className="nic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3"/>
            <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
          </svg>
          Platform Settings
          <span className="nbadge nb-purple">Super</span>
        </div>
      </div>

      <div className="sb-bottom">
        <div className="logout-row" onClick={handleLogout}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>
          </svg>
          Sign Out
        </div>
      </div>
    </aside>
  );
};

export default AdminSidebar;
