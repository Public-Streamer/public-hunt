import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAppContext } from '@/contexts/AppContext';
import { RealtimeChannel } from '@supabase/supabase-js';

interface PresenceUser {
    id: string;
    displayName: string;
    avatarUrl?: string;
    joinedAt: string;
}

interface UsePresenceOptions {
    eventId: string;
}

interface UsePresenceResult {
    activeUsers: PresenceUser[];
    isConnected: boolean;
    error: string | null;
}

export function usePresence({ eventId }: UsePresenceOptions): UsePresenceResult {
    const [activeUsers, setActiveUsers] = useState<PresenceUser[]>([]);
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const channelRef = useRef<RealtimeChannel | null>(null);
    const { user, currentUserProfile } = useAppContext();

    useEffect(() => {
        if (!eventId) return;

        const channel = supabase.channel(`presence:${eventId}`, {
            config: {
                presence: {
                    key: user?.id || `anon-${Math.random().toString(36).slice(2)}`
                }
            }
        });

        channel
            .on('presence', { event: 'sync' }, () => {
                const presenceState = channel.presenceState();
                const users: PresenceUser[] = [];

                Object.values(presenceState).forEach((presences: any) => {
                    presences.forEach((presence: any) => {
                        users.push({
                            id: presence.user_id,
                            displayName: presence.display_name || 'Anonymous',
                            avatarUrl: presence.avatar_url,
                            joinedAt: presence.joined_at || new Date().toISOString()
                        });
                    });
                });

                // Sort by join time (most recent first) and dedupe
                const uniqueUsers = Array.from(
                    new Map(users.map(u => [u.id, u])).values()
                ).sort((a, b) =>
                    new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime()
                );

                setActiveUsers(uniqueUsers);
            })
            .on('presence', { event: 'join' }, ({ newPresences }: any) => {
                console.log('[Presence] User joined:', newPresences);
            })
            .on('presence', { event: 'leave' }, ({ leftPresences }: any) => {
                console.log('[Presence] User left:', leftPresences);
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    setIsConnected(true);
                    setError(null);

                    // Track our presence
                    await channel.track({
                        user_id: user?.id || `anon-${Math.random().toString(36).slice(2)}`,
                        display_name: currentUserProfile?.display_name || 'Anonymous',
                        avatar_url: currentUserProfile?.avatar_url,
                        joined_at: new Date().toISOString()
                    });
                } else if (status === 'CHANNEL_ERROR') {
                    setError('Failed to connect to presence');
                    setIsConnected(false);
                }
            });

        channelRef.current = channel;

        return () => {
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current);
            }
        };
    }, [eventId, user?.id, currentUserProfile?.display_name, currentUserProfile?.avatar_url]);

    return { activeUsers, isConnected, error };
}

export default usePresence;
