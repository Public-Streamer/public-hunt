import React, { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import type { TrackReference } from '@livekit/components-react';

export const LiveKitRoomLazy = lazy(() =>
  import('@livekit/components-react').then((m) => ({ default: m.LiveKitRoom }))
);

/** Lazy wrapper for @livekit/components-react.VideoTrack */
export const VideoTrackLazy = ({
  trackRef,
  className,
  fallback,
}: {
  trackRef: TrackReference;
  className?: string;
  fallback?: React.ReactNode;
}) => {
  const Comp = useMemo(
    () =>
      lazy(() =>
        import('@livekit/components-react').then((m) => ({
          default: m.VideoTrack,
        }))
      ),
    []
  );
  return (
    <Suspense fallback={fallback ?? <div className={className} />}>
      <Comp trackRef={trackRef} className={className} />
    </Suspense>
  );
};

/** Lazy wrapper for @livekit/components-react.AudioTrack – use this for per‑track audio */
export const AudioTrackLazy = ({
  trackRef,
  muted,
  volume,
  fallback,
}: {
  trackRef: TrackReference;
  muted?: boolean;
  volume?: number;
  fallback?: React.ReactNode;
}) => {
  const Comp = useMemo(
    () =>
      lazy(() =>
        import('@livekit/components-react').then((m) => ({
          default: m.AudioTrack,
        }))
      ),
    []
  );
  return (
    <Suspense fallback={fallback ?? null}>
      <Comp trackRef={trackRef} muted={muted} volume={volume} />
    </Suspense>
  );
};

/** Lazy wrapper for @livekit/components-react.RoomAudioRenderer – plays all room audio */
export const RoomAudioRendererLazy = ({
  muted,
  volume,
  fallback,
}: {
  muted?: boolean;
  volume?: number;
  fallback?: React.ReactNode;
}) => {
  const Comp = useMemo(
    () =>
      lazy(() =>
        import('@livekit/components-react').then((m) => ({
          default: m.RoomAudioRenderer,
        }))
      ),
    []
  );
  return (
    <Suspense fallback={fallback ?? null}>
      <Comp muted={muted} volume={volume} />
    </Suspense>
  );
};

/** Hook that loads livekit-client after mount and returns the Track enum */
export function useLiveKitTrackEnum() {
  const [TrackEnum, setTrackEnum] = useState<any>(null);
  useEffect(() => {
    let mounted = true;
    if (typeof window === 'undefined') return;
    import('livekit-client').then((m) => {
      if (mounted) setTrackEnum(m.Track);
    });
    return () => {
      mounted = false;
    };
  }, []);
  return TrackEnum as typeof import('livekit-client').Track | null;
}

/** Hook that returns only Track.Source to avoid class-constructor issues */
export function useLiveKitTrackSource() {
  const [Source, setSource] = useState<any>(null);
  useEffect(() => {
    let mounted = true;
    if (typeof window === 'undefined') return;
    import('livekit-client').then((m) => {
      if (mounted) setSource(m.Track?.Source ?? null);
    });
    return () => {
      mounted = false;
    };
  }, []);
  return Source;
}
