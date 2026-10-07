import { Fragment, useState, useEffect } from 'react';
import AdminPlanGrantModal from './AdminPlanGrantModal';
import AdminMentorAssignModal from './AdminMentorAssignModal';
import AdminFacultyAssignModal from './AdminFacultyAssignModal';
import FacultyPerformance from './FacultyPerformance';
import { Check, ChevronDown, Lock, FileText, Phone, Clock, Calendar, Search } from 'lucide-react';

const UC = { red:'#EF4444', orange:'#F97316', yellow:'#D97706', green:'#22C55E', gray:'#94A3B8' };
const UB = { red:'rgba(239,68,68,0.1)', orange:'rgba(249,115,22,0.1)', yellow:'rgba(245,158,11,0.1)', green:'rgba(34,197,94,0.1)', gray:'rgba(148,163,184,0.1)' };

const PLAN_NAME = { apex: 'Apex', forge: 'Forge', anchor: 'Anchor', spark: 'Spark' };
const PLAN_ORDER = ['apex', 'forge', 'anchor', 'spark'];
const subjectList = (s) => (s.examTarget || '').toLowerCase().includes('neet')
  ? ['Physics', 'Chemistry', 'Biology']
  : ['Physics', 'Chemistry', 'Maths'];
const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
const DiagnosticModal = ({ modal, loading, onClose, onReset }) => {
  useEffect(() => {
    if (!modal) return;
    const handler = e => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [modal, onClose]);

  if (!modal) return null;
  const d = modal.data;
  const takenAgo = d ? Math.floor((Date.now() - new Date(d.takenAt).getTime()) / 86400000) : 0;
  const trendColor = d?.plan?.mockTrend?.trend === 'improving' ? '#16A34A' : d?.plan?.mockTrend?.trend === 'declining' ? '#DC2626' : '#8896B3';
  const trendIcon  = d?.plan?.mockTrend?.trend === 'improving' ? '↑' : d?.plan?.mockTrend?.trend === 'declining' ? '↓' : '→';
  const maxMock    = d?.plan?.mockTrend ? Math.max(...d.plan.mockTrend.scores) : 1;

  return (
    <div className="dm-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position:'fixed', inset:0, background:'rgba(15,31,61,0.6)', display:'flex', alignItems:'center', justifyContent:'center', padding:'36px 40px', zIndex:300, backdropFilter:'blur(6px)', animation:'dmFadeIn .2s ease' }}>
      <style dangerouslySetInnerHTML={{ __html:
        '@keyframes dmFadeIn{from{opacity:0}to{opacity:1}}' +
        '@keyframes dmSlideUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}' +
        '@keyframes dmIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}' +
        '.dm-card{animation:dmIn .35s cubic-bezier(0.4,0,0.2,1) both}' +
        '@media (max-width:720px){' +
          '.dm-overlay{padding:16px !important}' +
          '.dm-2col{grid-template-columns:1fr !important}' +
          '.dm-details-grid{grid-template-columns:1fr !important}' +
          '.dm-subj-grid{grid-template-columns:repeat(auto-fit,minmax(110px,1fr)) !important}' +
        '}'
      }} />

      <div style={{ background:'#FDF8F0', borderRadius:'22px', width:'1060px', maxWidth:'100%', maxHeight:'100%', display:'flex', flexDirection:'column', boxShadow:'0 28px 70px rgba(15,31,61,0.28)', animation:'dmSlideUp .28s cubic-bezier(0.4,0,0.2,1)' }}>

        {/* Dark header */}
        <div style={{ background:'linear-gradient(135deg,#0F1F3D 0%,#1C2E50 100%)', borderRadius:'22px 22px 0 0', padding:'18px 24px', position:'relative', overflow:'hidden', flexShrink:0 }}>
          <div style={{ position:'absolute', top:-40, right:-40, width:160, height:160, borderRadius:'50%', background:'rgba(232,168,48,0.07)', pointerEvents:'none' }}/>
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between' }}>
            <div>
              <div style={{ fontSize:'11px', color:'rgba(253,248,240,0.45)', textTransform:'uppercase', letterSpacing:'.1em', marginBottom:'5px' }}>Diagnostic Report</div>
              <div style={{ fontFamily:'var(--fs,Georgia)', fontSize:'22px', fontWeight:700, color:'#FDF8F0', lineHeight:1.2 }}>{modal.studentName}</div>
              {d && <div style={{ fontSize:'12px', color:'rgba(253,248,240,0.55)', marginTop:'5px' }}>{d.digest.exam_target} · {d.digest.current_class}</div>}
            </div>
            <button onClick={onClose} style={{ border:'none', background:'rgba(239,68,68,0.18)', borderRadius:'10px', width:'34px', height:'34px', cursor:'pointer', fontSize:'20px', color:'#EF4444', flexShrink:0, zIndex:10, position:'relative', transition:'background .15s' }}>×</button>
          </div>

          {/* Stats row inside header */}
          {d && (
            <div style={{ display:'flex', gap:'10px', marginTop:'18px' }}>
              <div style={{ flex:1, background:'rgba(255,255,255,0.08)', borderRadius:'12px', padding:'12px 14px', textAlign:'center' }}>
                <div style={{ fontSize:'24px', fontWeight:800, color:'#E8A830', lineHeight:1 }}>{d.score}%</div>
                <div style={{ fontSize:'10px', color:'rgba(253,248,240,0.45)', marginTop:'4px', textTransform:'uppercase' }}>Completion</div>
              </div>
              <div style={{ flex:1, background:'rgba(255,255,255,0.08)', borderRadius:'12px', padding:'12px 14px', textAlign:'center' }}>
                <div style={{ fontSize:'20px', fontWeight:700, color:'#FDF8F0', lineHeight:1 }}>{takenAgo}d</div>
                <div style={{ fontSize:'10px', color:'rgba(253,248,240,0.45)', marginTop:'4px', textTransform:'uppercase' }}>Since test</div>
              </div>
              {d.plan.mockTrend && (
                <div style={{ flex:1.4, background:'rgba(255,255,255,0.08)', borderRadius:'12px', padding:'12px 14px' }}>
                  <div style={{ display:'flex', alignItems:'flex-end', gap:'4px', height:'28px', marginBottom:'4px' }}>
                    {d.plan.mockTrend.scores.map((s, i) => (
                      <div key={i} title={String(s)} style={{ flex:1, borderRadius:'3px 3px 0 0', background: i === d.plan.mockTrend.scores.length-1 ? trendColor : 'rgba(255,255,255,0.25)', height:`${Math.round((s/maxMock)*28)}px`, transition:'height .5s ease' }}/>
                    ))}
                  </div>
                  <div style={{ fontSize:'10px', color:'rgba(253,248,240,0.45)', textTransform:'uppercase', display:'flex', alignItems:'center', gap:'4px' }}>
                    <span style={{ color:trendColor, fontWeight:700 }}>{trendIcon}</span> Mock trend
                  </div>
                </div>
              )}
              <div style={{ flex:1, background:'rgba(255,255,255,0.08)', borderRadius:'12px', padding:'12px 14px', textAlign:'center' }}>
                <div style={{ fontSize:'14px', fontWeight:700, color:'#FDF8F0', lineHeight:1 }}>{d.digest.study_hours ? d.digest.study_hours+'h' : 'Not set'}</div>
                <div style={{ fontSize:'10px', color:'rgba(253,248,240,0.45)', marginTop:'4px', textTransform:'uppercase' }}>Daily hrs</div>
              </div>
            </div>
          )}
        </div>

        {/* Body */}
        <div className="dm-body" style={{ padding:'16px 22px 20px', flex:1, overflowY:'scroll' }}>
          {loading && <div style={{ textAlign:'center', padding:'40px', color:'#8896B3' }}>Loading...</div>}
          {!loading && !d && <div style={{ textAlign:'center', padding:'40px', color:'#8896B3' }}>No diagnostic data.</div>}
          {!loading && d && (
            <div className="dm-2col" style={{ display:'grid', gridTemplateColumns:'1fr 1.3fr', gap:'20px' }}>

              {/* LEFT COLUMN */}
              <div>
                {/* Key details grid */}
                <div style={{ fontSize:'11px', fontWeight:700, color:'#8896B3', textTransform:'uppercase', letterSpacing:'.07em', marginBottom:'8px' }}>Student Details</div>
                <div className="dm-card dm-details-grid" style={{ animationDelay:'.05s', display:'grid', gridTemplateColumns:'1fr 1fr', background:'#fff', borderRadius:'14px', border:'1px solid rgba(15,31,61,0.08)', marginBottom:'14px', overflow:'hidden' }}>
                  {[['Target score', d.digest.target_score],
                    ['Target rank',  d.digest.target_rank],
                    ['Has coaching', d.digest.has_coaching],
                    ['Syllabus done',d.digest.syllabus_coverage],
                    ['Reviews mistakes', d.digest.review_mistakes],
                    ['Same-day revision',d.digest.same_day_revision],
                  ].filter(([,v]) => v).map(([label, value], i, arr) => (
                    <div key={i} style={{ padding:'9px 13px', borderBottom: i < arr.length-2 ? '1px solid rgba(15,31,61,0.06)' : 'none', borderRight: i%2===0 ? '1px solid rgba(15,31,61,0.06)' : 'none' }}>
                      <div style={{ fontSize:'10px', color:'#8896B3', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:'3px' }}>{label}</div>
                      <div style={{ fontSize:'12px', fontWeight:600, color:'#0F1F3D' }}>{value}</div>
                    </div>
                  ))}
                </div>

                {/* Weak topics */}
                {d.digest.weak_topics && (
                  <div className="dm-card" style={{ animationDelay:'.1s', background:'rgba(239,68,68,0.06)', border:'1px solid rgba(239,68,68,0.15)', borderRadius:'12px', padding:'11px 14px', marginBottom:'14px', display:'flex', gap:'9px', alignItems:'flex-start' }}>
                    <span style={{ fontSize:'15px', flexShrink:0 }}>⚠️</span>
                    <div>
                      <div style={{ fontSize:'10px', fontWeight:700, color:'#DC2626', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:'4px' }}>Weak / Dreaded Topics</div>
                      <div style={{ fontSize:'12px', color:'#7F1D1D', lineHeight:1.6 }}>{d.digest.weak_topics}</div>
                    </div>
                  </div>
                )}

                {/* Habit nudges */}
                {d.plan.habits?.length > 0 && (
                  <>
                    <div style={{ fontSize:'11px', fontWeight:700, color:'#8896B3', textTransform:'uppercase', letterSpacing:'.07em', marginBottom:'8px' }}>Habits to Fix</div>
                    <div className="dm-card" style={{ animationDelay:'.15s' }}>
                      {d.plan.habits.map((h, i) => (
                        <div key={i} style={{ display:'flex', gap:'10px', padding:'10px 13px', background:'#fff', borderRadius:'12px', marginBottom:'7px', border:'1px solid rgba(15,31,61,0.08)' }}>
                          <span style={{ fontSize:'18px', flexShrink:0 }}>{h.icon}</span>
                          <div>
                            <div style={{ fontSize:'12px', fontWeight:700, color:'#0F1F3D', marginBottom:'3px' }}>{h.title}</div>
                            <div style={{ fontSize:'11.5px', color:'#4A5568', lineHeight:1.55 }}>{h.body}</div>
                            <span style={{ display:'inline-block', marginTop:'5px', fontSize:'10px', fontWeight:700, color:'#16A34A', background:'rgba(34,197,94,0.1)', padding:'2px 8px', borderRadius:'99px' }}>{h.impact}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* RIGHT COLUMN */}
              <div>
                {/* Subject priority cards */}
                <div style={{ fontSize:'11px', fontWeight:700, color:'#8896B3', textTransform:'uppercase', letterSpacing:'.07em', marginBottom:'8px' }}>Subject Priority</div>
                <div className="dm-card dm-subj-grid" style={{ animationDelay:'.08s', display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'8px', marginBottom:'14px' }}>
                  {d.plan.subjectFocus.map((s, i) => (
                    <div key={i} style={{ background:'#fff', border:'1px solid rgba(15,31,61,0.08)', borderRadius:'13px', padding:'13px 10px', textAlign:'center', borderTop:`3px solid ${UC[s.urgencyColor]||UC.gray}` }}>
                      <div style={{ fontSize:'19px', fontWeight:800, color:'#0F1F3D', lineHeight:1, marginBottom:'4px' }}>{s.scorePct !== null ? s.scorePct+'%' : 'N/A'}</div>
                      <div style={{ fontSize:'11.5px', fontWeight:700, color:'#0F1F3D', marginBottom:'5px' }}>{s.subject}</div>
                      <span style={{ fontSize:'10px', fontWeight:700, padding:'2px 7px', borderRadius:'99px', background:UB[s.urgencyColor]||UB.gray, color:UC[s.urgencyColor]||UC.gray }}>{s.urgency}</span>
                      <div style={{ fontSize:'10px', color:'#8896B3', marginTop:'5px' }}>{s.hoursPerWeek}h/wk</div>
                    </div>
                  ))}
                </div>

                {/* This week focus */}
                <div style={{ fontSize:'11px', fontWeight:700, color:'#8896B3', textTransform:'uppercase', letterSpacing:'.07em', marginBottom:'8px' }}>This Week — Focus Topics</div>
                <div className="dm-card" style={{ animationDelay:'.13s' }}>
                  {d.plan.thisWeek.map((t, i) => (
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:'10px', padding:'10px 13px', background:'#fff', borderRadius:'11px', marginBottom:'7px', border:'1px solid rgba(15,31,61,0.07)', borderLeft:`4px solid ${UC[t.color]||UC.gray}` }}>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:'12.5px', fontWeight:700, color:'#0F1F3D', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{t.topic}</div>
                        <div style={{ fontSize:'10.5px', color:'#8896B3', marginTop:'2px', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{t.subject} · {t.approach}</div>
                      </div>
                      <div style={{ textAlign:'right', flexShrink:0 }}>
                        <span style={{ fontSize:'10px', fontWeight:700, padding:'2px 7px', borderRadius:'99px', background:UB[t.color]||UB.gray, color:UC[t.color]||UC.gray, display:'block', marginBottom:'2px' }}>{t.label}</span>
                        <span style={{ fontSize:'10px', color:'#8896B3' }}>{t.hours}h</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer */}
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:'14px', paddingTop:'12px', borderTop:'1px solid rgba(15,31,61,0.07)' }}>
                  <span style={{ fontSize:'11px', color:'#8896B3' }}>
                    Submitted {new Date(d.takenAt).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })} · Retake from {new Date(new Date(d.takenAt).getTime() + 90*86400000).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}
                  </span>
                  <button onClick={onReset} style={{ border:'1px solid rgba(239,68,68,0.3)', background:'rgba(239,68,68,0.06)', color:'#DC2626', borderRadius:'8px', padding:'5px 14px', fontSize:'12px', fontWeight:600, cursor:'pointer' }}>
                    Reset Diagnostic Lock
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const inr = (n) => '₹' + Number(n).toLocaleString('en-IN');

const useCountUp = (target, dur = 900) => {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (target == null) return;
    let raf, start = null;
    const step = (now) => {
      if (!start) start = now;
      const p = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(target * eased);
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, dur]);
  return val;
};

const RevenueChart = ({ data = [], height = 118, goldLast = true }) => {
  if (!data || data.length === 0) {
    return (
      <div className="adm-chart">
        <div className="adm-chart-empty">No revenue recorded yet — payments will appear here.</div>
        <div className="adm-chart-labels">{data.map(d => <span key={d.month}>{d.month}</span>)}</div>
      </div>
    );
  }

  const amounts = data.map(d => d.amount ?? 0);
  const maxAmount = Math.max(...amounts, 1);
  const chartLabels = data.map(d => d.month || '');

  return (
    <div className="rev-chart" style={{ height: `${height + 12}px` }}>
      {amounts.map((amount, i) => {
        const barHeight = Math.round((amount / maxAmount) * height);
        const isLast = goldLast && i === amounts.length - 1;
        const label = chartLabels[i] || '';
        return (
          <div key={i} className="rev-bar-wrap">
            <div className="rev-val">{inr(amount)}</div>
            <div className="rev-bar" style={{
              height: `${barHeight}px`,
              background: isLast ? 'var(--gold)' : 'var(--navy3)'
            }}></div>
            <div className="rev-label">{label}</div>
          </div>
        );
      })}
    </div>
  );
};

const fmtLogTime = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  const s = (Date.now() - d.getTime()) / 1000;
  if (s < 60) return 'just now';
  if (s < 3600) return Math.floor(s / 60) + 'm ago';
  if (s < 86400) return Math.floor(s / 3600) + 'h ago';
  if (s < 604800) return Math.floor(s / 86400) + 'd ago';
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

const ACTION_LABEL = {
  'auth.login':        'signed in',
  'faculty.create':    'created faculty',
  'mentor.assign':     'assigned mentor to',
  'mentor.clear':      'removed mentor from',
  'faculty.assign':    'assigned faculty to',
  'faculty.clear':     'removed faculty from',
  'admin.create':      'created admin',
  'admin.deactivate':  'deactivated admin',
  'admin.reactivate':  'reactivated admin',
  'message.send':      'sent a message',
  'resource.approve':  'approved resource',
  'resource.decline':  'declined resource',
  'report.approve':    'approved report',
  'report.reject':     'rejected report',
  'report.send':       'sent reports',
  'session.assign':    'assigned session',
};

const getGreeting = () => { const h = new Date().getHours(); if (h < 12) return 'Good morning'; if (h < 17) return 'Good afternoon'; return 'Good evening'; };


const KpiCard = ({ k, label, value, render, chip, chipCls, sub, pct }) => {
  const n = useCountUp(value);
  const shown = render ? render(n) : Math.round(n).toLocaleString('en-IN');
  return (
    <div className={`adm-kpi k${k}`}>
      <div className="adm-kpi-top">
        <div className="adm-kpi-label">{label}</div>
        <span className={`adm-kpi-badge ${chipCls}`}>{chip}</span>
      </div>
      <div className="adm-kpi-value">{shown}</div>
      <div className="adm-kpi-delta">
        <span className="d-sub">{sub}</span>
      </div>
      <div className="adm-kpi-track"><i style={{ width: `${pct}%` }}></i></div>
    </div>
  );
};

const fmtWeekRange = (weekStartDate) => {
  const mon = new Date(weekStartDate + 'T00:00:00');
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  const fmt = (d) => d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  return `${fmt(mon)} – ${fmt(sun)}`;
};

const AdminContent = ({ activePage, onOpenModal, onNav, onShowToast, profile, students = [], facultyList = [], onOpenMessage, isSuperAdmin, adminAccounts = [], onDeactivateAdmin, onReactivateAdmin, resources = [], onApproveResource, onDeclineResource, sentMessages = [], onSendMessage, parentReports = [], onApproveReport, onRejectReport, onSendReports, onApproveAllReports, onStudentMentorUpdated, onStudentSubjectFacultyUpdated, onStudentPlanUpdated, sessionRequests = [], onSessionRequestsUpdated, adminNotifications = [], onMarkNotifRead, onMarkAllNotifsRead, analytics = null, accessLog = [], facultyApplications = [] }) => {
  const firstName = profile?.name?.split(' ')[0] || 'there';
  const [stuQuery, setStuQuery] = useState('');
  const [stuPlan, setStuPlan] = useState('all');
  const [assignView, setAssignView] = useState('needs');
  const [planGrantStudent, setPlanGrantStudent] = useState(null);
  const [perfFaculty, setPerfFaculty] = useState(null);

  const activeStudents    = analytics?.activeStudents ?? students.filter(s => ['forge','apex','anchor'].includes(s.plan)).length;
  const premiumStudents   = analytics?.premiumStudents ?? students.filter(s => ['forge','apex','anchor'].includes(s.plan)).length;
  const diagnosticsDone   = analytics?.diagnosticsCompleted ?? students.filter(s => s.diagnosticScore != null).length;
  const totalStudents     = analytics?.totalStudents ?? students.length;
  const avgImprovement    = analytics?.avgImprovement ?? 0;
  const thisMonthRevenue  = analytics?.thisMonthRevenue ?? 0;
  const totalRevenue      = analytics?.totalRevenue ?? 0;
  const newThisMonth      = analytics?.newThisMonth ?? 0;
  const monthlyRevenue    = analytics?.monthlyRevenue ?? [];
  const revenueByPlan     = analytics?.revenueByPlan ?? [];
  const pipeline          = analytics?.pipeline ?? [];
  // Compute revenue by plan for last 6 months
  const totalRevenueLast6Months = monthlyRevenue
    .slice(-6)
    .reduce((sum, m) => sum + (m.amount ?? 0), 0);
  const planRatio = totalRevenue > 0
    ? {
        forge: (revenueByPlan.find(p => p.plan === 'forge')?.amount ?? 0) / totalRevenue,
        apex: (revenueByPlan.find(p => p.plan === 'apex')?.amount ?? 0) / totalRevenue,
        anchor: (revenueByPlan.find(p => p.plan === 'anchor')?.amount ?? 0) / totalRevenue,
      }
    : { forge: 0, apex: 0, anchor: 0 };
  const planLast6 = {
    forge: planRatio.forge * totalRevenueLast6Months,
    apex: planRatio.apex * totalRevenueLast6Months,
    anchor: planRatio.anchor * totalRevenueLast6Months,
  };

  const [diagModal, setDiagModal]   = useState(null);
  const [diagLoading, setDiagLoading] = useState(false);
  const [mentorModalStudent, setMentorModalStudent] = useState(null);
  const [facultyModalStudent, setFacultyModalStudent] = useState(null);
  const [savingMentor, setSavingMentor] = useState(false);
  const [savingFaculty, setSavingFaculty] = useState(false);

  const openDiagModal = async (userId, name) => {
    setDiagLoading(true);
    setDiagModal({ studentName: name, data: null });
    const token = localStorage.getItem('token');
    const adminId = profile?.id;
    try {
      const r = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/${adminId}/student/${userId}/diagnostic`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = r.ok ? await r.json() : null;
      setDiagModal({ studentName: name, data });
    } catch { setDiagModal({ studentName: name, data: null }); }
    setDiagLoading(false);
  };
  const [approvalsTab, setApprovalsTab] = useState(0);
  const [platformToggles, setPlatformToggles] = useState([true, true, true, true, true, true, true]);
  const [decliningId, setDecliningId] = useState(null);
  const [declineReason, setDeclineReason] = useState('');
  const [msgMode, setMsgMode] = useState('all'); // 'all' | 'select'
  const [msgPlan, setMsgPlan] = useState('all');
  const [msgSelectedIds, setMsgSelectedIds] = useState(new Set());
  const [msgSearch, setMsgSearch] = useState('');
  const [msgType, setMsgType] = useState('Announcement');
  const [msgContent, setMsgContent] = useState('');
  const [msgSending, setMsgSending] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [histTypeFilter, setHistTypeFilter] = useState('all');
  const [histPlanFilter, setHistPlanFilter] = useState('all');

  const toggleMsgStudent = (id) => setMsgSelectedIds(prev => {
    const nid = Number(id); // normalise to number — prevents string/number duplicates in Set
    const next = new Set(prev);
    if (next.has(nid)) { next.delete(nid); } else { next.add(nid); }
    return next;
  });
  const [reportsTab, setReportsTab] = useState(0);
  const [expandedReportId, setExpandedReportId] = useState(null);
  const [rejectingReportId, setRejectingReportId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [sendingReports, setSendingReports] = useState(false);

  const sendMessage = async () => {
    if (!msgContent.trim()) { onShowToast('Please write a message'); return; }
    if (msgMode === 'select' && msgSelectedIds.size === 0) { onShowToast('Select at least one student'); return; }
    setMsgSending(true);
    try {
      if (msgMode === 'select') {
        await onSendMessage(Array.from(msgSelectedIds), msgType, msgContent, null);
      } else {
        await onSendMessage('all', msgType, msgContent, msgPlan !== 'all' ? msgPlan : null);
      }
      setMsgContent('');
      setMsgMode('all');
      setMsgPlan('all');
      setMsgSelectedIds(new Set());
      setMsgSearch('');
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
    if (activePage !== 'messages') setShowHistory(false);
  }, [activePage]);

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
    <>
    <div className="content">

      {/* ══ TASKS (assignment inbox) ══ */}
      {(() => {
        const pending = adminNotifications.filter(n => n.status === 'pending');
        const unread  = adminNotifications.filter(n => !n.readAt);
        const LABEL = { mentor: 'Assign Mentor', faculty: 'Assign Faculty', session: 'Session Request' };
        const tileLabel = (n) => n.type === 'session' ? '1:1' : (n.student?.plan || 'STU').toUpperCase();
        const fmtAgo = (iso) => {
          const s = (Date.now() - new Date(iso).getTime()) / 1000;
          if (s < 60) return 'just now';
          if (s < 3600) return Math.floor(s / 60) + 'm ago';
          if (s < 86400) return Math.floor(s / 3600) + 'h ago';
          return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
        };
        return (
          <div className={pg('tasks')} id="p-tasks">
            <div style={{ marginBottom: '18px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.1em', fontWeight: '500', marginBottom: '4px' }}>Action Required</div>
                <div style={{ fontFamily: 'var(--fs)', fontSize: '23px', fontWeight: '700' }}>Assignment Tasks</div>
                <div style={{ fontSize: '13.5px', color: 'var(--text2)', marginTop: '3px' }}>
                  Assign mentors and faculty as students upgrade, and route session bookings.
                  <strong style={{ color: 'var(--navy)' }}> {pending.length} pending</strong>{pending.length ? ` · ${unread.length} unread` : ''}
                </div>
              </div>
              {unread.length > 0 && (
                <button className="btn btn-ghost" style={{ fontSize: '13px' }} onClick={onMarkAllNotifsRead}>Mark all read</button>
              )}
            </div>

            {adminNotifications.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '42px 20px' }}>
                <div style={{ width: '56px', height: '56px', margin: '0 auto 14px', borderRadius: '50%', background: 'rgba(22,163,74,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Check size={26} strokeWidth={2.4} style={{ color: '#16A34A' }} />
                </div>
                <div style={{ fontFamily: 'var(--fs)', fontSize: '16px', fontWeight: '700', color: 'var(--text)', marginBottom: '6px' }}>All caught up!</div>
                <div style={{ fontSize: '13px', color: 'var(--text2)' }}>New mentor/faculty assignments and session bookings will appear here as a highlighted prompt.</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {adminNotifications.map(n => {
                  const label = LABEL[n.type] || LABEL.mentor;
                  const isPending = n.status === 'pending';
                  const isUnread  = !n.readAt;
                  return (
                    <div key={n.id}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '14px', padding: '15px 18px',
                        background: '#fff',
                        border: `1px solid ${isPending ? 'var(--gold-b, rgba(232,168,48,0.3))' : 'var(--b)'}`,
                        borderLeft: `4px solid ${isPending ? '#E8A830' : 'var(--b)'}`,
                        borderRadius: '10px',
                        opacity: isPending ? 1 : 0.55,
                        boxShadow: isPending ? '0 10px 24px rgba(15,31,61,0.06)' : 'none',
                        cursor: isUnread ? 'pointer' : 'default',
                        transition: 'box-shadow .15s ease',
                      }}
                      onClick={() => { if (isUnread) onMarkNotifRead(n.id); }}
                    >
                      <div style={{
                        minWidth: '44px', height: '44px', padding: '0 10px', borderRadius: '9px',
                        background: 'rgba(15,31,61,0.05)', color: 'var(--navy)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '11px', fontWeight: 700, letterSpacing: '.06em', flexShrink: 0,
                      }}>
                        {tileLabel(n)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '3px' }}>
                          <span style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.09em', flexShrink: 0 }}>{label}</span>
                          {isUnread && <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#E8A830', flexShrink: 0 }} />}
                        </div>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)', lineHeight: 1.45 }}>{n.content}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text2)', marginTop: '3px' }}>
                          {n.student?.user?.name ? `${n.student.user.name} · ` : ''}{fmtAgo(n.createdAt)}
                          {isPending && <span style={{ marginLeft: '8px', color: '#B7791F', fontWeight: 600 }}>Pending</span>}
                        </div>
                      </div>
                      {isPending && (
                        <button className="btn btn-gold" style={{ fontSize: '13px', padding: '9px 16px', flexShrink: 0 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (isUnread) onMarkNotifRead(n.id);
                            onNav(n.type === 'session' ? 'session-requests' : 'assign');
                          }}>
                          Assign →
                        </button>
                      )}
                      {!isPending && (
                        <span style={{ fontSize: '11.5px', fontWeight: 600, color: '#16A34A', flexShrink: 0 }}>Done</span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })()}

      {/* ══ DASHBOARD ══ */}
      <div className={pg('dashboard')} id="p-dashboard">
        <div className="adm-dash">
          {/* HERO */}
          <div className="adm-hero">
            <div className="adm-hero-top">
              <div>
                <div className="adm-hero-kicker"><i></i>{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div>
                <div className="adm-hero-greet">{getGreeting()}, {firstName}.</div>
                <div className="adm-hero-sub">Here is how Studyverse is performing today — enrollment momentum, premium adoption and the actions waiting on you.</div>
              </div>
              <div className="adm-hero-chips">
                <div className="adm-chip gold"><b>{newThisMonth}</b> new this month</div>
                <div className="adm-chip green"><b>{pendingResources.length}</b> approvals pending</div>
                <div className="adm-chip blue"><b>{activeStudents}</b> active students</div>
              </div>
            </div>
            <div className="adm-hero-stats">
              <div className="adm-hero-stat grs"><div className="ahs-v">{monthlyRevenue.length ? inr(monthlyRevenue[monthlyRevenue.length - 1].amount) : inr(thisMonthRevenue)}</div><div className="ahs-l">Latest month revenue</div></div>
              <div className="adm-hero-stat grs"><div className="ahs-v">{premiumStudents}</div><div className="ahs-l">Premium subscribers</div></div>
              <div className="adm-hero-stat grs"><div className="ahs-v">{avgImprovement > 0 ? `+${avgImprovement}` : '0'} pts</div><div className="ahs-l">Avg scoring improvement</div></div>
            </div>
          </div>

          {/* KPI ROW */}
          <div className="adm-kpis">
            <KpiCard k={1} label="Active Students" value={activeStudents} chip={totalStudents ? `${Math.round((activeStudents / totalStudents) * 100)}%` : '0%'} chipCls="g" sub={`${newThisMonth} new · ${totalStudents} enrolled total`} pct={totalStudents ? Math.max(4, (activeStudents / totalStudents) * 100) : 4} />
            {isSuperAdmin
              ? <KpiCard k={3} label="This Month Revenue" value={thisMonthRevenue} render={n => <><small className="rm">₹</small>{Math.round(n).toLocaleString('en-IN')}</>} chip={`△ ${newThisMonth}`} chipCls="b" sub="collected from plan upgrades" pct={totalRevenue ? Math.max(6, (thisMonthRevenue / (totalRevenue || 1)) * 100) : 6} />
              : <KpiCard k={3} label="Diagnostics Done" value={diagnosticsDone} chip={totalStudents ? `${Math.round((diagnosticsDone / totalStudents) * 100)}%` : '0%'} chipCls="b" sub={`of ${totalStudents} students assessed`} pct={totalStudents ? Math.max(5, (diagnosticsDone / totalStudents) * 100) : 5} />
            }
            <KpiCard k={2} label="Premium Students" value={premiumStudents} chip={`${premiumStudents}/${totalStudents}`} chipCls="n" sub={`${totalStudents - premiumStudents} on free tier`} pct={totalStudents ? Math.max(4, (premiumStudents / totalStudents) * 100) : 4} />
            <KpiCard k={4} label="Avg Improvement" value={avgImprovement} render={n => <>+{Math.round(n)}</>} chip="cohort" chipCls="n" sub="marks gained across assessed students" pct={Math.min(100, (avgImprovement / 60) * 100)} />
          </div>

          {/* CHARTS */}
          <div className="adm-grid2">
            {isSuperAdmin && (
              <div className="adm-panel">
                <div className="adm-panel-h">
                  <div className="adm-panel-title"><i></i>Monthly Revenue</div>
                  <span className="adm-panel-link" onClick={() => onNav('revenue')}>Full report →</span>
                </div>
                <RevenueChart data={monthlyRevenue} />
                <div className="adm-chart-summary">
                  <div><div className="sum-v">{inr(totalRevenue)}</div><div className="sum-l">All-time revenue</div></div>
                  <div><div className="sum-v" style={{ color: 'var(--green)' }}>{inr(thisMonthRevenue)}</div><div className="sum-l">This month</div></div>
                  <div><div className="sum-v" style={{ color: 'var(--blue)' }}>{premiumStudents}</div><div className="sum-l">Premium active</div></div>
                </div>
              </div>
            )}

            <div className="adm-panel">
              <div className="adm-panel-h">
                <div className="adm-panel-title"><i></i>Enrollment Funnel</div>
                <span className="adm-panel-link" onClick={() => onNav('pipeline')}>Full pipeline →</span>
              </div>
              <div className="adm-funnel">
                {[0, 1, 2, 3].map(i => {
                  const stage = pipeline[i];
                  if (!stage) return null;
                  const pct = pipeline[0]?.count ? Math.round((stage.count / pipeline[0].count) * 100) : 0;
                  return (
                    <div className="af-item" key={stage.label}>
                      <div className="af-meter">
                        <div className="af-row">
                          <span className="af-name">{stage.label}</span>
                          <span className="af-count" style={{ color: ['var(--gold)', 'var(--blue)', 'var(--orange)', 'var(--green)'][i] }}>{stage.count}</span>
                        </div>
                        <div className="af-track"><div className={`af-fill c${i + 1}`} style={{ width: `${Math.max(6, pct)}%` }}></div></div>
                      </div>
                      <span className="af-pct">{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* TASKS + APPROVALS + LOG */}
          {(() => {
            const pendingTasks = adminNotifications.filter(n => n.status === 'pending');
            return (
              <div className="adm-grid2 adm-grid2-eq">
                <div className="adm-panel">
                  <div className="adm-panel-h">
                    <div className="adm-panel-title"><i></i>Pending Approvals</div>
                    <span className="adm-panel-link" onClick={() => onNav('approvals')}>All approvals →</span>
                  </div>
                  <div className="adm-list">
                    {pendingTasks.length === 0 && pendingResources.length === 0 ? (
                      <div className="adm-empty">You're all caught up — nothing needs your attention.</div>
                    ) : (
                      <>
                        {pendingResources.slice(0, 3).map((r, idx) => (
                          <div className="adm-item" key={r.id} style={{ animationDelay: `${idx * .06}s` }}>
                            <div className="adm-av av-gold">{r.facultyName?.charAt(0) || 'F'}</div>
                            <div className="adm-item-body">
                              <div className="adm-item-title">{r.title}</div>
                              <div className="adm-item-meta">By {r.facultyName} · {r.subject} · {new Date(r.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</div>
                            </div>
                            <span className="adm-item-act" onClick={() => onApproveResource(r.id)}>Approve</span>
                          </div>
                        ))}
                        {pendingTasks.slice(0, 2).map((n, idx) => (
                          <div className="adm-item" key={n.id} style={{ animationDelay: `${(idx + 2) * .06}s` }}>
                            <div className="adm-av av-purple">{n.type === 'session' ? 'S' : (n.student?.plan || 'STU').charAt(0).toUpperCase()}</div>
                            <div className="adm-item-body">
                              <div className="adm-item-title">{n.content}</div>
                              <div className="adm-item-meta">{n.student?.user?.name ? `${n.student.user.name} · ` : ''}needs assignment</div>
                            </div>
                            <span className="adm-item-act" onClick={() => onNav(n.type === 'session' ? 'session-requests' : 'assign')}>Assign</span>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                </div>

                <div className="adm-panel">
                  <div className="adm-panel-h">
                    <div className="adm-panel-title"><i></i>Recent Activity</div>
                    <span className="adm-panel-link" onClick={() => onNav('settings')}>View all →</span>
                  </div>
                  <div className="adm-log">
                    {accessLog.length === 0 ? (
                      <div className="adm-empty">No admin activity recorded yet.</div>
                    ) : accessLog.slice(0, 6).map((e, i) => (
                      <div className="adm-log-row" key={e.id} style={{ animationDelay: `${i * .05}s` }}>
                        <span className="adm-log-actor">{e.adminName}</span>
                        <span className="adm-log-text">{ACTION_LABEL[e.action] || e.action}{e.target ? ` ${e.target}` : ''}</span>
                        <span className="adm-log-when">{fmtLogTime(e.createdAt)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* ══ ENROLLMENT PIPELINE ══ */}
      <div className={pg('pipeline')} id="p-pipeline">
        <div className="adm-dash">
          <div className="adm-hero" style={{ padding: '22px 28px' }}>
            <div className="adm-hero-top">
              <div>
                <div className="adm-hero-kicker"><i></i>Enrollment Pipeline</div>
                <div className="adm-hero-greet" style={{ fontSize: '24px' }}>From enquiry to active.</div>
                <div className="adm-hero-sub">Every student starts as an enquiry. Only the right ones reach Active. Conversion is tracked against total registrations.</div>
              </div>
              <div className="adm-hero-chips">
                <div className="adm-chip green"><b>{pipeline[3]?.count ?? 0}</b> active</div>
                <div className="adm-chip gold"><b>{pipeline[0]?.count ?? 0}</b> enquiries</div>
              </div>
            </div>
          </div>

          <div className="pipeline">
            {[
              { stage: 'Enquiry', color: 'var(--text3)', accent: 'linear-gradient(135deg,#94A3B8,#CBD5E1)', label: 'New registrations on the platform', key: 'Enquiry Received', action: 'View students →', sc: 'stage-enquiry', num: 1 },
              { stage: 'Diagnostic', color: 'var(--blue)', accent: 'linear-gradient(135deg,#3B82F6,#60a5fa)', label: 'Students who completed the diagnostic', key: 'Diagnostic Completed', action: 'View students →', sc: 'stage-diag', num: 2 },
              { stage: 'Fit Review', color: 'var(--orange)', accent: 'linear-gradient(135deg,#F97316,#fb923c)', label: 'Premium or session-booked students', key: 'Program Fit & Review', action: 'Review →', sc: 'stage-fit', num: 3 },
              { stage: 'Active', color: 'var(--green)', accent: 'linear-gradient(135deg,#22C55E,#4ade80)', label: 'Currently enrolled & learning', key: 'Active Students', action: null, sc: 'stage-active', num: 4 },
            ].map(({ stage, color, accent, label, key, action, sc, num }) => {
              const count = pipeline.find(p => p.label === key)?.count ?? 0;
              const pct = pipeline[0]?.count ? Math.round((count / pipeline[0].count) * 100) : 0;
              return (
                <div key={stage} className={`pipe-col ${sc}`} style={{ borderRadius: 'var(--rxl)', animation: 'kpiIn .5s ease both' }}>
                  <div className="pipe-header" style={{ padding: '16px 16px 12px', alignItems: 'center' }}>
                    <div className="pipe-title" style={{ color }}>{stage}</div>
                    <div className="pipe-count" style={{ background: 'var(--cream2)', color, width: '26px', height: '26px', fontFamily: 'var(--fs)', fontSize: '14px' }}>{count}</div>
                  </div>
                  <div style={{ margin: '0 16px', height: '5px', borderRadius: '8px', overflow: 'hidden', background: 'var(--cream2)' }}>
                    <div style={{ height: '100%', borderRadius: '8px', background: accent, animation: 'tFill 1.1s cubic-bezier(.2,.8,.25,1) .4s both', width: `${Math.max(pct, 8)}%` }}></div>
                  </div>
                  <div className="pipe-cards" style={{ minHeight: 0 }}>
                    <div className="pipe-card" style={{ cursor: 'default' }}>
                      <div className="pc-name">{label}</div>
                      <div className="pc-date">{count === 1 ? '1 student at this stage' : `${count} students at this stage`}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text3)', marginTop: '8px' }}>
                        <span style={{ fontWeight: 700, color }}>{pct}%</span> of enquiries reach this stage
                      </div>
                      {action && <div className="pc-action" style={{ background: 'var(--bdim)', color }} onClick={() => onNav(num === 3 ? 'assign' : 'students')}>{action}</div>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ══ REVENUE & FEES ══ */}
      <div className={pg(isSuperAdmin ? 'revenue' : '__never__')} id="p-revenue">
        <div className="adm-dash">
          <div className="adm-kpis">
            <KpiCard k={1} label="Total Revenue" value={totalRevenue} render={n => <><span className="rm">₹</span>{Math.round(n).toLocaleString('en-IN')}</>} chip="all-time" chipCls="g" sub="accumulated from paid plans & sessions" pct={totalRevenue ? Math.min(100, (totalRevenue / 100000) * 100) : 5} />
            <KpiCard k={2} label="This Month" value={thisMonthRevenue} render={n => <><span className="rm">₹</span>{Math.round(n).toLocaleString('en-IN')}</>} chip={`△ ${newThisMonth}`} chipCls="b" sub={`${newThisMonth} new enrollment${newThisMonth !== 1 ? 's' : ''} this month`} pct={thisMonthRevenue ? Math.min(100, (thisMonthRevenue / 100000) * 100) : 5} />
            <KpiCard k={3} label="Premium Subscribers" value={premiumStudents} chip={`${Math.round((premiumStudents / (totalStudents || 1)) * 100)}%`} chipCls="n" sub={`of ${totalStudents} total students`} pct={totalStudents ? Math.max(5, (premiumStudents / totalStudents) * 100) : 5} />
            <KpiCard k={4} label="Avg Revenue / Student" value={premiumStudents ? Math.round(totalRevenue / premiumStudents) : 0} render={n => <><span className="rm">₹</span>{Math.round(n).toLocaleString('en-IN')}</>} chip="premium" chipCls="n" sub="lifetime revenue per premium student" pct={80} />
          </div>

          <div className="adm-grid2">
            <div className="adm-panel">
              <div className="adm-panel-h">
                <div className="adm-panel-title"><i></i>Revenue — Last 6 Months</div>
              </div>
              <RevenueChart data={monthlyRevenue} />
              <div className="adm-chart-summary">
                <div><div className="sum-v">{inr(totalRevenue)}</div><div className="sum-l">All-time revenue</div></div>
                <div><div className="sum-v" style={{ color: 'var(--green)' }}>{inr(thisMonthRevenue)}</div><div className="sum-l">This month</div></div>
                <div><div className="sum-v" style={{ color: 'var(--blue)' }}>{premiumStudents}</div><div className="sum-l">Premium active</div></div>
              </div>
            </div>

            <div className="adm-panel">
              <div className="adm-panel-h">
                <div className="adm-panel-title"><i></i>Revenue by Plan (Last 6 Months)</div>
              </div>
              {[
                { plan: 'forge', amount: planLast6.forge },
                { plan: 'apex', amount: planLast6.apex },
                { plan: 'anchor', amount: planLast6.anchor },
              ].map(({ plan, amount }, i) => {
                const maxAmt = Math.max(1, planLast6.forge, planLast6.apex, planLast6.anchor);
                const width = Math.max(5, Math.round((amount / maxAmt) * 100));
                const label = plan.charAt(0).toUpperCase() + plan.slice(1);
                const color = plan === 'anchor' ? '#E8A830' : plan === 'apex' ? '#3B82F6' : '#22C55E';
                return (
                  <div className="adm-planbar" key={plan}>
                    <div className="adm-planbar-row">
                      <div className="adm-planbar-name"><span className="dot" style={{ background: color }}></span>{label}</div>
                      <div className="adm-planbar-amt">{inr(amount)}</div>
                    </div>
                    <div className="adm-planbar-track"><div className="adm-planbar-fill" style={{ width: `${width}%`, background: color, animationDelay: `${.5 + i * .12}s` }}></div></div>
                    <div className="adm-planbar-sub">{amount > 0 ? 'active subscription revenue' : 'no paid subscriptions on this plan yet'}</div>
                  </div>
                );
              })}
              {[planLast6.forge, planLast6.apex, planLast6.anchor].every(v => v === 0) && (
                <div className="adm-empty">No paid plan revenue recorded yet.</div>
              )}
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
                  <td>{s.examTarget || 'Not set'}</td>
                  <td>{s.grade ? `Grade ${s.grade}` : 'Not set'}</td>
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
          const q = stuQuery.trim().toLowerCase();
          const match = s => !q || s.name?.toLowerCase().includes(q) || (s.examTarget || '').toLowerCase().includes(q) || String(s.grade || '').toLowerCase() === q;
          const countFor = key => students.filter(s => (key === 'all' || s.plan === key) && match(s)).length;
          const filtered = students.filter(s => (stuPlan === 'all' || s.plan === stuPlan) && match(s));
          const groups = stuPlan === 'all'
            ? PLAN_ORDER.map(k => ({ key: k, list: filtered.filter(s => s.plan === k) })).filter(g => g.list.length)
            : [{ key: stuPlan, list: filtered }];

          return (
            <>
              <div className="adm-head">
                <div>
                  <div className="adm-title">Students</div>
                  <div className="adm-sub">{filtered.length === students.length ? `${students.length} students` : `${filtered.length} of ${students.length} students`}</div>
                </div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <label className="adm-search">
                    <Search size={14} />
                    <input placeholder="Search name, exam or grade" value={stuQuery} onChange={e => setStuQuery(e.target.value)} />
                  </label>
                  <button className="btn btn-gold btn-sm" onClick={() => onOpenModal('add-student-modal')}>+ Add Student</button>
                </div>
              </div>

              <div className="seg">
                {[{ key: 'all', label: 'All students' }, ...PLAN_ORDER.map(k => ({ key: k, label: PLAN_NAME[k] }))].map(opt => (
                  <button key={opt.key} className={`seg-b${stuPlan === opt.key ? ' on' : ''}`} onClick={() => setStuPlan(opt.key)}>
                    {opt.label} <em>{countFor(opt.key)}</em>
                  </button>
                ))}
              </div>

              <div className="card tbl-wrap" style={{ padding: 0 }}>
                <table className="tbl">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Plan</th>
                      <th>Mentor</th>
                      <th>Subject faculty</th>
                      <th>Feedback</th>
                      <th>Diagnostic</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 && (
                      <tr><td colSpan={7} className="st-empty">No students match{q ? ` “${stuQuery}”` : ''}.</td></tr>
                    )}
                    {groups.map(g => (
                      <Fragment key={g.key}>
                        <tr className="grp">
                          <td colSpan={7}>{PLAN_NAME[g.key] || g.key} <em>{g.list.length} student{g.list.length !== 1 ? 's' : ''}</em></td>
                        </tr>
                        {g.list.map(s => {
                          const isApex = s.plan === 'apex';
                          const assigned = isApex ? subjectList(s).filter(sub => (s.subjectFaculty || {})[sub]) : [];
                          const missing = isApex ? subjectList(s).filter(sub => !(s.subjectFaculty || {})[sub]) : [];
                          const fb = s.latestFeedback;
                          return (
                            <tr key={s.userId}>
                              <td>
                                <div className="st-cell">
                                  <div className="av">{s.name?.[0]?.toUpperCase() || '?'}</div>
                                  <div>
                                    <div className="st-name">{s.name}</div>
                                    <div className="st-sub">{s.examTarget || 'Exam not set'}{s.grade ? ` · Grade ${s.grade}` : ''}</div>
                                  </div>
                                </div>
                              </td>
                              <td>
                                <span className={`st-plan p-${s.plan}`}>{PLAN_NAME[s.plan] || s.plan}</span>
                                {['forge','apex','anchor'].includes(s.plan) && s.planEndDate && (
                                  <div style={{ fontSize: '10.5px', color: 'var(--text3)', marginTop: '3px' }}>
                                    {(() => {
                                      const days = Math.ceil((new Date(s.planEndDate).getTime() - Date.now()) / 86400000);
                                      return days > 0 ? `ends in ${days}d` : 'expired';
                                    })()}
                                  </div>
                                )}
                              </td>
                              <td>{s.mentorName ? <span className="st-val">{s.mentorName}</span> : <span className="st-na">Not assigned</span>}</td>
                              <td>
                                {!isApex
                                  ? <span className="st-na">—</span>
                                  : assigned.length === 0
                                    ? <span className="st-na">Not assigned</span>
                                    : <>
                                        <span className="st-val">{assigned.length} of {subjectList(s).length} subjects</span>
                                        {missing.length > 0 && <div className="st-sub">Missing: {missing.join(', ')}</div>}
                                      </>}
                              </td>
                              <td>
                                {fb
                                  ? <span className="st-val">{fb.rating}/5<div className="st-sub">{fmtDate(fb.createdAt)}</div></span>
                                  : <span className="st-na">—</span>}
                              </td>
                              <td>{s.diagnosticScore != null ? <span className="st-val">{s.diagnosticScore}%</span> : <span className="st-na">Pending</span>}</td>
                              <td className="ar">
                                {s.diagnosticScore != null && <button className="btn btn-ghost btn-sm" onClick={() => openDiagModal(s.userId, s.name)}>Diagnostic</button>}
                                {isSuperAdmin && <button className="btn btn-ghost btn-sm" onClick={() => setPlanGrantStudent(s)}>Plan</button>}
                                <button className="btn btn-ghost btn-sm" onClick={() => onOpenMessage(s.id)}>Message</button>
                              </td>
                            </tr>
                          );
                        })}
                      </Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          );
        })()}
      </div>

      {/* ══ FACULTY ══ */}
      <div className={pg('faculty')} id="p-faculty">
        <div className="adm-head">
          <div>
            <div className="adm-title">Faculty</div>
            <div className="adm-sub">{facultyList.length} active member{facultyList.length !== 1 ? 's' : ''}</div>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {facultyApplications.length > 0 && (
              <button className="btn btn-ghost btn-sm" onClick={() => onOpenModal('faculty-applications-modal')}>
                Applications ({facultyApplications.filter(a => a.status === 'pending').length})
              </button>
            )}
            <button className="btn btn-gold btn-sm" onClick={() => onOpenModal('add-faculty-modal')}>+ Add Faculty</button>
          </div>
        </div>

        <div className="card tbl-wrap" style={{ padding: 0 }}>
          <table className="tbl tbl-wide">
            <thead>
              <tr>
                <th>Faculty</th>
                <th>Subjects</th>
                <th>Mentees</th>
                <th>Sessions / week</th>
                <th>Rating</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {facultyList.map(f => (
                <tr key={f.id}>
                  <td>
                    <div className="st-cell">
                      <div className="av">{f.name?.charAt(0)}</div>
                      <div>
                        <div className="st-name">{f.name}{f.isActive === false && <span className="am-tag" style={{ marginLeft: 7 }}>Inactive</span>}</div>
                        <div className="st-sub">{f.email}{f.qualification ? ` · ${f.qualification}` : ''}</div>
                      </div>
                    </div>
                  </td>
                  <td><span className="st-val">{(f.subjects || [f.subject]).filter(Boolean).join(', ') || '—'}</span></td>
                  <td><span className="st-val">{f.mentorStudentCount || 0} of 10</span></td>
                  <td><span className="st-val">{f.sessionsPerWeek || 0}</span></td>
                  <td>
                    {f.avgRating
                      ? <span className="st-val">{f.avgRating} / 5<div className="st-sub">{f.reportCount} report{f.reportCount !== 1 ? 's' : ''}</div></span>
                      : <span className="st-na">No ratings yet</span>}
                  </td>
                  <td className="ar">
                    <button className="btn btn-green btn-md" onClick={() => setPerfFaculty(f)}>View performance</button>
                  </td>
                </tr>
              ))}
              {facultyList.length === 0 && (
                <tr><td colSpan={6} className="st-empty">No faculty yet. Use “+ Add Faculty” to create the first account.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ══ ASSIGN ══ */}
      <div className={pg('assign')} id="p-assign">
        {(() => {
          const assignable = students.filter(s => s.plan !== 'spark');
          const sparkStudents = students.filter(s => s.plan === 'spark');
          const missingFaculty = s => s.plan === 'apex' ? subjectList(s).filter(sub => !(s.subjectFaculty || {})[sub]) : [];
          const needsAction = s => !s.mentorId || missingFaculty(s).length > 0;
          const needCount = assignable.filter(needsAction).length;
          const rows = assignView === 'needs' ? assignable.filter(needsAction) : assignable;

          return (
            <>
              <div className="adm-head">
                <div>
                  <div className="adm-title">Assignments</div>
                  <div className="adm-sub">One mentor per paid student · subject faculty for Apex students</div>
                </div>
              </div>

              <div className="stat-row">
                <div className="stat-n">
                  <b>{needCount}</b>
                  <span>Need action</span>
                </div>
                <div className="stat-n">
                  <b>{assignable.length - needCount}</b>
                  <span>Fully assigned</span>
                </div>
                <div className="stat-n">
                  <b>{assignable.length}</b>
                  <span>Eligible students</span>
                </div>
                {sparkStudents.length > 0 && (
                  <div className="stat-n">
                    <b>{sparkStudents.length}</b>
                    <span>Spark · free, no assignment</span>
                  </div>
                )}
              </div>

              <div className="seg">
                <button className={`seg-b${assignView === 'needs' ? ' on' : ''}`} onClick={() => setAssignView('needs')}>Needs action <em>{needCount}</em></button>
                <button className={`seg-b${assignView === 'all' ? ' on' : ''}`} onClick={() => setAssignView('all')}>All eligible <em>{assignable.length}</em></button>
              </div>

              <div className="card asg-list">
                {rows.map(s => {
                  const miss = missingFaculty(s);
                  const isApex = s.plan === 'apex';
                  return (
                    <div className="asg-row" key={s.userId}>
                      <div className="st-cell asg-who">
                        <div className="av">{s.name?.[0]?.toUpperCase() || '?'}</div>
                        <div>
                          <div className="st-name">{s.name}</div>
                          <div className="st-sub">{s.examTarget || 'Exam not set'}{s.grade ? ` · Grade ${s.grade}` : ''} · {PLAN_NAME[s.plan] || s.plan}</div>
                        </div>
                      </div>

                      <div className="slot">
                        <div className="slot-k">Mentor</div>
                        {s.mentorName
                          ? <div className="slot-v"><span className="chk">✓</span>{s.mentorName}</div>
                          : <button className="btn btn-gold btn-sm" onClick={() => setMentorModalStudent(s)}>Assign mentor</button>}
                      </div>

                      <div className="slot">
                        <div className="slot-k">Subject faculty</div>
                        {!isApex
                          ? <div className="slot-v st-na">Not applicable on {PLAN_NAME[s.plan] || s.plan}</div>
                          : miss.length === 0
                            ? <div className="slot-v"><span className="chk">✓</span>All {subjectList(s).length} subjects assigned</div>
                            : <button className="btn btn-navy btn-sm" onClick={() => setFacultyModalStudent(s)}>
                                {miss.length === subjectList(s).length ? 'Assign subject faculty' : `Assign remaining (${miss.length})`}
                              </button>}
                      </div>
                    </div>
                  );
                })}
                {rows.length === 0 && (
                  <div className="st-empty">
                    {assignView === 'needs'
                      ? 'Every eligible student has a mentor and subject faculty.'
                      : 'No eligible students yet.'}
                  </div>
                )}
              </div>

              {/* Faculty workload */}
              <div style={{ marginTop: '28px' }}>
                <div className="sh" style={{ marginBottom: '14px' }}>
                  <div className="sh-t">Faculty workload</div>
                  <span style={{ fontSize: '12px', color: 'var(--text3)' }}>Mentee capacity 10 per faculty · subject students across Apex assignments</span>
                </div>
                <div className="card tbl-wrap" style={{ padding: 0 }}>
                  <table className="tbl tbl-wide">
                    <thead>
                      <tr><th>Faculty</th><th>Subjects</th><th>Subject students</th><th>Mentees</th><th>Mentee load</th></tr>
                    </thead>
                    <tbody>
                      {facultyList.map(f => {
                        const mentees = f.mentorStudentCount || 0;
                        const subjectStudents = students.filter(s => Object.values(s.subjectFaculty || {}).includes(f.id)).length;
                        const pct = Math.min(Math.round((mentees / 10) * 100), 100);
                        const barColor = pct >= 80 ? '#EF4444' : pct >= 50 ? '#F59E0B' : '#22C55E';
                        return (
                          <tr key={f.id}>
                            <td>
                              <div className="st-cell">
                                <div className="av">{f.name?.[0]}</div>
                                <div className="st-name">{f.name}</div>
                              </div>
                            </td>
                            <td><span className="st-val">{(f.subjects || [f.subject]).filter(Boolean).join(', ') || '—'}</span></td>
                            <td><span className="st-val">{subjectStudents}</span></td>
                            <td><span className="st-val">{mentees}</span></td>
                            <td>
                              <div className="load">
                                <div className="load-bar"><i style={{ width: pct + '%', background: barColor }} /></div>
                                <span>{mentees}/10</span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      {facultyList.length === 0 && (
                        <tr><td colSpan={5} className="st-empty">No faculty added yet.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          );
        })()}
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
              {item.targeted && (
                <div style={{ marginBottom: '10px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: '5px' }}>
                    Sent to {item.recipients?.length || 0} student{(item.recipients?.length || 0) !== 1 ? 's' : ''}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                    {(item.recipients || []).map(rec => (
                      <span key={rec.id} style={{ fontSize: '11px', fontWeight: 600, padding: '3px 9px', borderRadius: '99px', background: 'var(--gd)', color: 'var(--gold)', border: '1px solid var(--gb)' }}>
                        {rec.name}
                      </span>
                    ))}
                  </div>
                </div>
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
        <style dangerouslySetInnerHTML={{ __html:
          '@keyframes msgCardIn{from{opacity:0;transform:translateY(16px) scale(.98)}to{opacity:1;transform:none}}' +
          '@keyframes msgHistIn{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:none}}' +
          '@keyframes msgRowIn{from{opacity:0;transform:translateX(-8px)}to{opacity:1;transform:none}}' +
          '@keyframes msgDotPop{0%{transform:scale(0)}60%{transform:scale(1.3)}100%{transform:scale(1)}}' +
          '@keyframes msgHeaderPulse{0%,100%{opacity:1}50%{opacity:.85}}' +
          '.msg-card-anim{animation:msgCardIn .42s cubic-bezier(.4,0,.2,1) both}' +
          '.msg-card-anim-2{animation:msgCardIn .42s cubic-bezier(.4,0,.2,1) .08s both}' +
          '.msg-hist-open{animation:msgHistIn .25s cubic-bezier(.4,0,.2,1) both}' +
          '.msg-row-anim{animation:msgRowIn .28s cubic-bezier(.4,0,.2,1) both}' +
          '.msg-dot-anim{animation:msgDotPop .3s cubic-bezier(.34,1.56,.64,1) both}' +
          '.chip-nv.on{background:rgba(232,168,48,.25) !important;border-color:rgba(232,168,48,.6) !important;color:#0F1F3D !important;font-weight:700}' +
          '.mh-row{animation:msgRowIn .22s ease both;display:flex;gap:12px;padding:13px 16px;transition:background .12s}' +
          '.mh-row:hover{background:rgba(15,31,61,.025)}' +
          '.mh-dot{width:7px;height:7px;border-radius:50%;flex-shrink:0;margin-top:5px}' +
          '.ms-list{max-height:186px;overflow-y:auto;border:1px solid var(--b);border-radius:8px;margin-top:6px}' +
          '.ms-row{display:flex;align-items:center;gap:10px;padding:9px 13px;cursor:pointer;border-bottom:1px solid var(--b);transition:background .12s}' +
          '.ms-row:last-child{border-bottom:none}' +
          '.ms-row:hover{background:var(--cream2)}' +
          '.ms-row.on{background:var(--gd)}' +
          '.ms-cb{width:14px;height:14px;border-radius:3px;border:1.5px solid var(--b);flex-shrink:0;display:flex;align-items:center;justify-content:center;transition:all .12s}' +
          '.ms-cb.on{background:var(--navy);border-color:var(--navy)}' +
          '.msg-page-bg{background:rgba(15,31,61,.025);border-radius:var(--rl);padding:24px;margin:-4px}' +
          '.msg-hist-toggle-row{display:flex;align-items:center;justify-content:space-between;cursor:pointer;padding:14px 22px;border-radius:var(--rl);transition:background .15s;user-select:none}' +
          '.msg-hist-toggle-row:hover{background:rgba(15,31,61,.03)}'
        }} />

        {(() => {
          const TYPE_DOT = { Announcement:'#0F1F3D', Reminder:'#F97316', 'Motivational Note':'#7C3AED', 'Schedule Update':'#2563EB', 'Session Request':'#22C55E' };
          const recipientCount = msgMode === 'select' ? msgSelectedIds.size
            : students.filter(s => {
                if (msgPlan === 'spark')  return s.plan === 'spark';
                if (msgPlan === 'forge')  return ['forge', 'apex', 'anchor'].includes(s.plan);
                if (msgPlan === 'apex')   return s.plan === 'apex';
                if (msgPlan === 'anchor') return s.plan === 'anchor';
                return true;
              }).length;
          const filtered = students.filter(s => s.name.toLowerCase().includes(msgSearch.toLowerCase()));
          const canSend = msgContent.trim() && (msgMode !== 'select' || msgSelectedIds.size > 0);
          const timeAgo = (iso) => {
            const d = Math.floor((Date.now() - new Date(iso)) / 1000);
            if (d < 60) return 'just now';
            if (d < 3600) return Math.floor(d / 60) + 'm ago';
            if (d < 86400) return Math.floor(d / 3600) + 'h ago';
            if (d < 604800) return Math.floor(d / 86400) + 'd ago';
            return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
          };
          const histFiltered = sentMessages.filter(m => {
            const typeOk = histTypeFilter === 'all' || (m.type || 'Announcement') === histTypeFilter;
            // Fix 2: 'All Students' (all-plans broadcast) should pass any plan filter
            const planOk = histPlanFilter === 'all'
              || m.recipient === 'All Students'
              || (m.recipient || '').toLowerCase().includes(histPlanFilter);
            return typeOk && planOk;
          });

          return (
            <div className="msg-page-bg">
              {/* ── Compose card ── */}
              <div className="card mb msg-card-anim" style={{ padding: 0, overflow: 'hidden', boxShadow: '0 4px 24px rgba(15,31,61,.09)' }}>
                <div style={{ background: 'linear-gradient(135deg,var(--navy) 0%,var(--navy3) 100%)', padding: '16px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontFamily: 'var(--fs)', fontSize: '16px', fontWeight: 700, color: '#FDF8F0' }}>Compose Message</div>
                  <span style={{ fontSize: '12.5px', color: 'rgba(253,248,240,.72)', fontWeight: 400 }}>Delivered to student dashboards immediately</span>
                </div>
                <div style={{ padding: '20px 22px' }}>

                {/* Recipients */}
                <div className="fg">
                  <label>Recipients</label>
                  <div className="target-chips">
                    <div className={'chip chip-nv' + (msgMode === 'all' ? ' on' : '')} onClick={() => { setMsgMode('all'); setMsgSelectedIds(new Set()); setMsgSearch(''); }}>Broadcast to all</div>
                    <div className={'chip chip-nv' + (msgMode === 'select' ? ' on' : '')} onClick={() => { setMsgMode('select'); setMsgSearch(''); }}>Select students</div>
                  </div>
                </div>

                {/* Broadcast — plan filter */}
                {msgMode === 'all' && (
                  <div className="fg">
                    <label>Target plan <span style={{ fontWeight: 400, color: 'var(--text3)' }}>— {recipientCount} student{recipientCount !== 1 ? 's' : ''} will receive this</span></label>
                    <div className="target-chips">
                      {[{ k: 'all', l: 'All plans' }, { k: 'spark', l: 'Spark only' }, { k: 'forge', l: 'All paid plans' }, { k: 'apex', l: 'Apex only' }, { k: 'anchor', l: 'Anchor only' }].map(p => (
                        <div key={p.k} className={'chip chip-nv' + (msgPlan === p.k ? ' on' : '')} onClick={() => setMsgPlan(p.k)}>{p.l}</div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Select students */}
                {msgMode === 'select' && (
                  <div className="fg">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <label style={{ margin: 0 }}>
                        Select students
                        {msgSelectedIds.size > 0 && (
                          <span style={{ marginLeft: '8px', fontSize: '11.5px', fontWeight: 600, color: '#15803D', background: 'rgba(34,197,94,.12)', border: '1px solid rgba(34,197,94,.28)', borderRadius: '20px', padding: '1px 8px' }}>
                            {msgSelectedIds.size} selected
                          </span>
                        )}
                      </label>
                      {msgSelectedIds.size > 0 && (
                        <span className="sh-a" style={{ color: 'var(--text3)', fontSize: '12px' }} onClick={() => setMsgSelectedIds(new Set())}>Clear all</span>
                      )}
                    </div>

                    {/* Quick-select chips */}
                    <div style={{ display: 'flex', gap: '6px', marginBottom: '10px', flexWrap: 'wrap' }}>
                      {[{ l: 'All Spark', p: 'spark' }, { l: 'All Forge', p: 'forge' }, { l: 'All Apex', p: 'apex' }, { l: 'All Anchor', p: 'anchor' }, { l: 'Everyone', p: null }].map(q => {
                        const count = students.filter(s => q.p ? s.plan === q.p : true).length;
                        const allSel = count > 0 && students.filter(s => q.p ? s.plan === q.p : true).every(s => msgSelectedIds.has(s.id));
                        return (
                          <button key={q.l}
                            onClick={() => setMsgSelectedIds(new Set(students.filter(s => q.p ? s.plan === q.p : true).map(s => s.id)))}
                            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 12px', borderRadius: '6px', border: '1px solid', fontSize: '12.5px', fontWeight: 500, cursor: 'pointer', transition: 'all .14s',
                              borderColor: allSel ? 'var(--navy)' : 'var(--b)',
                              background: allSel ? 'var(--navy)' : 'var(--cream2)',
                              color: allSel ? '#FDF8F0' : 'var(--text2)' }}>
                            {q.l}
                            <span style={{ fontSize: '11px', opacity: .7 }}>({count})</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Search */}
                    <input className="fi" type="text" placeholder="Search by name..." value={msgSearch} onChange={e => setMsgSearch(e.target.value)} style={{ marginBottom: '0' }} />

                    {/* Student list */}
                    <div className="ms-list">
                      {filtered.length === 0
                        ? <div style={{ padding: '14px', textAlign: 'center', fontSize: '13px', color: 'var(--text3)' }}>No students match</div>
                        : filtered.map(s => {
                            const isSel = msgSelectedIds.has(s.id);
                            return (
                              <div key={s.id} className={'ms-row' + (isSel ? ' on' : '')} onClick={() => toggleMsgStudent(s.id)}>
                                <div className={'ms-cb' + (isSel ? ' on' : '')}>
                                  {isSel && <Check size={9} strokeWidth={3} style={{ color: '#FDF8F0' }} />}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.name}</div>
                                  <div style={{ fontSize: '11.5px', color: 'var(--text3)' }}>{s.plan} · {s.examTarget || '—'}</div>
                                </div>
                              </div>
                            );
                          })
                      }
                    </div>
                  </div>
                )}

                {/* Type */}
                <div className="fg">
                  <label>Type</label>
                  <select className="fi" value={msgType} onChange={e => setMsgType(e.target.value)}>
                    <option>Announcement</option>
                    <option>Reminder</option>
                    <option>Motivational Note</option>
                    <option>Schedule Update</option>
                  </select>
                </div>

                {/* Message — full width */}
                <div className="fg">
                  <label>
                    Message
                    <span style={{ float: 'right', fontWeight: 400, color: msgContent.length > 400 ? 'var(--orange)' : 'var(--text3)' }}>{msgContent.length} / 500</span>
                  </label>
                  <textarea className="fi" rows={5} placeholder="Write your message..." value={msgContent} onChange={e => setMsgContent(e.target.value)} style={{ resize: 'vertical', width: '100%', boxSizing: 'border-box' }} />
                </div>

                {/* Status + Send */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '14px' }}>
                  <span style={{ fontSize: '12.5px', color: canSend ? 'var(--text3)' : 'var(--red)' }}>
                    {canSend
                      ? (msgMode === 'select' ? msgSelectedIds.size : recipientCount) + ' recipient' + ((msgMode === 'select' ? msgSelectedIds.size : recipientCount) !== 1 ? 's' : '')
                      : (!msgContent.trim() ? 'Write a message to continue' : 'Select at least one student')}
                  </span>
                  <button className="btn btn-gold btn-sm" disabled={!canSend || msgSending} onClick={sendMessage} style={{ opacity: !canSend ? 0.5 : 1 }}>
                    {msgSending ? 'Sending…' : 'Send Message →'}
                  </button>
                </div>
                </div>
              </div>

              {/* ── History card ── */}
              <div className="card msg-card-anim-2" style={{ boxShadow: '0 4px 24px rgba(15,31,61,.09)' }}>
                {/* Toggle header */}
                <div className="msg-hist-toggle-row" onClick={() => setShowHistory(v => !v)}>
                  <div className="sh-t">
                    Message History
                    {sentMessages.length > 0 && <span style={{ fontFamily: 'var(--fb)', fontSize: '13px', fontWeight: 400, color: 'var(--text3)', marginLeft: '10px' }}>{sentMessages.length} sent</span>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {sentMessages.length > 0 && !showHistory && (
                      <span style={{ fontSize: '12px', color: 'var(--text3)' }}>Click to view</span>
                    )}
                    <ChevronDown size={16} strokeWidth={2} style={{ color: 'var(--text3)', transition: 'transform .2s', transform: showHistory ? 'rotate(180deg)' : '' }} />
                  </div>
                </div>

                {/* Expanded panel */}
                {showHistory && (
                  <div className="msg-hist-open" style={{ marginTop: '16px' }}>
                    {/* Filters */}
                    <div style={{ border: '1px solid var(--b)', borderRadius: '10px', overflow: 'hidden', marginBottom: '14px' }}>
                      <div style={{ display: 'flex', alignItems: 'stretch', background: 'var(--cream)' }}>
                        {/* Filter label */}
                        <div style={{ display: 'flex', alignItems: 'center', padding: '0 16px', background: 'var(--navy)', borderRight: '1px solid rgba(255,255,255,.1)', flexShrink: 0 }}>
                          <span style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(253,248,240,.7)', textTransform: 'uppercase', letterSpacing: '.08em' }}>Filter</span>
                        </div>
                        {/* Type */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRight: '1px solid var(--b)', flexShrink: 0 }}>
                          <span style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--text3)' }}>Type</span>
                          <select className="fi" value={histTypeFilter} onChange={e => setHistTypeFilter(e.target.value)} style={{ padding: '5px 10px', fontSize: '12.5px', width: 'auto', margin: 0 }}>
                            <option value="all">All</option>
                            <option>Session Request</option>
                            <option>Announcement</option>
                            <option>Reminder</option>
                            <option>Motivational Note</option>
                            <option>Schedule Update</option>
                          </select>
                        </div>
                        {/* Plan */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRight: '1px solid var(--b)', flexShrink: 0 }}>
                          <span style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--text3)' }}>Plan</span>
                          <select className="fi" value={histPlanFilter} onChange={e => setHistPlanFilter(e.target.value)} style={{ padding: '5px 10px', fontSize: '12.5px', width: 'auto', margin: 0 }}>
                            <option value="all">All</option>
                            <option value="spark">Spark</option>
                            <option value="forge">Forge</option>
                            <option value="apex">Apex</option>
                            <option value="anchor">Anchor</option>
                          </select>
                        </div>
                        {/* Clear + count */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 16px', marginLeft: 'auto' }}>
                          {(histTypeFilter !== 'all' || histPlanFilter !== 'all') && (
                            <button onClick={() => { setHistTypeFilter('all'); setHistPlanFilter('all'); }} style={{ padding: '4px 12px', borderRadius: '6px', border: '1px solid var(--b)', background: 'var(--cream2)', color: 'var(--text2)', fontSize: '12px', fontWeight: 600, cursor: 'pointer', transition: 'all .12s' }}>
                              Reset
                            </button>
                          )}
                          <span style={{ fontSize: '12px', color: 'var(--text3)', whiteSpace: 'nowrap' }}>
                            <strong style={{ color: 'var(--text)', fontWeight: 700 }}>{histFiltered.length}</strong> result{histFiltered.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Rows */}
                    {histFiltered.length === 0 ? (
                      <div style={{ padding: '28px 0', textAlign: 'center', color: 'var(--text3)', fontSize: '13px' }}>
                        {sentMessages.length === 0 ? 'No messages sent yet.' : 'No messages match these filters.'}
                      </div>
                    ) : (
                      <div style={{ border: '1px solid var(--b)', borderRadius: '10px', overflow: 'hidden' }}>
                        {histFiltered.map((m, i) => (
                          <div key={m.id} className="mh-row msg-row-anim" style={{ animationDelay: (i * 0.04) + 's', background: i % 2 === 0 ? 'var(--cream)' : 'var(--cream2)' }}>
                            <div className="mh-dot msg-dot-anim" style={{ background: TYPE_DOT[m.type] || 'var(--navy3)', animationDelay: (i * 0.04 + 0.1) + 's' }} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '3px' }}>
                                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>{m.type}</span>
                                <span style={{ fontSize: '12px', background: 'var(--cream2)', border: '1px solid var(--b)', borderRadius: '20px', padding: '1px 9px', color: 'var(--text2)' }}>→ {m.recipient}</span>
                                <span style={{ fontSize: '11.5px', color: 'var(--text3)', marginLeft: 'auto', flexShrink: 0 }}>{timeAgo(m.createdAt)}</span>
                              </div>
                              <div style={{ fontSize: '13px', color: 'var(--text2)', lineHeight: 1.55, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{m.content}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })()}
      </div>

      {/* ══ ADMIN ACCOUNTS (SUPER ONLY) ══ */}
      <div className={pg(isSuperAdmin ? 'admins' : '__never__')} id="p-admins">
        <div style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.25)', borderRadius: 'var(--rl)', padding: '14px 18px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Lock size={16} strokeWidth={2} style={{ color: '#7c3aed' }} />
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
          <Lock size={16} strokeWidth={2} style={{ color: '#7c3aed' }} />
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
                {accessLog.length === 0 ? (
                  <div style={{ fontSize: '13px', color: 'var(--text3)', padding: '10px 0' }}>
                    No admin activity recorded yet. Actions (logins, approvals, assignments, messages) will appear here automatically.
                  </div>
                ) : accessLog.slice(0, 8).map((e, i, arr) => (
                  <div key={e.id} style={{ padding: '9px 0', borderBottom: i < arr.length - 1 ? '1px solid var(--b)' : 'none', fontSize: '12.5px' }}>
                    <span style={{ color: 'var(--text)', fontWeight: '600' }}>{e.adminName}</span>{' '}
                    <span style={{ color: 'var(--text3)' }}>{ACTION_LABEL[e.action] || e.action}{e.target ? ` ${e.target}` : ''}</span>
                    <span style={{ color: 'var(--text3)', marginLeft: 'auto', float: 'right', fontSize: '11px' }}>{fmtLogTime(e.createdAt)}</span>
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
          const approvedReports  = parentReports.filter(r => r.status === 'approved' || r.status === 'sent');
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
                  {[`Pending Review (${submittedReports.length})`, `Approved & Sent (${approvedReports.length})`, `All (${parentReports.length})`].map((t, i) => (
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
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
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

      <DiagnosticModal modal={diagModal} loading={diagLoading} onClose={() => setDiagModal(null)}
        onReset={async () => {
          if (!diagModal?.data) return;
          if (!window.confirm('Reset this student\'s diagnostic? They can retake immediately.')) return;
          const token = localStorage.getItem('token');
          const adminId = profile?.id;
          const r = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/${adminId}/student/${diagModal.data._userId}/diagnostic`, {
            method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
          });
          if (r.ok) { setDiagModal(null); onShowToast?.('Diagnostic reset. Student can retake now.'); }
        }}
      />

      {/* ══════════ SESSION REQUESTS ══════════ */}
      {activePage === 'session-requests' && (
        <SessionRequestsPage
          requests={sessionRequests}
          facultyList={facultyList}
          userId={profile?.id}
          onShowToast={onShowToast}
          onUpdated={onSessionRequestsUpdated}
        />
      )}

      {/* ══════════ PLAN GRANT (superadmin) ══════════ */}
      {planGrantStudent && (
        <AdminPlanGrantModal
          student={planGrantStudent}
          adminUserId={profile?.id}
          onClose={() => setPlanGrantStudent(null)}
          onShowToast={onShowToast}
          onPlanUpdated={onStudentPlanUpdated}
        />
      )}

      {perfFaculty && (
        <FacultyPerformance
          faculty={perfFaculty}
          adminId={profile?.id}
          onClose={() => setPerfFaculty(null)}
          onShowToast={onShowToast}
        />
      )}

      {mentorModalStudent && (
        <AdminMentorAssignModal
          student={mentorModalStudent}
          facultyList={facultyList}
          saving={savingMentor}
          onClose={() => setMentorModalStudent(null)}
          onSave={async (mentorId) => {
            setSavingMentor(true);
            try {
              const token = localStorage.getItem('token');
              const r = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/${profile?.id}/student/${mentorModalStudent.userId}/mentor`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ mentorId: mentorId || null }),
              });
              const data = await r.json();
              if (!r.ok) throw new Error(data.error || 'Failed');
              onStudentMentorUpdated?.(mentorModalStudent.userId, data.mentorId, data.mentorName);
              onShowToast(data.mentorName ? `Mentor: ${data.mentorName} ✓` : 'Mentor removed ✓');
              setMentorModalStudent(null);
            } catch {
              onShowToast('Failed to save');
            } finally {
              setSavingMentor(false);
            }
          }}
        />
      )}

      {facultyModalStudent && (
        <AdminFacultyAssignModal
          student={facultyModalStudent}
          facultyList={facultyList}
          saving={savingFaculty}
          onClose={() => setFacultyModalStudent(null)}
          onSave={async (selections) => {
            setSavingFaculty(true);
            try {
              const token = localStorage.getItem('token');
              const entries = Object.entries(selections);
              for (const [subject, facultyId] of entries) {
                const r = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/${profile?.id}/student/${facultyModalStudent.userId}/subject-faculty`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                  body: JSON.stringify({ subject, facultyId: facultyId || null }),
                });
                const data = await r.json();
                if (!r.ok) throw new Error(data.error || 'Failed');
                onStudentSubjectFacultyUpdated?.(facultyModalStudent.userId, data.subjectFaculty);
              }
              onShowToast('Faculty assignments saved ✓');
              setFacultyModalStudent(null);
            } catch {
              onShowToast('Failed to save');
            } finally {
              setSavingFaculty(false);
            }
          }}
        />
      )}
    </div>
    </>
  )
};

// ── Session Requests Page ────────────────────────────────────────────────────
const SessionRequestsPage = ({ requests, facultyList, userId, onShowToast, onUpdated }) => {
  const [assigningId, setAssigningId] = useState(null);
  const [faculty, setFaculty] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('10:00');
  const [duration, setDuration] = useState(60);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [statusFilter, setStatusFilter] = useState('pending');

  const adminUserId = userId;

  const openAssign = (id) => {
    setAssigningId(id); setFaculty(''); setDate(''); setTime('10:00'); setDuration(60); setNote('');
  };

  const assign = async (req) => {
    if (!faculty || !date) { onShowToast('Pick a faculty and date first'); return; }
    setSaving(true);
    const token = localStorage.getItem('token');
    try {
      // Build scheduledAt as IST
      const [h, m] = time.split(':').map(Number);
      const [y, mo, d] = date.split('-').map(Number);
      const istMs = Date.UTC(y, mo - 1, d, h, m) - 5.5 * 3600000;
      const scheduledAt = new Date(istMs).toISOString();

      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/${adminUserId}/session-requests/${req.id}/assign`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ facultyId: parseInt(faculty), scheduledAt, durationMin: duration, adminNote: note }),
      });
      const data = await res.json();

      if (res.status === 409 && data.conflicts) {
        onShowToast(`⚠️ Conflict: ${data.conflicts[0]}`);
        return;
      }
      if (!res.ok) throw new Error(data.error || 'Failed');

      onUpdated(prev => prev.map(r => r.id === req.id
        ? { ...r, status: 'assigned', facultyId: parseInt(faculty), facultyName: facultyList.find(f => f.id === parseInt(faculty))?.name, scheduledAt, durationMin: duration, adminNote: note, assignedAt: new Date().toISOString() }
        : r
      ));
      setAssigningId(null);
      onShowToast(`Session assigned & student notified ✓`);
    } catch (err) {
      onShowToast(`Failed: ${err.message}`);
    } finally { setSaving(false); }
  };

  const updateStatus = async (id, status) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/${adminUserId}/session-requests/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
      onUpdated(prev => prev.map(r => r.id === id ? { ...r, status } : r));
      onShowToast(`Marked as ${status}`);
    } catch { onShowToast('Failed to update status'); }
  };

  const fmtDt = (iso) => iso ? new Date(iso).toLocaleString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' }) : '—';
  const timeAgo = (iso) => { const s = Math.floor((Date.now() - new Date(iso)) / 1000); if (s < 3600) return Math.floor(s/60) + 'm ago'; if (s < 86400) return Math.floor(s/3600) + 'h ago'; return Math.floor(s/86400) + 'd ago'; };

  const STATUS_COLOR = { pending: '#F97316', assigned: '#3B82F6', done: '#22C55E', cancelled: '#94A3B8' };
  const STATUS_BG    = { pending: 'rgba(249,115,22,.1)', assigned: 'rgba(59,130,246,.1)', done: 'rgba(34,197,94,.1)', cancelled: 'rgba(148,163,184,.1)' };

  const filtered = requests.filter(r => statusFilter === 'all' || r.status === statusFilter);
  const pendingCount = requests.filter(r => r.status === 'pending').length;

  return (
    <div style={{ padding: '0' }}>
      {/* Header */}
      <div style={{ marginBottom: '22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ fontFamily: 'var(--fs)', fontSize: '22px', fontWeight: 700, color: 'var(--text)', marginBottom: '4px' }}>Session Requests</div>
          <div style={{ fontSize: '13px', color: 'var(--text3)' }}>
            {pendingCount > 0 ? <span style={{ color: '#F97316', fontWeight: 600 }}>{pendingCount} pending</span> : 'All caught up'} · {requests.length} total
          </div>
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          {['pending', 'assigned', 'done', 'all'].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)} style={{ padding: '6px 14px', borderRadius: '20px', border: `1px solid ${statusFilter === s ? STATUS_COLOR[s] || 'var(--navy)' : 'var(--b)'}`, background: statusFilter === s ? STATUS_BG[s] || 'rgba(15,31,61,.08)' : 'transparent', color: statusFilter === s ? STATUS_COLOR[s] || 'var(--text)' : 'var(--text3)', fontSize: '12px', fontWeight: 600, cursor: 'pointer', textTransform: 'capitalize' }}>
              {s}{s !== 'all' && <span style={{ marginLeft: '5px', opacity: .7 }}>{requests.filter(r => r.status === s).length}</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text3)' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--cream2)', border: '1px solid var(--b)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', opacity: .5 }}>
            <FileText size={20} strokeWidth={1.5} />
          </div>
          <div style={{ fontWeight: 600, marginBottom: '4px', color: 'var(--text2)' }}>No {statusFilter !== 'all' ? statusFilter : ''} requests</div>
          <div style={{ fontSize: '12.5px' }}>Student session requests will show up here.</div>
        </div>
      )}

      {/* Request cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {filtered.map(req => (
          <div key={req.id} style={{ background: 'var(--cream)', border: '1px solid var(--b)', borderRadius: 'var(--rl)', overflow: 'hidden', boxShadow: 'var(--sh)' }}>
            {/* Card header */}
            <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'var(--navy)', color: 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--fs)', fontSize: '15px', fontWeight: 700, flexShrink: 0 }}>{req.studentName?.[0]}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 600, color: 'var(--text)', fontSize: '14px' }}>{req.studentName}</span>
                  <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 7px', borderRadius: '20px', background: 'rgba(99,102,241,.1)', color: '#6366F1', textTransform: 'uppercase' }}>{req.studentPlan}</span>
                  <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '20px', background: STATUS_BG[req.status], color: STATUS_COLOR[req.status], textTransform: 'capitalize' }}>{req.status}</span>
                  <span style={{ fontSize: '11px', color: 'var(--text3)', marginLeft: 'auto' }}>{timeAgo(req.createdAt)}</span>
                </div>
                <div style={{ fontSize: '13.5px', color: 'var(--text2)', lineHeight: 1.6, marginBottom: '6px' }}>
                  <strong style={{ color: 'var(--text)' }}>Topic:</strong> {req.topic}
                </div>
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '12px', color: 'var(--text3)', alignItems: 'center' }}>
                  {req.phone && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Phone size={11} strokeWidth={2} />
                      {req.phone}
                    </span>
                  )}
                  {req.preferredTime && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Clock size={11} strokeWidth={2} />
                      {req.preferredTime}
                    </span>
                  )}
                  {req.status === 'assigned' && req.scheduledAt && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#3B82F6', fontWeight: 600 }}>
                      <Calendar size={11} strokeWidth={2} />
                      {fmtDt(req.scheduledAt)} · {req.durationMin}min · {req.facultyName}
                    </span>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                {req.status === 'pending' && (
                  <button className="btn btn-gold btn-sm" onClick={() => openAssign(req.id)}>Assign →</button>
                )}
                {req.status === 'assigned' && (
                  <button className="btn btn-ghost btn-sm" onClick={() => updateStatus(req.id, 'done')} style={{ color: '#22C55E', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Check size={12} strokeWidth={2.5} />
                    Mark Done</button>
                )}
                {(req.status === 'pending' || req.status === 'assigned') && (
                  <button className="btn btn-ghost btn-sm" onClick={() => updateStatus(req.id, 'cancelled')} style={{ color: 'var(--red)', fontSize: '11px' }}>Cancel</button>
                )}
              </div>
            </div>

            {/* Assign form — inline expand */}
            {assigningId === req.id && (
              <div style={{ borderTop: '1px solid var(--b)', background: 'var(--cream2)', padding: '18px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.07em' }}>Assign Session</div>
                  {req.preferredTime && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--gold)', background: 'var(--gold-dim)', border: '1px solid var(--gold-b)', borderRadius: '20px', padding: '3px 10px', fontWeight: 600 }}>
                      <Clock size={11} strokeWidth={2} />
                      Student prefers: {req.preferredTime}
                    </div>
                  )}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text2)', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '.05em' }}>Faculty *</label>
                    <select className="finput" value={faculty} onChange={e => setFaculty(e.target.value)} style={{ fontSize: '13px' }}>
                      <option value="">— Select faculty —</option>
                      {facultyList.map(f => <option key={f.id} value={f.id}>{f.name} {f.subject ? `· ${f.subject}` : ''}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text2)', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '.05em' }}>Duration</label>
                    <select className="finput" value={duration} onChange={e => setDuration(Number(e.target.value))} style={{ fontSize: '13px' }}>
                      {[30,45,60,90].map(d => <option key={d} value={d}>{d} minutes</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text2)', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '.05em' }}>Date *</label>
                    <input type="date" className="finput" value={date} onChange={e => setDate(e.target.value)} style={{ fontSize: '13px' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text2)', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '.05em' }}>Time (IST)</label>
                    {/* Quick time chips */}
                    <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginBottom: '7px' }}>
                      {[['9:00','9 AM'],['10:00','10 AM'],['11:00','11 AM'],['14:00','2 PM'],['16:00','4 PM'],['18:00','6 PM'],['19:00','7 PM'],['20:00','8 PM']].map(([val, label]) => (
                        <button key={val} type="button" onClick={() => setTime(val)} style={{ padding: '3px 9px', borderRadius: '20px', fontSize: '11px', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--fb)', background: time === val ? 'var(--navy)' : 'var(--cream3)', color: time === val ? 'var(--gold)' : 'var(--text3)', border: time === val ? '1px solid var(--navy)' : '1px solid var(--b)', transition: 'all .12s' }}>
                          {label}
                        </button>
                      ))}
                    </div>
                    <input type="time" className="finput" value={time} onChange={e => setTime(e.target.value)} style={{ fontSize: '13px' }} />
                  </div>
                </div>
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text2)', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '.05em' }}>Note for student <span style={{ fontWeight: 400, opacity: .6 }}>(optional)</span></label>
                  <input type="text" className="finput" placeholder="e.g. Join via Google Meet — link will be sent on WhatsApp" value={note} onChange={e => setNote(e.target.value)} style={{ fontSize: '13px' }} />
                </div>
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => setAssigningId(null)}>Cancel</button>
                  <button className="btn btn-gold btn-sm" disabled={saving || !faculty || !date} onClick={() => assign(req)}>
                    {saving ? 'Checking & Assigning…' : 'Check & Assign →'}
                  </button>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '8px', textAlign: 'right' }}>
                  If faculty has an existing session or call at this time, you'll see a warning before it saves.
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

    </div>
  );
};

export default AdminContent;
