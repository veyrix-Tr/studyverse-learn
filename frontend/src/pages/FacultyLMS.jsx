import React, { useState, useRef, useEffect } from 'react';
import '../components/faculty-lms/FacultyStyles.css';
import FacultySidebar from '../components/faculty-lms/FacultySidebar';
import FacultyTopbar from '../components/faculty-lms/FacultyTopbar';
import FacultyContent from '../components/faculty-lms/FacultyContent';
import FacultyModals from '../components/faculty-lms/FacultyModals';

const FacultyLMS = () => {
  const [activePage, setActivePage] = useState('dashboard');
  const [openModal, setOpenModal] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [toast, setToast] = useState({ show: false, msg: '' });
  const [profile, setProfile] = useState(null);
  const toastTimer = useRef(null);

  useEffect(() => {
    document.documentElement.classList.add('faculty-mode');
    document.body.classList.add('faculty-mode');
    return () => {
      document.documentElement.classList.remove('faculty-mode');
      document.body.classList.remove('faculty-mode');
    };
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    fetch('http://localhost:5000/api/faculty/me', {
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

  const openStudentDetail = (name, init, exam, subject, topic, base, curr, gain) => {
    setSelectedStudent({ name, init, exam, subject, topic, base, curr, gain });
    setDetailOpen(true);
  };

  return (
    <div className="faculty-app">
      <FacultySidebar
        activePage={activePage}
        onNav={setActivePage}
        onShowToast={showToast}
        profile={profile}
      />
      <div className="faculty-main">
        <FacultyTopbar
          activePage={activePage}
          onOpenModal={setOpenModal}
          onNav={setActivePage}
          onShowToast={showToast}
        />
        <FacultyContent
          activePage={activePage}
          onOpenModal={setOpenModal}
          onOpenStudentDetail={openStudentDetail}
          onNav={setActivePage}
          onShowToast={showToast}
          profile={profile}
        />
      </div>
      <FacultyModals
        openModal={openModal}
        onClose={() => setOpenModal(null)}
        onShowToast={showToast}
        toast={toast}
        detailOpen={detailOpen}
        selectedStudent={selectedStudent}
        onCloseDetail={() => setDetailOpen(false)}
        onOpenModal={setOpenModal}
        onNav={setActivePage}
      />
    </div>
  );
};

export default FacultyLMS;
