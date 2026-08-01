import React, { useState, useRef, useEffect } from 'react';
import { useActivePage } from '../hooks/useActivePage';
import '../components/free-lms/FreeStyles.css';
import FreeSidebar from '../components/free-lms/FreeSidebar';
import FreeTopbar from '../components/free-lms/FreeTopbar';
import FreeContent from '../components/free-lms/FreeContent';
import FreeModals from '../components/free-lms/FreeModals';

const FreeLMS = () => {
  const [activePage, setActivePage, userId] = useActivePage('/student', 'home');
  const [navOpen, setNavOpen] = useState(false);
  const [openModal, setOpenModal] = useState(null);
  const [toast, setToast] = useState({ show: false, msg: '' });
  const [profile, setProfile] = useState(null);
  const [habitLogs, setHabitLogs] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [sessionRequests, setSessionRequests] = useState([]);
  const toastTimer      = useRef(null);
  const sessionReqRef   = useRef([]);
  const notifRef        = useRef([]);
  React.useEffect(() => { sessionReqRef.current = sessionRequests; }, [sessionRequests]);
  React.useEffect(() => { notifRef.current      = notifications;   }, [notifications]);

  useEffect(() => {
    document.documentElement.classList.add('free-mode');
    document.body.classList.add('free-mode');
    return () => {
      document.documentElement.classList.remove('free-mode');
      document.body.classList.remove('free-mode');
    };
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    fetch(`${import.meta.env.VITE_API_URL}/api/student/${userId}/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => {
        if (!r.ok) { localStorage.removeItem('token'); window.location.href = '/'; return null; }
        return r.json();
      })
      .then(data => { if (data && !data.error) setProfile(data); })
      .catch(() => {});

    fetch(`${import.meta.env.VITE_API_URL}/api/student/${userId}/habits`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (Array.isArray(data)) setHabitLogs(data); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token || !userId) return;
    fetch(`${import.meta.env.VITE_API_URL}/api/student/${userId}/notifications`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : [])
      .then(data => { if (Array.isArray(data)) setNotifications(data); })
      .catch(() => {});

    fetch(`${import.meta.env.VITE_API_URL}/api/student/${userId}/session-requests`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : [])
      .then(data => { if (Array.isArray(data)) setSessionRequests(data); })
      .catch(() => {});

    // Poll every 20s — update session status + notifications without manual refresh
    const poll = setInterval(() => {
      fetch(`${import.meta.env.VITE_API_URL}/api/student/${userId}/session-requests`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(r => r.ok ? r.json() : null)
        .then(fresh => {
          if (!Array.isArray(fresh)) return;
          const prev = sessionReqRef.current;
          fresh.forEach(f => {
            const old = prev.find(p => p.id === f.id);
            if (old && old.status !== f.status) {
              if (f.status === 'assigned')
                showToast(`Session confirmed! ${f.facultyName ? f.facultyName + ' · ' : ''}Check Sessions page for details.`);
              if (f.status === 'cancelled')
                showToast('Your session request was cancelled. You can submit a new one.');
            }
          });
          setSessionRequests(fresh);
        })
        .catch(() => {});

      fetch(`${import.meta.env.VITE_API_URL}/api/student/${userId}/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(r => r.ok ? r.json() : null)
        .then(fresh => {
          if (!Array.isArray(fresh)) return;
          setNotifications(fresh);
        })
        .catch(() => {});
    }, 20000);

    return () => clearInterval(poll);
  }, [userId]);

  const markNotifRead = async (id) => {
    const token = localStorage.getItem('token');
    await fetch(`${import.meta.env.VITE_API_URL}/api/student/${userId}/notifications/${id}/read`, {
      method: 'PUT', headers: { Authorization: `Bearer ${token}` },
    }).catch(() => {});
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, readAt: new Date().toISOString() } : n));
  };

  const markAllNotifRead = async () => {
    const token = localStorage.getItem('token');
    const unread = notifications.filter(n => !n.readAt);
    await Promise.all(unread.map(n =>
      fetch(`${import.meta.env.VITE_API_URL}/api/student/${userId}/notifications/${n.id}/read`, {
        method: 'PUT', headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {})
    ));
    setNotifications(prev => prev.map(n => ({ ...n, readAt: n.readAt || new Date().toISOString() })));
    if (unread.length > 0) showToast('All notifications marked as read ✓');
  };

  const showToast = (msg) => {
    setToast({ show: true, msg });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(t => ({ ...t, show: false })), 3200);
  };

  const navigate = (page) => {
    setActivePage(page);
    setNavOpen(false);
  };

  return (
    <div className="free-app">
      <FreeSidebar activePage={activePage} onNav={navigate} profile={profile} onOpenModal={setOpenModal} isOpen={navOpen} onClose={() => setNavOpen(false)} />
      {navOpen && <div className="sidebar-backdrop" onClick={() => setNavOpen(false)} />}
      <div className="free-main">
        <FreeTopbar activePage={activePage} onNav={navigate} unreadCount={notifications.filter(n => !n.readAt).length} plan={profile?.studentProfile?.plan || 'spark'} onMenuClick={() => setNavOpen(true)} />
        <FreeContent
          activePage={activePage}
          onNav={setActivePage}
          onOpenModal={setOpenModal}
          onShowToast={showToast}
          profile={profile}
          habitLogs={habitLogs}
          notifications={notifications}
          onMarkNotifRead={markNotifRead}
          onMarkAllNotifRead={markAllNotifRead}
          onHabitSaved={(log) => setHabitLogs(prev => {
            const exists = prev.findIndex(l => l.date === log.date);
            if (exists >= 0) { const next = [...prev]; next[exists] = log; return next; }
            return [log, ...prev].slice(0, 14);
          })}
          sessionRequests={sessionRequests}
          onSessionRequestSubmitted={(req) => setSessionRequests(prev => [req, ...prev])}
        />
      </div>
      <FreeModals
        openModal={openModal}
        onClose={() => setOpenModal(null)}
        onShowToast={showToast}
        toast={toast}
      />
    </div>
  );
};

export default FreeLMS;

