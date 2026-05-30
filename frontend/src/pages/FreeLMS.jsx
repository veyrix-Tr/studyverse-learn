import React, { useState, useRef, useEffect } from 'react';
import '../components/free-lms/FreeStyles.css';
import FreeSidebar from '../components/free-lms/FreeSidebar';
import FreeTopbar from '../components/free-lms/FreeTopbar';
import FreeContent from '../components/free-lms/FreeContent';
import FreeModals from '../components/free-lms/FreeModals';

const FreeLMS = () => {
  const [activePage, setActivePage] = useState('home');
  const [openModal, setOpenModal] = useState(null);
  const [toast, setToast] = useState({ show: false, msg: '' });
  const [profile, setProfile] = useState(null);
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

