import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  X,
  Users,
  MessageCircle,
  Share2,
  Edit2,
  VideoOff,
  Waves,
  Eye,
  Play,
  Pause,
  Volume2,
  VolumeX,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface AdPreviewProps {
  adData: {
    title: string;
    description: string;
    videoUrl: string;
    budget: string;
    ctaLabel?: string;
    ctaUrl?: string;
  };
  onClose: () => void;
}

const AdPreview = ({ adData, onClose }: AdPreviewProps) => {
  const [showAd, setShowAd] = useState(true);
  const [skipTimer, setSkipTimer] = useState(5);
  const [canSkip, setCanSkip] = useState(false);
  
  // Video control states
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!showAd) return;

    // Skip timer countdown
    const skipInterval = setInterval(() => {
      setSkipTimer((prev) => {
        if (prev <= 1) {
          setCanSkip(true);
          clearInterval(skipInterval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(skipInterval);
    };
  }, [showAd]);

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

    const handleEnded = () => {
      setShowAd(false);
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
    };
  }, [showAd]);

  const handleSkipAd = () => {
    if (canSkip) {
      setShowAd(false);
    }
  };

  const handleCtaClick = () => {
    if (adData.ctaUrl) {
      window.open(adData.ctaUrl, "_blank", "noopener,noreferrer");
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
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      {/* Close Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onClose}
        className="absolute top-2 right-2 md:top-4 md:right-4 z-50 hover:bg-gray-200 min-h-[44px] touch-manipulation"
      >
        <X className="h-5 w-5" />
      </Button>

      {/* Page Title */}
      <div className="text-center py-4 border-b border-gray-200">
        <h1 className="text-xl md:text-2xl font-semibold text-gray-900">Test Event 1</h1>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:flex-row max-w-7xl mx-auto w-full p-4 gap-6">
        {/* Left Content */}
        <div className="flex-1 space-y-4">
          {/* Video Area */}
          <div className="bg-black rounded-lg relative aspect-video">
            {/* Live Badge */}
            <div className="absolute top-4 left-4 bg-red-600 text-white px-3 py-1 rounded text-sm font-medium z-30">
              🔴 LIVE
            </div>

            {/* Camera Off State */}
            <div className="absolute inset-0 flex items-center justify-center text-center text-white">
              <div>
                <VideoOff className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg text-gray-300">Camera/Screen is Off</p>
              </div>
            </div>

            {/* YouTube-Style Ad Overlay */}
            {showAd && (
              <div 
                className="absolute inset-0 bg-black/80 cursor-pointer"
                onMouseEnter={() => setShowControls(true)}
                onMouseLeave={() => setShowControls(false)}
                onClick={togglePlay}
              >
                {/* Ad Video - Fullscreen */}
                <video
                  ref={videoRef}
                  src={adData.videoUrl}
                  autoPlay
                  className="w-full h-full object-cover pointer-events-none"
                  controls={false}
                />

                {/* Ad Indicator */}
                <div className="absolute top-2 left-2 md:top-4 md:left-4 bg-yellow-500 text-black px-2 py-1 text-xs font-medium rounded z-30">
                  Ad
                </div>

                {/* Ad Title - Top Left (No Background) */}
                <div className="absolute top-12 left-2 md:top-16 md:left-4 z-30 max-w-[280px] md:max-w-sm">
                  <h3 className="text-white font-semibold text-sm md:text-lg drop-shadow-lg">
                    {adData.title}
                  </h3>
                </div>

                {/* Sponsored Section - Bottom with Float Animation */}
                <div className={`absolute bottom-0 left-0 right-0 max-w-[280px] md:max-w-sm ml-2 md:ml-4 z-30 transition-transform duration-300 ${showControls ? 'transform -translate-y-16' : 'transform translate-y-0'}`}>
                  <div className="bg-black/80 backdrop-blur-sm rounded-lg p-2 md:p-3 mb-2">
                    <div className="text-white/70 text-xs mb-1">Sponsored</div>
                    <p className="text-white text-xs md:text-sm line-clamp-2 mb-2">
                      {adData.description}
                    </p>
                    
                    {/* CTA Button */}
                    {adData.ctaLabel && adData.ctaUrl && (
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCtaClick();
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 md:px-4 py-1.5 text-xs md:text-sm font-medium rounded-md shadow-lg min-h-[32px] touch-manipulation"
                      >
                        {adData.ctaLabel}
                      </Button>
                    )}
                  </div>
                </div>

                {/* Video Controls */}
                <div 
                  className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2 md:p-4 transition-all duration-300 ${showControls ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-2'} z-40`}
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Progress Bar */}
                  <div className="mb-2">
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
                    <div className="flex items-center space-x-2 md:space-x-4">
                      {/* Play/Pause Button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          togglePlay();
                        }}
                        className="text-white hover:bg-white/20 p-1 h-8 w-8"
                      >
                        {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      </Button>

                      {/* Volume Control */}
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleMute();
                          }}
                          className="text-white hover:bg-white/20 p-1 h-8 w-8"
                        >
                          {isMuted || volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                        </Button>
                        <div className="hidden md:block w-20">
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
                      <div className="text-white text-xs md:text-sm">
                        {formatTime(currentTime)} / {formatTime(duration)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Simple Progress Bar (always visible) */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 z-30">
                  <div
                    className="bg-yellow-500 h-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>

                {/* Skip Button - Bottom Right with Float Animation */}
                <div className={`absolute bottom-2 right-2 md:bottom-4 md:right-4 z-30 transition-transform duration-300 ${showControls ? 'transform -translate-y-16' : 'transform translate-y-0'}`}>
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSkipAd();
                    }}
                    disabled={!canSkip}
                    variant="secondary"
                    size="sm"
                    className={`${
                      canSkip
                        ? "bg-white text-black hover:bg-gray-100"
                        : "bg-gray-600/80 text-white cursor-not-allowed"
                    } text-xs md:text-sm px-2 md:px-3 py-1 font-medium min-h-[36px] touch-manipulation`}
                  >
                    {canSkip ? "Skip Ad" : `Skip Ad in ${skipTimer}`}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Like and Comment Buttons */}
          <div className="flex gap-2 mt-4">
            <Button variant="outline" className="flex-1 text-gray-600 hover:text-gray-900">
              ❤️ Like
            </Button>
            <Button variant="outline" className="flex-1 text-gray-600 hover:text-gray-900">
              💬 Comment
            </Button>
          </div>

          {/* Live Discussion Section */}
          <div className="mt-6">
            <div className="flex items-center gap-2 mb-4">
              <MessageCircle className="h-5 w-5 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900">Live Discussion (0)</h3>
            </div>
            
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
                <span className="text-sm text-gray-600">No messages yet...</span>
              </div>
              
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Join the live discussion..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Button className="bg-blue-500 hover:bg-blue-600 text-white px-6">
                  Send
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="w-full lg:w-80 space-y-4">
          {/* Event Info Card */}
          <Card className="border border-gray-200">
            <CardContent className="p-4">
              <h3 className="font-semibold text-gray-900 mb-4">Test Event 1</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-gray-600">Podcast</span>
                  <span className="bg-red-500 text-white px-2 py-1 rounded text-xs">🔴 LIVE</span>
                  <span className="bg-green-500 text-white px-2 py-1 rounded text-xs">Full Access (Free Event)</span>
                </div>
                <div className="text-gray-600">tst</div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-gray-600">📅 2025-09-20</div>
                    <div className="text-gray-600">👤 Error</div>
                  </div>
                  <div>
                    <div className="text-gray-600">🕐 12:50:00</div>
                    <div className="text-gray-600">📍 Khulna</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Share Event Card */}
          <Card className="border border-gray-200">
            <CardContent className="p-4">
              <h3 className="font-semibold text-gray-900 mb-4">Share Event</h3>
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <Share2 className="h-4 w-4 text-gray-600" />
                  <span className="text-sm font-medium">Share Promotional Link</span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <Button variant="outline" size="sm" className="p-2">
                    <div className="w-6 h-6 bg-green-500 rounded flex items-center justify-center text-white text-xs">W</div>
                  </Button>
                  <Button variant="outline" size="sm" className="p-2">
                    <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center text-white text-xs">f</div>
                  </Button>
                  <Button variant="outline" size="sm" className="p-2">
                    <div className="w-6 h-6 bg-pink-500 rounded flex items-center justify-center text-white text-xs">📷</div>
                  </Button>
                  <Button variant="outline" size="sm" className="p-2">
                    <div className="w-6 h-6 bg-black rounded flex items-center justify-center text-white text-xs">X</div>
                  </Button>
                  <Button variant="outline" size="sm" className="p-2">
                    <div className="w-6 h-6 bg-red-500 rounded flex items-center justify-center text-white text-xs">📺</div>
                  </Button>
                  <Button variant="outline" size="sm" className="p-2">
                    <div className="w-6 h-6 bg-blue-500 rounded flex items-center justify-center text-white text-xs">📧</div>
                  </Button>
                  <Button variant="outline" size="sm" className="p-2">
                    <div className="w-6 h-6 bg-green-600 rounded flex items-center justify-center text-white text-xs">📱</div>
                  </Button>
                  <Button variant="outline" size="sm" className="p-2">
                    <div className="w-6 h-6 bg-gray-600 rounded flex items-center justify-center text-white text-xs">📋</div>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Report Event Card */}
          <Card className="border border-gray-200">
            <CardContent className="p-4">
              <h3 className="font-semibold text-gray-900 mb-4">Report Event</h3>
              <Button variant="outline" className="w-full">
                🚨 Report Event
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Preview Label */}
      <div className="absolute top-16 md:top-20 left-2 md:left-4 bg-yellow-500 text-black px-2 md:px-3 py-1 rounded-full text-xs md:text-sm font-medium">
        🎬 Ad Preview Mode
      </div>
    </div>
  );
};

export default AdPreview;