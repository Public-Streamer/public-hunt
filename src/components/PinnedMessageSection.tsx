import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Pin, Edit3, Check, X, Plus, Trash2, ChevronUp, ChevronDown, GripVertical } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface PinnedMessage {
  id: string;
  content: string;
  order: number;
}

interface PinnedMessageSectionProps {
  eventId: string;
  isHost?: boolean;
}

export const PinnedMessageSection: React.FC<PinnedMessageSectionProps> = ({ 
  eventId, 
  isHost = false 
}) => {
  const [messages, setMessages] = useState<PinnedMessage[]>([]);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [tempContent, setTempContent] = useState('');
  const [newMessageContent, setNewMessageContent] = useState('');
  const [isAddingMessage, setIsAddingMessage] = useState(false);

  useEffect(() => {
    fetchPinnedMessages();
    
    // Set up real-time subscription for all users
    const channel = supabase
      .channel(`pinned-messages-${eventId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'events',
          filter: `id=eq.${eventId}`
        },
        (payload) => {
          console.log('Real-time pinned message update:', payload);
          // Only update if pinned_message actually changed
          if (payload.new && 'pinned_message' in payload.new) {
            console.log('Parsing pinned message data:', payload.new.pinned_message);
            parsePinnedMessages(payload.new.pinned_message);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventId]);

  const parsePinnedMessages = (pinnedMessageData: string | null) => {
    if (!pinnedMessageData) {
      setMessages([]);
      return;
    }

    try {
      const parsed = JSON.parse(pinnedMessageData);
      if (Array.isArray(parsed)) {
        setMessages(parsed.sort((a, b) => a.order - b.order));
      } else {
        // Handle legacy single message format
        setMessages([{ id: '1', content: pinnedMessageData, order: 0 }]);
      }
    } catch {
      // Handle legacy single message format
      setMessages([{ id: '1', content: pinnedMessageData, order: 0 }]);
    }
  };

  const fetchPinnedMessages = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('scoreboard-operations', {
        body: { action: 'fetchPinnedMessage', eventId }
      });

      if (error) throw error;
      console.log('Fetched pinned messages data:', data);
      setMessages(data?.messages || []);
    } catch (error) {
      console.error('Error fetching pinned messages:', error);
    }
  };

  const addMessage = async () => {
    if (!newMessageContent.trim()) return;

    try {
      const { error } = await supabase.functions.invoke('scoreboard-operations', {
        body: { 
          action: 'addPinnedMessage', 
          eventId, 
          pinnedMessage: newMessageContent.trim() 
        }
      });

      if (error) throw error;
      
      setNewMessageContent('');
      setIsAddingMessage(false);
      
      toast({
        title: "Success",
        description: "Message added",
      });
    } catch (error) {
      console.error('Error adding message:', error);
      toast({
        title: "Error",
        description: "Failed to add message",
        variant: "destructive",
      });
    }
  };

  const updateMessage = async (messageId: string, content: string) => {
    try {
      const { error } = await supabase.functions.invoke('scoreboard-operations', {
        body: { 
          action: 'updateSinglePinnedMessage', 
          eventId, 
          messageId,
          pinnedMessage: content 
        }
      });

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Message updated",
      });
    } catch (error) {
      console.error('Error updating message:', error);
      toast({
        title: "Error",
        description: "Failed to update message",
        variant: "destructive",
      });
    }
  };

  const deleteMessage = async (messageId: string) => {
    try {
      const { error } = await supabase.functions.invoke('scoreboard-operations', {
        body: { 
          action: 'deletePinnedMessage', 
          eventId, 
          messageId 
        }
      });

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Message deleted",
      });
    } catch (error) {
      console.error('Error deleting message:', error);
      toast({
        title: "Error",
        description: "Failed to delete message",
        variant: "destructive",
      });
    }
  };

  const reorderMessage = async (messageId: string, direction: 'up' | 'down') => {
    const currentIndex = messages.findIndex(msg => msg.id === messageId);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= messages.length) return;

    const reorderedMessages = [...messages];
    const [movedMessage] = reorderedMessages.splice(currentIndex, 1);
    reorderedMessages.splice(newIndex, 0, movedMessage);

    // Update order property
    const updatedMessages = reorderedMessages.map((msg, index) => ({
      ...msg,
      order: index
    }));

    try {
      const { error } = await supabase.functions.invoke('scoreboard-operations', {
        body: { 
          action: 'reorderPinnedMessages', 
          eventId, 
          newOrder: updatedMessages 
        }
      });

      if (error) throw error;
      
      // Optimistically update local state
      setMessages(updatedMessages);
    } catch (error) {
      console.error('Error reordering messages:', error);
      toast({
        title: "Error",
        description: "Failed to reorder messages",
        variant: "destructive",
      });
    }
  };

  const startEditingMessage = (messageId: string, content: string) => {
    setTempContent(content);
    setEditingMessageId(messageId);
  };

  const saveMessage = (messageId: string) => {
    updateMessage(messageId, tempContent);
    setEditingMessageId(null);
    setTempContent('');
  };

  const cancelEditing = () => {
    setEditingMessageId(null);
    setTempContent('');
  };

  const cancelAdding = () => {
    setIsAddingMessage(false);
    setNewMessageContent('');
  };

  // Don't render if no messages and user is not a host
  if (messages.length === 0 && !isHost) {
    return null;
  }

  return (
    <Card className='border-none shadow-none hover:shadow-none'>
      <CardContent className="p-3">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-center gap-3">
            <Pin className="h-5 w-5 text-primary flex-shrink-0" />
            <span className="text-lg font-medium">
              {messages.length === 0 ? 'Pinned Messages (v2.0)' : `Pinned Messages (${messages.length}) (v2.0)`}
            </span>
            {isHost && (
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => setIsAddingMessage(true)}
                className="ml-auto"
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Message
              </Button>
            )}
          </div>

          {/* Add new message form */}
          {isAddingMessage && (
            <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
              <Input
                value={newMessageContent}
                onChange={(e) => setNewMessageContent(e.target.value)}
                placeholder="Enter new pinned message..."
                className="flex-1"
                onKeyPress={(e) => e.key === 'Enter' && addMessage()}
              />
              <Button size="sm" variant="outline" onClick={addMessage}>
                <Check className="h-3 w-3" />
              </Button>
              <Button size="sm" variant="outline" onClick={cancelAdding}>
                <X className="h-3 w-3" />
              </Button>
            </div>
          )}

          {/* Messages list */}
          {messages.length > 0 && (
            <div className="space-y-2">
              {messages.map((message, index) => (
                <div key={message.id} className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
                  {/* Drag handle for visual indication */}
                  {isHost && messages.length > 1 && (
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                  )}
                  
                  {/* Message content */}
                  <div className="flex-1">
                    {editingMessageId === message.id ? (
                      <Input
                        value={tempContent}
                        onChange={(e) => setTempContent(e.target.value)}
                        className="w-full"
                        onKeyPress={(e) => e.key === 'Enter' && saveMessage(message.id)}
                      />
                    ) : (
                      <span className="text-sm font-medium">{message.content}</span>
                    )}
                  </div>

                  {/* Controls */}
                  {isHost && (
                    <div className="flex items-center gap-1">
                      {editingMessageId === message.id ? (
                        <>
                          <Button size="sm" variant="outline" onClick={() => saveMessage(message.id)}>
                            <Check className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={cancelEditing}>
                            <X className="h-3 w-3" />
                          </Button>
                        </>
                      ) : (
                        <>
                          {/* Reorder buttons */}
                          {messages.length > 1 && (
                            <>
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                onClick={() => reorderMessage(message.id, 'up')}
                                disabled={index === 0}
                                className="h-6 w-6 p-0"
                              >
                                <ChevronUp className="h-3 w-3" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                onClick={() => reorderMessage(message.id, 'down')}
                                disabled={index === messages.length - 1}
                                className="h-6 w-6 p-0"
                              >
                                <ChevronDown className="h-3 w-3" />
                              </Button>
                            </>
                          )}
                          
                          {/* Edit button */}
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => startEditingMessage(message.id, message.content)}
                            className="h-6 w-6 p-0"
                          >
                            <Edit3 className="h-3 w-3" />
                          </Button>
                          
                          {/* Delete button */}
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => deleteMessage(message.id)}
                            className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Empty state for hosts */}
          {messages.length === 0 && isHost && !isAddingMessage && (
            <div className="text-center py-4">
              <span className="text-sm text-muted-foreground italic">
                No pinned messages yet. Click "Add Message" to create one.
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};