import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAppContext } from '@/contexts/AppContext';

interface AccessControlResult {
  hasAccess: boolean;
  userRole: string | null;
  isLoading: boolean;
  error: string | null;
  ticketStatus: {
    hasTicket: boolean;
    ticketType: string | null;
  };
  refresh: () => Promise<void>;
}

export const useAccessControl = (
  eventId: string | null,
  requiredRole: string | null = null,
  requiresTicket: boolean = false
): AccessControlResult => {
  const { user: currentUser } = useAppContext();
  const [hasAccess, setHasAccess] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ticketStatus, setTicketStatus] = useState({
    hasTicket: false,
    ticketType: null,
  });

  const checkAccess = useCallback(async () => {
    if (!eventId || !currentUser) {
      setHasAccess(false);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Check if user is event host
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('created_by, ticket_price')
        .eq('id', eventId)
        .single();

      if (eventError) {
        throw new Error(`Event not found: ${eventError.message}`);
      }

      let role: string = 'viewer';
      let hasTicket: boolean = false;
      let ticketType: string | null = null;

      // Check if user is host
      if (eventData.created_by === currentUser.id) {
        role = 'host';
        hasTicket = true; // Hosts always have access
      } else {
        // Check if user is assigned as streamer
        const { data: streamerData } = await supabase
          .from('event_streamers')
          .select('role_type')
          .eq('event_id', eventId)
          .eq('streamer_id', currentUser.id)
          .single();

        if (streamerData) {
          role = 'streamer';
          hasTicket = true; // Streamers always have access
        } else {
          // For viewers, check ticket status if required
          if (requiresTicket && eventData.ticket_price > 0) {
            const { data: ticketData } = await supabase
              .from('tickets')
              .select('id, type')
              .eq('event_id', eventId)
              .eq('user_id', currentUser.id)
              .eq('status', 'active')
              .single();

            if (ticketData) {
              hasTicket = true;
              ticketType = ticketData.type;
            }
          } else {
            // Free event or no ticket required
            hasTicket = true;
          }
        }
      }

      // Check role requirements
      const meetsRoleRequirement =
        !requiredRole ||
        role === requiredRole ||
        (requiredRole === 'streamer' && role === 'host') || // Hosts can do anything
        (requiredRole === 'viewer' && (role === 'host' || role === 'streamer')); // Higher roles can view

      setHasAccess(meetsRoleRequirement && (!requiresTicket || hasTicket));
      setUserRole(role);
      setTicketStatus({ hasTicket, ticketType });

    } catch (err) {
      console.error('Access control check failed:', err);
      setError(err instanceof Error ? err.message : 'Access check failed');
      setHasAccess(false);
    } finally {
      setIsLoading(false);
    }
  }, [eventId, currentUser, requiredRole, requiresTicket]);

  useEffect(() => {
    checkAccess();
  }, [checkAccess]);

  // Set up real-time subscription for ticket changes
  useEffect(() => {
    if (!eventId || !currentUser) return;

    const channel = supabase
      .channel(`ticket-updates-${eventId}-${currentUser.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tickets',
          filter: `event_id=eq.${eventId}.and.user_id=eq.${currentUser.id}`,
        },
        () => {
          // Ticket status changed, recheck access
          checkAccess();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [eventId, currentUser, checkAccess]);

  return {
    hasAccess,
    userRole,
    isLoading,
    error,
    ticketStatus,
    refresh: checkAccess,
  };
};

export default useAccessControl;
