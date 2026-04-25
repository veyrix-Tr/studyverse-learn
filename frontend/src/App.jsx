import React from 'react'

function App() {
  const path = window.location.pathname

  const getPage = () => {
    switch(path) {
      case '/': case '/login': return 'login.html'
      case '/student': return 'freemium-lms.html' 
      case '/student-v2': return 'lms-v2.html'
      case '/faculty': return 'faculty-lms.html'
      case '/admin': return 'admin-lms.html'
      case '/signup': return 'signup.html'
      default: return 'login.html'
    }
  }

  return (
    <iframe 
      src={`/src/standalone/${getPage()}`}
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
