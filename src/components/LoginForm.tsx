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
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4 auth-template">
        <Card className="w-full max-w-md max-h-[95vh] sm:max-h-[90vh] auth-template">
          <CardHeader className="pb-3 sm:pb-6">
            <CardTitle className="text-lg sm:text-xl">Create Account</CardTitle>
            <CardDescription className="text-sm">Join Public Streamer today</CardDescription>
          </CardHeader>
          <CardContent className="h-[70vh] sm:h-[75vh] p-0 auth-template">
            <ScrollArea className="h-full w-full px-3 sm:px-6 pb-3 sm:pb-6 auth-template">
              <SignupForm onClose={onClose} onSuccess={handleSignupSuccess} inline />
              <div className="mt-2 sm:mt-4 w-full">
                <div className="flex justify-center items-center w-full">
                  <Button 
                    type="button" 
                    variant="secondary" 
                    onClick={() => setShowSignup(false)}
                    className="text-base font-medium h-10 px-6 rounded-lg border-2 border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary hover:text-primary transition-all duration-200"
                  >
                    Already have an account? Sign in
                  </Button>
                </div>
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4 auth-template">
      <Card className="w-full max-w-md max-h-[95vh] sm:max-h-[90vh] auth-template">
        <CardHeader className="pb-3 sm:pb-6">
          <CardTitle className="text-lg sm:text-xl">Welcome to Public Streamer</CardTitle>
          <CardDescription className="text-sm">Sign in to your account</CardDescription>
        </CardHeader>
        <CardContent className="auth-template px-3 sm:px-6 pb-3 sm:pb-6">
          <form onSubmit={handleLogin} className="space-y-3 sm:space-y-4">
            <div className="space-y-1 sm:space-y-2">
              <Label htmlFor="email" className="text-sm">Email</Label>
              <Input
                id="email"
                type="email"
                value={loginData.email}
                onChange={(e) => setLoginData(prev => ({ ...prev, email: e.target.value }))}
                className="h-10 sm:h-11"
                required
              />
            </div>
            <div className="space-y-1 sm:space-y-2">
              <Label htmlFor="password" className="text-sm">Password</Label>
              <Input
                id="password"
                type="password"
                value={loginData.password}
                onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                className="h-10 sm:h-11"
                required
              />
            </div>
            {error && (
              <div className="text-red-600 text-sm text-center">{error}</div>
            )}
            
            <div className="space-y-2 sm:space-y-3">
              <TooltipWrapper content="Sign in to your account">
                <Button type="submit" className="w-full h-10 sm:h-11" disabled={isLoading}>
                  {isLoading ? 'Signing in...' : 'Login'}
                </Button>
              </TooltipWrapper>
              <TooltipWrapper content="Close login form">
                <Button type="button" variant="outline" onClick={onClose} className="w-full h-10 sm:h-11">
                  Cancel
                </Button>
              </TooltipWrapper>
            </div>
            
            {/* Centered signup link with proper spacing and positioning */}
            <div className="pt-2 sm:pt-4 w-full">
              <div className="flex justify-center items-center w-full">
                <Button 
                  type="button" 
                  variant="secondary" 
                  onClick={() => setShowSignup(true)}
                  className="text-base font-medium h-10 px-6 rounded-lg border-2 border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary hover:text-primary transition-all duration-200"
                >
                  Don't have an account? Sign up
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginForm;