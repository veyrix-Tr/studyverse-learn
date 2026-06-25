import { useState, useEffect, useRef } from 'react';
import { useActivePage } from '../hooks/useActivePage';
import '../components/anchor-lms/AnchorStyles.css';
import AnchorSidebar from '../components/anchor-lms/AnchorSidebar';
import AnchorTopbar from '../components/anchor-lms/AnchorTopbar';
import AnchorContent from '../components/anchor-lms/AnchorContent';

const AnchorLMS = () => {
  const [activePage, setActivePage, userId] = useActivePage('/anchor', 'dashboard');
  const [toast, setToast] = useState({ show: false, msg: '' });
  const [profile, setProfile] = useState(null);
  const toastTimer = useRef(null);

  useEffect(() => {
    document.documentElement.classList.add('anchor-mode');
    document.body.classList.add('anchor-mode');
    return () => {
      document.documentElement.classList.remove('anchor-mode');
      document.body.classList.remove('anchor-mode');
    };
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    fetch(`${import.meta.env.VITE_API_URL}/api/student/${userId}/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => { if (!r.ok) { localStorage.removeItem('token'); window.location.href = '/'; return null; } return r.json(); })
      .then(data => { if (data && !data.error) setProfile(data); })
      .catch(() => {});
  }, [userId]);

  const showToast = (msg) => {
    setToast({ show: true, msg });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(t => ({ ...t, show: false })), 3200);
  };

  return (
    <div className="anchor-app">
      <AnchorSidebar activePage={activePage} onNav={setActivePage} profile={profile} />
      <div className="anchor-main">
        <AnchorTopbar activePage={activePage} onNav={setActivePage} />
        <AnchorContent activePage={activePage} onNav={setActivePage} onShowToast={showToast} />
      </div>
      <div className={`toast${toast.show ? ' show' : ''}`}>
        <div className="tpip" />
        <span>{toast.msg}</span>
      </div>
    </div>
  );
};

export default AnchorLMS;
