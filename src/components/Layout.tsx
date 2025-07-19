import React, { useState, useEffect } from 'react';
import Header from './Header';
import LoginForm from './LoginForm';
import { useAppContext } from '@/contexts/AppContext';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [showLoginForm, setShowLoginForm] = useState(false);
  const { user } = useAppContext();

  const handleLoginClick = () => {
    setShowLoginForm(true);
  };

  const handleCloseLogin = () => {
    setShowLoginForm(false);
  };

  // Close login form when user becomes authenticated
  useEffect(() => {
    if (user && showLoginForm) {
      setShowLoginForm(false);
    }
  }, [user, showLoginForm]);

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