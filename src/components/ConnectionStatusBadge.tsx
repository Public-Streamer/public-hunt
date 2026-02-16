import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { useConnectionStatus } from '@/hooks/useConnectionStatus';
import { formatDistanceToNow } from 'date-fns';

export const ConnectionStatusBadge: React.FC = () => {
    const { status, lastConnected, reconnectAttempts, manualReconnect } = useConnectionStatus();

    const getStatusConfig = () => {
        switch (status) {
            case 'connected':
                return {
                    color: 'bg-green-500',
                    icon: <Wifi className="h-3 w-3" />,
                    text: 'Connected',
                    variant: 'default' as const,
                };
            case 'connecting':
                return {
                    color: 'bg-yellow-500 animate-pulse',
                    icon: <RefreshCw className="h-3 w-3 animate-spin" />,
                    text: 'Connecting',
                    variant: 'secondary' as const,
                };
            case 'reconnecting':
                return {
                    color: 'bg-orange-500 animate-pulse',
                    icon: <RefreshCw className="h-3 w-3 animate-spin" />,
                    text: 'Reconnecting',
                    variant: 'secondary' as const,
                };
            case 'disconnected':
                return {
                    color: 'bg-red-500',
                    icon: <WifiOff className="h-3 w-3" />,
                    text: 'Disconnected',
                    variant: 'destructive' as const,
                };
        }
    };

    const config = getStatusConfig();

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 gap-1.5 hover:bg-transparent"
                >
                    <div className={`w-2 h-2 rounded-full ${config.color}`} />
                    <span className="text-xs hidden sm:inline">{config.text}</span>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64" side="bottom" align="end">
                <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        {config.icon}
                        <span className="font-semibold">{config.text}</span>
                    </div>

                    {lastConnected && (
                        <div className="text-xs text-muted-foreground">
                            Last connected: {formatDistanceToNow(lastConnected, { addSuffix: true })}
                        </div>
                    )}

                    {reconnectAttempts > 0 && (
                        <div className="text-xs text-orange-600">
                            Reconnection attempts: {reconnectAttempts}
                        </div>
                    )}

                    {status !== 'connected' && (
                        <Button
                            size="sm"
                            onClick={manualReconnect}
                            className="w-full"
                            variant="outline"
                        >
                            <RefreshCw className="h-3 w-3 mr-2" />
                            Reconnect Now
                        </Button>
                    )}

                    <div className="text-xs text-muted-foreground border-t pt-2">
                        Real-time updates for chat, reactions, and viewer counts require an active connection.
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
};
