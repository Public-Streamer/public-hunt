import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Share2, MessageCircle, Facebook, Copy, Check, ExternalLink, Globe, Users2 } from 'lucide-react';
import { toast } from 'sonner';

interface EventSharePanelProps {
  eventId: string;
  eventTitle: string;
  eventDescription?: string;
}

const EventSharePanel: React.FC<EventSharePanelProps> = ({ 
  eventId, 
  eventTitle, 
  eventDescription 
}) => {
  const [copiedStates, setCopiedStates] = useState<{ [key: string]: boolean }>({});
  const [isPostingToAll, setIsPostingToAll] = useState(false);

  const eventUrl = `${window.location.origin}/event/${eventId}`;
  const shareMessage = `Check out this live event: "${eventTitle}"\n\n${eventDescription ? eventDescription + '\n\n' : ''}Join here: ${eventUrl}`;

  const shareOptions = [
    {
      id: 'whatsapp',
      name: 'WhatsApp',
      icon: MessageCircle,
      color: 'bg-green-500',
      action: () => {
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareMessage)}`;
        window.open(whatsappUrl, '_blank');
        toast.success('WhatsApp opened with event link');
      }
    },
    {
      id: 'facebook',
      name: 'Facebook',
      icon: Facebook,
      color: 'bg-blue-600',
      action: () => {
        const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(eventUrl)}&quote=${encodeURIComponent(shareMessage)}`;
        window.open(facebookUrl, '_blank');
        toast.success('Facebook post dialog opened');
      }
    },
    {
      id: 'instagram',
      name: 'Instagram',
      icon: Share2,
      color: 'bg-gradient-to-r from-purple-500 to-pink-500',
      action: () => {
        navigator.clipboard.writeText(shareMessage).then(() => {
          window.open('https://www.instagram.com/', '_blank');
          toast.success('Message copied! Create Instagram post or story');
        });
      }
    },
    {
      id: 'tiktok',
      name: 'TikTok',
      icon: MessageCircle,
      color: 'bg-black',
      action: () => {
        navigator.clipboard.writeText(shareMessage).then(() => {
          window.open('https://www.tiktok.com/upload', '_blank');
          toast.success('Message copied! Create TikTok video');
        });
      }
    },
    {
      id: 'twitter',
      name: 'X (Twitter)',
      icon: MessageCircle,
      color: 'bg-black',
      action: () => {
        const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareMessage)}`;
        window.open(twitterUrl, '_blank');
        toast.success('X opened with event post');
      }
    },
    {
      id: 'copy',
      name: 'Copy Link',
      icon: copiedStates['copy'] ? Check : Copy,
      color: copiedStates['copy'] ? 'bg-green-600' : 'bg-gray-600',
      action: () => {
        navigator.clipboard.writeText(eventUrl).then(() => {
          setCopiedStates(prev => ({ ...prev, copy: true }));
          toast.success('Event link copied to clipboard');
          setTimeout(() => {
            setCopiedStates(prev => ({ ...prev, copy: false }));
          }, 2000);
        });
      }
    }
  ];

  const handlePostToAll = async () => {
    setIsPostingToAll(true);
    
    try {
      // Copy message to clipboard first
      await navigator.clipboard.writeText(shareMessage);
      
      // Open all social media platforms
      const platforms = [
        { url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(eventUrl)}&quote=${encodeURIComponent(shareMessage)}`, name: 'Facebook' },
        { url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareMessage)}`, name: 'Twitter' },
        { url: 'https://www.instagram.com/', name: 'Instagram' },
        { url: 'https://www.tiktok.com/upload', name: 'TikTok' }
      ];
      
      platforms.forEach((platform, index) => {
        setTimeout(() => {
          window.open(platform.url, '_blank');
        }, index * 500); // Stagger the opening to prevent popup blocks
      });
      
      toast.success('All social media platforms opened! Message copied to clipboard.');
    } catch (error) {
      toast.error('Failed to copy message to clipboard');
    } finally {
      setTimeout(() => setIsPostingToAll(false), 3000);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-4 w-4" />
          Share Event
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Share this event with your audience:
          </p>
          <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
            <ExternalLink className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-mono truncate flex-1">{eventUrl}</span>
          </div>
        </div>

        {/* Post to All Button */}
        <Button
          onClick={handlePostToAll}
          disabled={isPostingToAll}
          className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
          size="lg"
        >
          <Users2 className="h-4 w-4 mr-2" />
          {isPostingToAll ? 'Posting to All...' : 'POST TO ALL PLATFORMS'}
        </Button>

        {/* Individual Platform Buttons */}
        <div className="grid grid-cols-2 gap-2">
          {shareOptions.map((option) => {
            const Icon = option.icon;
            return (
              <Button
                key={option.id}
                onClick={option.action}
                variant="outline"
                className="flex items-center gap-2 h-auto p-3"
                disabled={copiedStates[option.id]}
              >
                <div className={`p-1 rounded ${option.color}`}>
                  <Icon className="h-3 w-3 text-white" />
                </div>
                <span className="text-sm">{option.name}</span>
              </Button>
            );
          })}
        </div>

        <div className="pt-2 border-t">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="secondary" className="text-xs">
              Host Only
            </Badge>
            <span>Share your event across all platforms</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EventSharePanel;