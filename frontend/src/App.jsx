import Login from './pages/Login'
import AdminLMS from './pages/AdminLMS'
import FacultyLMS from './pages/FacultyLMS'

function App() {
  const path = window.location.pathname

  const getPage = () => {
    switch(path) {
      case '/': case '/login': return 'login'
      case '/admin': return 'admin'
      case '/faculty': return 'faculty'
      case '/student': return 'freemium-lms.html'
      case '/student-v2': return 'lms-v2.html'
      case '/signup': return 'signup.html'
      default: return 'login'
    }
  }

  const page = getPage()

  if (page === 'login') {
    return <Login />
  }

  if (page === 'admin') {
    return <AdminLMS />
  }

  if (page === 'faculty') {
    return <FacultyLMS />
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
