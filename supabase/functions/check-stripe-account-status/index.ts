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
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Get authenticated user
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;

    if (!user) {
      throw new Error("User not authenticated");
    }

    // Get user's Stripe account from database
    const { data: stripeAccount, error: fetchError } = await supabaseClient
      .from("host_stripe_accounts")
      .select("stripe_account_id, account_status")
      .eq("user_id", user.id)
      .single();

    if (fetchError) {
      throw new Error("Failed to fetch Stripe account");
    }
    if (!stripeAccount) {
      return new Response(
        JSON.stringify({
          accountStatus: "not_found",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_PROD_SECRET") ?? "", {
      apiVersion: "2023-10-16",
    });

    // Get account details from Stripe
    const account = await stripe.accounts.retrieve(
      stripeAccount.stripe_account_id
    );

    // Determine account status
    const onboardingCompleted = account.details_submitted;
    const payoutsEnabled = account.payouts_enabled;
    let accountStatus = "pending";

    if (onboardingCompleted && payoutsEnabled) {
      accountStatus = "active";
    } else if (onboardingCompleted && !payoutsEnabled) {
      accountStatus = "restricted";
    }

    // Update database with current status
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // await supabaseService.rpc("update_stripe_account_status", {
    //   account_id: stripeAccount.stripe_account_id,
    //   new_status: accountStatus,
    //   onboarding_completed: onboardingCompleted,
    //   payouts_enabled: payoutsEnabled,
    // });

    await supabaseClient
      .from("host_stripe_accounts")
      .update({
        account_status: accountStatus,
        onboarding_completed: onboardingCompleted,
        payouts_enabled: payoutsEnabled,
      })
      .eq("user_id", user.id);

    return new Response(
      JSON.stringify({
        accountStatus,
        onboardingCompleted,
        payoutsEnabled,
        requirements: account.requirements,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error checking Stripe account status:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
