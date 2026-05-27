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

const AdminModals = ({ openModal, onClose, onShowToast, toast, students = [], messageStudentId = null }) => {
  const isOpen = (id) => openModal === id ? ' open' : '';

  const [msgStudent, setMsgStudent] = useState('all');
  const [msgType, setMsgType] = useState('Announcement');
  const [msgContent, setMsgContent] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (openModal === 'message-modal') {
      setMsgStudent(messageStudentId !== null ? String(messageStudentId) : 'all');
    }
  }, [openModal, messageStudentId]);

  const handleSendMessage = async () => {
    if (!msgContent.trim()) { onShowToast('Please write a message'); return; }
    setSending(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/admin/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ studentId: msgStudent, content: msgContent.trim(), type: msgType }),
      });
      if (!res.ok) throw new Error();
      setMsgContent('');
      onClose();
      onShowToast(msgStudent === 'all' ? 'Message sent to all students ✓' : 'Message sent to student dashboard ✓');
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
            <div className="fg"><label>Monthly Fee (₹)</label><input className="fi" type="number" placeholder="e.g. 15000" /></div>
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
              <option>Fee Reminder</option>
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

      {/* Record Payment */}
      <div className={`overlay${isOpen('fee-modal')}`} id="fee-modal" onClick={e => e.target.classList.contains('overlay') && onClose()}>
        <div className="modal">
          <div className="mt">Record a Payment</div>
          <div className="ms">Mark a fee as received and update the student's payment status.</div>
          <div className="fg"><label>Student</label>
            <select className="fi"><option>Priya Desai (₹14,000 overdue)</option><option>Vanya Rao (₹14,000 overdue)</option><option>Rahul Mehta</option></select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="fg"><label>Amount Received (₹)</label><input className="fi" type="number" placeholder="14000" /></div>
            <div className="fg"><label>Date Received</label><input className="fi" type="date" /></div>
          </div>
          <div className="fg"><label>Payment Mode</label>
            <select className="fi"><option>UPI / Bank Transfer</option><option>Cash</option><option>Cheque</option><option>Card</option></select>
          </div>
          <div className="fg"><label>Transaction Reference (optional)</label><input className="fi" type="text" placeholder="UPI ref or transaction ID" /></div>
          <div className="ma">
            <button className="btn btn-ghost btn-sm" onClick={onClose}>Cancel</button>
            <button className="btn btn-gold btn-sm" onClick={() => { onClose(); onShowToast('Payment recorded. Status updated to Paid ✓'); }}>Record Payment →</button>
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
              { label: 'View revenue & fees', on: false },
              { label: 'Record & manage payments', on: false },
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
              { label: 'View revenue & fees', on: false },
              { label: 'Record & manage payments', on: false },
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
      <div className={`overlay${isOpen('add-faculty-modal')}`} id="add-faculty-modal" onClick={e => e.target.classList.contains('overlay') && onClose()}>
        <div className="modal">
          <div className="mt">Add Faculty Member</div>
          <div className="ms">Keep cohort size intentionally small. Only add when there's genuine capacity.</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="fg"><label>Full Name</label><input className="fi" type="text" placeholder="Faculty name" /></div>
            <div className="fg"><label>Phone</label><input className="fi" type="tel" placeholder="+91 XXXXX XXXXX" /></div>
          </div>
          <div className="fg"><label>Specialisation</label><input className="fi" type="text" placeholder="e.g. JEE Advanced — Physics & Mathematics" /></div>
          <div className="fg"><label>Exams they can teach</label>
            <select className="fi" multiple style={{ height: '80px' }}><option>JEE Mains</option><option>JEE Advanced</option><option>NEET</option></select>
          </div>
          <div className="fg"><label>Max students (suggested)</label><input className="fi" type="number" defaultValue="10" max="15" /></div>
          <div className="ma">
            <button className="btn btn-ghost btn-sm" onClick={onClose}>Cancel</button>
            <button className="btn btn-gold btn-sm" onClick={() => { onClose(); onShowToast('Faculty added. Login credentials sent ✓'); }}>Add Faculty →</button>
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
