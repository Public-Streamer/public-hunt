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
    <div className="fixed inset-0 bg-gray-100 z-50 flex flex-col">
      {/* Close Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onClose}
        className="absolute top-2 right-2 md:top-4 md:right-4 z-50 hover:bg-gray-200 min-h-[44px] touch-manipulation"
      >
        <X className="h-5 w-5" />
      </Button>

      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-3 md:p-4">
        <div className="w-full flex flex-col md:flex-row md:items-center justify-between space-y-2 md:space-y-0">
          <div className="flex items-center space-x-2 md:space-x-4">
            <div className="w-6 h-6 md:w-8 md:h-8 bg-gray-300 rounded flex items-center justify-center">
              <Waves className="h-3 w-3 md:h-4 md:w-4" />
            </div>
            <div>
              <h1 className="text-sm md:text-lg font-semibold text-gray-900">
                Yoga Summer Batch 2025 - Streaming Controls
              </h1>
            </div>
            <Edit2 className="h-3 w-3 md:h-4 md:w-4 text-gray-400" />
          </div>
          <div className="flex items-center space-x-2 md:space-x-4">
            <div className="bg-blue-600 text-white px-2 md:px-3 py-1 rounded-md text-xs md:text-sm font-medium">
              Connected
            </div>
            <div className="flex items-center space-x-1 md:space-x-2 text-xs md:text-sm text-gray-600">
              <Users className="h-3 w-3 md:h-4 md:w-4" />
              <span>2 total</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:flex-row w-full">
        {/* Video Area */}
        <div className="flex-1 p-2 md:p-4">
          <div className="bg-white rounded-lg border border-gray-200 h-[40vh] md:h-[60vh] lg:h-full relative">
            {/* User Info */}
            <div className="p-2 md:p-4 border-b border-gray-200 flex items-center justify-between">
              <span className="text-xs md:text-sm text-gray-700">billuthemowtother@mail.com</span>
              <div className="flex items-center space-x-1 md:space-x-2">
                <Edit2 className="h-3 w-3 md:h-4 md:w-4 text-gray-400" />
                <div className="flex items-center space-x-1 text-xs md:text-sm text-gray-600">
                  <Eye className="h-3 w-3 md:h-4 md:w-4" />
                  <span>2</span>
                </div>
              </div>
            </div>

            {/* Video Content */}
            <div className="flex-1 relative bg-gray-50 flex items-center justify-center min-h-[300px] md:min-h-[400px]">
              {/* Live Badge */}
              <div className="absolute top-2 left-2 md:top-4 md:left-4 bg-red-600 text-white px-2 py-1 rounded text-xs md:text-sm font-medium">
                🔴 LIVE
              </div>

              {/* Camera Off State */}
              <div className="text-center text-gray-500">
                <VideoOff className="h-12 w-12 md:h-16 md:w-16 mx-auto mb-2" />
                <p className="text-sm md:text-lg">Camera is off</p>
              </div>

              {/* YouTube-Style Ad Overlay */}
              {showAd && (
                <div 
                  className="absolute inset-0 bg-black/80"
                  onMouseEnter={() => setShowControls(true)}
                  onMouseLeave={() => setShowControls(false)}
                >
                  {/* Ad Video - Fullscreen */}
                  <video
                    ref={videoRef}
                    src={adData.videoUrl}
                    autoPlay
                    className="w-full h-full object-cover"
                    controls={false}
                  />

                  {/* Ad Indicator */}
                  <div className="absolute top-2 left-2 md:top-4 md:left-4 bg-yellow-500 text-black px-2 py-1 text-xs font-medium rounded">
                    Ad
                  </div>

                  {/* Ad Title - Top Center */}
                  <div className="absolute top-2 left-1/2 transform -translate-x-1/2 md:top-4 z-30">
                    <h3 className="text-white font-semibold text-sm md:text-lg text-center drop-shadow-lg">
                      {adData.title}
                    </h3>
                  </div>

                  {/* Sponsored Indicator & Description - Bottom Left */}
                  <div className="absolute bottom-16 left-2 md:bottom-20 md:left-4 max-w-[280px] md:max-w-sm z-30">
                    <div className="bg-black/80 backdrop-blur-sm rounded-lg p-2 md:p-3">
                      <div className="text-white/70 text-xs mb-1">Sponsored</div>
                      <p className="text-white text-xs md:text-sm line-clamp-2 mb-2">
                        {adData.description}
                      </p>
                      
                      {/* CTA Button */}
                      {adData.ctaLabel && adData.ctaUrl && (
                        <Button
                          size="sm"
                          onClick={handleCtaClick}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 md:px-4 py-1.5 text-xs md:text-sm font-medium rounded-md shadow-lg min-h-[32px] touch-manipulation"
                        >
                          {adData.ctaLabel}
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Video Controls */}
                  <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2 md:p-4 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'} z-40`}>
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
                          onClick={togglePlay}
                          className="text-white hover:bg-white/20 p-1 h-8 w-8"
                        >
                          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                        </Button>

                        {/* Volume Control */}
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={toggleMute}
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

                  {/* Skip Button - Bottom Right */}
                  <div className="absolute bottom-2 right-2 md:bottom-4 md:right-4">
                    <Button
                      onClick={handleSkipAd}
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

            {/* Show Chat Button */}
            <div className="absolute bottom-2 left-2 md:bottom-4 md:left-4">
              <Button
                variant="secondary"
                size="sm"
                className="bg-gray-700 text-white hover:bg-gray-800 text-xs md:text-sm min-h-[36px] touch-manipulation"
              >
                <MessageCircle className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                Show Chat
              </Button>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-full lg:w-80 p-2 md:p-4 space-y-3 md:space-y-4">
          {/* Stream Information */}
          <Card>
            <CardContent className="p-3 md:p-4">
              <h3 className="font-semibold text-gray-900 mb-3 md:mb-4 text-sm md:text-base">
                Stream Information
              </h3>
              <div className="space-y-2 md:space-y-3 text-xs md:text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className="text-gray-900 font-medium">Live</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Viewers:</span>
                  <span className="text-gray-900 font-medium">2</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Connection:</span>
                  <span className="text-gray-900 font-medium">Connected</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Invite Other Streamers */}
          <Card>
            <CardContent className="p-3 md:p-4">
              <h3 className="font-semibold text-gray-900 mb-2 flex items-center text-sm md:text-base">
                <Share2 className="h-3 w-3 md:h-4 md:w-4 mr-2" />
                Invite Other Streamers
              </h3>
              <p className="text-xs md:text-sm text-gray-600 mb-3 md:mb-4">
                Share this stage link to invite other streamers to join your
                event:
              </p>

              <div className="bg-gray-50 p-2 rounded text-xs text-gray-700 mb-3 md:mb-4 font-mono overflow-hidden">
                http://localhost:8080/stage/yoga-summer...
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm" className="justify-start text-xs min-h-[40px] touch-manipulation">
                  <div className="w-3 h-3 md:w-4 md:h-4 bg-green-500 rounded mr-1 md:mr-2" />
                  WhatsApp
                </Button>
                <Button variant="outline" size="sm" className="justify-start text-xs min-h-[40px] touch-manipulation">
                  <div className="w-3 h-3 md:w-4 md:h-4 bg-blue-600 rounded mr-1 md:mr-2" />
                  Facebook
                </Button>
                <Button variant="outline" size="sm" className="justify-start text-xs min-h-[40px] touch-manipulation">
                  <div className="w-3 h-3 md:w-4 md:h-4 bg-pink-500 rounded mr-1 md:mr-2" />
                  Instagram
                </Button>
                <Button variant="outline" size="sm" className="justify-start text-xs min-h-[40px] touch-manipulation">
                  <div className="w-3 h-3 md:w-4 md:h-4 bg-black rounded mr-1 md:mr-2" />
                  TikTok
                </Button>
                <Button variant="outline" size="sm" className="justify-start text-xs min-h-[40px] touch-manipulation">
                  <div className="w-3 h-3 md:w-4 md:h-4 bg-black rounded mr-1 md:mr-2" />
                  X (Twitter)
                </Button>
                <Button variant="outline" size="sm" className="justify-start text-xs min-h-[40px] touch-manipulation">
                  <div className="w-3 h-3 md:w-4 md:h-4 bg-gray-600 rounded mr-1 md:mr-2" />
                  Copy Link
                </Button>
              </div>

              <Button
                variant="outline"
                size="sm"
                className="w-full mt-2 justify-start text-xs min-h-[40px] touch-manipulation"
              >
                <div className="w-3 h-3 md:w-4 md:h-4 bg-purple-500 rounded mr-1 md:mr-2" />
                Copy Message
              </Button>
            </CardContent>
          </Card>

          {/* Bottom text */}
          <p className="text-xs text-gray-500 text-center">
            Unlock to modify stream controls
          </p>
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