
import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAppContext } from '@/contexts/AppContext';
import PaymentSetupWizard from '@/components/PaymentSetupWizard';

const PaymentSetup: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isAuthenticated } = useAppContext();
  const [showWizard, setShowWizard] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    // Handle Stripe redirect responses
    const success = searchParams.get('success');
    const refresh = searchParams.get('refresh');
    const error = searchParams.get('error');

    if (success === 'true') {
      toast({
        title: 'Account Setup Successful',
        description: 'Your Stripe account has been set up successfully!',
      });
      // Clear URL parameters
      window.history.replaceState({}, '', '/payment-setup');
    } else if (refresh === 'true') {
      toast({
        title: 'Setup Incomplete',
        description: 'Please complete your Stripe account setup to continue.',
        variant: 'destructive'
      });
      // Clear URL parameters
      window.history.replaceState({}, '', '/payment-setup');
    } else if (error) {
      toast({
        title: 'Setup Error',
        description: `There was an error setting up your account: ${error}`,
        variant: 'destructive'
      });
      // Clear URL parameters
      window.history.replaceState({}, '', '/payment-setup');
    }
  }, [searchParams, navigate, toast, isAuthenticated]);

  const handleSetupComplete = () => {
    toast({
      title: 'Payment Setup Complete',
      description: 'You can now create paid events and collect payments!',
    });
    navigate('/create');
  };

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-yellow-500" />
              <h2 className="text-xl font-semibold mb-2">Authentication Required</h2>
              <p className="text-muted-foreground">Please log in to set up payment processing.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Payment Setup</h1>
        <p className="text-muted-foreground">
          Set up your payment processing to start monetizing your events
        </p>
      </div>

      {showWizard && (
        <PaymentSetupWizard onComplete={handleSetupComplete} />
      )}
    </div>
  );
};

export default PaymentSetup;
