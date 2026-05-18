import React, { useState, useRef, useEffect } from 'react';
import '../components/admin-lms/AdminStyles.css';
import AdminSidebar from '../components/admin-lms/AdminSidebar';
import AdminTopbar from '../components/admin-lms/AdminTopbar';
import AdminContent from '../components/admin-lms/AdminContent';
import AdminModals from '../components/admin-lms/AdminModals';

const AdminLMS = () => {
  const [activePage, setActivePage] = useState('dashboard');
  const [superMode, setSuperMode] = useState(true);
  const [openModal, setOpenModal] = useState(null);
  const [toast, setToast] = useState({ show: false, msg: '' });
  const toastTimer = useRef(null);

  useEffect(() => {
    document.documentElement.classList.add('admin-mode');
    document.body.classList.add('admin-mode');
    return () => {
      document.documentElement.classList.remove('admin-mode');
      document.body.classList.remove('admin-mode');
    };
  }, []);

  const showToast = (msg) => {
    setToast({ show: true, msg });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(t => ({ ...t, show: false })), 3200);
  };

  const handleSetRole = (role) => {
    setSuperMode(role === 'super');
  };

  return (
    <div className="admin-app">
      <AdminSidebar
        activePage={activePage}
        superMode={superMode}
        onNav={setActivePage}
        onSetRole={handleSetRole}
        onShowToast={showToast}
      />
      <div className="admin-main">
        <AdminTopbar
          activePage={activePage}
          superMode={superMode}
          onOpenModal={setOpenModal}
          onNav={setActivePage}
        />
        <AdminContent
          activePage={activePage}
          onOpenModal={setOpenModal}
          onNav={setActivePage}
          onShowToast={showToast}
        />
      </div>
      <AdminModals
        openModal={openModal}
        onClose={() => setOpenModal(null)}
        onShowToast={showToast}
        toast={toast}
      />
    </div>
  );
};

export default AdminLMS;
