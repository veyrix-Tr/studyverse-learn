import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import AdminLMS from './pages/AdminLMS'
import FacultyLMS from './pages/FacultyLMS'
import StudentLMS from './pages/StudentLMS'
import FreeLMS from './pages/FreeLMS'
import GoogleCallback from './pages/GoogleCallback'

export const getTokenPayload = () => {
  const token = localStorage.getItem('token');
  if (!token) return null;
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(base64));
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return null;
    }
    return payload;
  } catch {
    return null;
  }
};

export const getStoredPlan = () => {
  try { return JSON.parse(localStorage.getItem('user') || 'null')?.plan || 'free'; }
  catch { return 'free'; }
};

export const homeForRole = (role) => {
  if (role === 'superadmin') return '/superadmin';
  if (role === 'admin')      return '/admin';
  if (role === 'faculty')    return '/faculty';
  return getStoredPlan() === 'premium' ? '/student-v2' : '/student';
};

// Redirects to the correct home based on stored token
function RoleRedirect() {
  const payload = getTokenPayload();
  if (!payload) return <Navigate to="/" replace />;
  return <Navigate to={homeForRole(payload.role)} replace />;
}

// Guards a route: checks token, role, and student plan
function AuthGuard({ expectedRole, requirePlan, children }) {
  const payload = getTokenPayload();
  if (!payload) return <Navigate to="/" replace />;

  if (payload.role !== expectedRole) {
    return <Navigate to={homeForRole(payload.role)} replace />;
  }

  if (expectedRole === 'student' && requirePlan) {
    const plan = getStoredPlan();
    if (requirePlan === 'premium' && plan !== 'premium') return <Navigate to="/student" replace />;
    if (requirePlan === 'free'    && plan === 'premium') return <Navigate to="/student-v2" replace />;
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
      <Route path="/student-v2" element={<AuthGuard expectedRole="student" requirePlan="premium"><StudentLMS /></AuthGuard>} />
      <Route path="/student-v2/:page" element={<AuthGuard expectedRole="student" requirePlan="premium"><StudentLMS /></AuthGuard>} />

      {/* Student — free */}
      <Route path="/student" element={<AuthGuard expectedRole="student" requirePlan="free"><FreeLMS /></AuthGuard>} />
      <Route path="/student/:page" element={<AuthGuard expectedRole="student" requirePlan="free"><FreeLMS /></AuthGuard>} />

      {/* Faculty */}
      <Route path="/faculty" element={<AuthGuard expectedRole="faculty"><FacultyLMS /></AuthGuard>} />
      <Route path="/faculty/:page" element={<AuthGuard expectedRole="faculty"><FacultyLMS /></AuthGuard>} />

      {/* Admin */}
      <Route path="/admin" element={<AuthGuard expectedRole="admin"><AdminLMS expectedRole="admin" /></AuthGuard>} />
      <Route path="/admin/:page" element={<AuthGuard expectedRole="admin"><AdminLMS expectedRole="admin" /></AuthGuard>} />

      {/* Superadmin */}
      <Route path="/superadmin" element={<AuthGuard expectedRole="superadmin"><AdminLMS expectedRole="superadmin" /></AuthGuard>} />
      <Route path="/superadmin/:page" element={<AuthGuard expectedRole="superadmin"><AdminLMS expectedRole="superadmin" /></AuthGuard>} />

      {/* Catch-all */}
      <Route path="*" element={<RoleRedirect />} />
    </Routes>
  );
}

export default App
