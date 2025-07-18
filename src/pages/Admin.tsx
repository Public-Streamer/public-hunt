import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { User, Settings, DollarSign, Users, CreditCard, Building2, CheckCircle, ExternalLink } from 'lucide-react';
import { supabase } from '@/lib/supabase';


const Admin: React.FC = () => {
  const [showPaymentSetup, setShowPaymentSetup] = useState(false);
  const [paymentSetupComplete, setPaymentSetupComplete] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [bankingInfo, setBankingInfo] = useState({
    bankName: '',
    accountHolderName: '',
    routingNumber: '',
    accountNumber: ''
  });

  const handleCreateStripeAccount = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-stripe-account', {
        body: { userId: 'current-user-id' }
      });
      if (error) throw error;
      window.open(data.onboardingUrl, '_blank');
    } catch (err) {
      setError('Failed to create Stripe account');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBankingInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('save-banking-info', {
        body: { userId: 'current-user-id', bankingInfo }
      });
      if (error) throw error;
      setPaymentSetupComplete(true);
    } catch (err) {
      setError('Failed to save banking information');
    } finally {
      setLoading(false);
    }
  };

  if (showPaymentSetup && !paymentSetupComplete) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Payment Setup</h1>
        
        <div className="max-w-2xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CreditCard className="h-5 w-5 mr-2" />
                Stripe Account Setup
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Alert className="mb-4">
                <AlertDescription>
                  Connect your Stripe account to collect payments for events.
                </AlertDescription>
              </Alert>
              <Button onClick={handleCreateStripeAccount} disabled={loading} className="w-full">
                <ExternalLink className="h-4 w-4 mr-2" />
                Create/Connect Stripe Account
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Building2 className="h-5 w-5 mr-2" />
                Banking Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveBankingInfo} className="space-y-4">
                <div>
                  <Label htmlFor="bankName">Bank Name</Label>
                  <Input
                    id="bankName"
                    value={bankingInfo.bankName}
                    onChange={(e) => setBankingInfo({...bankingInfo, bankName: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="accountHolderName">Account Holder Name</Label>
                  <Input
                    id="accountHolderName"
                    value={bankingInfo.accountHolderName}
                    onChange={(e) => setBankingInfo({...bankingInfo, accountHolderName: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="routingNumber">Routing Number</Label>
                  <Input
                    id="routingNumber"
                    value={bankingInfo.routingNumber}
                    onChange={(e) => setBankingInfo({...bankingInfo, routingNumber: e.target.value})}
                    maxLength={9}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="accountNumber">Account Number</Label>
                  <Input
                    id="accountNumber"
                    value={bankingInfo.accountNumber}
                    onChange={(e) => setBankingInfo({...bankingInfo, accountNumber: e.target.value})}
                    required
                  />
                </div>
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? 'Saving...' : 'Save Banking Information'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Channel Administration</h1>
      
      {!paymentSetupComplete && (
        <Alert className="mb-6">
          <AlertDescription>
            Payment setup is required to collect payments for events.
            <Button onClick={() => setShowPaymentSetup(true)} className="ml-4">
              Setup Payment Processing
            </Button>
          </AlertDescription>
        </Alert>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="h-5 w-5 mr-2" />
              Profile Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" defaultValue="admin@example.com" />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" defaultValue="+1 (555) 123-4567" />
            </div>
            <div>
              <Label htmlFor="address">Address</Label>
              <Input id="address" defaultValue="123 Main St, City, State" />
            </div>
            <Button>Update Profile</Button>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Settings className="h-5 w-5 mr-2" />
              Security
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="password">New Password</Label>
              <Input id="password" type="password" />
            </div>
            <div>
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input id="confirmPassword" type="password" />
            </div>
            <Button>Change Password</Button>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <DollarSign className="h-5 w-5 mr-2" />
              Payment Status
              {paymentSetupComplete && <CheckCircle className="h-4 w-4 ml-2 text-green-600" />}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {paymentSetupComplete ? (
              <div className="space-y-2">
                <p className="text-green-600">✓ Stripe account connected</p>
                <p className="text-green-600">✓ Banking information saved</p>
                <p>Ready to collect payments!</p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-orange-600">Payment setup required</p>
                <Button onClick={() => setShowPaymentSetup(true)} size="sm">
                  Complete Setup
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Permissions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p>Event Managers: 2</p>
              <p>Event Streamers: 5</p>
              <p>Event Creators: 3</p>
            </div>
            <Button className="mt-4">Manage Permissions</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Admin;