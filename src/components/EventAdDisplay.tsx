import { useState, useEffect, useRef } from "react";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, Volume2, VolumeX } from "lucide-react";
import { useAdImpressionTracking } from '@/hooks/useAdImpressionTracking';

interface EventAdDisplayProps {
  adData: {
    id: string;
    title: string;
    description: string;
    video_url: string;
    cta_label?: string;
    cta_url?: string;
    event_id?: string;
  };
  onAdComplete: (adId: string, durationWatched: number) => void;
  viewerCount: number;
}

const EventAdDisplay = ({ adData, onAdComplete, viewerCount }: EventAdDisplayProps) => {
  // Video control states
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(false);
  const [twoSecondMarked, setTwoSecondMarked] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);

  // Initialize ad impression tracking
  const {
    startTracking,
    markTwoSecondThreshold,
    updateDuration,
    completeTracking,
    cleanup,
  } = useAdImpressionTracking(adData.id, adData.event_id || '');

  // Video event handlers
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
    };

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
    };

    const handlePlay = () => {
      setIsPlaying(true);
    };

    const handlePause = () => {
      setIsPlaying(false);
    };

    const handleEnded = async () => {
      await completeTracking(video.duration);
      onAdComplete(adData.id, video.duration);
    };

    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);
    video.addEventListener("ended", handleEnded);

    // Start tracking once when component mounts
    startTracking();

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
      video.removeEventListener("ended", handleEnded);
      cleanup();
    };
  }, [adData.id, onAdComplete, startTracking, cleanup]);

  // Track 2-second threshold
  useEffect(() => {
    if (currentTime >= 2 && !twoSecondMarked) {
      markTwoSecondThreshold();
      setTwoSecondMarked(true);
    }
  }, [currentTime, twoSecondMarked, markTwoSecondThreshold]);

  // Heartbeat interval for duration updates
  useEffect(() => {
    if (!isPlaying) return;

    const heartbeatInterval = setInterval(() => {
      updateDuration(currentTime);
    }, 5000);

    return () => clearInterval(heartbeatInterval);
  }, [isPlaying, currentTime, updateDuration]);

  const handleCtaClick = () => {
    if (adData.cta_url) {
      window.open(adData.cta_url, "_blank", "noopener,noreferrer");
    }
  };

  // Video control functions
  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  const handleVolumeChange = (value: number[]) => {
    const video = videoRef.current;
    if (!video) return;

    const newVolume = value[0];
    video.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const handleSeek = (value: number[]) => {
    const video = videoRef.current;
    if (!video) return;

    const newTime = value[0];
    video.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="absolute inset-0 bg-black z-50">
      {/* Ad Video - Fullscreen */}
      <video
        ref={videoRef}
        src={adData.video_url}
        autoPlay
        className="w-full h-full object-cover cursor-pointer"
        controls={false}
        onMouseEnter={() => setShowControls(true)}
        onMouseLeave={() => setShowControls(false)}
        onClick={togglePlay}
      />

      {/* Ad Title - Top */}
      <div className="absolute top-4 left-4 right-4 z-40 bg-black/70 backdrop-blur-sm rounded-lg p-3">
        <h3 className="text-white font-semibold text-lg">
          {adData.title}
        </h3>
        <div className="text-white/70 text-sm">
          Sponsored • {viewerCount} viewers
        </div>
      </div>

      {/* Sponsored Section - Bottom Left */}
      <div
        className={`absolute bottom-0 left-4 z-30 max-w-md transition-all duration-300 ease-in-out ${
          showControls
            ? "transform -translate-y-24"
            : "transform translate-y-0"
        }`}
      >
        <div className="bg-black/85 backdrop-blur-sm rounded-lg p-4 mb-3 shadow-lg">
          <div className="text-white/70 text-xs mb-2">
            Sponsored
          </div>
          <p className="text-white text-sm leading-relaxed line-clamp-2 mb-3">
            {adData.description}
          </p>

          {/* CTA Button */}
          {adData.cta_label && adData.cta_url && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleCtaClick();
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-sm font-medium rounded-md shadow-lg transition-colors duration-200"
            >
              {adData.cta_label}
            </button>
          )}
        </div>
      </div>

      {/* Video Controls */}
      <div
        className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-4 transition-all duration-300 ease-in-out ${
          showControls
            ? "opacity-100 transform translate-y-0"
            : "opacity-0 transform translate-y-2"
        } z-50`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Progress Bar */}
        <div className="mb-3">
          <Slider
            value={[currentTime]}
            max={duration}
            step={0.1}
            onValueChange={handleSeek}
            className="w-full"
          />
        </div>

        {/* Control Bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Play/Pause Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                togglePlay();
              }}
              className="text-white hover:bg-white/20 p-2 rounded-full transition-colors duration-200"
            >
              {isPlaying ? (
                <Pause className="h-5 w-5" />
              ) : (
                <Play className="h-5 w-5" />
              )}
            </button>

            {/* Volume Control */}
            <div className="flex items-center space-x-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleMute();
                }}
                className="text-white hover:bg-white/20 p-2 rounded-full transition-colors duration-200"
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="h-4 w-4" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
              </button>
              <div className="w-20">
                <Slider
                  value={[volume]}
                  max={1}
                  step={0.1}
                  onValueChange={handleVolumeChange}
                  className="w-full"
                />
              </div>
            </div>

            {/* Time Display */}
            <div className="text-white text-sm font-medium">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
          </div>
        </div>
      </div>

      {/* Simple Progress Bar (always visible) */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/30 z-10">
        <div
          className="bg-blue-500 h-full transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};

export default EventAdDisplay;
