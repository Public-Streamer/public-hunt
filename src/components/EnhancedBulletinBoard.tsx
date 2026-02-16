import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { MessageSquare, Clock, User, Send, Flag, ShieldCheck, ThumbsUp, ThumbsDown, Smile, Settings, MoreVertical, Trash2, Eye, EyeOff } from 'lucide-react';
import TooltipWrapper from '@/components/ui/tooltip-wrapper';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { useAppContext } from '@/contexts/AppContext';

interface Message {
  id: string;
  content: string;
  user_id: string;
  user?: {
    id: string;
    display_name: string;
    avatar_url: string;
  };
  message_type: 'chat' | 'announcement' | 'moderation' | 'system';
  status: 'published' | 'flagged' | 'hidden' | 'deleted';
  moderation_status: 'pending' | 'approved' | 'rejected' | 'auto_approved';
  created_at: string;
  reactions: Array<{
    reaction_type: string;
    count: number;
  }>;
  is_highlighted: boolean;
}

interface ChatSettings {
  moderationEnabled: boolean;
  autoModerationThreshold: number;
  profanityFilterEnabled: boolean;
  messageDelaySeconds: number;
  maxMessageLength: number;
  allowAnonymousMessages: boolean;
  allowImages: boolean;
  allowLinks: boolean;
  slowModeEnabled: boolean;
  slowModeSeconds: number;
}

interface EnhancedBulletinBoardProps {
  eventId: string;
  userRole?: 'event_master' | 'channel_master' | 'viewer' | 'moderator';
}

const reactionTypes = ['👍', '👎', '❤️', '😂', '🎉'];

export const EnhancedBulletinBoard: React.FC<EnhancedBulletinBoardProps> = ({ eventId, userRole = 'viewer' }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [chatSettings, setChatSettings] = useState<ChatSettings | null>(null);
  const [activeTab, setActiveTab] = useState<'chat' | 'moderation'>('chat');
  const [moderationQueue, setModerationQueue] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { user: currentUser } = useAppContext();
  const { toast } = useToast();

  const canPost = userRole === 'event_master' || userRole === 'channel_master' || userRole === 'moderator' || userRole === 'viewer';
  const canModerate = userRole === 'event_master' || userRole === 'moderator';

  // Fetch messages and settings
  const fetchMessages = async () => {
    try {
      setLoading(true);
      setError('');

      const { data, error } = await supabase.functions.invoke('manage-event-messages', {
        body: {
          eventId,
          action: 'get_messages'
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      setMessages(data.messages || []);
      setChatSettings(data.chatSettings || null);

      // Fetch moderation queue if moderator
      if (canModerate) {
        fetchModerationQueue();
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
      setError(err instanceof Error ? err.message : 'Failed to load messages');
      toast({
        title: 'Error',
        description: 'Failed to load messages',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchModerationQueue = async () => {
    try {
      const { data, error } = await supabase
        .from('moderation_queue')
        .select(`
          *,
          event_messages:event_messages!inner(
            *,
            users:auth.users (id, display_name, avatar_url)
          )
        `)
        .eq('event_id', eventId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      setModerationQueue(data.map(item => ({
        id: item.event_messages.id,
        content: item.event_messages.content,
        user_id: item.event_messages.user_id,
        user: item.event_messages.users,
        message_type: item.event_messages.message_type,
        status: item.event_messages.status,
        moderation_status: item.event_messages.moderation_status,
        created_at: item.event_messages.created_at,
        reactions: [],
        is_highlighted: false
      })));
    } catch (err) {
      console.error('Error fetching moderation queue:', err);
      toast({
        title: 'Error',
        description: 'Failed to load moderation queue',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    if (eventId && currentUser) {
      fetchMessages();

      // Set up real-time subscription
      const channel = supabase
        .channel(`chat-${eventId}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'event_messages',
          filter: `event_id=eq.${eventId}`
        }, (payload) => {
          setMessages(prev => [payload.new, ...prev]);
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [eventId, currentUser]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !currentUser) return;

    try {
      const { data, error } = await supabase.functions.invoke('manage-event-messages', {
        body: {
          eventId,
          action: 'send',
          content: newMessage
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      setNewMessage('');
    } catch (err) {
      console.error('Error sending message:', err);
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to send message',
        variant: 'destructive',
      });
    }
  };

  const handleAddReaction = async (messageId: string, reactionType: string) => {
    try {
      const { error } = await supabase.functions.invoke('manage-event-messages', {
        body: {
          eventId,
          action: 'react',
          messageId,
          reactionType
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      // Refresh messages to get updated reactions
      fetchMessages();
    } catch (err) {
      console.error('Error adding reaction:', err);
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to add reaction',
        variant: 'destructive',
      });
    }
  };

  const handleModerateMessage = async (messageId: string, action: 'approve' | 'reject' | 'hide' | 'delete') => {
    try {
      const { error } = await supabase.functions.invoke('manage-event-messages', {
        body: {
          eventId,
          action: 'moderate',
          messageId,
          moderationAction: action,
          moderationNotes: `Action taken by ${currentUser?.id}`
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      toast({
        title: 'Success',
        description: `Message ${action}ed successfully`,
      });

      // Refresh messages and moderation queue
      fetchMessages();
      fetchModerationQueue();
    } catch (err) {
      console.error('Error moderating message:', err);
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to moderate message',
        variant: 'destructive',
      });
    }
  };

  const handleFlagMessage = async (messageId: string) => {
    try {
      const { error } = await supabase.functions.invoke('manage-event-messages', {
        body: {
          eventId,
          action: 'flag',
          messageId
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      toast({
        title: 'Success',
        description: 'Message flagged for moderation',
      });

      // Refresh messages
      fetchMessages();
    } catch (err) {
      console.error('Error flagging message:', err);
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to flag message',
        variant: 'destructive',
      });
    }
  };

  const getMessageStatusBadge = (status: string) => {
    switch (status) {
      case 'published': return <Badge variant="success">Published</Badge>;
      case 'flagged': return <Badge variant="warning">Flagged</Badge>;
      case 'hidden': return <Badge variant="secondary">Hidden</Badge>;
      case 'deleted': return <Badge variant="destructive">Deleted</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getUserRoleBadge = (role: string) => {
    switch (role) {
      case 'event_master': return <Badge className="bg-purple-100 text-purple-800">Host</Badge>;
      case 'channel_master': return <Badge className="bg-blue-100 text-blue-800">Admin</Badge>;
      case 'moderator': return <Badge className="bg-green-100 text-green-800">Mod</Badge>;
      default: return <Badge className="bg-gray-100 text-gray-800">User</Badge>;
    }
  };

  if (loading && messages.length === 0) {
    return (
      <Card className="h-full">
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading messages...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-6">
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center">
          <MessageSquare className="h-5 w-5 mr-2" />
          Event Chat
        </CardTitle>
        {canModerate && (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto">
            <TabsList>
              <TabsTrigger value="chat">Chat</TabsTrigger>
              <TabsTrigger value="moderation">Moderation</TabsTrigger>
            </TabsList>
          </Tabs>
        )}
      </CardHeader>

      <CardContent className="flex-1 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
          {activeTab === 'chat' ? (
            <>
              {messages.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No messages yet. Be the first to say something!</p>
                </div>
              ) : (
                messages.map((message) => (
                  <div key={message.id} className={`p-3 bg-white border rounded-lg ${message.status === 'deleted' ? 'opacity-50' : ''}`}>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-gray-500" />
                        <span className="font-medium text-sm">
                          {message.user?.display_name || message.user_id || 'Anonymous'}
                        </span>
                        {getUserRoleBadge(message.metadata?.userRole || 'viewer')}
                        {getMessageStatusBadge(message.status)}
                      </div>
                      <div className="flex items-center text-xs text-gray-500">
                        <Clock className="h-3 w-3 mr-1" />
                        {new Date(message.created_at).toLocaleTimeString()}
                      </div>
                    </div>

                    <p className="text-sm mb-2">{message.content}</p>

                    {message.status === 'published' && (
                      <div className="flex items-center space-x-4 text-xs">
                        <div className="flex space-x-1">
                          {reactionTypes.map((reaction) => {
                            const reactionCount = message.reactions.find(r => r.reaction_type === reaction)?.count || 0;
                            return (
                              <Button
                                key={reaction}
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2"
                                onClick={() => handleAddReaction(message.id, reaction)}
                              >
                                {reaction} {reactionCount > 0 && reactionCount}
                              </Button>
                            );
                          })}
                        </div>

                        {canModerate && (
                          <div className="flex space-x-1">
                            <TooltipWrapper content="Flag message">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 text-yellow-600"
                                onClick={() => handleFlagMessage(message.id)}
                              >
                                <Flag className="h-3 w-3" />
                              </Button>
                            </TooltipWrapper>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-6 px-2">
                                  <MoreVertical className="h-3 w-3" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-40 p-2">
                                <div className="space-y-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="w-full justify-start"
                                    onClick={() => handleModerateMessage(message.id, 'hide')}
                                  >
                                    <EyeOff className="h-3 w-3 mr-2" />
                                    Hide
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="w-full justify-start text-red-600"
                                    onClick={() => handleModerateMessage(message.id, 'delete')}
                                  >
                                    <Trash2 className="h-3 w-3 mr-2" />
                                    Delete
                                  </Button>
                                </div>
                              </PopoverContent>
                            </Popover>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </>
          ) : (
            <div className="space-y-4">
              <h3 className="font-semibold mb-4">Moderation Queue</h3>
              {moderationQueue.length === 0 ? (
                <p className="text-muted-foreground">No messages in moderation queue.</p>
              ) : (
                moderationQueue.map((message) => (
                  <div key={message.id} className="p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-yellow-600" />
                        <span className="font-medium text-sm">
                          {message.user?.display_name || message.user_id || 'Anonymous'}
                        </span>
                        <Badge variant="warning">Flagged</Badge>
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(message.created_at).toLocaleTimeString()}
                      </div>
                    </div>

                    <p className="text-sm mb-3">{message.content}</p>

                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleModerateMessage(message.id, 'approve')}
                      >
                        <ShieldCheck className="h-3 w-3 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 border-red-200"
                        onClick={() => handleModerateMessage(message.id, 'reject')}
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Reject
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {canPost && (
          <div className="mt-4 border-t pt-4">
            <div className="flex space-x-2 mb-2">
              <Textarea
                placeholder="Type your message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="flex-1 min-h-[60px]"
                disabled={!canPost}
                maxLength={chatSettings?.maxMessageLength || 500}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!newMessage.trim() || !canPost}
                className="self-end"
              >
                <Send className="h-4 w-4 mr-2" />
                Send
              </Button>
            </div>

            {chatSettings && (
              <div className="text-xs text-muted-foreground flex justify-between">
                <span>Max length: {chatSettings.maxMessageLength} characters</span>
                <span>{newMessage.length}/{chatSettings.maxMessageLength}</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EnhancedBulletinBoard;