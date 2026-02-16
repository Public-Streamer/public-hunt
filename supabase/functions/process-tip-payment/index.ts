import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface TipRequest {
  eventId: string;
  amount: number;
  connectedAccountId: string;
  customerEmail: string;
  customerName?: string;
  message?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get authenticated user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error("User not authenticated");
    }

    const { eventId, amount, connectedAccountId, message }: TipRequest =
      await req.json();

    // Validate event exists
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("*")
      .eq("id", eventId)
      .single();

    if (eventError || !event) {
      throw new Error("Event not found");
    }

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_PROD_SECRET") ?? "", {
      apiVersion: "2023-10-16",
    });

    // Calculate platform fee (10% + Stripe fees)
    // Stripe: 2.9% + 30 cents
    // Platform: 10%
    const stripeFeePct = 0.029;
    const stripeFixed = 30;
    const platformFeePct = 0.10;

    const amountInCents = Math.round(amount * 100);
    const stripeFees = Math.round(amountInCents * stripeFeePct) + stripeFixed;
    const platformReq = Math.round(amountInCents * platformFeePct);

    // Total application fee collected by platform
    const applicationFee = stripeFees + platformReq;

    // Create Payment Intent with destination charges for revenue splitting
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: "usd",
      payment_method_types: ["card"],
      transfer_data: {
        destination: connectedAccountId,
      },
      application_fee_amount: applicationFee,
      metadata: {
        eventId,
        userId: user.id,
        userEmail: user.email,
        type: 'tip',
        message: message || '',
        platformFee: String(platformReq),
      },
    });

    console.log("Tip Payment Intent created:", paymentIntent.id);

    return new Response(
      JSON.stringify({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Payment processing error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
