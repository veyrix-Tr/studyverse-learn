const FreeSidebar = ({ activePage, onNav, profile, onOpenModal }) => {
  const ni = (page) => `ni${activePage === page ? ' on' : ''}`;
  const name = profile?.name || 'Student';
  const initial = name.charAt(0).toUpperCase();
  const examTarget = profile?.studentProfile?.examTarget || '';
  const targetYear = profile?.studentProfile?.targetYear || '';
  const plan = profile?.studentProfile?.plan || 'spark';
  const isForge = plan === 'forge';

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/';
  };

  return (
    <aside className="sidebar">
      <div className="sb-logo">
        <svg className="sb-mark" viewBox="0 0 100 100" fill="none">
          <path d="M50 5L90 28V72L50 95L10 72V28L50 5Z" stroke="#E8A830" strokeWidth="6" strokeLinejoin="round"/>
          <path d="M68 32C68 32 60 25 50 25C40 25 32 32 32 40C32 55 68 50 68 65C68 73 60 80 50 80C40 80 32 73 32 73" stroke="#FDF8F0" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <div className="sb-words">
          <div className="w1">STUDY<span>VERSE</span></div>
          <div className="w2">JEE &amp; NEET</div>
        </div>
      </div>

      {isForge ? (
        <div style={{ margin: '10px 14px', borderRadius: '10px', padding: '12px 14px', background: 'linear-gradient(135deg, rgba(232,168,48,0.18) 0%, rgba(232,168,48,0.06) 100%)', border: '1px solid rgba(232,168,48,0.35)' }}>
          <div style={{ fontSize: '9.5px', color: 'rgba(253,248,240,0.45)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '5px' }}>Current Plan</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '3px' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#E8A830"><path d="M12 2 L13.8 10.2 L22 12 L13.8 13.8 L12 22 L10.2 13.8 L2 12 L10.2 10.2 Z"/></svg>
            <span style={{ fontSize: '16px', fontWeight: '800', color: '#E8A830', letterSpacing: '0.08em', fontFamily: 'var(--fb)', textTransform: 'uppercase' }}>Forge</span>
          </div>
          <div style={{ fontSize: '10.5px', color: 'rgba(253,248,240,0.45)', fontStyle: 'italic', marginBottom: '9px' }}>Build your score, problem by problem</div>
          <div onClick={() => onNav('plans')} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#E8A830', cursor: 'pointer', fontWeight: '600' }}>
            Upgrade to Apex
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </div>
        </div>
      ) : (
        <div style={{ margin: '10px 14px', borderRadius: '10px', padding: '12px 14px', background: 'linear-gradient(135deg, rgba(232,168,48,0.12) 0%, rgba(232,168,48,0.04) 100%)', border: '1px solid rgba(232,168,48,0.25)' }}>
          <div style={{ fontSize: '9.5px', color: 'rgba(253,248,240,0.45)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '5px' }}>Current Plan</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '3px' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#E8A830" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
            <span style={{ fontSize: '16px', fontWeight: '800', color: '#E8A830', letterSpacing: '0.08em', fontFamily: 'var(--fb)', textTransform: 'uppercase' }}>Spark</span>
          </div>
          <div style={{ fontSize: '10.5px', color: 'rgba(253,248,240,0.45)', fontStyle: 'italic', marginBottom: '9px' }}>Diagnostic, topic map & study plan</div>
          <div onClick={() => onNav('plans')} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#E8A830', cursor: 'pointer', fontWeight: '600' }}>
            Upgrade for more
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </div>
        </div>
      )}

      <div className="nb">
        <div className="nl">My Learning</div>
        <div className={ni('home')} onClick={() => onNav('home')}>
          <svg className="nic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>
          Dashboard
        </div>
        <div className={ni('diagnostic')} onClick={() => onNav('diagnostic')}>
          <svg className="nic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
          Diagnostic Test
          <span className="nbadge free">Free</span>
        </div>
        <div className={ni('topics')} onClick={() => onNav('topics')}>
          <svg className="nic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
          Topic Map
          <span className="nbadge free">Free</span>
        </div>
        <div className={ni('guidance')} onClick={() => onNav('guidance')}>
          <svg className="nic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
          Study Guidance
          <span className="nbadge free">Free</span>
        </div>
        <div className={ni('habits')} onClick={() => onNav('habits')}>
          <svg className="nic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.31-8.86c-1.77-.45-2.34-.94-2.34-1.67 0-.84.79-1.43 2.1-1.43 1.38 0 1.9.66 1.94 1.64h1.71c-.05-1.34-.87-2.57-2.49-2.97V5H10.9v1.69c-1.51.32-2.72 1.3-2.72 2.81 0 1.79 1.49 2.69 3.66 3.21 1.95.46 2.34 1.15 2.34 1.86 0 .53-.39 1.39-2.1 1.39-1.6 0-2.23-.72-2.32-1.64H8.04c.1 1.7 1.36 2.66 2.86 2.97V19h2.34v-1.67c1.52-.29 2.72-1.16 2.73-2.77-.01-2.2-1.9-2.96-3.66-3.42z"/></svg>
          Habit Tracker
          <span className="nbadge free">Free</span>
        </div>
      </div>

      <div className="nb">
        <div className="nl">{isForge ? 'Forge Features' : 'Unlock More'}</div>
        <div className={ni('questions')} onClick={() => onNav('questions')}>
          <svg className="nic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01"/></svg>
          Question Bank
          {!isForge && <span className="nbadge lock"><svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg> Unlock</span>}
        </div>
        <div className={ni('tests')} onClick={() => onNav('tests')}>
          <svg className="nic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
          Weekly Tests
          {!isForge && <span className="nbadge lock"><svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg> Unlock</span>}
        </div>
        <div className={ni('resources')} onClick={() => onNav('resources')}>
          <svg className="nic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          Resources
          {!isForge && <span className="nbadge lock"><svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg> Unlock</span>}
        </div>
        <div className={ni('progress')} onClick={() => onNav('progress')}>
          <svg className="nic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {isForge
              ? <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
              : <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></>}
          </svg>
          {isForge ? 'Score Journey' : 'Mentorship'}
          {!isForge && <span className="nbadge lock"><svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg> Unlock</span>}
        </div>
      </div>

      <div className="nb">
        <div className="nl">Sessions & Plans</div>
        <div className={ni('sessions')} onClick={() => onNav('sessions')}>
          <svg className="nic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          Book a Session
        </div>
        <div className={ni('plans')} onClick={() => onNav('plans')}>
          <svg className="nic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          See All Plans
        </div>
      </div>


      <div className="sb-bottom">
        <div className="sb-user">
          <div className="sb-av">{initial}</div>
          <div>
            <div className="sb-uname">{name}</div>
            <div className="sb-uexam">{examTarget}{targetYear ? ` ${targetYear}` : ''} • {isForge ? 'Forge' : 'Spark'} Plan</div>
          </div>
        </div>
        <div className="logout-btn" onClick={handleLogout}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>
          Sign Out
        </div>
      </div>
    </aside>
  );
};

export default FreeSidebar;
