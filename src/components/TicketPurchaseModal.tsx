import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import StripeCheckout from './StripeCheckout';

interface TicketPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  eventTitle: string;
  price: number;
  hostStripeAccountId?: string;
  onPurchaseSuccess: () => void;
}

const TicketPurchaseModal: React.FC<TicketPurchaseModalProps> = ({
  isOpen,
  onClose,
  eventId,
  eventTitle,
  price,
  hostStripeAccountId,
  onPurchaseSuccess
}) => {
  const [purchaseComplete, setPurchaseComplete] = useState(false);

  const handleSuccess = () => {
    setPurchaseComplete(true);
    setTimeout(() => {
      onPurchaseSuccess();
      onClose();
      setPurchaseComplete(false);
    }, 2000);
  };

  const handleClose = () => {
    if (!purchaseComplete) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Purchase Ticket
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              disabled={purchaseComplete}
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>
        
        {purchaseComplete ? (
          <div className="text-center py-8">
            <div className="text-green-600 text-lg font-semibold mb-2">
              ✓ Purchase Successful!
            </div>
            <p className="text-gray-600">
              Your ticket for {eventTitle} has been confirmed.
            </p>
          </div>
        ) : (
          <StripeCheckout
            eventId={eventId}
            eventTitle={eventTitle}
            price={price}
            hostStripeAccountId={hostStripeAccountId}
            onSuccess={handleSuccess}
            onCancel={onClose}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};

export default TicketPurchaseModal;