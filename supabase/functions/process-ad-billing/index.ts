import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AdBillingRequest {
  adSessionId: string;
  durationSeconds: number;
  viewerCount: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { adSessionId, durationSeconds, viewerCount }: AdBillingRequest = await req.json();

    console.log('Processing ad billing:', { adSessionId, durationSeconds, viewerCount });

    // Get the ad session details
    const { data: adSession, error: sessionError } = await supabase
      .from('event_ad_sessions')
      .select(`
        *,
        ads (
          id, 
          user_id, 
          cmp_rate, 
          budget_remaining, 
          spend_amount, 
          actual_impressions
        )
      `)
      .eq('id', adSessionId)
      .single();

    if (sessionError || !adSession) {
      console.error('Ad session not found:', sessionError);
      return new Response(
        JSON.stringify({ error: 'Ad session not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Calculate billing amount based on CPM and duration
    // CPM = Cost Per Mille (1000 impressions)
    // Formula: (duration_minutes / 60) * (cmp_rate / 1000) * viewer_count
    const durationMinutes = durationSeconds / 60;
    const billingAmount = (durationMinutes) * (adSession.ads.cmp_rate / 1000) * viewerCount;
    
    console.log('Billing calculation:', {
      durationMinutes,
      cmpRate: adSession.ads.cmp_rate,
      viewerCount,
      billingAmount
    });

    // Check if advertiser has enough budget
    if (adSession.ads.budget_remaining < billingAmount) {
      console.log('Insufficient budget, charging remaining amount');
      // Charge only what's remaining and mark as completed
      const remainingAmount = adSession.ads.budget_remaining;
      
      // Update ad session
      await supabase
        .from('event_ad_sessions')
        .update({
          duration_seconds: durationSeconds,
          viewer_count: viewerCount,
          billing_amount: remainingAmount,
          status: 'completed',
          session_end: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', adSessionId);

      // Update ad budget and stats
      await supabase
        .from('ads')
        .update({
          spend_amount: adSession.ads.spend_amount + remainingAmount,
          budget_remaining: 0,
          actual_impressions: adSession.ads.actual_impressions + viewerCount,
          status: 'completed', // Mark ad as completed when budget is exhausted
          updated_at: new Date().toISOString()
        })
        .eq('id', adSession.ads.id);

      // Create host earnings (10% revenue share)
      const hostEarning = remainingAmount * 0.10;
      await supabase
        .from('host_earnings')
        .insert({
          host_user_id: adSession.triggered_by,
          event_id: adSession.event_id,
          ad_session_id: adSessionId,
          earning_amount: hostEarning,
          earning_percentage: 10.00
        });

      return new Response(
        JSON.stringify({ 
          success: true, 
          billedAmount: remainingAmount,
          hostEarning,
          adCompleted: true 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Normal billing process
    const newBudgetRemaining = adSession.ads.budget_remaining - billingAmount;
    const newSpendAmount = adSession.ads.spend_amount + billingAmount;

    // Update ad session
    await supabase
      .from('event_ad_sessions')
      .update({
        duration_seconds: durationSeconds,
        viewer_count: viewerCount,
        billing_amount: billingAmount,
        status: 'completed',
        session_end: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', adSessionId);

    // Update ad budget and stats
    const adUpdateData: any = {
      spend_amount: newSpendAmount,
      budget_remaining: newBudgetRemaining,
      actual_impressions: adSession.ads.actual_impressions + viewerCount,
      updated_at: new Date().toISOString()
    };

    // If budget is exhausted, mark ad as completed
    if (newBudgetRemaining <= 0) {
      adUpdateData.status = 'completed';
    }

    await supabase
      .from('ads')
      .update(adUpdateData)
      .eq('id', adSession.ads.id);

    // Create host earnings (10% revenue share)
    const hostEarning = billingAmount * 0.10;
    await supabase
      .from('host_earnings')
      .insert({
        host_user_id: adSession.triggered_by,
        event_id: adSession.event_id,
        ad_session_id: adSessionId,
        earning_amount: hostEarning,
        earning_percentage: 10.00
      });

    console.log('Ad billing completed:', {
      billedAmount: billingAmount,
      newBudgetRemaining,
      hostEarning,
      adCompleted: newBudgetRemaining <= 0
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        billedAmount: billingAmount,
        budgetRemaining: newBudgetRemaining,
        hostEarning,
        adCompleted: newBudgetRemaining <= 0
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error processing ad billing:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});