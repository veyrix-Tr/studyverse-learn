import { Routes, Route, Navigate, useParams } from 'react-router-dom'
import Login from './pages/Login'
import AdminLMS from './pages/AdminLMS'
import FacultyLMS from './pages/FacultyLMS'
import StudentLMS from './pages/StudentLMS'
import FreeLMS from './pages/FreeLMS'
import AnchorLMS from './pages/AnchorLMS'
import GoogleCallback from './pages/GoogleCallback'
import LiveClassRoom from './components/live/LiveClassRoom'

export const getTokenPayload = () => {
  const token = localStorage.getItem('token');
  if (!token) return null;
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(base64));
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      localStorage.removeItem('token');
      return null;
    }
    return payload;
  } catch {
    return null;
  }
};

export const getStoredPlan = () => {
  return getTokenPayload()?.plan || 'spark';
};

export const PAID_PLANS    = ['forge', 'apex', 'anchor']; // for admin counts, banners
const SESSION_PLANS = ['apex'];                    // routes to StudentLMS (Apex only)
const ANCHOR_PLANS  = ['anchor'];                  // routes to AnchorLMS

export const homeForRole = (role, id) => {
  if (role === 'superadmin') return `/superadmin/${id}/dashboard`;
  if (role === 'admin')      return `/admin/${id}/dashboard`;
  if (role === 'faculty')    return `/faculty/${id}/dashboard`;
  const plan = getStoredPlan();
  if (SESSION_PLANS.includes(plan)) return `/student-v2/${id}/dashboard`;
  if (ANCHOR_PLANS.includes(plan))  return `/anchor/${id}/dashboard`;
  return `/student/${id}/home`;
};

// Redirects to the correct home based on stored token (used when no id in URL)
function RoleRedirect() {
  const payload = getTokenPayload();
  if (!payload) return <Navigate to="/" replace />;
  return <Navigate to={homeForRole(payload.role, payload.id)} replace />;
}

// Guards a route: checks token, role, and that URL id matches token id
function AuthGuard({ expectedRole, requirePlan, children }) {
  const payload = getTokenPayload();
  const { id } = useParams();

  if (!payload) return <Navigate to="/" replace />;

  if (payload.role !== expectedRole) {
    return <Navigate to={homeForRole(payload.role, payload.id)} replace />;
  }

  // Prevent accessing another user's URL
  if (id && String(payload.id) !== id) {
    return <Navigate to={homeForRole(payload.role, payload.id)} replace />;
  }

  if (expectedRole === 'student' && requirePlan) {
    const plan = getStoredPlan();
    if (requirePlan === 'premium' && !SESSION_PLANS.includes(plan)) {
      if (ANCHOR_PLANS.includes(plan)) return <Navigate to={`/anchor/${payload.id}/dashboard`} replace />;
      return <Navigate to={`/student/${payload.id}/home`} replace />;
    }
    if (requirePlan === 'free' && (SESSION_PLANS.includes(plan) || ANCHOR_PLANS.includes(plan))) {
      if (ANCHOR_PLANS.includes(plan)) return <Navigate to={`/anchor/${payload.id}/dashboard`} replace />;
      return <Navigate to={`/student-v2/${payload.id}/dashboard`} replace />;
    }
    if (requirePlan === 'anchor' && !ANCHOR_PLANS.includes(plan)) return <Navigate to={homeForRole(payload.role, payload.id)} replace />;
  }

  return children;
}

function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/"            element={<Login />} />
      <Route path="/login"       element={<Login />} />
      <Route path="/register"    element={<Login defaultView="register" />} />
      <Route path="/auth/google" element={<GoogleCallback />} />

      {/* Student — premium */}
      <Route path="/student-v2/:id"       element={<AuthGuard expectedRole="student" requirePlan="premium"><StudentLMS /></AuthGuard>} />
      <Route path="/student-v2/:id/:page" element={<AuthGuard expectedRole="student" requirePlan="premium"><StudentLMS /></AuthGuard>} />
      <Route path="/student-v2/:id/live/:sessionId" element={<AuthGuard expectedRole="student" requirePlan="premium"><LiveClassRoom role="student" /></AuthGuard>} />

      {/* Student — Anchor */}
      <Route path="/anchor/:id"       element={<AuthGuard expectedRole="student" requirePlan="anchor"><AnchorLMS /></AuthGuard>} />
      <Route path="/anchor/:id/:page" element={<AuthGuard expectedRole="student" requirePlan="anchor"><AnchorLMS /></AuthGuard>} />
      <Route path="/anchor/:id/live/:sessionId" element={<AuthGuard expectedRole="student" requirePlan="anchor"><LiveClassRoom role="student" /></AuthGuard>} />
      <Route path="/anchor/:id/call/:sessionId" element={<AuthGuard expectedRole="student" requirePlan="anchor"><LiveClassRoom role="student" kind="call" /></AuthGuard>} />

      {/* Student — free */}
      <Route path="/student/:id"       element={<AuthGuard expectedRole="student" requirePlan="free"><FreeLMS /></AuthGuard>} />
      <Route path="/student/:id/:page" element={<AuthGuard expectedRole="student" requirePlan="free"><FreeLMS /></AuthGuard>} />

      {/* Faculty */}
      <Route path="/faculty/:id"       element={<AuthGuard expectedRole="faculty"><FacultyLMS /></AuthGuard>} />
      <Route path="/faculty/:id/:page" element={<AuthGuard expectedRole="faculty"><FacultyLMS /></AuthGuard>} />
      <Route path="/faculty/:id/live/:sessionId" element={<AuthGuard expectedRole="faculty"><LiveClassRoom role="faculty" /></AuthGuard>} />
      <Route path="/faculty/:id/call/:sessionId" element={<AuthGuard expectedRole="faculty"><LiveClassRoom role="faculty" kind="call" /></AuthGuard>} />

      {/* Admin */}
      <Route path="/admin/:id"       element={<AuthGuard expectedRole="admin"><AdminLMS expectedRole="admin" /></AuthGuard>} />
      <Route path="/admin/:id/:page" element={<AuthGuard expectedRole="admin"><AdminLMS expectedRole="admin" /></AuthGuard>} />

      {/* Superadmin */}
      <Route path="/superadmin/:id"       element={<AuthGuard expectedRole="superadmin"><AdminLMS expectedRole="superadmin" /></AuthGuard>} />
      <Route path="/superadmin/:id/:page" element={<AuthGuard expectedRole="superadmin"><AdminLMS expectedRole="superadmin" /></AuthGuard>} />

      {/* Catch-all — redirects using token */}
      <Route path="*" element={<RoleRedirect />} />
    </Routes>
  );
}

export default App
