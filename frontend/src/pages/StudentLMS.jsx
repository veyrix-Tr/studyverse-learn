import { useState, useRef, useEffect } from 'react';
import { useActivePage } from '../hooks/useActivePage';
import '../components/student-lms/StudentStyles.css';
import StudentSidebar from '../components/student-lms/StudentSidebar';
import StudentTopbar from '../components/student-lms/StudentTopbar';
import StudentContent from '../components/student-lms/StudentContent';
import StudentModals from '../components/student-lms/StudentModals';

const NOTIF_NAV = {
  'Session Note':      'sessions',
  'Schedule Update':   'sessions',
  'Reminder':          'dashboard',
  'Motivational Note': 'dashboard',
  'Announcement':      'notif',
  'Doubt Answered':    'doubt',
  'Weekly Report':     'parent',
};

const StudentLMS = () => {
  const [activePage, setActivePage, userId] = useActivePage('/student-v2', 'dashboard');
  const [openModal, setOpenModal] = useState(null);
  const [toast, setToast] = useState({ show: false, msg: '' });
  const [profile, setProfile] = useState(null);
  const [scores, setScores] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [doubts, setDoubts] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [resources, setResources] = useState([]);
  const [parentReports, setParentReports] = useState(null);
  const toastTimer        = useRef(null);
  const doubtsRef         = useRef([]);
  const notificationsRef  = useRef([]);
  useEffect(() => { doubtsRef.current        = doubts;        }, [doubts]);
  useEffect(() => { notificationsRef.current = notifications; }, [notifications]);

  useEffect(() => {
    document.documentElement.classList.add('student-mode');
    document.body.classList.add('student-mode');
    return () => {
      document.documentElement.classList.remove('student-mode');
      document.body.classList.remove('student-mode');
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

    fetch(`${import.meta.env.VITE_API_URL}/api/student/${userId}/scores`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data && data.weeks) setScores(data.weeks); })
      .catch(() => {});

    fetch(`${import.meta.env.VITE_API_URL}/api/student/${userId}/sessions`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (Array.isArray(data)) setSessions(data); })
      .catch(() => {});

    fetch(`${import.meta.env.VITE_API_URL}/api/student/${userId}/doubts`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (Array.isArray(data)) setDoubts(data); })
      .catch(() => {});

    fetch(`${import.meta.env.VITE_API_URL}/api/student/${userId}/notifications`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (Array.isArray(data)) setNotifications(data); })
      .catch(() => {});

    fetch(`${import.meta.env.VITE_API_URL}/api/student/${userId}/resources`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (Array.isArray(data)) setResources(data); })
      .catch(() => {});

    fetch(`${import.meta.env.VITE_API_URL}/api/student/${userId}/reports`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data && (data.subjects || data.reports)) setParentReports(data); })
      .catch(() => {});
  }, []);

  const showToast = (msg, onClick) => {
    setToast({ show: true, msg, onClick: onClick || null });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(t => ({ ...t, show: false })), onClick ? 6000 : 3000);
  };

  // Poll doubts + notifications every 15s only after student profile is confirmed loaded
  useEffect(() => {
    if (!profile) return;
    const token = localStorage.getItem('token');
    if (!token) return;
    const id = setInterval(() => {
      fetch(`${import.meta.env.VITE_API_URL}/api/student/${userId}/doubts`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(r => r.ok ? r.json() : null)
        .then(fresh => {
          if (!Array.isArray(fresh)) return;
          const prev = doubtsRef.current;
          fresh.forEach(nd => {
            const old = prev.find(d => d.id === nd.id);
            if (nd.answeredAt && old && !old.answeredAt)
              showToast(`${nd.facultyName} answered your ${nd.subject} doubt — tap to view`, () => setActivePage('doubt'));
            else if (nd.answeredAt && old && old.answeredAt && old.answer !== nd.answer)
              showToast(`${nd.facultyName} updated their ${nd.subject} answer — tap to view`, () => setActivePage('doubt'));
          });
          setDoubts(fresh);
        })
        .catch(() => {});

      fetch(`${import.meta.env.VITE_API_URL}/api/student/${userId}/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(r => r.ok ? r.json() : null)
        .then(fresh => {
          if (!Array.isArray(fresh)) return;
          const prev = notificationsRef.current;
          const newOnes = fresh.filter(fn => !fn.readAt && !prev.some(n => n.id === fn.id));
          const hasNewReport   = newOnes.some(n => n.type === 'Weekly Report');
          const hasNewResource = newOnes.some(n => n.type === 'New Resource');
          const hasSessionNote = newOnes.some(n => n.type === 'Session Note' || n.type === 'Reminder');
          newOnes.forEach(n => {
            const page = NOTIF_NAV[n.type] || 'notif';
            showToast(`${n.type}: ${n.content.length > 60 ? n.content.slice(0, 60) + '…' : n.content}`, () => setActivePage(page));
          });
          setNotifications(fresh);
          if (hasNewReport) {
            fetch(`${import.meta.env.VITE_API_URL}/api/student/${userId}/reports`, { headers: { Authorization: `Bearer ${token}` } })
              .then(r => r.ok ? r.json() : null)
              .then(rd => { if (rd && (rd.subjects || rd.reports)) setParentReports(rd); })
              .catch(() => {});
          }
          if (hasNewResource) {
            fetch(`${import.meta.env.VITE_API_URL}/api/student/${userId}/resources`, { headers: { Authorization: `Bearer ${token}` } })
              .then(r => r.ok ? r.json() : null)
              .then(rd => { if (Array.isArray(rd)) setResources(rd); })
              .catch(() => {});
          }
          if (hasSessionNote) {
            fetch(`${import.meta.env.VITE_API_URL}/api/student/${userId}/sessions`, { headers: { Authorization: `Bearer ${token}` } })
              .then(r => r.ok ? r.json() : null)
              .then(rd => { if (Array.isArray(rd)) setSessions(rd); })
              .catch(() => {});
          }
        })
        .catch(() => {});
    }, 15000);
    return () => clearInterval(id);
  }, [profile]); // starts only once profile is loaded, cleans up on unmount

  const markAllNotificationsRead = () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    setNotifications(prev => {
      const unread = prev.filter(n => !n.readAt);
      unread.forEach(n => {
        fetch(`${import.meta.env.VITE_API_URL}/api/student/${userId}/notifications/${n.id}/read`, {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}` },
        }).catch(() => {});
      });
      return prev.map(n => n.readAt ? n : { ...n, readAt: new Date().toISOString() });
    });
  };

  // Auto-mark all read when student opens the notifications page
  useEffect(() => {
    if (activePage === 'notif') markAllNotificationsRead();
  }, [activePage]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleNotificationClick = (id, type) => {
    const token = localStorage.getItem('token');
    if (token) {
      fetch(`${import.meta.env.VITE_API_URL}/api/student/${userId}/notifications/${id}/read`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, readAt: new Date().toISOString() } : n));
    const page = NOTIF_NAV[type] || 'notif';
    setActivePage(page);
  };

  return (
    <div className="student-app">
      <StudentSidebar
        activePage={activePage}
        onNav={setActivePage}
        profile={profile}
        upcomingSessionsCount={sessions.filter(s => new Date(s.scheduledAt) > new Date()).length}
        openDoubtsCount={doubts.filter(d => !d.answeredAt).length}
      />
      <div className="student-main">
        <StudentTopbar
          activePage={activePage}
          onOpenModal={setOpenModal}
          onNav={setActivePage}
          unreadCount={notifications.filter(n => !n.readAt).length}
        />
        <StudentContent
          activePage={activePage}
          onOpenModal={setOpenModal}
          onNav={setActivePage}
          onShowToast={showToast}
          profile={profile}
          scores={scores}
          sessions={sessions}
          doubts={doubts}
          notifications={notifications}
          onMarkNotificationsRead={markAllNotificationsRead}
          onNotificationClick={handleNotificationClick}
          resources={resources}
          parentReports={parentReports}
        />
      </div>
      <StudentModals
        openModal={openModal}
        onClose={() => setOpenModal(null)}
        onShowToast={showToast}
        toast={toast}
        profile={profile}
        onDoubtPosted={doubt => setDoubts(prev => [doubt, ...prev])}
      />
    </div>
  );
};

export default StudentLMS;
