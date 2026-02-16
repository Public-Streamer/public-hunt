import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Volume2, VolumeX, Maximize2, Settings } from 'lucide-react';

interface ViewerControlsProps {
  onFullscreen: () => void;
  onQualityChange: (quality: string) => void;
  onVolumeToggle: () => void;
  isMuted: boolean;
  isFullscreen: boolean;
  showControls: boolean;
}

const ViewerControls: React.FC<ViewerControlsProps> = ({
  onFullscreen,
  onQualityChange,
  onVolumeToggle,
  isMuted,
  isFullscreen,
  showControls,
}) => {
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const qualities = ['Auto', 'HD', 'SD', 'Low'];

  if (!showControls) return null;

  return (
    <div className="flex items-center gap-2 p-2 bg-black/70 rounded-lg transition-opacity duration-300">
      <Button
        variant="ghost"
        size="sm"
        onClick={onVolumeToggle}
        className="text-white hover:bg-white/20"
      >
        {isMuted ? (
          <VolumeX className="h-4 w-4" />
        ) : (
          <Volume2 className="h-4 w-4" />
        )}
      </Button>

      <div className="relative">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowQualityMenu(!showQualityMenu)}
          className="text-white hover:bg-white/20"
        >
          <Settings className="h-4 w-4" />
        </Button>

        {showQualityMenu && (
          <div className="absolute bottom-full mb-2 right-0 bg-black/90 rounded-lg p-2 min-w-[100px] z-50">
            {qualities.map((quality) => (
              <button
                key={quality}
                onClick={() => {
                  onQualityChange(quality);
                  setShowQualityMenu(false);
                }}
                className="block w-full text-left text-white hover:bg-white/20 px-3 py-1 rounded text-sm"
              >
                {quality}
              </button>
            ))}
          </div>
        )}
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={onFullscreen}
        className="text-white hover:bg-white/20"
      >
        <Maximize2 className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default ViewerControls;
