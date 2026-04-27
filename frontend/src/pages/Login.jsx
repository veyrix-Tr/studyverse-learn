import React from 'react';
import '../components/login/LoginStyles.css';
import LeftPanel from '../components/login/LeftPanel';
import RightPanel from '../components/login/RightPanel';

const Login = () => {
  return (
    <div className="login-page">
      <LeftPanel />
      <RightPanel />
    </div>
  );
};

export default Login;
