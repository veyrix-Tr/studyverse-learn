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

const AdminModals = ({ openModal, onClose, onShowToast, toast, students = [], messageStudentId = null, onSendMessage, userId, onFacultyAdded, facultyApplications = [] }) => {
  const isOpen = (id) => openModal === id ? ' open' : '';
  const [newFaculty, setNewFaculty] = useState({ name: '', email: '', subject: '', qualification: '', department: 'Science' });
  const [addingFaculty, setAddingFaculty] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState(null);
  const [newAdmin, setNewAdmin] = useState({ name: '', email: '', department: 'Operations' });
  const [addingAdmin, setAddingAdmin] = useState(false);
  const [adminCredentials, setAdminCredentials] = useState(null);

  const handleAddFaculty = async () => {
    if (!newFaculty.name.trim() || !newFaculty.email.trim() || !newFaculty.subject.trim()) {
      onShowToast('Name, email, and subject are required');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newFaculty.email.trim())) {
      onShowToast('Please enter a valid email address');
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

  const handleAddAdmin = async () => {
    if (!newAdmin.name.trim() || !newAdmin.email.trim()) {
      onShowToast('Name and email are required');
      return;
    }
    setAddingAdmin(true);
    const token = localStorage.getItem('token');
    try {
      const r = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/${userId}/admins`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(newAdmin),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'Failed');
      setAdminCredentials(data.credentials);
      setNewAdmin({ name: '', email: '', department: 'Operations' });
      onShowToast(`${data.admin.name} created — login credentials generated ✓`);
    } catch (e) {
      onShowToast('Failed to create admin: ' + e.message);
    }
    setAddingAdmin(false);
  };

  const handleApproveApplication = async (id) => {
    const token = localStorage.getItem('token');
    try {
      const r = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/${userId}/faculty-applications/${id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'Failed');
      onShowToast(`${data.faculty.name} approved — credentials sent to ${data.faculty.email} ✓`);
      onFacultyAdded?.({ ...data.faculty, subjects: [data.faculty.subject], sessionsPerWeek: 0, reportCount: 0, avgRating: null });
      onClose();
    } catch (e) {
      onShowToast('Failed to approve: ' + e.message);
    }
  };

  const handleRejectApplication = async (id) => {
    const token = localStorage.getItem('token');
    try {
      const r = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/${userId}/faculty-applications/${id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'Failed');
      onShowToast('Application rejected');
      onClose();
    } catch (e) {
      onShowToast('Failed to reject: ' + e.message);
    }
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
            <div className="fg"><label>Full Name</label><input className="fi" type="text" placeholder="Admin's name" value={newAdmin.name} onChange={e => setNewAdmin({ ...newAdmin, name: e.target.value })} /></div>
            <div className="fg"><label>Email</label><input className="fi" type="email" placeholder="admin@studyverse.in" value={newAdmin.email} onChange={e => setNewAdmin({ ...newAdmin, email: e.target.value })} /></div>
          </div>
          <div style={{ fontSize: '12px', fontWeight: '500', color: 'var(--text2)', marginBottom: '10px' }}>Permissions</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
            {[
              { label: 'View & manage students', on: true },
              { label: 'Provision paid plans & enrollments', on: false },
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
            <button className="btn btn-purple btn-sm" onClick={handleAddAdmin} disabled={addingAdmin}>{addingAdmin ? 'Creating…' : 'Create Account →'}</button>
          {adminCredentials && (
            <div style={{ marginTop: '12px', padding: '12px 14px', borderRadius: 'var(--r)', background: 'var(--cream2)', borderLeft: '3px solid var(--green)', fontSize: '12px', lineHeight: 1.7 }}>
              <strong style={{ color: 'var(--green)' }}>Created ✓</strong> Share these login credentials with the new admin:
              <div style={{ fontFamily: 'var(--fs)', marginTop: '4px' }}>
                Email: <strong>{adminCredentials.email}</strong><br />
                Password: <strong>{adminCredentials.password}</strong>
              </div>
            </div>
          )}
          </div>
        </div>
      </div>

      {/* Add Faculty */}
      <div className={`overlay${isOpen('add-faculty-modal')}`} id="add-faculty-modal" onClick={e => { if (e.target.classList.contains('overlay')) { onClose(); setCreatedCredentials(null); setNewFaculty({ name:'', email:'', subject:'', qualification:'', department:'Science' }); }}}>
        <div className="modal">
          {createdCredentials ? (
            <>
              <div className="mt">Faculty Added ✓</div>
              <div className="ms">A welcome email with login credentials has been sent to {createdCredentials.email}. You can also copy the credentials below to share manually.</div>
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
                <button className="btn btn-ghost btn-sm" onClick={() => { onClose(); setCreatedCredentials(null); setNewFaculty({ name:'', email:'', subject:'', qualification:'', department:'Science' }); }}>Done</button>
              </div>
            </>
          ) : (
            <>
              <div className="mt">Add Faculty Member</div>
              <div className="ms">Enter the faculty's real email address. A welcome email with login credentials will be sent to them automatically.</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
                <div className="fg"><label>Full Name *</label><input className="fi" type="text" placeholder="Dr. Ananya Singh" value={newFaculty.name} onChange={e => setNewFaculty(p => ({ ...p, name: e.target.value }))} /></div>
                <div className="fg"><label>Email *</label><input className="fi" type="email" placeholder="faculty@gmail.com" value={newFaculty.email} onChange={e => setNewFaculty(p => ({ ...p, email: e.target.value }))} /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
                <div className="fg"><label>Subject *</label>
                  <select className="fi" value={newFaculty.subject} onChange={e => setNewFaculty(p => ({ ...p, subject: e.target.value }))}>
                    <option value="">Select subject</option>
                    <option>Physics</option><option>Chemistry</option><option>Mathematics</option><option>Biology</option><option>Maths</option>
                  </select>
                </div>
                <div className="fg"><label>Qualification</label><input className="fi" type="text" placeholder="Ph.D, M.Sc..." value={newFaculty.qualification} onChange={e => setNewFaculty(p => ({ ...p, qualification: e.target.value }))} /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
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

      {/* Faculty Applications */}
      <div className={`overlay${isOpen('faculty-applications-modal')}`} id="faculty-applications-modal" onClick={e => e.target.classList.contains('overlay') && onClose()}>
        <div className="modal" style={{ maxWidth: '640px' }}>
          <div className="mt">Faculty Applications</div>
          <div className="ms">Review faculty self-enrollment requests. Approving creates their account and sends them login credentials.</div>
          <div style={{ maxHeight: '400px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {facultyApplications.length === 0 && (
              <div style={{ textAlign: 'center', color: 'var(--text3)', fontSize: '13px', padding: '24px' }}>No applications yet</div>
            )}
            {facultyApplications.map(app => (
              <div key={app.id} style={{ background: 'var(--cream2)', border: '1px solid var(--b)', borderRadius: 'var(--r)', padding: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text)' }}>{app.name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text2)', marginTop: '2px' }}>{app.email}</div>
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: '600', padding: '3px 10px', borderRadius: '20px', background: app.status === 'pending' ? 'rgba(245,158,11,0.15)' : app.status === 'approved' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)', color: app.status === 'pending' ? '#D97706' : app.status === 'approved' ? '#16A34A' : '#DC2626' }}>
                    {app.status}
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text2)', marginBottom: '10px' }}>
                  {app.subject}{app.qualification ? ` · ${app.qualification}` : ''}{app.department ? ` · ${app.department}` : ''}
                </div>
                {app.status === 'pending' && (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn btn-gold btn-sm" style={{ flex: 1 }} onClick={() => handleApproveApplication(app.id)}>Approve</button>
                    <button className="btn btn-ghost btn-sm" style={{ flex: 1 }} onClick={() => handleRejectApplication(app.id)}>Reject</button>
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="ma">
            <button className="btn btn-ghost btn-sm" onClick={onClose}>Close</button>
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

export default AdminModals;
