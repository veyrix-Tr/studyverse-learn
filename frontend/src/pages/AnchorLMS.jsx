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
  const toastTimer = useRef(null);

  // Apply anchor-mode always; add free-mode only for study pages so FreeContent CSS works
  useEffect(() => {
    document.documentElement.classList.add('anchor-mode');
    document.body.classList.add('anchor-mode');
    return () => {
      document.documentElement.classList.remove('anchor-mode', 'free-mode');
      document.body.classList.remove('anchor-mode', 'free-mode');
      document.documentElement.classList.remove('free-mode');
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

    fetch(`${import.meta.env.VITE_API_URL}/api/student/${userId}/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => { if (!r.ok) { localStorage.removeItem('token'); window.location.href = '/'; return null; } return r.json(); })
      .then(data => { if (data && !data.error) setProfile(data); })
      .catch(() => {});

    fetch(`${import.meta.env.VITE_API_URL}/api/student/${userId}/habits`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (Array.isArray(data)) setHabitLogs(data); })
      .catch(() => {});

    fetch(`${import.meta.env.VITE_API_URL}/api/student/${userId}/resources`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : [])
      .then(data => { if (Array.isArray(data)) setResources(data); })
      .catch(() => {});

    fetch(`${import.meta.env.VITE_API_URL}/api/student/${userId}/daily-reports`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : [])
      .then(data => { if (Array.isArray(data)) setDailyReports(data); })
      .catch(() => {});
  }, [userId]);

  const showToast = (msg) => {
    setToast({ show: true, msg });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(t => ({ ...t, show: false })), 3200);
  };

  const isStudyPage = STUDY_PAGES.includes(activePage);

  return (
    <div className="anchor-app">
      <AnchorSidebar
        activePage={activePage}
        onNav={setActivePage}
        profile={profile}
        reportDoneToday={dailyReports.some(r => r.date === new Date(Date.now() + 5.5 * 60 * 60 * 1000).toISOString().slice(0, 10))}
      />
      <div className="anchor-main">
        <AnchorTopbar activePage={activePage} onNav={setActivePage} />

        {isStudyPage ? (
          <FreeContent
            activePage={activePage}
            onNav={setActivePage}
            onOpenModal={() => {}}
            onShowToast={showToast}
            profile={profile}
            habitLogs={habitLogs}
            onHabitSaved={(log) => setHabitLogs(prev => {
              const exists = prev.findIndex(l => l.date === log.date);
              if (exists >= 0) { const next = [...prev]; next[exists] = log; return next; }
              return [log, ...prev].slice(0, 14);
            })}
            notifications={[]}
            onMarkNotifRead={() => {}}
            onMarkAllNotifRead={() => {}}
          />
        ) : (
          <AnchorContent
            activePage={activePage}
            onNav={setActivePage}
            onShowToast={showToast}
            habitLogs={habitLogs}
            resources={resources}
            dailyReports={dailyReports}
            profile={profile}
            onReportSubmitted={(report) => setDailyReports(prev => [report, ...prev])}
            onHabitSaved={(log) => setHabitLogs(prev => {
              const exists = prev.findIndex(l => l.date === log.date);
              if (exists >= 0) { const next = [...prev]; next[exists] = log; return next; }
              return [log, ...prev].slice(0, 14);
            })}
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
