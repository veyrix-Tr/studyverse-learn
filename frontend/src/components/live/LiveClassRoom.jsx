import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ZoomMtg } from '@zoom/meetingsdk';

const GOLD = '#E8A830';
const NAVY = '#0F1F3D';
const RED = '#e5484d';

// Local copy of the stored plan (avoid a circular import with App.jsx).
const storedPlan = () => {
  const token = localStorage.getItem('token');
  if (!token) return 'spark';
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return payload.plan || 'spark';
  } catch { return 'spark'; }
};

const fmtClock = (totalSeconds) => {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const pad = (n) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
};

// Client view in SDK 6.x loads its own required CSS/assets from Zoom's CDN;
// the legacy <link> injection for source.zoom.us/{ver}/css no longer exists.

// Zoom Client View — the "identical to the real Zoom app" experience. Unlike
// Component View, this isn't something we mount into a ref'd container: the
// SDK creates its own #zmmtg-root element on document.body and takes over the
// full screen with its own native UI, including a working toolbar (mic,
// camera, leave, and — for the host — record/lock) that we don't have to
// rebuild. We only render a small branded badge as a completely separate
// sibling element (never nested inside Zoom's own DOM), so React re-rendering
// it can never collide with anything Zoom is doing to its own tree.
let sdkPrepared = false;

const LiveClassRoom = ({ role, kind = 'session' }) => {
  const { id: userId, sessionId } = useParams();
  const navigate = useNavigate();
  const joinedRef = useRef(false);

  const [status, setStatus] = useState('loading'); // loading | joining | joined | error
  const [error, setError] = useState('');
  const [session, setSession] = useState(null); // { title, subject, duration, scheduledAt }
  const [elapsed, setElapsed] = useState(0);

  const apiBase = `${import.meta.env.VITE_API_URL}/api/${role}/${userId}`;
  const signUrl = `${apiBase}/${kind === 'call' ? 'mentor-calls' : 'sessions'}/${sessionId}/zoom-signature`;
  const studentHome = role === 'student' && storedPlan() === 'anchor' ? `/anchor/${userId}/dashboard` : `/student-v2/${userId}/dashboard`;
  const dashboardUrl = `${window.location.origin}${role === 'faculty' ? `/faculty/${userId}/dashboard` : studentHome}`;
  const backHome = () => navigate(role === 'faculty' ? `/faculty/${userId}/dashboard` : studentHome);

  useEffect(() => {
    // Guard against React 18 StrictMode's dev-only double-invoke, and against
    // re-preparing the SDK if this component ever remounts.
    if (joinedRef.current) return;
    joinedRef.current = true;

    async function run() {
      const token = localStorage.getItem('token');
      if (!token) { backHome(); return; }

      try {
        // 1. Who am I, for the SDK's userName
        const meRes = await fetch(`${apiBase}/me`, { headers: { Authorization: `Bearer ${token}` } });
        const me = meRes.ok ? await meRes.json() : null;

        // 2. Get a signed per-join token for this session
        const sigRes = await fetch(`${signUrl}`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
        const sigData = await sigRes.json();
        if (!sigRes.ok) throw new Error(sigData.error || 'Could not connect to this class');
        setSession({ title: sigData.title, subject: sigData.subject, duration: sigData.duration, scheduledAt: sigData.scheduledAt });

        setStatus('joining');

        if (!sdkPrepared) {
          sdkPrepared = true;
          ZoomMtg.preLoadWasm();
          ZoomMtg.prepareWebSDK();
          ZoomMtg.i18n.load('en-US');
        }

        // Zoom creates #zmmtg-root on import, hidden by default — show it now
        // that we're actually about to join.
        const root = document.getElementById('zmmtg-root');
        if (root) root.style.display = 'block';

        ZoomMtg.init({
          leaveUrl: dashboardUrl,
          patchJsMedia: true,
          leaveOnPageUnload: true,
          success: () => {
            ZoomMtg.join({
              signature: sigData.signature,
              meetingNumber: sigData.meetingNumber,
              passWord: sigData.password || '',
              userName: me?.name || (role === 'faculty' ? 'Faculty' : 'Student'),
              userEmail: me?.email || undefined,
              success: () => setStatus('joined'),
              error: (err) => {
                console.error('Zoom join failed:', err);
                setError(err?.reason || err?.errorMessage || 'Could not connect to this class.');
                setStatus('error');
              },
            });
          },
          error: (err) => {
            console.error('Zoom init failed:', err);
            setError(err?.reason || err?.errorMessage || 'Could not connect to this class.');
            setStatus('error');
          },
        });
      } catch (err) {
        console.error('Class join failed:', err);
        setError(err?.message || 'Could not connect to this class.');
        setStatus('error');
      }
    }

    run();

    return () => {
      // Best-effort leave + hide Zoom's root if this component unmounts
      // without the person having clicked Zoom's own Leave button.
      try { ZoomMtg.leaveMeeting({}); } catch { /* not in a meeting */ }
      const root = document.getElementById('zmmtg-root');
      if (root) root.style.display = 'none';
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  // Elapsed-time ticker for the badge, only while actually joined
  useEffect(() => {
    if (status !== 'joined') return;
    const id = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(id);
  }, [status]);

  return (
    <>
      {/* Pre-join loading / error state — this is our own element, separate
          from #zmmtg-root, shown while Zoom's UI is still hidden. */}
      {status !== 'joined' && (
        <div style={{ position: 'fixed', inset: 0, background: NAVY, zIndex: 500, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#fff', gap: '14px', padding: '20px', textAlign: 'center' }}>
          {status === 'error' ? (
            <>
              <div style={{ fontSize: '16px', fontWeight: 600 }}>Couldn't join this class</div>
              <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', maxWidth: '360px' }}>{error}</div>
              <button className="btn btn-gold btn-sm" onClick={backHome} style={{ marginTop: '8px' }}>Back to dashboard</button>
            </>
          ) : (
            <>
              <div style={{ width: '32px', height: '32px', border: '3px solid rgba(255,255,255,0.2)', borderTopColor: GOLD, borderRadius: '50%', animation: 'lcr-spin 0.8s linear infinite' }} />
              <div style={{ fontSize: '14px' }}>{status === 'joining' ? 'Connecting to your live class…' : 'Loading…'}</div>
            </>
          )}
        </div>
      )}

      {/* Small branded badge — a sibling of #zmmtg-root, never nested inside
          it, so it can re-render freely without touching Zoom's own DOM. */}
      {status === 'joined' && (
        <div style={{ position: 'fixed', top: '12px', left: '12px', zIndex: 100000, background: 'rgba(15,31,61,0.85)', color: '#fff', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px', pointerEvents: 'none' }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: RED, animation: 'lcr-pulse 1.5s infinite', flexShrink: 0 }} />
          <span style={{ fontWeight: 600 }}>{session?.title || 'Live Class'}</span>
          <span style={{ color: 'rgba(255,255,255,0.65)' }}>{fmtClock(elapsed)}</span>
        </div>
      )}

      <style>{`
        @keyframes lcr-spin { to { transform: rotate(360deg); } }
        @keyframes lcr-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
      `}</style>
    </>
  );
};

export default LiveClassRoom;