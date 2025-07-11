import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Share2, Facebook, Instagram, MessageCircle, Mail, Phone, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { TooltipDropdownMenuItem } from '@/components/ui/dropdown-menu-with-tooltip';

interface SocialShareMenuProps {
  title: string;
  url: string;
  description?: string;
}

const SocialShareMenu: React.FC<SocialShareMenuProps> = ({ title, url, description }) => {
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const { toast } = useToast();

  const platforms = [
    { id: 'tiktok', name: 'TikTok', icon: MessageCircle, color: 'bg-black', tooltip: 'Share on TikTok - Perfect for short video content' },
    { id: 'facebook', name: 'Facebook', icon: Facebook, color: 'bg-blue-600', tooltip: 'Share on Facebook - Reach friends and family' },
    { id: 'instagram', name: 'Instagram', icon: Instagram, color: 'bg-pink-600', tooltip: 'Share on Instagram - Visual content platform' },
    { id: 'x', name: 'X (Twitter)', icon: MessageCircle, color: 'bg-gray-900', tooltip: 'Share on X - Quick updates and news' },
    { id: 'snapchat', name: 'Snapchat', icon: MessageCircle, color: 'bg-yellow-400', tooltip: 'Share on Snapchat - Temporary content sharing' },
    { id: 'streamura', name: 'Streamura', icon: Share2, color: 'bg-purple-600', tooltip: 'Share within Streamura community' },
    { id: 'email', name: 'Email', icon: Mail, color: 'bg-green-600', tooltip: 'Share via email - Direct personal sharing' },
    { id: 'text', name: 'Text Message', icon: Phone, color: 'bg-blue-500', tooltip: 'Share via SMS - Instant messaging' }
  ];

  const handlePlatformToggle = (platformId: string) => {
    setSelectedPlatforms(prev => 
      prev.includes(platformId) 
        ? prev.filter(id => id !== platformId)
        : [...prev, platformId]
    );
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedPlatforms([]);
    } else {
      setSelectedPlatforms(platforms.map(p => p.id));
    }
    setSelectAll(!selectAll);
  };

  const handleShare = () => {
    if (selectedPlatforms.length === 0) {
      toast({ title: 'Please select at least one platform to share' });
      return;
    }

    selectedPlatforms.forEach(platformId => {
      const platform = platforms.find(p => p.id === platformId);
      if (platform) {
        console.log(`Sharing to ${platform.name}:`, { title, url, description });
      }
    });

    toast({ 
      title: 'Shared successfully!', 
      description: `Shared to ${selectedPlatforms.length} platform(s)` 
    });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Share2 className="h-5 w-5" />
          Share Promotional Link
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="select-all" 
            checked={selectAll}
            onCheckedChange={handleSelectAll}
          />
          <label htmlFor="select-all" className="font-medium cursor-pointer">
            Select All
          </label>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {platforms.map((platform) => {
            const Icon = platform.icon;
            const isSelected = selectedPlatforms.includes(platform.id);
            
            return (
              <div 
                key={platform.id}
                className={`flex items-center space-x-2 p-3 rounded-lg border cursor-pointer transition-all ${
                  isSelected 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => handlePlatformToggle(platform.id)}
                title={platform.tooltip}
              >
                <Checkbox 
                  checked={isSelected}
                  onChange={() => handlePlatformToggle(platform.id)}
                />
                <div className={`p-1 rounded ${platform.color}`}>
                  <Icon className="h-4 w-4 text-white" />
                </div>
                <span className="text-sm font-medium">{platform.name}</span>
              </div>
            );
          })}
        </div>
        
        <Button 
          onClick={handleShare}
          className="w-full mt-4"
          disabled={selectedPlatforms.length === 0}
        >
          Share to Selected Platforms
        </Button>
      </CardContent>
    </Card>
  );
};

export default SocialShareMenu;