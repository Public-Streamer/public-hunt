import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
};

interface SelectAdRequest {
    eventId: string;
    viewerId?: string;
}

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const supabase = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );

        const { eventId, viewerId }: SelectAdRequest = await req.json();

        if (!eventId) throw new Error("Missing eventId");

        // Rate limiting: Check if we've already served an ad to this viewer recently (30 seconds)
        if (viewerId) {
            const thirtySecondsAgo = new Date(Date.now() - 30000).toISOString();
            const { data: recentImpression } = await supabase
                .from('ad_impressions')
                .select('id')
                .eq('viewer_id', viewerId)
                .eq('event_id', eventId)
                .gte('created_at', thirtySecondsAgo)
                .limit(1)
                .single();

            if (recentImpression) {
                // Already served an ad recently, don't serve another
                return new Response(JSON.stringify({ ad: null, reason: 'rate_limited' }), {
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                    status: 200,
                });
            }
        }

        // Fetch active campaigns with budget remaining
        const { data: campaigns, error: campaignError } = await supabase
            .from('ad_campaigns')
            .select('*')
            .eq('status', 'active')
            .gt('budget_cents', 0) // Has budget
            .or('start_date.is.null,start_date.lte.now()') // Started or no start date
            .or('end_date.is.null,end_date.gte.now()'); // Not ended or no end date

        if (campaignError) throw campaignError;

        if (!campaigns || campaigns.length === 0) {
            return new Response(JSON.stringify({ ad: null, reason: 'no_active_campaigns' }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 200,
            });
        }

        // Filter campaigns where budget_cents > spent_cents
        const activeCampaigns = campaigns.filter(c => c.budget_cents > c.spent_cents);

        if (activeCampaigns.length === 0) {
            return new Response(JSON.stringify({ ad: null, reason: 'budgets_exhausted' }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 200,
            });
        }

        const campaignIds = activeCampaigns.map(c => c.id);

        // Fetch active ads for these campaigns, optionally targeting this event
        const { data: ads, error: adsError } = await supabase
            .from('ads')
            .select('*, campaign:ad_campaigns(*)')
            .in('campaign_id', campaignIds)
            .eq('status', 'active');

        if (adsError) throw adsError;

        if (!ads || ads.length === 0) {
            return new Response(JSON.stringify({ ad: null, reason: 'no_active_ads' }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 200,
            });
        }

        // Filter ads that target this event (or target all events if target_events is null/empty)
        const eligibleAds = ads.filter(ad => {
            if (!ad.target_events || ad.target_events.length === 0) {
                return true; // Targets all events
            }
            return ad.target_events.includes(eventId);
        });

        if (eligibleAds.length === 0) {
            return new Response(JSON.stringify({ ad: null, reason: 'no_matching_ads' }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 200,
            });
        }

        // Select ad with highest CPM (cost per 1000 impressions)
        eligibleAds.sort((a, b) => (b.campaign?.cpm_cents || 0) - (a.campaign?.cpm_cents || 0));
        const selectedAd = eligibleAds[0];

        console.log(`[Ad] Serving ad ${selectedAd.id} to viewer ${viewerId || 'anonymous'} on event ${eventId}`);

        return new Response(JSON.stringify({
            ad: {
                id: selectedAd.id,
                title: selectedAd.title,
                imageUrl: selectedAd.image_url,
                clickUrl: selectedAd.click_url,
                ctaText: selectedAd.cta_text,
                campaignId: selectedAd.campaign_id
            }
        }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        });

    } catch (error) {
        console.error("Select ad error:", error);
        // Fail silently for ads - don't disrupt the user experience
        return new Response(JSON.stringify({ ad: null, error: error.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200, // Return 200 even on error to not break the frontend
        });
    }
});
