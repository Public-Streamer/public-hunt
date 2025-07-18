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
      play: 'h-4 w-4', // Increased from h-3 w-3
      accent: 'h-1.5 w-1.5',
      live: 'text-[6px] px-0.5 py-0.5 -top-1 -right-0.5',
      dot: 'w-0.5 h-0.5'
    },
    md: {
      container: 'w-8 h-8 p-1.5',
      play: 'h-5 w-5', // Increased from h-4 w-4
      accent: 'h-2 w-2',
      live: 'text-[8px] px-0.5 py-0.5 -top-1.5 -right-1',
      dot: 'w-1 h-1'
    },
    lg: {
      container: 'w-10 h-10 p-2',
      play: 'h-6 w-6', // Increased from h-5 w-5
      accent: 'h-2.5 w-2.5',
      live: 'text-[10px] px-1 py-0.5 -top-1.5 -right-1',
      dot: 'w-1 h-1'
    }
  };

  const classes = sizeClasses[size];

  return (
    <div className={`relative bg-gradient-to-br from-white/30 to-white/10 backdrop-blur-sm rounded-lg border border-white/40 shadow-lg hover:shadow-xl transition-all duration-300 ${classes.container} ${className}`}>
      {/* Main Play Button */}
      <div className="relative z-10 flex items-center justify-center h-full">
        <Play className={`text-white ${classes.play}`} style={{ filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.7))' }} />
      </div>
      
      {/* Lightning Bolt - Upper Left Corner */}
      <Zap className={`absolute -top-0.5 -left-0.5 text-yellow-300 animate-pulse ${classes.accent}`} style={{ filter: 'drop-shadow(1px 1px 2px rgba(0,0,0,0.7))' }} />
      
      {/* Dollar Sign - Lower Left Corner */}
      <DollarSign className={`absolute -bottom-0.5 -left-0.5 text-green-300 animate-pulse ${classes.accent}`} style={{ animationDelay: '0.5s', filter: 'drop-shadow(1px 1px 2px rgba(0,0,0,0.7))' }} />
      
      {/* Live Indicator */}
      <div className={`absolute flex items-center space-x-1 bg-red-500 text-white rounded-full animate-pulse ${classes.live}`} style={{ filter: 'drop-shadow(1px 1px 2px rgba(0,0,0,0.6))' }}>
        <div className={`bg-white rounded-full ${classes.dot}`}></div>
        <span className={`font-bold ${size === 'sm' ? 'text-[6px]' : size === 'md' ? 'text-[8px]' : 'text-[10px]'}`}>LIVE</span>
      </div>
    </div>
  );
};

export default LiveStreamLogo;