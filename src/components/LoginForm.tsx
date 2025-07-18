import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAppContext } from '@/contexts/AppContext';
import { useNavigate } from 'react-router-dom';
import SignupForm from './SignupForm';
import { ScrollArea } from './ui/scroll-area';
import CompanyAccountSelector from './CompanyAccountSelector';
import { supabase } from '@/integrations/supabase/client';
import TooltipWrapper from '@/components/ui/tooltip-wrapper';

interface LoginFormProps {
  onClose: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onClose }) => {
  const { signIn } = useAppContext();
  const navigate = useNavigate();
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [showSignup, setShowSignup] = useState(false);
  const [showAccountSelector, setShowAccountSelector] = useState(false);
  const [pendingUser, setPendingUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // First authenticate the user
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginData.email,
        password: loginData.password,
      });

      if (error) {
        setError(error.message);
        setIsLoading(false);
        return;
      }

      // Check if user is a company master
      const { data: companyRoles, error: roleError } = await supabase
        .from('company_roles')
        .select('company_id')
        .eq('user_id', data.user.id)
        .eq('role', 'company_master');

      if (roleError) {
        console.error('Error checking company roles:', roleError);
      }

      // If user has company master roles, show account selector
      if (companyRoles && companyRoles.length > 0) {
        setPendingUser(data.user);
        setShowAccountSelector(true);
        setIsLoading(false);
      } else {
        // Regular individual login
        onClose();
        navigate('/');
      }
    } catch (error) {
      setError('An unexpected error occurred');
      setIsLoading(false);
    }
  };

  const handleSignupSuccess = () => {
    onClose();
    navigate('/');
  };

  const handleAccountSelection = async (type: 'individual' | 'company', companyId?: string) => {
    // Set session context based on selection
    if (type === 'company' && companyId) {
      // Could store company context in localStorage or session storage
      sessionStorage.setItem('activeCompanyId', companyId);
      sessionStorage.setItem('loginType', 'company');
    } else {
      sessionStorage.setItem('loginType', 'individual');
      sessionStorage.removeItem('activeCompanyId');
    }
    
    setShowAccountSelector(false);
    onClose();
    navigate('/');
  };

  const handleAccountSelectorCancel = async () => {
    // Sign out the user since they canceled selection
    await supabase.auth.signOut();
    setShowAccountSelector(false);
    setPendingUser(null);
  };

  if (showAccountSelector && pendingUser) {
    return (
      <CompanyAccountSelector
        user={pendingUser}
        onSelection={handleAccountSelection}
        onCancel={handleAccountSelectorCancel}
      />
    );
  }

  if (showSignup) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Create Account</CardTitle>
            <CardDescription>Join Streamura today</CardDescription>
          </CardHeader>
          <CardContent className="h-[75vh] p-0">
            <ScrollArea className="h-full w-full px-6 pb-6">
              <SignupForm onClose={onClose} onSuccess={handleSignupSuccess} inline />
              <div className="mt-4 text-center">
                <TooltipWrapper content="Go back to login form">
                  <Button 
                    type="button" 
                    variant="link" 
                    onClick={() => setShowSignup(false)}
                    className="text-sm"
                  >
                    Already have an account? Sign in
                  </Button>
                </TooltipWrapper>
              </div>
            </ScrollArea>
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
            {error && (
              <div className="text-red-600 text-sm text-center">{error}</div>
            )}
          <div className="space-y-2">
            <TooltipWrapper content="Sign in to your account">
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Signing in...' : 'Login'}
              </Button>
            </TooltipWrapper>
            <TooltipWrapper content="Close login form">
              <Button type="button" variant="outline" onClick={onClose} className="w-full">
                Cancel
              </Button>
            </TooltipWrapper>
          </div>
            <div className="text-center">
              <TooltipWrapper content="Create a new account">
                <Button 
                  type="button" 
                  variant="link" 
                  onClick={() => setShowSignup(true)}
                  className="text-sm"
                >
                  Don't have an account? Sign up
                </Button>
              </TooltipWrapper>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginForm;