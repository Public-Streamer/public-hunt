import React from 'react';
import LoginForm from '@/components/LoginForm';
import { useNavigate } from 'react-router-dom';

const Login: React.FC = () => {
  const navigate = useNavigate();

  const handleClose = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 auth-template">
      <LoginForm onClose={handleClose} />
    </div>
  );
};

export default Login;