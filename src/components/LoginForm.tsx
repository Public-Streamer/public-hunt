import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useAppContext } from '@/contexts/AppContext';
import { supabase } from '@/integrations/supabase/client';
import TooltipWrapper from '@/components/ui/tooltip-wrapper';
import { brandMode, brandName } from '@/lib/brand';
import SignupForm from './SignupForm';
import { ScrollArea } from './ui/scroll-area';
import CompanyAccountSelector from './CompanyAccountSelector';
import ResetPasswordForm from './ResetPasswordForm';

interface LoginFormProps {
  onClose: () => void;
  redirectUrl?: string | null;
}

const LoginForm: React.FC<LoginFormProps> = ({ onClose, redirectUrl }) => {
  const { signIn } = useAppContext();
  const navigate = useNavigate();
  const location = useLocation();
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [showSignup, setShowSignup] = useState(false);
  const [showAccountSelector, setShowAccountSelector] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [pendingUser, setPendingUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const isDoghuntMode = brandMode === 'doghunt';

  // Check URL parameters to show signup form automatically
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    if (urlParams.get('tab') === 'signup') {
      setShowSignup(true);
    }
  }, [location.search]);

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
        const targetUrl =
          redirectUrl && redirectUrl.startsWith('/') ? redirectUrl : '/';
        navigate(targetUrl);
      }
    } catch (error) {
      setError('An unexpected error occurred');
      setIsLoading(false);
    }
  };

  const handleSignupSuccess = () => {
    onClose();
    const targetUrl =
      redirectUrl && redirectUrl.startsWith('/') ? redirectUrl : '/';
    navigate(targetUrl);
  };

  const handleAccountSelection = async (
    type: 'individual' | 'company',
    companyId?: string
  ) => {
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
    const targetUrl =
      redirectUrl && redirectUrl.startsWith('/') ? redirectUrl : '/';
    navigate(targetUrl);
  };

  const handleAccountSelectorCancel = async () => {
    // Sign out the user since they canceled selection
    await supabase.auth.signOut();
    setShowAccountSelector(false);
    setPendingUser(null);
  };

  if (showResetPassword) {
    return <ResetPasswordForm onClose={() => setShowResetPassword(false)} />;
  }

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
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-3 auth-template ">
        <Card className="w-full overflow-y-hidden auth-template relative">
          <X
            className="absolute top-4 right-4 cursor-pointer font-bold"
            onClick={onClose}
          />
          <CardHeader className="pb-3 sm:pb-6">
            <CardTitle className="text-2xl sm:text-3xl font-bold">
              Create Account
            </CardTitle>
            <CardDescription className="text-lg sm:text-xl font-semibold">
              {isDoghuntMode
                ? 'Join Doghunt today'
                : 'Join Public Streamer today'}
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[70vh] sm:h-[75vh] p-0  auth-template ">
            <ScrollArea className="w-full px-3 sm:px-6 pb-3 sm:pb-6 auth-template ">
              <SignupForm
                onClose={onClose}
                onSuccess={handleSignupSuccess}
                inline
              />
              <div className="mt-2 sm:mt-4 w-full">
                <div className="flex justify-center items-center w-full">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setShowSignup(false)}
                    className="text-base font-medium h-auto px-4 py-2 bg-muted/30 hover:bg-muted/50 text-foreground hover:text-foreground shadow-sm border-0 rounded-md transition-all duration-200"
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-3 auth-template">
      <Card className="relative w-full max-w-md max-h-[95vh] sm:max-h-[90vh] auth-template">
        <X
          className="absolute top-4 right-4 cursor-pointer font-bold"
          onClick={onClose}
        />
        <CardHeader className="pb-3 sm:pb-6">
          <CardTitle className="text-lg sm:text-xl">
            Welcome to {brandName}
          </CardTitle>
          <CardDescription className="text-sm">
            Sign in to your account
          </CardDescription>
        </CardHeader>
        <CardContent className="auth-template px-3 sm:px-6 pb-3 sm:pb-6">
          <form onSubmit={handleLogin} className="space-y-3 sm:space-y-4">
            <div className="space-y-1 sm:space-y-2">
              <Label htmlFor="email" className="text-sm">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={loginData.email}
                onChange={(e) =>
                  setLoginData((prev) => ({ ...prev, email: e.target.value }))
                }
                className="h-10 sm:h-11"
                required
              />
            </div>
            <div className="space-y-1 sm:space-y-2">
              <Label htmlFor="password" className="text-sm">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={loginData.password}
                onChange={(e) =>
                  setLoginData((prev) => ({
                    ...prev,
                    password: e.target.value,
                  }))
                }
                className="h-10 sm:h-11"
                required
              />
            </div>
            {error && (
              <div className="text-red-600 text-sm text-center">{error}</div>
            )}

            <div className="space-y-2 sm:space-y-3">
              <TooltipWrapper content="Sign in to your account">
                <Button
                  type="submit"
                  className="w-full h-10 sm:h-11"
                  disabled={isLoading}
                >
                  {isLoading ? 'Signing in...' : 'Login'}
                </Button>
              </TooltipWrapper>
              <TooltipWrapper content="Close login form">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="w-full h-10 sm:h-11"
                >
                  Cancel
                </Button>
              </TooltipWrapper>
            </div>

            {/* Forgot password link */}
            <div className="flex justify-center">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowResetPassword(true)}
                className="text-sm font-medium h-auto px-2 py-1 text-muted-foreground hover:text-foreground transition-colors"
              >
                Forgot your password?
              </Button>
            </div>

            {/* Centered signup link with proper spacing and positioning */}
            <div className="pt-2 sm:pt-4 w-full">
              <div className="flex justify-center items-center w-full">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowSignup(true)}
                  className="text-base font-medium h-auto px-4 py-2 bg-muted/20 hover:bg-muted/40 text-foreground hover:text-foreground shadow-sm border border-muted/30 hover:border-muted/50 rounded-md transition-all duration-200"
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
