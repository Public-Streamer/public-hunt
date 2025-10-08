import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
    });
  }
  try {
    const stripe = new Stripe(Deno.env.get("STRIPE_PROD_SECRET") ?? "", {
      apiVersion: "2023-10-16",
    });
    const cryptoProvider = Stripe.createSubtleCryptoProvider();
    const signature = req.headers.get("stripe-signature");
    const body = await req.text();
    if (!signature) {
      throw new Error("No Stripe signature found");
    }
    // Verify webhook signature
    const webhookSecret = Deno.env.get("STRIPE_PROD_WEBHOOK");
    if (!webhookSecret) {
      throw new Error("Webhook secret not configured");
    }
    const event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      webhookSecret,
      undefined,
      cryptoProvider
    );
    console.log("Webhook event received:", event.type);
    // Create Supabase client with service role key for database operations
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );
    switch (event.type) {
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object;
        const { eventId, userId } = paymentIntent.metadata;
        // Create ticket record
        const { error: ticketError } = await supabase.from("tickets").insert({
          user_id: userId,
          event_id: eventId,
          payment_id: paymentIntent.id,
          amount: paymentIntent.amount / 100,
          status: "active",
        });
        if (ticketError) {
          console.error("Error creating ticket:", ticketError);
          throw ticketError;
        }
        break;
      }
      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object;
        break;
      }
      case "account.updated": {
        const account = event.data.object;
        break;
      }
      default:
        console.log("Unhandled webhook event type:", event.type);
    }
    return new Response(
      JSON.stringify({
        received: true,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Webhook processing error:", error);
    return new Response(
      JSON.stringify({
        error: (error as Error).message,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
        status: 500,
      }
    );
  }
});
