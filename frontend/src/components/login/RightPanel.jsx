import { useState } from 'react';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';

const RightPanel = ({ defaultView = 'login', googleName = '', googleEmail = '', isGoogle = false }) => {
  const [view, setView] = useState(defaultView);

  return (
    <div className="right-panel">
      <div className="login-card">
        {view === 'login'
          ? <LoginForm onSwitchToRegister={() => setView('register')} />
          : <RegisterForm
              onSwitchToLogin={() => setView('login')}
              googleName={googleName}
              googleEmail={googleEmail}
              isGoogle={isGoogle}
            />
        }
      </div>
    </div>
  );
};

export default RightPanel;
