import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
};

interface FinalizeTipRequest {
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
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "", // Use service role for admin tasks (inserting tip, ignoring RLS if needed, though we set RLS)
            { global: { headers: { Authorization: authHeader } } } // Pass user context if beneficial, but service role key supersedes? 
            // Actually standard pattern is using ANON key with user token for RLS, but here we might need to query strict tables?
            // Let's use Service Role for reliability in backend ops like this.
        );

        const { paymentIntentId }: FinalizeTipRequest = await req.json();

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
        const { eventId, userId, userEmail, message, type } = paymentIntent.metadata;

        if (type !== 'tip') throw new Error("Invalid payment type for tip finalization");

        const amount = paymentIntent.amount / 100; // cents to dollars

        // 2. Insert into DB (Idempotency check: look for existing stripe_id)
        const { data: existingTip } = await supabase
            .from('tips')
            .select('id')
            .eq('stripe_payment_intent_id', paymentIntentId)
            .maybeSingle();

        if (!existingTip) {
            // Fetch event to get host_id
            const { data: event } = await supabase.from('events').select('host_id, title').eq('id', eventId).single();
            if (!event) throw new Error("Event not found");

            const { error: insertError } = await supabase.from('tips').insert({
                event_id: eventId,
                tipper_id: userId,
                host_id: event.host_id,
                amount,
                stripe_payment_intent_id: paymentIntentId,
                message: message || null
            });

            if (insertError) throw insertError;

            // 3. Send Real-time Notification
            // We'll import notificationService logic or just use channel broadcast directly here
            const { error: notifyError } = await supabase.channel(`notifications:${event.host_id}`).send({
                type: 'broadcast',
                event: 'notification',
                payload: {
                    title: 'New Tip Received! 💰',
                    message: `${userEmail} tipped $${amount.toFixed(2)}: "${message || ''}"`,
                    type: 'tip_received',
                    amount,
                    eventId
                }
            });

            if (notifyError) console.error("Notification error:", notifyError);

            // 4. Send Email Confirmation via Resend
            const resendApiKey = Deno.env.get("RESEND_API_KEY");
            if (resendApiKey) {
                const resend = new Resend(resendApiKey);
                await resend.emails.send({
                    from: 'PublicStreamer <noreply@publicstreamer.com>', // Ensure domain is verified
                    to: userEmail, // Valid email from metadata
                    subject: 'Tip Confirmation - PublicStreamer',
                    html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                    <h1>Thank you for your support!</h1>
                    <p>You sent a tip of <strong>$${amount.toFixed(2)}</strong> to the host of <em>${event.title}</em>.</p>
                    <p>Message: "${message || 'No message'}"</p>
                    <hr />
                    <p style="font-size: 12px; color: #666;">Transaction ID: ${paymentIntentId}</p>
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
        console.error("Finalize tip error:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500,
        });
    }
});
