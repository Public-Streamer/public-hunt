import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
};

interface TrackImpressionRequest {
    adId: string;
    viewerId?: string;
    eventId: string;
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

        const { adId, viewerId, eventId }: TrackImpressionRequest = await req.json();

        if (!adId || !eventId) throw new Error("Missing adId or eventId");

        // Insert impression
        const { error: insertError } = await supabase
            .from('ad_impressions')
            .insert({
                ad_id: adId,
                viewer_id: viewerId || null,
                event_id: eventId
            });

        if (insertError) throw insertError;

        // Fetch the ad to get campaign_id and CPM
        const { data: ad } = await supabase
            .from('ads')
            .select('campaign_id, campaign:ad_campaigns(cpm_cents)')
            .eq('id', adId)
            .single();

        if (ad) {
            // Calculate cost for this impression (CPM / 1000)
            const costCents = Math.ceil((ad.campaign?.cpm_cents || 100) / 1000);

            // Increment spent_cents on the campaign
            const { error: updateError } = await supabase.rpc('increment_campaign_spend', {
                campaign_id: ad.campaign_id,
                amount: costCents
            });

            // If RPC doesn't exist, fallback to direct update
            if (updateError) {
                await supabase
                    .from('ad_campaigns')
                    .update({
                        spent_cents: supabase.raw(`spent_cents + ${costCents}`)
                    })
                    .eq('id', ad.campaign_id);

                // Check if budget exhausted and update status
                const { data: campaign } = await supabase
                    .from('ad_campaigns')
                    .select('budget_cents, spent_cents')
                    .eq('id', ad.campaign_id)
                    .single();

                if (campaign && campaign.spent_cents >= campaign.budget_cents) {
                    await supabase
                        .from('ad_campaigns')
                        .update({ status: 'exhausted' })
                        .eq('id', ad.campaign_id);
                }
            }
        }

        console.log(`[Ad] Impression tracked for ad ${adId}`);

        return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        });

    } catch (error) {
        console.error("Track impression error:", error);
        return new Response(JSON.stringify({ success: false, error: error.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200, // Don't fail loudly
        });
    }
});
