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
  const toastTimer = useRef(null);

  useEffect(() => {
    document.documentElement.classList.add('student-mode');
    document.body.classList.add('student-mode');
    return () => {
      document.documentElement.classList.remove('student-mode');
      document.body.classList.remove('student-mode');
    };
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
