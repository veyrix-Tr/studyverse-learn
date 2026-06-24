import React from 'react';

const pageTitles = {
  home: 'Dashboard',
  diagnostic: 'Diagnostic Test',
  topics: 'Topic Map',
  guidance: 'Study Guidance',
  habits: 'Habit Tracker',
  questions: 'Question Bank',
  sessions: 'Book a Session',
  resources: 'Resources',
  plans: 'Plans & Pricing',
  notif: 'Notifications',
};

const FreeTopbar = ({ activePage, onNav, unreadCount = 0 }) => (
  <header className="topbar">
    <style dangerouslySetInnerHTML={{ __html:
      '@keyframes nfBell{0%,100%{transform:rotate(0) scale(1)}10%{transform:rotate(-18deg) scale(1.15)}20%{transform:rotate(14deg)}30%{transform:rotate(-10deg)}40%{transform:rotate(7deg)}50%{transform:rotate(-4deg)}60%{transform:rotate(2deg)}70%{transform:rotate(0)}100%{transform:rotate(0) scale(1)}}' +
      '@keyframes nfBadgePop{from{transform:scale(0)}60%{transform:scale(1.25)}to{transform:scale(1)}}' +
      '@keyframes nfDotPulse{0%,100%{box-shadow:0 0 0 0 rgba(232,168,48,.5)}70%{box-shadow:0 0 0 5px rgba(232,168,48,0)}}' +
      '.nf-bell{transition:color .2s}' +
      '.nf-bell.ringing{animation:nfBell .7s cubic-bezier(.36,.07,.19,.97) both}' +
      '.nf-badge{animation:nfBadgePop .35s cubic-bezier(.34,1.56,.64,1) both;animation:nfDotPulse 2s ease infinite}'
    }} />
    <div className="ph">{pageTitles[activePage] || 'Dashboard'}</div>
    <div className="tbr">
      <div className="tbb" onClick={() => onNav('notif')} style={{ position: 'relative' }}>
        <svg
          className={'nf-bell' + (unreadCount > 0 ? ' ringing' : '')}
          width="16" height="16" viewBox="0 0 24 24" fill="none"
          stroke={unreadCount > 0 ? 'var(--gold)' : 'currentColor'}
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        {unreadCount > 0 && (
          <span
            className="nf-badge"
            style={{
              position: 'absolute', top: '4px', right: '4px',
              minWidth: '16px', height: '16px', borderRadius: '99px',
              background: 'var(--gold)', border: '2px solid var(--cream)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '9px', fontWeight: 800, color: 'var(--navy)',
              lineHeight: 1, padding: '0 3px', boxSizing: 'border-box',
            }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </div>
    </div>
  </header>
);

export default FreeTopbar;
