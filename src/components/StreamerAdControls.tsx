import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Play, Clock, Zap } from 'lucide-react';
import { supabaseBrowser } from '@/lib/supabase/browser';
import { useToast } from '@/hooks/use-toast';

interface Ad {
  id: string;
  title: string;
  description: string;
  video_url: string;
  cta_label?: string;
  cta_url?: string;
  budget_remaining: number;
}

interface StreamerAdControlsProps {
  eventId: string;
  onAdTriggered: (ad: Ad, sessionId: string) => void;
  isEventFree: boolean;
  viewerCount: number;
}

export const StreamerAdControls: React.FC<StreamerAdControlsProps> = ({
  eventId,
  onAdTriggered,
  isEventFree,
  viewerCount
}) => {
  const [availableAds, setAvailableAds] = useState<Ad[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [scheduledAds, setScheduledAds] = useState<{ [key: string]: number }>({});
  const { toast } = useToast();

  // Fetch available ads
  const fetchAvailableAds = async () => {
    try {
      const supabase = supabaseBrowser();
      const { data, error } = await supabase
        .from('ads')
        .select('*')
        .eq('campaign_status', 'active')
        .gt('budget_remaining', 0);

      if (error) throw error;

      setAvailableAds(data || []);
    } catch (error) {
      console.error('Error fetching ads:', error);
    }
  };

  useEffect(() => {
    if (isEventFree) {
      fetchAvailableAds();
    }
  }, [isEventFree]);

  // Get random active ad
  const getRandomAd = (): Ad | null => {
    if (availableAds.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * availableAds.length);
    return availableAds[randomIndex];
  };

  // Trigger ad with timing
  const handleTriggerAd = async (delay: number = 0) => {
    const ad = getRandomAd();
    if (!ad) {
      toast({
        title: "No ads available",
        description: "There are no active ads available to display",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    if (delay > 0) {
      // Schedule ad
      const timeoutId = setTimeout(async () => {
        await triggerAdNow(ad);
        setScheduledAds(prev => {
          const newScheduled = { ...prev };
          delete newScheduled[ad.id];
          return newScheduled;
        });
      }, delay * 1000);

      setScheduledAds(prev => ({
        ...prev,
        [ad.id]: Date.now() + (delay * 1000)
      }));

      toast({
        title: "Ad scheduled",
        description: `"${ad.title}" will play in ${delay === 60 ? '1 minute' : '5 minutes'}`,
      });

      setIsLoading(false);
    } else {
      // Trigger immediately
      await triggerAdNow(ad);
    }
  };

  const triggerAdNow = async (ad: Ad) => {
    try {
      const supabase = supabaseBrowser();
      
      // Create ad session
      const { data, error } = await supabase.functions.invoke('create-ad-session', {
        body: {
          eventId,
          adId: ad.id,
          viewerCount
        }
      });

      if (error) throw error;

      // Trigger callback to parent
      onAdTriggered(ad, data.sessionId);

      // Broadcast to all viewers via real-time
      const channel = supabase.channel(`event-ads-${eventId}`);
      await channel.send({
        type: 'broadcast',
        event: 'ad_started',
        payload: {
          ad,
          sessionId: data.sessionId
        }
      });

      toast({
        title: "Ad started",
        description: `"${ad.title}" is now playing for all viewers`,
      });

    } catch (error) {
      console.error('Error triggering ad:', error);
      toast({
        title: "Error",
        description: "Failed to start ad",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Countdown timer for scheduled ads
  const [countdowns, setCountdowns] = useState<{ [key: string]: number }>({});

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdowns(prev => {
        const newCountdowns: { [key: string]: number } = {};
        Object.entries(scheduledAds).forEach(([adId, targetTime]) => {
          const remaining = Math.max(0, Math.ceil((targetTime - Date.now()) / 1000));
          if (remaining > 0) {
            newCountdowns[adId] = remaining;
          }
        });
        return newCountdowns;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [scheduledAds]);

  if (!isEventFree) {
    return null;
  }

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Play className="h-4 w-4" />
          Ad Controls
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Badge variant="secondary" className="text-xs">
            {availableAds.length} ads available
          </Badge>
          <span>•</span>
          <span>{viewerCount} viewers</span>
        </div>

        <div className="grid grid-cols-1 gap-2">
          <Button
            onClick={() => handleTriggerAd(0)}
            disabled={isLoading || availableAds.length === 0}
            size="sm"
            className="w-full justify-start"
          >
            <Zap className="h-3 w-3 mr-2" />
            Play Now
          </Button>

          <Button
            onClick={() => handleTriggerAd(60)}
            disabled={isLoading || availableAds.length === 0}
            variant="outline"
            size="sm"
            className="w-full justify-start"
          >
            <Clock className="h-3 w-3 mr-2" />
            1 Minute Later
          </Button>

          <Button
            onClick={() => handleTriggerAd(300)}
            disabled={isLoading || availableAds.length === 0}
            variant="outline"
            size="sm"
            className="w-full justify-start"
          >
            <Clock className="h-3 w-3 mr-2" />
            5 Minutes Later
          </Button>
        </div>

        {/* Show scheduled ads with countdown */}
        {Object.keys(scheduledAds).length > 0 && (
          <div className="space-y-2">
            <div className="text-xs font-medium text-muted-foreground">Scheduled:</div>
            {Object.entries(countdowns).map(([adId, remaining]) => {
              const ad = availableAds.find(a => a.id === adId);
              if (!ad || remaining <= 0) return null;
              
              const minutes = Math.floor(remaining / 60);
              const seconds = remaining % 60;
              
              return (
                <div key={adId} className="flex items-center justify-between text-xs">
                  <span className="truncate max-w-24">{ad.title}</span>
                  <Badge variant="outline" className="text-xs">
                    {minutes}:{seconds.toString().padStart(2, '0')}
                  </Badge>
                </div>
              );
            })}
          </div>
        )}

        {availableAds.length === 0 && (
          <div className="text-xs text-muted-foreground text-center py-2">
            No active ads available
          </div>
        )}
      </CardContent>
    </Card>
  );
};