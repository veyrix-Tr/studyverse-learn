import { useState, useRef, useEffect } from 'react';
import '../components/faculty-lms/FacultyStyles.css';
import FacultySidebar from '../components/faculty-lms/FacultySidebar';
import FacultyTopbar from '../components/faculty-lms/FacultyTopbar';
import FacultyContent from '../components/faculty-lms/FacultyContent';
import FacultyModals from '../components/faculty-lms/FacultyModals';

const FacultyLMS = () => {
  const [activePage, setActivePage] = useState('dashboard');
  const [openModal, setOpenModal] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedStudent] = useState(null);
  const [toast, setToast] = useState({ show: false, msg: '' });
  const [profile, setProfile] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [doubts, setDoubts] = useState([]);
  const [students, setStudents] = useState([]);
  const [resources, setResources] = useState([]);
  const [weeklyReports, setWeeklyReports] = useState([]);
  const [parentFeedback, setParentFeedback] = useState([]);
  const toastTimer        = useRef(null);
  const doubtsRef         = useRef([]);
  const reportsRef        = useRef([]);
  const feedbackRef       = useRef([]);
  const resourcesRef      = useRef([]);
  useEffect(() => { doubtsRef.current    = doubts;         }, [doubts]);
  useEffect(() => { reportsRef.current   = weeklyReports;  }, [weeklyReports]);
  useEffect(() => { feedbackRef.current  = parentFeedback; }, [parentFeedback]);
  useEffect(() => { resourcesRef.current = resources;      }, [resources]);

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

    fetch('http://localhost:5000/api/faculty/sessions', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (Array.isArray(data)) setSessions(data); })
      .catch(() => {});

    fetch('http://localhost:5000/api/faculty/doubts', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (Array.isArray(data)) setDoubts(data); })
      .catch(() => {});

    fetch('http://localhost:5000/api/faculty/students', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (Array.isArray(data)) setStudents(data); })
      .catch(() => {});

    fetch('http://localhost:5000/api/faculty/resources', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (Array.isArray(data)) setResources(data); })
      .catch(() => {});

    fetch('http://localhost:5000/api/faculty/reports', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (Array.isArray(data)) setWeeklyReports(data); })
      .catch(() => {});

    fetch('http://localhost:5000/api/faculty/feedback', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (Array.isArray(data)) setParentFeedback(data); })
      .catch(() => {});
  }, []);

  const showToast = (msg) => {
    setToast({ show: true, msg });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(t => ({ ...t, show: false })), 3200);
  };

  // Poll doubts every 15s — toast when a new doubt is submitted by a student
  useEffect(() => {
    if (!profile) return;
    const token = localStorage.getItem('token');
    if (!token) return;
    const id = setInterval(() => {
      fetch('http://localhost:5000/api/faculty/doubts', { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.ok ? r.json() : null)
        .then(fresh => {
          if (!Array.isArray(fresh)) return;
          const prev = doubtsRef.current;
          fresh.forEach(fd => {
            const old = prev.find(d => d.id === fd.id);
            if (!old)
              showToast(`New doubt from ${fd.studentName} — ${fd.subject}: "${fd.question.length > 50 ? fd.question.slice(0, 50) + '…' : fd.question}"`);
            else if (old.helpful === null && fd.helpful !== null)
              showToast(`${fd.studentName} marked your ${fd.subject} answer ${fd.helpful ? 'helpful ✓' : 'not helpful'}`);
          });
          setDoubts(fresh);
        })
        .catch(() => {});
    }, 15000);
    return () => clearInterval(id);
  }, [profile]);

  // Poll reports every 15s — toast when a submitted report gets approved/rejected/sent
  useEffect(() => {
    if (!profile) return;
    const token = localStorage.getItem('token');
    if (!token) return;
    const id = setInterval(() => {
      fetch('http://localhost:5000/api/faculty/reports', { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.ok ? r.json() : null)
        .then(fresh => {
          if (!Array.isArray(fresh)) return;
          const prev = reportsRef.current;
          fresh.forEach(fr => {
            const old = prev.find(r => r.id === fr.id);
            if (!old || old.status === fr.status) return;
            if (fr.status === 'approved') showToast(`Report for ${fr.studentName} (Week ${String(fr.weekNumber).slice(-2)}) approved ✓`);
            if (fr.status === 'rejected') showToast(`Report for ${fr.studentName} (Week ${String(fr.weekNumber).slice(-2)}) needs revision`);
            if (fr.status === 'sent')     showToast(`Report for ${fr.studentName} (Week ${String(fr.weekNumber).slice(-2)}) sent to parents ✓`);
          });
          setWeeklyReports(fresh);
        })
        .catch(() => {});
    }, 15000);
    return () => clearInterval(id);
  }, [profile]);

  // Poll feedback every 20s — toast + auto-update when new weekly feedback arrives
  useEffect(() => {
    if (!profile) return;
    const token = localStorage.getItem('token');
    if (!token) return;
    const id = setInterval(() => {
      fetch('http://localhost:5000/api/faculty/feedback', { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.ok ? r.json() : null)
        .then(fresh => {
          if (!Array.isArray(fresh)) return;
          const prev = feedbackRef.current;
          fresh.forEach(ff => {
            if (!prev.find(p => p.id === ff.id))
              showToast(`New feedback from ${ff.studentName} — ${ff.subject} Week ${String(ff.weekNumber).slice(-2)} ${'★'.repeat(ff.rating)}`);
          });
          setParentFeedback(fresh);
        })
        .catch(() => {});
    }, 20000);
    return () => clearInterval(id);
  }, [profile]);

  // Poll resources every 20s — toast when admin approves or declines a submitted resource
  useEffect(() => {
    if (!profile) return;
    const token = localStorage.getItem('token');
    if (!token) return;
    const id = setInterval(() => {
      fetch('http://localhost:5000/api/faculty/resources', { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.ok ? r.json() : null)
        .then(fresh => {
          if (!Array.isArray(fresh)) return;
          const prev = resourcesRef.current;
          fresh.forEach(fr => {
            const old = prev.find(r => r.id === fr.id);
            if (!old || old.status === fr.status) return;
            if (fr.status === 'approved') showToast(`Your ${fr.subject} resource "${fr.title}" was approved ✓`);
            if (fr.status === 'declined') showToast(`Your ${fr.subject} resource "${fr.title}" was declined`);
          });
          setResources(fresh);
        })
        .catch(() => {});
    }, 20000);
    return () => clearInterval(id);
  }, [profile]);

  return (
    <div className="faculty-app">
      <FacultySidebar
        activePage={activePage}
        onNav={setActivePage}
        onShowToast={showToast}
        profile={profile}
        sessions={sessions}
        doubts={doubts}
        students={students}
      />
      <div className="faculty-main">
        <FacultyTopbar
          activePage={activePage}
          onOpenModal={setOpenModal}
          onNav={setActivePage}
          onShowToast={showToast}
          pendingDoubts={doubts.filter(d => !d.answeredAt).length}
        />
        <FacultyContent
          activePage={activePage}
          onOpenModal={setOpenModal}
          onNav={setActivePage}
          onShowToast={showToast}
          profile={profile}
          sessions={sessions}
          doubts={doubts}
          students={students}
          onDoubtAnswered={(id, answeredAt, answer, helpful) =>
            setDoubts(prev => prev.map(d => d.id === id ? { ...d, answeredAt, answer, helpful } : d))
          }
          onSessionNoteUpdated={(id, note) =>
            setSessions(prev => prev.map(s => s.id === id ? { ...s, note } : s))
          }
          resources={resources}
          onResourceAdded={(r) => setResources(prev => [r, ...prev])}
          onResourceDeleted={(id) => setResources(prev => prev.filter(r => r.id !== id))}
          weeklyReports={weeklyReports}
          onReportCreated={(r) => setWeeklyReports(prev => [r, ...prev])}
          onReportUpdated={(r) => setWeeklyReports(prev => prev.map(x => x.id === r.id ? { ...x, ...r } : x))}
          onReportSubmitted={(r) => setWeeklyReports(prev => prev.map(x => x.id === r.id ? { ...x, ...r } : x))}
          onReportDeleted={(id) => setWeeklyReports(prev => prev.filter(x => x.id !== id))}
          parentFeedback={parentFeedback}
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
        onResourceAdded={(r) => setResources(prev => [r, ...prev])}
      />
    </div>
  );
};

export default FacultyLMS;
