import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { Play, Clock, DollarSign, Eye } from "lucide-react";

interface Ad {
  id: string;
  title: string;
  description: string;
  video_url: string;
  budget_remaining: number;
  cpm_rate: number;
  cta_label?: string;
  cta_url?: string;
}

interface AdSelectorProps {
  eventId: string;
  onAdSelected: (ad: Ad) => void;
  disabled?: boolean;
}

const AdSelector = ({ eventId, onAdSelected, disabled }: AdSelectorProps) => {
  const [availableAds, setAvailableAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [scheduleMinutes, setScheduleMinutes] = useState(0);
  const [selectedAd, setSelectedAd] = useState<Ad | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      fetchAvailableAds();
    }
  }, [isOpen]);

  const fetchAvailableAds = async () => {
    try {
      setLoading(true);
      
      // Fetch ads that have budget remaining and are active
      const { data, error } = await supabase
        .from('ads')
        .select('id, title, description, video_url, budget_remaining, cpm_rate, cta_label, cta_url')
        .eq('status', 'active')
        .gt('budget_remaining', 0)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setAvailableAds(data || []);
    } catch (error) {
      console.error('Error fetching available ads:', error);
      toast({
        title: "Error",
        description: "Failed to load available ads",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerAd = async (ad: Ad, immediate: boolean = true) => {
    try {
      if (immediate) {
        onAdSelected(ad);
        setIsOpen(false);
        toast({
          title: "Ad Started",
          description: `"${ad.title}" is now playing to all viewers`
        });
      } else {
        // Schedule the ad
        setTimeout(() => {
          onAdSelected(ad);
          toast({
            title: "Scheduled Ad Started",
            description: `"${ad.title}" is now playing to all viewers`
          });
        }, scheduleMinutes * 60 * 1000);

        setIsOpen(false);
        toast({
          title: "Ad Scheduled",
          description: `"${ad.title}" will play in ${scheduleMinutes} minutes`
        });
      }
    } catch (error) {
      console.error('Error triggering ad:', error);
      toast({
        title: "Error",
        description: "Failed to trigger ad",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          disabled={disabled}
          className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
        >
          <Play className="h-4 w-4 mr-2" />
          Insert Ad
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Select Ad to Display</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="text-lg">Loading available ads...</div>
          </div>
        ) : availableAds.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">No ads available with remaining budget</p>
            <p className="text-sm text-gray-500">
              Active ads with budget will appear here automatically
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {availableAds.map((ad) => (
                <Card key={ad.id} className="cursor-pointer hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg line-clamp-2">{ad.title}</CardTitle>
                      <Badge variant="secondary">Active</Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-3">
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {ad.description}
                    </p>
                    
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4 text-green-600" />
                        <span>${ad.budget_remaining.toFixed(2)} left</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Eye className="h-4 w-4 text-blue-600" />
                        <span>${ad.cpm_rate.toFixed(2)} CPM</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleTriggerAd(ad, true)}
                        className="flex-1 bg-blue-600 hover:bg-blue-700"
                        size="sm"
                      >
                        <Play className="h-4 w-4 mr-1" />
                        Play Now
                      </Button>
                      <Button
                        onClick={() => setSelectedAd(ad)}
                        variant="outline"
                        size="sm"
                      >
                        <Clock className="h-4 w-4 mr-1" />
                        Schedule
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Schedule Modal */}
            {selectedAd && (
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Schedule "{selectedAd.title}"</h3>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <Label htmlFor="schedule-minutes">Play after (minutes)</Label>
                    <Input
                      id="schedule-minutes"
                      type="number"
                      min="1"
                      max="60"
                      value={scheduleMinutes}
                      onChange={(e) => setScheduleMinutes(parseInt(e.target.value) || 0)}
                      placeholder="Enter minutes"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleTriggerAd(selectedAd, false)}
                      disabled={scheduleMinutes < 1}
                    >
                      Schedule Ad
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setSelectedAd(null)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AdSelector;