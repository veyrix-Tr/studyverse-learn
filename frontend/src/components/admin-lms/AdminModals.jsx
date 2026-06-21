import { useState, useEffect } from 'react';

const PermToggleRow = ({ label, defaultOn, last }) => {
  const [on, setOn] = useState(defaultOn);
  return (
    <div className="perm-row" style={last ? { border: 'none' } : {}}>
      <div><div className="perm-label" style={{ fontSize: '12.5px' }}>{label}</div></div>
      <div className={`toggle${on ? ' on' : ''}`} onClick={() => setOn(!on)}></div>
    </div>
  );
};

const AdminModals = ({ openModal, onClose, onShowToast, toast, students = [], messageStudentId = null, onSendMessage, userId, onFacultyAdded }) => {
  const isOpen = (id) => openModal === id ? ' open' : '';
  const [newFaculty, setNewFaculty] = useState({ name: '', subject: '', qualification: '', department: 'Science' });
  const [addingFaculty, setAddingFaculty] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState(null);

  const handleAddFaculty = async () => {
    if (!newFaculty.name.trim() || !newFaculty.subject.trim()) {
      onShowToast('Name and subject are required');
      return;
    }
    setAddingFaculty(true);
    const token = localStorage.getItem('token');
    try {
      const r = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/${userId}/faculty`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(newFaculty),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'Failed');
      setCreatedCredentials(data.credentials);
      onFacultyAdded?.({ ...data.faculty, subjects: [data.faculty.subject], sessionsPerWeek: 0, reportCount: 0, avgRating: null });
      onShowToast(`${data.faculty.name} added successfully ✓`);
    } catch (e) {
      onShowToast('Failed to add faculty: ' + e.message);
    }
    setAddingFaculty(false);
  };

  const [msgStudent, setMsgStudent] = useState('all');
  const [msgType, setMsgType] = useState('Announcement');
  const [msgContent, setMsgContent] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (openModal === 'message-modal') {
      setMsgStudent(messageStudentId !== null ? String(messageStudentId) : 'all');
      setMsgType('Announcement');
      setMsgContent('');
    }
  }, [openModal, messageStudentId]);

  const handleSendMessage = async () => {
    if (!msgContent.trim()) { onShowToast('Please write a message'); return; }
    setSending(true);
    try {
      await onSendMessage(msgStudent, msgType, msgContent);
      setMsgContent('');
      onClose();
    } catch {
      onShowToast('Failed to send message. Try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      {/* Enroll Student */}
      <div className={`overlay${isOpen('enroll-modal')}`} id="enroll-modal" onClick={e => e.target.classList.contains('overlay') && onClose()}>
        <div className="modal">
          <div className="mt">Enroll a New Student</div>
          <div className="ms">This creates their profile and moves them into the Enrolled stage.</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="fg"><label>Student Name</label><input className="fi" type="text" placeholder="Full name" /></div>
            <div className="fg"><label>Parent Name</label><input className="fi" type="text" placeholder="Parent's name" /></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="fg"><label>Parent Mobile</label><input className="fi" type="tel" placeholder="+91 XXXXX XXXXX" /></div>
            <div className="fg"><label>City</label><input className="fi" type="text" placeholder="City" /></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="fg"><label>Target Exam</label>
              <select className="fi"><option>JEE Mains 2026</option><option>JEE Advanced 2026</option><option>NEET 2026</option><option>JEE 2027</option><option>NEET 2027</option></select>
            </div>
            <div className="fg"><label>Plan</label>
              <select className="fi"><option>Full Program</option><option>Unlock Plan</option><option>Single Sessions</option></select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="fg"><label>Assign Faculty</label>
              <select className="fi"><option>Ajay Sharma</option><option>Neha Gupta</option><option>Assign later</option></select>
            </div>
          </div>
          <div className="fg"><label>Diagnostic Score (Baseline)</label><input className="fi" type="number" placeholder="e.g. 380 — from diagnostic call" /></div>
          <div className="ma">
            <button className="btn btn-ghost btn-sm" onClick={onClose}>Cancel</button>
            <button className="btn btn-gold btn-sm" onClick={() => { onClose(); onShowToast('Student enrolled. Faculty notified. Dashboard created ✓'); }}>Enroll Student →</button>
          </div>
        </div>
      </div>

      {/* Assign / Reassign Faculty */}
      <div className={`overlay${isOpen('assign-modal')}`} id="assign-modal" onClick={e => e.target.classList.contains('overlay') && onClose()}>
        <div className="modal">
          <div className="mt">Assign / Reassign Faculty</div>
          <div className="ms">This will notify both the student and the new faculty member.</div>
          <div className="fg"><label>Student</label>
            <select className="fi"><option>Vanya Rao (unassigned)</option><option>Rahul Mehta (Ajay Sharma)</option><option>Priya Desai (Ajay Sharma)</option></select>
          </div>
          <div className="fg"><label>Assign to Faculty</label>
            <select className="fi"><option>Ajay Sharma — 8 students (80% capacity)</option><option>Neha Gupta — 3 students (30% capacity)</option></select>
          </div>
          <div className="fg"><label>Reason for assignment / change</label>
            <textarea className="fi" rows="2" placeholder="Optional — will be logged"></textarea>
          </div>
          <div style={{ background: 'var(--odim)', border: '1px solid rgba(249,115,22,0.25)', borderRadius: 'var(--r)', padding: '10px 12px', fontSize: '12px', color: 'var(--orange)', marginTop: '4px' }}>
            Note: Student and parent will be notified. Faculty workload will update immediately.
          </div>
          <div className="ma">
            <button className="btn btn-ghost btn-sm" onClick={onClose}>Cancel</button>
            <button className="btn btn-gold btn-sm" onClick={() => { onClose(); onShowToast('Faculty assigned. Student and faculty notified ✓'); }}>Confirm Assignment →</button>
          </div>
        </div>
      </div>

      {/* Message Modal */}
      <div className={`overlay${isOpen('message-modal')}`} id="message-modal" onClick={e => e.target.classList.contains('overlay') && onClose()}>
        <div className="modal">
          <div className="mt">Send Message to Student</div>
          <div className="ms">Appears as a notification on their dashboard immediately.</div>
          <div className="fg"><label>Student</label>
            <select className="fi" value={msgStudent} onChange={e => setMsgStudent(e.target.value)}>
              <option value="all">All Students</option>
              {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="fg"><label>Type</label>
            <select className="fi" value={msgType} onChange={e => setMsgType(e.target.value)}>
              <option>Announcement</option>
              <option>Reminder</option>
              <option>Motivational Note</option>
              <option>Schedule Update</option>
            </select>
          </div>
          <div className="fg"><label>Message</label>
            <textarea className="fi" rows="4" placeholder="Write message..." value={msgContent} onChange={e => setMsgContent(e.target.value)}></textarea>
          </div>
          <div className="ma">
            <button className="btn btn-ghost btn-sm" onClick={onClose}>Cancel</button>
            <button className="btn btn-gold btn-sm" onClick={handleSendMessage} disabled={sending}>{sending ? 'Sending…' : 'Send →'}</button>
          </div>
        </div>
      </div>


      {/* Create Admin */}
      <div className={`overlay${isOpen('add-admin-modal')}`} id="add-admin-modal" onClick={e => e.target.classList.contains('overlay') && onClose()}>
        <div className="modal">
          <div className="mt">Create Admin Account</div>
          <div className="ms">Set their permissions carefully. They can only do what you allow.</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="fg"><label>Full Name</label><input className="fi" type="text" placeholder="Admin's name" /></div>
            <div className="fg"><label>Email</label><input className="fi" type="email" placeholder="admin@studyverse.in" /></div>
          </div>
          <div style={{ fontSize: '12px', fontWeight: '500', color: 'var(--text2)', marginBottom: '10px' }}>Permissions</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
            {[
              { label: 'View & manage students', on: true },
              { label: 'Enroll new students', on: true },
              { label: 'Assign faculty to students', on: true },
              { label: 'Approve tests & resources', on: true },
              { label: 'Send messages to students', on: true },
              { label: 'View revenue', on: false },
              { label: 'Manage subscriptions', on: false },
              { label: 'Add / remove faculty', on: false }
            ].map(({ label, on }, i, arr) => (
              <PermToggleRow key={label} label={label} defaultOn={on} last={i === arr.length - 1} />
            ))}
          </div>
          <div className="ma">
            <button className="btn btn-ghost btn-sm" onClick={onClose}>Cancel</button>
            <button className="btn btn-purple btn-sm" onClick={() => { onClose(); onShowToast('Admin account created. Login credentials sent ✓'); }}>Create Account →</button>
          </div>
        </div>
      </div>

      {/* Edit Admin Permissions */}
      <div className={`overlay${isOpen('edit-admin-modal')}`} id="edit-admin-modal" onClick={e => e.target.classList.contains('overlay') && onClose()}>
        <div className="modal">
          <div className="mt">Edit Permissions — Meera Krishnan</div>
          <div className="ms">Toggle access on or off. Changes take effect immediately.</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
            {[
              { label: 'View & manage students', on: true },
              { label: 'Enroll new students', on: true },
              { label: 'Assign faculty to students', on: true },
              { label: 'Approve tests & resources', on: true },
              { label: 'Send messages to students', on: true },
              { label: 'View revenue', on: false },
              { label: 'Manage subscriptions', on: false },
              { label: 'Add / remove faculty', on: false }
            ].map(({ label, on }, i, arr) => (
              <PermToggleRow key={label} label={label} defaultOn={on} last={i === arr.length - 1} />
            ))}
          </div>
          <div className="ma">
            <button className="btn btn-ghost btn-sm" onClick={onClose}>Cancel</button>
            <button className="btn btn-purple btn-sm" onClick={() => { onClose(); onShowToast('Permissions updated for Meera Krishnan ✓'); }}>Save Changes →</button>
          </div>
        </div>
      </div>

      {/* Add Faculty */}
      <div className={`overlay${isOpen('add-faculty-modal')}`} id="add-faculty-modal" onClick={e => { if (e.target.classList.contains('overlay')) { onClose(); setCreatedCredentials(null); setNewFaculty({ name:'', subject:'', qualification:'', department:'Science' }); }}}>
        <div className="modal">
          {createdCredentials ? (
            <>
              <div className="mt">Faculty Added ✓</div>
              <div className="ms">Share these login credentials with the faculty member. They can change their password after first login.</div>
              <div style={{ background: 'var(--cream2)', border: '1px solid var(--b)', borderRadius: 'var(--r)', padding: '16px', marginBottom: '16px' }}>
                <div style={{ marginBottom: '10px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text3)', marginBottom: '3px' }}>EMAIL</div>
                  <div style={{ fontSize: '13px', fontWeight: '600', fontFamily: 'monospace', userSelect: 'all' }}>{createdCredentials.email}</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text3)', marginBottom: '3px' }}>PASSWORD</div>
                  <div style={{ fontSize: '13px', fontWeight: '600', fontFamily: 'monospace', userSelect: 'all' }}>{createdCredentials.password}</div>
                </div>
              </div>
              <div className="ma">
                <button className="btn btn-gold btn-sm" onClick={() => {
                  navigator.clipboard?.writeText(`Email: ${createdCredentials.email}\nPassword: ${createdCredentials.password}`);
                  onShowToast('Credentials copied to clipboard ✓');
                }}>Copy Credentials</button>
                <button className="btn btn-ghost btn-sm" onClick={() => { onClose(); setCreatedCredentials(null); setNewFaculty({ name:'', subject:'', qualification:'', department:'Science' }); }}>Done</button>
              </div>
            </>
          ) : (
            <>
              <div className="mt">Add Faculty Member</div>
              <div className="ms">A faculty account will be created. Login credentials will be generated for you to share.</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="fg"><label>Full Name *</label><input className="fi" type="text" placeholder="Dr. Ananya Singh" value={newFaculty.name} onChange={e => setNewFaculty(p => ({ ...p, name: e.target.value }))} /></div>
                <div className="fg"><label>Subject *</label>
                  <select className="fi" value={newFaculty.subject} onChange={e => setNewFaculty(p => ({ ...p, subject: e.target.value }))}>
                    <option value="">Select subject</option>
                    <option>Physics</option><option>Chemistry</option><option>Mathematics</option><option>Biology</option><option>Maths</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="fg"><label>Qualification</label><input className="fi" type="text" placeholder="Ph.D, M.Sc..." value={newFaculty.qualification} onChange={e => setNewFaculty(p => ({ ...p, qualification: e.target.value }))} /></div>
                <div className="fg"><label>Department</label><input className="fi" type="text" placeholder="Science" value={newFaculty.department} onChange={e => setNewFaculty(p => ({ ...p, department: e.target.value }))} /></div>
              </div>
              <div className="ma">
                <button className="btn btn-ghost btn-sm" onClick={onClose} disabled={addingFaculty}>Cancel</button>
                <button className="btn btn-gold btn-sm" onClick={handleAddFaculty} disabled={addingFaculty}>{addingFaculty ? 'Creating…' : 'Add Faculty →'}</button>
              </div>
            </>
          )}
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

export default AdminModals;
