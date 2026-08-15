import React, { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';

const CLOUD_NAME    = 'dnotkgppz';
const UPLOAD_PRESET = 'faculty_resources';

const EXAM_SUBJECTS = {
  'JEE Mains':    ['Physics', 'Chemistry', 'Maths'],
  'JEE Advanced': ['Physics', 'Chemistry', 'Maths'],
  'NEET':         ['Physics', 'Chemistry', 'Biology'],
};

const FacultyModals = ({ openModal, onClose, onShowToast, toast, detailOpen, selectedStudent, onCloseDetail, onOpenModal, onNav, onResourceAdded, onSessionCreated }) => {
  const { id: userId } = useParams();
  const isOpen = (id) => openModal === id ? ' open' : '';
  const s = selectedStudent || {};
  const [broadcastText, setBroadcastText] = useState('');
  const [broadcasting, setBroadcasting] = useState(false);

  // Schedule Session state
  const [sessForm, setSessForm] = useState({ studentId: '', title: '', subject: 'Physics', date: '', time: '', duration: 45 });
  const [sessLoading, setSessLoading] = useState(false);
  const [sessError, setSessError] = useState('');
  const [apexStudents, setApexStudents] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(false);

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

  const eligibleStudents = apexStudents.filter(st => (EXAM_SUBJECTS[st.examTarget] || []).includes(sessForm.subject));
  const selectedStudentInfo = eligibleStudents.find(st => String(st.id) === String(sessForm.studentId));

  const resetSessForm = () => {
    setSessForm({ studentId: '', title: '', subject: 'Physics', date: '', time: '', duration: 45 });
    setSessError('');
  };

  const scheduleSession = async () => {
    if (!sessForm.studentId || !sessForm.title.trim() || !sessForm.date || !sessForm.time) {
      setSessError('Please fill in all fields.');
      return;
    }
    const scheduledAt = new Date(`${sessForm.date}T${sessForm.time}`);
    if (isNaN(scheduledAt.getTime())) { setSessError('Invalid date/time.'); return; }

    setSessLoading(true);
    setSessError('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/faculty/${userId}/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          studentId: Number(sessForm.studentId),
          title: sessForm.title.trim(),
          subject: sessForm.subject,
          scheduledAt: scheduledAt.toISOString(),
          duration: Number(sessForm.duration),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to schedule session');
      resetSessForm();
      onClose();
      onShowToast(`Session scheduled with ${data.studentName || 'the student'} — Zoom meeting created ✓`);
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
  const [resSubject, setResSubject] = useState('Physics');
  const [resGrade, setResGrade] = useState('11');
  const [resType, setResType] = useState('');
  const [resFile, setResFile] = useState(null);
  const [resUploading, setResUploading] = useState(false);
  const fileInputRef = useRef(null);

  const resetResForm = () => {
    setResTitle(''); setResDescription(''); setResSubject('Physics');
    setResGrade('11'); setResType(''); setResFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const submitResource = async () => {
    if (!resTitle.trim()) { onShowToast('Please enter a title'); return; }
    if (!resType) { onShowToast('Please select a type'); return; }
    if (!resFile) { onShowToast('Please select a file to upload'); return; }
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
        }),
      });
      if (!res.ok) throw new Error('Backend save failed');
      const data = await res.json();
      onResourceAdded?.(data.resource);
      resetResForm();
      onClose();
      onShowToast('Resource submitted — pending admin approval ✓');
    } catch (err) {
      onShowToast('Upload failed. Try again.');
    } finally {
      setResUploading(false);
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
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
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
              <button className="btn btn-navy btn-full" onClick={() => { onOpenModal('assign-test-modal'); onCloseDetail(); }}>Suggest a Test</button>
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
          <div className="ms">A Zoom meeting is created automatically and the student is notified.</div>
          <div className="fg"><label>Subject</label>
            <select className="finput" value={sessForm.subject} onChange={e => setSessForm(f => ({ ...f, subject: e.target.value, studentId: '' }))}>
              <option>Physics</option><option>Chemistry</option><option>Maths</option><option>Biology</option>
            </select>
          </div>
          <div className="fg"><label>Student</label>
            <select className="finput" value={sessForm.studentId} onChange={e => setSessForm(f => ({ ...f, studentId: e.target.value }))} disabled={studentsLoading}>
              <option value="">{studentsLoading ? 'Loading students…' : eligibleStudents.length === 0 ? 'No Apex students take this subject' : '— Select student —'}</option>
              {eligibleStudents.map(st => (
                <option key={st.id} value={st.id}>{st.name} — Grade {st.grade || '—'}</option>
              ))}
            </select>
          </div>
          <div className="fg"><label>Topic</label>
            <input className="finput" type="text" placeholder="e.g. Electrostatics — Gauss's Law" value={sessForm.title} onChange={e => setSessForm(f => ({ ...f, title: e.target.value }))} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
            <div className="fg"><label>Date</label><input className="finput" type="date" value={sessForm.date} onChange={e => setSessForm(f => ({ ...f, date: e.target.value }))} /></div>
            <div className="fg"><label>Time</label><input className="finput" type="time" value={sessForm.time} onChange={e => setSessForm(f => ({ ...f, time: e.target.value }))} /></div>
          </div>
          <div className="fg"><label>Duration</label>
            <select className="finput" value={sessForm.duration} onChange={e => setSessForm(f => ({ ...f, duration: e.target.value }))}>
              <option value={45}>45 minutes</option><option value={60}>60 minutes</option><option value={75}>75 minutes</option><option value={90}>90 minutes</option>
            </select>
          </div>
          {selectedStudentInfo && (
            <div style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '2px' }}>
              {selectedStudentInfo.name} · Grade {selectedStudentInfo.grade || '—'} · {selectedStudentInfo.examTarget || 'No exam target set'}
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
      <div className={`overlay${isOpen('quick-note-modal')}`} onClick={e => e.target.classList.contains('overlay') && onClose()}>
        <div className="modal">
          <div className="mt">Quick Session Note</div>
          <div className="ms">Notes feed into weekly parent reports. Be specific — vague notes make weak reports.</div>
          <div className="fg"><label>Student</label>
            <select className="finput"><option>Rahul Mehta</option><option>Sneha Kapoor</option><option>Priya Desai</option><option>Arjun Singh</option></select>
          </div>
          <div className="fg"><label>Session Note</label>
            <textarea className="finput" rows="4" placeholder="What happened in the session? What clicked, what didn't, what's next?"></textarea>
          </div>
          <div className="ma">
            <button className="btn btn-ghost btn-sm" onClick={onClose}>Cancel</button>
            <button className="btn btn-gold btn-sm" onClick={() => { onClose(); onShowToast('Note saved. Will appear in Sunday report ✓'); }}>Save Note →</button>
          </div>
        </div>
      </div>

      {/* Session Note Modal */}
      <div className={`overlay${isOpen('session-note-modal')}`} onClick={e => e.target.classList.contains('overlay') && onClose()}>
        <div className="modal">
          <div className="mt">Session Notes — Sneha Kapoor</div>
          <div className="ms">Integration — By Parts • Today, 4:00 PM</div>
          <div className="fg"><label>What was covered</label>
            <input className="finput" type="text" defaultValue="Integration — By Parts & ILATE Rule" />
          </div>
          <div className="fg"><label>What went well</label>
            <textarea className="finput" rows="2" defaultValue="Substitution method now solid. ILATE rule understood quickly."></textarea>
          </div>
          <div className="fg"><label>What needs work</label>
            <textarea className="finput" rows="2" defaultValue="Choosing u vs dv in non-standard forms — needs more practice."></textarea>
          </div>
          <div className="fg"><label>Next session plan</label>
            <input className="finput" type="text" defaultValue="Integration — Definite Integrals and limits applications" />
          </div>
          <div className="ma">
            <button className="btn btn-ghost btn-sm" onClick={onClose}>Cancel</button>
            <button className="btn btn-gold btn-sm" onClick={() => { onClose(); onShowToast('Session notes saved ✓'); }}>Save Notes →</button>
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
            <label>File <span style={{ fontWeight: 400, color: 'var(--text3)' }}>(PDF, DOC, etc.)</span></label>
            <input ref={fileInputRef} className="finput" type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.png,.jpg" onChange={e => setResFile(e.target.files[0] || null)} />
            {resFile && <div style={{ fontSize: '11px', color: 'var(--green)', marginTop: '4px' }}>✓ {resFile.name} ({(resFile.size / 1024 / 1024).toFixed(1)} MB)</div>}
          </div>
          <div className="approval-notice">⏳ Admin will review and approve — students see it only after approval.</div>
          <div className="ma">
            <button className="btn btn-ghost btn-sm" onClick={() => { resetResForm(); onClose(); }}>Cancel</button>
            <button className="btn btn-gold btn-sm" disabled={resUploading} onClick={submitResource}>
              {resUploading ? 'Uploading…' : 'Submit for Approval →'}
            </button>
          </div>
        </div>
      </div>

      {/* Assign Test Modal */}
      <div className={`overlay${isOpen('assign-test-modal')}`} onClick={e => e.target.classList.contains('overlay') && onClose()}>
        <div className="modal">
          <div className="mt">Suggest a Test</div>
          <div className="ms">Your suggestion goes to admin. Once approved it appears as a "Mentor-assigned" test for the student.</div>
          <div className="fg"><label>Student</label>
            <select className="finput"><option>Rahul Mehta</option><option>Sneha Kapoor</option><option>Priya Desai</option><option>Arjun Singh</option></select>
          </div>
          <div className="fg"><label>Test Topic / Name</label><input className="finput" type="text" placeholder="e.g. Electrostatics — Targeted 25Q Test" /></div>
          <div className="fg"><label>Why is this test needed now?</label>
            <textarea className="finput" rows="3" placeholder="Admin needs your reasoning — what gap does this test address?"></textarea>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
            <div className="fg"><label>No. of Questions</label><input className="finput" type="number" placeholder="e.g. 25" /></div>
            <div className="fg"><label>Suggested Deadline</label><input className="finput" type="date" /></div>
          </div>
          <div className="approval-notice">⏳ Admin will review and approve within 24h.</div>
          <div className="ma">
            <button className="btn btn-ghost btn-sm" onClick={onClose}>Cancel</button>
            <button className="btn btn-gold btn-sm" onClick={() => { onClose(); onShowToast('Test suggestion sent for admin approval ✓'); }}>Send for Approval →</button>
          </div>
        </div>
      </div>

      {/* Broadcast Modal */}
      <div className={`overlay${isOpen('broadcast-modal')}`} onClick={e => e.target.classList.contains('overlay') && onClose()}>
        <div className="modal">
          <div className="mt">📢 Message All Students</div>
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
