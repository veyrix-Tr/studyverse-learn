import React, { useState, useRef, useEffect } from 'react';
import '../components/admin-lms/AdminStyles.css';
import AdminSidebar from '../components/admin-lms/AdminSidebar';
import AdminTopbar from '../components/admin-lms/AdminTopbar';
import AdminContent from '../components/admin-lms/AdminContent';
import AdminModals from '../components/admin-lms/AdminModals';

const AdminLMS = ({ expectedRole }) => {
  const [activePage, setActivePage] = useState('dashboard');
  const [openModal, setOpenModal] = useState(null);
  const [messageStudentId, setMessageStudentId] = useState(null);
  const [toast, setToast] = useState({ show: false, msg: '' });
  const [profile, setProfile] = useState(null);
  const [students, setStudents] = useState([]);
  const [adminAccounts, setAdminAccounts] = useState([]);
  const [deactivated, setDeactivated] = useState(false);
  const toastTimer = useRef(null);

  useEffect(() => {
    document.documentElement.classList.add('admin-mode');
    document.body.classList.add('admin-mode');
    return () => {
      document.documentElement.classList.remove('admin-mode');
      document.body.classList.remove('admin-mode');
    };
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    fetch('http://localhost:5000/api/admin/me', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data || data.error) return;
        setProfile(data);
        if (expectedRole && data.role !== expectedRole) {
          window.location.href = data.role === 'superadmin' ? '/superadmin' : '/admin';
          return;
        }
        if (data.role === 'admin' && data.adminProfile?.isActive === false) {
          setDeactivated(true);
        }
      })
      .catch(() => {});

    fetch('http://localhost:5000/api/admin/students', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : [])
      .then(data => { if (Array.isArray(data)) setStudents(data); })
      .catch(() => {});
  }, []);

  const showToast = (msg) => {
    setToast({ show: true, msg });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(t => ({ ...t, show: false })), 3200);
  };

  const isSuperAdmin = profile?.role === 'superadmin';

  useEffect(() => {
    if (!isSuperAdmin) return;
    const token = localStorage.getItem('token');
    fetch('http://localhost:5000/api/admin/admins', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : [])
      .then(data => { if (Array.isArray(data)) setAdminAccounts(data); })
      .catch(() => {});
  }, [isSuperAdmin]);

  const deactivateAdmin = async (adminId) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`http://localhost:5000/api/admin/admins/${adminId}/deactivate`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setAdminAccounts(prev => prev.map(a => a.id === adminId ? { ...a, adminProfile: { ...a.adminProfile, isActive: false } } : a));
        showToast('Admin account deactivated');
      } else {
        showToast('Failed to deactivate');
      }
    } catch {
      showToast('Cannot connect to server');
    }
  };

  const reactivateAdmin = async (adminId) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`http://localhost:5000/api/admin/admins/${adminId}/reactivate`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setAdminAccounts(prev => prev.map(a => a.id === adminId ? { ...a, adminProfile: { ...a.adminProfile, isActive: true } } : a));
        showToast('Admin account reactivated');
      } else {
        showToast('Failed to reactivate');
      }
    } catch {
      showToast('Cannot connect to server');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
  };

  const openMessage = (studentId = null) => {
    setMessageStudentId(studentId);
    setOpenModal('message-modal');
  };

  return (
    <div className="admin-app">
      {deactivated && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(10,14,26,0.97)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            background: 'var(--navy2)', border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: '16px', padding: '40px 36px', maxWidth: '400px', width: '90%',
            textAlign: 'center',
          }}>
            <div style={{
              width: '56px', height: '56px', borderRadius: '50%',
              background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px',
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </div>
            <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text)', marginBottom: '10px' }}>
              Account Deactivated
            </div>
            <div style={{ fontSize: '13.5px', color: 'var(--text2)', lineHeight: '1.6', marginBottom: '28px' }}>
              Your admin account has been deactivated by the superadmin. Please contact your administrator for assistance.
            </div>
            <button
              onClick={handleLogout}
              style={{
                width: '100%', padding: '11px', borderRadius: '8px',
                background: '#ef4444', color: '#fff', border: 'none',
                fontSize: '14px', fontWeight: '600', cursor: 'pointer',
              }}
            >
              Sign Out
            </button>
          </div>
        </div>
      )}

      <AdminSidebar
        activePage={activePage}
        isSuperAdmin={isSuperAdmin}
        onNav={setActivePage}
        onShowToast={showToast}
        profile={profile}
        studentsCount={students.length}
      />
      <div className="admin-main">
        <AdminTopbar
          activePage={activePage}
          isSuperAdmin={isSuperAdmin}
          onOpenModal={setOpenModal}
          onNav={setActivePage}
        />
        <AdminContent
          activePage={activePage}
          onOpenModal={setOpenModal}
          onNav={setActivePage}
          onShowToast={showToast}
          profile={profile}
          students={students}
          onOpenMessage={openMessage}
          isSuperAdmin={isSuperAdmin}
          adminAccounts={adminAccounts}
          onDeactivateAdmin={deactivateAdmin}
          onReactivateAdmin={reactivateAdmin}
        />
      </div>
      <AdminModals
        openModal={openModal}
        onClose={() => { setOpenModal(null); setMessageStudentId(null); }}
        onShowToast={showToast}
        toast={toast}
        students={students}
        messageStudentId={messageStudentId}
      />
    </div>
  );
};

export default AdminLMS;
