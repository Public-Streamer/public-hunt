import React, { useState, useEffect } from 'react';
import {
  Bell,
  Heart,
  MessageCircle,
  UserPlus,
  Calendar,
  Play,
  Users,
  Check,
  Settings,
  Filter,
  MoreHorizontal,
  X,
  Star,
  Eye,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { useAppContext } from '@/contexts/AppContext';

interface Notification {
  id: string;
  type: 'like' | 'comment' | 'tag' | 'follow' | 'event' | 'channel' | 'message';
  title: string;
  content: string;
  related_id?: string;
  related_type?: string;
  is_read: boolean;
  created_at: string;
  user_profile?: {
    id: string;
    display_name: string;
    username: string;
    profile_picture_url: string;
  };
  metadata?: {
    event_name?: string;
    channel_name?: string;
    post_content?: string;
    comment_content?: string;
  };
}

interface NotificationsProps {
  userId: string;
}

const Notifications: React.FC<NotificationsProps> = ({ userId }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<
    'all' | 'unread' | 'mentions' | 'events'
  >('all');
  const { toast } = useToast();
  const { user } = useAppContext();

  useEffect(() => {
    fetchNotifications();
  }, [userId]);

  const fetchNotifications = async () => {
    try {
      // Mock notifications data
      const mockNotifications: Notification[] = [
        {
          id: '1',
          type: 'like',
          title: 'New like on your post',
          content: 'Sarah Johnson liked your post',
          is_read: false,
          created_at: new Date(Date.now() - 3600000).toISOString(),
          user_profile: {
            id: 'user-1',
            display_name: 'Sarah Johnson',
            username: 'sarah_j',
            profile_picture_url: '/placeholder.svg',
          },
          metadata: {
            post_content: 'Just finished an amazing livestream session!',
          },
        },
        {
          id: '2',
          type: 'comment',
          title: 'New comment on your post',
          content: 'Mike Chen commented on your post',
          is_read: false,
          created_at: new Date(Date.now() - 7200000).toISOString(),
          user_profile: {
            id: 'user-2',
            display_name: 'Mike Chen',
            username: 'mike_chen',
            profile_picture_url: '/placeholder.svg',
          },
          metadata: {
            comment_content: 'Amazing content! Keep up the great work!',
          },
        },
        {
          id: '3',
          type: 'tag',
          title: 'You were tagged in a post',
          content: 'Emma Wilson tagged you in a post',
          is_read: false,
          created_at: new Date(Date.now() - 14400000).toISOString(),
          user_profile: {
            id: 'user-3',
            display_name: 'Emma Wilson',
            username: 'emma_w',
            profile_picture_url: '/placeholder.svg',
          },
          metadata: {
            post_content: 'Had an amazing time at the event with @you!',
          },
        },
        {
          id: '4',
          type: 'follow',
          title: 'New follower',
          content: 'John Doe started following you',
          is_read: true,
          created_at: new Date(Date.now() - 86400000).toISOString(),
          user_profile: {
            id: 'user-4',
            display_name: 'John Doe',
            username: 'john_doe',
            profile_picture_url: '/placeholder.svg',
          },
        },
        {
          id: '5',
          type: 'event',
          title: 'Event reminder',
          content: 'Your event "Content Creation Workshop" starts in 1 hour',
          is_read: true,
          created_at: new Date(Date.now() - 172800000).toISOString(),
          metadata: {
            event_name: 'Content Creation Workshop',
          },
        },
        {
          id: '6',
          type: 'channel',
          title: 'New subscriber',
          content: 'Jane Smith subscribed to your channel',
          is_read: true,
          created_at: new Date(Date.now() - 259200000).toISOString(),
          user_profile: {
            id: 'user-5',
            display_name: 'Jane Smith',
            username: 'jane_smith',
            profile_picture_url: '/placeholder.svg',
          },
          metadata: {
            channel_name: 'Tech Reviews',
          },
        },
        {
          id: '7',
          type: 'message',
          title: 'New message',
          content: 'Alex Brown sent you a message',
          is_read: false,
          created_at: new Date(Date.now() - 300000).toISOString(),
          user_profile: {
            id: 'user-6',
            display_name: 'Alex Brown',
            username: 'alex_brown',
            profile_picture_url: '/placeholder.svg',
          },
        },
      ];

      setNotifications(mockNotifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast({
        title: 'Error',
        description: 'Failed to load notifications',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      setNotifications((prev) =>
        prev.map((notif) =>
          notif.id === notificationId ? { ...notif, is_read: true } : notif
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      setNotifications((prev) =>
        prev.map((notif) => ({ ...notif, is_read: true }))
      );
      toast({
        title: 'Success',
        description: 'All notifications marked as read',
      });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      toast({
        title: 'Error',
        description: 'Failed to mark notifications as read',
        variant: 'destructive',
      });
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      setNotifications((prev) =>
        prev.filter((notif) => notif.id !== notificationId)
      );
      toast({
        title: 'Success',
        description: 'Notification deleted',
      });
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete notification',
        variant: 'destructive',
      });
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like':
        return <Heart className="w-4 h-4 text-red-500" />;
      case 'comment':
        return <MessageCircle className="w-4 h-4 text-blue-500" />;
      case 'tag':
        return <Users className="w-4 h-4 text-purple-500" />;
      case 'follow':
        return <UserPlus className="w-4 h-4 text-green-500" />;
      case 'event':
        return <Calendar className="w-4 h-4 text-orange-500" />;
      case 'channel':
        return <Play className="w-4 h-4 text-pink-500" />;
      case 'message':
        return <MessageCircle className="w-4 h-4 text-blue-500" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  const getFilteredNotifications = () => {
    switch (filter) {
      case 'unread':
        return notifications.filter((n) => !n.is_read);
      case 'mentions':
        return notifications.filter(
          (n) => n.type === 'tag' || n.type === 'comment'
        );
      case 'events':
        return notifications.filter(
          (n) => n.type === 'event' || n.type === 'channel'
        );
      default:
        return notifications;
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Loading notifications...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notifications
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {unreadCount}
                </Badge>
              )}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={markAllAsRead}
                disabled={unreadCount === 0}
              >
                <Check className="w-4 h-4 mr-1" />
                Mark all read
              </Button>
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs
            value={filter}
            onValueChange={(value) => setFilter(value as any)}
          >
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="unread">
                Unread
                {unreadCount > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {unreadCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="mentions">Mentions</TabsTrigger>
              <TabsTrigger value="events">Events</TabsTrigger>
            </TabsList>

            <TabsContent value={filter} className="mt-4">
              <ScrollArea className="h-[600px]">
                <div className="space-y-3">
                  {getFilteredNotifications().map((notification) => (
                    <div
                      key={notification.id}
                      className={`flex items-start gap-3 p-4 rounded-lg border transition-colors ${
                        !notification.is_read
                          ? 'bg-primary/5 border-primary/20'
                          : 'bg-background hover:bg-muted/50'
                      }`}
                    >
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3 flex-1">
                            {notification.user_profile && (
                              <Avatar className="w-8 h-8 flex-shrink-0">
                                <AvatarImage
                                  src={
                                    notification.user_profile
                                      .profile_picture_url
                                  }
                                />
                                <AvatarFallback>
                                  {notification.user_profile.display_name[0]}
                                </AvatarFallback>
                              </Avatar>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium text-sm">
                                  {notification.title}
                                </h4>
                                {!notification.is_read && (
                                  <div className="w-2 h-2 bg-primary rounded-full" />
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">
                                {notification.content}
                              </p>
                              {notification.metadata && (
                                <div className="mt-2 text-xs text-muted-foreground">
                                  {notification.metadata.post_content && (
                                    <p className="italic">
                                      "{notification.metadata.post_content}"
                                    </p>
                                  )}
                                  {notification.metadata.comment_content && (
                                    <p className="italic">
                                      "{notification.metadata.comment_content}"
                                    </p>
                                  )}
                                  {notification.metadata.event_name && (
                                    <p>
                                      Event: {notification.metadata.event_name}
                                    </p>
                                  )}
                                  {notification.metadata.channel_name && (
                                    <p>
                                      Channel:{' '}
                                      {notification.metadata.channel_name}
                                    </p>
                                  )}
                                </div>
                              )}
                              <div className="flex items-center gap-2 mt-2">
                                <span className="text-xs text-muted-foreground">
                                  {new Date(
                                    notification.created_at
                                  ).toLocaleString()}
                                </span>
                                {!notification.is_read && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => markAsRead(notification.id)}
                                    className="text-xs h-6 px-2"
                                  >
                                    <Eye className="w-3 h-3 mr-1" />
                                    Mark as read
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                deleteNotification(notification.id)
                              }
                              className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {getFilteredNotifications().length === 0 && (
                    <div className="text-center py-12">
                      <Bell className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">
                        No notifications
                      </h3>
                      <p className="text-muted-foreground">
                        {filter === 'all'
                          ? 'You have no notifications yet'
                          : `No ${filter} notifications`}
                      </p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Notifications;
