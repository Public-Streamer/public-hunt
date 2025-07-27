import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Share2, MessageCircle, Facebook, Copy, Check, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { useScreenSize } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';

interface StageShareMenuProps {
  eventId: string;
  eventTitle: string;
  eventDescription?: string;
}

const StageShareMenu: React.FC<StageShareMenuProps> = ({ 
  eventId, 
  eventTitle, 
  eventDescription 
}) => {
  const [copiedStates, setCopiedStates] = useState<{ [key: string]: boolean }>({});
  const [isGeneratingToken, setIsGeneratingToken] = useState(false);
  const screenSize = useScreenSize();

  const generateSecureInviteLink = async (): Promise<string> => {
    try {
      setIsGeneratingToken(true);
      
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error('Please log in to generate invite links');
      }

      const { data, error } = await supabase.functions.invoke('generate-streamer-invite-token', {
        body: { eventId },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        throw new Error(error.message || 'Failed to generate secure invite link');
      }

      return `${window.location.origin}/stage/${eventId}?token=${data.token}`;
    } catch (error) {
      console.error('Error generating secure invite link:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to generate secure invite link');
      // Fallback to basic URL
      return `${window.location.origin}/stage/${eventId}`;
    } finally {
      setIsGeneratingToken(false);
    }
  };

  const stageUrl = `${window.location.origin}/stage/${eventId}`;
  const shareMessage = `Join me for a live streaming event: "${eventTitle}"\n\n${eventDescription ? eventDescription + '\n\n' : ''}Access the stage here: ${stageUrl}`;

  const shareOptions = [
    {
      id: 'whatsapp',
      name: 'WhatsApp',
      icon: MessageCircle,
      color: 'bg-green-500',
      action: () => {
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareMessage)}`;
        window.open(whatsappUrl, '_blank');
        toast.success('WhatsApp opened with stage invitation');
      }
    },
    {
      id: 'facebook',
      name: 'Facebook Messenger',
      icon: Facebook,
      color: 'bg-blue-600',
      action: () => {
        const messengerUrl = `https://m.me/?text=${encodeURIComponent(shareMessage)}`;
        window.open(messengerUrl, '_blank');
        toast.success('Facebook Messenger opened with stage invitation');
      }
    },
    {
      id: 'instagram',
      name: 'Instagram',
      icon: Share2,
      color: 'bg-gradient-to-r from-purple-500 to-pink-500',
      action: () => {
        navigator.clipboard.writeText(shareMessage).then(() => {
          window.open('https://www.instagram.com/direct/inbox/', '_blank');
          toast.success('Message copied! Paste in Instagram DM');
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
          window.open('https://www.tiktok.com/messages', '_blank');
          toast.success('Message copied! Paste in TikTok DM');
        });
      }
    },
    {
      id: 'twitter',
      name: 'X (Twitter)',
      icon: MessageCircle,
      color: 'bg-black',
      action: () => {
        const twitterUrl = `https://twitter.com/messages/compose?text=${encodeURIComponent(shareMessage)}`;
        window.open(twitterUrl, '_blank');
        toast.success('X opened with stage invitation');
      }
    },
    {
      id: 'copy',
      name: 'Copy Secure Link',
      icon: copiedStates['copy'] ? Check : Copy,
      color: copiedStates['copy'] ? 'bg-green-600' : 'bg-gray-600',
      action: async () => {
        const secureUrl = await generateSecureInviteLink();
        navigator.clipboard.writeText(secureUrl).then(() => {
          setCopiedStates(prev => ({ ...prev, copy: true }));
          toast.success('Secure invite link copied to clipboard');
          setTimeout(() => {
            setCopiedStates(prev => ({ ...prev, copy: false }));
          }, 2000);
        }).catch(() => {
          // Fallback for older browsers
          const textArea = document.createElement('textarea');
          textArea.value = secureUrl;
          document.body.appendChild(textArea);
          textArea.select();
          document.execCommand('copy');
          document.body.removeChild(textArea);
          
          setCopiedStates(prev => ({ ...prev, copy: true }));
          toast.success('Secure invite link copied to clipboard');
          setTimeout(() => {
            setCopiedStates(prev => ({ ...prev, copy: false }));
          }, 2000);
        });
      }
    },
    {
      id: 'copy-message',
      name: 'Copy Message',
      icon: copiedStates['copy-message'] ? Check : Copy,
      color: copiedStates['copy-message'] ? 'bg-green-600' : 'bg-purple-600',
      action: () => {
        navigator.clipboard.writeText(shareMessage).then(() => {
          setCopiedStates(prev => ({ ...prev, 'copy-message': true }));
          toast.success('Full invitation message copied');
          setTimeout(() => {
            setCopiedStates(prev => ({ ...prev, 'copy-message': false }));
          }, 2000);
        }).catch(() => {
          // Fallback for older browsers
          const textArea = document.createElement('textarea');
          textArea.value = shareMessage;
          document.body.appendChild(textArea);
          textArea.select();
          document.execCommand('copy');
          document.body.removeChild(textArea);
          
          setCopiedStates(prev => ({ ...prev, 'copy-message': true }));
          toast.success('Full invitation message copied');
          setTimeout(() => {
            setCopiedStates(prev => ({ ...prev, 'copy-message': false }));
          }, 2000);
        });
      }
    }
  ];

  return (
    <Card>
      <CardHeader className="p-3 sm:p-6">
        <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
          <Share2 className="h-3 w-3 sm:h-4 sm:w-4" />
          {screenSize === 'mobile' ? 'Invite Streamers' : 'Invite Other Streamers'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-6">
        <div className="space-y-2">
          <p className="text-xs sm:text-sm text-muted-foreground">
            {screenSize === 'mobile' ? 'Share stage link:' : 'Share this stage link to invite other streamers to join your event:'}
          </p>
          <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
            <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
            <span className="text-xs sm:text-sm font-mono truncate flex-1">{stageUrl}</span>
          </div>
        </div>

        <div className={`grid gap-2 ${screenSize === 'mobile' ? 'grid-cols-1' : 'grid-cols-2'}`}>
          {shareOptions.map((option) => {
            const Icon = option.icon;
            return (
              <Button
                key={option.id}
                onClick={option.action}
                variant="outline"
                className={`flex items-center gap-2 h-auto p-2 sm:p-3 ${screenSize === 'mobile' ? 'justify-start' : ''}`}
                disabled={copiedStates[option.id] || (option.id === 'copy' && isGeneratingToken)}
                size={screenSize === 'mobile' ? 'sm' : 'default'}
              >
                <div className={`p-1 rounded ${option.color} flex-shrink-0`}>
                  <Icon className="h-3 w-3 text-white" />
                </div>
                <span className="text-xs sm:text-sm truncate">{option.name}</span>
              </Button>
            );
          })}
        </div>

        <div className="pt-2 border-t">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="secondary" className="text-xs">
              Host Only
            </Badge>
            <span className="truncate">{screenSize === 'mobile' ? 'Private panel' : 'Only you can see this sharing panel'}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StageShareMenu;