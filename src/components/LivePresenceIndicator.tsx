import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { usePresence } from '@/hooks/usePresence';
import { Users, Loader2 } from 'lucide-react';

interface LivePresenceIndicatorProps {
    eventId: string;
    maxAvatars?: number;
}

export const LivePresenceIndicator: React.FC<LivePresenceIndicatorProps> = ({
    eventId,
    maxAvatars = 10
}) => {
    const { activeUsers, isConnected, error } = usePresence({ eventId });

    if (error) {
        return null; // Fail silently
    }

    if (!isConnected) {
        return (
            <div className="flex items-center gap-2 text-xs text-neutral-400">
                <Loader2 className="h-3 w-3 animate-spin" />
                Connecting...
            </div>
        );
    }

    const displayedUsers = activeUsers.slice(0, maxAvatars);
    const overflowCount = activeUsers.length - maxAvatars;

    return (
        <TooltipProvider>
            <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                    {displayedUsers.map((user, index) => (
                        <Tooltip key={user.id}>
                            <TooltipTrigger asChild>
                                <Avatar
                                    className="h-7 w-7 border-2 border-black ring-0 cursor-pointer hover:z-10 hover:scale-110 transition-transform"
                                    style={{
                                        zIndex: displayedUsers.length - index,
                                        animationDelay: `${index * 50}ms`
                                    }}
                                >
                                    <AvatarImage src={user.avatarUrl} />
                                    <AvatarFallback className="text-xs bg-gradient-to-br from-pink-500 to-purple-600 text-white">
                                        {user.displayName?.charAt(0).toUpperCase() || '?'}
                                    </AvatarFallback>
                                </Avatar>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="text-xs">
                                {user.displayName}
                            </TooltipContent>
                        </Tooltip>
                    ))}
                    {overflowCount > 0 && (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div className="h-7 w-7 rounded-full bg-neutral-700 border-2 border-black flex items-center justify-center text-xs text-white font-medium relative z-0">
                                    +{overflowCount}
                                </div>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="text-xs">
                                {overflowCount} more viewers
                            </TooltipContent>
                        </Tooltip>
                    )}
                </div>
                <span className="text-xs text-neutral-400 flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {activeUsers.length} watching
                </span>
            </div>
        </TooltipProvider>
    );
};

export default LivePresenceIndicator;
