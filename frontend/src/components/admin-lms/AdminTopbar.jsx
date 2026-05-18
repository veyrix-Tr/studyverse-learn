import React from 'react';

const pageTitles = {
  dashboard: 'Dashboard',
  pipeline: 'Enrollment Pipeline',
  revenue: 'Revenue & Fees',
  students: 'Students',
  faculty: 'Faculty',
  assign: 'Assign Faculty',
  approvals: 'Approvals',
  messages: 'Messages',
  admins: 'Admin Accounts',
  settings: 'Platform Settings'
};

const AdminTopbar = ({ activePage, superMode, onOpenModal, onNav }) => {
  return (
    <header className="topbar">
      <div className="ph">{pageTitles[activePage] || 'Dashboard'}</div>
      <div className="tbr">
        {superMode && (
          <div className="super-indicator" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            Super Admin Mode
          </div>
        )}
        <button className="btn btn-gold btn-sm" onClick={() => onOpenModal('enroll-modal')}>+ Enroll Student</button>
        <div className="tbb" onClick={() => onNav('approvals')}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
          </svg>
          <span className="npip"></span>
        </div>
      </div>
    </header>
  );
};

export default AdminTopbar;
