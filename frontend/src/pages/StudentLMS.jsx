import React, { useState, useRef, useEffect } from 'react';
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
  }, []);

  const showToast = (msg) => {
    setToast({ show: true, msg });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(t => ({ ...t, show: false })), 3000);
  };

  return (
    <div className="student-app">
      <StudentSidebar
        activePage={activePage}
        onNav={setActivePage}
        profile={profile}
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
        />
      </div>
      <StudentModals
        openModal={openModal}
        onClose={() => setOpenModal(null)}
        onShowToast={showToast}
        toast={toast}
      />
    </div>
  );
};

export default StudentLMS;
