import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, CreditCard, Building2, ArrowRight } from 'lucide-react';
import StripeAccountForm from './StripeAccountForm';
import BankingInfoForm from './BankingInfoForm';

type SetupStep = 'welcome' | 'stripe' | 'banking' | 'complete';

interface PaymentSetupWizardProps {
  onComplete: () => void;
}

const PaymentSetupWizard: React.FC<PaymentSetupWizardProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState<SetupStep>('welcome');
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());

  const handleStripeAccountLinked = () => {
    setCompletedSteps(prev => new Set([...prev, 'stripe']));
    setCurrentStep('banking');
  };

  const handleBankingInfoSaved = () => {
    setCompletedSteps(prev => new Set([...prev, 'banking']));
    setCurrentStep('complete');
  };

  const handleComplete = () => {
    onComplete();
  };

  const renderStepIndicator = () => {
    const steps = [
      { key: 'stripe', label: 'Stripe Account', icon: CreditCard },
      { key: 'banking', label: 'Banking Info', icon: Building2 },
      { key: 'complete', label: 'Complete', icon: CheckCircle }
    ];

    return (
      <div className="flex items-center justify-center mb-6">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isCompleted = completedSteps.has(step.key);
          const isCurrent = currentStep === step.key;
          
          return (
            <React.Fragment key={step.key}>
              <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
                isCompleted ? 'bg-green-100 text-green-700' :
                isCurrent ? 'bg-blue-100 text-blue-700' :
                'bg-gray-100 text-gray-500'
              }`}>
                <Icon className="h-4 w-4" />
                <span className="text-sm font-medium">{step.label}</span>
                {isCompleted && <CheckCircle className="h-4 w-4" />}
              </div>
              {index < steps.length - 1 && (
                <ArrowRight className="h-4 w-4 mx-2 text-gray-400" />
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  if (currentStep === 'welcome') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Payment Setup Required</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertDescription>
              To collect payments for your events, you need to set up payment processing and banking information.
            </AlertDescription>
          </Alert>
          
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <CreditCard className="h-5 w-5 text-blue-600" />
              <div>
                <h3 className="font-medium">Stripe Account</h3>
                <p className="text-sm text-gray-600">Connect or create a Stripe account for payment processing</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Building2 className="h-5 w-5 text-green-600" />
              <div>
                <h3 className="font-medium">Banking Information</h3>
                <p className="text-sm text-gray-600">Provide bank details for fund transfers</p>
              </div>
            </div>
          </div>
          
          <Button onClick={() => setCurrentStep('stripe')} className="w-full">
            Start Setup
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (currentStep === 'complete') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-green-600">
            <CheckCircle className="h-5 w-5 mr-2" />
            Payment Setup Complete
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertDescription>
              Your payment processing is now set up! You can start collecting payments for your events.
            </AlertDescription>
          </Alert>
          
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm">Stripe account connected</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm">Banking information saved</span>
            </div>
          </div>
          
          <Button onClick={handleComplete} className="w-full">
            Continue to Admin Dashboard
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {renderStepIndicator()}
      
      {currentStep === 'stripe' && (
        <StripeAccountForm onAccountLinked={handleStripeAccountLinked} />
      )}
      
      {currentStep === 'banking' && (
        <BankingInfoForm onBankingInfoSaved={handleBankingInfoSaved} />
      )}
    </div>
  );
};

export default PaymentSetupWizard;