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

    const { email, firstName, lastName } = await req.json();

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_PROD_SECRET") ?? "", {
      apiVersion: "2023-10-16",
    });

    // Check if user already has a Stripe account
    const { data: existingAccount } = await supabase
      .from("host_stripe_accounts")
      .select("stripe_account_id")
      .eq("user_id", user.id)
      .single();

    if (existingAccount) {
      // Return existing account's onboarding link if not completed
      const account = await stripe.accounts.retrieve(
        existingAccount.stripe_account_id
      );

      if (!account.details_submitted) {
        const accountLink = await stripe.accountLinks.create({
          account: existingAccount.stripe_account_id,
          refresh_url: `${req.headers.get("origin")}/payments?refresh=true`,
          return_url: `${req.headers.get("origin")}/payments?success=true`,
          type: "account_onboarding",
        });

        return new Response(
          JSON.stringify({
            url: accountLink.url,
            accountId: existingAccount.stripe_account_id,
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          }
        );
      }

      return new Response(
        JSON.stringify({
          message: "Account already exists and is active",
          accountId: existingAccount.stripe_account_id,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // Create new Express account
    const account = await stripe.accounts.create({
      type: "express",
      email: email || user.email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_type: "individual",
      individual: {
        email: email || user.email,
        first_name: firstName,
        last_name: lastName,
      },
    });

    // Store account in database
    const { error: dbError } = await supabase
      .from("host_stripe_accounts")
      .insert({
        user_id: user.id,
        stripe_account_id: account.id,
        account_status: "pending",
        onboarding_completed: false,
        payouts_enabled: false,
      });

    if (dbError) {
      console.error("Database error:", dbError);
      // Clean up Stripe account if database insert fails
      await stripe.accounts.del(account.id);
      throw new Error("Failed to save account information");
    }

    // Create account onboarding link
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${req.headers.get("origin")}/payments?refresh=true`,
      return_url: `${req.headers.get("origin")}/payments?success=true`,
      type: "account_onboarding",
    });

    console.log("Express account created:", account.id);

    return new Response(
      JSON.stringify({
        url: accountLink.url,
        accountId: account.id,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Express account creation error:", error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
