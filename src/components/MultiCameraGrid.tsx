import React, { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Video, VolumeX, ScreenShare } from "lucide-react";

// ✅ types only — won’t pull the libs at build time
import type { TrackReference } from "@livekit/components-react";

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
    <Suspense fallback={<div className={className} />}>
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
  selectedTrack: string | null;
}

const MultiCameraGrid: React.FC<MultiCameraGridProps> = ({
  tracks,
  onTrackSelect,
  selectedTrack,
}) => {
  const TrackEnum = useLiveKitTrackEnum();

  const isScreenShare = (t: TrackReference) => {
    // If enum not loaded yet, treat as false (UI-only impact for a moment)
    return TrackEnum
      ? t.publication.source === TrackEnum.Source.ScreenShare
      : false;
  };

  if (tracks.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center text-white">
        <div className="text-center">
          <Video className="h-16 w-16 mx-auto mb-4 text-white/50" />
          <p className="text-white/70">No active streams</p>
        </div>
      </div>
    );
  }

  const getGridCols = (count: number) => {
    if (count <= 2) return "grid-cols-1 md:grid-cols-2";
    if (count <= 4) return "grid-cols-2";
    if (count <= 6) return "grid-cols-2 md:grid-cols-3";
    return "grid-cols-2 md:grid-cols-3 lg:grid-cols-4";
  };

  // Single track
  if (tracks.length === 1) {
    const track = tracks[0];
    const screen = isScreenShare(track);
    return (
      <div className="w-full h-full relative">
        <LazyVideoTrack
          trackRef={track}
          className="w-full h-full object-cover"
        />

        <div className="absolute bottom-4 left-4 bg-black/70 text-white px-3 py-1 rounded flex items-center gap-2">
          {screen ? (
            <ScreenShare className="h-4 w-4 text-blue-400" />
          ) : (
            <Avatar className="h-6 w-6">
              <AvatarFallback className="text-xs">
                {track.participant.name?.substring(0, 2).toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
          )}
          <span className="text-sm">
            {track.participant.name || "Anonymous"}
            {screen && " (Screen)"}
          </span>
        </div>
      </div>
    );
  }

  // Grid
  return (
    <div
      className={`grid ${getGridCols(tracks.length)} gap-2 w-full h-full p-2`}
    >
      {tracks.map((track) => {
        const selected = selectedTrack === track.publication.trackSid;
        const screen = isScreenShare(track);

        return (
          <Card
            key={track.publication.trackSid}
            className={`relative overflow-hidden cursor-pointer transition-all duration-200 hover:ring-2 hover:ring-primary ${
              selected ? "ring-2 ring-primary" : ""
            }`}
            onClick={() => onTrackSelect(track.publication.trackSid)}
          >
            <div className="aspect-video bg-gray-900 relative">
              <LazyVideoTrack
                trackRef={track}
                className="w-full h-full object-cover"
              />

              <Badge
                className={`absolute top-2 left-2 text-white text-xs ${
                  screen ? "bg-blue-600" : "bg-red-600"
                }`}
              >
                <div className="w-1.5 h-1.5 bg-white rounded-full mr-1 animate-pulse" />
                {screen ? "SCREEN" : "LIVE"}
              </Badge>

              <div className="absolute top-2 right-2 bg-black/70 text-white p-1 rounded">
                <VolumeX className="h-3 w-3" />
              </div>

              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                <div className="flex items-center gap-2">
                  {screen ? (
                    <ScreenShare className="h-4 w-4 text-blue-400" />
                  ) : (
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-xs">
                        {track.participant.name
                          ?.substring(0, 2)
                          .toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div className="text-white text-sm truncate">
                    {track.participant.name || "Anonymous"}
                    {screen && " (Screen)"}
                  </div>
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
