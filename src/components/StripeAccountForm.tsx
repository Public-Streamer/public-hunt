import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CreditCard, ExternalLink, CheckCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface StripeAccountFormProps {
  onAccountLinked: () => void;
}

const StripeAccountForm: React.FC<StripeAccountFormProps> = ({ onAccountLinked }) => {
  const [hasStripeAccount, setHasStripeAccount] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreateStripeAccount = async () => {
    setLoading(true);
    setError('');
    
    try {
      const { data, error } = await supabase.functions.invoke('create-stripe-account', {
        body: { userId: 'current-user-id' }
      });
      
      if (error) throw error;
      
      // Redirect to Stripe onboarding
      window.open(data.onboardingUrl, '_blank');
    } catch (err) {
      setError('Failed to create Stripe account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLinkExistingAccount = async () => {
    setLoading(true);
    setError('');
    
    try {
      const { data, error } = await supabase.functions.invoke('link-stripe-account', {
        body: { userId: 'current-user-id' }
      });
      
      if (error) throw error;
      
      // Redirect to Stripe OAuth
      window.open(data.oauthUrl, '_blank');
    } catch (err) {
      setError('Failed to link Stripe account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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
            <Button onClick={handleLinkExistingAccount} disabled={loading} className="w-full">
              <ExternalLink className="h-4 w-4 mr-2" />
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
              <ExternalLink className="h-4 w-4 mr-2" />
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