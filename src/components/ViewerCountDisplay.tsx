import React from 'react';
import { Eye, Loader2, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useRealtimeViewerCount } from '@/hooks/useRealtimeViewerCount';
import { cn } from '@/lib/utils';

interface ViewerCountDisplayProps {
  eventId: string;
  participantCount?: number;
  streamerCount?: number;
  className?: string;
  variant?: 'default' | 'badge' | 'text';
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function ViewerCountDisplay({
  eventId,
  participantCount = 0,
  streamerCount = 0,
  className,
  variant = 'badge',
  showIcon = true,
  size = 'md'
}: ViewerCountDisplayProps) {
  const { viewerCount, isLoading, error } = useRealtimeViewerCount({
    eventId,
    participantCount,
    streamerCount,
    debounceMs: 1500
  });

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  if (error) {
    return (
      <Badge variant="secondary" className={cn("flex items-center gap-1", className)}>
        {showIcon && <AlertCircle className={iconSizes[size]} />}
        <span className={textSizes[size]}>Error</span>
      </Badge>
    );
  }

  if (isLoading) {
    return (
      <Badge variant="secondary" className={cn("flex items-center gap-1", className)}>
        {showIcon && <Loader2 className={cn(iconSizes[size], "animate-spin")} />}
        <span className={textSizes[size]}>...</span>
      </Badge>
    );
  }

  const IconComponent = showIcon ? Eye : null;

  switch (variant) {
    case 'text':
      return (
        <span className={cn("flex items-center gap-1", textSizes[size], className)}>
          {IconComponent && <IconComponent className={iconSizes[size]} />}
          {viewerCount} viewer{viewerCount !== 1 ? 's' : ''}
        </span>
      );

    case 'badge':
      return (
        <Badge variant="secondary" className={cn("flex items-center gap-1", className)}>
          {IconComponent && <IconComponent className={iconSizes[size]} />}
          <span className={textSizes[size]}>{viewerCount}</span>
        </Badge>
      );

    default:
      return (
        <div className={cn("flex items-center gap-1", textSizes[size], className)}>
          {IconComponent && <IconComponent className={iconSizes[size]} />}
          <span>{viewerCount}</span>
        </div>
      );
  }
}