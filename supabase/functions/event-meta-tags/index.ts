import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.5';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const pathname = url.pathname;
    const userAgent = req.headers.get('user-agent') || '';
    
    // Check if this is a social media crawler
    const isCrawler = /facebookexternalhit|WhatsApp|Twitterbot|LinkedInBot|Slackbot|TelegramBot|SkypeBot|GoogleBot/i.test(userAgent);
    
    // Extract event identifier from URL
    // Could be /event-meta-tags/slug or /event/slug (when called as middleware)
    let eventIdentifier = pathname.split('/').pop();
    
    // If called with /event/ path, extract the identifier
    if (pathname.includes('/event/')) {
      eventIdentifier = pathname.split('/event/')[1];
    }
    
    if (!eventIdentifier) {
      return new Response('Event identifier required', { status: 400, headers: corsHeaders });
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Determine if identifier is UUID or slug
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(eventIdentifier);
    
    // Fetch event data
    const eventQuery = isUuid 
      ? supabase.from('events').select('*').eq('id', eventIdentifier)
      : supabase.from('events').select('*').eq('slug', eventIdentifier);
    
    const { data: events, error: eventError } = await eventQuery.single();
    
    if (eventError || !events) {
      console.error('Event fetch error:', eventError);
      return new Response('Event not found', { status: 404, headers: corsHeaders });
    }

    const event: EventData = events;

    // Fetch host information
    let hostData: HostData | null = null;
    if (event.created_by) {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('display_name, username')
        .eq('user_id', event.created_by)
        .single();
      
      hostData = profile;
    }

    // Generate meta tags
    const baseUrl = url.origin.includes('supabase.co') 
      ? 'https://dev.publicstreamer.com' 
      : url.origin;
    const eventUrl = `${baseUrl}/event/${event.slug || event.id}`;
    const eventTitle = event.name;
    const eventDescription = event.description || `Join ${eventTitle} - Live streaming event on Public Streamer`;
    const eventImage = event.media_urls && event.media_urls.length > 0 
      ? event.media_urls[0] 
      : `${baseUrl}/placeholder.svg`;
    
    const hostName = hostData?.display_name || hostData?.username || 'Public Streamer';
    const eventDate = event.date ? new Date(event.date).toLocaleDateString() : '';
    const eventTime = event.time || '';
    const ticketPrice = event.ticket_price ? `$${event.ticket_price}` : 'Free';

    // Generate HTML with meta tags
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${eventTitle} - Public Streamer</title>
  
  <!-- Primary Meta Tags -->
  <meta name="title" content="${eventTitle}">
  <meta name="description" content="${eventDescription}">
  
  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="event">
  <meta property="og:url" content="${eventUrl}">
  <meta property="og:title" content="${eventTitle}">
  <meta property="og:description" content="${eventDescription}">
  <meta property="og:image" content="${eventImage}">
  <meta property="og:site_name" content="Public Streamer">
  
  <!-- Event specific Open Graph tags -->
  ${eventDate ? `<meta property="event:start_time" content="${event.date}T${event.time || '00:00:00'}">` : ''}
  ${event.location ? `<meta property="event:location" content="${event.location}">` : ''}
  <meta property="event:organizer" content="${hostName}">
  
  <!-- Twitter -->
  <meta property="twitter:card" content="summary_large_image">
  <meta property="twitter:url" content="${eventUrl}">
  <meta property="twitter:title" content="${eventTitle}">
  <meta property="twitter:description" content="${eventDescription}">
  <meta property="twitter:image" content="${eventImage}">
  
  <!-- Additional Twitter tags -->
  <meta name="twitter:creator" content="@publicstreamer">
  <meta name="twitter:site" content="@publicstreamer">
  
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
    ${eventDate ? `"startDate": "${event.date}T${event.time || '00:00:00'}",` : ''}
    ${event.location ? `"location": {
      "@type": "Place",
      "name": "${event.location}"
    },` : ''}
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
  
  <!-- Redirect to actual event page for human visitors -->
  <script>
    // Only redirect if not a crawler
    const userAgent = navigator.userAgent;
    const isCrawler = /facebookexternalhit|WhatsApp|Twitterbot|LinkedInBot|Slackbot|TelegramBot|SkypeBot|GoogleBot/i.test(userAgent);
    if (!isCrawler) {
      window.location.href = "${eventUrl}";
    }
  </script>
</head>
<body>
  <div style="text-align: center; padding: 50px; font-family: Arial, sans-serif;">
    <h1>${eventTitle}</h1>
    <p>${eventDescription}</p>
    <p>Host: ${hostName}</p>
    ${eventDate ? `<p>Date: ${eventDate} ${eventTime}</p>` : ''}
    ${event.location ? `<p>Location: ${event.location}</p>` : ''}
    <p>Price: ${ticketPrice}</p>
    <p>Redirecting to event page...</p>
    <a href="${eventUrl}">Click here if you are not redirected automatically</a>
  </div>
</body>
</html>`;

    return new Response(html, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
      },
    });

  } catch (error) {
    console.error('Error in event-meta-tags function:', error);
    return new Response('Internal Server Error', {
      status: 500,
      headers: corsHeaders,
    });
  }
});