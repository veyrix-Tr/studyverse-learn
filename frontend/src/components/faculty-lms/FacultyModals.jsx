import React, { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Check, X } from 'lucide-react';

const CLOUD_NAME    = 'dnotkgppz';
const UPLOAD_PRESET = 'faculty_resources';

const EXAM_SUBJECTS = {
  'JEE Mains':    ['Physics', 'Chemistry', 'Maths'],
  'JEE Advanced': ['Physics', 'Chemistry', 'Maths'],
  'NEET':         ['Physics', 'Chemistry', 'Biology'],
};

const FacultyModals = ({ openModal, onClose, onShowToast, toast, detailOpen, selectedStudent, onCloseDetail, onOpenModal, onNav, onResourceAdded, onSessionCreated, profile }) => {
  const { id: userId } = useParams();
  const isOpen = (id) => openModal === id ? ' open' : '';
  const s = selectedStudent || {};
  const [broadcastText, setBroadcastText] = useState('');
  const [broadcasting, setBroadcasting] = useState(false);

  // Every faculty has one subject on their profile (e.g. "Physics"). Sessions
  // and resources stay tied to it rather than letting the teacher free-pick.
  const facultySubject = (profile?.facultyProfile?.subject || '').trim();

  // Schedule Session state
  const [sessForm, setSessForm] = useState({ studentIds: [], title: '', subject: facultySubject || 'Physics', date: '', time: '', duration: 45 });
  const [sessLoading, setSessLoading] = useState(false);
  const [sessError, setSessError] = useState('');
  const [apexStudents, setApexStudents] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [studentsOpen, setStudentsOpen] = useState(false);

  // Lock the session subject to the faculty's own subject once the modal opens.
  useEffect(() => {
    if (openModal !== 'schedule-modal') return;
    if (facultySubject) setSessForm(f => ({ ...f, subject: facultySubject, studentIds: [] }));
  }, [openModal, facultySubject]);

  // Default resource subject to the faculty's own subject on each open.
  useEffect(() => {
    if (openModal !== 'suggest-res-modal') return;
    if (facultySubject) setResSubject(facultySubject);
  }, [openModal, facultySubject]);

  useEffect(() => {
    if (openModal !== 'schedule-modal') return;
    const token = localStorage.getItem('token');
    setStudentsLoading(true);
    fetch(`${import.meta.env.VITE_API_URL}/api/faculty/${userId}/apex-students`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : [])
      .then(data => { if (Array.isArray(data)) setApexStudents(data); })
      .catch(() => {})
      .finally(() => setStudentsLoading(false));
  }, [openModal, userId]);

  const menteeStudents = apexStudents.filter(st => String(st.plan) !== 'apex');
  const shownSubject = facultySubject || sessForm.subject;
  const apexEligible = apexStudents.filter(st => String(st.plan) === 'apex' && (EXAM_SUBJECTS[st.examTarget] || []).includes(shownSubject));
  const roster = [...menteeStudents, ...apexEligible];
  const selectedStudentsInfo = roster.filter(st => sessForm.studentIds.includes(String(st.id)));

  const toggleStudent = (id) => setSessForm(f => ({
    ...f,
    studentIds: f.studentIds.includes(String(id))
      ? f.studentIds.filter(x => x !== String(id))
      : [...f.studentIds, String(id)],
  }));

  const resetSessForm = () => {
    setSessForm({ studentIds: [], title: '', subject: facultySubject || 'Physics', date: '', time: '', duration: 45 });
    setStudentsOpen(false);
    setSessError('');
  };

  const menteeOnly = selectedStudentsInfo.length > 0 && selectedStudentsInfo.every(x => String(x.plan) !== 'apex');

  const scheduleSession = async () => {
    if (!sessForm.studentIds.length || (!menteeOnly && !sessForm.title.trim()) || !sessForm.date || !sessForm.time) {
      setSessError('Select at least one student and fill in all fields.');
      return;
    }
    const scheduledAt = new Date(`${sessForm.date}T${sessForm.time}`);
    if (isNaN(scheduledAt.getTime())) { setSessError('Invalid date/time.'); return; }
    const finalTitle = sessForm.title.trim() || (menteeOnly ? 'Mentorship session' : '');

    setSessLoading(true);
    setSessError('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/faculty/${userId}/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          studentIds: sessForm.studentIds.map(Number),
          title: finalTitle,
          subject: facultySubject || sessForm.subject,
          scheduledAt: scheduledAt.toISOString(),
          duration: Number(sessForm.duration),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to schedule session');
      resetSessForm();
      onClose();
      onShowToast(menteeOnly
        ? `Mentorship session scheduled${data.enrolledCount > 1 ? ` with ${data.enrolledCount} mentees` : ` with ${data.studentName || 'your mentee'}`} — Zoom meeting created ✓`
        : (data.enrolledCount > 1
          ? `Session scheduled with ${data.enrolledCount} students — Zoom meeting created ✓`
          : `Session scheduled with ${data.studentName || 'the student'} — Zoom meeting created ✓`));
      onSessionCreated?.(data);
    } catch (err) {
      setSessError(err.message);
    } finally {
      setSessLoading(false);
    }
  };

  // Resource upload state
  const [resTitle, setResTitle] = useState('');
  const [resDescription, setResDescription] = useState('');
  const [resSubject, setResSubject] = useState(facultySubject || 'Physics');
  const [resGrade, setResGrade] = useState('11');
  const [resType, setResType] = useState('');
  const [resFile, setResFile] = useState(null);
  const [resUploading, setResUploading] = useState(false);
  const [resTargetMode, setResTargetMode] = useState('all');
  const [resSelectedStudents, setResSelectedStudents] = useState([]);
  const [assignedStudents, setAssignedStudents] = useState([]);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (openModal !== 'suggest-res-modal') return;
    const token = localStorage.getItem('token');
    fetch(`${import.meta.env.VITE_API_URL}/api/faculty/${userId}/assigned-students`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : [])
      .then(data => { if (Array.isArray(data)) setAssignedStudents(data); })
      .catch(() => {});
  }, [openModal, userId]);

  // Mirror of the backend's targetEligibility() so the picker only offers
  // students the upload will actually accept (subject / grade / plan-for-type).
  const canReceiveResource = (st) => {
    const subjects = st.subjects || EXAM_SUBJECTS[st.examTarget] || [];
    if (!subjects.includes(resSubject)) return false;
    if (st.grade && resGrade) {
      const allowed = String(st.grade) === 'Dropper' ? ['11', '12', 'Dropper'] : [String(st.grade)];
      if (!allowed.includes(String(resGrade))) return false;
    }
    if (!resType) return st.plan !== 'spark';
    if (resType === 'Session Notes') return st.plan === 'apex';
    if (['MCQ Bank', 'Previous Year Papers', 'Practice Set'].includes(resType)) return st.plan === 'apex' || st.plan === 'forge';
    if (['Study Material', 'Formula Sheet'].includes(resType)) return ['apex', 'forge', 'anchor'].includes(st.plan);
    return false;
  };
  const eligibleStudents = assignedStudents.filter(canReceiveResource);
  const eligibleIds = new Set(eligibleStudents.map(s => s.id));
  const selectedCount = resSelectedStudents.filter(id => eligibleIds.has(id)).length;

  const resetResForm = () => {
    setResTitle(''); setResDescription(''); setResSubject(facultySubject || 'Physics');
    setResGrade('11'); setResType(''); setResFile(null);
    setResTargetMode('all'); setResSelectedStudents([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const submitResource = async () => {
    if (!resTitle.trim()) { onShowToast('Please enter a title'); return; }
    if (!resType) { onShowToast('Please select a type'); return; }
    if (!resFile) { onShowToast('Please select a file to upload'); return; }
    const targetIds = resTargetMode === 'selected'
      ? resSelectedStudents.filter(id => eligibleIds.has(id))
      : [];
    if (resTargetMode === 'selected' && !targetIds.length) {
      onShowToast(eligibleStudents.length
        ? 'Select at least one student to send this to'
        : `No assigned student matches ${resSubject} · Grade ${resGrade}`);
      return;
    }
    setResUploading(true);
    try {
      // 1. Upload to Cloudinary
      const formData = new FormData();
      formData.append('file', resFile);
      formData.append('upload_preset', UPLOAD_PRESET);
      formData.append('folder', 'resources');

      const cdnRes = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`, {
        method: 'POST',
        body: formData,
      });
      if (!cdnRes.ok) throw new Error('Cloudinary upload failed');
      const cdnData = await cdnRes.json();

      // 2. Save metadata to backend
      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/faculty/${userId}/resources`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          title:        resTitle.trim(),
          description:  resDescription.trim() || null,
          subject:      resSubject,
          grade:        resGrade,
          type:         resType,
          cloudinaryUrl: cdnData.secure_url,
          cloudinaryId:  cdnData.public_id,
          studentIds:   targetIds,
        }),
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.error || 'Backend save failed');
      }
      const data = await res.json();
      onResourceAdded?.(data.resource);
      const skipped = Array.isArray(data.skipped) ? data.skipped : [];
      resetResForm();
      onClose();
      if (skipped.length) {
        onShowToast(`Submitted ✓ — ${skipped.length} selected student${skipped.length > 1 ? 's were' : ' was'} skipped (${skipped[0].reason})`);
      } else {
        onShowToast('Resource submitted — pending admin approval ✓');
      }
    } catch (err) {
      onShowToast(err?.message || 'Upload failed. Try again.');
    } finally {
      setResUploading(false);
    }
  };

  // Quick Note — a fast student note that feeds into weekly parent reports.
  // Reuses the real MentorNote API (POST /mentor-student/:studentId/note) and
  // the same reachable-student pool as the schedule modal (/apex-students).
  const [quickStudentId, setQuickStudentId] = useState('');
  const [quickContent, setQuickContent] = useState('');
  const [quickLoading, setQuickLoading] = useState(false);

  // Load the reachable student list for the dropdown whenever the modal opens.
  useEffect(() => {
    if (openModal !== 'quick-note-modal') return;
    const token = localStorage.getItem('token');
    setStudentsLoading(true);
    fetch(`${import.meta.env.VITE_API_URL}/api/faculty/${userId}/apex-students`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => (r.ok ? r.json() : []))
      .then(data => {
        if (Array.isArray(data)) {
          setApexStudents(data);
          setQuickStudentId(prev => (data.some(st => String(st.id) === String(prev)) ? prev : (data[0]?.id || '')));
        }
      })
      .catch(() => {})
      .finally(() => setStudentsLoading(false));
  }, [openModal, userId]);

  // Clear the note content each time the modal opens.
  useEffect(() => {
    if (openModal !== 'quick-note-modal') return;
    setQuickContent('');
  }, [openModal]);

  const submitQuickNote = async () => {
    const sid = parseInt(quickStudentId, 10);
    if (!sid) { onShowToast('Please select a student'); return; }
    if (!quickContent.trim()) { onShowToast('Please write a note'); return; }
    const token = localStorage.getItem('token');
    setQuickLoading(true);
    try {
      const r = await fetch(`${import.meta.env.VITE_API_URL}/api/faculty/${userId}/mentor-student/${sid}/note`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ content: quickContent.trim() }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'Failed to save note');
      setQuickContent('');
      onClose();
      onShowToast(`Note saved for ${apexStudents.find(st => String(st.id) === String(sid))?.name || 'student'} ✓`);
    } catch (err) {
      onShowToast(err.message || 'Failed to save note. Try again.');
    } finally {
      setQuickLoading(false);
    }
  };

  const sendBroadcast = async () => {
    if (!broadcastText.trim()) { onShowToast('Please type a message first'); return; }
    const token = localStorage.getItem('token');
    setBroadcasting(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/faculty/${userId}/broadcast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message: broadcastText.trim() }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setBroadcastText('');
      onClose();
      onShowToast(`Message sent to ${data.notified} student${data.notified !== 1 ? 's' : ''} ✓`);
    } catch {
      onShowToast('Failed to send message. Try again.');
    } finally {
      setBroadcasting(false);
    }
  };

  return (
    <>
      {/* Student Detail Panel */}
      <div className={`detail-panel${detailOpen ? ' open' : ''}`}>
        <div className="dp-header" style={{ position: 'relative' }}>
          <div className="dp-close" onClick={onCloseDetail}>
            <X size={14} strokeWidth={2.4} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div className="sc-av" style={{ width: '48px', height: '48px', fontSize: '19px' }}>{s.init}</div>
            <div>
              <div style={{ fontFamily: 'var(--fs)', fontSize: '18px', fontWeight: 700, color: 'var(--inv)' }}>{s.name}</div>
              <div style={{ fontSize: '12px', color: 'var(--inv3)' }}>{s.exam}</div>
            </div>
          </div>
        </div>
        <div className="dp-content">
          <div className="journey-mini">
            <div style={{ fontSize: '11px', color: 'var(--inv3)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '10px', fontWeight: 500 }}>Score Journey</div>
            <div className="jm-scores">
              <div className="jm-point">
                <div className="jm-val" style={{ color: 'var(--inv2)' }}>{s.base}</div>
                <div className="jm-label">Day 1</div>
              </div>
              <div className="jm-point">
                <div className="jm-val" style={{ color: 'var(--gold)' }}>{s.curr}</div>
                <div className="jm-label">Today</div>
              </div>
              <div className="jm-point">
                <div className="jm-val" style={{ color: 'var(--green)' }}>{s.gain ? `+${s.gain}` : ''}</div>
                <div className="jm-label">Gained</div>
              </div>
            </div>
          </div>

          <div className="card mb" style={{ padding: '14px 16px' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: '10px' }}>Current Focus</div>
            <div style={{ fontSize: '13.5px', fontWeight: 500, color: 'var(--text)' }}>{s.topic}</div>
            <div style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '3px' }}>{s.subject}</div>
          </div>

          <div className="card mb" style={{ padding: '14px 16px' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: '12px' }}>Quick Actions</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button className="btn btn-gold btn-full" onClick={() => { onOpenModal('schedule-modal'); onCloseDetail(); }}>+ Schedule Session</button>
              <button className="btn btn-ghost btn-full" onClick={() => { onOpenModal('suggest-res-modal'); onCloseDetail(); }}>Suggest Resource</button>
              <button className="btn btn-ghost btn-full" onClick={() => { onNav('reports'); onCloseDetail(); }}>Draft Weekly Report</button>
            </div>
          </div>

          <div className="card" style={{ padding: '14px 16px' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: '10px' }}>Session Note</div>
            <textarea className="sn-textarea" rows="3" placeholder="Quick note after this student's last session — feeds into their weekly report..."></textarea>
            <button className="btn btn-gold btn-sm" style={{ marginTop: '8px', width: '100%', justifyContent: 'center' }} onClick={() => { onShowToast('Note saved ✓'); onCloseDetail(); }}>Save Note</button>
          </div>
        </div>
      </div>
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,31,61,0.3)', display: detailOpen ? 'block' : 'none', zIndex: 140 }} onClick={onCloseDetail} />

      {/* Schedule Modal */}
      <div className={`overlay${isOpen('schedule-modal')}`} onClick={e => e.target.classList.contains('overlay') && onClose()}>
        <div className="modal">
          <div className="mt">Schedule a Session</div>
          <div className="ms">A Zoom meeting is created automatically and all selected students are notified.</div>
          {!menteeOnly && (
            facultySubject ? (
              <div className="fg">
                <label>Subject</label>
                <div className="finput" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text)', background: 'var(--cream2)', fontWeight: 600 }}>
                  <span>{facultySubject}</span>
                  <span style={{ fontSize: '10.5px', fontWeight: 600, color: 'var(--green)', textTransform: 'uppercase', letterSpacing: '.05em' }}>Your subject</span>
                </div>
              </div>
            ) : (
              <div className="fg"><label>Subject</label>
                <select className="finput" value={sessForm.subject} onChange={e => { setSessForm(f => ({ ...f, subject: e.target.value, studentIds: [] })); setStudentsOpen(false); }}>
                  <option>Physics</option><option>Chemistry</option><option>Maths</option><option>Biology</option>
                </select>
              </div>
            )
          )}
          <div className="fg"><label>Students</label>
            <button type="button" className="finput" style={{ textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }} disabled={studentsLoading} onClick={() => setStudentsOpen(o => !o)}>
              <span style={{ color: selectedStudentsInfo.length ? 'inherit' : 'var(--text3)' }}>
                {studentsLoading ? 'Loading students…'
                  : selectedStudentsInfo.length === 0 ? 'Select students…'
                  : selectedStudentsInfo.length === 1 ? `1 student selected`
                  : `${selectedStudentsInfo.length} students selected`}
              </span>
              <span style={{ fontSize: '11px', transform: studentsOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', color: 'var(--text3)' }}>▾</span>
            </button>
            {studentsOpen && (
              roster.length === 0 ? (
                <div style={{ marginTop: '6px', fontSize: '12px', color: 'var(--text3)' }}>
                  {menteeStudents.length === 0 ? 'You have no mentees, and no Apex students take this subject' : 'No students are available to schedule with'}
                </div>
              ) : (
                <div style={{ maxHeight: '180px', overflowY: 'auto', border: '1px solid var(--line)', borderRadius: '8px', padding: '6px', marginTop: '6px' }}>
                  {menteeStudents.length > 0 && (
                    <>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text3)', padding: '4px 8px' }}>Your mentees</div>
                      {menteeStudents.map(st => (
                        <label key={st.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 8px', borderRadius: '6px', cursor: 'pointer', color: sessForm.studentIds.includes(String(st.id)) ? '#E8A830' : 'inherit' }}>
                          <input type="checkbox" style={{ accentColor: '#E8A830' }} checked={sessForm.studentIds.includes(String(st.id))} onChange={() => toggleStudent(st.id)} />
                          <span>{st.name} — Grade {st.grade || '—'}</span>
                        </label>
                      ))}
                    </>
                  )}
                  {apexEligible.length > 0 && (
                    <>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text3)', padding: '4px 8px' }}>Apex students — {shownSubject}</div>
                      {apexEligible.map(st => (
                        <label key={st.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 8px', borderRadius: '6px', cursor: 'pointer', color: sessForm.studentIds.includes(String(st.id)) ? '#E8A830' : 'inherit' }}>
                          <input type="checkbox" style={{ accentColor: '#E8A830' }} checked={sessForm.studentIds.includes(String(st.id))} onChange={() => toggleStudent(st.id)} />
                          <span>{st.name} — Grade {st.grade || '—'}</span>
                        </label>
                      ))}
                    </>
                  )}
                </div>
              )
            )}
          </div>
          {!menteeOnly && (
            <div className="fg"><label>Topic</label>
              <input className="finput" type="text" placeholder="e.g. Electrostatics — Gauss's Law" value={sessForm.title} onChange={e => setSessForm(f => ({ ...f, title: e.target.value }))} />
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
            <div className="fg"><label>Date</label><input className="finput" type="date" value={sessForm.date} onChange={e => setSessForm(f => ({ ...f, date: e.target.value }))} /></div>
            <div className="fg"><label>Time</label><input className="finput" type="time" value={sessForm.time} onChange={e => setSessForm(f => ({ ...f, time: e.target.value }))} /></div>
          </div>
          <div className="fg"><label>Duration</label>
            <select className="finput" value={sessForm.duration} onChange={e => setSessForm(f => ({ ...f, duration: e.target.value }))}>
              <option value={45}>45 minutes</option><option value={60}>60 minutes</option><option value={75}>75 minutes</option><option value={90}>90 minutes</option>
            </select>
          </div>
          {selectedStudentsInfo.length > 0 && (
            <div style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '2px' }}>
              {selectedStudentsInfo.length === 1
                ? `${selectedStudentsInfo[0].name} · Grade ${selectedStudentsInfo[0].grade || '—'} · ${selectedStudentsInfo[0].examTarget || 'No exam target set'}`
                : `${selectedStudentsInfo.length} students selected (${selectedStudentsInfo.map(x => x.name).join(', ')})`}
            </div>
          )}
          {sessError && <div style={{ color: '#e5484d', fontSize: '13px', marginTop: '6px' }}>{sessError}</div>}
          <div className="ma">
            <button className="btn btn-ghost btn-sm" onClick={() => { resetSessForm(); onClose(); }}>Cancel</button>
            <button className="btn btn-gold btn-sm" disabled={sessLoading} onClick={scheduleSession}>
              {sessLoading ? 'Scheduling…' : 'Schedule →'}
            </button>
          </div>
        </div>
      </div>

      {/* Quick Note Modal */}
      <div className={`overlay${isOpen('quick-note-modal')}`} onClick={e => { if (e.target.classList.contains('overlay')) { onClose(); } }}>
        <div className="modal">
          <div className="mt">Quick Session Note</div>
          <div className="ms">Notes feed into weekly parent reports. Be specific — vague notes make weak reports.</div>
          <div className="fg"><label>Student</label>
            <select className="finput" value={quickStudentId} onChange={e => setQuickStudentId(e.target.value)}>
              {studentsLoading && <option value="">Loading students…</option>}
              {!studentsLoading && apexStudents.length === 0 && <option value="">No reachable students</option>}
              {apexStudents.map(st => (
                <option key={st.id} value={st.id}>{st.name}{st.plan === 'apex' ? ' · Apex' : ' · Mentee'}</option>
              ))}
            </select>
          </div>
          <div className="fg"><label>Session Note</label>
            <textarea className="finput" rows="4" placeholder="What happened in the session? What clicked, what didn't, what's next?" value={quickContent} onChange={e => setQuickContent(e.target.value)}></textarea>
          </div>
          <div className="ma">
            <button className="btn btn-ghost btn-sm" onClick={onClose}>Cancel</button>
            <button className="btn btn-gold btn-sm" onClick={submitQuickNote} disabled={quickLoading}>{quickLoading ? 'Saving…' : 'Save Note →'}</button>
          </div>
        </div>
      </div>

      {/* Suggest Resource Modal */}
      <div className={`overlay${isOpen('suggest-res-modal')}`} onClick={e => e.target.classList.contains('overlay') && onClose()}>
        <div className="modal">
          <div className="mt">Upload a Resource</div>
          <div className="ms">Upload a file — admin reviews before students can access it.</div>
          <div className="fg"><label>Resource Title</label>
            <input className="finput" type="text" placeholder="e.g. HC Verma — Electrostatics Chapter" value={resTitle} onChange={e => setResTitle(e.target.value)} />
          </div>
          <div className="fg"><label>Description <span style={{ fontWeight: 400, color: 'var(--text3)' }}>(optional)</span></label>
            <input className="finput" type="text" placeholder="Brief note about what this covers" value={resDescription} onChange={e => setResDescription(e.target.value)} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
            <div className="fg"><label>Subject</label>
              <select className="finput" value={resSubject} onChange={e => setResSubject(e.target.value)}>
                <option>Physics</option><option>Chemistry</option><option>Maths</option><option>Biology</option>
              </select>
            </div>
            <div className="fg"><label>Grade</label>
              <select className="finput" value={resGrade} onChange={e => setResGrade(e.target.value)}>
                <option>11</option><option>12</option><option>Dropper</option>
              </select>
            </div>
          </div>
          <div className="fg"><label>Type</label>
            <select className="finput" value={resType} onChange={e => setResType(e.target.value)}>
              <option value="" disabled>— Select type —</option>
              <optgroup label="Study Materials">
                <option>Study Material</option><option>Formula Sheet</option><option>Session Notes</option>
              </optgroup>
              <optgroup label="Question Bank">
                <option>MCQ Bank</option><option>Previous Year Papers</option><option>Practice Set</option>
              </optgroup>
            </select>
          </div>
          <div className="fg">
            <label>Send To</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '8px', marginBottom: '9px' }}>
              {[{ v: 'all', l: 'All Students' }, { v: 'selected', l: 'Specific Students' }].map(opt => (
                <button key={opt.v} type="button" onClick={() => setResTargetMode(opt.v)}
                  style={{ padding: '9px 12px', borderRadius: '9px', border: `1.5px solid ${resTargetMode === opt.v ? 'var(--gold)' : 'var(--b)'}`, background: resTargetMode === opt.v ? 'var(--gd)' : 'transparent', cursor: 'pointer', fontSize: '12.5px', fontWeight: 600, color: resTargetMode === opt.v ? 'var(--gold)' : 'var(--text2)', transition: 'all .15s' }}>
                  {opt.l}
                </button>
              ))}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text3)', marginBottom: resTargetMode === 'selected' ? '9px' : 0 }}>
              {resTargetMode === 'all'
                ? 'Everyone eligible for this subject & grade sees it once approved.'
                : 'Only the students you pick see it once approved.'}
            </div>
            {resTargetMode === 'selected' && (
              <div style={{ maxHeight: '190px', overflowY: 'auto', overscrollBehavior: 'contain', border: '1px solid var(--b)', borderRadius: '10px', padding: '5px', background: 'var(--cream2)' }}>
                {eligibleStudents.length === 0
                  ? <div style={{ padding: '14px 12px', fontSize: '12px', color: 'var(--text3)', textAlign: 'center', lineHeight: 1.6 }}>
                      {assignedStudents.length === 0
                        ? 'No assigned students yet'
                        : `No assigned student matches ${resSubject} · Grade ${resGrade}${resType ? ` · ${resType}` : ''}`}
                    </div>
                  : eligibleStudents.map(st => {
                    const sel = resSelectedStudents.includes(st.id);
                    return (
                      <button key={st.id} type="button"
                        onClick={() => setResSelectedStudents(prev => sel ? prev.filter(id => id !== st.id) : [...prev, st.id])}
                        style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '8px 9px', cursor: 'pointer', borderRadius: '8px', border: 'none', font: 'inherit', textAlign: 'left', background: sel ? 'var(--gd)' : 'transparent', transition: 'background .12s' }}>
                        <span style={{ width: '28px', height: '28px', borderRadius: '50%', background: sel ? 'var(--gold)' : 'var(--cream3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, color: sel ? '#0F1F3D' : 'var(--text2)', flexShrink: 0 }}>{st.name?.charAt(0)}</span>
                        <span style={{ flex: 1, minWidth: 0 }}>
                          <span style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--text)' }}>{st.name}</span>
                          <span style={{ display: 'block', fontSize: '10.5px', color: 'var(--text3)' }}>{st.plan}{st.grade ? ` · Grade ${st.grade}` : ''}{st.isMentee ? ' · Mentee' : ''}</span>
                        </span>
                        {sel && <Check size={15} strokeWidth={2.6} style={{ color: 'var(--gold)', flexShrink: 0 }} />}
                      </button>
                    );
                  })}
              </div>
            )}
            {resTargetMode === 'selected' && selectedCount > 0 && (
              <div style={{ fontSize: '11px', color: 'var(--gold)', marginTop: '7px', fontWeight: 600 }}>{selectedCount} student{selectedCount !== 1 ? 's' : ''} selected</div>
            )}
          </div>
          <div className="fg">
            <label>File <span style={{ fontWeight: 400, color: 'var(--text3)' }}>(PDF, DOC, etc.)</span></label>
            <input ref={fileInputRef} className="finput" type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.png,.jpg" onChange={e => setResFile(e.target.files[0] || null)} />
            {resFile && <div style={{ fontSize: '11px', color: 'var(--green)', marginTop: '4px' }}>✓ {resFile.name} ({(resFile.size / 1024 / 1024).toFixed(1)} MB)</div>}
          </div>
          <div className="approval-notice">Admin will review and approve — students see it only after approval.</div>
          <div className="ma">
            <button className="btn btn-ghost btn-sm" onClick={() => { resetResForm(); onClose(); }}>Cancel</button>
            <button className="btn btn-gold btn-sm" disabled={resUploading} onClick={submitResource}>
              {resUploading ? 'Uploading…' : 'Submit for Approval →'}
            </button>
          </div>
        </div>
      </div>

      {/* Broadcast Modal */}
      <div className={`overlay${isOpen('broadcast-modal')}`} onClick={e => e.target.classList.contains('overlay') && onClose()}>
        <div className="modal">
          <div className="mt">Message All Students</div>
          <div className="ms">Sends a notification to all your assigned students instantly.</div>
          <div className="fg">
            <label>Message</label>
            <textarea className="finput" rows="4" placeholder="e.g. No session this Friday. Revise chapters 3–5 before Monday." value={broadcastText} onChange={e => setBroadcastText(e.target.value)} />
          </div>
          <div className="ma">
            <button className="btn btn-ghost btn-sm" onClick={onClose}>Cancel</button>
            <button className="btn btn-gold btn-sm" disabled={broadcasting} onClick={sendBroadcast}>
              {broadcasting ? 'Sending…' : 'Send to All Students →'}
            </button>
          </div>
        </div>
      </div>

      {/* Toast */}
      <div className={`toast${toast.show ? ' show' : ''}`}>
        <div className="tpip"></div>
        <span>{toast.msg}</span>
      </div>
    </>
  );
};

export default FacultyModals;
