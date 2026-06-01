import React, { useState, useRef, useEffect } from 'react';
import { useActivePage } from '../hooks/useActivePage';
import '../components/free-lms/FreeStyles.css';
import FreeSidebar from '../components/free-lms/FreeSidebar';
import FreeTopbar from '../components/free-lms/FreeTopbar';
import FreeContent from '../components/free-lms/FreeContent';
import FreeModals from '../components/free-lms/FreeModals';

const FreeLMS = () => {
  const [activePage, setActivePage] = useActivePage('/student', 'home');
  const [openModal, setOpenModal] = useState(null);
  const [toast, setToast] = useState({ show: false, msg: '' });
  const [profile, setProfile] = useState(null);
  const [habitLogs, setHabitLogs] = useState([]);
  const toastTimer = useRef(null);

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
    fetch('http://localhost:5000/api/student/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data && !data.error) setProfile(data); })
      .catch(() => {});

    fetch('http://localhost:5000/api/student/habits', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (Array.isArray(data)) setHabitLogs(data); })
      .catch(() => {});
  }, []);

  const showToast = (msg) => {
    setToast({ show: true, msg });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(t => ({ ...t, show: false })), 3200);
  };

  return (
    <div className="free-app">
      <FreeSidebar activePage={activePage} onNav={setActivePage} profile={profile} />
      <div className="free-main">
        <FreeTopbar activePage={activePage} onNav={setActivePage} />
        <FreeContent
          activePage={activePage}
          onNav={setActivePage}
          onOpenModal={setOpenModal}
          onShowToast={showToast}
          profile={profile}
          onDiagnosticSaved={(score, takenAt) =>
            setProfile(prev => prev ? {
              ...prev,
              studentProfile: { ...prev.studentProfile, diagnosticScore: score, diagnosticTakenAt: takenAt },
            } : prev)
          }
          habitLogs={habitLogs}
          onHabitSaved={(log) => setHabitLogs(prev => {
            const exists = prev.findIndex(l => l.date === log.date);
            if (exists >= 0) { const next = [...prev]; next[exists] = log; return next; }
            return [log, ...prev].slice(0, 14);
          })}
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

