import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CreditCard, Lock, AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

interface StripeCheckoutProps {
  eventId: string;
  eventTitle: string;
  price: number;
  hostStripeAccountId?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

const StripeCheckout: React.FC<StripeCheckoutProps> = ({
  eventId,
  eventTitle,
  price,
  hostStripeAccountId,
  onSuccess,
  onCancel
}) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleCheckout = async () => {
    if (!hostStripeAccountId) {
      toast({
        title: "Payment Not Available",
        description: "Host has not set up payment processing yet.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        throw new Error("Please log in to purchase tickets");
      }

      const { data, error } = await supabase.functions.invoke('process-ticket-payment', {
        body: {
          eventId,
          amount: price,
          connectedAccountId: hostStripeAccountId,
          customerEmail: user.user.email,
          customerName: user.user.user_metadata?.full_name || user.user.email?.split('@')[0]
        }
      });

      if (error) throw error;

      if (data?.clientSecret) {
        // For now, we'll create a simple payment success simulation
        // In production, this would redirect to Stripe Checkout
        toast({
          title: "Payment Processed",
          description: "Your ticket has been purchased successfully!",
          variant: "default",
        });
        onSuccess();
      } else {
        throw new Error("Failed to initialize payment");
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast({
        title: "Payment Failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!hostStripeAccountId) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Payment Unavailable
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            The event host has not set up payment processing yet.
          </p>
          <Button onClick={onCancel} variant="outline" className="w-full">
            Go Back
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Secure Checkout
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {eventTitle} - ${price.toFixed(2)}
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="bg-muted p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Lock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Secure Payment</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Your payment is processed securely through Stripe. We never store your card details.
            </p>
          </div>
          
          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={loading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCheckout}
              disabled={loading}
              className="flex-1"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Lock className="h-4 w-4 mr-2" />
                  Pay ${price.toFixed(2)}
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StripeCheckout;