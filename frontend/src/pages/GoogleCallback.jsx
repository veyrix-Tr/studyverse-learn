import { useEffect } from 'react';

const GoogleCallback = () => {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token  = params.get('token');
    const user   = params.get('user');
    const error  = params.get('error');

    if (error || !token || !user) {
      window.location.href = '/login?error=google-failed';
      return;
    }

    try {
      const parsedUser = JSON.parse(decodeURIComponent(user));

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(parsedUser));

      const { role, plan } = parsedUser;
      if (role === 'superadmin')    window.location.replace('/superadmin');
      else if (role === 'admin')    window.location.replace('/admin');
      else if (role === 'faculty')  window.location.replace('/faculty');
      else if (plan === 'premium')  window.location.replace('/student-v2');
      else                          window.location.replace('/student');
    } catch {
      window.location.href = '/login?error=google-failed';
    }
  }, []);

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'sans-serif', color: '#0F1F3D' }}>
      Signing you in with Google...
    </div>
  );
};

export default GoogleCallback;
