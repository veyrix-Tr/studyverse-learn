import React from 'react';
import '../components/login/LoginStyles.css';
import LeftPanel from '../components/login/LeftPanel';
import RightPanel from '../components/login/RightPanel';

const Login = ({ defaultView = 'login' }) => {
  const params     = new URLSearchParams(window.location.search);
  const googleName  = params.get('name')  ? decodeURIComponent(params.get('name'))  : '';
  const googleEmail = params.get('email') ? decodeURIComponent(params.get('email')) : '';
  const isGoogle    = params.get('google') === 'true';

  return (
    <div className="login-page">
      <LeftPanel />
      <RightPanel
        defaultView={defaultView}
        googleName={googleName}
        googleEmail={googleEmail}
        isGoogle={isGoogle}
      />
    </div>
  );
};

export default Login;
