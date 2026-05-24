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
  const toastTimer = useRef(null);

  useEffect(() => {
    document.documentElement.classList.add('free-mode');
    document.body.classList.add('free-mode');
    return () => {
      document.documentElement.classList.remove('free-mode');
      document.body.classList.remove('free-mode');
    };
  }, []);

  const showToast = (msg) => {
    setToast({ show: true, msg });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(t => ({ ...t, show: false })), 3200);
  };

  return (
    <div className="free-app">
      <FreeSidebar activePage={activePage} onNav={setActivePage} />
      <div className="free-main">
        <FreeTopbar activePage={activePage} onNav={setActivePage} />
        <FreeContent
          activePage={activePage}
          onNav={setActivePage}
          onOpenModal={setOpenModal}
          onShowToast={showToast}
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
