import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
};

interface ValidateTicketRequest {
    qrPayload: string; // The full string scanned from QR
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

        const { qrPayload }: ValidateTicketRequest = await req.json();

        if (!qrPayload) throw new Error("Missing QR payload");

        let ticketId: string;
        let eventId: string;

        try {
            const parsed = JSON.parse(qrPayload);
            ticketId = parsed.ticketId;
            eventId = parsed.eventId;
        } catch (e) {
            // If not JSON, assume raw ticket ID string if we used that
            throw new Error("Invalid QR code format");
        }

        if (!ticketId) throw new Error("Invalid ticket ID in QR");

        // Fetch ticket
        const { data: ticket, error: ticketError } = await supabase
            .from('tickets')
            .select(`
            *,
            event:events!event_id(title, date, host_id),
            user:user_profiles!user_id(full_name, avatar_url)
        `)
            .eq('stripe_payment_intent_id', ticketId) // We used paymentIntentId as ticketId in finalize-ticket
            .single();

        if (ticketError || !ticket) {
            return new Response(JSON.stringify({ valid: false, message: "Ticket not found" }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 200,
            });
        }

        // Check status
        if (ticket.status === 'used') {
            return new Response(JSON.stringify({
                valid: false,
                message: "Ticket already used",
                ticket
            }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 200,
            });
        }

        if (ticket.status !== 'active') {
            return new Response(JSON.stringify({
                valid: false,
                message: `Ticket status: ${ticket.status}`,
                ticket
            }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 200,
            });
        }

        // Mark as used
        const { error: updateError } = await supabase
            .from('tickets')
            .update({ status: 'used' })
            .eq('id', ticket.id);

        if (updateError) throw updateError;

        return new Response(JSON.stringify({
            valid: true,
            message: "Ticket Validated Successfully",
            ticket: {
                ...ticket,
                status: 'used' // Return updated status
            }
        }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        });

    } catch (error) {
        console.error("Validate ticket error:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500,
        });
    }
});
