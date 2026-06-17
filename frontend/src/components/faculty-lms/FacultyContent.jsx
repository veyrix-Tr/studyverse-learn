import { useState, useEffect, Fragment } from 'react';
import { useParams } from 'react-router-dom';

const fmtTime = (iso) => new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
const fmtDate = (iso) => new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
const isUpcoming = (iso) => new Date(iso) > new Date();
const isLive = (iso, duration) => { const s = new Date(iso), e = new Date(s.getTime() + (duration || 60) * 60000), n = new Date(); return n >= s && n <= e; };
const canStart = (iso) => { const s = new Date(iso), n = new Date(); return s - n <= 15 * 60000 && n < s; };
const isToday = (iso) => {
  const d = new Date(iso), n = new Date();
  return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate();
};
const isPast7Days = (iso) => {
  const d = new Date(iso), n = new Date();
  const sevenDaysAgo = new Date(n);
  sevenDaysAgo.setDate(n.getDate() - 7);
  return d >= sevenDaysAgo && d <= n;
};
const timeAgo = (iso) => {
  const mins = Math.round((Date.now() - new Date(iso)) / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
};

const SubjRow = ({ name, pct, bar, color }) => (
  <div className="sc-subj-row">
    <div className="sc-subj-name">{name}</div>
    <div className="sc-subj-bar">
      <div className="pbar"><div className={`pbar-inner ${bar}`} style={{ width: `${pct}%` }}></div></div>
    </div>
    <div className="sc-subj-pct" style={{ color }}>{pct}%</div>
  </div>
);

const StudentCard = ({ av, name, exam, week, statusBadge, base, curr, gain, gainFull, subjects, next, flagClass, flag, onDetail }) => (
  <div className="student-card" onClick={onDetail}>
    <div className="sc-header">
      <div className="sc-av">{av}</div>
      <div><div className="sc-name">{name}</div><div className="sc-exam">{exam} • {week}</div></div>
      {statusBadge && <div style={{ marginLeft: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>{statusBadge}</div>}
    </div>
    <div className="sc-body">
      <div className="sc-delta">
        <span className="sc-baseline">{base}</span>
        <span className="sc-arrow">→</span>
        <span className="sc-current">{curr}</span>
        <span className="sc-gain">+{gain}{gainFull ? ' marks' : ''}</span>
      </div>
      <div className="sc-subjects">{subjects}</div>
      <div className="sc-footer">
        <div className="sc-next">Next: <strong>{next}</strong></div>
        <div className="sc-flags"><span className={`pill ${flagClass}`} style={{ fontSize: '10px' }}>{flag}</span></div>
      </div>
    </div>
  </div>
);

const DoubtItem = ({ priority, av, name, time, pills, question, answer, helpful, placeholder, extraActions, isOpen, isReplied, onToggle, onReply, replyText, onReplyTextChange, replying }) => (
  <div className={`doubt-item ${priority}`}>
    <div className="di-top">
      <div className="di-student">
        <div className="di-av">{av}</div>
        <div><div className="di-name">{name}</div><div className="di-time">{time}</div></div>
      </div>
      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
        {pills}
        {isReplied && helpful === true  && <span className="pill pp" style={{ fontSize: '10px' }}>👍 Helpful</span>}
        {isReplied && helpful === false && <span className="pill pn" style={{ fontSize: '10px' }}>👎 Not helpful</span>}
      </div>
    </div>
    <div className="di-q">{question}</div>
    {isReplied && answer && !isOpen && (
      <div style={{ borderLeft: '3px solid var(--gold)', background: 'var(--gold-dim)', padding: '10px 14px', borderRadius: '0 var(--r) var(--r) 0', margin: '8px 0' }}>
        <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '4px' }}>Your answer</div>
        <div style={{ fontSize: '13px', color: 'var(--text2)', lineHeight: 1.7 }}>{answer}</div>
      </div>
    )}
    <div className="di-actions">
      <button className="btn btn-gold btn-sm" onClick={onToggle}>
        {isReplied ? 'Edit Answer →' : 'Reply →'}
      </button>
      {extraActions}
    </div>
    <div className={`reply-box${isOpen ? ' open' : ''}`}>
      <textarea className="reply-textarea" rows={Math.min(Math.max(4, Math.ceil((replyText || '').length / 60)), 8)} placeholder={placeholder} value={replyText || ''} onChange={e => onReplyTextChange(e.target.value)}></textarea>
      <div className="reply-actions">
        <button className="btn btn-ghost btn-sm" onClick={onToggle}>Cancel</button>
        <button className="btn btn-gold btn-sm" onClick={onReply} disabled={replying} style={replying ? { opacity: 0.7, cursor: 'not-allowed' } : undefined}>{replying ? 'Sending…' : isReplied ? 'Update Answer ✓' : 'Send Reply ✓'}</button>
      </div>
    </div>
  </div>
);

const getGreeting = () => { const h = new Date().getHours(); if (h < 12) return 'Good morning'; if (h < 17) return 'Good afternoon'; return 'Good evening'; };

function getCurrentWeekInfo() {
  const now = new Date();
  const day = now.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);
  const jan4 = new Date(monday.getFullYear(), 0, 4);
  const jan4Day = jan4.getDay() || 7;
  const jan4Monday = new Date(jan4);
  jan4Monday.setDate(jan4.getDate() - jan4Day + 1);
  const isoWeek = Math.round((monday - jan4Monday) / (7 * 86400000)) + 1;
  const daysUntilSunday = (7 - now.getDay()) % 7 || 7;
  const nextSunday = new Date(now);
  nextSunday.setDate(now.getDate() + daysUntilSunday);
  return {
    weekNumber: monday.getFullYear() * 100 + isoWeek,
    isoWeek,
    weekStartDate: `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`,
    nextSunday: nextSunday.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
  };
}

const fmtWeekRange = (weekStartDate) => {
  const mon = new Date(weekStartDate + 'T00:00:00');
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  const fmt = (d) => d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  return `${fmt(mon)} – ${fmt(sun)}`;
};

const REPORT_STATUS_LABEL = { draft: 'In Progress', submitted: 'Under Review', approved: 'Approved ✓', rejected: 'Revision Needed', sent: 'Sent ✓' };
const REPORT_STATUS_CLASS = { draft: 'po', submitted: 'pb', approved: 'pp', rejected: 'pr', sent: 'pp' };

const pctOf = (score, total) => total > 0 ? Math.round((score / total) * 100) : 0;
const pctColor = (p) => p >= 75 ? 'var(--green)' : p >= 60 ? 'var(--gold)' : p >= 45 ? 'var(--orange)' : 'var(--red)';
const pctBar   = (p) => p >= 75 ? 'pb-green' : p >= 60 ? 'pb-gold' : p >= 45 ? 'pb-orange' : 'pb-red';
const pctFlag  = (p) => p >= 75 ? ['On track', 'pp'] : p >= 60 ? ['Progressing', 'po'] : ['Needs support', 'pr'];

const FacultyContent = ({ activePage, onOpenModal, onNav, onShowToast, profile, sessions = [], doubts = [], students = [], resources = [], onDoubtAnswered, onSessionNoteUpdated, onResourceDeleted, weeklyReports = [], onReportCreated, onReportUpdated, onReportSubmitted, onReportDeleted, parentFeedback = [] }) => {
  const { id: userId } = useParams();
  const firstName = profile?.name?.split(' ').find(p => !p.startsWith('Dr')) || profile?.name?.split(' ')[0] || 'there';
  const [scheduleTab, setScheduleTab] = useState(0);
  const [doubtsTab, setDoubtsTab] = useState(0);
  const [openReplies, setOpenReplies] = useState(new Set());
  const [replyTexts, setReplyTexts] = useState({});
  const [openNotes, setOpenNotes] = useState(new Set());
  const [noteTexts, setNoteTexts] = useState({});
  const [savingNote, setSavingNote] = useState(null);
  const [sendingReminder, setSendingReminder] = useState(null);
  const [deletingResourceId, setDeletingResourceId] = useState(null);
  const [activeReport, setActiveReport] = useState(null);
  const [reportFields, setReportFields] = useState({});
  const [now, setNow] = useState(() => new Date());
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 30000); return () => clearInterval(t); }, []);
  const [savingReport, setSavingReport] = useState(false);
  const [submittingReport, setSubmittingReport] = useState(false);
  const [creatingReportFor, setCreatingReportFor] = useState(null);
  const [replyingDoubtId, setReplyingDoubtId] = useState(null);

  const weekInfo = getCurrentWeekInfo();
  const isSunday = new Date().getDay() === 0;
  const currentWeekReports = weeklyReports.filter(r => r.weekNumber === weekInfo.weekNumber);
  const submittedCount = currentWeekReports.filter(r => ['submitted', 'approved', 'sent'].includes(r.status)).length;

  // For each student: show current-week report if exists, else most recent rejected (needs revision)
  const getRelevantReport = (studentId) => {
    const all = weeklyReports.filter(r => r.studentId === studentId);
    if (!all.length) return null;
    const current = all.find(r => r.weekNumber === weekInfo.weekNumber);
    if (current) return current;
    const rejected = all.filter(r => r.status === 'rejected').sort((a, b) => b.weekNumber - a.weekNumber);
    return rejected[0] || null;
  };

  const openReportEditor = (report) => {
    setActiveReport(report);
    setReportFields({
      overallRating: report.overallRating ?? '',
      strengths: report.strengths ?? '',
      improvements: report.improvements ?? '',
      mentorNote: report.mentorNote ?? '',
      nextWeekPlan: report.nextWeekPlan ?? '',
    });
  };

  const createReport = async (studentId) => {
    setCreatingReportFor(studentId);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/faculty/${userId}/reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ studentId }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 409 && data.reportId) {
          const existing = weeklyReports.find(r => r.id === data.reportId);
          if (existing) { openReportEditor(existing); return; }
        }
        throw new Error(data.error || 'Failed');
      }
      onReportCreated?.(data.report);
      openReportEditor(data.report);
    } catch (err) {
      onShowToast(`Failed: ${err.message}`);
    } finally {
      setCreatingReportFor(null);
    }
  };

  const saveReportDraft = async () => {
    if (!activeReport) return;
    setSavingReport(true);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/faculty/${userId}/reports/${activeReport.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(reportFields),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      const merged = { ...data.report, studentName: activeReport.studentName };
      onReportUpdated?.(merged);
      setActiveReport(merged);
      onShowToast('Draft saved ✓');
    } catch (err) {
      onShowToast(`Save failed: ${err.message}`);
    } finally {
      setSavingReport(false);
    }
  };

  const submitReport = async () => {
    if (!activeReport) return;
    setSubmittingReport(true);
    const token = localStorage.getItem('token');
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/api/faculty/${userId}/reports/${activeReport.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(reportFields),
      });
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/faculty/${userId}/reports/${activeReport.id}/submit`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      onReportSubmitted?.(data.report);
      setActiveReport(null);
      onShowToast('Report submitted for admin review ✓');
    } catch (err) {
      onShowToast(`Submit failed: ${err.message}`);
    } finally {
      setSubmittingReport(false);
    }
  };

  const deleteReportDraft = async (id) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/faculty/${userId}/reports/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Failed'); }
      onReportDeleted?.(id);
      if (activeReport?.id === id) setActiveReport(null);
      onShowToast('Draft deleted.');
    } catch (err) {
      onShowToast(`Delete failed: ${err.message}`);
    }
  };

  const deleteResource = async (id) => {
    setDeletingResourceId(id);
    try {
      const token = localStorage.getItem('token');
      const r = await fetch(`${import.meta.env.VITE_API_URL}/api/faculty/${userId}/resources/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!r.ok) { const d = await r.json(); throw new Error(d.error || 'Failed'); }
      onResourceDeleted?.(id);
      onShowToast('Resource deleted.');
    } catch (err) {
      onShowToast(`Delete failed: ${err.message}`);
    } finally {
      setDeletingResourceId(null);
    }
  };

  const pending = doubts.filter(d => !d.answeredAt);
  const answered = doubts.filter(d => d.answeredAt);

  const todaySessions = sessions.filter(s => isToday(s.scheduledAt));
  const upcomingSessions = sessions.filter(s => isUpcoming(s.scheduledAt));
  const pastSessions = sessions.filter(s => !isUpcoming(s.scheduledAt));

  const studentsWithScores = students.filter(st => st.latestScore && st.allScores?.length > 0);
  const avgGain = studentsWithScores.length > 0
    ? Math.round(studentsWithScores.reduce((sum, st) => {
        const first = st.allScores[st.allScores.length - 1];
        return sum + (st.latestScore.score - first.score);
      }, 0) / studentsWithScores.length)
    : null;

  const toggleReply = (id, existingAnswer) => {
    setOpenReplies(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        setReplyTexts(t => ({ ...t, [id]: existingAnswer || '' })); // reset to saved on close
      } else {
        next.add(id);
        setReplyTexts(t => ({ ...t, [id]: existingAnswer || '' })); // seed with existing answer on open
      }
      return next;
    });
  };

  const toggleNote = (id, existingNote) => {
    setOpenNotes(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        setNoteTexts(t => ({ ...t, [id]: existingNote || '' })); // discard unsaved changes on close
      } else {
        next.add(id);
        setNoteTexts(t => ({ ...t, [id]: existingNote || '' })); // seed from saved value on open
      }
      return next;
    });
  };

  const sendReminder = async (id) => {
    const token = localStorage.getItem('token');
    setSendingReminder(id);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/faculty/${userId}/sessions/${id}/remind`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      onShowToast(`Reminder sent to ${data.notified} student${data.notified !== 1 ? 's' : ''} ✓`);
    } catch {
      onShowToast('Failed to send reminder. Try again.');
    } finally {
      setSendingReminder(null);
    }
  };

  const saveNote = async (id) => {
    const text = noteTexts[id] ?? '';
    const token = localStorage.getItem('token');
    setSavingNote(id);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/faculty/${userId}/sessions/${id}/note`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ note: text }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      onSessionNoteUpdated?.(id, data.note);
      setOpenNotes(prev => { const next = new Set(prev); next.delete(id); return next; });
      onShowToast('Session note saved ✓');
    } catch {
      onShowToast('Failed to save note. Try again.');
    } finally {
      setSavingNote(null);
    }
  };

  const discussInSession = async (id) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/faculty/${userId}/doubts/${id}/discuss`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      onShowToast(data.sessionDate ? `Student notified — will discuss on ${data.sessionDate}` : 'Student notified — will discuss in next session');
    } catch {
      onShowToast('Failed to notify student. Try again.');
    }
  };

  const markReplied = async (id) => {
    const text = replyTexts[id] || '';
    if (!text.trim()) { onShowToast('Please type a reply before sending'); return; }
    const token = localStorage.getItem('token');
    setReplyingDoubtId(id);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/faculty/${userId}/doubts/${id}/answer`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ answer: text.trim() }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setOpenReplies(prev => { const next = new Set(prev); next.delete(id); return next; });
      setReplyTexts(prev => { const next = { ...prev }; delete next[id]; return next; });
      onDoubtAnswered?.(id, data.answeredAt, text.trim(), null);
      onShowToast('Reply sent ✓ Doubt marked as answered');
    } catch {
      onShowToast('Failed to send reply. Try again.');
    } finally {
      setReplyingDoubtId(null);
    }
  };


  return (
    <div className="content">

      {/* ══════════ DASHBOARD ══════════ */}
      <div className={`page${activePage === 'dashboard' ? ' on' : ''}`}>
        <div className="db-welcome">
          <div>
            <div className="db-date">{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div>
            <div className="db-greeting">{getGreeting()}, {firstName}.</div>
            <div className="db-sub">You have <strong>{todaySessions.length} session{todaySessions.length !== 1 ? 's' : ''}</strong> today &nbsp;·&nbsp; <span className="db-red">{pending.length} doubt{pending.length !== 1 ? 's' : ''}</span> pending reply</div>
          </div>
          <div className="db-actions">
            <button className="btn btn-ghost-inv btn-sm" onClick={() => onNav('reports')}>Weekly Report Due Sunday →</button>
            <button className="btn btn-ghost-inv btn-sm" onClick={() => onOpenModal('broadcast-modal')}>📢 Message Students</button>
            <button className="btn btn-gold btn-sm" onClick={() => onOpenModal('schedule-modal')}>+ Schedule Session</button>
          </div>
        </div>

        <div className="g4 mb">
          <div className="stat sa-navy">
            <div className="stat-l">Active Students</div>
            <div className="stat-v">{students.length}</div>
            <div className="stat-n neu">{sessions.filter(s => isPast7Days(s.scheduledAt)).length} sessions in last 7 days</div>
          </div>
          <div className="stat sa-red">
            <div className="stat-l">Doubts Pending</div>
            <div className="stat-v">{pending.length}</div>
            <div className="stat-n bad">{pending.length > 0 ? `Oldest: ${timeAgo(pending[pending.length-1].createdAt)}` : 'All clear!'}</div>
          </div>
          <div className="stat sa-gold">
            <div className="stat-l">Upcoming Sessions</div>
            <div className="stat-v">{upcomingSessions.length}</div>
            <div className="stat-n up">{todaySessions.length} today</div>
          </div>
          <div className="stat sa-green">
            <div className="stat-l">Avg Improvement</div>
            <div className="stat-v">{avgGain !== null ? `+${avgGain}` : '—'}</div>
            <div className="stat-n up">marks across cohort</div>
          </div>
        </div>

        <div className="g2 mb">
          <div className="card">
            <div className="sh">
              <div className="sh-t">Today's Sessions</div>
              <span className="sh-a" onClick={() => onNav('schedule')}>Full schedule →</span>
            </div>
            {todaySessions.length === 0 ? (
              <div style={{ padding: '12px 0', fontSize: '13px', color: 'var(--text3)' }}>No sessions scheduled for today.</div>
            ) : todaySessions.map(s => {
              const live = isLive(s.scheduledAt, s.duration);
              const upcoming = isUpcoming(s.scheduledAt);
              return (
                <div key={s.id} className="sched-item" onClick={() => onNav('schedule')} style={{ cursor: 'pointer' }}>
                  <div className="sched-time">{fmtTime(s.scheduledAt)}</div>
                  <div className="sched-dot" style={{ background: live ? '#ef4444' : upcoming ? 'var(--gold)' : 'var(--green)', boxShadow: live ? '0 0 0 3px rgba(239,68,68,0.2)' : upcoming ? 'none' : '0 0 0 3px rgba(34,197,94,0.2)' }}></div>
                  <div className="sched-info">
                    <div className="sched-name">{s.title}</div>
                    <div className="sched-meta">{s.subject} • {s.duration} min • {s.enrolledCount} student{s.enrolledCount !== 1 ? 's' : ''}</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '5px' }}>
                    <div className={`sched-status ${live ? 's-live' : upcoming ? 's-up' : ''}`} style={live ? { display: 'flex', alignItems: 'center', gap: 5 } : {}}>{live ? <><span style={{ width: 7, height: 7, borderRadius: '50%', background: '#ef4444', display: 'inline-block', animation: 'pulse 1.5s infinite', flexShrink: 0 }} />Live</> : upcoming ? 'Upcoming' : 'Completed'}</div>
                    {(live || canStart(s.scheduledAt)) && (
                      s.startUrl
                        ? <a href={s.startUrl} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} className="btn btn-sm" style={{ background: live ? 'var(--gold)' : '#16a34a', color: live ? '#0F1F3D' : '#fff', textDecoration: 'none', fontSize: '11px', padding: '3px 10px', fontWeight: 600 }}>{live ? 'Start Now' : 'Start'}</a>
                        : <button className="btn btn-sm" onClick={e => { e.stopPropagation(); onShowToast('Set up Zoom in the schedule modal to get a start link'); }} style={{ background: live ? 'var(--gold)' : '#16a34a', color: live ? '#0F1F3D' : '#fff', fontSize: '11px', padding: '3px 10px', fontWeight: 600 }}>{live ? 'Start Now' : 'Start'}</button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="card">
            <div className="sh">
              <div className="sh-t">Doubts Needing Reply</div>
              <span className="sh-a" onClick={() => onNav('doubts')}>Reply all →</span>
            </div>
            {pending.length === 0 ? (
              <div style={{ padding: '12px 0', fontSize: '13px', color: 'var(--text3)' }}>All doubts answered. Great work!</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {pending.slice(0, 3).map(d => (
                  <div key={d.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '10px 12px', background: 'var(--cream2)', borderRadius: 'var(--r)', border: '1px solid var(--b)', cursor: 'pointer' }} onClick={() => onNav('doubts')}>
                    <div className="di-av">{d.studentName.charAt(0)}</div>
                    <div>
                      <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text)' }}>{d.studentName} <span style={{ color: 'var(--text3)', fontSize: '10px', fontWeight: 400 }}>{timeAgo(d.createdAt)}</span></div>
                      <div style={{ fontSize: '12.5px', color: 'var(--text2)' }}>{d.question.length > 80 ? d.question.slice(0, 80) + '…' : d.question}</div>
                    </div>
                  </div>
                ))}
                {pending.length > 3 && <div style={{ fontSize: '11.5px', color: 'var(--text3)', textAlign: 'center', paddingTop: '4px' }}>+{pending.length - 3} more doubts pending</div>}
              </div>
            )}
          </div>
        </div>

        <div className="sh">
          <div className="sh-t">Student Snapshot</div>
          <span className="sh-a" onClick={() => onNav('students')}>All students →</span>
        </div>
        <div className="g3 mb">
          {students.slice(0, 3).map(st => {
            const ls = st.latestScore;
            const fs = st.allScores?.[st.allScores.length - 1];
            const pct = ls ? pctOf(ls.score, ls.totalMarks) : null;
            const [flag, flagClass] = pct !== null ? pctFlag(pct) : ['No scores', 'pn'];
            const subj = profile?.facultyProfile?.subject || 'Subject';
            const subjEl = ls ? <SubjRow name={subj} pct={pct} bar={pctBar(pct)} color={pctColor(pct)} /> : <div style={{ fontSize: '12px', color: 'var(--text3)' }}>No scores yet</div>;
            const nextText = st.nextSession ? `${fmtDate(st.nextSession.scheduledAt)}, ${fmtTime(st.nextSession.scheduledAt)}` : 'No upcoming session';
            return (
              <StudentCard key={st.id} av={st.name.charAt(0)} name={st.name}
                exam={`${st.examTarget || ''} ${st.targetYear || ''}`}
                week={ls ? `Week ${ls.weekNumber}` : 'No tests'}
                base={fs?.score ?? '—'} curr={ls?.score ?? '—'} gain={fs && ls ? ls.score - fs.score : 0}
                subjects={subjEl} next={nextText} flagClass={flagClass} flag={flag}
                onDetail={() => {}} />
            );
          })}
          {students.length === 0 && <div style={{ color: 'var(--text3)', fontSize: '13px' }}>No students assigned yet.</div>}
        </div>
      </div>

      {/* ══════════ SCHEDULE ══════════ */}
      <div className={`page${activePage === 'schedule' ? ' on' : ''}`}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
          <div className="tabs" style={{ marginBottom: 0 }}>
            {['Today', 'Upcoming', 'All'].map((t, i) => {
              const hasLive = i === 0 && sessions.some(s => isLive(s.scheduledAt, s.duration));
              return (
                <div key={t} className={`tab${scheduleTab === i ? ' on' : ''}`} onClick={() => setScheduleTab(i)}>
                  {t}{hasLive && <span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', background: '#ef4444', marginLeft: 5, verticalAlign: 'middle', animation: 'pulse 1.5s infinite' }} />}
                </div>
              );
            })}
          </div>
          <button className="btn btn-gold btn-sm" onClick={() => onOpenModal('schedule-modal')}>+ Schedule Session</button>
        </div>

        <div className="card mb">
          <table className="tbl">
            <thead>
              <tr><th>Students</th><th>Topic</th><th>Subject</th><th>Time</th><th>Duration</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {(() => {
                const shown = scheduleTab === 0 ? todaySessions : scheduleTab === 1 ? upcomingSessions : sessions;
                if (shown.length === 0) return (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: '20px', color: 'var(--text3)', fontSize: '13px' }}>No sessions found.</td></tr>
                );
                return shown.map(s => {
                  const past = !isUpcoming(s.scheduledAt);
                  const noteOpen = openNotes.has(s.id);
                  const noteVal = noteTexts[s.id] !== undefined ? noteTexts[s.id] : (s.note || '');
                  return (
                    <Fragment key={s.id}>
                      <tr>
                        <td>{s.enrolledStudents?.length > 0 ? s.enrolledStudents.join(', ') : '—'}</td>
                        <td>{s.title}</td>
                        <td><span className="pill pg">{s.subject}</span></td>
                        <td>{fmtDate(s.scheduledAt)}, {fmtTime(s.scheduledAt)}</td>
                        <td>{s.duration} min</td>
                        <td>
                          {isLive(s.scheduledAt, s.duration)
                            ? <span className="sched-status" style={{ background: 'rgba(239,68,68,0.12)', color: '#dc2626', display: 'inline-flex', alignItems: 'center', gap: 5 }}><span style={{ width: 7, height: 7, borderRadius: '50%', background: '#ef4444', display: 'inline-block', animation: 'pulse 1.5s infinite', flexShrink: 0 }} />Live</span>
                            : <span className={`sched-status ${past ? 's-done' : 's-up'}`}>{past ? 'Completed' : 'Upcoming'}</span>}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                            <button className={`btn btn-sm ${s.note ? 'btn-gold' : 'btn-ghost'}`} onClick={() => toggleNote(s.id, s.note)}>
                              {s.note ? 'Edit Note' : 'Add Note'}
                            </button>
                            {!past && <button className="btn btn-ghost btn-sm" disabled={sendingReminder === s.id} onClick={() => sendReminder(s.id)}>{sendingReminder === s.id ? 'Sending…' : 'Remind'}</button>}
                            {isLive(s.scheduledAt, s.duration) && (
                              s.startUrl
                                ? <a href={s.startUrl} target="_blank" rel="noreferrer" className="btn btn-sm" style={{ background: 'var(--gold)', color: '#0F1F3D', textDecoration: 'none', fontWeight: 600, animation: 'pulse 1.5s infinite' }}>Start Now</a>
                                : <button className="btn btn-sm" style={{ background: 'var(--gold)', color: '#0F1F3D', fontWeight: 600, animation: 'pulse 1.5s infinite' }} onClick={() => onShowToast('Set up Zoom in the schedule modal to get a start link')}>Start Now</button>
                            )}
                            {!past && canStart(s.scheduledAt) && (
                              s.startUrl
                                ? <a href={s.startUrl} target="_blank" rel="noreferrer" className="btn btn-sm" style={{ background: '#16a34a', color: '#fff', textDecoration: 'none' }}>Start</a>
                                : <button className="btn btn-sm" style={{ background: '#16a34a', color: '#fff' }} onClick={() => onShowToast('Set up Zoom in the schedule modal to get a start link')}>Start</button>
                            )}
                            {past && s.recordingUrl && (
                              <a href={s.recordingUrl} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}><svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="8"/></svg>Recording</a>
                            )}
                          </div>
                        </td>
                      </tr>
                      {noteOpen && (
                        <tr>
                          <td colSpan={7} style={{ padding: '0 0 12px 0', background: 'var(--cream)' }}>
                            <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              <div style={{ fontSize: '12px', color: 'var(--text3)', fontWeight: 500 }}>{s.title} — Session Note</div>
                              <textarea
                                className="sn-textarea"
                                rows="3"
                                placeholder="What was covered? What clicked? What needs follow-up? These notes feed into weekly parent reports."
                                value={noteVal}
                                onChange={e => setNoteTexts(t => ({ ...t, [s.id]: e.target.value }))}
                              />
                              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                <button className="btn btn-ghost btn-sm" onClick={() => toggleNote(s.id, s.note)}>Cancel</button>
                                <button className="btn btn-gold btn-sm" disabled={savingNote === s.id} onClick={() => saveNote(s.id)}>
                                  {savingNote === s.id ? 'Saving…' : 'Save Note ✓'}
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                });
              })()}
            </tbody>
          </table>
        </div>

        <div className="sh">
          <div className="sh-t">Recent Session Notes</div>
          <span style={{ fontSize: '12px', color: 'var(--text3)' }}>These feed into weekly parent reports</span>
        </div>
        <div className="card" style={{ padding: '14px 18px' }}>
          {pastSessions.length === 0 ? (
            <div style={{ padding: '12px 0', fontSize: '13px', color: 'var(--text3)' }}>No past sessions yet.</div>
          ) : (() => {
            const sorted = [...pastSessions].sort((a, b) => new Date(b.scheduledAt) - new Date(a.scheduledAt));
            const withNotes = sorted.filter(s => s.note);
            const shown = withNotes.length > 0 ? withNotes.slice(0, 3) : sorted.slice(0, 2);
            return shown.map((s, idx) => (
              <div key={s.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '12px 0', borderBottom: idx < shown.length - 1 ? '1px solid var(--b)' : 'none' }}>
                <div className="di-av">{(s.enrolledStudents?.[0] || '?').charAt(0)}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>{s.enrolledStudents?.join(', ') || 'Students'} — {s.title}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text3)' }}>{fmtDate(s.scheduledAt)}</div>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '2px' }}>{s.subject} • {s.duration} min</div>
                  {s.note
                    ? <div style={{ marginTop: '8px', fontSize: '12.5px', color: 'var(--text2)', background: 'var(--cream2)', padding: '9px 12px', borderRadius: 'var(--r)', borderLeft: '3px solid var(--gold)', lineHeight: 1.7 }}>{s.note}</div>
                    : <div style={{ marginTop: '6px', fontSize: '12px', color: 'var(--text3)', fontStyle: 'italic' }}>No note added yet — click "Add Note" in the table above.</div>
                  }
                </div>
              </div>
            ));
          })()}
        </div>
      </div>

      {/* ══════════ MY STUDENTS ══════════ */}
      <div className={`page${activePage === 'students' ? ' on' : ''}`}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ fontSize: '13px', color: 'var(--text2)' }}>
            {students.length} student{students.length !== 1 ? 's' : ''} • {profile?.facultyProfile?.subject || 'Your subject'}
          </div>
          <button className="btn btn-gold btn-sm" onClick={() => onOpenModal('schedule-modal')}>+ New Session</button>
        </div>
        {students.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text3)', fontSize: '13px' }}>No students found for your subject yet.</div>
        ) : (
          <div className="g3 mb">
            {students.map(st => {
              const ls = st.latestScore;
              const fs = st.allScores?.[st.allScores.length - 1];
              const pct = ls ? pctOf(ls.score, ls.totalMarks) : null;
              const [flag, flagClass] = pct !== null ? pctFlag(pct) : ['No scores', 'pn'];
              const subj = profile?.facultyProfile?.subject || 'Subject';
              const subjEl = ls
                ? <SubjRow name={subj} pct={pct} bar={pctBar(pct)} color={pctColor(pct)} />
                : <div style={{ fontSize: '12px', color: 'var(--text3)' }}>No {subj} scores yet</div>;
              const nextText = st.nextSession
                ? `${fmtDate(st.nextSession.scheduledAt)}, ${fmtTime(st.nextSession.scheduledAt)}`
                : 'No upcoming session';
              return (
                <StudentCard key={st.id} av={st.name.charAt(0)} name={st.name}
                  exam={`${st.examTarget || ''} ${st.targetYear || ''}`}
                  week={ls ? `Week ${ls.weekNumber}` : 'No tests'}
                  base={fs?.score ?? '—'} curr={ls?.score ?? '—'} gain={fs && ls ? ls.score - fs.score : 0}
                  subjects={subjEl} next={nextText} flagClass={flagClass} flag={flag}
                  onDetail={() => {}} />
              );
            })}
          </div>
        )}
      </div>

      {/* ══════════ DOUBT QUEUE ══════════ */}
      <div className={`page${activePage === 'doubts' ? ' on' : ''}`}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ fontSize: '13px', color: 'var(--text2)' }}>
            <span style={{ color: 'var(--red)', fontWeight: 600 }}>{pending.length} unanswered</span>
            {pending.length > 0 ? ` • Oldest: ${timeAgo(pending[pending.length - 1].createdAt)}.` : ' • All clear!'} Aim to reply within 4 hours.
            {answered.length > 0 && (() => {
              const helpful = answered.filter(d => d.helpful === true).length;
              const unhelpful = answered.filter(d => d.helpful === false).length;
              return helpful + unhelpful > 0 ? (
                <span style={{ marginLeft: '10px', color: 'var(--text2)' }}>
                  Student feedback : <span style={{ color: 'var(--green)', fontWeight: 600 }}>👍 {helpful}</span>
                  <span style={{ margin: '0 4px' }}>•</span>
                  <span style={{ color: 'var(--red)', fontWeight: 600 }}>👎 {unhelpful}</span>
                </span>
              ) : null;
            })()}
          </div>
          <div className="tabs" style={{ marginBottom: 0 }}>
            {[`Pending (${pending.length})`, `Answered (${answered.length})`, 'All'].map((t, i) => (
              <div key={i} className={`tab${doubtsTab === i ? ' on' : ''}`} onClick={() => setDoubtsTab(i)}>{t}</div>
            ))}
          </div>
        </div>

        {(() => {
          const shown = doubtsTab === 0 ? pending : doubtsTab === 1 ? answered : doubts;
          if (shown.length === 0) return (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text3)', fontSize: '13px' }}>
              {doubtsTab === 0 ? 'No pending doubts. Great work!' : doubtsTab === 1 ? 'No answered doubts yet.' : 'No doubts yet.'}
            </div>
          );
          return shown.map(d => {
            const hrs = (Date.now() - new Date(d.createdAt)) / 3600000;
            const priority = hrs > 12 ? 'urgent' : hrs > 4 ? 'medium' : 'low';
            const subj = (d.subject || '').toLowerCase();
            const pillClass = subj.includes('chem') ? 'pg' : subj.includes('math') ? 'pn' : subj.includes('phys') ? 'pb' : subj.includes('bio') ? 'pp' : 'pn';
            return (
              <DoubtItem key={d.id} priority={priority}
                av={d.studentName.charAt(0)} name={d.studentName} time={timeAgo(d.createdAt)}
                pills={<><span className={`pill ${pillClass}`}>{d.subject}</span>{hrs > 12 && !d.answeredAt ? <span className="pill pr">Overdue</span> : null}</>}
                question={d.question}
                answer={d.answer}
                helpful={d.helpful}
                placeholder={`Type your reply to ${d.studentName}...`}
                extraActions={<button className="btn btn-ghost btn-sm" onClick={() => discussInSession(d.id)}>Discuss in session</button>}
                isOpen={openReplies.has(d.id)} isReplied={!!d.answeredAt}
                replyText={replyTexts[d.id] || ''}
                onReplyTextChange={val => setReplyTexts(prev => ({ ...prev, [d.id]: val }))}
                onToggle={() => toggleReply(d.id, d.answer)} onReply={() => markReplied(d.id)}
                replying={replyingDoubtId === d.id} />
            );
          });
        })()}
      </div>

      {/* ══════════ RESOURCES ══════════ */}
      <div className={`page${activePage === 'resources' ? ' on' : ''}`}>
        <div style={{ fontSize: '13px', color: 'var(--text2)', marginBottom: '18px', background: 'var(--cream)', border: '1px solid var(--b)', borderRadius: 'var(--r)', padding: '11px 14px' }}>
          📌 Upload a resource → admin reviews → students in the matching grade see it in their library.
        </div>

        <div className="sh">
          <div className="sh-t">My Resources</div>
          <button className="btn btn-gold btn-sm" onClick={() => onOpenModal('suggest-res-modal')}>+ Upload Resource</button>
        </div>

        {resources.length === 0 ? (
          <div style={{ padding: '28px', textAlign: 'center', color: 'var(--text3)', fontSize: '13px' }}>No resources uploaded yet.</div>
        ) : (
          <>
            {['pending', 'approved', 'declined'].map(status => {
              const group = resources.filter(r => r.status === status);
              if (group.length === 0) return null;
              const label = status === 'pending' ? 'Pending Admin Approval' : status === 'approved' ? 'Approved' : 'Declined';
              return (
                <div key={status} style={{ marginBottom: '22px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.08em', fontWeight: 500, marginBottom: '10px' }}>{label}</div>
                  {group.map(r => (
                    <div key={r.id} className="res-review-item" style={status !== 'pending' ? { opacity: 0.85 } : {}}>
                      <div className="rri-top">
                        <div className="rri-icon">📄</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                            <div className="rri-name">{r.title}</div>
                            {status === 'pending' && <span className="pending-badge">Pending</span>}
                            {status === 'approved' && <span className="approved-badge">Approved ✓</span>}
                            {status === 'declined' && <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--red)', background: 'var(--red-dim)', padding: '2px 8px', borderRadius: '20px' }}>Declined</span>}
                          </div>
                          <div className="rri-meta">{r.type} • {r.subject} • Grade {r.grade} • {new Date(r.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</div>
                        </div>
                      </div>
                      {r.description && <div className="rri-request">{r.description}</div>}
                      {status === 'declined' && r.declineReason && <div style={{ fontSize: '11.5px', color: 'var(--red)', marginTop: '6px' }}>Reason: {r.declineReason}</div>}
                      <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                        {status === 'approved' && (
                          <a href={`${import.meta.env.VITE_API_URL}/api/files/proxy?url=${encodeURIComponent(r.cloudinaryUrl)}`} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm" style={{ textDecoration: 'none' }}>↗ View / Download</a>
                        )}
                        {status !== 'approved' && (
                          <button
                            className="btn btn-red btn-sm"
                            disabled={deletingResourceId === r.id}
                            onClick={() => deleteResource(r.id)}
                          >{deletingResourceId === r.id ? 'Deleting…' : 'Delete'}</button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* ══════════ ASSIGN TESTS ══════════ */}
      <div className={`page${activePage === 'tests' ? ' on' : ''}`}>
        <div style={{ fontSize: '13px', color: 'var(--text2)', marginBottom: '18px', background: 'var(--cream)', border: '1px solid var(--b)', borderRadius: 'var(--r)', padding: '11px 14px' }}>
          📌 Suggest a test for a student → goes to admin for approval. Student sees it as "Mentor-assigned" once approved.
        </div>

        <div className="sh">
          <div className="sh-t">Suggest a Test for a Student</div>
          <button className="btn btn-gold btn-sm" onClick={() => onOpenModal('assign-test-modal')}>+ Suggest Test</button>
        </div>

        <div style={{ marginBottom: '22px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.08em', fontWeight: 500, marginBottom: '10px' }}>Pending Admin Approval</div>
          <div className="card mb" style={{ padding: '16px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <div className="di-av">R</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                  <div>
                    <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text)' }}>Rahul Mehta — Electrostatics Targeted Test</div>
                    <div style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '2px' }}>25 questions • 45 min • Suggested Apr 14</div>
                  </div>
                  <span className="pending-badge">Pending Admin</span>
                </div>
                <div style={{ fontSize: '12.5px', color: 'var(--text2)', marginTop: '8px', background: 'var(--cream2)', padding: '9px 11px', borderRadius: 'var(--r)', borderLeft: '3px solid var(--gold)' }}>
                  Reason: "Rahul's Gauss's Law accuracy is at 31%. This test covers exactly his gap — 15 questions on field lines + 10 on potential. Needs to do this before our Apr 18 session."
                </div>
              </div>
            </div>
          </div>
        </div>

        <div>
          <div style={{ fontSize: '12px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.08em', fontWeight: 500, marginBottom: '10px' }}>Recently Approved &amp; Student Results</div>
          <div className="card" style={{ padding: '14px 18px' }}>
            <table className="tbl">
              <thead><tr><th>Student</th><th>Test</th><th>Assigned</th><th>Completed</th><th>Score</th><th>vs Target</th></tr></thead>
              <tbody>
                <tr key="test-sneha"><td><div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}><div className="di-av">S</div>Sneha Kapoor</div></td><td>Integration — Substitution Test</td><td>Apr 10</td><td>Apr 11</td><td><strong style={{ color: 'var(--green)' }}>68%</strong></td><td><span className="pill pp">+11%</span></td></tr>
                <tr key="test-priya"><td><div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}><div className="di-av">P</div>Priya Desai</div></td><td>Organic Chemistry — Reactions</td><td>Apr 9</td><td>Apr 10</td><td><strong style={{ color: 'var(--orange)' }}>55%</strong></td><td><span className="pill po">Needs work</span></td></tr>
                <tr key="test-arjun"><td><div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}><div className="di-av">A</div>Arjun Singh</div></td><td>Electrostatics — Full Chapter</td><td>Apr 8</td><td>Apr 9</td><td><strong style={{ color: 'var(--gold)' }}>66%</strong></td><td><span className="pill pg">+8%</span></td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ══════════ WEEKLY REPORTS ══════════ */}
      <div className={`page${activePage === 'reports' ? ' on' : ''}`}>

        {/* Banner */}
        <div style={{ background: 'var(--gold-dim)', border: '1px solid var(--gold-b)', borderRadius: 'var(--rl)', padding: '14px 18px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '18px' }}>📅</span>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>
              Week {weekInfo.isoWeek} ({fmtWeekRange(weekInfo.weekStartDate)})
              {isSunday ? ' — reports send today' : ` — auto-send this Sunday (${weekInfo.nextSunday})`}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text2)' }}>
              {submittedCount} of {students.length} submitted this week · Admin reviews before parents receive them
            </div>
          </div>
        </div>

        {/* ── Active Editor ── */}
        {activeReport && (
          <div className="report-section" style={{ marginBottom: '20px' }}>

            {/* Editor header */}
            <div className="rs-student">
              <div className="di-av" style={{ width: '40px', height: '40px', fontSize: '15px', flexShrink: 0 }}>{activeReport.studentName?.charAt(0)}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)' }}>{activeReport.studentName}</div>
                <div style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '2px' }}>
                  Week {String(activeReport.weekNumber).slice(-2)} · {fmtWeekRange(activeReport.weekStartDate)}
                  {activeReport.status === 'rejected' && (
                    <span className="pill pr" style={{ marginLeft: '8px', fontSize: '10px' }}>Revision needed</span>
                  )}
                </div>
                {activeReport.status === 'rejected' && activeReport.rejectedReason && (
                  <div style={{ marginTop: '6px', fontSize: '12px', color: 'var(--red)', background: 'var(--rdim)', padding: '6px 10px', borderRadius: '6px', borderLeft: '3px solid var(--red)' }}>
                    Admin feedback: {activeReport.rejectedReason}
                  </div>
                )}
              </div>
              {activeReport.testScore != null && (
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: '11px', color: 'var(--text3)' }}>{activeReport.testSubject || 'Latest score'}</div>
                  <div style={{ fontFamily: 'var(--fs)', fontSize: '22px', fontWeight: 700, color: 'var(--gold)', lineHeight: 1.1 }}>
                    {activeReport.testScore}<span style={{ fontSize: '13px', color: 'var(--text3)', fontWeight: 400 }}>/{activeReport.testTotalMarks}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Rating */}
            <div className="week-report-row">
              <div className="wr-label">Rating</div>
              <div className="wr-val">
                <div style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
                  {[1, 2, 3, 4, 5].map(n => (
                    <button key={n}
                      onClick={() => setReportFields(f => ({ ...f, overallRating: f.overallRating === n ? null : n }))}
                      style={{ fontSize: '22px', background: 'none', border: 'none', cursor: 'pointer', padding: '0 2px', color: (reportFields.overallRating || 0) >= n ? 'var(--gold)' : 'var(--cream3)', lineHeight: 1, transition: 'color .15s' }}>★</button>
                  ))}
                  {reportFields.overallRating
                    ? <span style={{ fontSize: '12px', color: 'var(--text3)', marginLeft: '6px' }}>{['', 'Poor', 'Below average', 'Average', 'Good', 'Excellent'][reportFields.overallRating]}</span>
                    : <span style={{ fontSize: '12px', color: 'var(--text3)', marginLeft: '6px' }}>Click to rate</span>}
                </div>
              </div>
            </div>

            {/* Strengths */}
            <div className="week-report-row">
              <div className="wr-label">Strengths</div>
              <div className="wr-val">
                <textarea className="sn-textarea" rows={3} style={{ width: '100%' }}
                  placeholder="What did the student do well this week? Be specific."
                  value={reportFields.strengths || ''}
                  onChange={e => setReportFields(f => ({ ...f, strengths: e.target.value }))} />
              </div>
            </div>

            {/* Improvements */}
            <div className="week-report-row">
              <div className="wr-label">To improve</div>
              <div className="wr-val">
                <textarea className="sn-textarea" rows={3} style={{ width: '100%' }}
                  placeholder="What needs attention? Be honest and specific — parents need to understand what to work on."
                  value={reportFields.improvements || ''}
                  onChange={e => setReportFields(f => ({ ...f, improvements: e.target.value }))} />
              </div>
            </div>

            {/* Note to parents */}
            <div className="week-report-row">
              <div className="wr-label">Note to parents</div>
              <div className="wr-val">
                <textarea className="sn-textarea" rows={4} style={{ width: '100%', minHeight: '90px' }}
                  placeholder="Write directly to the parents — what happened this week, what you observed, what they should know or watch at home."
                  value={reportFields.mentorNote || ''}
                  onChange={e => setReportFields(f => ({ ...f, mentorNote: e.target.value }))} />
                <div className="sn-hint">The full report is sent to parents every Sunday after admin approval.</div>
              </div>
            </div>

            {/* Next week plan */}
            <div className="week-report-row">
              <div className="wr-label">Next week</div>
              <div className="wr-val">
                <textarea className="sn-textarea" rows={2} style={{ width: '100%' }}
                  placeholder="Topics, sessions, and goals planned for next week."
                  value={reportFields.nextWeekPlan || ''}
                  onChange={e => setReportFields(f => ({ ...f, nextWeekPlan: e.target.value }))} />
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', paddingTop: '14px', borderTop: '1px solid var(--b)' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn btn-ghost btn-sm" onClick={() => setActiveReport(null)}>Close</button>
                {activeReport.status === 'draft' && (
                  <button className="btn btn-ghost btn-sm" style={{ color: 'var(--red)' }} onClick={() => deleteReportDraft(activeReport.id)}>Delete</button>
                )}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn btn-ghost btn-sm" disabled={savingReport} onClick={saveReportDraft}>
                  {savingReport ? 'Saving…' : 'Save Draft'}
                </button>
                <button className="btn btn-gold btn-sm" disabled={submittingReport} onClick={submitReport}>
                  {submittingReport ? 'Submitting…' : 'Submit for Review →'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Status Table ── */}
        <div className="sh" style={{ marginTop: activeReport ? '8px' : '0' }}>
          <div className="sh-t">All Students — Week {weekInfo.isoWeek}</div>
        </div>
        <div className="card" style={{ padding: '14px 18px' }}>
          {students.length === 0 ? (
            <div style={{ padding: '16px 0', fontSize: '13px', color: 'var(--text3)', textAlign: 'center' }}>No students assigned yet.</div>
          ) : (
            <table className="tbl">
              <thead>
                <tr><th>Student</th><th>Exam</th><th>Score (snapshot)</th><th>Status</th><th></th></tr>
              </thead>
              <tbody>
                {students.map(st => {
                  const report = getRelevantReport(st.id);
                  const isCurrentWeek = report?.weekNumber === weekInfo.weekNumber;
                  const isEditing = activeReport?.id === report?.id;
                  const canEdit = report && ['draft', 'rejected'].includes(report.status);
                  const isLocked = report && ['submitted', 'approved', 'sent'].includes(report.status);
                  // Show snapshotted score if report exists, else live score
                  const scoreDisplay = report?.testScore != null
                    ? <span style={{ fontWeight: 600, color: pctColor(pctOf(report.testScore, report.testTotalMarks)) }}>{report.testScore}/{report.testTotalMarks}{report.testSubject ? <span style={{ fontSize: '11px', color: 'var(--text3)', fontWeight: 400 }}> {report.testSubject}</span> : null}</span>
                    : st.latestScore
                      ? <span style={{ color: 'var(--text3)' }}>{st.latestScore.score}/{st.latestScore.totalMarks} <span style={{ fontSize: '10px' }}>(live)</span></span>
                      : <span style={{ color: 'var(--text3)' }}>No score</span>;

                  return (
                    <tr key={st.id} style={isEditing ? { background: 'var(--cream2)' } : {}}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                          <div className="di-av">{st.name.charAt(0)}</div>
                          {st.name}
                        </div>
                      </td>
                      <td style={{ color: 'var(--text3)' }}>{st.examTarget || '—'}</td>
                      <td>{scoreDisplay}</td>
                      <td>
                        {!report || !isCurrentWeek
                          ? <span className="pill pn">Not started</span>
                          : <span className={`pill ${REPORT_STATUS_CLASS[report.status]}`}>{REPORT_STATUS_LABEL[report.status]}</span>}
                        {report && !isCurrentWeek && report.status === 'rejected' && (
                          <span className="pill pr" style={{ marginLeft: '4px', fontSize: '10px' }}>Week {String(report.weekNumber).slice(-2)} rejected</span>
                        )}
                      </td>
                      <td>
                        {(!report || !isCurrentWeek) && (
                          <button className="btn btn-gold btn-sm" disabled={creatingReportFor === st.id} onClick={() => createReport(st.id)}>
                            {creatingReportFor === st.id ? 'Creating…' : 'Draft Now'}
                          </button>
                        )}
                        {report && isCurrentWeek && canEdit && !isEditing && (
                          <button className="btn btn-ghost btn-sm" onClick={() => openReportEditor(report)}>
                            {report.status === 'rejected' ? 'Revise' : 'Continue →'}
                          </button>
                        )}
                        {report && isCurrentWeek && canEdit && isEditing && (
                          <button className="btn btn-ghost btn-sm" onClick={() => setActiveReport(null)}>Close</button>
                        )}
                        {report && isCurrentWeek && isLocked && (
                          <span style={{ fontSize: '12px', color: 'var(--text3)' }}>
                            {report.status === 'sent' ? 'Sent ✓' : report.status === 'approved' ? 'Approved ✓' : 'Under review'}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ══════════ WEEKLY FEEDBACK ══════════ */}
      <div className={`page${activePage === 'feedback' ? ' on' : ''}`}>
        <div style={{ fontSize: '13px', color: 'var(--text2)', marginBottom: '18px' }}>
          Feedback submitted after each weekly report. Read them to understand how each student is experiencing their progress.
        </div>
        {parentFeedback.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
            <div style={{ fontSize: '32px', marginBottom: '12px', opacity: 0.25 }}>💬</div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text2)', marginBottom: '4px' }}>No feedback yet</div>
            <div style={{ fontSize: '12px', color: 'var(--text3)' }}>Feedback will appear here after weekly reports are delivered.</div>
          </div>
        ) : parentFeedback.map(f => (
          <div key={f.id} className="feedback-item">
            <div className="fi-top">
              <div>
                <div className="fi-student">{f.studentName}</div>
                <div className="fi-parent">Week {String(f.weekNumber).slice(-2)}{f.subject ? ` · ${f.subject}` : ''} · {new Date(f.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="fi-stars">{'★'.repeat(f.rating)}{'☆'.repeat(5 - f.rating)}</div>
                <div style={{ fontSize: '10px', color: 'var(--text3)', marginTop: '2px' }}>{f.rating} / 5</div>
              </div>
            </div>
            {f.comment && <div className="fi-quote">"{f.comment}"</div>}
            <div className="fi-date">Week {String(f.weekNumber).slice(-2)} · Received {new Date(f.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
          </div>
        ))}
      </div>

    </div>
  );
};

export default FacultyContent;
