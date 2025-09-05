import React, { useState, useEffect } from 'react';
import {
  X,
  Star,
  ThumbsUp,
  Target,
  HelpCircle,
  Clock,
  Music,
  Laugh,
  Smartphone,
} from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';

interface AdFeedbackPopupProps {
  adId: string;
  adName: string;
  onClose: () => void;
  onSubmit?: () => void;
}

const feedbackTags = [
  { id: 'helpful', label: 'Helpful', icon: ThumbsUp },
  { id: 'relevant', label: 'Relevant', icon: Target },
  { id: 'confusing', label: 'Confusing', icon: HelpCircle },
  { id: 'too_long', label: 'Too Long', icon: Clock },
  { id: 'good_music', label: 'Good Music', icon: Music },
  { id: 'funny', label: 'Funny', icon: Laugh },
  { id: 'mobile_friendly', label: 'Looks Great on Mobile', icon: Smartphone },
];

const AdFeedbackPopup: React.FC<AdFeedbackPopupProps> = ({
  adId,
  adName,
  onClose,
  onSubmit,
}) => {
  const [starRating, setStarRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [feedbackText, setFeedbackText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sessionId, setSessionId] = useState('');

  useEffect(() => {
    // Generate or retrieve session ID
    let sid = localStorage.getItem('viewer_session_id');
    if (!sid) {
      sid = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('viewer_session_id', sid);
    }
    setSessionId(sid);
  }, []);

  const handleStarClick = (rating: number) => {
    setStarRating(rating);
  };

  const handleTagToggle = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId]
    );
  };

  const handleSubmit = async () => {
    if (starRating === 0) {
      toast.error('Please select a star rating');
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from('ad_feedback').insert({
        ad_id: adId,
        viewer_session_id: sessionId,
        star_rating: starRating,
        selected_tags: selectedTags,
        feedback_text: feedbackText.trim() || null,
        viewer_ip: null, // Could be added via edge function if needed
        user_agent: navigator.userAgent,
      });

      if (error) {
        // If it's a unique constraint violation, show different message
        if (error.code === '23505') {
          toast.info("You've already rated this ad. Thanks for your feedback!");
        } else {
          throw error;
        }
      } else {
        toast.success('Thank you for your feedback!');
      }

      // Mark that this ad has been rated in this session
      const ratedAds = JSON.parse(localStorage.getItem('rated_ads') || '[]');
      if (!ratedAds.includes(adId)) {
        ratedAds.push(adId);
        localStorage.setItem('rated_ads', JSON.stringify(ratedAds));
      }

      onSubmit?.();
      onClose();
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast.error('Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    // Mark as skipped so it doesn't show again for this ad
    const skippedAds = JSON.parse(
      localStorage.getItem('skipped_ad_feedback') || '[]'
    );
    if (!skippedAds.includes(adId)) {
      skippedAds.push(adId);
      localStorage.setItem('skipped_ad_feedback', JSON.stringify(skippedAds));
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[9998] flex items-center justify-center p-4 animate-fade-in">
      <Card className="w-full max-w-md animate-scale-in">
        <CardHeader className="text-center space-y-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg">
              What did you think of this ad?
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground truncate">"{adName}"</p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Star Rating */}
          <div className="text-center space-y-2">
            <div className="flex justify-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => handleStarClick(star)}
                  onMouseEnter={() => setHoveredStar(star)}
                  onMouseLeave={() => setHoveredStar(0)}
                  className="p-1 transition-colors hover:scale-110"
                  disabled={isSubmitting}
                >
                  <Star
                    className={`h-8 w-8 ${
                      star <= (hoveredStar || starRating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-muted-foreground'
                    } transition-colors`}
                  />
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">Tap stars to rate</p>
          </div>

          {/* Quick Tags */}
          <div className="space-y-3">
            <p className="text-sm font-medium">Quick feedback (optional):</p>
            <div className="grid grid-cols-2 gap-2">
              {feedbackTags.map((tag) => {
                const Icon = tag.icon;
                const isSelected = selectedTags.includes(tag.id);
                return (
                  <Button
                    key={tag.id}
                    variant="outline"
                    size="sm"
                    onClick={() => handleTagToggle(tag.id)}
                    disabled={isSubmitting}
                    className={`flex items-center gap-2 text-xs justify-start ${
                      isSelected ? 'bg-primary text-primary-foreground' : ''
                    }`}
                  >
                    <Icon className="h-3 w-3" />
                    {tag.label}
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Free Text Feedback */}
          <div className="space-y-2">
            <p className="text-sm font-medium">
              Anything you'd like to tell the advertiser? (optional)
            </p>
            <Textarea
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              placeholder="Your feedback helps improve future ads..."
              className="h-20 text-sm"
              maxLength={500}
              disabled={isSubmitting}
            />
            <p className="text-xs text-muted-foreground text-right">
              {feedbackText.length}/500
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={handleSkip}
              disabled={isSubmitting}
              className="flex-1"
            >
              Skip
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || starRating === 0}
              className="flex-1"
            >
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Your feedback is anonymous and helps improve ad quality
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdFeedbackPopup;
