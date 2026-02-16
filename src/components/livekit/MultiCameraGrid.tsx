import React, { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Video, VolumeX, ScreenShare, Maximize2, MicOff, MoreVertical, Pin } from "lucide-react";
import { ViewerCountDisplay } from "../ViewerCountDisplay";
import { TrackReference } from "@livekit/components-react";
import { StreamQualitySelector } from "./StreamQualitySelector";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// ---- Lazy one-off component wrapper for VideoTrack ----
const LazyVideoTrack = ({
  trackRef,
  className,
}: {
  trackRef: TrackReference;
  className?: string;
}) => {
  const Comp = useMemo(
    () =>
      // React.lazy needs a default export; remap VideoTrack to default
      lazy(() =>
        import("@livekit/components-react").then((m) => ({
          default: m.VideoTrack,
        }))
      ),
    []
  );

  return (
    <Suspense fallback={<div className={`bg-gray-900 animate-pulse ${className}`} />}>
      <Comp trackRef={trackRef} className={className} />
    </Suspense>
  );
};

// ---- Helper to access Track.Source without top-level import ----
function useLiveKitTrackEnum() {
  const [LK, setLK] = useState<null | { Track: any }>(null);
  useEffect(() => {
    let mounted = true;
    import("livekit-client").then((m) => {
      if (mounted) setLK({ Track: m.Track });
    });
    return () => {
      mounted = false;
    };
  }, []);
  return LK?.Track;
}

interface MultiCameraGridProps {
  tracks: TrackReference[];
  onTrackSelect: (trackId: string | null) => void;
  selectedTrack?: string | null;
  eventId?: string;
}

const MultiCameraGrid: React.FC<MultiCameraGridProps> = ({
  tracks,
  onTrackSelect,
  selectedTrack,
  eventId,
}) => {
  const TrackEnum = useLiveKitTrackEnum();
  const [qualityMap, setQualityMap] = useState<Record<string, string>>({});

  const isScreenShare = (t: TrackReference) => {
    return TrackEnum
      ? t.publication.source === TrackEnum.Source.ScreenShare
      : false;
  };

  const handleQualityChange = (trackSid: string, quality: string) => {
    setQualityMap(prev => ({ ...prev, [trackSid]: quality }));
  };

  if (tracks.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center text-white bg-black/50 rounded-lg border border-dashed border-white/10">
        <div className="text-center">
          <Video className="h-12 w-12 mx-auto mb-4 text-white/30" />
          <p className="text-white/50 text-sm">No active streams</p>
        </div>
      </div>
    );
  }

  const getGridCols = (count: number) => {
    if (count <= 1) return "grid-cols-1";
    if (count <= 2) return "grid-cols-1 md:grid-cols-2";
    if (count <= 4) return "grid-cols-2";
    if (count <= 6) return "grid-cols-2 md:grid-cols-3";
    return "grid-cols-2 md:grid-cols-3 lg:grid-cols-4";
  };

  return (
    <div className={`grid ${getGridCols(tracks.length)} gap-3 w-full h-full p-1`}>
      {tracks.map((track) => {
        const sid = track.publication.trackSid;
        const selected = selectedTrack === sid;
        const screen = isScreenShare(track);
        const quality = qualityMap[sid] || "Auto";

        return (
          <Card
            key={sid}
            className={`
              relative overflow-hidden group border-0 bg-black/90
              transition-all duration-300 ease-in-out
              ${selected ? "ring-2 ring-primary ring-offset-1 ring-offset-black" : "hover:ring-1 hover:ring-white/30"}
            `}
          >
            <div className="absolute inset-0 z-0">
              <LazyVideoTrack
                trackRef={track}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 opacity-60 group-hover:opacity-80 transition-opacity pointer-events-none z-10" />

            {/* Top Bar - Status */}
            <div className="absolute top-2 left-2 z-20 flex items-center gap-2">
              <Badge
                className={`text-[10px] px-1.5 py-0 h-5 border-0 ${screen ? "bg-blue-600/90 text-white" : "bg-red-600/90 text-white"
                  }`}
              >
                <div className={`w-1 h-1 rounded-full mr-1 ${screen ? "bg-blue-200" : "bg-white animate-pulse"}`} />
                {screen ? "SCREEN" : "LIVE"}
              </Badge>
              {quality !== "Auto" && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5 bg-black/50 text-white/80 backdrop-blur-sm border-white/10">
                  {quality}
                </Badge>
              )}
            </div>

            {/* Top Right - Quality Controls */}
            <div className="absolute top-2 right-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
              <StreamQualitySelector
                trackRef={track}
                currentQuality={quality}
                onQualityChange={(q) => handleQualityChange(sid, q)}
                className="bg-black/40 backdrop-blur-md hover:bg-black/60"
              />
            </div>

            {/* Center - Pin Action Overlay */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
              <Button
                variant="secondary"
                size="sm"
                className="pointer-events-auto bg-black/50 hover:bg-white text-white hover:text-black border border-white/20 backdrop-blur-sm transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 shadow-xl"
                onClick={() => onTrackSelect(sid)}
              >
                <Maximize2 className="h-4 w-4 mr-2" />
                Focus View
              </Button>
            </div>

            {/* Bottom Bar - Info */}
            <div className="absolute bottom-0 left-0 right-0 p-3 z-20">
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8 ring-1 ring-white/20">
                  <AvatarFallback className="text-xs bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold">
                    {track.participant.name?.substring(0, 2).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="text-white text-xs font-medium truncate flex items-center shadow-sm">
                    {track.participant.name || "Streamer"}
                    {screen && <span className="text-white/50 ml-1 font-normal">(Screen)</span>}
                  </div>
                  {/* Optional: Add active audio visualization here */}
                </div>

                <div className="flex items-center gap-1">
                  {track.source === "camera" && (
                    <div className="bg-black/40 p-1.5 rounded-full backdrop-blur-md">
                      <MicOff className="h-3 w-3 text-white/50" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
};

export default MultiCameraGrid;
