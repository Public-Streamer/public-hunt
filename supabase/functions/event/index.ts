import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.5";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface EventData {
  id: string;
  name: string;
  description: string | null;
  date: string | null;
  time: string | null;
  location: string | null;
  media_urls: string[] | null;
  slug: string | null;
  created_by: string | null;
  ticket_price: number | null;
}

interface HostData {
  display_name: string | null;
  username: string | null;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Handle HEAD requests (some scrapers probe with HEAD)
  if (req.method === "HEAD") {
    return new Response(null, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=300",
      },
    });
  }

  try {
    const url = new URL(req.url);
    const pathname = url.pathname;
    const userAgent = req.headers.get("user-agent") || "";

    console.log("Edge function called:", { pathname, userAgent });

    // Enhanced crawler detection including WhatsApp and other platforms
    const crawlerPatterns = [
      /facebookexternalhit/i,
      /WhatsApp/i,
      /Twitterbot/i,
      /LinkedInBot/i,
      /Slackbot/i,
      /TelegramBot/i,
      /SkypeBot/i,
      /GoogleBot/i,
      /bingbot/i,
      /facebot/i,
      /ia_archiver/i,
    ];

    const isCrawler = crawlerPatterns.some((pattern) =>
      pattern.test(userAgent)
    );
    console.log("Is crawler:", isCrawler);

    // Extract event identifier from URL
    let eventIdentifier = pathname.split("/").pop() || "";

    // Handle different URL patterns
    if (pathname.includes("/event/")) {
      eventIdentifier = pathname.split("/event/")[1];
      console.log("Event identifier from /event/ path:", eventIdentifier);
    }

    // Normalize identifier
    eventIdentifier = decodeURIComponent(eventIdentifier).replace(/\/+$/, "");

    if (!eventIdentifier) {
      console.log("No event identifier found");
      return new Response("Event identifier required", {
        status: 400,
        headers: corsHeaders,
      });
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Determine if identifier is UUID or slug
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        eventIdentifier
      );

    // Fetch event data
    const eventQuery = isUuid
      ? supabase.from("events").select("*").eq("id", eventIdentifier)
      : supabase.from("events").select("*").eq("slug", eventIdentifier);

    const { data: events, error: eventError } = await eventQuery.single();

    if (eventError || !events) {
      console.error("Event fetch error:", eventError);
      return new Response("Event not found", {
        status: 404,
        headers: corsHeaders,
      });
    }

    const event: EventData = events;

    // Fetch host information
    let hostData: HostData | null = null;
    if (event.created_by) {
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("display_name, username")
        .eq("user_id", event.created_by)
        .single();

      hostData = profile;
    }

    // Generate meta tags
    const publicSiteUrl = Deno.env.get("PUBLIC_SITE_URL");
    const defaultPublicSite = "https://www.doghunt.tv";
    const baseUrl = url.origin.includes("supabase.co")
      ? publicSiteUrl || defaultPublicSite
      : url.origin;
    const eventUrl = `${baseUrl}/event/${event.slug || event.id}`;
    const eventTitle = event.name;
    const eventDescription =
      event.description ||
      `Join ${eventTitle} - Live streaming event on Doghunt`;
    let eventImage =
      event?.media_urls && event?.media_urls.length > 0
        ? event?.media_urls[0]
        : "";
    if (!eventImage) {
      eventImage = `${baseUrl}/placeholder.svg`;
    } else if (!/^https?:\/\//i.test(eventImage)) {
      eventImage = `${baseUrl}${
        eventImage.startsWith("/") ? "" : "/"
      }${eventImage}`;
    }
    const hostName = hostData?.display_name || hostData?.username || "Doghunt";
    const eventDate = event.date
      ? new Date(event.date).toLocaleDateString()
      : "";
    const eventTime = event.time || "";
    const ticketPrice = event.ticket_price ? `$${event.ticket_price}` : "Free";

    console.log("Generated meta data:", {
      eventTitle,
      eventDescription,
      eventImage,
      eventUrl,
    });

    // For crawlers, return HTML with meta tags
    if (isCrawler) {
      console.log("Serving meta tags to crawler");

      // Generate HTML with meta tags
      const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${eventTitle} - Doghunt</title>
  
  <!-- Primary Meta Tags -->
  <meta name="title" content="${eventTitle}">
  <meta name="description" content="${eventDescription}">
  
  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="event">
  <meta property="og:url" content="${eventUrl}">
  <meta property="og:title" content="${eventTitle}">
  <meta property="og:description" content="${eventDescription}">
  <meta property="og:image" content="${eventImage}">
  <meta property="og:site_name" content="Doghunt">
  <link rel="canonical" href="${eventUrl}">
  <!-- Event specific Open Graph tags -->
  ${
    eventDate
      ? `<meta property="event:start_time" content="${event.date}T${
          event.time || "00:00:00"
        }">`
      : ""
  }
  ${
    event.location
      ? `<meta property="event:location" content="${event.location}">`
      : ""
  }
  <meta property="event:organizer" content="${hostName}">
  
  <!-- Twitter -->
  <meta property="twitter:card" content="summary_large_image">
  <meta property="twitter:url" content="${eventUrl}">
  <meta property="twitter:title" content="${eventTitle}">
  <meta property="twitter:description" content="${eventDescription}">
  <meta property="twitter:image" content="${eventImage}">
  
  <!-- Additional Twitter tags -->
  <meta name="twitter:creator" content="@doghunt">
  <meta name="twitter:site" content="@doghunt">
  
  <!-- WhatsApp specific -->
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <!-- JSON-LD Structured Data -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Event",
    "name": "${eventTitle}",
    "description": "${eventDescription}",
    "url": "${eventUrl}",
    "image": "${eventImage}",
    ${
      eventDate
        ? `"startDate": "${event.date}T${event.time || "00:00:00"}",`
        : ""
    }
    ${
      event.location
        ? `"location": {
      "@type": "Place",
      "name": "${event.location}"
    },`
        : ""
    }
    "organizer": {
      "@type": "Person",
      "name": "${hostName}"
    },
    "offers": {
      "@type": "Offer",
      "price": "${event.ticket_price || 0}",
      "priceCurrency": "USD",
      "url": "${eventUrl}"
    }
  }
  </script>
</head>
<body>
  <div style="text-align: center; padding: 50px; font-family: Arial, sans-serif;">
    <h1>${eventTitle}</h1>
    <p>${eventDescription}</p>
    <p>Host: ${hostName}</p>
    ${eventDate ? `<p>Date: ${eventDate} ${eventTime}</p>` : ""}
    ${event.location ? `<p>Location: ${event.location}</p>` : ""}
    <p>Price: ${ticketPrice}</p>
    <a href="${eventUrl}">View Event</a>
  </div>
</body>
</html>`;

      return new Response(html, {
        headers: {
          ...corsHeaders,
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "public, max-age=300",
        },
      });
    } else {
      console.log("Redirecting human visitor to app");
      // For human visitors, redirect to the React app
      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          Location: eventUrl,
        },
      });
    }
  } catch (error) {
    console.error("Error in event function:", error);
    return new Response("Internal Server Error", {
      status: 500,
      headers: corsHeaders,
    });
  }
});
