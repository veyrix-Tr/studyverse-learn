import Login from './pages/Login'
import AdminLMS from './pages/AdminLMS'
import FacultyLMS from './pages/FacultyLMS'
import StudentLMS from './pages/StudentLMS'
import FreeLMS from './pages/FreeLMS'
import GoogleCallback from './pages/GoogleCallback'

const getTokenPayload = () => {
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

const getStoredPlan = () => {
  try { return JSON.parse(localStorage.getItem('user') || 'null')?.plan || 'free'; }
  catch { return 'free'; }
};

const homeForRole = (role) => {
  if (role === 'superadmin') return '/superadmin';
  if (role === 'admin')      return '/admin';
  if (role === 'faculty')    return '/faculty';
  return getStoredPlan() === 'premium' ? '/student-v2' : '/student';
};

const ROUTE_ROLES = {
  '/admin':      'admin',
  '/superadmin': 'superadmin',
  '/faculty':    'faculty',
  '/student-v2': 'student',
  '/student':    'student',
};

function App() {
  const path = window.location.pathname;

  // ── Public routes ──────────────────────────────────
  if (path === '/' || path === '/login')  return <Login />;
  if (path === '/register')               return <Login defaultView="register" />;
  if (path === '/auth/google')            return <GoogleCallback />;

  // ── All other routes require a valid token ─────────
  const payload = getTokenPayload();

  if (!payload) {
    window.location.replace('/');
    return null;
  }

  const { role } = payload;
  const requiredRole = ROUTE_ROLES[path];

  // Unknown route → home for this role
  if (!requiredRole) {
    window.location.replace(homeForRole(role));
    return null;
  }

  // Wrong role → home for this role
  if (role !== requiredRole) {
    window.location.replace(homeForRole(role));
    return null;
  }

  // For student routes — enforce premium vs free split
  if (role === 'student') {
    const plan = getStoredPlan();
    if (path === '/student-v2' && plan !== 'premium') {
      window.location.replace('/student');
      return null;
    }
    if (path === '/student' && plan === 'premium') {
      window.location.replace('/student-v2');
      return null;
    }
  }

  // ── Render ─────────────────────────────────────────
  if (path === '/admin')      return <AdminLMS expectedRole="admin" />;
  if (path === '/superadmin') return <AdminLMS expectedRole="superadmin" />;
  if (path === '/faculty')    return <FacultyLMS />;
  if (path === '/student-v2') return <StudentLMS />;
  if (path === '/student')    return <FreeLMS />;
}

export default App
