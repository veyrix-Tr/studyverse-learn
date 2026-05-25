import { useState } from 'react';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';

const RightPanel = () => {
  const [view, setView] = useState('login');

  return (
    <div className="right-panel">
      <div className="login-card">
        {view === 'login'
          ? <LoginForm onSwitchToRegister={() => setView('register')} />
          : <RegisterForm onSwitchToLogin={() => setView('login')} />
        }
      </div>
    </div>
  );
};

export default RightPanel;
