import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAppContext } from '@/contexts/AppContext';
import { useNavigate } from 'react-router-dom';
import SignupForm from './SignupForm';

interface LoginFormProps {
  onClose: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onClose }) => {
  const { login } = useAppContext();
  const navigate = useNavigate();
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [showSignup, setShowSignup] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Mock login - in real app, validate credentials
    login({
      firstName: 'John',
      lastName: 'Doe',
      email: loginData.email,
      phone: '+1234567890',
      location: 'New York, NY',
      bio: 'Welcome to my profile!',
      birthDate: '1990-01-01'
    });
    onClose();
    navigate('/profile');
  };

  const handleSignupSuccess = () => {
    onClose();
    navigate('/profile');
  };

  if (showSignup) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Create Account</CardTitle>
            <CardDescription>Join Streamura today</CardDescription>
          </CardHeader>
          <CardContent>
            <SignupForm onClose={onClose} onSuccess={handleSignupSuccess} inline />
            <div className="mt-4 text-center">
              <Button 
                type="button" 
                variant="link" 
                onClick={() => setShowSignup(false)}
                className="text-sm"
              >
                Already have an account? Sign in
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Welcome to Streamura</CardTitle>
          <CardDescription>Sign in to your account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={loginData.email}
                onChange={(e) => setLoginData(prev => ({ ...prev, email: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={loginData.password}
                onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                required
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" className="flex-1">Login</Button>
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            </div>
            <div className="text-center">
              <Button 
                type="button" 
                variant="link" 
                onClick={() => setShowSignup(true)}
                className="text-sm"
              >
                Don't have an account? Sign up
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginForm;