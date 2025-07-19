import React, { useState } from 'react';
import Header from './Header';
import LoginForm from './LoginForm';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [showLoginForm, setShowLoginForm] = useState(false);

  const handleLoginClick = () => {
    setShowLoginForm(true);
  };

  const handleCloseLogin = () => {
    setShowLoginForm(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onLoginClick={handleLoginClick} />
      <main className="flex-1">
        {children}
      </main>
      {showLoginForm && <LoginForm onClose={handleCloseLogin} />}
    </div>
  );
};

export default Layout;