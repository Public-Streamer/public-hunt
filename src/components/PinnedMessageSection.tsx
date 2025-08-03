import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Pin, Edit3, Check, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface PinnedMessageSectionProps {
  eventId: string;
  isHost?: boolean;
}

export const PinnedMessageSection: React.FC<PinnedMessageSectionProps> = ({ 
  eventId, 
  isHost = false 
}) => {
  const [pinnedMessage, setPinnedMessage] = useState('');
  const [editingPinnedMessage, setEditingPinnedMessage] = useState(false);
  const [tempPinnedMessage, setTempPinnedMessage] = useState('');

  useEffect(() => {
    fetchPinnedMessage();
    
    // Set up real-time subscription for all users (not just hosts)
    const channel = supabase
      .channel(`pinned-message-${eventId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'events',
          filter: `id=eq.${eventId}`
        },
        (payload) => {
          // Only update if pinned_message actually changed
          if (payload.new && 'pinned_message' in payload.new) {
            setPinnedMessage(payload.new.pinned_message || '');
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventId]);

  const fetchPinnedMessage = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('scoreboard-operations', {
        body: { action: 'fetchPinnedMessage', eventId }
      });

      if (error) throw error;
      setPinnedMessage(data?.pinned_message || '');
    } catch (error) {
      console.error('Error fetching pinned message:', error);
    }
  };

  const updatePinnedMessage = async (message: string) => {
    try {
      const { error } = await supabase.functions.invoke('scoreboard-operations', {
        body: { action: 'updatePinnedMessage', eventId, pinnedMessage: message }
      });

      if (error) throw error;
      setPinnedMessage(message);
      toast({
        title: "Success",
        description: "Pinned message updated",
      });
    } catch (error) {
      console.error('Error updating pinned message:', error);
      toast({
        title: "Error",
        description: "Failed to update pinned message",
        variant: "destructive",
      });
    }
  };

  const startEditingPinnedMessage = () => {
    setTempPinnedMessage(pinnedMessage);
    setEditingPinnedMessage(true);
  };

  const savePinnedMessage = () => {
    updatePinnedMessage(tempPinnedMessage);
    setEditingPinnedMessage(false);
  };

  const cancelEditingPinnedMessage = () => {
    setTempPinnedMessage('');
    setEditingPinnedMessage(false);
  };

  // Don't render if no pinned message and user is not a host
  if (!pinnedMessage && !isHost) {
    return null;
  }

  return (
    <Card className='border-none shadow-none hover:shadow-none '>
      <CardContent className="p-3 ">
        <div className="flex items-center gap-3">
          <Pin className="h-5 w-5 text-primary flex-shrink-0" />
          {editingPinnedMessage ? (
            <div className="flex items-center gap-2 flex-1">
              <Input
                value={tempPinnedMessage}
                onChange={(e) => setTempPinnedMessage(e.target.value)}
                placeholder="Enter pinned message..."
                className="flex-1"
                onKeyPress={(e) => e.key === 'Enter' && savePinnedMessage()}
              />
              <Button size="sm" variant="outline" onClick={savePinnedMessage}>
                <Check className="h-3 w-3" />
              </Button>
              <Button size="sm" variant="outline" onClick={cancelEditingPinnedMessage}>
                <X className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2 flex-1">
              {pinnedMessage ? (
                <span className="text-lg font-medium ">{pinnedMessage}</span>
              ) : isHost ? (
                <span className="text-lg text-muted-foreground italic">Click to add a pinned message</span>
              ) : null}
              {isHost && (
                <Button size="sm" variant="ghost" onClick={startEditingPinnedMessage} className="ml-auto">
                  <Edit3 className="h-3 w-3" />
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};