import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  X,
  Users,
  MessageCircle,
  Share2,
  Edit2,
  VideoOff,
  Waves,
  Eye,
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
  const [adProgress, setAdProgress] = useState(0);
  const [skipTimer, setSkipTimer] = useState(5);
  const [canSkip, setCanSkip] = useState(false);
  const adDuration = 30; // 30 seconds for demo

  useEffect(() => {
    if (!showAd) return;

    // Ad progress timer
    const progressInterval = setInterval(() => {
      setAdProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 100 / adDuration;
      });
    }, 1000);

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
      clearInterval(progressInterval);
      clearInterval(skipInterval);
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

  return (
    <div className="fixed inset-0 bg-gray-100 z-50 flex flex-col">
      {/* Close Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onClose}
        className="absolute top-4 right-4 z-50 hover:bg-gray-200"
      >
        <X className="h-5 w-5" />
      </Button>

      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 bg-gray-300 rounded flex items-center justify-center">
              <Waves className="h-4 w-4" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">
                Yoga Summer Batch 2025 - Streaming Controls
              </h1>
            </div>
            <Edit2 className="h-4 w-4 text-gray-400" />
          </div>
          <div className="flex items-center space-x-4">
            <div className="bg-blue-600 text-white px-3 py-1 rounded-md text-sm font-medium">
              Connected
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Users className="h-4 w-4" />
              <span>2 total</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex max-w-7xl mx-auto w-full">
        {/* Left Side - Video Area */}
        <div className="flex-1 p-4">
          <div className="bg-white rounded-lg border border-gray-200 h-full relative">
            {/* User Info */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <span className="text-gray-700">billuthemowtother@mail.com</span>
              <div className="flex items-center space-x-2">
                <Edit2 className="h-4 w-4 text-gray-400" />
                <div className="flex items-center space-x-1 text-sm text-gray-600">
                  <Eye className="h-4 w-4" />
                  <span>2</span>
                </div>
              </div>
            </div>

            {/* Video Content */}
            <div className="flex-1 relative bg-gray-50 flex items-center justify-center min-h-[400px]">
              {/* Live Badge */}
              <div className="absolute top-4 left-4 bg-red-600 text-white px-2 py-1 rounded text-sm font-medium">
                🔴 LIVE
              </div>

              {/* Camera Off State */}
              <div className="text-center text-gray-500">
                <VideoOff className="h-16 w-16 mx-auto mb-2" />
                <p className="text-lg">Camera is off</p>
              </div>

              {/* YouTube-Style Ad Overlay */}
              {showAd && (
                <div className="absolute inset-0 bg-black/80">
                  {/* Ad Video - Fullscreen */}
                  <video
                    src={adData.videoUrl}
                    autoPlay
                    muted
                    className="w-full h-full object-cover"
                    controls={false}
                  />

                  {/* Ad Indicator */}
                  <div className="absolute top-4 left-4 bg-yellow-500 text-black px-2 py-1 text-xs font-medium rounded">
                    Ad
                  </div>

                  {/* Progress Bar - YouTube Style */}
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
                    <div
                      className="bg-yellow-500 h-full transition-all duration-1000"
                      style={{ width: `${adProgress}%` }}
                    />
                  </div>

                  {/* Ad Info - Bottom Left */}
                  <div className="absolute bottom-4 left-4 max-w-xs ">
                    <div className="bg-black/80 p-4 rounded-xl">
                      <h3 className="text-white font-semibold text-sm mb-1">
                        {adData.title}
                      </h3>
                      <p className="text-white/90 text-xs line-clamp-2">
                        {adData.description}
                      </p>
                    </div>

                    {/* CTA Button */}
                    {adData.ctaLabel && adData.ctaUrl && (
                      <Button
                        size="sm"
                        onClick={handleCtaClick}
                        className="mt-3 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-sm font-medium rounded-md shadow-lg"
                      >
                        {adData.ctaLabel}
                      </Button>
                    )}
                  </div>

                  {/* Skip Button - Bottom Right */}
                  <div className="absolute bottom-4 right-4">
                    <Button
                      onClick={handleSkipAd}
                      disabled={!canSkip}
                      variant="secondary"
                      size="sm"
                      className={`${
                        canSkip
                          ? "bg-white text-white hover:bg-gray-100"
                          : "bg-gray-600/80 text-white cursor-not-allowed"
                      } text-sm px-3 py-1 font-medium`}
                    >
                      {canSkip ? "Skip Ad" : `Skip Ad in ${skipTimer}`}
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Show Chat Button */}
            <div className="absolute bottom-4 left-4">
              <Button
                variant="secondary"
                size="sm"
                className="bg-gray-700 text-white hover:bg-gray-800"
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Show Chat
              </Button>
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="w-80 p-4 space-y-4">
          {/* Stream Information */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold text-gray-900 mb-4">
                Stream Information
              </h3>
              <div className="space-y-3 text-sm">
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
            <CardContent className="p-4">
              <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                <Share2 className="h-4 w-4 mr-2" />
                Invite Other Streamers
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Share this stage link to invite other streamers to join your
                event:
              </p>

              <div className="bg-gray-50 p-2 rounded text-xs text-gray-700 mb-4 font-mono">
                http://localhost:8080/stage/yoga-summer...
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm" className="justify-start">
                  <div className="w-4 h-4 bg-green-500 rounded mr-2" />
                  WhatsApp
                </Button>
                <Button variant="outline" size="sm" className="justify-start">
                  <div className="w-4 h-4 bg-blue-600 rounded mr-2" />
                  Facebook Messe...
                </Button>
                <Button variant="outline" size="sm" className="justify-start">
                  <div className="w-4 h-4 bg-pink-500 rounded mr-2" />
                  Instagram
                </Button>
                <Button variant="outline" size="sm" className="justify-start">
                  <div className="w-4 h-4 bg-black rounded mr-2" />
                  TikTok
                </Button>
                <Button variant="outline" size="sm" className="justify-start">
                  <div className="w-4 h-4 bg-black rounded mr-2" />X (Twitter)
                </Button>
                <Button variant="outline" size="sm" className="justify-start">
                  <div className="w-4 h-4 bg-gray-600 rounded mr-2" />
                  Copy Secure Link
                </Button>
              </div>

              <Button
                variant="outline"
                size="sm"
                className="w-full mt-2 justify-start"
              >
                <div className="w-4 h-4 bg-purple-500 rounded mr-2" />
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
      <div className="absolute top-20 left-4 bg-yellow-500 text-black px-3 py-1 rounded-full text-sm font-medium">
        🎬 Ad Preview Mode
      </div>
    </div>
  );
};

export default AdPreview;
