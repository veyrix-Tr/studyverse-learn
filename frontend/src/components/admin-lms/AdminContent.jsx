import { useState, useEffect } from 'react';

const chartData = [95, 112, 128, 142, 156, 184];
const chartMax = Math.max(...chartData);
const chartLabels = ['Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr'];

const RevenueChart = () => (
  <div className="rev-chart">
    {chartData.map((v, i) => {
      const h = Math.round((v / chartMax) * 118);
      const isLast = i === chartData.length - 1;
      return (
        <div key={i} className="rev-bar-wrap">
          <div className="rev-val">₹{v}K</div>
          <div className="rev-bar" style={{ height: `${h}px`, background: isLast ? 'var(--gold)' : 'var(--navy3)' }}></div>
        </div>
      );
    })}
  </div>
);

const getGreeting = () => { const h = new Date().getHours(); if (h < 12) return 'Good morning'; if (h < 17) return 'Good afternoon'; return 'Good evening'; };

const fmtWeekRange = (weekStartDate) => {
  const mon = new Date(weekStartDate + 'T00:00:00');
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  const fmt = (d) => d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  return `${fmt(mon)} – ${fmt(sun)}`;
};

const AdminContent = ({ activePage, onOpenModal, onNav, onShowToast, profile, students = [], onOpenMessage, isSuperAdmin, adminAccounts = [], onDeactivateAdmin, onReactivateAdmin, resources = [], onApproveResource, onDeclineResource, sentMessages = [], onSendMessage, parentReports = [], onApproveReport, onRejectReport, onSendReports, onApproveAllReports }) => {
  const firstName = profile?.name?.split(' ')[0] || 'there';
  const [studentsTab, setStudentsTab] = useState(0);
  const [approvalsTab, setApprovalsTab] = useState(0);
  const [platformToggles, setPlatformToggles] = useState([true, true, true, true, true, true, true]);
  const [decliningId, setDecliningId] = useState(null);
  const [declineReason, setDeclineReason] = useState('');
  const [msgTo, setMsgTo] = useState('all');
  const [msgType, setMsgType] = useState('Announcement');
  const [msgContent, setMsgContent] = useState('');
  const [msgSending, setMsgSending] = useState(false);
  const [reportsTab, setReportsTab] = useState(0);
  const [expandedReportId, setExpandedReportId] = useState(null);
  const [rejectingReportId, setRejectingReportId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [sendingReports, setSendingReports] = useState(false);

  const sendMessage = async () => {
    if (!msgContent.trim()) { onShowToast('Please write a message'); return; }
    setMsgSending(true);
    try {
      await onSendMessage(msgTo, msgType, msgContent);
      setMsgContent('');
      setMsgTo('all');
      setMsgType('Announcement');
    } catch {
      onShowToast('Failed to send message. Try again.');
    } finally {
      setMsgSending(false);
    }
  };

  const pendingResources = resources.filter(r => r.status === 'pending');
  const approvedResources = resources.filter(r => r.status === 'approved');
  const declinedResources = resources.filter(r => r.status === 'declined');

  useEffect(() => {
    if (!isSuperAdmin && (activePage === 'admins' || activePage === 'settings')) {
      onNav('dashboard');
    }
  }, [activePage, isSuperAdmin]);

  const pg = (id) => `page${activePage === id ? ' on' : ''}`;

  const togglePlatform = (i) => {
    setPlatformToggles(prev => { const n = [...prev]; n[i] = !n[i]; return n; });
  };


  const platformSettings = [
    { label: 'Free tier diagnostic enabled', desc: 'Students without enrollment can access the free diagnostic' },
    { label: 'New enrollments open', desc: 'Pipeline accepts new enquiries' },
    { label: 'Parent reports automated', desc: 'Send Sunday reports automatically when faculty marks "Ready"' },
    { label: 'Free tier habit tracker', desc: 'Non-enrolled students can access the habit tracker' },
  ];

  const approvalSettings = [
    { label: 'Faculty can assign tests', desc: 'Require admin approval before tests appear to students' },
    { label: 'Faculty can assign resources', desc: 'Require admin approval before resources appear' },
    { label: 'Weekly feedback visible to faculty', desc: 'Faculty can read weekly feedback submitted after each report' },
  ];

  return (
    <div className="content">

      {/* ══ DASHBOARD ══ */}
      <div className={pg('dashboard')} id="p-dashboard">
        <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.1em', fontWeight: '500', marginBottom: '4px' }}>{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div>
            <div style={{ fontFamily: 'var(--fs)', fontSize: '23px', fontWeight: '700' }}>{getGreeting()}, {firstName}.</div>
            <div style={{ fontSize: '13.5px', color: 'var(--text2)', marginTop: '3px' }}>
              <strong style={{ color: 'var(--gold)' }}>3 new enquiries</strong> · <strong style={{ color: 'var(--green)' }}>{pendingResources.length} approval{pendingResources.length !== 1 ? 's' : ''} pending</strong>
            </div>
          </div>
        </div>

        <div className="g4 mb">
          <div className="stat sa-navy"><div className="stat-l">Active Students</div><div className="stat-v">12</div><div className="stat-n up">↑ 2 this month</div></div>
          <div className="stat sa-gold"><div className="stat-l">Revenue (April)</div><div className="stat-v" style={{ fontSize: '22px' }}>₹1.84L</div><div className="stat-n up">↑ 18% vs March</div></div>
          <div className="stat sa-blue"><div className="stat-l">Premium Students</div><div className="stat-v">{students.filter(s => ['forge','apex','anchor'].includes(s.plan)).length}</div><div className="stat-n up">active subscriptions</div></div>
          <div className="stat sa-green"><div className="stat-l">Avg Improvement</div><div className="stat-v">+76</div><div className="stat-n up">marks across cohort</div></div>
        </div>

        <div className="g2 mb">
          <div className="card">
            <div className="sh"><div className="sh-t">Monthly Revenue</div><span className="sh-a" onClick={() => onNav('revenue')}>Full report →</span></div>
            <RevenueChart />
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 2px' }}>
              {chartLabels.map(l => <span key={l} style={{ fontSize: '10px', color: 'var(--text3)' }}>{l}</span>)}
            </div>
          </div>
          <div className="card">
            <div className="sh"><div className="sh-t">Enrollment Pipeline</div><span className="sh-a" onClick={() => onNav('pipeline')}>Full pipeline →</span></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                { label: 'Enquiry Received', count: 3, color: 'var(--text3)', btn: 'View →' },
                { label: 'Diagnostic Scheduled', count: 2, color: 'var(--blue)', btn: 'View →' },
                { label: 'Program Fit Review', count: 1, color: 'var(--orange)', btn: 'Review →' },
                { label: 'Active Students', count: 12, color: 'var(--green)', btn: null }
              ].map(({ label, count, color, btn }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 12px', background: 'var(--cream2)', borderRadius: 'var(--r)', borderLeft: `3px solid ${color}` }}>
                  <div style={{ fontSize: '13px', fontWeight: '500' }}>{label}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontFamily: 'var(--fs)', fontSize: '16px', fontWeight: '700' }}>{count}</span>
                    {btn && <button className="btn btn-ghost btn-sm" onClick={() => onNav('pipeline')}>{btn}</button>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="sh"><div className="sh-t">Pending Approvals</div><span className="sh-a" onClick={() => onNav('approvals')}>All approvals →</span></div>
        <div className="card mb" style={{ padding: '14px 18px' }}>
          {pendingResources.length === 0 ? (
            <div style={{ fontSize: '13px', color: 'var(--text3)', padding: '12px 0' }}>No pending approvals.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
              {pendingResources.slice(0, 3).map((r, i, arr) => (
                <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '11px 0', borderBottom: i < arr.length - 1 ? '1px solid var(--b)' : 'none' }}>
                  <div className="av">{r.facultyName?.charAt(0) || 'F'}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', fontWeight: '600' }}>{r.title}</div>
                    <div style={{ fontSize: '11.5px', color: 'var(--text3)' }}>By {r.facultyName} · {r.subject} · {new Date(r.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '7px' }}>
                    <button className="btn btn-green btn-sm" onClick={() => onApproveResource(r.id)}>Approve</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => onNav('approvals')}>Review</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ══ ENROLLMENT PIPELINE ══ */}
      <div className={pg('pipeline')} id="p-pipeline">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ fontSize: '13px', color: 'var(--text2)' }}>Every student starts with an enquiry. Only the right ones reach Active. <span style={{ color: 'var(--gold)', fontWeight: '600' }}>Meaningful guidance cannot exist at scale.</span></div>
          <button className="btn btn-gold btn-sm" onClick={() => onOpenModal('enroll-modal')}>+ New Enquiry</button>
        </div>

        <div className="pipeline">
          <div className="pipe-col stage-enquiry">
            <div className="pipe-header">
              <div className="pipe-title" style={{ color: 'var(--text3)' }}>Enquiry</div>
              <div className="pipe-count" style={{ background: 'rgba(15,31,61,0.07)', color: 'var(--text3)' }}>3</div>
            </div>
            <div className="pipe-cards">
              {[
                { name: 'Arjun Sharma', exam: 'JEE Mains 2026 · Delhi', date: 'Enquired Apr 15', msg: 'Diagnostic call scheduled for Arjun ✓' },
                { name: 'Meera Pillai', exam: 'NEET 2026 · Chennai', date: 'Enquired Apr 14', msg: 'Diagnostic call scheduled ✓' },
                { name: 'Rohan Tiwari', exam: 'JEE Advanced 2026 · Lucknow', date: 'Enquired Apr 13', msg: 'Diagnostic call scheduled ✓' }
              ].map(({ name, exam, date, msg }) => (
                <div key={name} className="pipe-card">
                  <div className="pc-name">{name}</div>
                  <div className="pc-exam">{exam}</div>
                  <div className="pc-date">{date}</div>
                  <div className="pc-action" style={{ background: 'var(--bdim)', color: 'var(--blue)' }} onClick={() => onShowToast(msg)}>Schedule Diagnostic →</div>
                </div>
              ))}
            </div>
          </div>

          <div className="pipe-col stage-diag">
            <div className="pipe-header">
              <div className="pipe-title" style={{ color: 'var(--blue)' }}>Diagnostic</div>
              <div className="pipe-count" style={{ background: 'var(--bdim)', color: 'var(--blue)' }}>2</div>
            </div>
            <div className="pipe-cards">
              {[
                { name: 'Ishaan Kapoor', exam: 'JEE Mains 2026 · Mumbai', date: 'Call: Apr 17, 3PM' },
                { name: 'Tanvi Nair', exam: 'NEET 2026 · Bangalore', date: 'Call: Apr 18, 11AM' }
              ].map(({ name, exam, date }) => (
                <div key={name} className="pipe-card">
                  <div className="pc-name">{name}</div>
                  <div className="pc-exam">{exam}</div>
                  <div className="pc-date">{date}</div>
                  <div className="pc-action" style={{ background: 'var(--gdim)', color: 'var(--green)' }} onClick={() => onShowToast('Moved to Fit Review ✓')}>Mark Done → Fit Review</div>
                </div>
              ))}
            </div>
          </div>

          <div className="pipe-col stage-fit">
            <div className="pipe-header">
              <div className="pipe-title" style={{ color: 'var(--orange)' }}>Fit Review</div>
              <div className="pipe-count" style={{ background: 'var(--odim)', color: 'var(--orange)' }}>1</div>
            </div>
            <div className="pipe-cards">
              <div className="pipe-card" style={{ borderColor: 'var(--orange)' }}>
                <div className="pc-name">Devika Rao</div>
                <div className="pc-exam">JEE Mains 2026 · Hyderabad</div>
                <div className="pc-date">Diagnostic done Apr 12</div>
                <div style={{ fontSize: '11px', color: 'var(--text2)', margin: '6px 0 4px', lineHeight: '1.5' }}>Score gap: 180 marks. Commitment: high. Fit: strong.</div>
                <div style={{ display: 'flex', gap: '5px' }}>
                  <div className="pc-action" style={{ flex: 1, background: 'var(--gdim)', color: 'var(--green)', fontSize: '10.5px' }} onClick={() => onShowToast('Devika enrolled. Assign faculty next. ✓')}>Enroll ✓</div>
                  <div className="pc-action" style={{ flex: 1, background: 'var(--rdim)', color: 'var(--red)', fontSize: '10.5px' }} onClick={() => onShowToast('Declined with explanation sent.')}>Decline</div>
                </div>
              </div>
            </div>
          </div>

          <div className="pipe-col stage-enrolled">
            <div className="pipe-header">
              <div className="pipe-title" style={{ color: 'var(--gold)' }}>Enrolled</div>
              <div className="pipe-count" style={{ background: 'var(--gd)', color: 'var(--gold)' }}>2</div>
            </div>
            <div className="pipe-cards">
              <div className="pipe-card">
                <div className="pc-name">Vanya Rao</div>
                <div className="pc-exam">JEE Mains 2026</div>
                <div className="pc-date">Enrolled Apr 10 · Wk 1</div>
                <div className="pc-action" style={{ background: 'var(--gd)', color: 'var(--gold)' }} onClick={() => onNav('assign')}>Assign Faculty →</div>
              </div>
              <div className="pipe-card">
                <div className="pc-name">Siddharth Jain</div>
                <div className="pc-exam">JEE Mains 2026</div>
                <div className="pc-date">Enrolled Apr 8 · Wk 2</div>
                <div className="pc-action" style={{ background: 'var(--gdim)', color: 'var(--green)', fontSize: '10.5px' }}>Faculty: Ajay ✓</div>
              </div>
            </div>
          </div>

          <div className="pipe-col stage-active">
            <div className="pipe-header">
              <div className="pipe-title" style={{ color: 'var(--green)' }}>Active</div>
              <div className="pipe-count" style={{ background: 'var(--gdim)', color: 'var(--green)' }}>12</div>
            </div>
            <div className="pipe-cards">
              {[
                { name: 'Rahul Mehta', detail: 'JEE • Wk 9 • Ajay', score: '388 → 462 (+74)' },
                { name: 'Sneha Kapoor', detail: 'JEE • Wk 11 • Ajay', score: '420 → 511 (+91)' },
                { name: 'Priya Desai', detail: 'NEET • Wk 7 • Ajay', score: '350 → 418 (+68)' },
                { name: 'Kavya Menon', detail: 'NEET • Wk 12 • Ajay', score: '440 → 548 (+108)' }
              ].map(({ name, detail, score }) => (
                <div key={name} className="pipe-card">
                  <div className="pc-name">{name}</div>
                  <div className="pc-exam">{detail}</div>
                  <div style={{ fontSize: '11px', color: 'var(--green)', marginTop: '4px' }}>{score}</div>
                </div>
              ))}
              <div style={{ fontSize: '11px', color: 'var(--text3)', textAlign: 'center', padding: '8px 0' }}>+8 more active students</div>
            </div>
          </div>
        </div>
      </div>

      {/* ══ REVENUE & FEES ══ */}
      <div className={pg('revenue')} id="p-revenue">
        <div className="g4 mb">
          <div className="stat sa-gold"><div className="stat-l">Total Revenue (YTD)</div><div className="stat-v" style={{ fontSize: '22px' }}>₹14.2L</div><div className="stat-n up">↑ 34% vs last year</div></div>
          <div className="stat sa-green"><div className="stat-l">April Collected</div><div className="stat-v" style={{ fontSize: '22px' }}>₹1.56L</div><div className="stat-n up">85% of target</div></div>
          <div className="stat sa-blue"><div className="stat-l">Premium Subscribers</div><div className="stat-v" style={{ fontSize: '22px' }}>{students.filter(s => ['forge','apex','anchor'].includes(s.plan)).length}</div><div className="stat-n up">active this month</div></div>
          <div className="stat sa-navy"><div className="stat-l">Avg Revenue/Student</div><div className="stat-v" style={{ fontSize: '22px' }}>₹15.3K</div><div className="stat-n neu">per month</div></div>
        </div>

        <div className="g2 mb">
          <div className="card">
            <div className="sh"><div className="sh-t">Revenue — Last 6 Months</div></div>
            <RevenueChart />
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 2px' }}>
              {chartLabels.map(l => <span key={l} style={{ fontSize: '10px', color: 'var(--text3)' }}>{l}</span>)}
            </div>
            <div style={{ display: 'flex', gap: '16px', marginTop: '14px', borderTop: '1px solid var(--b)', paddingTop: '12px' }}>
              <div style={{ textAlign: 'center', flex: 1 }}><div style={{ fontFamily: 'var(--fs)', fontSize: '16px', fontWeight: '700', color: 'var(--text)' }}>₹1.84L</div><div style={{ fontSize: '10.5px', color: 'var(--text3)' }}>Apr target</div></div>
              <div style={{ textAlign: 'center', flex: 1 }}><div style={{ fontFamily: 'var(--fs)', fontSize: '16px', fontWeight: '700', color: 'var(--green)' }}>₹1.56L</div><div style={{ fontSize: '10.5px', color: 'var(--text3)' }}>Collected</div></div>
              <div style={{ textAlign: 'center', flex: 1 }}><div style={{ fontFamily: 'var(--fs)', fontSize: '16px', fontWeight: '700', color: 'var(--blue)' }}>{students.filter(s => ['forge','apex','anchor'].includes(s.plan)).length}</div><div style={{ fontSize: '10.5px', color: 'var(--text3)' }}>Premium Active</div></div>
            </div>
          </div>
          <div className="card">
            <div className="sh"><div className="sh-t">Revenue by Plan</div></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { label: 'Full Program (1-to-1)', value: '₹1.12L', width: '72%', barClass: 'pb-gold', sub: '8 students · ₹14,000/mo avg' },
                { label: 'Unlock Plan', value: '₹32K', width: '21%', barClass: 'pb-navy', sub: '4 students · ₹8,000/mo avg' },
                { label: 'Single Sessions', value: '₹12K', width: '8%', barClass: 'pb-green', sub: '6 sessions booked' }
              ].map(({ label, value, width, barClass, sub }) => (
                <div key={label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', marginBottom: '5px' }}>
                    <span style={{ fontWeight: '500' }}>{label}</span><span style={{ fontWeight: '700', color: 'var(--text)' }}>{value}</span>
                  </div>
                  <div className="pbar" style={{ height: '8px' }}><div className={`pbar-inner ${barClass}`} style={{ width }}></div></div>
                  <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '3px' }}>{sub}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="sh"><div className="sh-t">Student Subscriptions</div></div>
        <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
          <table className="tbl">
            <thead><tr><th>Student</th><th>Exam</th><th>Grade</th><th>Subscription</th></tr></thead>
            <tbody>
              {students.length === 0 ? (
                <tr><td colSpan={4} style={{ textAlign: 'center', padding: '20px', color: 'var(--text3)', fontSize: '13px' }}>No students enrolled.</td></tr>
              ) : students.map(s => (
                <tr key={s.id}>
                  <td><div className="av-row"><div className="av">{s.name.charAt(0)}</div>{s.name}</div></td>
                  <td>{s.examTarget || '—'}</td>
                  <td>{s.grade ? `Grade ${s.grade}` : '—'}</td>
                  <td><span className={`fc-status ${['forge','apex','anchor'].includes(s.plan) ? 'paid' : ''}`}>{['forge','apex','anchor'].includes(s.plan) ? (s.plan.charAt(0).toUpperCase() + s.plan.slice(1)) + ' ✓' : 'Spark (Free)'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ══ STUDENTS ══ */}
      <div className={pg('students')} id="p-students">
        {(() => {
          const premium  = students.filter(s => ['forge','apex','anchor'].includes(s.plan));
          const free     = students.filter(s => !['forge','apex','anchor'].includes(s.plan));
          const premJee  = premium.filter(s => s.examTarget?.toLowerCase().includes('jee'));
          const premNeet = premium.filter(s => s.examTarget?.toLowerCase().includes('neet'));

          // tab 0=All(premium) 1=JEE 2=NEET 3=Free Tier
          const rows = studentsTab === 1 ? premJee : studentsTab === 2 ? premNeet : studentsTab === 3 ? free : premium;

          const tabs = [
            { label: `All (${premium.length})`, i: 0 },
            { label: `JEE (${premJee.length})`,  i: 1 },
            { label: `NEET (${premNeet.length})`, i: 2 },
            { label: `Free Tier (${free.length})`, i: 3, gold: true },
          ];

          const isFreeTab = studentsTab === 3;

          const PremiumRow = ({ s }) => {
            const av = s.name?.[0]?.toUpperCase() || '?';
            const examClass = s.examTarget?.includes('NEET') ? 'pp' : 'pn';
            const hasScores = Number.isFinite(s.lastScore) && Number.isFinite(s.lastTotalMarks) && s.lastTotalMarks > 0;
            const mentorAv = s.facultyName?.[0]?.toUpperCase() || '?';
            return (
              <tr>
                <td><div className="av-row"><div className="av">{av}</div>{s.name}</div></td>
                <td><span className={`pill ${examClass}`}>{s.examTarget || '—'}</span></td>
                <td>
                  {s.facultyName
                    ? <div className="av-row"><div className="av" style={{ background: 'transparent', borderColor: 'var(--text3)', color: 'var(--text3)' }}>{mentorAv}</div>{s.facultyName}</div>
                    : <span style={{ color: 'var(--text3)', fontSize: '12px' }}>Unassigned</span>}
                </td>
                <td>
                  {hasScores
                    ? <span style={{ fontFamily: 'var(--fs)', color: 'var(--gold)', fontWeight: '700' }}>{s.lastScore}<span style={{ color: 'var(--text3)', fontWeight: '400' }}>/{s.lastTotalMarks}</span></span>
                    : <span style={{ color: 'var(--text3)', fontSize: '12px' }}>No scores yet</span>}
                </td>
                <td><button className="btn btn-ghost btn-sm" onClick={() => onOpenMessage(s.id)}>Message</button></td>
              </tr>
            );
          };

          const FreeRow = ({ s }) => {
            const av = s.name?.[0]?.toUpperCase() || '?';
            const examClass = s.examTarget?.includes('NEET') ? 'pp' : 'pn';
            const diagDone = s.diagnosticScore !== null && s.diagnosticScore !== undefined;
            const diagDate = s.diagnosticTakenAt
              ? new Date(s.diagnosticTakenAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })
              : null;
            return (
              <tr>
                <td><div className="av-row"><div className="av">{av}</div>{s.name}</div></td>
                <td><span className={`pill ${examClass}`}>{s.examTarget || '—'}</span></td>
                <td style={{ color: 'var(--text2)', fontSize: '13px' }}>{s.grade || '—'}</td>
                <td>
                  {diagDone
                    ? <div>
                        <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--green)' }}>Done — {s.diagnosticScore}%</span>
                        {diagDate && <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '2px' }}>{diagDate}</div>}
                      </div>
                    : <span style={{ fontSize: '12px', color: 'var(--text3)' }}>Pending</span>}
                </td>
                <td><button className="btn btn-ghost btn-sm" onClick={() => onOpenMessage(s.id)}>Message</button></td>
              </tr>
            );
          };

          return (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
                <div className="tabs" style={{ marginBottom: '0' }}>
                  {tabs.map(({ label, i, gold }) => (
                    <div key={i}
                      className={`tab${studentsTab === i ? ' on' : ''}`}
                      style={gold ? {
                        color: 'var(--black)',
                        background: studentsTab === i ? 'rgb(252, 210, 80)' : 'rgb(252, 238, 180)',
                        borderColor: studentsTab === i ? 'rgb(252, 210, 80)' : 'rgb(252, 238, 180)',
                        borderWidth: '1px',
                        borderStyle: 'solid',
                        borderRadius: 'var(--r)',
                      } : studentsTab === i ? {
                        background: 'var(--blue)',
                        color: '#fff',
                      } : {}}
                      onClick={() => setStudentsTab(i)}
                    >{label}</div>
                  ))}
                </div>
                <button className="btn btn-gold btn-sm" onClick={() => onOpenModal('enroll-modal')}>+ Enroll Student</button>
              </div>
              <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
                <table className="tbl">
                  <thead>
                    {isFreeTab
                      ? <tr><th>Student</th><th>Exam</th><th>Grade</th><th>Diagnostic</th><th>Actions</th></tr>
                      : <tr><th>Student</th><th>Exam</th><th>Mentor</th><th>Score Progress</th><th>Actions</th></tr>}
                  </thead>
                  <tbody>
                    {rows.length === 0
                      ? <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--text3)', padding: '24px' }}>No students found.</td></tr>
                      : rows.map(s => isFreeTab ? <FreeRow key={s.id} s={s} /> : <PremiumRow key={s.id} s={s} />)}
                  </tbody>
                </table>
              </div>
            </>
          );
        })()}
      </div>

      {/* ══ FACULTY ══ */}
      <div className={pg('faculty')} id="p-faculty">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ fontSize: '13px', color: 'var(--text2)' }}>3 active faculty members</div>
          <button className="btn btn-gold btn-sm" onClick={() => onOpenModal('add-faculty-modal')}>+ Add Faculty</button>
        </div>
        <div className="g3 mb">
          <div className="card" style={{ transition: 'all .2s' }}
            onMouseOver={e => e.currentTarget.style.borderColor = 'var(--gold)'}
            onMouseOut={e => e.currentTarget.style.borderColor = 'var(--b)'}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
              <div className="av av-lg" style={{ borderColor: 'var(--gold)', color: 'var(--gold)', background: 'var(--gd)' }}>A</div>
              <div><div style={{ fontSize: '15px', fontWeight: '700', fontFamily: 'var(--fs)' }}>Ajay Sharma</div><div style={{ fontSize: '11.5px', color: 'var(--text3)' }}>JEE & NEET • Head Faculty</div></div>
            </div>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '12px' }}>
              <span className="pill pg">JEE Mains</span><span className="pill pg">JEE Advanced</span><span className="pill pp">NEET</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '12px' }}>
              {[{ val: '8', lbl: 'Students' }, { val: '11', lbl: 'Sessions/wk' }, { val: '+82', lbl: 'Avg gain', gold: true }].map(({ val, lbl, gold }) => (
                <div key={lbl} style={{ textAlign: 'center', padding: '8px', background: 'var(--cream2)', borderRadius: 'var(--r)' }}>
                  <div style={{ fontFamily: 'var(--fs)', fontSize: '18px', fontWeight: '700', color: gold ? 'var(--gold)' : undefined }}>{val}</div>
                  <div style={{ fontSize: '10.5px', color: 'var(--text3)' }}>{lbl}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '7px' }}>
              <button className="btn btn-ghost btn-sm" style={{ flex: 1, justifyContent: 'center' }} onClick={() => onOpenModal('assign-modal')}>Assign Student</button>
              <button className="btn btn-gold btn-sm" style={{ flex: 1, justifyContent: 'center' }} onClick={() => onOpenModal('message-modal')}>Message</button>
            </div>
          </div>

          <div className="card" style={{ transition: 'all .2s', opacity: '.7' }}
            onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--gold)'; e.currentTarget.style.opacity = '1'; }}
            onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--b)'; e.currentTarget.style.opacity = '.7'; }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
              <div className="av av-lg" style={{ color: 'var(--blue)', borderColor: 'var(--blue)', background: 'var(--bdim)' }}>N</div>
              <div><div style={{ fontSize: '15px', fontWeight: '700', fontFamily: 'var(--fs)' }}>Neha Gupta</div><div style={{ fontSize: '11.5px', color: 'var(--text3)' }}>Biology & Chemistry · NEET</div></div>
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
              <span className="pill pp">NEET Biology</span><span className="pill pg">Organic Chem</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '12px' }}>
              {[{ val: '3', lbl: 'Students' }, { val: '5', lbl: 'Sessions/wk' }, { val: '+64', lbl: 'Avg gain', gold: true }].map(({ val, lbl, gold }) => (
                <div key={lbl} style={{ textAlign: 'center', padding: '8px', background: 'var(--cream2)', borderRadius: 'var(--r)' }}>
                  <div style={{ fontFamily: 'var(--fs)', fontSize: '18px', fontWeight: '700', color: gold ? 'var(--gold)' : undefined }}>{val}</div>
                  <div style={{ fontSize: '10.5px', color: 'var(--text3)' }}>{lbl}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '7px' }}>
              <button className="btn btn-ghost btn-sm" style={{ flex: 1, justifyContent: 'center' }} onClick={() => onOpenModal('assign-modal')}>Assign Student</button>
              <button className="btn btn-gold btn-sm" style={{ flex: 1, justifyContent: 'center' }} onClick={() => onOpenModal('message-modal')}>Message</button>
            </div>
          </div>

          <div className="card" style={{ border: '1px dashed var(--b)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', minHeight: '220px', cursor: 'pointer', transition: 'all .2s' }}
            onMouseOver={e => e.currentTarget.style.borderColor = 'var(--gold)'}
            onMouseOut={e => e.currentTarget.style.borderColor = 'var(--b)'}
            onClick={() => onOpenModal('add-faculty-modal')}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--cream2)', border: '1.5px dashed var(--b)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', color: 'var(--text3)' }}>+</div>
            <div style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text3)', textAlign: 'center' }}>Add a Faculty Member</div>
            <div style={{ fontSize: '12px', color: 'var(--text3)', textAlign: 'center', maxWidth: '160px', lineHeight: '1.6' }}>Keep cohort size intentionally small per faculty</div>
          </div>
        </div>
      </div>

      {/* ══ ASSIGN FACULTY ══ */}
      <div className={pg('assign')} id="p-assign">
        <div style={{ fontSize: '13px', color: 'var(--text2)', marginBottom: '20px', background: 'var(--cream)', border: '1px solid var(--b)', padding: '12px 16px', borderRadius: 'var(--r)', borderLeft: '3px solid var(--gold)' }}>
          Each student has one dedicated faculty. Reassignment disrupts continuity — only reassign if necessary, and communicate the reason to the student and parent.
        </div>

        <div className="sh"><div className="sh-t">Current Assignments</div></div>
        <div className="card mb" style={{ padding: '0', overflow: 'hidden' }}>
          <table className="tbl">
            <thead><tr><th>Student</th><th>Exam</th><th>Current Faculty</th><th>Since</th><th>Sessions</th><th>Change?</th></tr></thead>
            <tbody>
              <tr key="rahul"><td><div className="av-row"><div className="av">R</div>Rahul Mehta</div></td><td>JEE Mains</td><td><div className="av-row"><div className="av" style={{ color: 'var(--text2)', borderColor: 'var(--text3)', background: 'transparent', fontSize: '11px' }}>A</div>Ajay Sharma</div></td><td>Jan 28</td><td>47 sessions</td><td><button className="btn btn-ghost btn-sm" onClick={() => onOpenModal('assign-modal')}>Reassign</button></td></tr>
              <tr key="sneha"><td><div className="av-row"><div className="av">S</div>Sneha Kapoor</div></td><td>JEE Mains</td><td><div className="av-row"><div className="av" style={{ color: 'var(--text2)', borderColor: 'var(--text3)', background: 'transparent', fontSize: '11px' }}>A</div>Ajay Sharma</div></td><td>Feb 2</td><td>52 sessions</td><td><button className="btn btn-ghost btn-sm" onClick={() => onOpenModal('assign-modal')}>Reassign</button></td></tr>
              <tr key="priya"><td><div className="av-row"><div className="av">P</div>Priya Desai</div></td><td>NEET</td><td><div className="av-row"><div className="av" style={{ color: 'var(--text2)', borderColor: 'var(--text3)', background: 'transparent', fontSize: '11px' }}>A</div>Ajay Sharma</div></td><td>Feb 20</td><td>31 sessions</td><td><button className="btn btn-ghost btn-sm" onClick={() => onOpenModal('assign-modal')}>Reassign</button></td></tr>
              <tr key="vanya" style={{ background: 'rgba(232,168,48,0.04)' }}><td><div className="av-row"><div className="av">V</div>Vanya Rao</div></td><td>JEE Mains</td><td><span style={{ fontSize: '12px', color: 'var(--orange)', fontWeight: '500' }}>⚠ Not assigned yet</span></td><td>Apr 10</td><td>0 sessions</td><td><button className="btn btn-gold btn-sm" onClick={() => onOpenModal('assign-modal')}>Assign Now →</button></td></tr>
            </tbody>
          </table>
        </div>

        <div className="sh"><div className="sh-t">Faculty Workload</div><span style={{ fontSize: '12px', color: 'var(--text3)' }}>Keep below 10 students per faculty for quality</span></div>
        <div className="g2">
          {[
            { av: 'A', name: 'Ajay Sharma', role: 'JEE & NEET Faculty', pillClass: 'pg', pillLabel: '8 / 10', barClass: 'pb-gold', width: '80%', note: '80% capacity · 2 slots remaining before overload risk', avStyle: {} },
            { av: 'N', name: 'Neha Gupta', role: 'Biology & Chemistry', pillClass: 'pp', pillLabel: '3 / 10', barClass: 'pb-green', width: '30%', note: '30% capacity · Has availability for 7 more students', avStyle: { color: 'var(--blue)', borderColor: 'var(--blue)', background: 'var(--bdim)' } }
          ].map(({ av, name, role, pillClass, pillLabel, barClass, width, note, avStyle }) => (
            <div key={name} className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <div className="av av-lg" style={avStyle}>{av}</div>
                <div><div style={{ fontWeight: '600', fontSize: '14px' }}>{name}</div><div style={{ fontSize: '11.5px', color: 'var(--text3)' }}>{role}</div></div>
                <span className={`pill ${pillClass}`} style={{ marginLeft: 'auto' }}>{pillLabel}</span>
              </div>
              <div className="pbar" style={{ height: '8px', marginBottom: '8px' }}><div className={`pbar-inner ${barClass}`} style={{ width }}></div></div>
              <div style={{ fontSize: '11.5px', color: 'var(--text3)' }}>{note}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ══ APPROVALS ══ */}
      <div className={pg('approvals')} id="p-approvals">
        <div className="tabs">
          {[`Pending (${pendingResources.length})`, `Approved (${approvedResources.length})`, `Declined (${declinedResources.length})`].map((label, i) => (
            <div key={i} className={`tab${approvalsTab === i ? ' on' : ''}`} onClick={() => setApprovalsTab(i)}>{label}</div>
          ))}
        </div>
        {(() => {
          const list = approvalsTab === 0 ? pendingResources : approvalsTab === 1 ? approvedResources : declinedResources;
          if (list.length === 0) return (
            <div style={{ fontSize: '13px', color: 'var(--text3)', padding: '32px 0', textAlign: 'center' }}>
              {approvalsTab === 0 ? 'No pending resources.' : approvalsTab === 1 ? 'No approved resources yet.' : 'No declined resources.'}
            </div>
          );
          return list.map(item => (
            <div key={item.id} className="approval-item">
              <div className="ai-top">
                <div>
                  <div className="ai-title">{item.title}</div>
                  <div className="ai-meta">
                    {item.facultyName} · {new Date(item.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} · {item.type} · {item.subject} · Grade {item.grade}
                  </div>
                </div>
                <span className="pill pb">Resource</span>
              </div>
              {item.cloudinaryUrl && (
                <a
                  href={`${import.meta.env.VITE_API_URL}/api/files/proxy?url=${encodeURIComponent(item.cloudinaryUrl)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-ghost btn-sm"
                  style={{ display: 'inline-block', marginBottom: '12px' }}
                >↓ View / Download</a>
              )}
              {item.status === 'declined' && item.declineReason && (
                <div style={{ fontSize: '12.5px', color: 'rgba(239,68,68,0.8)', marginBottom: '8px' }}>Reason: {item.declineReason}</div>
              )}
              {item.status === 'pending' && (
                <div className="ai-actions">
                  {decliningId === item.id ? (
                    <>
                      <input className="fi" style={{ flex: 1, padding: '6px 10px', fontSize: '13px' }} placeholder="Reason for declining (optional)" value={declineReason} onChange={e => setDeclineReason(e.target.value)} />
                      <button className="btn btn-red btn-sm" onClick={() => { onDeclineResource(item.id, declineReason); setDecliningId(null); setDeclineReason(''); }}>Confirm Decline</button>
                      <button className="btn btn-ghost btn-sm" onClick={() => { setDecliningId(null); setDeclineReason(''); }}>Cancel</button>
                    </>
                  ) : (
                    <>
                      <button className="btn btn-green btn-sm" onClick={() => onApproveResource(item.id)}>Approve</button>
                      <button className="btn btn-red btn-sm" onClick={() => setDecliningId(item.id)}>Decline</button>
                    </>
                  )}
                </div>
              )}
            </div>
          ));
        })()}
      </div>

      {/* ══ MESSAGES ══ */}
      <div className={pg('messages')} id="p-messages">
        <div className="msg-compose mb">
          <div className="sh"><div className="sh-t">Compose Message</div><span style={{ fontSize: '12px', color: 'var(--text3)' }}>Appears on student's dashboard immediately</span></div>
          <div className="fg" style={{ marginBottom: '12px' }}>
            <label>Send to</label>
            <select className="fi" value={msgTo} onChange={e => setMsgTo(e.target.value)}>
              <option value="all">All Students</option>
              {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="fg" style={{ marginBottom: '12px' }}>
            <label>Message Type</label>
            <select className="fi" value={msgType} onChange={e => setMsgType(e.target.value)}>
              <option>Announcement</option>
              <option>Reminder</option>
              <option>Motivational Note</option>
              <option>Schedule Update</option>
            </select>
          </div>
          <div className="fg" style={{ marginBottom: '12px' }}>
            <label>Message</label>
            <textarea className="fi" rows="4" placeholder="Write your message — it will appear as a notification on the student's dashboard..." value={msgContent} onChange={e => setMsgContent(e.target.value)}></textarea>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '9px' }}>
            <button className="btn btn-gold btn-sm" disabled={msgSending} onClick={sendMessage}>{msgSending ? 'Sending…' : 'Send Now →'}</button>
          </div>
        </div>

        <div className="sh"><div className="sh-t">Sent Messages</div></div>
        <div className="card" style={{ padding: '14px 18px' }}>
          {sentMessages.length === 0 ? (
            <div style={{ fontSize: '13px', color: 'var(--text3)', padding: '12px 0' }}>No messages sent yet.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
              {sentMessages.map((m, i, arr) => (
                <div key={m.id} style={{ padding: '12px 0', borderBottom: i < arr.length - 1 ? '1px solid var(--b)' : 'none' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                    <div style={{ fontSize: '13px', fontWeight: '600' }}>{m.type}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text3)' }}>{new Date(m.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} · {m.recipient}</div>
                  </div>
                  <div style={{ fontSize: '12.5px', color: 'var(--text2)' }}>{m.content}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ══ ADMIN ACCOUNTS (SUPER ONLY) ══ */}
      <div className={pg(isSuperAdmin ? 'admins' : '__never__')} id="p-admins">
        <div style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.25)', borderRadius: 'var(--rl)', padding: '14px 18px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          <div style={{ fontSize: '13px', color: '#5b21b6', fontWeight: '500' }}>Super Admin view only. You can create admins, toggle their permissions, and deactivate accounts.</div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <div className="sh-t">Admin Accounts</div>
          <button className="btn btn-purple btn-sm" onClick={() => onOpenModal('add-admin-modal')}>+ Create Admin</button>
        </div>

        {adminAccounts.length === 0 ? (
          <div style={{ color: 'var(--text3)', fontSize: '13px', padding: '24px 0' }}>No admin accounts found.</div>
        ) : (
          <div className="g2 mb">
            {adminAccounts.map((admin) => {
              const initial = admin.name.charAt(0).toUpperCase();
              const since = new Date(admin.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
              const dept = admin.adminProfile?.department || 'Admin';
              const active = admin.adminProfile?.isActive !== false;
              return (
                <div key={admin.id} className="admin-card" style={active ? {} : { opacity: 0.7 }}>
                  <div className="ac-header">
                    <div className="av av-lg" style={active
                      ? { color: 'var(--gold)', borderColor: 'var(--gold)' }
                      : { color: 'var(--text3)', borderColor: 'var(--b)' }
                    }>{initial}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: active ? 'var(--text)' : 'var(--text3)' }}>{admin.name}</div>
                      <div className="ac-meta">{dept} · Active since {since}</div>
                      <div style={{ fontSize: '11.5px', color: 'var(--text3)', marginTop: '2px' }}>{admin.email}</div>
                    </div>
                    {active
                      ? <span className="pill pp">Active</span>
                      : <span className="pill" style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}>Deactivated</span>
                    }
                  </div>
                  <div style={{ display: 'flex', gap: '7px', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--b)' }}>
                    {active ? (
                      <>
                        <button className="btn btn-ghost btn-sm" style={{ flex: 1, justifyContent: 'center' }} onClick={() => onShowToast('Permission editing coming soon')}>Edit Permissions</button>
                        <button className="btn btn-red btn-sm" onClick={() => onDeactivateAdmin(admin.id)}>Deactivate</button>
                      </>
                    ) : (
                      <button className="btn btn-sm" style={{ flex: 1, justifyContent: 'center', background: 'rgba(34,197,94,0.15)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.3)' }} onClick={() => onReactivateAdmin(admin.id)}>Reactivate</button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ══ PLATFORM SETTINGS (SUPER ONLY) ══ */}
      <div className={pg(isSuperAdmin ? 'settings' : '__never__')} id="p-settings">
        <div style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.25)', borderRadius: 'var(--rl)', padding: '14px 18px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          <div style={{ fontSize: '13px', color: '#5b21b6', fontWeight: '500' }}>Platform-level settings. Changes apply across all dashboards immediately.</div>
        </div>

        <div className="g2">
          <div>
            <div className="card mb">
              <div className="sh-t" style={{ marginBottom: '14px' }}>Platform Controls</div>
              {platformSettings.map(({ label, desc }, i) => (
                <div key={i} className="perm-row" style={i === platformSettings.length - 1 ? { border: 'none' } : {}}>
                  <div><div className="perm-label">{label}</div><div className="perm-desc">{desc}</div></div>
                  <div className={`toggle${platformToggles[i] ? ' on' : ''}`} onClick={() => togglePlatform(i)}></div>
                </div>
              ))}
            </div>
            <div className="card">
              <div className="sh-t" style={{ marginBottom: '14px' }}>Cohort Limits</div>
              <div className="perm-row"><div><div className="perm-label">Max students per faculty</div><div className="perm-desc">Warn admin when a faculty exceeds this</div></div><div style={{ fontFamily: 'var(--fs)', fontSize: '18px', fontWeight: '700', color: 'var(--gold)' }}>10</div></div>
              <div className="perm-row" style={{ border: 'none' }}><div><div className="perm-label">Max total active enrollments</div><div className="perm-desc">Platform alert when this threshold is reached</div></div><div style={{ fontFamily: 'var(--fs)', fontSize: '18px', fontWeight: '700', color: 'var(--gold)' }}>30</div></div>
            </div>
          </div>
          <div>
            <div className="card mb">
              <div className="sh-t" style={{ marginBottom: '14px' }}>Approval Workflow</div>
              {approvalSettings.map(({ label, desc }, i) => (
                <div key={i} className="perm-row" style={i === approvalSettings.length - 1 ? { border: 'none' } : {}}>
                  <div><div className="perm-label">{label}</div><div className="perm-desc">{desc}</div></div>
                  <div className={`toggle${platformToggles[4 + i] ? ' on' : ''}`} onClick={() => togglePlatform(4 + i)}></div>
                </div>
              ))}
            </div>
            <div className="card">
              <div className="sh-t" style={{ marginBottom: '14px' }}>Super Admin Access Log</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                {[
                  { actor: 'Vinay', action: 'approved 2 resources', when: '2h ago' },
                  { actor: 'Vinay', action: "updated Meera's permissions", when: 'Apr 13' },
                  { actor: 'Vinay', action: 'created admin: Sanjay Pillai', when: 'Feb 3' }
                ].map(({ actor, action, when }, i, arr) => (
                  <div key={i} style={{ padding: '9px 0', borderBottom: i < arr.length - 1 ? '1px solid var(--b)' : 'none', fontSize: '12.5px' }}>
                    <span style={{ color: 'var(--text)' }}>{actor}</span>{' '}
                    <span style={{ color: 'var(--text3)' }}>{action}</span>
                    <span style={{ color: 'var(--text3)', marginLeft: 'auto', float: 'right', fontSize: '11px' }}>{when}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════ PARENT REPORTS ══════════ */}
      <div className={pg('reports')}>
        {(() => {
          const submittedReports = parentReports.filter(r => r.status === 'submitted');
          const approvedReports  = parentReports.filter(r => r.status === 'approved');
          const shown = reportsTab === 0 ? submittedReports : reportsTab === 1 ? approvedReports : parentReports;
          const statusPill = {
            submitted: <span className="pill po">Pending Review</span>,
            approved:  <span className="pill pp">Approved ✓</span>,
            rejected:  <span className="pill pr">Rejected</span>,
            sent:      <span className="pill" style={{ background: 'rgba(15,31,61,0.07)', color: 'var(--navy)' }}>Sent ✓</span>,
          };

          return (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
                <div className="tabs" style={{ marginBottom: 0 }}>
                  {[`Pending Review (${submittedReports.length})`, `Approved (${approvedReports.length})`, `All (${parentReports.length})`].map((t, i) => (
                    <div key={i} className={`tab${reportsTab === i ? ' on' : ''}`} onClick={() => { setReportsTab(i); setExpandedReportId(null); setRejectingReportId(null); }}>{t}</div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {submittedReports.length > 0 && (
                    <button className="btn btn-green btn-sm" disabled={sendingReports} onClick={async () => { setSendingReports(true); await onApproveAllReports?.(); setSendingReports(false); }}>
                      {sendingReports ? 'Approving…' : `Approve All (${submittedReports.length})`}
                    </button>
                  )}
                  {approvedReports.length > 0 && (
                    <button className="btn btn-gold btn-sm" disabled={sendingReports} onClick={async () => { setSendingReports(true); await onSendReports?.(); setSendingReports(false); }}>
                      {sendingReports ? 'Sending…' : `Send All Approved (${approvedReports.length}) ✓`}
                    </button>
                  )}
                </div>
              </div>

              {shown.length === 0 ? (
                <div style={{ fontSize: '13px', color: 'var(--text3)', padding: '32px 0', textAlign: 'center' }}>
                  {reportsTab === 0 ? 'No reports pending review.' : reportsTab === 1 ? 'No approved reports yet.' : 'No reports submitted yet.'}
                </div>
              ) : shown.map(r => {
                const isExpanded = expandedReportId === r.id;
                const isRejecting = rejectingReportId === r.id;
                return (
                  <div key={r.id} className="approval-item">
                    {/* Header row */}
                    <div className="ai-top" style={{ alignItems: 'center' }}>
                      <div style={{ flex: 1 }}>
                        <div className="ai-title">{r.studentName}</div>
                        <div className="ai-meta">
                          By {r.facultyName} · Week {String(r.weekNumber).slice(-2)} · {fmtWeekRange(r.weekStartDate)}
                          {r.testScore != null && <span> · Score: <strong>{r.testScore}/{r.testTotalMarks}</strong>{r.testSubject ? ` (${r.testSubject})` : ''}</span>}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {r.overallRating && <span style={{ fontSize: '14px', color: 'var(--gold)', letterSpacing: '-1px' }}>{'★'.repeat(r.overallRating)}{'☆'.repeat(5 - r.overallRating)}</span>}
                        {statusPill[r.status]}
                        <button className="btn btn-ghost btn-sm" onClick={() => setExpandedReportId(isExpanded ? null : r.id)}>
                          {isExpanded ? 'Hide ▲' : 'Review ▼'}
                        </button>
                      </div>
                    </div>

                    {/* Expanded content */}
                    {isExpanded && (
                      <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {(r.strengths || r.improvements) && (
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            {r.strengths && (
                              <div>
                                <div style={{ fontSize: '11px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.06em', fontWeight: 600, marginBottom: '4px' }}>Strengths</div>
                                <div style={{ fontSize: '13px', color: 'var(--text2)', lineHeight: 1.6 }}>{r.strengths}</div>
                              </div>
                            )}
                            {r.improvements && (
                              <div>
                                <div style={{ fontSize: '11px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.06em', fontWeight: 600, marginBottom: '4px' }}>Areas to improve</div>
                                <div style={{ fontSize: '13px', color: 'var(--text2)', lineHeight: 1.6 }}>{r.improvements}</div>
                              </div>
                            )}
                          </div>
                        )}

                        {r.mentorNote && (
                          <div style={{ borderLeft: '3px solid var(--gold)', background: 'var(--cream2)', padding: '10px 14px', borderRadius: '0 var(--r) var(--r) 0' }}>
                            <div style={{ fontSize: '11px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.06em', fontWeight: 600, marginBottom: '4px' }}>Note to parents</div>
                            <div style={{ fontSize: '13px', color: 'var(--text2)', lineHeight: 1.7 }}>{r.mentorNote}</div>
                          </div>
                        )}

                        {r.nextWeekPlan && (
                          <div>
                            <div style={{ fontSize: '11px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.06em', fontWeight: 600, marginBottom: '4px' }}>Next week plan</div>
                            <div style={{ fontSize: '13px', color: 'var(--text2)', lineHeight: 1.6 }}>{r.nextWeekPlan}</div>
                          </div>
                        )}

                        {r.status === 'rejected' && r.rejectedReason && (
                          <div style={{ fontSize: '12.5px', color: 'rgba(239,68,68,0.8)' }}>Rejected: {r.rejectedReason}</div>
                        )}

                        {r.status === 'sent' && r.sentAt && (
                          <div style={{ fontSize: '12px', color: 'var(--text3)' }}>Sent on {new Date(r.sentAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                        )}

                        {r.status === 'submitted' && (
                          <div className="ai-actions" style={{ justifyContent: 'flex-end', paddingTop: '8px', borderTop: '1px solid var(--b)' }}>
                            {isRejecting ? (
                              <>
                                <input className="fi" style={{ flex: 1, padding: '6px 10px', fontSize: '13px' }} placeholder="Reason for rejection (sent back to faculty)…" value={rejectReason} onChange={e => setRejectReason(e.target.value)} />
                                <button className="btn btn-ghost btn-sm" onClick={() => setRejectingReportId(null)}>Cancel</button>
                                <button className="btn btn-red btn-sm" onClick={() => { onRejectReport?.(r.id, rejectReason); setRejectingReportId(null); setExpandedReportId(null); }}>Confirm Reject</button>
                              </>
                            ) : (
                              <>
                                <button className="btn btn-red btn-sm" onClick={() => { setRejectingReportId(r.id); setRejectReason(''); }}>Reject</button>
                                <button className="btn btn-green btn-sm" onClick={() => { onApproveReport?.(r.id); setExpandedReportId(null); }}>Approve ✓</button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          );
        })()}
      </div>

    </div>
  );
};

export default AdminContent;
