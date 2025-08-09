import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Share2, Facebook, Instagram, MessageCircle, Mail, Phone, Copy, Twitter, Youtube } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SocialShareMenuProps {
  title: string;
  url: string; // Share URL (Edge Function) for rich previews
  description?: string;
  prettyUrl?: string; // Pretty URL to show/copy for users
}

const SocialShareMenu: React.FC<SocialShareMenuProps> = ({ title, url, description, prettyUrl }) => {
  const { toast } = useToast();

const platforms = [
    { id: 'whatsapp', name: 'WhatsApp', icon: MessageCircle, color: 'bg-green-500', tooltip: 'Share on WhatsApp' },
    { id: 'facebook', name: 'Facebook', icon: Facebook, color: 'bg-blue-600', tooltip: 'Share on Facebook' },
    { id: 'instagram', name: 'Instagram', icon: Instagram, color: 'bg-pink-600', tooltip: 'Copy link for Instagram' },
    { id: 'x', name: 'X (Twitter)', icon: Twitter, color: 'bg-gray-900', tooltip: 'Share on X (Twitter)' },
    { id: 'youtube', name: 'YouTube', icon: Youtube, color: 'bg-red-600', tooltip: 'Share on YouTube' },
    { id: 'email', name: 'Email', icon: Mail, color: 'bg-blue-500', tooltip: 'Share via Email' },
    { id: 'sms', name: 'SMS', icon: Phone, color: 'bg-green-600', tooltip: 'Share via SMS' },
    { id: 'copy', name: 'Copy Pretty Link', icon: Copy, color: 'bg-gray-600', tooltip: 'Copy pretty link to clipboard' },
    { id: 'copy-preview', name: 'Copy Link (Preview)', icon: Copy, color: 'bg-gray-700', tooltip: 'Copy link that unfurls with previews' }
  ];

  const createShareMessage = (platform: string): string => {
    const baseMessage = `🚀 Join me for an exciting live event: "${title}"!`;
    const callToAction = `✨ Don't miss out - join the live experience now!`;
    const fullMessage = description 
      ? `${baseMessage}\n\n📍 ${description}\n\n${callToAction}\n\n🔗 ${url}`
      : `${baseMessage}\n\n${callToAction}\n\n🔗 ${url}`;
    
    switch (platform) {
      case 'x':
        return `${baseMessage} ${callToAction} ${url}`.substring(0, 280); // Twitter character limit
      case 'sms':
        return `${baseMessage} Join here: ${url}`.substring(0, 160); // SMS character limit
      case 'whatsapp':
        return `🎯 *${title}* - Live Event Invitation!\n\n${description ? `📋 ${description}\n\n` : ''}🌟 You're invited to join this amazing live streaming event!\n\n🎥 Experience real-time interaction and engagement\n\n🔗 Join now: ${url}`;
      case 'email':
        return fullMessage;
      default:
        return fullMessage;
    }
  };

  const createEmailData = () => {
    return {
      subject: `🎉 ${title} - Join this amazing event!`,
      body: `Hi!\n\nI wanted to share this exciting event with you:\n\n${title}\n\n${description || ''}\n\nClick here to learn more and join: ${url}\n\nHope to see you there!`
    };
  };

  const shareToUrl = (platformUrl: string) => {
    window.open(platformUrl, '_blank', 'noopener,noreferrer');
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({ 
        title: 'Link copied!', 
        description: 'The event link has been copied to your clipboard' 
      });
    } catch (error) {
      // Fallback for browsers without clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      toast({ 
        title: 'Link copied!', 
        description: 'The event link has been copied to your clipboard' 
      });
    }
  };

  const handlePlatformClick = async (platformId: string) => {
    try {
      switch (platformId) {
        case 'whatsapp':
          shareToUrl(`https://wa.me/?text=${encodeURIComponent(createShareMessage('whatsapp'))}`);
          toast({ 
            title: 'WhatsApp opened!', 
            description: 'Share the event with your WhatsApp contacts' 
          });
          break;
        
        case 'facebook':
          shareToUrl(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`);
          toast({ 
            title: 'Facebook opened!', 
            description: 'Share the event on your Facebook timeline' 
          });
          break;
        
        case 'instagram':
          await copyToClipboard(url);
          toast({ 
            title: 'Link copied for Instagram!', 
            description: 'Paste the link in your Instagram story or bio' 
          });
          break;
        
        case 'x':
          shareToUrl(`https://twitter.com/intent/tweet?text=${encodeURIComponent(createShareMessage('x'))}`);
          toast({ 
            title: 'X (Twitter) opened!', 
            description: 'Share the event with your followers' 
          });
          break;
        
        case 'email':
          const emailData = createEmailData();
          shareToUrl(`mailto:?subject=${encodeURIComponent(emailData.subject)}&body=${encodeURIComponent(emailData.body)}`);
          toast({ 
            title: 'Email client opened!', 
            description: 'Send the event details via email' 
          });
          break;
        
        case 'sms':
          shareToUrl(`sms:?body=${encodeURIComponent(createShareMessage('sms'))}`);
          toast({ 
            title: 'SMS opened!', 
            description: 'Send the event details via text message' 
          });
          break;
        
        case 'youtube':
          await copyToClipboard(url);
          toast({ 
            title: 'Link copied for YouTube!', 
            description: 'Paste the link in your YouTube video description, community post, or comments' 
          });
          break;
        
        case 'copy':
          await copyToClipboard(prettyUrl || url);
          break;
        
        case 'copy-preview':
          await copyToClipboard(url);
          toast({
            title: 'Preview link copied!',
            description: 'Use this link to ensure social platforms show rich previews'
          });
          break;
        
        default:
          break;
      }
    } catch (error) {
      console.error(`Error sharing to ${platformId}:`, error);
      toast({ 
        title: 'Sharing failed', 
        description: 'Please try again or use a different platform',
        variant: 'destructive'
      });
    }
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
        <TooltipProvider>
          <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
            {platforms.map((platform) => {
              const Icon = platform.icon;
              
              return (
                <Tooltip key={platform.id}>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      className="flex items-center justify-center p-3 h-12 w-12"
                      onClick={() => handlePlatformClick(platform.id)}
                    >
                      <div className={`p-1 rounded ${platform.color}`}>
                        <Icon className="h-4 w-4 text-white" />
                      </div>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{platform.tooltip}</p>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </TooltipProvider>
      </CardContent>
    </Card>
  );
};

export default SocialShareMenu;