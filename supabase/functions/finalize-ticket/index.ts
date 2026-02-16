import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { Resend } from "npm:resend@2.0.0";
import QRCode from "https://esm.sh/qrcode@1.5.3";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
};

interface FinalizeTicketRequest {
    paymentIntentId: string;
}

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const authHeader = req.headers.get("Authorization");
        if (!authHeader) throw new Error("No authorization header");

        const supabase = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
            { global: { headers: { Authorization: authHeader } } }
        );

        const { paymentIntentId }: FinalizeTicketRequest = await req.json();

        if (!paymentIntentId) throw new Error("Missing paymentIntentId");

        // 1. Verify Stripe Payment
        const stripe = new Stripe(Deno.env.get("STRIPE_PROD_SECRET") ?? "", {
            apiVersion: "2023-10-16",
        });

        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

        if (paymentIntent.status !== "succeeded") {
            throw new Error(`Payment not succeeded. Status: ${paymentIntent.status}`);
        }

        // Extract metadata
        const { eventId, userId } = paymentIntent.metadata;
        // Note: process-ticket-payment metadata might vary, let's verify what we sent in process-ticket-payment
        // metadata: { eventId, userId, platformFee }

        if (!eventId || !userId) throw new Error("Missing metadata in payment intent");

        // 2. Check for existing ticket (Idempotency)
        const { data: existingTicket } = await supabase
            .from('tickets')
            .select('id')
            .eq('stripe_payment_intent_id', paymentIntentId)
            .maybeSingle();

        if (!existingTicket) {
            // Fetch event details
            const { data: event } = await supabase.from('events').select('*').eq('id', eventId).single();
            if (!event) throw new Error("Event not found");

            const { data: userProfile } = await supabase.from('user_profiles').select('email, full_name').eq('user_id', userId).single();
            const userEmail = userProfile?.email; // Or use receipt_email from stripe if available

            // 3. Generate QR Code
            // We'll use a unique ticket ID / string for the QR code payload.
            // Let's generate a placeholder ID first if we want it in the QR, 
            // or just use stripe payment intent ID + user ID as a verification token.
            // Let's use a signed token or just the UUID of the ticket. 
            // Since we haven't inserted yet, we can't use the UUID.
            // Let's insert first, then update with QR? Or just use paymentIntentId as the secret?
            // Let's use the stripe_payment_intent_id as the unique token for now.

            const qrData = JSON.stringify({
                eventId,
                ticketId: paymentIntentId,
                type: 'ticket'
            });

            const qrCodeDataUrl = await QRCode.toDataURL(qrData);

            // 4. Insert Ticket
            const { error: insertError } = await supabase.from('tickets').insert({
                event_id: eventId,
                user_id: userId,
                stripe_payment_intent_id: paymentIntentId,
                status: 'active',
                qr_code: qrCodeDataUrl
            });

            if (insertError) throw insertError;

            // 5. Send Email
            const resendApiKey = Deno.env.get("RESEND_API_KEY");
            if (resendApiKey && userEmail) {
                const resend = new Resend(resendApiKey);
                await resend.emails.send({
                    from: 'PublicStreamer <noreply@publicstreamer.com>',
                    to: userEmail,
                    subject: `Your Ticket for ${event.title}`,
                    html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                    <h1>You're going to ${event.title}!</h1>
                    <p><strong>Date:</strong> ${new Date(event.date).toLocaleString()}</p>
                    <p><strong>Location:</strong> ${event.location || 'Online'}</p>
                    
                    <div style="text-align: center; margin: 20px 0;">
                        <img src="${qrCodeDataUrl}" alt="Ticket QR Code" style="width: 200px; height: 200px;" />
                        <p style="font-size: 12px; color: #666;">Scan this code at the entrance</p>
                    </div>

                    <p>Transaction ID: ${paymentIntentId}</p>
                </div>
                `
                });
            }
        }

        return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        });
    } catch (error) {
        console.error("Finalize ticket error:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500,
        });
    }
});
