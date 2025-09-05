import React, { useState, useRef, useEffect } from 'react';
import {
  Video,
  Users,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { VideoTrackLazy, RoomAudioRendererLazy } from '@/lib/livekitLazy';
import type { Stream } from '@/lib/viewerState';

interface StreamsGridProps {
  streams: Stream[];
  eventId: string;
  hasLiveStreams: boolean;
}

interface StreamTileProps {
  stream: Stream;
  isVisible: boolean;
  onMaximize: () => void;
  isMaximized: boolean;
}

const StreamTile: React.FC<StreamTileProps> = ({
  stream,
  isVisible,
  onMaximize,
  isMaximized,
}) => {
  const [isMuted, setIsMuted] = useState(true);
  const [isAttached, setIsAttached] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Use IntersectionObserver to only attach video when visible
  useEffect(() => {
    if (!isVisible) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsAttached(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [isVisible]);

  // Re-attach on visibility change (for re-entry scenario)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (
        document.visibilityState === 'visible' &&
        isVisible &&
        containerRef.current
      ) {
        // Force re-check intersection when tab becomes visible
        const rect = containerRef.current.getBoundingClientRect();
        const isInViewport = rect.top < window.innerHeight && rect.bottom > 0;
        if (isInViewport && !isAttached) {
          setIsAttached(true);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () =>
      document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isVisible, isAttached]);

  return (
    <div
      ref={containerRef}
      className={`relative bg-black rounded-lg overflow-hidden ${
        isMaximized ? 'fixed inset-4 z-50' : 'aspect-video'
      }`}
    >
      {/* Video Content */}
      {isAttached && stream.livekitTrackIds?.length ? (
        <div className="w-full h-full">
          {/* Placeholder for LiveKit VideoTrack integration */}
          <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
            <Video className="h-12 w-12 text-white/50" />
          </div>

          {/* Audio rendering when unmuted */}
          {!isMuted && (
            <div className="hidden">
              <RoomAudioRendererLazy volume={0.8} muted={false} />
            </div>
          )}
        </div>
      ) : (
        <div className="w-full h-full bg-gray-800 flex items-center justify-center">
          <div className="text-center text-white/70">
            <Video className="h-8 w-8 mx-auto mb-2" />
            <p className="text-sm">Loading stream...</p>
          </div>
        </div>
      )}

      {/* Stream Info Overlay */}
      <div className="absolute top-2 left-2 flex items-center gap-2">
        <Badge className="bg-red-600 text-white">
          <div className="w-2 h-2 bg-white rounded-full mr-1 animate-pulse" />
          LIVE
        </Badge>
      </div>

      {/* Stream Title */}
      <div className="absolute bottom-2 left-2 right-2">
        <div className="bg-black/70 rounded px-2 py-1">
          <p className="text-white text-sm font-medium truncate">
            {stream.title}
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="absolute top-2 right-2 flex items-center gap-1">
        <Button
          variant="secondary"
          size="sm"
          className="h-8 w-8 p-0 bg-black/50 hover:bg-black/70"
          onClick={() => setIsMuted(!isMuted)}
        >
          {isMuted ? (
            <VolumeX className="h-4 w-4 text-white" />
          ) : (
            <Volume2 className="h-4 w-4 text-white" />
          )}
        </Button>

        <Button
          variant="secondary"
          size="sm"
          className="h-8 w-8 p-0 bg-black/50 hover:bg-black/70"
          onClick={onMaximize}
        >
          {isMaximized ? (
            <Minimize2 className="h-4 w-4 text-white" />
          ) : (
            <Maximize2 className="h-4 w-4 text-white" />
          )}
        </Button>
      </div>
    </div>
  );
};

export const StreamsGrid: React.FC<StreamsGridProps> = ({
  streams,
  eventId,
  hasLiveStreams,
}) => {
  const [maximizedStream, setMaximizedStream] = useState<string | null>(null);

  // Handle escape key to exit maximize
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && maximizedStream) {
        setMaximizedStream(null);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [maximizedStream]);

  if (!hasLiveStreams) {
    return (
      <Card className="h-64">
        <CardContent className="h-full flex items-center justify-center">
          <div className="text-center space-y-4">
            <Video className="h-12 w-12 mx-auto text-muted-foreground" />
            <div>
              <h3 className="font-semibold text-lg mb-2">
                Event will begin soon
              </h3>
              <p className="text-muted-foreground">
                Streams will appear here when the event goes live
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div
        className={`grid gap-4 ${
          streams.length === 1
            ? 'grid-cols-1'
            : streams.length === 2
              ? 'grid-cols-1 md:grid-cols-2'
              : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-2'
        }`}
      >
        {streams.map((stream) => (
          <StreamTile
            key={stream.streamId}
            stream={stream}
            isVisible
            onMaximize={() => {
              setMaximizedStream(
                maximizedStream === stream.streamId ? null : stream.streamId
              );
            }}
            isMaximized={maximizedStream === stream.streamId}
          />
        ))}
      </div>

      {/* Maximized overlay backdrop */}
      {maximizedStream && (
        <div
          className="fixed inset-0 bg-black/90 z-40"
          onClick={() => setMaximizedStream(null)}
        />
      )}
    </>
  );
};
