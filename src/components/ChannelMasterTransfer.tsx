import React, { useState } from 'react';
import { Crown, AlertTriangle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface User {
  id: string;
  name: string;
  email: string;
}

interface ChannelMasterTransferProps {
  currentMaster: User;
  channelAdmins: User[];
  onTransfer: (newMasterId: string) => void;
}

const ChannelMasterTransfer: React.FC<ChannelMasterTransferProps> = ({
  currentMaster,
  channelAdmins,
  onTransfer,
}) => {
  const [selectedAdmin, setSelectedAdmin] = useState<string>('');
  const [confirmationText, setConfirmationText] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<'select' | 'confirm' | 'success'>('select');

  const confirmationPhrase = 'TRANSFER MASTER ROLE';
  const isConfirmationValid = confirmationText === confirmationPhrase;

  const handleTransfer = () => {
    if (selectedAdmin && isConfirmationValid) {
      onTransfer(selectedAdmin);
      setStep('success');
      setTimeout(() => {
        setIsOpen(false);
        setStep('select');
        setSelectedAdmin('');
        setConfirmationText('');
      }, 2000);
    }
  };

  const resetDialog = () => {
    setStep('select');
    setSelectedAdmin('');
    setConfirmationText('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="border-yellow-500 text-yellow-600 hover:bg-yellow-50"
        >
          <Crown className="h-4 w-4 mr-2" />
          Transfer Master Role
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Crown className="h-5 w-5 mr-2 text-yellow-500" />
            Transfer Channel Master Role
          </DialogTitle>
        </DialogHeader>

        {step === 'select' && (
          <div className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                This action will transfer all master privileges to another user.
                You will become a regular channel administrator.
              </AlertDescription>
            </Alert>

            <div>
              <Label htmlFor="admin-select">Select New Channel Master</Label>
              <select
                id="admin-select"
                value={selectedAdmin}
                onChange={(e) => setSelectedAdmin(e.target.value)}
                className="w-full p-2 border rounded-md"
              >
                <option value="">Choose an administrator...</option>
                {channelAdmins.map((admin) => (
                  <option key={admin.id} value={admin.id}>
                    {admin.name} ({admin.email})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setIsOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={() => setStep('confirm')}
                disabled={!selectedAdmin}
                className="flex-1"
              >
                Continue
              </Button>
            </div>
          </div>
        )}

        {step === 'confirm' && (
          <div className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Warning:</strong> This action cannot be undone. The new
                master will have full control over the channel.
              </AlertDescription>
            </Alert>

            <div>
              <Label htmlFor="confirmation">
                Type "{confirmationPhrase}" to confirm
              </Label>
              <Input
                id="confirmation"
                value={confirmationText}
                onChange={(e) => setConfirmationText(e.target.value)}
                placeholder={confirmationPhrase}
                className="font-mono"
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={resetDialog}
                className="flex-1"
              >
                Back
              </Button>
              <Button
                onClick={handleTransfer}
                disabled={!isConfirmationValid}
                variant="destructive"
                className="flex-1"
              >
                Transfer Role
              </Button>
            </div>
          </div>
        )}

        {step === 'success' && (
          <div className="text-center space-y-4">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
            <div>
              <h3 className="text-lg font-medium">Transfer Complete</h3>
              <p className="text-sm text-gray-600 mt-1">
                The channel master role has been successfully transferred.
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ChannelMasterTransfer;
