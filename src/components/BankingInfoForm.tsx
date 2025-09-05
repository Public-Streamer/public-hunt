import React, { useState } from 'react';
import { Building2, Shield } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/lib/supabase';

interface BankingInfo {
  bankName: string;
  accountHolderName: string;
  routingNumber: string;
  accountNumber: string;
  confirmAccountNumber: string;
}

interface BankingInfoFormProps {
  onBankingInfoSaved: () => void;
}

const BankingInfoForm: React.FC<BankingInfoFormProps> = ({
  onBankingInfoSaved,
}) => {
  const [bankingInfo, setBankingInfo] = useState<BankingInfo>({
    bankName: '',
    accountHolderName: '',
    routingNumber: '',
    accountNumber: '',
    confirmAccountNumber: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleInputChange = (field: keyof BankingInfo, value: string) => {
    setBankingInfo((prev) => ({ ...prev, [field]: value }));
    setError('');
  };

  const validateForm = (): boolean => {
    if (!bankingInfo.bankName.trim()) {
      setError('Bank name is required');
      return false;
    }
    if (!bankingInfo.accountHolderName.trim()) {
      setError('Account holder name is required');
      return false;
    }
    if (bankingInfo.routingNumber.length !== 9) {
      setError('Routing number must be 9 digits');
      return false;
    }
    if (bankingInfo.accountNumber.length < 4) {
      setError('Account number is too short');
      return false;
    }
    if (bankingInfo.accountNumber !== bankingInfo.confirmAccountNumber) {
      setError('Account numbers do not match');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    setError('');

    try {
      const { data, error } = await supabase.functions.invoke(
        'save-banking-info',
        {
          body: {
            userId: 'current-user-id',
            bankingInfo: {
              bankName: bankingInfo.bankName,
              accountHolderName: bankingInfo.accountHolderName,
              routingNumber: bankingInfo.routingNumber,
              accountNumber: bankingInfo.accountNumber,
            },
          },
        }
      );

      if (error) throw error;

      setSuccess(true);
      setTimeout(() => {
        onBankingInfoSaved();
      }, 2000);
    } catch (err) {
      setError('Failed to save banking information. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-green-600">
            <Shield className="h-5 w-5 mr-2" />
            Banking Information Saved
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              Your banking information has been securely saved and encrypted.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Building2 className="h-5 w-5 mr-2" />
          Banking Information
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Alert className="mb-4">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            Your banking information is encrypted and securely stored. This is
            required for fund transfers.
          </AlertDescription>
        </Alert>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="bankName">Bank Name *</Label>
            <Input
              id="bankName"
              value={bankingInfo.bankName}
              onChange={(e) => handleInputChange('bankName', e.target.value)}
              placeholder="Enter your bank name"
              required
            />
          </div>

          <div>
            <Label htmlFor="accountHolderName">Account Holder Name *</Label>
            <Input
              id="accountHolderName"
              value={bankingInfo.accountHolderName}
              onChange={(e) =>
                handleInputChange('accountHolderName', e.target.value)
              }
              placeholder="Enter account holder name"
              required
            />
          </div>

          <div>
            <Label htmlFor="routingNumber">Routing Number *</Label>
            <Input
              id="routingNumber"
              value={bankingInfo.routingNumber}
              onChange={(e) =>
                handleInputChange(
                  'routingNumber',
                  e.target.value.replace(/\D/g, '')
                )
              }
              placeholder="9-digit routing number"
              maxLength={9}
              required
            />
          </div>

          <div>
            <Label htmlFor="accountNumber">Account Number *</Label>
            <Input
              id="accountNumber"
              value={bankingInfo.accountNumber}
              onChange={(e) =>
                handleInputChange(
                  'accountNumber',
                  e.target.value.replace(/\D/g, '')
                )
              }
              placeholder="Enter account number"
              required
            />
          </div>

          <div>
            <Label htmlFor="confirmAccountNumber">
              Confirm Account Number *
            </Label>
            <Input
              id="confirmAccountNumber"
              value={bankingInfo.confirmAccountNumber}
              onChange={(e) =>
                handleInputChange(
                  'confirmAccountNumber',
                  e.target.value.replace(/\D/g, '')
                )
              }
              placeholder="Re-enter account number"
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
  );
};

export default BankingInfoForm;
