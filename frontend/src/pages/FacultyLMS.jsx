import { useState, useRef, useEffect } from 'react';
import { useActivePage } from '../hooks/useActivePage';
import '../components/faculty-lms/FacultyStyles.css';
import FacultySidebar from '../components/faculty-lms/FacultySidebar';
import FacultyTopbar from '../components/faculty-lms/FacultyTopbar';
import FacultyContent from '../components/faculty-lms/FacultyContent';
import FacultyModals from '../components/faculty-lms/FacultyModals';

const FacultyLMS = () => {
  const [activePage, setActivePage, userId] = useActivePage('/faculty', 'dashboard');
  const [navOpen, setNavOpen] = useState(false);
  const [openModal, setOpenModal] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedStudent] = useState(null);
  const [toast, setToast] = useState({ show: false, msg: '' });
  const [profile, setProfile] = useState(null);
  const [mentorStudents, setMentorStudents] = useState([]);
  const [mentorDailyReports, setMentorDailyReports] = useState([]);
  const [notifications, setNotifications] = useState([]);  // computed call reminders
  const [alerts, setAlerts] = useState([]);               // stored faculty alerts (DB)
  const alertsRef = useRef([]);
  const remindedRef = useRef(new Set());
  useEffect(() => { alertsRef.current = alerts; }, [alerts]);
  const [sessions, setSessions] = useState([]);
  const [doubts, setDoubts] = useState([]);
  const [students, setStudents] = useState([]);
  const [resources, setResources] = useState([]);
  const [weeklyReports, setWeeklyReports] = useState([]);
  const [parentFeedback, setParentFeedback] = useState([]);
  const toastTimer           = useRef(null);
  const doubtsRef            = useRef([]);
  const reportsRef           = useRef([]);
  const feedbackRef          = useRef([]);
  const resourcesRef         = useRef([]);
  const mentorDailyReportsRef = useRef([]);
  useEffect(() => { doubtsRef.current             = doubts;             }, [doubts]);
  useEffect(() => { reportsRef.current            = weeklyReports;      }, [weeklyReports]);
  useEffect(() => { feedbackRef.current           = parentFeedback;     }, [parentFeedback]);
  useEffect(() => { resourcesRef.current          = resources;          }, [resources]);
  useEffect(() => { mentorDailyReportsRef.current = mentorDailyReports; }, [mentorDailyReports]);

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
    fetch(`${import.meta.env.VITE_API_URL}/api/faculty/${userId}/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => {
        if (!r.ok) { localStorage.removeItem('token'); window.location.href = '/'; return null; }
        return r.json();
      })
      .then(data => { if (data && !data.error) setProfile(data); })
      .catch(() => {});

    fetch(`${import.meta.env.VITE_API_URL}/api/faculty/${userId}/sessions`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (Array.isArray(data)) setSessions(data); })
      .catch(() => {});

    fetch(`${import.meta.env.VITE_API_URL}/api/faculty/${userId}/doubts`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (Array.isArray(data)) setDoubts(data); })
      .catch(() => {});

    fetch(`${import.meta.env.VITE_API_URL}/api/faculty/${userId}/students`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (Array.isArray(data)) setStudents(data); })
      .catch(() => {});

    fetch(`${import.meta.env.VITE_API_URL}/api/faculty/${userId}/resources`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (Array.isArray(data)) setResources(data); })
      .catch(() => {});

    fetch(`${import.meta.env.VITE_API_URL}/api/faculty/${userId}/reports`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (Array.isArray(data)) setWeeklyReports(data); })
      .catch(() => {});

    fetch(`${import.meta.env.VITE_API_URL}/api/faculty/${userId}/feedback`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (Array.isArray(data)) setParentFeedback(data); })
      .catch(() => {});

    fetch(`${import.meta.env.VITE_API_URL}/api/faculty/${userId}/mentor-students`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : [])
      .then(data => { if (Array.isArray(data)) setMentorStudents(data); })
      .catch(() => {});

    fetch(`${import.meta.env.VITE_API_URL}/api/faculty/${userId}/mentor-daily-reports`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : [])
      .then(data => { if (Array.isArray(data)) setMentorDailyReports(data); })
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
      fetch(`${import.meta.env.VITE_API_URL}/api/faculty/${userId}/doubts`, { headers: { Authorization: `Bearer ${token}` } })
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
      fetch(`${import.meta.env.VITE_API_URL}/api/faculty/${userId}/reports`, { headers: { Authorization: `Bearer ${token}` } })
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
      fetch(`${import.meta.env.VITE_API_URL}/api/faculty/${userId}/feedback`, { headers: { Authorization: `Bearer ${token}` } })
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
      fetch(`${import.meta.env.VITE_API_URL}/api/faculty/${userId}/resources`, { headers: { Authorization: `Bearer ${token}` } })
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

  // Poll mentor daily reports every 30s — toast when a mentee submits a new report
  useEffect(() => {
    if (!profile) return;
    const token = localStorage.getItem('token');
    if (!token) return;
    const id = setInterval(() => {
      fetch(`${import.meta.env.VITE_API_URL}/api/faculty/${userId}/mentor-daily-reports`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.ok ? r.json() : null)
        .then(fresh => {
          if (!Array.isArray(fresh)) return;
          const prev = mentorDailyReportsRef.current;
          fresh.forEach(fr => {
            if (!prev.find(p => p.id === fr.id))
              showToast(`${fr.studentName} submitted their daily report ✓`);
          });
          setMentorDailyReports(fresh);
          // Also refresh mentorStudents summary so "reportedToday" badge stays accurate
          fetch(`${import.meta.env.VITE_API_URL}/api/faculty/${userId}/mentor-students`, { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.ok ? r.json() : null)
            .then(data => { if (Array.isArray(data)) setMentorStudents(data); })
            .catch(() => {});
        })
        .catch(() => {});
    }, 30000);
    return () => clearInterval(id);
  }, [profile]);

  // Compute faculty notifications + fire 30-min reminders for mentor calls
  useEffect(() => {
    if (!profile) return;
    const compute = () => {
      const now = Date.now();
      const notifs = [];

      // Upcoming mentor calls in next 2 hours
      mentorStudents.forEach(s => {
        if (!s.nextCall || s.nextCall.completed) return;
        const start = new Date(s.nextCall.scheduledAt).getTime();
        const end   = start + s.nextCall.durationMin * 60 * 1000;
        if (end <= now) return; // already ended
        const minsUntil = Math.round((start - now) / 60000);

        // Check if a class session is within 25 min of this call start
        const sessionConflict = sessions.some(sess => {
          const sd = Math.abs(new Date(sess.scheduledAt).getTime() - start) / 60000;
          return sd <= 25;
        });

        notifs.push({
          id: `call-${s.nextCall.id}`,
          type: 'call',
          studentName: s.name,
          scheduledAt: s.nextCall.scheduledAt,
          durationMin: s.nextCall.durationMin,
          callId: s.nextCall.id,
          zoomMeetingId: s.nextCall.zoomMeetingId,
          minsUntil: Math.max(0, minsUntil),
          isLive: now >= start - 10 * 60 * 1000 && now <= end,
          sessionConflict,
        });

        // Toast once when entering 30-min window (and no session conflict)
        if (!sessionConflict && minsUntil <= 30 && minsUntil > 0 && !remindedRef.current.has(s.nextCall.id)) {
          remindedRef.current.add(s.nextCall.id);
          showToast(`📞 Mentor call with ${s.name} in ${minsUntil} min`);
        }
      });

      setNotifications(notifs);
    };

    compute();
    const id = setInterval(compute, 60000);
    return () => clearInterval(id);
  }, [profile, mentorStudents, sessions]);

  // Poll sessions every 20s — keeps Live/Upcoming status on dashboard accurate
  useEffect(() => {
    if (!profile) return;
    const token = localStorage.getItem('token');
    if (!token) return;
    const id = setInterval(() => {
      fetch(`${import.meta.env.VITE_API_URL}/api/faculty/${userId}/sessions`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.ok ? r.json() : null)
        .then(data => { if (Array.isArray(data)) setSessions(data); })
        .catch(() => {});
    }, 20000);
    return () => clearInterval(id);
  }, [profile]);

  // Poll mentor-students every 20s — keeps today's calls, Join button, and call status live
  useEffect(() => {
    if (!profile) return;
    const token = localStorage.getItem('token');
    if (!token) return;
    const id = setInterval(() => {
      fetch(`${import.meta.env.VITE_API_URL}/api/faculty/${userId}/mentor-students`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.ok ? r.json() : null)
        .then(data => { if (Array.isArray(data)) setMentorStudents(data); })
        .catch(() => {});
    }, 20000);
    return () => clearInterval(id);
  }, [profile]);

  // Fetch alerts on load, then poll every 30s — toast on new ones
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    const h = { Authorization: `Bearer ${token}` };
    const url = `${import.meta.env.VITE_API_URL}/api/faculty/${userId}/alerts`;
    fetch(url, { headers: h }).then(r => r.ok ? r.json() : []).then(d => { if (Array.isArray(d)) setAlerts(d); }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!profile) return;
    const token = localStorage.getItem('token');
    if (!token) return;
    const id = setInterval(() => {
      fetch(`${import.meta.env.VITE_API_URL}/api/faculty/${userId}/alerts`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.ok ? r.json() : null)
        .then(fresh => {
          if (!Array.isArray(fresh)) return;
          const prev = alertsRef.current;
          fresh.forEach(a => {
            if (!prev.find(p => p.id === a.id)) showToast(a.content);
          });
          setAlerts(fresh);
        })
        .catch(() => {});
    }, 30000);
    return () => clearInterval(id);
  }, [profile]);

  const navigate = (page) => {
    setActivePage(page);
    setNavOpen(false);
  };

  return (
    <div className="faculty-app">
      <FacultySidebar
        activePage={activePage}
        onNav={navigate}
        onShowToast={showToast}
        profile={profile}
        sessions={sessions}
        doubts={doubts}
        students={students}
        weeklyReports={weeklyReports}
        mentorStudents={mentorStudents}
        mentorDailyReports={mentorDailyReports}
        unreadAlerts={alerts.filter(a => !a.readAt).length}
        isOpen={navOpen}
        onClose={() => setNavOpen(false)}
      />
      {navOpen && <div className="sidebar-backdrop" onClick={() => setNavOpen(false)} />}
      <div className="faculty-main">
        <FacultyTopbar
          activePage={activePage}
          onOpenModal={setOpenModal}
          onNav={navigate}
          onShowToast={showToast}
          sessions={sessions}
          mentorStudents={mentorStudents}
          notifications={notifications}
          alerts={alerts}
          onMenuClick={() => setNavOpen(true)}
          onMarkAlertRead={async (id) => {
            const token = localStorage.getItem('token');
            await fetch(`${import.meta.env.VITE_API_URL}/api/faculty/${userId}/alerts/${id}/read`, { method: 'PUT', headers: { Authorization: `Bearer ${token}` } }).catch(() => {});
            setAlerts(prev => prev.map(a => a.id === id ? { ...a, readAt: new Date().toISOString() } : a));
          }}
          onMarkAllAlertsRead={async () => {
            const token = localStorage.getItem('token');
            await fetch(`${import.meta.env.VITE_API_URL}/api/faculty/${userId}/alerts/read-all`, { method: 'PUT', headers: { Authorization: `Bearer ${token}` } }).catch(() => {});
            setAlerts(prev => prev.map(a => ({ ...a, readAt: a.readAt || new Date().toISOString() })));
          }}
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
          mentorStudents={mentorStudents}
          onMentorStudentUpdated={(updated) => setMentorStudents(prev => prev.map(s => s.id === updated.id ? { ...s, ...updated } : s))}
          mentorDailyReports={mentorDailyReports}
          alerts={alerts}
          onMarkAlertRead={async (id) => {
            const token = localStorage.getItem('token');
            await fetch(`${import.meta.env.VITE_API_URL}/api/faculty/${userId}/alerts/${id}/read`, { method: 'PUT', headers: { Authorization: `Bearer ${token}` } }).catch(() => {});
            setAlerts(prev => prev.map(a => a.id === id ? { ...a, readAt: new Date().toISOString() } : a));
          }}
          onMarkAllAlertsRead={async () => {
            const token = localStorage.getItem('token');
            await fetch(`${import.meta.env.VITE_API_URL}/api/faculty/${userId}/alerts/read-all`, { method: 'PUT', headers: { Authorization: `Bearer ${token}` } }).catch(() => {});
            setAlerts(prev => prev.map(a => ({ ...a, readAt: a.readAt || new Date().toISOString() })));
          }}
        />
      </div>
      <FacultyModals
        openModal={openModal}
        onClose={() => setOpenModal(null)}
        onShowToast={showToast}
        toast={toast}
        detailOpen={detailOpen}
        selectedStudent={selectedStudent}
        profile={profile}
        onCloseDetail={() => setDetailOpen(false)}
        onOpenModal={setOpenModal}
        onNav={setActivePage}
        onResourceAdded={(r) => setResources(prev => [r, ...prev])}
        onSessionCreated={() => {
          const token = localStorage.getItem('token');
          fetch(`${import.meta.env.VITE_API_URL}/api/faculty/${userId}/sessions`, { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.ok ? r.json() : null)
            .then(data => { if (Array.isArray(data)) setSessions(data); })
            .catch(() => {});
        }}
      />
    </div>
  );
};

export default FacultyLMS;
