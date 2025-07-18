import React from 'react';
import { Play, Zap, DollarSign } from 'lucide-react';

interface LiveStreamLogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const LiveStreamLogo: React.FC<LiveStreamLogoProps> = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: {
      container: 'w-6 h-6 p-1',
      play: 'h-3 w-3',
      accent: 'h-2 w-2',
      live: 'text-[6px] px-0.5 py-0 -top-1.5 -right-1.5',
      dot: 'w-1 h-1'
    },
    md: {
      container: 'w-8 h-8 p-1.5',
      play: 'h-4 w-4',
      accent: 'h-2.5 w-2.5',
      live: 'text-[7px] px-1 py-0 -top-2 -right-2',
      dot: 'w-1.5 h-1.5'
    },
    lg: {
      container: 'w-10 h-10 p-2',
      play: 'h-5 w-5',
      accent: 'h-3 w-3',
      live: 'text-[8px] px-1 py-0.5 -top-2 -right-2',
      dot: 'w-1.5 h-1.5'
    }
  };

  const classes = sizeClasses[size];

  return (
    <div className={`relative bg-gradient-to-br from-white/30 to-white/10 backdrop-blur-sm rounded-lg border border-white/40 shadow-lg hover:shadow-xl transition-all duration-300 ${classes.container} ${className}`} style={{ maxWidth: '100%', maxHeight: '100%' }}>
      {/* Main Play Button */}
      <div className="relative z-10 flex items-center justify-center h-full">
        <Play className={`text-white ${classes.play}`} style={{ filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.7))' }} />
      </div>
      
      
      
      {/* Live Indicator */}
      <div className={`absolute flex items-center space-x-0.5 bg-red-500 text-white rounded-full animate-pulse ${classes.live}`} style={{ filter: 'drop-shadow(1px 1px 2px rgba(0,0,0,0.6))' }}>
        <div className={`bg-white rounded-full ${classes.dot}`}></div>
        <span className="font-bold leading-none">LIVE</span>
      </div>
    </div>
  );
};

export default LiveStreamLogo;