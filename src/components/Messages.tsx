import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  Search, Send, MessageCircle, MoreHorizontal, Users, Check, CheckCheck, 
  Plus, ArrowLeft, Reply, Forward, Trash2, Archive, Star, X
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { useAppContext } from '@/contexts/AppContext';
import ChannelApprovalMessage from '@/components/ChannelApprovalMessage';

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
  type?: 'text' | 'channel_approval_request';
  approval_request?: {
    request_id: string;
    event_name: string;
    event_description: string;
    channel_name: string;
    status: 'pending' | 'approved' | 'rejected';
  };
  sender_profile: {
    id: string;
    display_name: string;
    username: string;
    profile_picture_url: string;
  };
  receiver_profile: {
    id: string;
    display_name: string;
    username: string;
    profile_picture_url: string;
  };
}

interface Conversation {
  user_id: string;
  user_profile: {
    id: string;
    display_name: string;
    username: string;
    profile_picture_url: string;
  };
  last_message: string;
  last_message_time: string;
  unread_count: number;
  is_online: boolean;
}

interface MessagesProps {
  userId: string;
}

const Messages: React.FC<MessagesProps> = ({ userId }) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewMessage, setShowNewMessage] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [approvalRequests, setApprovalRequests] = useState<any[]>([]);
  const { toast } = useToast();
  const { user } = useAppContext();

  useEffect(() => {
    fetchConversations();
    fetchApprovalRequests();
  }, [userId]);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation);
    }
  }, [selectedConversation]);

  const fetchApprovalRequests = async () => {
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) return;

      // Get approval requests for channels the user is master/admin of
      const { data: requests, error } = await supabase
        .from('event_channel_requests')
        .select(`
          *,
          events!inner (
            name,
            description,
            created_by
          ),
          channels!inner (
            name,
            user_id
          )
        `)
        .eq('status', 'pending')
        .or(`channels.user_id.eq.${userData.user.id},channel_id.in.(select channel_id from channel_permissions where user_id = ${userData.user.id} and role in ('channel_master','channel_admin'))`);

      if (error) throw error;
      setApprovalRequests(requests || []);
    } catch (error) {
      console.error('Error fetching approval requests:', error);
    }
  };

  const fetchConversations = async () => {
    try {
      // Mock conversations data - in real app, this would include approval requests
      const mockConversations: Conversation[] = [
        {
          user_id: 'user-1',
          user_profile: {
            id: 'user-1',
            display_name: 'Sarah Johnson',
            username: 'sarah_j',
            profile_picture_url: '/placeholder.svg'
          },
          last_message: 'Hey! How are you doing?',
          last_message_time: new Date(Date.now() - 3600000).toISOString(),
          unread_count: 2,
          is_online: true
        },
        {
          user_id: 'user-2',
          user_profile: {
            id: 'user-2',
            display_name: 'Mike Chen',
            username: 'mike_chen',
            profile_picture_url: '/placeholder.svg'
          },
          last_message: 'Thanks for the great event!',
          last_message_time: new Date(Date.now() - 7200000).toISOString(),
          unread_count: 0,
          is_online: false
        },
        {
          user_id: 'user-3',
          user_profile: {
            id: 'user-3',
            display_name: 'Emma Wilson',
            username: 'emma_w',
            profile_picture_url: '/placeholder.svg'
          },
          last_message: 'Looking forward to your next stream!',
          last_message_time: new Date(Date.now() - 14400000).toISOString(),
          unread_count: 1,
          is_online: true
        }
      ];
      // Add approval requests as special conversations
      if (approvalRequests.length > 0) {
        const approvalConversations: Conversation[] = approvalRequests.map(request => ({
          user_id: `approval-${request.id}`,
          user_profile: {
            id: request.requested_by,
            display_name: 'Channel Assignment Request',
            username: 'system',
            profile_picture_url: '/placeholder.svg'
          },
          last_message: `New event "${(request.events as any).name}" requesting channel assignment`,
          last_message_time: request.requested_at,
          unread_count: 1,
          is_online: false
        }));
        mockConversations.unshift(...approvalConversations);
      }

      setConversations(mockConversations);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      toast({
        title: 'Error',
        description: 'Failed to load conversations',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationUserId: string) => {
    try {
      // Check if this is an approval request conversation
      if (conversationUserId.startsWith('approval-')) {
        const requestId = conversationUserId.replace('approval-', '');
        const request = approvalRequests.find(r => r.id === requestId);
        if (request) {
          const approvalMessage: Message = {
            id: `approval-${request.id}`,
            sender_id: 'system',
            receiver_id: userId,
            content: `Event "${(request.events as any).name}" is requesting assignment to channel "${(request.channels as any).name}"`,
            is_read: false,
            created_at: request.requested_at,
            type: 'channel_approval_request',
            approval_request: {
              request_id: request.id,
              event_name: (request.events as any).name,
              event_description: (request.events as any).description,
              channel_name: (request.channels as any).name,
              status: request.status
            },
            sender_profile: {
              id: 'system',
              display_name: 'System',
              username: 'system',
              profile_picture_url: '/placeholder.svg'
            },
            receiver_profile: {
              id: userId,
              display_name: 'You',
              username: 'you',
              profile_picture_url: '/placeholder.svg'
            }
          };
          setMessages([approvalMessage]);
          return;
        }
      }

      // Mock messages data
      const mockMessages: Message[] = [
        {
          id: '1',
          sender_id: conversationUserId,
          receiver_id: userId,
          content: 'Hey! How are you doing?',
          is_read: false,
          created_at: new Date(Date.now() - 3600000).toISOString(),
          sender_profile: {
            id: conversationUserId,
            display_name: 'Sarah Johnson',
            username: 'sarah_j',
            profile_picture_url: '/placeholder.svg'
          },
          receiver_profile: {
            id: userId,
            display_name: 'You',
            username: 'you',
            profile_picture_url: '/placeholder.svg'
          }
        },
        {
          id: '2',
          sender_id: userId,
          receiver_id: conversationUserId,
          content: 'Hi Sarah! I\'m doing great, thanks for asking!',
          is_read: true,
          created_at: new Date(Date.now() - 3000000).toISOString(),
          sender_profile: {
            id: userId,
            display_name: 'You',
            username: 'you',
            profile_picture_url: '/placeholder.svg'
          },
          receiver_profile: {
            id: conversationUserId,
            display_name: 'Sarah Johnson',
            username: 'sarah_j',
            profile_picture_url: '/placeholder.svg'
          }
        },
        {
          id: '3',
          sender_id: conversationUserId,
          receiver_id: userId,
          content: 'That\'s wonderful! I really enjoyed your last event.',
          is_read: false,
          created_at: new Date(Date.now() - 1800000).toISOString(),
          sender_profile: {
            id: conversationUserId,
            display_name: 'Sarah Johnson',
            username: 'sarah_j',
            profile_picture_url: '/placeholder.svg'
          },
          receiver_profile: {
            id: userId,
            display_name: 'You',
            username: 'you',
            profile_picture_url: '/placeholder.svg'
          }
        }
      ];
      setMessages(mockMessages);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast({
        title: 'Error',
        description: 'Failed to load messages',
        variant: 'destructive'
      });
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      const newMsg: Message = {
        id: Date.now().toString(),
        sender_id: userId,
        receiver_id: selectedConversation,
        content: newMessage,
        is_read: false,
        created_at: new Date().toISOString(),
        sender_profile: {
          id: userId,
          display_name: 'You',
          username: 'you',
          profile_picture_url: '/placeholder.svg'
        },
        receiver_profile: {
          id: selectedConversation,
          display_name: 'Recipient',
          username: 'recipient',
          profile_picture_url: '/placeholder.svg'
        }
      };

      setMessages(prev => [...prev, newMsg]);
      setNewMessage('');
      
      // Update conversation last message
      setConversations(prev => prev.map(conv => 
        conv.user_id === selectedConversation 
          ? { ...conv, last_message: newMessage, last_message_time: new Date().toISOString() }
          : conv
      ));

      toast({
        title: 'Message sent',
        description: 'Your message has been sent successfully'
      });
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive'
      });
    }
  };

  const searchUsers = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    // Mock user search results
    const mockResults = [
      {
        id: 'user-4',
        display_name: 'John Doe',
        username: 'john_doe',
        profile_picture_url: '/placeholder.svg'
      },
      {
        id: 'user-5',
        display_name: 'Jane Smith',
        username: 'jane_smith',
        profile_picture_url: '/placeholder.svg'
      }
    ];
    setSearchResults(mockResults.filter(user => 
      user.display_name.toLowerCase().includes(query.toLowerCase()) ||
      user.username.toLowerCase().includes(query.toLowerCase())
    ));
  };

  const startNewConversation = (user: any) => {
    setSelectedConversation(user.id);
    setShowNewMessage(false);
    setUserSearch('');
    setSearchResults([]);
  };

  const filteredConversations = conversations.filter(conv =>
    conv.user_profile.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.user_profile.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedConversationData = conversations.find(c => c.user_id === selectedConversation);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Loading messages...</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
        {/* Conversations List */}
        <div className="lg:col-span-1">
          <Card className="h-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5" />
                  Messages
                </CardTitle>
                <Dialog open={showNewMessage} onOpenChange={setShowNewMessage}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Start New Conversation</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="relative">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search for users..."
                          value={userSearch}
                          onChange={(e) => {
                            setUserSearch(e.target.value);
                            searchUsers(e.target.value);
                          }}
                          className="pl-10"
                        />
                      </div>
                      <ScrollArea className="h-[200px]">
                        <div className="space-y-2">
                          {searchResults.map((user) => (
                            <div
                              key={user.id}
                              className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted cursor-pointer"
                              onClick={() => startNewConversation(user)}
                            >
                              <Avatar className="w-8 h-8">
                                <AvatarImage src={user.profile_picture_url} />
                                <AvatarFallback>{user.display_name[0]}</AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">{user.display_name}</div>
                                <div className="text-sm text-muted-foreground">@{user.username}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search conversations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[400px]">
                <div className="space-y-2 p-4">
                  {filteredConversations.map((conv) => (
                    <div
                      key={conv.user_id}
                      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedConversation === conv.user_id ? 'bg-primary/10' : 'hover:bg-muted'
                      }`}
                      onClick={() => setSelectedConversation(conv.user_id)}
                    >
                      <div className="relative">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={conv.user_profile.profile_picture_url} />
                          <AvatarFallback>{conv.user_profile.display_name[0]}</AvatarFallback>
                        </Avatar>
                        {conv.is_online && (
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-background"></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-medium truncate">{conv.user_profile.display_name}</p>
                          <span className="text-xs text-muted-foreground">
                            {new Date(conv.last_message_time).toLocaleTimeString([], { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-muted-foreground truncate">{conv.last_message}</p>
                          {conv.unread_count > 0 && (
                            <Badge variant="destructive" className="ml-2 px-2 py-1 text-xs">
                              {conv.unread_count}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Messages Area */}
        <div className="lg:col-span-2">
          <Card className="h-full">
            {selectedConversation ? (
              <>
                <CardHeader className="border-b">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={selectedConversationData?.user_profile.profile_picture_url} />
                      <AvatarFallback>{selectedConversationData?.user_profile.display_name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="font-semibold">{selectedConversationData?.user_profile.display_name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {selectedConversationData?.is_online ? 'Online' : 'Offline'}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="rounded-full w-8 h-8 p-0"
                        onClick={() => setSelectedConversation(null)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                      
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="rounded-full w-8 h-8 p-0 bg-primary/10"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-56">
                          <div className="grid gap-1">
                            <Button variant="ghost" size="sm" className="justify-start">
                              <Star className="w-4 h-4 mr-2" />
                              Add to Favorites
                            </Button>
                            <Button variant="ghost" size="sm" className="justify-start">
                              <Archive className="w-4 h-4 mr-2" />
                              Archive Chat
                            </Button>
                            <Button variant="ghost" size="sm" className="justify-start">
                              <Trash2 className="w-4 h-4 mr-2 text-destructive" />
                              Delete Chat
                            </Button>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0 flex flex-col h-[500px]">
                  <ScrollArea className="flex-1 p-4">
                    <div className="space-y-4">
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex gap-3 ${message.sender_id === userId ? 'justify-end' : 'justify-start'}`}
                        >
                          {message.type === 'channel_approval_request' && message.approval_request ? (
                            <div className="w-full flex justify-center">
                              <ChannelApprovalMessage
                                requestId={message.approval_request.request_id}
                                eventName={message.approval_request.event_name}
                                eventDescription={message.approval_request.event_description}
                                channelName={message.approval_request.channel_name}
                                requestedBy={message.sender_id}
                                requestedByName={message.sender_profile.display_name}
                                requestedAt={message.created_at}
                                status={message.approval_request.status}
                                onStatusChange={(newStatus) => {
                                  // Update the message status
                                  setMessages(prev => prev.map(msg => 
                                    msg.id === message.id && msg.approval_request
                                      ? { ...msg, approval_request: { ...msg.approval_request, status: newStatus } }
                                      : msg
                                  ));
                                  // Refresh approval requests
                                  fetchApprovalRequests();
                                }}
                              />
                            </div>
                          ) : (
                            <>
                              {message.sender_id !== userId && (
                                <Avatar className="w-8 h-8">
                                  <AvatarImage src={message.sender_profile.profile_picture_url} />
                                  <AvatarFallback>{message.sender_profile.display_name[0]}</AvatarFallback>
                                </Avatar>
                              )}
                              <div className={`max-w-[70%] ${message.sender_id === userId ? 'order-first' : ''}`}>
                                <div
                                  className={`p-3 rounded-lg ${
                                    message.sender_id === userId
                                      ? 'bg-primary text-primary-foreground'
                                      : 'bg-muted'
                                  }`}
                                >
                                  <p className="text-sm">{message.content}</p>
                                </div>
                                <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                  <span>
                                    {new Date(message.created_at).toLocaleTimeString([], { 
                                      hour: '2-digit', 
                                      minute: '2-digit' 
                                    })}
                                  </span>
                                  {message.sender_id === userId && (
                                    <div className="flex items-center">
                                      {message.is_read ? (
                                        <CheckCheck className="w-3 h-3 text-primary" />
                                      ) : (
                                        <Check className="w-3 h-3" />
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                  <div className="p-4 border-t">
                    <div className="flex gap-2">
                      <Textarea
                        placeholder="Type your message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        className="flex-1 min-h-[60px] max-h-[120px]"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                      />
                      <Button onClick={handleSendMessage} className="self-end">
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </>
            ) : (
              <CardContent className="flex items-center justify-center h-full">
                <div className="text-center">
                  <MessageCircle className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No conversation selected</h3>
                  <p className="text-muted-foreground">Select a conversation to start messaging</p>
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Messages;