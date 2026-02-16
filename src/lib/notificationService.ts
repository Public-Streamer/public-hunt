import { supabaseBrowser } from '@/lib/supabase/browser';

export interface NotificationPayload {
    type: 'stream_started' | 'tip_received' | 'viewer_milestone' | 'chat_mention' | 'scheduled_reminder';
    title: string;
    message: string;
    eventId?: string;
    metadata?: Record<string, any>;
}

/**
 * Send a real-time notification to a specific user
 */
export const sendUserNotification = async (
    userId: string,
    payload: NotificationPayload
): Promise<void> => {
    const supabase = supabaseBrowser();

    try {
        const channel = supabase.channel(`notifications:${userId}`);
        await channel.send({
            type: 'broadcast',
            event: 'notification',
            payload,
        });
    } catch (error) {
        console.error('[NotificationService] Error sending user notification:', error);
    }
};

/**
 * Send a real-time notification to all viewers of an event
 */
export const sendEventNotification = async (
    eventId: string,
    payload: NotificationPayload
): Promise<void> => {
    const supabase = supabaseBrowser();

    try {
        const channel = supabase.channel(`event-notifications:${eventId}`);
        await channel.send({
            type: 'broadcast',
            event: 'notification',
            payload,
        });
    } catch (error) {
        console.error('[NotificationService] Error sending event notification:', error);
    }
};

/**
 * Trigger viewer milestone notification
 */
export const notifyViewerMilestone = async (
    eventId: string,
    hostId: string,
    viewerCount: number
): Promise<void> => {
    const milestones = [100, 500, 1000, 5000, 10000];

    if (milestones.includes(viewerCount)) {
        await sendUserNotification(hostId, {
            type: 'viewer_milestone',
            title: `🎉 ${viewerCount} Viewers!`,
            message: `Your stream just hit ${viewerCount} concurrent viewers!`,
            eventId,
            metadata: { viewerCount },
        });
    }
};

/**
 * Trigger tip received notification
 */
export const notifyTipReceived = async (
    hostId: string,
    eventId: string,
    amount: number,
    tipperName: string
): Promise<void> => {
    await sendUserNotification(hostId, {
        type: 'tip_received',
        title: '💝 Tip Received!',
        message: `${tipperName} sent you a $${amount.toFixed(2)} tip!`,
        eventId,
        metadata: { amount, tipperName },
    });
};

/**
 * Trigger stream started notification
 */
export const notifyStreamStarted = async (
    eventId: string,
    eventTitle: string
): Promise<void> => {
    await sendEventNotification(eventId, {
        type: 'stream_started',
        title: '🔴 Stream Started!',
        message: `${eventTitle} is now live!`,
        eventId,
    });
};
