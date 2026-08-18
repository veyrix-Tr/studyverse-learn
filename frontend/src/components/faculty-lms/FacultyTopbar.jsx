import { useParams, useNavigate } from 'react-router-dom';

const PAGE_TITLES = {
  dashboard:     'Dashboard',
  schedule:      'Schedule',
  students:      'My Students',
  doubts:        'Doubt Queue',
  resources:     'Resources',
  tests:         'Assign Tests',
  reports:       'Weekly Reports',
  feedback:      'Weekly Feedback',
  mentor:        'My Mentees',
  notifications: 'Notifications',
};

const PAGE_ICONS = {
  dashboard:     <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>,
  schedule:      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>,
  doubts:        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  mentor:        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  notifications: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
};

const FacultyTopbar = ({
  activePage, onOpenModal, onNav, onShowToast,
  pendingDoubts = 0,
  sessions = [],
  mentorStudents = [],
  alerts = [],
  onMenuClick,
}) => {
  const title = PAGE_TITLES[activePage] || 'Dashboard';
  const icon  = PAGE_ICONS[activePage] || null;
  const { id: userId } = useParams();
  const navigate = useNavigate();

  const now = Date.now();

  // Find live class session
  const liveSession = sessions.find(s => {
    const start = new Date(s.scheduledAt).getTime();
    return now >= start && now <= start + (s.duration || 60) * 60000;
  });
  const upcomingSession = !liveSession && sessions.find(s => {
    const start = new Date(s.scheduledAt).getTime();
    return start > now && start - now <= 15 * 60000;
  });
  // Find live mentor call
  const liveMentorCall = mentorStudents.find(s => {
    if (!s.nextCall?.zoomMeetingId) return false;
    const start = new Date(s.nextCall.scheduledAt).getTime();
    const end   = start + s.nextCall.durationMin * 60000;
    return now >= start - 10 * 60000 && now <= end;
  });

  const canJoin = liveSession?.zoomMeetingId || upcomingSession?.zoomMeetingId || liveMentorCall?.nextCall?.zoomMeetingId;
  const joinLabel = liveSession ? 'Join Live Session'
    : upcomingSession ? 'Start Soon'
    : liveMentorCall ? `Join Call · ${liveMentorCall.name}`
    : 'No Live Session';

  const handleJoin = () => {
    if (liveSession?.zoomMeetingId)          { navigate(`/faculty/${userId}/live/${liveSession.id}`); return; }
    if (upcomingSession?.zoomMeetingId)      { navigate(`/faculty/${userId}/live/${upcomingSession.id}`); return; }
    if (liveMentorCall?.nextCall?.zoomMeetingId) { navigate(`/faculty/${userId}/call/${liveMentorCall.nextCall.id}`); return; }
    onShowToast('No live session right now. Set it up in the schedule modal.');
  };

  const unread = alerts.filter(a => !a.readAt).length;

  return (
    <header className="fac-topbar">
      <button className="fac-tb-hamburger" onClick={onMenuClick} aria-label="Open menu">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
      </button>
      <div className="fac-tb-page">
        <div className="fac-tb-bar" />
        {icon && <span className="fac-tb-icon">{icon}</span>}
        <span className="fac-tb-title">{title}</span>
      </div>

      <div className="fac-tbr">
        {pendingDoubts > 0 && (
          <div className="fac-tb-doubts" onClick={() => onNav('doubts')}>
            <span className="fac-tb-doubts-dot" />
            <span className="fac-tb-doubts-label">{pendingDoubts} doubt{pendingDoubts !== 1 ? 's' : ''} pending</span>
          </div>
        )}

        <button
          className="fac-tb-live"
          onClick={handleJoin}
          style={{ opacity: canJoin ? 1 : 0.55, cursor: canJoin ? 'pointer' : 'default' }}
          title={canJoin ? 'Click to join' : 'No live session right now'}
        >
          {(liveSession || liveMentorCall) && <span className="fac-tb-live-ring" />}
          <span className="fac-tb-live-dot" />
          <span className="fac-tb-live-label">{joinLabel}</span>
        </button>

        <div className="fac-tbb" onClick={() => onOpenModal('quick-note-modal')} title="Quick note">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        </div>

        <div className="fac-tbb" style={{ position: 'relative' }} onClick={() => onNav('notifications')} title="Notifications">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
            stroke={unread > 0 ? 'var(--gold)' : 'currentColor'} strokeWidth="2">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
          {unread > 0 && (
            <span style={{
              position: 'absolute', top: '5px', right: '5px',
              minWidth: '14px', height: '14px', borderRadius: '99px',
              background: 'linear-gradient(135deg,var(--gold),var(--gold2))',
              border: '2px solid #0B3D35',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '8px', fontWeight: 800, color: 'var(--navy)',
              lineHeight: 1, padding: '0 2px', boxSizing: 'border-box',
            }}>
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </div>
      </div>
    </header>
  );
};

export default FacultyTopbar;
