import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Share2, MessageCircle, Facebook, Copy, Check, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

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
      name: 'Facebook',
      icon: Facebook,
      color: 'bg-blue-600',
      action: () => {
        const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(stageUrl)}&quote=${encodeURIComponent(shareMessage)}`;
        window.open(facebookUrl, '_blank');
        toast.success('Facebook share dialog opened');
      }
    },
    {
      id: 'copy',
      name: 'Copy Link',
      icon: copiedStates['copy'] ? Check : Copy,
      color: copiedStates['copy'] ? 'bg-green-600' : 'bg-gray-600',
      action: () => {
        navigator.clipboard.writeText(stageUrl).then(() => {
          setCopiedStates(prev => ({ ...prev, copy: true }));
          toast.success('Stage link copied to clipboard');
          setTimeout(() => {
            setCopiedStates(prev => ({ ...prev, copy: false }));
          }, 2000);
        }).catch(() => {
          // Fallback for older browsers
          const textArea = document.createElement('textarea');
          textArea.value = stageUrl;
          document.body.appendChild(textArea);
          textArea.select();
          document.execCommand('copy');
          document.body.removeChild(textArea);
          
          setCopiedStates(prev => ({ ...prev, copy: true }));
          toast.success('Stage link copied to clipboard');
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
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Share2 className="h-4 w-4" />
          Invite Other Streamers
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Share this stage link to invite other streamers to join your event:
          </p>
          <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
            <ExternalLink className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-mono truncate flex-1">{stageUrl}</span>
          </div>
        </div>

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
            <span>Only you can see this sharing panel</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StageShareMenu;