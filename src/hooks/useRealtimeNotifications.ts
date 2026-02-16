import { useEffect, useCallback } from 'react';
import { supabaseBrowser } from '@/lib/supabase/browser';
import { useToast } from '@/hooks/use-toast';
import { useAppContext } from '@/contexts/AppContext';

export type NotificationType =
    | 'stream_started'
    | 'tip_received'
    | 'viewer_milestone'
    | 'chat_mention'
    | 'scheduled_reminder';

interface NotificationPayload {
    type: NotificationType;
    title: string;
    message: string;
    eventId?: string;
    metadata?: Record<string, any>;
}

interface UseRealtimeNotificationsOptions {
    eventId?: string;
    enabled?: boolean;
}

export const useRealtimeNotifications = ({
    eventId,
    enabled = true
}: UseRealtimeNotificationsOptions = {}) => {
    const { toast } = useToast();
    const { user } = useAppContext();

    const showNotification = useCallback((payload: NotificationPayload) => {
        const getTitle = () => {
            switch (payload.type) {
                case 'tip_received':
                    return `💝 ${payload.title}`;
                case 'viewer_milestone':
                    return `👥 ${payload.title}`;
                case 'stream_started':
                    return `🔴 ${payload.title}`;
                case 'chat_mention':
                    return `🔔 ${payload.title}`;
                default:
                    return payload.title;
            }
        };

        toast({
            title: getTitle(),
            description: payload.message,
            duration: 5000,
        });
    }, [toast]);

    useEffect(() => {
        if (!enabled || !user) return;

        const supabase = supabaseBrowser();

        // Subscribe to user-specific notifications
        const userChannel = supabase
            .channel(`notifications:${user.id}`)
            .on(
                'broadcast',
                { event: 'notification' },
                (payload) => {
                    console.log('[Notifications] Received:', payload);
                    showNotification(payload.payload as NotificationPayload);
                }
            )
            .subscribe();

        // If eventId is provided, also subscribe to event-specific notifications
        let eventChannel: any = null;
        if (eventId) {
            eventChannel = supabase
                .channel(`event-notifications:${eventId}`)
                .on(
                    'broadcast',
                    { event: 'notification' },
                    (payload) => {
                        console.log('[Event Notifications] Received:', payload);
                        showNotification(payload.payload as NotificationPayload);
                    }
                )
                .subscribe();
        }

        return () => {
            supabase.removeChannel(userChannel);
            if (eventChannel) {
                supabase.removeChannel(eventChannel);
            }
        };
    }, [enabled, user, eventId, showNotification]);

    // Manual notification trigger (for testing or programmatic use)
    const sendNotification = useCallback((payload: NotificationPayload) => {
        showNotification(payload);
    }, [showNotification]);

    return {
        sendNotification,
    };
};
