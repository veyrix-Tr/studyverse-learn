import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const GoogleCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token  = params.get('token');
    const user   = params.get('user');
    const error  = params.get('error');

    if (error || !token || !user) {
      navigate('/login', { replace: true });
      return;
    }

    try {
      const parsedUser = JSON.parse(decodeURIComponent(user));

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(parsedUser));

      const { role, plan } = parsedUser;
      if (role === 'superadmin')    navigate('/superadmin', { replace: true });
      else if (role === 'admin')    navigate('/admin', { replace: true });
      else if (role === 'faculty')  navigate('/faculty', { replace: true });
      else if (plan === 'premium')  navigate('/student-v2', { replace: true });
      else                          navigate('/student', { replace: true });
    } catch {
      navigate('/login', { replace: true });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'sans-serif', color: '#0F1F3D' }}>
      Signing you in with Google...
    </div>
  );
};

export default GoogleCallback;
