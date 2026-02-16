import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, CheckCircle, Loader2 } from "lucide-react";
import { format } from "date-fns";
import jsPDF from "jspdf";

interface TipDetails {
    id: string;
    amount: number;
    created_at: string;
    stripe_payment_intent_id: string;
    message: string | null;
    host: {
        display_name: string;
        avatar_url: string;
    };
    event: {
        title: string;
    };
}

const TipReceipt: React.FC = () => {
    const { paymentIntentId } = useParams<{ paymentIntentId: string }>();
    const [tip, setTip] = useState<TipDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchTip = async () => {
            if (!paymentIntentId) return;
            setLoading(true);

            // We need to fetch from 'tips' table. 
            // Note: RLS allows user to view their own tips.
            // If the tip was just created, it might take a moment if we are redirecting immediately.
            // But checking 'finalize-tip' call, it inserts immediately.

            try {
                const { data, error } = await supabase
                    .from('tips' as any)
                    .select(`
                        id,
                        amount,
                        created_at,
                        stripe_payment_intent_id,
                        message,
                        host:user_profiles!host_id(display_name, avatar_url),
                        event:events!event_id(title)
                    `)
                    .eq('stripe_payment_intent_id', paymentIntentId)
                    .single();

                if (error) throw error;
                setTip(data);
            } catch (err) {
                console.error("Error fetching tip:", err);
                setError("Could not find tip receipt. It may not have been processed yet or you may not have permission to view it.");
            } finally {
                setLoading(false);
            }
        };

        fetchTip();
    }, [paymentIntentId]);

    const handleDownloadPDF = () => {
        if (!tip) return;

        const doc = new jsPDF();

        // Header
        doc.setFontSize(22);
        doc.setTextColor(255, 105, 180); // Hot Pink
        doc.text("PublicStreamer", 105, 20, { align: "center" });

        doc.setFontSize(16);
        doc.setTextColor(0, 0, 0);
        doc.text("Tip Receipt", 105, 30, { align: "center" });

        doc.setLineWidth(0.5);
        doc.line(20, 35, 190, 35);

        // Details
        doc.setFontSize(12);
        doc.text(`Date: ${format(new Date(tip.created_at), "PPpp")}`, 20, 50);
        doc.text(`Transaction ID: ${tip.stripe_payment_intent_id}`, 20, 60);

        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text(`Amount: $${tip.amount.toFixed(2)}`, 20, 80);
        doc.setFont("helvetica", "normal");

        doc.text(`To Host: ${tip.host?.display_name || 'Unknown Host'}`, 20, 90);
        doc.text(`Event: ${tip.event?.title || 'Unknown Event'}`, 20, 100);

        if (tip.message) {
            doc.text("Message:", 20, 120);
            doc.setFont("helvetica", "italic");
            doc.text(`"${tip.message}"`, 25, 130);
        }

        // Footer
        doc.setFontSize(10);
        doc.setTextColor(150, 150, 150);
        doc.text("Thank you for supporting creators on PublicStreamer!", 105, 280, { align: "center" });

        doc.save(`tip-receipt-${tip.stripe_payment_intent_id.slice(0, 8)}.pdf`);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-neutral-50">
                <Loader2 className="h-8 w-8 animate-spin text-pink-600" />
            </div>
        );
    }

    if (error || !tip) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-neutral-50 px-4">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle className="text-red-600">Error</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>{error || "Receipt not found."}</p>
                    </CardContent>
                    <CardFooter>
                        <Button onClick={() => window.history.back()}>Go Back</Button>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-neutral-50 px-4 py-8">
            <Card className="w-full max-w-md shadow-lg border-t-4 border-t-pink-500">
                <CardHeader className="text-center pb-2">
                    <div className="mx-auto bg-green-100 rounded-full p-3 w-16 h-16 flex items-center justify-center mb-4">
                        <CheckCircle className="h-8 w-8 text-green-600" />
                    </div>
                    <CardTitle className="text-2xl">Tip Sent!</CardTitle>
                    <CardDescription>Thank you for your support</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                    <div className="flex justify-between items-center py-2 border-b">
                        <span className="text-neutral-500">Amount</span>
                        <span className="text-xl font-bold">${tip.amount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b">
                        <span className="text-neutral-500">Host</span>
                        <span className="font-medium">{tip.host?.display_name}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b">
                        <span className="text-neutral-500">Date</span>
                        <span className="font-medium text-sm">{format(new Date(tip.created_at), "MMM d, yyyy h:mm a")}</span>
                    </div>
                    {tip.message && (
                        <div className="bg-neutral-100 p-3 rounded-md italic text-neutral-700 text-sm mt-4">
                            "{tip.message}"
                        </div>
                    )}
                </CardContent>
                <CardFooter className="flex flex-col gap-2 pt-2">
                    <Button className="w-full bg-pink-600 hover:bg-pink-700" onClick={handleDownloadPDF}>
                        <Download className="mr-2 h-4 w-4" />
                        Download PDF Receipt
                    </Button>
                    <Button variant="ghost" className="w-full" onClick={() => window.history.back()}>
                        Return to Event
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
};

export default TipReceipt;
