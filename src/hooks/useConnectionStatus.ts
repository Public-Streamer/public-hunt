import { useState, useEffect } from 'react';
import { supabaseBrowser } from '@/lib/supabase/browser';

export type ConnectionStatus = 'connected' | 'connecting' | 'reconnecting' | 'disconnected';

interface ConnectionStatusResult {
    status: ConnectionStatus;
    lastConnected: Date | null;
    reconnectAttempts: number;
    manualReconnect: () => void;
}

export const useConnectionStatus = (): ConnectionStatusResult => {
    const [status, setStatus] = useState<ConnectionStatus>('connecting');
    const [lastConnected, setLastConnected] = useState<Date | null>(null);
    const [reconnectAttempts, setReconnectAttempts] = useState(0);
    const [channel, setChannel] = useState<any>(null);

    useEffect(() => {
        const supabase = supabaseBrowser();

        // Create a heartbeat channel to monitor connection
        const heartbeatChannel = supabase
            .channel('connection-monitor')
            .on('presence', { event: 'sync' }, () => {
                // Connection is active
                if (status !== 'connected') {
                    setStatus('connected');
                    setLastConnected(new Date());
                    setReconnectAttempts(0);
                }
            })
            .subscribe((channelStatus) => {
                console.log('[ConnectionStatus] Channel status:', channelStatus);

                switch (channelStatus) {
                    case 'SUBSCRIBED':
                        setStatus('connected');
                        setLastConnected(new Date());
                        setReconnectAttempts(0);
                        break;
                    case 'CHANNEL_ERROR':
                    case 'TIMED_OUT':
                        setStatus('reconnecting');
                        setReconnectAttempts(prev => prev + 1);
                        break;
                    case 'CLOSED':
                        setStatus('disconnected');
                        break;
                }
            });

        setChannel(heartbeatChannel);

        return () => {
            if (heartbeatChannel) {
                supabase.removeChannel(heartbeatChannel);
            }
        };
    }, []);

    const manualReconnect = () => {
        setStatus('connecting');
        setReconnectAttempts(0);

        // Force reconnection by removing and recreating channel
        if (channel) {
            const supabase = supabaseBrowser();
            supabase.removeChannel(channel);

            // Recreate channel after a short delay
            setTimeout(() => {
                const newChannel = supabase
                    .channel('connection-monitor')
                    .subscribe((channelStatus) => {
                        if (channelStatus === 'SUBSCRIBED') {
                            setStatus('connected');
                            setLastConnected(new Date());
                        }
                    });
                setChannel(newChannel);
            }, 500);
        }
    };

    return {
        status,
        lastConnected,
        reconnectAttempts,
        manualReconnect,
    };
};
