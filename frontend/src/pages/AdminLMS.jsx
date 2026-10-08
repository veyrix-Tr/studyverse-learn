import { useState, useRef, useEffect } from 'react';
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
  const [navOpen, setNavOpen] = useState(false);
  const [openModal, setOpenModal] = useState(null);
  const [messageStudentId, setMessageStudentId] = useState(null);
  const [toast, setToast] = useState({ show: false, msg: '' });
  const [profile, setProfile] = useState(null);
  const [students, setStudents] = useState([]);
  const [facultyList, setFacultyList] = useState([]);
  const [adminAccounts, setAdminAccounts] = useState([]);
  const [resources, setResources] = useState([]);
  const [sentMessages, setSentMessages] = useState([]);
  const [parentReports, setParentReports] = useState([]);
  const [sessionRequests, setSessionRequests] = useState([]);
  const [adminNotifs, setAdminNotifs] = useState([]);
  const [deactivated, setDeactivated] = useState(false);
  const [analytics, setAnalytics] = useState(null);
  const [accessLog, setAccessLog] = useState([]);
  const [facultyApplications, setFacultyApplications] = useState([]);
  const toastTimer        = useRef(null);
  const reportsRef        = useRef([]);
  const resourcesRef      = useRef([]);
  const sessionReqRef     = useRef([]);
  const notifsRef         = useRef([]);
  useEffect(() => { reportsRef.current    = parentReports;    }, [parentReports]);
  useEffect(() => { resourcesRef.current  = resources;        }, [resources]);
  useEffect(() => { sessionReqRef.current = sessionRequests;  }, [sessionRequests]);
  useEffect(() => { notifsRef.current     = adminNotifs;      }, [adminNotifs]);

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
    fetch(`${import.meta.env.VITE_API_URL}/api/admin/${userId}/me`, { headers: { Authorization: `Bearer ${token}` } })
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

    fetch(`${import.meta.env.VITE_API_URL}/api/admin/${userId}/students`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : [])
      .then(data => { if (Array.isArray(data)) setStudents(data); })
      .catch(() => {});

    fetch(`${import.meta.env.VITE_API_URL}/api/admin/${userId}/faculty`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : [])
      .then(data => { if (Array.isArray(data)) setFacultyList(data); })
      .catch(() => {});

    fetch(`${import.meta.env.VITE_API_URL}/api/admin/${userId}/resources`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : [])
      .then(data => { if (Array.isArray(data)) setResources(data); })
      .catch(() => {});

    fetch(`${import.meta.env.VITE_API_URL}/api/admin/${userId}/messages`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : [])
      .then(data => { if (Array.isArray(data)) setSentMessages(data); })
      .catch(() => {});

    fetch(`${import.meta.env.VITE_API_URL}/api/admin/${userId}/reports`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : [])
      .then(data => { if (Array.isArray(data)) setParentReports(data); })
      .catch(() => {});

    fetch(`${import.meta.env.VITE_API_URL}/api/admin/${userId}/session-requests`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : [])
      .then(data => { if (Array.isArray(data)) setSessionRequests(data); })
      .catch(() => {});

    fetch(`${import.meta.env.VITE_API_URL}/api/admin/${userId}/notifications`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : [])
      .then(data => { if (Array.isArray(data)) setAdminNotifs(data); })
      .catch(() => {});

    fetch(`${import.meta.env.VITE_API_URL}/api/admin/${userId}/analytics`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data && !data.error) setAnalytics(data); })
      .catch(() => {});

    fetch(`${import.meta.env.VITE_API_URL}/api/admin/${userId}/access-log`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : [])
      .then(data => { if (Array.isArray(data)) setAccessLog(data); })
      .catch(() => {});

    fetch(`${import.meta.env.VITE_API_URL}/api/admin/${userId}/faculty-applications`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : {})
      .then(data => { if (Array.isArray(data.applications)) setFacultyApplications(data.applications); })
      .catch(() => {});
  }, []);

  // Refresh faculty + enrollment applications every 20s: a stale faculty list
  // is what hides newly created faculty from the assign dropdowns, and a new
  // self-enrollment should reach the admin without a reload.
  useEffect(() => {
    if (!profile) return;
    const token = localStorage.getItem('token');
    const load = () => {
      fetch(`${import.meta.env.VITE_API_URL}/api/admin/${userId}/faculty`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.ok ? r.json() : [])
        .then(data => { if (Array.isArray(data)) setFacultyList(data); })
        .catch(() => {});
      fetch(`${import.meta.env.VITE_API_URL}/api/admin/${userId}/faculty-applications`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.ok ? r.json() : {})
        .then(data => { if (Array.isArray(data.applications)) setFacultyApplications(data.applications); })
        .catch(() => {});
    };
    const id = setInterval(load, 20000);
    return () => clearInterval(id);
  }, [profile, userId]);

  // Poll reports every 20s — show toast when new submissions arrive
  useEffect(() => {
    if (!profile) return;
    const token = localStorage.getItem('token');
    if (!token) return;
    const id = setInterval(() => {
      fetch(`${import.meta.env.VITE_API_URL}/api/admin/${userId}/reports`, { headers: { Authorization: `Bearer ${token}` } })
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
      fetch(`${import.meta.env.VITE_API_URL}/api/admin/${userId}/resources`, { headers: { Authorization: `Bearer ${token}` } })
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

  // Poll session requests every 20s — toast when a new one arrives
  useEffect(() => {
    if (!profile) return;
    const token = localStorage.getItem('token');
    if (!token) return;
    const id = setInterval(() => {
      fetch(`${import.meta.env.VITE_API_URL}/api/admin/${userId}/session-requests`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.ok ? r.json() : null)
        .then(fresh => {
          if (!Array.isArray(fresh)) return;
          const prev = sessionReqRef.current;
          const newReqs = fresh.filter(f => !prev.find(p => p.id === f.id));
          newReqs.forEach(r => showToast(`📚 New session request from ${r.studentName} — "${r.topic.slice(0, 50)}…"`));
          setSessionRequests(fresh);
        })
        .catch(() => {});
    }, 20000);
    return () => clearInterval(id);
  }, [profile]);

  // Poll assignment tasks every 20s — toast when a new pending task arrives
  useEffect(() => {
    if (!profile) return;
    const token = localStorage.getItem('token');
    if (!token) return;
    const id = setInterval(() => {
      fetch(`${import.meta.env.VITE_API_URL}/api/admin/${userId}/notifications`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.ok ? r.json() : null)
        .then(fresh => {
          if (!Array.isArray(fresh)) return;
          const prev = notifsRef.current;
          const newPending = fresh.filter(f => f.status === 'pending' && !prev.some(p => p.id === f.id));
          newPending.forEach(n => showToast(`New task: ${n.content}`));
          setAdminNotifs(fresh);
        })
        .catch(() => {});
    }, 20000);
    return () => clearInterval(id);
  }, [profile]);

  const markNotifRead = async (id) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    setAdminNotifs(prev => prev.map(n => n.id === id ? { ...n, readAt: new Date().toISOString() } : n));
    await fetch(`${import.meta.env.VITE_API_URL}/api/admin/${userId}/notifications/${id}/read`, {
      method: 'PUT', headers: { Authorization: `Bearer ${token}` },
    }).catch(() => {});
  };

  const markAllNotifsRead = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    const now = new Date().toISOString();
    setAdminNotifs(prev => prev.map(n => n.readAt ? n : { ...n, readAt: now }));
    await fetch(`${import.meta.env.VITE_API_URL}/api/admin/${userId}/notifications/read-all`, {
      method: 'PUT', headers: { Authorization: `Bearer ${token}` },
    }).catch(() => {});
    showToast('All tasks marked as read ✓');
  };

  const showToast = (msg) => {
    setToast({ show: true, msg });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(t => ({ ...t, show: false })), 3200);
  };

  const isSuperAdmin = profile?.role === 'superadmin';

  useEffect(() => {
    if (!isSuperAdmin) return;
    const token = localStorage.getItem('token');
    fetch(`${import.meta.env.VITE_API_URL}/api/admin/${userId}/admins`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : [])
      .then(data => { if (Array.isArray(data)) setAdminAccounts(data); })
      .catch(() => {});
  }, [isSuperAdmin]);

  const deactivateAdmin = async (adminId) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/${userId}/admins/${adminId}/deactivate`, {
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

  const sendMessage = async (to, type, content, targetPlan) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/${userId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ studentId: to, content: content.trim(), type, targetPlan: targetPlan && targetPlan !== 'all' ? targetPlan : null }),
    });
    if (!res.ok) throw new Error('Failed to send');
    const PLAN_LABEL = { spark: 'Spark only', forge: 'Forge & above', apex: 'Apex only', anchor: 'Anchor only' };
    let recipient;
    if (Array.isArray(to)) {
      // Fix 1: use String coercion so number/string IDs both match
      const names = to.map(id => students.find(s => String(s.id) === String(id))?.name).filter(Boolean);
      recipient = names.length <= 3 ? names.join(', ') : `${names.slice(0, 2).join(', ')} +${names.length - 2} more`;
    } else if (to === 'all') {
      recipient = targetPlan && targetPlan !== 'all' ? PLAN_LABEL[targetPlan] + ' students' : 'All Students';
    } else {
      recipient = students.find(s => String(s.id) === String(to))?.name || 'Student';
    }
    showToast(`Message sent to ${recipient} ✓`);
    // Refresh history separately — isolated so a refresh failure never causes
    // the caller to think the send itself failed
    try {
      const fresh = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/${userId}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (fresh.ok) {
        const freshData = await fresh.json();
        if (Array.isArray(freshData)) setSentMessages(freshData);
      }
    } catch { /* history refresh failed — send still succeeded */ }
  };

  const approveResource = async (id) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/${userId}/resources/${id}/approve`, {
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
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/${userId}/resources/${id}/decline`, {
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
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/${userId}/reports/${id}/approve`, {
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
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/${userId}/reports/${id}/reject`, {
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
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/${userId}/reports/approve-all`, {
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
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/${userId}/reports/send`, {
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
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/${userId}/admins/${adminId}/reactivate`, {
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
        onNav={(page) => { setActivePage(page); setNavOpen(false); }}
        onShowToast={showToast}
        profile={profile}
        studentsCount={students.length}
        facultyCount={facultyList.length}
        pendingApprovalsCount={resources.filter(r => r.status === 'pending').length}
        pendingReportsCount={parentReports.filter(r => r.status === 'submitted').length}
        pendingSessionRequests={sessionRequests.filter(r => r.status === 'pending').length}
        pendingTasksCount={adminNotifs.filter(n => n.status === 'pending').length}
        isOpen={navOpen}
        onClose={() => setNavOpen(false)}
      />
      {navOpen && <div className="sidebar-backdrop" onClick={() => setNavOpen(false)} />}
      <div className="admin-main">
        <AdminTopbar
          activePage={activePage}
          isSuperAdmin={isSuperAdmin}
          onNav={(page) => { setActivePage(page); setNavOpen(false); }}
          onMenuClick={() => setNavOpen(true)}
          unreadTasks={adminNotifs.filter(n => !n.readAt).length}
        />
        <AdminContent
          activePage={activePage}
          onOpenModal={setOpenModal}
          onNav={setActivePage}
          onShowToast={showToast}
          profile={profile}
          students={students}
          facultyList={facultyList}
          onFacultyStatusUpdated={(id, isActive) => setFacultyList(prev => prev.map(f => f.id === id ? { ...f, isActive } : f))}
          onFacultyUpdated={(f) => setFacultyList(prev => prev.map(x => x.id === f.id ? { ...x, ...f } : x))}
          onFacultyDeleted={(id) => setFacultyList(prev => prev.filter(x => x.id !== id))}
          onStudentMentorUpdated={(userId, mentorId, mentorName) => setStudents(prev => prev.map(s => s.userId === userId ? { ...s, mentorId, mentorName } : s))}
          onStudentSubjectFacultyUpdated={(userId, subjectFaculty) => setStudents(prev => prev.map(s => s.userId === userId ? { ...s, subjectFaculty } : s))}
          onStudentPlanUpdated={(userId, plan) => setStudents(prev => prev.map(s => s.userId === userId ? { ...s, plan } : s))}
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
          sessionRequests={sessionRequests}
          onSessionRequestsUpdated={setSessionRequests}
          adminNotifications={adminNotifs}
          onMarkNotifRead={markNotifRead}
          onMarkAllNotifsRead={markAllNotifsRead}
          analytics={analytics}
          accessLog={accessLog}
          facultyApplications={facultyApplications}
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
        userId={userId}
        onFacultyAdded={f => setFacultyList(prev => [...prev, f])}
        facultyApplications={facultyApplications}
        facultyList={facultyList}
        onStudentAdded={s => setStudents(prev => [...prev, s])}
      />
    </div>
  );
};

export default AdminLMS;
