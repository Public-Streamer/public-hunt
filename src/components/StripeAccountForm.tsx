
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CreditCard, ExternalLink, CheckCircle, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { useAppContext } from '@/contexts/AppContext';

interface StripeAccountFormProps {
  onAccountLinked: () => void;
}

interface StripeAccount {
  id: string;
  stripe_account_id: string;
  account_status: string;
  onboarding_completed: boolean;
  payouts_enabled: boolean;
}

const StripeAccountForm: React.FC<StripeAccountFormProps> = ({ onAccountLinked }) => {
  const [hasStripeAccount, setHasStripeAccount] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [error, setError] = useState('');
  const [existingAccount, setExistingAccount] = useState<StripeAccount | null>(null);
  const [checkingAccount, setCheckingAccount] = useState(true);
  const { toast } = useToast();
  const { user } = useAppContext();

  useEffect(() => {
    if (user) {
      checkExistingStripeAccount();
    }
  }, [user]);

  const checkExistingStripeAccount = async () => {
    try {
      setCheckingAccount(true);
      const { data, error } = await supabase
        .from('host_stripe_accounts')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setExistingAccount(data);
        if (data.onboarding_completed && data.payouts_enabled) {
          // Account is fully set up, trigger completion
          onAccountLinked();
        }
      }
    } catch (err) {
      console.error('Error checking existing account:', err);
    } finally {
      setCheckingAccount(false);
    }
  };

  const handleCreateStripeAccount = async () => {
    setLoading(true);
    setError('');
    
    try {
      const { data, error } = await supabase.functions.invoke('create-stripe-express-account', {
        body: { 
          email: user?.email,
          firstName: user?.user_metadata?.first_name || '',
          lastName: user?.user_metadata?.last_name || ''
        }
      });
      
      if (error) throw error;
      
      if (data.url) {
        // Redirect to Stripe onboarding
        window.open(data.url, '_blank');
        
        toast({
          title: 'Redirecting to Stripe',
          description: 'Complete your account setup in the new window.',
        });

        // Start polling for account status
        pollAccountStatus(data.accountId);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create Stripe account. Please try again.');
      toast({
        title: 'Error',
        description: 'Failed to create Stripe account',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const pollAccountStatus = async (accountId: string) => {
    const maxAttempts = 30; // Poll for 5 minutes
    let attempts = 0;

    const poll = async () => {
      try {
        const { data, error } = await supabase
          .from('host_stripe_accounts')
          .select('*')
          .eq('stripe_account_id', accountId)
          .single();

        if (error) throw error;

        setExistingAccount(data);

        if (data.onboarding_completed && data.payouts_enabled) {
          toast({
            title: 'Account Setup Complete',
            description: 'Your Stripe account is now ready for payments!',
          });
          onAccountLinked();
          return;
        }

        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 10000); // Poll every 10 seconds
        }
      } catch (err) {
        console.error('Error polling account status:', err);
      }
    };

    poll();
  };

  const checkStripeAccountStatus = async () => {
    if (!existingAccount) return;
    
    setIsCheckingStatus(true);
    try {
      const { data, error } = await supabase.functions.invoke("check-stripe-account-status");
      
      if (error) throw error;

      // Refresh account data
      await checkExistingStripeAccount();
      
      toast({
        title: "Status Updated",
        description: `Account status: ${data.accountStatus}`,
      });

      if (data.accountStatus === "active") {
        onAccountLinked();
      }
    } catch (error) {
      console.error("Error checking account status:", error);
      toast({
        title: "Error",
        description: "Failed to check account status",
        variant: "destructive",
      });
    } finally {
      setIsCheckingStatus(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Active
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            Pending
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            <AlertCircle className="h-3 w-3 mr-1" />
            Unknown
          </span>
        );
    }
  };

  if (checkingAccount) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Checking account status...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show existing account status if available
  if (existingAccount) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CreditCard className="h-5 w-5 mr-2" />
            Stripe Account Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h3 className="font-medium">Account Status</h3>
              <p className="text-sm text-muted-foreground">
                Account ID: {existingAccount.stripe_account_id}
              </p>
            </div>
            {getStatusBadge(existingAccount.account_status)}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              {existingAccount.onboarding_completed ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-yellow-600" />
              )}
              <span className="text-sm">
                Onboarding {existingAccount.onboarding_completed ? 'Complete' : 'Pending'}
              </span>
            </div>

            <div className="flex items-center space-x-2">
              {existingAccount.payouts_enabled ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-yellow-600" />
              )}
              <span className="text-sm">
                Payouts {existingAccount.payouts_enabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
          </div>

          {existingAccount.onboarding_completed && existingAccount.payouts_enabled ? (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Your Stripe account is fully set up and ready to receive payments!
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Complete your Stripe account setup to start receiving payments.
                </AlertDescription>
              </Alert>
              
              <div className="space-y-2">
                {!existingAccount.onboarding_completed && (
                  <Button
                    onClick={handleCreateStripeAccount}
                    disabled={loading}
                    className="w-full"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Redirecting...
                      </>
                    ) : (
                      <>
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Continue Setup
                      </>
                    )}
                  </Button>
                )}
                
                <Button 
                  onClick={checkStripeAccountStatus} 
                  disabled={isCheckingStatus}
                  variant="outline"
                  className="w-full"
                >
                  {isCheckingStatus ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Checking Status...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Check Account Status
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    );
  }

  // Initial setup flow
  if (hasStripeAccount === null) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CreditCard className="h-5 w-5 mr-2" />
            Stripe Account Setup
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertDescription>
              To collect payments for your events, you need a Stripe account. Do you already have one?
            </AlertDescription>
          </Alert>
          
          <div className="flex space-x-4">
            <Button onClick={() => setHasStripeAccount(false)} disabled={loading}>
              Create New Account
            </Button>
            <Button variant="outline" onClick={() => setHasStripeAccount(true)} disabled={loading}>
              I Have an Account
            </Button>
          </div>
          
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <CreditCard className="h-5 w-5 mr-2" />
          {hasStripeAccount ? 'Link Existing Stripe Account' : 'Create Stripe Account'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {hasStripeAccount ? (
          <>
            <Alert>
              <AlertDescription>
                You'll be redirected to Stripe to securely link your existing account.
              </AlertDescription>
            </Alert>
            <Button onClick={handleCreateStripeAccount} disabled={loading} className="w-full">
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <ExternalLink className="h-4 w-4 mr-2" />
              )}
              Link Existing Stripe Account
            </Button>
          </>
        ) : (
          <>
            <Alert>
              <AlertDescription>
                You'll be redirected to Stripe to create and verify your new account.
              </AlertDescription>
            </Alert>
            <Button onClick={handleCreateStripeAccount} disabled={loading} className="w-full">
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <ExternalLink className="h-4 w-4 mr-2" />
              )}
              Create Stripe Account
            </Button>
          </>
        )}
        
        <Button variant="ghost" onClick={() => setHasStripeAccount(null)} disabled={loading}>
          Back
        </Button>
        
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default StripeAccountForm;
