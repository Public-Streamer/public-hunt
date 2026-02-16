import React, { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { loadStripe } from "@stripe/stripe-js";
import {
    Elements,
    CardElement,
    useStripe,
    useElements,
} from "@stripe/react-stripe-js";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { Loader2, DollarSign, Heart, CreditCard, Lock } from "lucide-react";
import { useAppContext } from "@/contexts/AppContext";
import confetti from 'canvas-confetti';

const stripePromise = loadStripe(
    "pk_live_51KOPkUE32NQ2lR8eywxU7YPxpdGQa6CxJtc718SMEWyjwBJfC4RZNsf3tbdJuXxEKBq9NljScc3RNUt2MPJ7fH1h00akWpbExQ"
);

interface TippingModalProps {
    eventId: string;
    hostAccountId: string;
    onSuccess?: () => void;
    trigger?: React.ReactNode;
}

const TippingForm: React.FC<{
    eventId: string;
    hostAccountId: string;
    onSuccess: () => void;
    onCancel: () => void;
}> = ({ eventId, hostAccountId, onSuccess, onCancel }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [step, setStep] = useState<"amount" | "payment">("amount");
    const [amount, setAmount] = useState<number>(5);
    const [customAmount, setCustomAmount] = useState<string>("");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const [clientSecret, setClientSecret] = useState<string>("");
    const { toast } = useToast();
    const { user } = useAppContext();

    const PRESET_AMOUNTS = [1, 5, 10, 20];

    const handleAmountSelect = (val: number) => {
        setAmount(val);
        setCustomAmount("");
    };

    const initializePayment = async () => {
        try {
            setLoading(true);
            const finalAmount = customAmount ? parseFloat(customAmount) : amount;

            if (!finalAmount || finalAmount < 0.50) {
                throw new Error("Minimum tip amount is $0.50");
            }

            if (!user) {
                throw new Error("You must be logged in to tip");
            }

            const { data, error } = await supabase.functions.invoke("process-tip-payment", {
                body: {
                    eventId,
                    amount: finalAmount,
                    connectedAccountId: hostAccountId,
                    customerEmail: user.email,
                    message: message,
                },
            });

            if (error) throw error;
            if (!data?.clientSecret) throw new Error("Failed to initialize payment");

            setClientSecret(data.clientSecret);
            setStep("payment");
        } catch (error) {
            console.error("Error initializing tip:", error);
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to setup payment",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handlePaymentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!stripe || !elements || !clientSecret) return;

        setLoading(true);
        const card = elements.getElement(CardElement);
        if (!card) return;

        try {
            const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
                payment_method: {
                    card,
                    billing_details: {
                        email: user?.email,
                    }
                },
            });

            if (error) {
                throw error;
            }

            if (paymentIntent?.status === "succeeded") {
                toast({
                    title: "💝 Tip Sent!",
                    description: `Your $${(customAmount ? parseFloat(customAmount) : amount).toFixed(2)} tip was sent successfully. Thank you for supporting the streamer!`,
                    duration: 8000,
                    className: "bg-green-600 text-white border-none",
                });

                // Fire confetti
                confetti({
                    particleCount: 100,
                    spread: 70,
                    origin: { y: 0.6 },
                    colors: ['#FF69B4', '#FFB6C1', '#FFC0CB'] // Pinks
                });

                // Finalize tip on backend (email, db, notification)
                supabase.functions.invoke('finalize-tip', {
                    body: { paymentIntentId: paymentIntent.id }
                });

                // Send chat message if included (optional feature implementation pending or just rely on backend)
                // For now just close
                setTimeout(() => onSuccess(), 2000);
            }
        } catch (error) {
            console.error("Payment error:", error);
            toast({
                title: "Payment Failed",
                description: error instanceof Error ? error.message : "Payment failed",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    if (step === "amount") {
        return (
            <div className="space-y-4">
                <div className="grid grid-cols-4 gap-2">
                    {PRESET_AMOUNTS.map((amt) => (
                        <Button
                            key={amt}
                            variant={amount === amt && !customAmount ? "default" : "outline"}
                            onClick={() => handleAmountSelect(amt)}
                            className="w-full"
                        >
                            ${amt}
                        </Button>
                    ))}
                </div>

                <div className="space-y-2">
                    <Label>Custom Amount</Label>
                    <div className="relative">
                        <DollarSign className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="number"
                            min="1"
                            step="1"
                            placeholder="Custom amount"
                            value={customAmount}
                            onChange={(e) => {
                                setCustomAmount(e.target.value);
                                if (e.target.value) setAmount(parseFloat(e.target.value));
                            }}
                            className="pl-8"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label>Message (Optional)</Label>
                    <Textarea
                        placeholder="Say something nice..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="resize-none"
                    />
                </div>

                <Button
                    className="w-full bg-pink-600 hover:bg-pink-700 text-white"
                    onClick={initializePayment}
                    disabled={loading}
                >
                    {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                        <Heart className="h-4 w-4 mr-2" />
                    )}
                    Send ${(customAmount ? parseFloat(customAmount) : amount).toFixed(2)} Tip
                </Button>
            </div>
        );
    }

    return (
        <form onSubmit={handlePaymentSubmit} className="space-y-4">
            <div className="bg-muted p-4 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Lock className="h-4 w-4 text-green-600" />
                        <span className="font-semibold">Secure Payment</span>
                    </div>
                    <span className="font-bold text-lg">
                        ${(customAmount ? parseFloat(customAmount) : amount).toFixed(2)}
                    </span>
                </div>

                <div className="p-3 bg-white border rounded-md">
                    <CardElement options={{
                        style: {
                            base: {
                                fontSize: '16px',
                                color: '#424770',
                                '::placeholder': { color: '#aab7c4' },
                            },
                        }
                    }} />
                </div>
            </div>

            <div className="flex gap-2">
                <Button variant="outline" type="button" onClick={() => setStep("amount")} disabled={loading}>
                    Back
                </Button>
                <Button type="submit" className="flex-1 bg-pink-600 hover:bg-pink-700" disabled={loading}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm Tip"}
                </Button>
            </div>
        </form>
    );
};

export const TippingModal: React.FC<TippingModalProps> = ({ eventId, hostAccountId, trigger }) => {
    const [open, setOpen] = useState(false);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="outline" className="gap-2">
                        <Heart className="h-4 w-4 text-pink-500" />
                        Tip Host
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Heart className="h-5 w-5 text-pink-600 fill-current" />
                        Support the Streamer
                    </DialogTitle>
                </DialogHeader>

                <Elements stripe={stripePromise}>
                    <TippingForm
                        eventId={eventId}
                        hostAccountId={hostAccountId}
                        onSuccess={() => setOpen(false)}
                        onCancel={() => setOpen(false)}
                    />
                </Elements>
            </DialogContent>
        </Dialog>
    );
};
