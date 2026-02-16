import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Clock, User, Send } from 'lucide-react';
import TooltipWrapper from '@/components/ui/tooltip-wrapper';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { useAppContext } from '@/contexts/AppContext';

interface BulletinPost {
  id: string;
  content: string;
  author: string;
  role: 'event_master' | 'channel_master';
  timestamp: string;
  type: 'scoreboard' | 'time' | 'announcement' | 'general';
}

interface BulletinBoardProps {
  eventId: string;
  userRole?: 'event_master' | 'channel_master' | 'viewer';
}

const BulletinBoard: React.FC<BulletinBoardProps> = ({ eventId, userRole = 'viewer' }) => {
  const [posts, setPosts] = useState<BulletinPost[]>([
    {
      id: '1',
      content: 'Score Update: Team A - 15, Team B - 12',
      author: 'Event Master',
      role: 'event_master',
      timestamp: '2 minutes ago',
      type: 'scoreboard'
    },
    {
      id: '2',
      content: 'Time remaining: 45 minutes',
      author: 'Channel Master',
      role: 'channel_master',
      timestamp: '5 minutes ago',
      type: 'time'
    }
  ]);
  
  const [newPost, setNewPost] = useState('');
  const [postType, setPostType] = useState<BulletinPost['type']>('general');
  
  const canPost = userRole === 'event_master' || userRole === 'channel_master';
  
  const handleSubmit = () => {
    if (!newPost.trim()) return;
    
    const post: BulletinPost = {
      id: Date.now().toString(),
      content: newPost,
      author: userRole === 'event_master' ? 'Event Master' : 'Channel Master',
      role: userRole as 'event_master' | 'channel_master',
      timestamp: 'Just now',
      type: postType
    };
    
    setPosts([post, ...posts]);
    setNewPost('');
  };
  
  const getTypeColor = (type: BulletinPost['type']) => {
    switch (type) {
      case 'scoreboard': return 'bg-blue-100 text-blue-800';
      case 'time': return 'bg-orange-100 text-orange-800';
      case 'announcement': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <MessageSquare className="h-5 w-5 mr-2" />
          Bulletin Board
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {canPost && (
          <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
            <div className="flex space-x-2">
              {(['scoreboard', 'time', 'announcement', 'general'] as const).map((type) => (
                <TooltipWrapper key={type} content={`Select ${type} post type`}>
                  <Button
                    variant={postType === type ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPostType(type)}
                  >
                    {type}
                  </Button>
                </TooltipWrapper>
              ))}
            </div>
            <Textarea
              placeholder="Share updates with the audience..."
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              className="min-h-[80px]"
            />
            <TooltipWrapper content="Share this update with all event viewers">
              <Button onClick={handleSubmit} className="w-full">
                Post Update
              </Button>
            </TooltipWrapper>
          </div>
        )}
        
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {posts.map((post) => (
            <div key={post.id} className="p-3 bg-white border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <span className="font-medium text-sm">{post.author}</span>
                  <Badge className={getTypeColor(post.type)}>
                    {post.type}
                  </Badge>
                </div>
                <div className="flex items-center text-xs text-gray-500">
                  <Clock className="h-3 w-3 mr-1" />
                  {post.timestamp}
                </div>
              </div>
              <p className="text-sm">{post.content}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default BulletinBoard;
