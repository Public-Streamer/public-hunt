import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface AnalyticsRequest {
  hostId?: string;
  timeRange?: '7d' | '30d' | '90d' | 'all';
  eventId?: string;
}

interface AnalyticsResponse {
  totalRevenue: number;
  totalEvents: number;
  totalViewers: number;
  totalStreamTime: number; // in minutes
  averageRating: number;
  revenueByEvent: Array<{
    eventId: string;
    eventName: string;
    revenue: number;
    ticketSales: number;
    viewers: number;
  }>;
  revenueOverTime: Array<{
    date: string;
    revenue: number;
    events: number;
  }>;
  topPerformingEvents: Array<{
    eventId: string;
    eventName: string;
    revenue: number;
    viewers: number;
    rating: number;
  }>;
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
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
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

    const { hostId, timeRange = '30d', eventId }: AnalyticsRequest = await req.json();

    // Use current user as host if no hostId provided
    const targetHostId = hostId || user.id;

    // Verify user has access to this host's data (only allow if it's their own data or they're an admin)
    if (targetHostId !== user.id) {
      // Check if user is admin (you would need to implement this check)
      const { data: adminCheck } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .single();

      if (!adminCheck) {
        throw new Error("Unauthorized access to host analytics");
      }
    }

    // Calculate date range
    const now = new Date();
    let startDate: Date;

    switch (timeRange) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'all':
        startDate = new Date(0); // Beginning of time
        break;
      case '30d':
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
    }

    // Get host analytics data
    const { data: hostAnalytics, error: hostError } = await supabase
      .from("host_analytics")
      .select("*")
      .eq("host_id", targetHostId)
      .single();

    // Get all events for this host
    const { data: hostEvents, error: eventsError } = await supabase
      .from("events")
      .select("id, name, total_revenue, ticket_sales, average_viewer_count, date, created_at")
      .eq("created_by", targetHostId)
      .order("date", { ascending: false });

    if (eventsError) {
      throw new Error("Failed to fetch host events");
    }

    // Get payment transactions
    const { data: transactions, error: transactionsError } = await supabase
      .from("payment_transactions")
      .select("event_id, amount, net_amount, created_at")
      .eq("host_id", targetHostId)
      .gte("created_at", startDate.toISOString())
      .order("created_at", { ascending: false });

    if (transactionsError) {
      throw new Error("Failed to fetch payment transactions");
    }

    // Calculate analytics
    const totalRevenue = transactions?.reduce((sum, tx) => sum + tx.net_amount, 0) || 0;
    const totalEvents = hostEvents?.length || 0;
    const totalViewers = hostEvents?.reduce((sum, event) => sum + (event.average_viewer_count || 0), 0) || 0;
    const totalStreamTime = hostEvents?.reduce((sum, event) => {
      // This would be more accurate with actual stream duration data
      // For now, estimate based on viewer count and typical stream duration
      return sum + ((event.average_viewer_count || 0) * 120); // Assume 2 hours per event
    }, 0) || 0;

    const averageRating = hostAnalytics?.average_rating || 0;

    // Revenue by event
    const revenueByEvent = hostEvents?.map(event => {
      const eventTransactions = transactions?.filter(tx => tx.event_id === event.id) || [];
      const eventRevenue = eventTransactions.reduce((sum, tx) => sum + tx.net_amount, 0);

      return {
        eventId: event.id,
        eventName: event.name,
        revenue: eventRevenue,
        ticketSales: event.ticket_sales || 0,
        viewers: event.average_viewer_count || 0
      };
    }) || [];

    // Revenue over time
    const revenueOverTime: Array<{ date: string; revenue: number; events: number }> = [];
    const dateMap: Record<string, { revenue: number; events: number }> = {};

    transactions?.forEach(tx => {
      const date = new Date(tx.created_at).toISOString().split('T')[0];
      if (!dateMap[date]) {
        dateMap[date] = { revenue: 0, events: 0 };
      }
      dateMap[date].revenue += tx.net_amount;
    });

    hostEvents?.forEach(event => {
      const date = new Date(event.created_at).toISOString().split('T')[0];
      if (!dateMap[date]) {
        dateMap[date] = { revenue: 0, events: 0 };
      }
      dateMap[date].events += 1;
    });

    Object.keys(dateMap).forEach(date => {
      revenueOverTime.push({
        date,
        revenue: dateMap[date].revenue,
        events: dateMap[date].events
      });
    });

    // Sort by date
    revenueOverTime.sort((a, b) => a.date.localeCompare(b.date));

    // Top performing events (by revenue)
    const topPerformingEvents = revenueByEvent
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)
      .map(event => ({
        ...event,
        rating: 4.5 // Placeholder - would use actual rating data
      }));

    // Update host analytics if outdated
    if (!hostAnalytics || new Date(hostAnalytics.last_updated) < new Date(now.getTime() - 24 * 60 * 60 * 1000)) {
      await supabase
        .from("host_analytics")
        .upsert({
          host_id: targetHostId,
          total_revenue: totalRevenue,
          total_events: totalEvents,
          total_viewers: totalViewers,
          total_stream_time: totalStreamTime,
          average_rating: averageRating,
          last_updated: now.toISOString()
        });
    }

    const response: AnalyticsResponse = {
      totalRevenue,
      totalEvents,
      totalViewers,
      totalStreamTime,
      averageRating,
      revenueByEvent,
      revenueOverTime,
      topPerformingEvents
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Analytics error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});