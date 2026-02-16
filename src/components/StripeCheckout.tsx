import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CreditCard, Lock, AlertTriangle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";

interface StripeCheckoutProps {
  eventId: string;
  eventTitle: string;
  price: number;
  hostStripeAccountId?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

// Read Stripe publishable key from environment (Vite convention)
const stripePromise = loadStripe(
  "pk_live_51KOPkUE32NQ2lR8eywxU7YPxpdGQa6CxJtc718SMEWyjwBJfC4RZNsf3tbdJuXxEKBq9NljScc3RNUt2MPJ7fH1h00akWpbExQ"
);

const CheckoutForm: React.FC<StripeCheckoutProps> = ({
  eventId,
  eventTitle,
  price,
  hostStripeAccountId,
  onSuccess,
  onCancel,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [clientSecret, setClientSecret] = useState<string>("");
  const { toast } = useToast();

  useEffect(() => {
    const checkTicketAndInitializePayment = async () => {
      if (!hostStripeAccountId) return;

      try {
        const { data: user } = await supabase.auth.getUser();
        if (!user.user) {
          throw new Error("Please log in to purchase tickets");
        }

        // Check if user already has a ticket
        // const { data: existingTicket } = await supabase
        //   .from("tickets")
        //   .select("*")
        //   .eq("event_id", eventId)
        //   .eq("user_id", user.user.id)
        //   .eq("status", "active")
        //   .single();

        // if (existingTicket) {
        //   toast({
        //     title: "Already Purchased",
        //     description: "You already have a ticket for this event",
        //     variant: "default",
        //   });
        //   // onSuccess(); // Trigger success flow since they already have access
        //   return;
        // }

        const { data, error } = await supabase.functions.invoke(
          "process-ticket-payment",
          {
            body: {
              eventId,
              amount: price,
              connectedAccountId: hostStripeAccountId,
              customerEmail: user.user.email,
              customerName:
                user.user.user_metadata?.full_name ||
                user.user.email?.split("@")[0],
            },
          }
        );

        if (error) throw error;

        if (data?.clientSecret) {
          setClientSecret(data.clientSecret);
        } else {
          throw new Error("Failed to initialize payment");
        }
      } catch (error) {
        console.error("Payment initialization error:", error);
        // toast({
        //   title: "Payment Setup Failed",
        //   description:
        //     error instanceof Error ? error.message : "Please try again.",
        //   variant: "destructive",
        // });
      }
    };

    checkTicketAndInitializePayment();
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements || !clientSecret) {
      return;
    }

    setLoading(true);

    const card = elements.getElement(CardElement);
    if (!card) {
      setLoading(false);
      return;
    }

    try {
      const { error, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: {
            card,
          },
        }
      );

      if (error) {
        toast({
          title: "Payment Failed",
          description: error.message || "Please try again.",
          variant: "destructive",
        });
      }
      // if (paymentIntent?.status === "processing") {
      //   setPaymentProcessing(true);
      // }
      if (paymentIntent?.status === "succeeded") {
        toast({
          title: "🎟️ Ticket Purchased!",
          description: "Check your email for confirmation and entry details. You can also view your ticket in 'My Tickets'.",
          duration: 8000,
          className: "bg-green-600 text-white border-none",
        });

        // Finalize ticket on backend (email, QR code, db)
        // Note: Similar to tip, we might want a 'finalize-ticket' function if process-ticket-payment only does intent. 
        // But checking process-ticket-payment, it just creates intent.
        // It does not insert the ticket row yet.
        // So we need a finalize step or we need to rely on webhook.
        // Given we used finalize-tip for immediate feedback, let's use finalize-ticket too.

        supabase.functions.invoke('finalize-ticket', {
          body: { paymentIntentId: paymentIntent.id }
        });

        onSuccess();
      }
    } catch (error) {
      console.error("Payment error:", error);
      toast({
        title: "Payment Failed",
        description: "An unexpected error occurred. Please try again.",
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
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Card Details</span>
                </div>
                <div className="border rounded-md p-3 bg-white">
                  <CardElement
                    options={{
                      style: {
                        base: {
                          fontSize: "16px",
                          color: "#424770",
                          "::placeholder": {
                            color: "#aab7c4",
                          },
                        },
                        invalid: {
                          color: "#9e2146",
                        },
                      },
                    }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Your payment is processed securely through Stripe. We never
                  store your card details.
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
                  type="submit"
                  disabled={loading || !stripe || !clientSecret}
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
          </form>
        </div>
      </CardContent>
    </Card>
  );
};

const StripeCheckout: React.FC<StripeCheckoutProps> = (props) => {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm {...props} />
    </Elements>
  );
};

export default StripeCheckout;
