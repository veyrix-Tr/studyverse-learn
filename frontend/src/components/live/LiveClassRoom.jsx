import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

// Embedded Zoom call — students/faculty never see zoom.us, just this page.
const LiveClassRoom = ({ role }) => {
  const { id: userId, sessionId } = useParams();
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const clientRef = useRef(null);
  const joinedRef = useRef(false);
  const [status, setStatus] = useState('loading'); // loading | joining | joined | error
  const [error, setError] = useState('');

  const apiBase = `${import.meta.env.VITE_API_URL}/api/${role}/${userId}`;
  const backHome = () => navigate(role === 'faculty' ? `/faculty/${userId}/dashboard` : `/student-v2/${userId}/dashboard`);

  useEffect(() => {
    // Guard against React 18 StrictMode's dev-only double-invoke (mount → cleanup →
    // re-mount). We only want the real join to run once per component instance, and
    // the join must not be aborted partway through by that phantom first cleanup —
    // Zoom's SDK has no cheap way to cancel an in-flight init/join, so we just let it run.
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
        const sigRes = await fetch(`${apiBase}/sessions/${sessionId}/zoom-signature`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
        const sigData = await sigRes.json();
        if (!sigRes.ok) throw new Error(sigData.error || 'Could not connect to this class');

        setStatus('joining');

        // 3. Load the SDK and join, embedded inside our own container
        const { default: ZoomMtgEmbedded } = await import('@zoom/meetingsdk/embedded');
        const client = ZoomMtgEmbedded.createClient();
        clientRef.current = client;

        await client.init({
          zoomAppRoot: containerRef.current,
          language: 'en-US',
          customize: {
            video: {
              isResizable: true,
              popper: { disableDraggable: false },
            },
          },
        });

        await client.join({
          signature: sigData.signature,
          sdkKey: sigData.sdkKey,
          meetingNumber: sigData.meetingNumber,
          password: sigData.password || '',
          userName: me?.name || (role === 'faculty' ? 'Faculty' : 'Student'),
          userEmail: me?.email || undefined,
        });

        setStatus('joined');
      } catch (err) {
        // Zoom's SDK throws { type, reason } objects, not standard Error instances —
        // surface whatever shape we actually got instead of masking it with a generic message.
        console.error('Zoom join failed:', err);
        const reason = err?.reason || err?.message || (typeof err === 'string' ? err : null);
        setError(reason ? `${reason}${err?.type ? ` (${err.type})` : ''}` : 'Could not connect to this class.');
        setStatus('error');
      }
    }

    run();

    return () => {
      const client = clientRef.current;
      if (client) {
        try { client.leave(); } catch { /* already left / never joined */ }
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  const leave = async () => {
    const client = clientRef.current;
    clientRef.current = null; // prevent the unmount cleanup from calling leave() a second time
    if (client) {
      try { await client.leave(); } catch { /* already left / never joined */ }
    }
    backHome();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#0F1F3D', zIndex: 500 }}>
      {status !== 'joined' && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#fff', gap: '14px', padding: '20px', textAlign: 'center' }}>
          {status === 'error' ? (
            <>
              <div style={{ fontSize: '16px', fontWeight: 600 }}>Couldn't join this class</div>
              <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', maxWidth: '360px' }}>{error}</div>
              <button className="btn btn-gold btn-sm" onClick={backHome} style={{ marginTop: '8px' }}>Back to dashboard</button>
            </>
          ) : (
            <>
              <div className="spinner" style={{ width: '32px', height: '32px', border: '3px solid rgba(255,255,255,0.2)', borderTopColor: '#E8A830', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              <div style={{ fontSize: '14px' }}>{status === 'joining' ? 'Connecting to your live class…' : 'Loading…'}</div>
            </>
          )}
        </div>
      )}

      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />

      {status === 'joined' && (
        <button
          className="btn btn-sm"
          onClick={leave}
          style={{ position: 'absolute', top: '14px', right: '14px', zIndex: 10, background: '#e5484d', color: '#fff', fontWeight: 600, border: 'none' }}
        >
          Leave class
        </button>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default LiveClassRoom;
