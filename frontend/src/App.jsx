import Login from './pages/Login'
import AdminLMS from './pages/AdminLMS'
import FacultyLMS from './pages/FacultyLMS'
import StudentLMS from './pages/StudentLMS'
import FreeLMS from './pages/FreeLMS'
import GoogleCallback from './pages/GoogleCallback'

function App() {
  const path = window.location.pathname

  const getPage = () => {
    switch(path) {
      case '/': case '/login': return 'login'
      case '/admin': return 'admin'
      case '/superadmin': return 'superadmin'
      case '/faculty': return 'faculty'
      case '/student-v2': return 'student'
      case '/student': return 'free'
      case '/auth/google': return 'google-callback'
      case '/register': return 'register'
      case '/signup': return 'signup.html'
      default: return 'login'
    }
  }

  const page = getPage()

  if (page === 'login') {
    return <Login />
  }

  if (page === 'admin') {
    return <AdminLMS expectedRole="admin" />
  }

  if (page === 'superadmin') {
    return <AdminLMS expectedRole="superadmin" />
  }

  if (page === 'faculty') {
    return <FacultyLMS />
  }

  if (page === 'student') {
    return <StudentLMS />
  }

  if (page === 'free') {
    return <FreeLMS />
  }

  if (page === 'google-callback') {
    return <GoogleCallback />
  }

  if (page === 'register') {
    return <Login defaultView="register" />
  }

  return (
    <iframe
      src={`/src/standalone/${page}`}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100%',
        height: '100%',
        border: 'none',
        margin: 0,
        padding: 0,
        display: 'block'
      }}
    />
  )
}

export default App
