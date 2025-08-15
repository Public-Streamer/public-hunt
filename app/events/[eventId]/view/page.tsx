import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import ViewerClient from './ViewerClient';
import type { Snapshot } from '@/lib/viewerState';

// Force dynamic rendering to prevent stale state
export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function getEventState(eventId: string, accessToken?: string): Promise<Snapshot | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/events/${eventId}/state`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Cache-Control': 'no-store'
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      if (response.status === 403) {
        // Access denied - redirect to checkout
        redirect(`/events/${eventId}?purchase=true`);
      }
      throw new Error(`Failed to fetch event state: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching event state for SSR:', error);
    return null;
  }
}

export default async function ViewPage({ 
  params 
}: { 
  params: { eventId: string } 
}) {
  const { eventId } = params;
  
  // Get user session for SSR
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    redirect(`/login?redirect=/events/${eventId}/view`);
  }

  // Fetch initial state for SSR
  const initialState = await getEventState(eventId, session.access_token);

  // If no state available, show empty state but don't block
  const fallbackState: Snapshot = {
    eventId,
    asOf: new Date().toISOString(),
    streams: [],
    scorecards: []
  };

  return (
    <div className="min-h-screen bg-background">
      <ViewerClient 
        key={`${eventId}-${Date.now()}`}
        eventId={eventId}
        initialState={initialState || fallbackState}
      />
    </div>
  );
}

// Generate metadata for better SEO
export async function generateMetadata({ params }: { params: { eventId: string } }) {
  return {
    title: `Live Event - ${params.eventId}`,
    description: 'Watch live streams and follow real-time scorecards',
    robots: 'noindex', // Private viewer pages
  };
}