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
    const stripe = new Stripe(
      "sk_test_51RjhRTCREXNJuBpe8mOvq9rUOic9YNvoFUgX24EfJXHvFQQDScvj6Jl5XlKBHuki5DvNDVo855BsPGtIiln9wdoE00fQF8wFLA",
      {
        apiVersion: "2023-10-16",
      }
    );
    // const cryptoProvider = Stripe.createSubtleCryptoProvider();
    const signature = req.headers.get("stripe-signature");
    const body = await req.text();
    if (!signature) {
      throw new Error("No Stripe signature found");
    }
    // Verify webhook signature
    const webhookSecret = "whsec_ruTpxhaYemcbbfp7L0S01P9yYo8luNj2";
    if (!webhookSecret) {
      throw new Error("Webhook secret not configured");
    }
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      webhookSecret
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
        const { eventId, userId, platformFee } = paymentIntent.metadata;
        console.log("Payment succeeded for:", {
          eventId,
          userId,
          platformFee,
        });
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
        // Log successful payment processing
        console.log(
          "Ticket created successfully for payment:",
          paymentIntent.id
        );
        break;
      }
      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object;
        console.log("Payment failed:", paymentIntent.id);
        break;
      }
      case "account.updated": {
        const account = event.data.object;
        console.log("Stripe account updated:", account.id);
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
        error: error.message,
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
