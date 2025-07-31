import React, { useEffect, useState } from 'react';
import { Card } from './ui/card';
import { ScrollArea } from './ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Archive } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';

interface PreStreamChatArchiveProps {
  eventId: string;
}

interface ChatMessage {
  id: string;
  user_id: string | null;
  username: string;
  display_name: string;
  profile_picture_url: string | null;
  message: string;
  message_type: string;
  created_at: string;
}

export const PreStreamChatArchive: React.FC<PreStreamChatArchiveProps> = ({ eventId }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPreviousMessages = async () => {
      try {
        const { data, error } = await supabase
          .from('event_chat_messages')
          .select('*')
          .eq('event_id', eventId)
          .order('created_at', { ascending: true });

        if (error) {
          console.error('Error fetching previous messages:', error);
        } else {
          setMessages(data || []);
        }
      } catch (error) {
        console.error('Error fetching previous messages:', error);
      } finally {
        setLoading(false);
      }
    };

    if (eventId) {
      fetchPreviousMessages();
    }
  }, [eventId]);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Card className="w-full h-[600px] flex flex-col bg-card border border-border/30">
      <div className="p-4 border-b border-border/30 bg-muted/30">
        <div className="flex items-center gap-2">
          <Archive className="w-5 h-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold text-foreground">
            Previous Messages
          </h3>
          <span className="text-sm text-muted-foreground">
            ({messages.length} messages)
          </span>
        </div>
      </div>

      <ScrollArea className="flex-1 p-4">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="text-muted-foreground">Loading previous messages...</div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-32">
            <div className="text-center text-muted-foreground">
              <Archive className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No previous messages yet</p>
              <p className="text-sm">Be the first to share when the stream goes live!</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <div key={message.id} className="flex gap-3">
                <Avatar size="sm" className="shrink-0">
                  <AvatarImage 
                    src={message.profile_picture_url || undefined} 
                    alt={message.display_name} 
                  />
                  <AvatarFallback className="text-xs">
                    {getInitials(message.display_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-foreground text-sm">
                      {message.display_name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-sm text-foreground break-words">
                    {message.message}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </Card>
  );
};