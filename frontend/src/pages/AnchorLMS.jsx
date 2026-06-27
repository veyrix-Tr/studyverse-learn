import { useState, useEffect, useRef } from 'react';
import { useActivePage } from '../hooks/useActivePage';
import '../components/free-lms/FreeStyles.css';
import '../components/anchor-lms/AnchorStyles.css';
import AnchorSidebar from '../components/anchor-lms/AnchorSidebar';
import AnchorTopbar from '../components/anchor-lms/AnchorTopbar';
import AnchorContent from '../components/anchor-lms/AnchorContent';
import FreeContent from '../components/free-lms/FreeContent';

const STUDY_PAGES = ['diagnostic', 'topics', 'guidance'];

const AnchorLMS = () => {
  const [activePage, setActivePage, userId] = useActivePage('/anchor', 'dashboard');
  const [toast, setToast] = useState({ show: false, msg: '' });
  const [profile, setProfile] = useState(null);
  const [habitLogs, setHabitLogs] = useState([]);
  const [resources, setResources] = useState([]);
  const [dailyReports, setDailyReports] = useState([]);
  const [mentorNotes, setMentorNotes] = useState([]);
  const [mentorCalls, setMentorCalls] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const toastTimer = useRef(null);

  useEffect(() => {
    document.documentElement.classList.add('anchor-mode');
    document.body.classList.add('anchor-mode');
    return () => {
      document.documentElement.classList.remove('anchor-mode', 'free-mode');
      document.body.classList.remove('anchor-mode', 'free-mode');
    };
  }, []);

  useEffect(() => {
    if (STUDY_PAGES.includes(activePage)) {
      document.documentElement.classList.add('free-mode');
      document.body.classList.add('free-mode');
    } else {
      document.documentElement.classList.remove('free-mode');
      document.body.classList.remove('free-mode');
    }
  }, [activePage]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token || !userId) return;
    const h = { Authorization: `Bearer ${token}` };
    const api = import.meta.env.VITE_API_URL;
    const get = (path, setter, fallback = []) =>
      fetch(`${api}${path}`, { headers: h })
        .then(r => r.ok ? r.json() : fallback)
        .then(d => { if (Array.isArray(d) || (d && !d.error)) setter(d); })
        .catch(() => {});

    get(`/api/student/${userId}/me`, d => { if (d && !d.error) setProfile(d); }, null);
    get(`/api/student/${userId}/habits`, setHabitLogs);
    get(`/api/student/${userId}/resources`, setResources);
    get(`/api/student/${userId}/daily-reports`, setDailyReports);
    get(`/api/student/${userId}/mentor-notes`, setMentorNotes);
    get(`/api/student/${userId}/mentor-calls`, setMentorCalls);
    get(`/api/student/${userId}/notifications`, setNotifications);

    // Poll notifications + mentor data every 15s so student sees updates without refresh
    const poll = setInterval(() => {
      get(`/api/student/${userId}/notifications`, setNotifications);
      get(`/api/student/${userId}/mentor-notes`, setMentorNotes);
      get(`/api/student/${userId}/mentor-calls`, setMentorCalls);
    }, 15000);
    return () => clearInterval(poll);
  }, [userId]);

  const showToast = (msg) => {
    setToast({ show: true, msg });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(t => ({ ...t, show: false })), 3200);
  };

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
    if (unread.length) showToast('All notifications marked as read ✓');
  };

  const isStudyPage = STUDY_PAGES.includes(activePage);
  const today = new Date(Date.now() + 5.5 * 60 * 60 * 1000).toISOString().slice(0, 10);

  return (
    <div className="anchor-app">
      <AnchorSidebar
        activePage={activePage}
        onNav={setActivePage}
        profile={profile}
        reportDoneToday={dailyReports.some(r => r.date === today)}
        unreadCount={notifications.filter(n => !n.readAt).length}
      />
      <div className="anchor-main">
        <AnchorTopbar
          activePage={activePage}
          onNav={setActivePage}
          unreadCount={notifications.filter(n => !n.readAt).length}
          profile={profile}
        />

        {isStudyPage ? (
          <FreeContent
            activePage={activePage}
            onNav={setActivePage}
            onOpenModal={() => {}}
            onShowToast={showToast}
            profile={profile}
            habitLogs={habitLogs}
            onHabitSaved={(log) => setHabitLogs(prev => {
              const i = prev.findIndex(l => l.date === log.date);
              if (i >= 0) { const n = [...prev]; n[i] = log; return n; }
              return [log, ...prev].slice(0, 14);
            })}
            notifications={[]}
            onMarkNotifRead={() => {}}
            onMarkAllNotifRead={() => {}}
            isAnchor={true}
          />
        ) : (
          <AnchorContent
            activePage={activePage}
            onNav={setActivePage}
            onShowToast={showToast}
            habitLogs={habitLogs}
            resources={resources}
            dailyReports={dailyReports}
            mentorNotes={mentorNotes}
            mentorCalls={mentorCalls}
            notifications={notifications}
            profile={profile}
            onReportSubmitted={(report) => setDailyReports(prev => [report, ...prev])}
            onHabitSaved={(log) => setHabitLogs(prev => {
              const i = prev.findIndex(l => l.date === log.date);
              if (i >= 0) { const n = [...prev]; n[i] = log; return n; }
              return [log, ...prev].slice(0, 14);
            })}
            onMarkNotifRead={markNotifRead}
            onMarkAllNotifRead={markAllNotifRead}
          />
        )}
      </div>
      <div className={`toast${toast.show ? ' show' : ''}`}>
        <div className="tpip" />
        <span>{toast.msg}</span>
      </div>
    </div>
  );
};

export default AnchorLMS;
