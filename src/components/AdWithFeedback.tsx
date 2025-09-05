import React, { useState, useEffect } from 'react';
import { Play, Pause } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import AdFeedbackPopup from './AdFeedbackPopup';
import { useAdFeedback } from '@/hooks/useAdFeedback';

interface AdWithFeedbackProps {
  adId: string;
  adName: string;
  adType: 'video' | 'banner' | 'image';
  adDuration?: number;
  thumbnailUrl: string;
  className?: string;
}

const AdWithFeedback: React.FC<AdWithFeedbackProps> = ({
  adId,
  adName,
  adType,
  adDuration = 30,
  thumbnailUrl,
  className = '',
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  const { shouldShowFeedback, handleAdWatched, handleAdSkipped, hideFeedback } =
    useAdFeedback({ adId, adDuration, adType });

  // Simulate video playback
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setCurrentTime((prev) => {
        if (prev >= adDuration) {
          setIsPlaying(false);
          handleAdWatched(); // Trigger feedback popup
          return adDuration;
        }
        return prev + 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlaying, adDuration, handleAdWatched]);

  const handlePlay = () => {
    setIsPlaying(true);
  };

  const handlePause = () => {
    setIsPlaying(false);
  };

  const handleSkip = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    handleAdSkipped();
  };

  const handleFeedbackSubmit = () => {
    // Optional: Track that feedback was submitted
    console.log('Feedback submitted for ad:', adId);
  };

  return (
    <>
      <Card className={`overflow-hidden ${className}`}>
        <CardContent className="p-0">
          {/* Ad Display Area */}
          <div className="relative aspect-video bg-muted">
            <img
              src={thumbnailUrl}
              alt={adName}
              className="w-full h-full object-cover"
            />

            {/* Play/Pause Overlay */}
            {adType === 'video' && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Button
                  size="lg"
                  onClick={isPlaying ? handlePause : handlePlay}
                  className="bg-black/50 hover:bg-black/70 text-white"
                >
                  {isPlaying ? (
                    <Pause className="h-6 w-6" />
                  ) : (
                    <Play className="h-6 w-6" />
                  )}
                </Button>
              </div>
            )}

            {/* Progress Bar for Video */}
            {adType === 'video' && (
              <div className="absolute bottom-0 left-0 right-0 bg-black/50 p-2">
                <div className="flex items-center gap-2 text-white text-sm">
                  <span>{Math.floor(currentTime)}s</span>
                  <div className="flex-1 bg-white/30 rounded-full h-1">
                    <div
                      className="bg-white h-1 rounded-full transition-all duration-300"
                      style={{ width: `${(currentTime / adDuration) * 100}%` }}
                    />
                  </div>
                  <span>{adDuration}s</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSkip}
                    className="text-white hover:bg-white/20 text-xs h-6"
                  >
                    Skip
                  </Button>
                </div>
              </div>
            )}

            {/* Ad Label */}
            <div className="absolute top-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
              Ad
            </div>
          </div>

          {/* Ad Info */}
          <div className="p-4">
            <h4 className="font-semibold text-sm truncate">{adName}</h4>
            <p className="text-xs text-muted-foreground mt-1">
              {adType === 'video' ? `${adDuration}s video` : adType}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Feedback Popup */}
      {shouldShowFeedback && (
        <AdFeedbackPopup
          adId={adId}
          adName={adName}
          onClose={hideFeedback}
          onSubmit={handleFeedbackSubmit}
        />
      )}
    </>
  );
};

export default AdWithFeedback;
