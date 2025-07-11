import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { Heart, MessageCircle, Share2, Calendar, Users, Play } from 'lucide-react';
import { Link } from 'react-router-dom';

interface NewsfeedItem {
  id: string;
  type: 'event' | 'channel' | 'comment';
  title: string;
  content: string;
  author: {
    name: string;
    avatar: string;
    username: string;
  };
  timestamp: string;
  likes: number;
  comments: number;
  shares: number;
  isLiked: boolean;
  metadata?: {
    eventId?: string;
    channelId?: string;
    category?: string;
    price?: number;
    attendees?: number;
  };
}

const ProfileNewsfeed: React.FC = () => {
  const [feedItems, setFeedItems] = useState<NewsfeedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNewsfeed();
  }, []);

  const fetchNewsfeed = async () => {
    try {
      // Mock trending data - replace with actual Supabase queries
      const mockFeed: NewsfeedItem[] = [
        {
          id: '1',
          type: 'event',
          title: 'Epic Gaming Tournament Starting Soon!',
          content: 'Join us for the biggest gaming event of the month. Prize pool of $10,000!',
          author: {
            name: 'GameMaster Pro',
            avatar: '/placeholder.svg',
            username: 'gamemaster_pro'
          },
          timestamp: '2024-03-15T14:30:00Z',
          likes: 234,
          comments: 45,
          shares: 12,
          isLiked: false,
          metadata: {
            eventId: '1',
            category: 'Gaming',
            price: 5.99,
            attendees: 156
          }
        },
        {
          id: '2',
          type: 'channel',
          title: 'New Music Channel Launched!',
          content: 'Discover amazing live music performances from indie artists around the world.',
          author: {
            name: 'Melody Streams',
            avatar: '/placeholder.svg',
            username: 'melody_streams'
          },
          timestamp: '2024-03-15T12:15:00Z',
          likes: 89,
          comments: 23,
          shares: 8,
          isLiked: true,
          metadata: {
            channelId: '2',
            category: 'Music'
          }
        },
        {
          id: '3',
          type: 'comment',
          title: 'Amazing performance last night!',
          content: 'The acoustic session was absolutely incredible. Thank you for such a beautiful evening of music.',
          author: {
            name: 'Music Lover',
            avatar: '/placeholder.svg',
            username: 'music_lover_42'
          },
          timestamp: '2024-03-15T09:45:00Z',
          likes: 67,
          comments: 12,
          shares: 3,
          isLiked: false
        }
      ];
      setFeedItems(mockFeed);
    } catch (error) {
      console.error('Error fetching newsfeed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (itemId: string) => {
    setFeedItems(prev => prev.map(item => 
      item.id === itemId 
        ? { ...item, isLiked: !item.isLiked, likes: item.isLiked ? item.likes - 1 : item.likes + 1 }
        : item
    ));
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'event': return <Calendar className="w-4 h-4" />;
      case 'channel': return <Play className="w-4 h-4" />;
      case 'comment': return <MessageCircle className="w-4 h-4" />;
      default: return null;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'event': return 'bg-blue-500';
      case 'channel': return 'bg-purple-500';
      case 'comment': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading newsfeed...</div>;
  }

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold">Trending Newsfeed</h3>
      <div className="space-y-4">
        {feedItems.map((item) => (
          <Card key={item.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start space-x-3">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={item.author.avatar} />
                  <AvatarFallback>{item.author.name[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <h4 className="font-semibold">{item.author.name}</h4>
                    <span className="text-sm text-gray-500">@{item.author.username}</span>
                    <Badge className={`text-white ${getTypeColor(item.type)}`}>
                      {getTypeIcon(item.type)}
                      <span className="ml-1 capitalize">{item.type}</span>
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-500">{new Date(item.timestamp).toLocaleString()}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <h5 className="font-semibold mb-2">{item.title}</h5>
              <p className="text-gray-700 mb-4">{item.content}</p>
              
              {item.metadata && (
                <div className="flex items-center space-x-4 mb-4 text-sm text-gray-600">
                  {item.metadata.category && (
                    <Badge variant="outline">{item.metadata.category}</Badge>
                  )}
                  {item.metadata.price && (
                    <span className="flex items-center">
                      <span className="font-semibold">${item.metadata.price}</span>
                    </span>
                  )}
                  {item.metadata.attendees && (
                    <span className="flex items-center space-x-1">
                      <Users className="w-4 h-4" />
                      <span>{item.metadata.attendees} attending</span>
                    </span>
                  )}
                </div>
              )}
              
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex items-center space-x-6">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleLike(item.id)}
                    className={item.isLiked ? 'text-red-500' : ''}
                  >
                    <Heart className={`w-4 h-4 mr-1 ${item.isLiked ? 'fill-current' : ''}`} />
                    {item.likes}
                  </Button>
                  <Button variant="ghost" size="sm">
                    <MessageCircle className="w-4 h-4 mr-1" />
                    {item.comments}
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Share2 className="w-4 h-4 mr-1" />
                    {item.shares}
                  </Button>
                </div>
                {item.metadata?.eventId && (
                  <Link to={`/events/${item.metadata.eventId}`}>
                    <Button size="sm">View Event</Button>
                  </Link>
                )}
                {item.metadata?.channelId && (
                  <Link to={`/channels/${item.metadata.channelId}`}>
                    <Button size="sm">View Channel</Button>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ProfileNewsfeed;