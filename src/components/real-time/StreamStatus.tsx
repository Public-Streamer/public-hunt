import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Circle, AlertTriangle, CheckCircle, Zap } from 'lucide-react';
import { useStreamContext } from '@/components/livekit/LiveKitProvider';

interface StreamStatusProps {
  className?: string;
}

export const StreamStatus: React.FC<StreamStatusProps> = ({ className = '' }) => {
  const { connectionState, isLive, error } = useStreamContext();

  const getStatusInfo = () => {
    switch (connectionState) {
      case 'connected':
        return {
          icon: <Circle className="h-3 w-3 mr-1 text-green-500" />,
          text: isLive ? 'Live' : 'Connected',
          variant: 'default' as const,
        };
      case 'connecting':
        return {
          icon: <Zap className="h-3 w-3 mr-1 text-yellow-500" />,
          text: 'Connecting...',
          variant: 'secondary' as const,
        };
      case 'disconnected':
        return {
          icon: <AlertTriangle className="h-3 w-3 mr-1 text-gray-500" />,
          text: 'Disconnected',
          variant: 'outline' as const,
        };
      case 'failed':
        return {
          icon: <AlertTriangle className="h-3 w-3 mr-1 text-red-500" />,
          text: error || 'Connection failed',
          variant: 'destructive' as const,
        };
      default:
        return {
          icon: <Circle className="h-3 w-3 mr-1 text-gray-500" />,
          text: 'Unknown',
          variant: 'outline' as const,
        };
    }
  };

  const { icon, text, variant } = getStatusInfo();

  return (
    <Badge variant={variant} className={className}>
      {icon}
      <span>{text}</span>
    </Badge>
  );
};

export default StreamStatus;
