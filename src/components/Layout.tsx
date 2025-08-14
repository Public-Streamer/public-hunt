import React, { useState, useEffect } from "react";
import Header from "./Header";
import Footer from "./Footer";
import LoginForm from "./LoginForm";
import { useAppContext } from "@/contexts/AppContext";
import { useLocation } from "react-router-dom";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [redirectAfterLogin, setRedirectAfterLogin] = useState<string | null>(
    null
  );
  const { user } = useAppContext();
  const location = useLocation();

  const handleLoginClick = () => {
    // Capture current location for redirect after login
    setRedirectAfterLogin(location.pathname + location.search);
    setShowLoginForm(true);
  };

  const handleCloseLogin = () => {
    setShowLoginForm(false);
    setRedirectAfterLogin(null);
  };

  // Close login form when user becomes authenticated
  useEffect(() => {
    if (user && showLoginForm) {
      setShowLoginForm(false);
      setRedirectAfterLogin(null);
    }
  }, [user, showLoginForm]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 overflow-x-hidden">
      <Header onLoginClick={handleLoginClick} />
      <main className="flex-1">{children}</main>
      <div className="mt-auto">
        <Footer />
      </div>
      {showLoginForm && (
        <LoginForm
          onClose={handleCloseLogin}
          redirectUrl={redirectAfterLogin}
        />
      )}
    </div>
  );
};

export default Layout;
