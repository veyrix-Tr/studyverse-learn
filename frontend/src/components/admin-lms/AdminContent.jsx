import React, { useState } from 'react';

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

const AdminContent = ({ activePage, onOpenModal, onNav, onShowToast, profile, students = [], onOpenMessage }) => {
  const firstName = profile?.name?.split(' ')[0] || 'there';
  const [studentsTab, setStudentsTab] = useState(0);
  const [approvalsTab, setApprovalsTab] = useState(0);
  const [dismissedApprovals, setDismissedApprovals] = useState(new Set());
  const [platformToggles, setPlatformToggles] = useState([true, true, true, true, true, true, true, true]);
  const [activeChips, setActiveChips] = useState(new Set([0]));

  const pg = (id) => `page${activePage === id ? ' on' : ''}`;

  const dismissApproval = (i, msg) => {
    setDismissedApprovals(prev => new Set([...prev, i]));
    onShowToast(msg);
  };

  const togglePlatform = (i) => {
    setPlatformToggles(prev => { const n = [...prev]; n[i] = !n[i]; return n; });
  };

  const toggleChip = (i) => {
    setActiveChips(prev => {
      const n = new Set(prev);
      n.has(i) ? n.delete(i) : n.add(i);
      return n;
    });
  };

  const approvals = [
    {
      title: 'Test: Electrostatics Targeted (25Q) — Rahul Mehta',
      meta: 'Suggested by Ajay Sharma · Apr 14 · 25 questions · Due Apr 18',
      type: 'Test', typeClass: 'po',
      reason: '"Rahul\'s Gauss\'s Law accuracy is 31%. This test covers exactly his gap — 15 field line Qs + 10 potential. Needs to do this before our Apr 18 session so I can build on results."',
      approveLabel: 'Approve & Assign',
      approveMsg: 'Test approved. Rahul will see it as Mentor-assigned ✓'
    },
    {
      title: 'Resource: PYQ Electrostatics 2018–2024 — Rahul Mehta',
      meta: 'Suggested by Ajay Sharma · Apr 14 · PDF 4.2MB',
      type: 'Resource', typeClass: 'pb',
      reason: '"Rahul\'s doubt volume on this topic is high. These 40 PYQs map directly to his weak area and will give him exam-pattern familiarity before the Apr 18 session."',
      approveLabel: 'Approve',
      approveMsg: "Resource approved. Added to Rahul's library ✓"
    },
    {
      title: 'Resource: Organic Reactions Cheat Sheet — Priya Desai',
      meta: 'Suggested by Ajay Sharma · Apr 13 · PDF 0.8MB',
      type: 'Resource', typeClass: 'pb',
      reason: '"Priya keeps confusing Markovnikov, Aldol, and Cannizzaro under test conditions. A visual one-pager for revision before sessions will help consolidate."',
      approveLabel: 'Approve',
      approveMsg: "Resource approved. Added to Priya's library ✓"
    },
    {
      title: 'Test: Integration Chapter Test (30Q) — Sneha Kapoor',
      meta: 'Suggested by Ajay Sharma · Apr 12 · 30 questions · Due Apr 17',
      type: 'Test', typeClass: 'po',
      reason: '"Sneha\'s substitution method is now solid (68%). Ready to confirm with a full chapter test before moving to definite integrals. This closes the loop on 3 weeks of work."',
      approveLabel: 'Approve & Assign',
      approveMsg: 'Test approved. Sneha will see it as Mentor-assigned ✓'
    }
  ];

  const chips = ['All Students', 'JEE Students', 'NEET Students', 'Rahul Mehta', 'Sneha Kapoor', 'Priya Desai', 'Arjun Singh', 'Kavya Menon', 'Vanya Rao'];

  const platformSettings = [
    { label: 'Free tier diagnostic enabled', desc: 'Students without enrollment can access the free diagnostic' },
    { label: 'New enrollments open', desc: 'Pipeline accepts new enquiries' },
    { label: 'Parent reports automated', desc: 'Send Sunday reports automatically when faculty marks "Ready"' },
    { label: 'Payment reminders auto-send', desc: 'Send automatic reminders 3 days before due date' },
    { label: 'Free tier habit tracker', desc: 'Non-enrolled students can access the habit tracker' },
  ];

  const approvalSettings = [
    { label: 'Faculty can assign tests', desc: 'Require admin approval before tests appear to students' },
    { label: 'Faculty can assign resources', desc: 'Require admin approval before resources appear' },
    { label: 'Parent feedback visible to faculty', desc: 'Faculty can read parent feedback about their sessions' },
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
              <strong style={{ color: 'var(--red)' }}>2 fees overdue</strong> · <strong style={{ color: 'var(--gold)' }}>3 new enquiries</strong> · <strong style={{ color: 'var(--green)' }}>4 approvals pending</strong>
            </div>
          </div>
        </div>

        <div className="g4 mb">
          <div className="stat sa-navy"><div className="stat-l">Active Students</div><div className="stat-v">12</div><div className="stat-n up">↑ 2 this month</div></div>
          <div className="stat sa-gold"><div className="stat-l">Revenue (April)</div><div className="stat-v" style={{ fontSize: '22px' }}>₹1.84L</div><div className="stat-n up">↑ 18% vs March</div></div>
          <div className="stat sa-red"><div className="stat-l">Fees Overdue</div><div className="stat-v">2</div><div className="stat-n bad">₹28,000 pending</div></div>
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
            {[
              { av: 'A', title: 'Test: Electrostatics Targeted — for Rahul Mehta', meta: 'Suggested by Ajay Sharma • Apr 14', msg: 'Test approved and assigned to Rahul ✓' },
              { av: 'A', title: 'Resource: PYQ Electrostatics (2018–24) — for Rahul', meta: 'Suggested by Ajay Sharma • Apr 14', msg: 'Resource approved ✓' },
              { av: 'A', title: 'Resource: Organic Reactions Cheat Sheet — for Priya', meta: 'Suggested by Ajay Sharma • Apr 13', msg: 'Resource approved ✓' }
            ].map(({ av, title, meta, msg }, i, arr) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '11px 0', borderBottom: i < arr.length - 1 ? '1px solid var(--b)' : 'none' }}>
                <div className="av">{av}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', fontWeight: '600' }}>{title}</div>
                  <div style={{ fontSize: '11.5px', color: 'var(--text3)' }}>{meta}</div>
                </div>
                <div style={{ display: 'flex', gap: '7px' }}>
                  <button className="btn btn-green btn-sm" onClick={() => onShowToast(msg)}>Approve</button>
                  <button className="btn btn-ghost btn-sm">Review</button>
                </div>
              </div>
            ))}
          </div>
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
          <div className="stat sa-red"><div className="stat-l">Overdue Amount</div><div className="stat-v" style={{ fontSize: '22px' }}>₹28K</div><div className="stat-n bad">2 students · 15+ days</div></div>
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
              <div style={{ textAlign: 'center', flex: 1 }}><div style={{ fontFamily: 'var(--fs)', fontSize: '16px', fontWeight: '700', color: 'var(--red)' }}>₹28K</div><div style={{ fontSize: '10.5px', color: 'var(--text3)' }}>Remaining</div></div>
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

        <div className="sh"><div className="sh-t">Student Fee Status</div><button className="btn btn-gold btn-sm" onClick={() => onOpenModal('fee-modal')}>Record Payment</button></div>
        <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
          <table className="tbl">
            <thead><tr><th>Student</th><th>Plan</th><th>Monthly Fee</th><th>Last Payment</th><th>Next Due</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>
              {[
                { av: 'R', name: 'Rahul Mehta', plan: 'Full Program', fee: '₹15,000', last: 'Apr 1', next: 'May 1', status: 'paid', statusLabel: 'Paid ✓', action: <button className="btn btn-ghost btn-sm">History</button> },
                { av: 'S', name: 'Sneha Kapoor', plan: 'Full Program', fee: '₹15,000', last: 'Apr 1', next: 'May 1', status: 'paid', statusLabel: 'Paid ✓', action: <button className="btn btn-ghost btn-sm">History</button> },
                { av: 'P', name: 'Priya Desai', plan: 'Full Program', fee: '₹14,000', last: 'Mar 28', next: 'Apr 28', status: 'overdue', statusLabel: 'Overdue 18d', action: <button className="btn btn-gold btn-sm" onClick={() => onShowToast("Payment reminder sent to Priya's parent ✓")}>Send Reminder</button> },
                { av: 'A', name: 'Arjun Singh', plan: 'Full Program', fee: '₹14,000', last: 'Apr 5', next: 'May 5', status: 'paid', statusLabel: 'Paid ✓', action: <button className="btn btn-ghost btn-sm">History</button> },
                { av: 'V', name: 'Vanya Rao', plan: 'Full Program', fee: '₹14,000', last: 'Mar 25', next: 'Apr 25', status: 'overdue', statusLabel: 'Overdue 21d', action: <button className="btn btn-gold btn-sm" onClick={() => onShowToast('Reminder sent ✓')}>Send Reminder</button> },
                { av: 'K', name: 'Kavya Menon', plan: 'Full Program', fee: '₹16,000', last: 'Apr 3', next: 'May 3', status: 'paid', statusLabel: 'Paid ✓', action: <button className="btn btn-ghost btn-sm">History</button> }
              ].map(({ av, name, plan, fee, last, next, status, statusLabel, action }) => (
                <tr key={name}>
                  <td><div className="av-row"><div className="av">{av}</div>{name}</div></td>
                  <td>{plan}</td><td>{fee}</td><td>{last}</td><td>{next}</td>
                  <td><span className={`fc-status ${status}`}>{statusLabel}</span></td>
                  <td>{action}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ══ STUDENTS ══ */}
      <div className={pg('students')} id="p-students">
        {(() => {
          const premium  = students.filter(s => s.plan === 'premium');
          const free     = students.filter(s => s.plan !== 'premium');
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
            return (
              <tr>
                <td><div className="av-row"><div className="av">{av}</div>{s.name}</div></td>
                <td><span className={`pill ${examClass}`}>{s.examTarget || '—'}</span></td>
                <td style={{ color: 'var(--text2)', fontSize: '13px' }}>{s.grade || '—'}</td>
                <td>
                  {diagDone
                    ? <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--green)' }}>Done — {s.diagnosticScore}</span>
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
                        background: studentsTab === i ? 'rgb(250, 187, 0)' : 'rgb(244, 210, 108)',
                        borderColor: studentsTab === i ? 'rgb(250, 187, 0)' : 'rgb(244, 210, 108)',
                        borderWidth: '1px',
                        borderStyle: 'solid',
                        borderRadius: 'var(--r)',
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
          {['Pending (4)', 'Approved', 'Declined'].map((label, i) => (
            <div key={i} className={`tab${approvalsTab === i ? ' on' : ''}`} onClick={() => setApprovalsTab(i)}>{label}</div>
          ))}
        </div>
        {approvals.map((item, i) => (
          <div key={i} className="approval-item" style={dismissedApprovals.has(i) ? { opacity: '0.4', pointerEvents: 'none' } : {}}>
            <div className="ai-top">
              <div><div className="ai-title">{item.title}</div><div className="ai-meta">{item.meta}</div></div>
              <span className={`pill ${item.typeClass}`}>{item.type}</span>
            </div>
            <div className="ai-reason">{item.reason}</div>
            <div className="ai-actions">
              <button className="btn btn-green btn-sm" onClick={() => dismissApproval(i, item.approveMsg)}>{item.approveLabel}</button>
              <button className="btn btn-ghost btn-sm">Request Changes</button>
              <button className="btn btn-red btn-sm" onClick={() => dismissApproval(i, 'Item declined.')}>Decline</button>
            </div>
          </div>
        ))}
      </div>

      {/* ══ MESSAGES ══ */}
      <div className={pg('messages')} id="p-messages">
        <div className="msg-compose mb">
          <div className="sh"><div className="sh-t">Compose Message</div><span style={{ fontSize: '12px', color: 'var(--text3)' }}>Appears on student's dashboard immediately</span></div>
          <div style={{ fontSize: '12px', color: 'var(--text2)', marginBottom: '10px', fontWeight: '500' }}>Send to:</div>
          <div className="target-chips">
            {chips.map((label, i) => (
              <div key={i} className={`chip${activeChips.has(i) ? ' on' : ''}`} onClick={() => toggleChip(i)}>{label}</div>
            ))}
          </div>
          <div className="fg" style={{ marginBottom: '12px' }}>
            <label>Message Type</label>
            <select className="fi"><option>Announcement</option><option>Reminder</option><option>Motivational Note</option><option>Schedule Update</option><option>Fee Reminder</option></select>
          </div>
          <div className="fg" style={{ marginBottom: '12px' }}>
            <label>Message</label>
            <textarea className="fi" rows="4" placeholder="Write your message — it will appear as a notification on the student's dashboard..."></textarea>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '9px' }}>
            <button className="btn btn-ghost btn-sm">Save as Draft</button>
            <button className="btn btn-gold btn-sm" onClick={() => onShowToast('Message sent to selected students ✓')}>Send Now →</button>
          </div>
        </div>

        <div className="sh"><div className="sh-t">Sent Messages</div></div>
        <div className="card" style={{ padding: '14px 18px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
            {[
              { title: 'Reminder: Holiday Schedule Update', meta: 'Apr 13 · All Students', body: 'No sessions on Apr 14 (Sunday). All schedules resume from Apr 15. Doubt desk remains active throughout.' },
              { title: 'JEE Mains April Result — Important', meta: 'Apr 10 · JEE Students', body: "Results will be declared next week. Stay focused on current preparation — results don't change the plan." },
              { title: 'Week 10 — Keep the momentum', meta: 'Apr 6 · All Students', body: "You're past the halfway mark. The work you do in the next 8 weeks matters most. Trust the process." }
            ].map(({ title, meta, body }, i, arr) => (
              <div key={i} style={{ padding: '12px 0', borderBottom: i < arr.length - 1 ? '1px solid var(--b)' : 'none' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                  <div style={{ fontSize: '13px', fontWeight: '600' }}>{title}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text3)' }}>{meta}</div>
                </div>
                <div style={{ fontSize: '12.5px', color: 'var(--text2)' }}>{body}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══ ADMIN ACCOUNTS (SUPER ONLY) ══ */}
      <div className={pg('admins')} id="p-admins">
        <div style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.25)', borderRadius: 'var(--rl)', padding: '14px 18px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          <div style={{ fontSize: '13px', color: '#5b21b6', fontWeight: '500' }}>Super Admin view only. You can create admins, toggle their permissions, and deactivate accounts.</div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <div className="sh-t">Admin Accounts</div>
          <button className="btn btn-purple btn-sm" onClick={() => onOpenModal('add-admin-modal')}>+ Create Admin</button>
        </div>

        <div className="g2 mb">
          {[
            {
              avStyle: { color: 'var(--gold)', borderColor: 'var(--gold)' }, av: 'M', name: 'Meera Krishnan', role: 'Operations Admin · Active since Jan 2026',
              perms: [
                { label: 'View Students', on: true }, { label: 'Enroll Students', on: true }, { label: 'Assign Faculty', on: true },
                { label: 'Approve Tests/Resources', on: true }, { label: 'Send Messages', on: true },
                { label: 'View Revenue', on: false }, { label: 'Manage Fees', on: false }, { label: 'Add/Remove Faculty', on: false }
              ]
            },
            {
              avStyle: { color: 'var(--blue)', borderColor: 'var(--blue)', background: 'var(--bdim)' }, av: 'S', name: 'Sanjay Pillai', role: 'Finance Admin · Active since Feb 2026',
              perms: [
                { label: 'View Students', on: true }, { label: 'Enroll Students', on: false }, { label: 'Assign Faculty', on: false },
                { label: 'Approve Tests/Resources', on: false }, { label: 'Send Messages', on: true },
                { label: 'View Revenue', on: true }, { label: 'Manage Fees', on: true }, { label: 'Add/Remove Faculty', on: false }
              ]
            }
          ].map(({ av, avStyle, name, role, perms }) => (
            <div key={name} className="admin-card">
              <div className="ac-header">
                <div className="av av-lg" style={avStyle}>{av}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text)' }}>{name}</div>
                  <div className="ac-meta">{role}</div>
                </div>
                <span className="pill pp">Active</span>
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--text3)', marginBottom: '10px', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '.06em' }}>Permissions</div>
              <div className="ac-perms">
                {perms.map(({ label, on }) => (
                  <span key={label} className={`ac-perm-tag ${on ? 'tag-on' : 'tag-off'}`}>{label}</span>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '7px', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--b)' }}>
                <button className="btn btn-ghost btn-sm" style={{ flex: 1, justifyContent: 'center' }} onClick={() => onOpenModal('edit-admin-modal')}>Edit Permissions</button>
                <button className="btn btn-red btn-sm" onClick={() => onShowToast('Account deactivated')}>Deactivate</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ══ PLATFORM SETTINGS (SUPER ONLY) ══ */}
      <div className={pg('settings')} id="p-settings">
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
                  <div className={`toggle${platformToggles[5 + i] ? ' on' : ''}`} onClick={() => togglePlatform(5 + i)}></div>
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

    </div>
  );
};

export default AdminContent;
