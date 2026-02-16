import React from 'react';
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Settings } from "lucide-react";
import { Track, VideoQuality } from "livekit-client";
import { TrackReference } from "@livekit/components-react";

interface StreamQualitySelectorProps {
  trackRef?: TrackReference;
  currentQuality: string; // "Auto", "High", "Medium", "Low"
  onQualityChange: (quality: string) => void;
  className?: string;
}

export const StreamQualitySelector: React.FC<StreamQualitySelectorProps> = ({
  trackRef,
  currentQuality,
  onQualityChange,
  className,
}) => {
  
  const handleQualitySelect = (label: string, quality: VideoQuality | undefined) => {
    onQualityChange(label);
    
    if (trackRef?.publication && trackRef.publication.kind === Track.Kind.Video) {
      // If it's a remote track, we can suggest quality
      // Note: usage depends on LiveKit version. 
      // standard method: trackRef.publication.setVideoQuality(quality)
      if ('setVideoQuality' in trackRef.publication) {
         // @ts-ignore - dynamic check for method existence
         trackRef.publication.setVideoQuality(quality);
      }
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className={`h-8 w-8 p-0 text-white hover:bg-white/20 ${className}`}>
          <Settings className="h-4 w-4" />
          <span className="sr-only">Stream Quality</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-32 bg-black/90 border-gray-800 text-white">
        <DropdownMenuItem 
          onClick={() => handleQualitySelect("Auto", undefined)}
          className="focus:bg-white/20 cursor-pointer"
        >
          {currentQuality === "Auto" && <span className="mr-2">✓</span>}
          Auto
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => handleQualitySelect("High", VideoQuality.HIGH)}
          className="focus:bg-white/20 cursor-pointer"
        >
          {currentQuality === "High" && <span className="mr-2">✓</span>}
          High (HD)
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => handleQualitySelect("Medium", VideoQuality.MEDIUM)}
          className="focus:bg-white/20 cursor-pointer"
        >
          {currentQuality === "Medium" && <span className="mr-2">✓</span>}
          Medium (SD)
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => handleQualitySelect("Low", VideoQuality.LOW)}
          className="focus:bg-white/20 cursor-pointer"
        >
          {currentQuality === "Low" && <span className="mr-2">✓</span>}
          Low
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default StreamQualitySelector;
