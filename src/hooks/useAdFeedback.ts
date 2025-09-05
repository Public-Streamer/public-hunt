import { useState, useEffect } from 'react';

interface UseAdFeedbackProps {
  adId: string;
  adDuration?: number; // in seconds
  adType: 'video' | 'banner' | 'image';
}

export const useAdFeedback = ({
  adId,
  adDuration,
  adType,
}: UseAdFeedbackProps) => {
  const [shouldShowFeedback, setShouldShowFeedback] = useState(false);
  const [adStartTime, setAdStartTime] = useState<number | null>(null);

  useEffect(() => {
    // Check if user has already rated or skipped this ad
    const ratedAds = JSON.parse(localStorage.getItem('rated_ads') || '[]');
    const skippedAds = JSON.parse(
      localStorage.getItem('skipped_ad_feedback') || '[]'
    );

    if (ratedAds.includes(adId) || skippedAds.includes(adId)) {
      return;
    }

    // Record when ad viewing started
    setAdStartTime(Date.now());

    return () => {
      // Cleanup on unmount
      setAdStartTime(null);
    };
  }, [adId]);

  const handleAdWatched = () => {
    if (!adStartTime) return;

    const viewDuration = (Date.now() - adStartTime) / 1000; // in seconds

    // Check if user has already rated or skipped this ad
    const ratedAds = JSON.parse(localStorage.getItem('rated_ads') || '[]');
    const skippedAds = JSON.parse(
      localStorage.getItem('skipped_ad_feedback') || '[]'
    );

    if (ratedAds.includes(adId) || skippedAds.includes(adId)) {
      return;
    }

    // Determine if feedback should be shown based on ad type and duration
    let shouldShow = false;

    if (adType === 'video' && adDuration) {
      // For videos, show feedback if watched at least 70% or minimum 10 seconds
      const watchPercentage = viewDuration / adDuration;
      shouldShow = watchPercentage >= 0.7 || viewDuration >= 10;
    } else if (adType === 'banner') {
      // For banners, show feedback if viewed for at least 3 seconds
      shouldShow = viewDuration >= 3;
    } else if (adType === 'image') {
      // For images, show feedback if viewed for at least 2 seconds
      shouldShow = viewDuration >= 2;
    }

    if (shouldShow) {
      // Add a small delay to make it feel less intrusive
      setTimeout(() => {
        setShouldShowFeedback(true);
      }, 500);
    }
  };

  const handleAdSkipped = () => {
    // User skipped the ad before completion
    setAdStartTime(null);
  };

  const hideFeedback = () => {
    setShouldShowFeedback(false);
  };

  return {
    shouldShowFeedback,
    handleAdWatched,
    handleAdSkipped,
    hideFeedback,
  };
};
