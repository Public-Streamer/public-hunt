import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import LoginForm from '@/components/LoginForm';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectUrl = searchParams.get('redirect');

  const handleClose = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 auth-template">
      <LoginForm onClose={handleClose} redirectUrl={redirectUrl} />
    </div>
  );
};

export default Login;
