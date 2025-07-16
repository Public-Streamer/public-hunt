import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Share2, Facebook, Instagram, MessageCircle, Mail, Phone, Copy, Twitter } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SocialShareMenuProps {
  title: string;
  url: string;
  description?: string;
}

const SocialShareMenu: React.FC<SocialShareMenuProps> = ({ title, url, description }) => {
  const { toast } = useToast();

  const platforms = [
    { id: 'whatsapp', name: 'WhatsApp', icon: MessageCircle, color: 'bg-green-500', tooltip: 'Share on WhatsApp - Instant messaging' },
    { id: 'facebook', name: 'Facebook', icon: Facebook, color: 'bg-blue-600', tooltip: 'Share on Facebook - Reach friends and family' },
    { id: 'instagram', name: 'Instagram', icon: Instagram, color: 'bg-pink-600', tooltip: 'Copy link for Instagram sharing' },
    { id: 'x', name: 'X (Twitter)', icon: Twitter, color: 'bg-gray-900', tooltip: 'Share on X - Quick updates and news' },
    { id: 'email', name: 'Email', icon: Mail, color: 'bg-blue-500', tooltip: 'Share via email - Direct personal sharing' },
    { id: 'sms', name: 'SMS', icon: Phone, color: 'bg-green-600', tooltip: 'Share via SMS - Text messaging' },
    { id: 'copy', name: 'Copy Link', icon: Copy, color: 'bg-gray-600', tooltip: 'Copy link to clipboard' }
  ];

  const createShareMessage = (platform: string): string => {
    const baseMessage = `🎉 Check out this amazing event: ${title}`;
    const fullMessage = description 
      ? `${baseMessage}\n\n${description}\n\n🔗 ${url}`
      : `${baseMessage}\n\n🔗 ${url}`;
    
    switch (platform) {
      case 'x':
        return `${baseMessage} ${url}`.substring(0, 280); // Twitter character limit
      case 'sms':
        return `${baseMessage} ${url}`.substring(0, 160); // SMS character limit
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
        
        case 'copy':
          await copyToClipboard(url);
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {platforms.map((platform) => {
            const Icon = platform.icon;
            
            return (
              <Button
                key={platform.id}
                variant="outline"
                className="flex items-center space-x-2 p-3 h-auto justify-start"
                onClick={() => handlePlatformClick(platform.id)}
                title={platform.tooltip}
              >
                <div className={`p-1 rounded ${platform.color}`}>
                  <Icon className="h-4 w-4 text-white" />
                </div>
                <span className="text-sm font-medium">{platform.name}</span>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default SocialShareMenu;