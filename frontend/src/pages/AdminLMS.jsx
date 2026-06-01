import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useActivePage } from '../hooks/useActivePage';
import '../components/admin-lms/AdminStyles.css';
import AdminSidebar from '../components/admin-lms/AdminSidebar';
import AdminTopbar from '../components/admin-lms/AdminTopbar';
import AdminContent from '../components/admin-lms/AdminContent';
import AdminModals from '../components/admin-lms/AdminModals';

const AdminLMS = ({ expectedRole }) => {
  const basePath = expectedRole === 'superadmin' ? '/superadmin' : '/admin';
  const [activePage, setActivePage, userId] = useActivePage(basePath, 'dashboard');
  const navigate = useNavigate();
  const [openModal, setOpenModal] = useState(null);
  const [messageStudentId, setMessageStudentId] = useState(null);
  const [toast, setToast] = useState({ show: false, msg: '' });
  const [profile, setProfile] = useState(null);
  const [students, setStudents] = useState([]);
  const [adminAccounts, setAdminAccounts] = useState([]);
  const [resources, setResources] = useState([]);
  const [sentMessages, setSentMessages] = useState([]);
  const [parentReports, setParentReports] = useState([]);
  const [deactivated, setDeactivated] = useState(false);
  const toastTimer   = useRef(null);
  const reportsRef   = useRef([]);
  const resourcesRef = useRef([]);
  useEffect(() => { reportsRef.current   = parentReports; }, [parentReports]);
  useEffect(() => { resourcesRef.current = resources;     }, [resources]);

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
    fetch(`http://localhost:5000/api/admin/${userId}/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => {
        if (!r.ok) { localStorage.removeItem('token'); window.location.href = '/'; return null; }
        return r.json();
      })
      .then(data => {
        if (!data || data.error) return;
        setProfile(data);
        if (expectedRole && data.role !== expectedRole) {
          navigate(data.role === 'superadmin' ? `/superadmin/${userId}/dashboard` : `/admin/${userId}/dashboard`, { replace: true });
          return;
        }
        if (data.role === 'admin' && data.adminProfile?.isActive === false) {
          setDeactivated(true);
        }
      })
      .catch(() => {});

    fetch(`http://localhost:5000/api/admin/${userId}/students`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : [])
      .then(data => { if (Array.isArray(data)) setStudents(data); })
      .catch(() => {});

    fetch(`http://localhost:5000/api/admin/${userId}/resources`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : [])
      .then(data => { if (Array.isArray(data)) setResources(data); })
      .catch(() => {});

    fetch(`http://localhost:5000/api/admin/${userId}/messages`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : [])
      .then(data => { if (Array.isArray(data)) setSentMessages(data); })
      .catch(() => {});

    fetch(`http://localhost:5000/api/admin/${userId}/reports`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : [])
      .then(data => { if (Array.isArray(data)) setParentReports(data); })
      .catch(() => {});
  }, []);

  // Poll reports every 20s — show toast when new submissions arrive
  useEffect(() => {
    if (!profile) return;
    const token = localStorage.getItem('token');
    if (!token) return;
    const id = setInterval(() => {
      fetch(`http://localhost:5000/api/admin/${userId}/reports`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.ok ? r.json() : null)
        .then(fresh => {
          if (!Array.isArray(fresh)) return;
          const prev = reportsRef.current;
          const prevSubmitted  = prev.filter(r => r.status === 'submitted').length;
          const freshSubmitted = fresh.filter(r => r.status === 'submitted').length;
          if (freshSubmitted > prevSubmitted) showToast(`${freshSubmitted - prevSubmitted} new report(s) submitted for review`);
          setParentReports(fresh);
        })
        .catch(() => {});
    }, 20000);
    return () => clearInterval(id);
  }, [profile]);

  // Poll resources every 20s — toast when faculty submits a new pending resource
  useEffect(() => {
    if (!profile) return;
    const token = localStorage.getItem('token');
    if (!token) return;
    const id = setInterval(() => {
      fetch(`http://localhost:5000/api/admin/${userId}/resources`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.ok ? r.json() : null)
        .then(fresh => {
          if (!Array.isArray(fresh)) return;
          const prev = resourcesRef.current;
          const newPending = fresh.filter(r => r.status === 'pending' && !prev.some(p => p.id === r.id));
          if (newPending.length > 0) showToast(`${newPending.length} new resource${newPending.length > 1 ? 's' : ''} submitted for review`);
          setResources(fresh);
        })
        .catch(() => {});
    }, 20000);
    return () => clearInterval(id);
  }, [profile]);

  const showToast = (msg) => {
    setToast({ show: true, msg });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(t => ({ ...t, show: false })), 3200);
  };

  const isSuperAdmin = profile?.role === 'superadmin';

  useEffect(() => {
    if (!isSuperAdmin) return;
    const token = localStorage.getItem('token');
    fetch(`http://localhost:5000/api/admin/${userId}/admins`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : [])
      .then(data => { if (Array.isArray(data)) setAdminAccounts(data); })
      .catch(() => {});
  }, [isSuperAdmin]);

  const deactivateAdmin = async (adminId) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`http://localhost:5000/api/admin/${userId}/admins/${adminId}/deactivate`, {
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

  const sendMessage = async (to, type, content) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`http://localhost:5000/api/admin/${userId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ studentId: to, content: content.trim(), type }),
    });
    if (!res.ok) throw new Error('Failed to send');
    const data = await res.json();
    const recipient = to === 'all' ? 'All Students' : students.find(s => String(s.id) === String(to))?.name || 'Student';
    setSentMessages(prev => [{
      id: data.id ?? Date.now(),
      content,
      type,
      recipient,
      createdAt: new Date().toISOString(),
    }, ...prev]);
    showToast(to === 'all' ? 'Message sent to all students ✓' : `Message sent to ${recipient} ✓`);
  };

  const approveResource = async (id) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`http://localhost:5000/api/admin/${userId}/resources/${id}/approve`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setResources(prev => prev.map(r => r.id === id ? { ...r, status: 'approved', approvedAt: new Date().toISOString() } : r));
        showToast('Resource approved — students can now see it ✓');
      } else {
        showToast('Failed to approve resource');
      }
    } catch {
      showToast('Cannot connect to server');
    }
  };

  const declineResource = async (id, reason) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`http://localhost:5000/api/admin/${userId}/resources/${id}/decline`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ reason }),
      });
      if (res.ok) {
        setResources(prev => prev.map(r => r.id === id ? { ...r, status: 'declined', declineReason: reason || null } : r));
        showToast('Resource declined.');
      } else {
        showToast('Failed to decline resource');
      }
    } catch {
      showToast('Cannot connect to server');
    }
  };

  const approveReport = async (id) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`http://localhost:5000/api/admin/${userId}/reports/${id}/approve`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setParentReports(prev => prev.map(r => r.id === id ? { ...r, ...data.report } : r));
      showToast('Report approved ✓');
    } catch (err) {
      showToast(`Failed: ${err.message}`);
    }
  };

  const rejectReport = async (id, reason) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`http://localhost:5000/api/admin/${userId}/reports/${id}/reject`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ reason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setParentReports(prev => prev.map(r => r.id === id ? { ...r, ...data.report } : r));
      showToast('Report sent back for revision.');
    } catch (err) {
      showToast(`Failed: ${err.message}`);
    }
  };

  const approveAllReports = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`http://localhost:5000/api/admin/${userId}/reports/approve-all`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      const now = new Date().toISOString();
      setParentReports(prev => prev.map(r => r.status === 'submitted' ? { ...r, status: 'approved', approvedAt: now } : r));
      showToast(`${data.approved} report${data.approved !== 1 ? 's' : ''} approved ✓`);
    } catch (err) {
      showToast(`Failed: ${err.message}`);
    }
  };

  const sendApprovedReports = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`http://localhost:5000/api/admin/${userId}/reports/send`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setParentReports(prev => prev.map(r => r.status === 'approved' ? { ...r, status: 'sent', sentAt: new Date().toISOString() } : r));
      showToast(`${data.sent} report${data.sent !== 1 ? 's' : ''} marked as sent ✓`);
    } catch (err) {
      showToast(`Failed: ${err.message}`);
    }
  };

  const reactivateAdmin = async (adminId) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`http://localhost:5000/api/admin/${userId}/admins/${adminId}/reactivate`, {
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
        pendingApprovalsCount={resources.filter(r => r.status === 'pending').length}
        pendingReportsCount={parentReports.filter(r => r.status === 'submitted').length}
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
          resources={resources}
          onApproveResource={approveResource}
          onDeclineResource={declineResource}
          sentMessages={sentMessages}
          onSendMessage={sendMessage}
          parentReports={parentReports}
          onApproveReport={approveReport}
          onRejectReport={rejectReport}
          onApproveAllReports={approveAllReports}
          onSendReports={sendApprovedReports}
        />
      </div>
      <AdminModals
        openModal={openModal}
        onClose={() => { setOpenModal(null); setMessageStudentId(null); }}
        onShowToast={showToast}
        toast={toast}
        students={students}
        messageStudentId={messageStudentId}
        onSendMessage={sendMessage}
      />
    </div>
  );
};

export default AdminLMS;
