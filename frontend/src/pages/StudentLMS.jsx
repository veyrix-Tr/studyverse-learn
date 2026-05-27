import { useState, useRef, useEffect } from 'react';
import '../components/student-lms/StudentStyles.css';
import StudentSidebar from '../components/student-lms/StudentSidebar';
import StudentTopbar from '../components/student-lms/StudentTopbar';
import StudentContent from '../components/student-lms/StudentContent';
import StudentModals from '../components/student-lms/StudentModals';

const StudentLMS = () => {
  const [activePage, setActivePage] = useState('dashboard');
  const [openModal, setOpenModal] = useState(null);
  const [toast, setToast] = useState({ show: false, msg: '' });
  const [profile, setProfile] = useState(null);
  const [scores, setScores] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [doubts, setDoubts] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const toastTimer = useRef(null);

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
    fetch('http://localhost:5000/api/student/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data && !data.error) setProfile(data); })
      .catch(() => {});

    fetch('http://localhost:5000/api/student/scores', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data && data.weeks) setScores(data.weeks); })
      .catch(() => {});

    fetch('http://localhost:5000/api/student/sessions', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (Array.isArray(data)) setSessions(data); })
      .catch(() => {});

    fetch('http://localhost:5000/api/student/doubts', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (Array.isArray(data)) setDoubts(data); })
      .catch(() => {});

    fetch('http://localhost:5000/api/student/notifications', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (Array.isArray(data)) setNotifications(data); })
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
      fetch('http://localhost:5000/api/student/doubts', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(r => r.ok ? r.json() : null)
        .then(fresh => {
          if (!Array.isArray(fresh)) return;
          setDoubts(prev => {
            fresh
              .filter(nd => nd.answeredAt && !prev.some(d => d.id === nd.id && d.answeredAt))
              .forEach(d => showToast(
                `${d.facultyName} answered your ${d.subject} doubt — tap to view`,
                () => setActivePage('doubt')
              ));
            return fresh;
          });
        })
        .catch(() => {});

      fetch('http://localhost:5000/api/student/notifications', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(r => r.ok ? r.json() : null)
        .then(fresh => {
          if (!Array.isArray(fresh)) return;
          setNotifications(prev => {
            const newOnes = fresh.filter(fn => !fn.readAt && !prev.some(n => n.id === fn.id));
            newOnes.forEach(n => showToast(`${n.type}: ${n.content}`));
            return fresh;
          });
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
        fetch(`http://localhost:5000/api/student/notifications/${n.id}/read`, {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}` },
        }).catch(() => {});
      });
      return prev.map(n => n.readAt ? n : { ...n, readAt: new Date().toISOString() });
    });
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
