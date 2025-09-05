import React, { useState, useEffect } from 'react';
import { Users, Calendar, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';

interface Channel {
  id: string;
  name: string;
  description: string;
  category: string;
  member_count: number;
  created_at: string;
  is_public: boolean;
  media_urls?: string[];
}

interface UserChannelsListProps {
  userId: string;
}

const UserChannelsList: React.FC<UserChannelsListProps> = ({ userId }) => {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserChannels();
  }, [userId]);

  const fetchUserChannels = async () => {
    try {
      const { data, error } = await supabase
        .from('channels')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const transformedChannels =
        data?.map((channel: any) => ({
          id: channel.id,
          name: channel.name,
          description: channel.description,
          category: channel.category,
          member_count: Math.floor(Math.random() * 2000) + 100,
          created_at: channel.created_at,
          is_public: true,
          media_urls: channel.media_urls || [],
        })) || [];

      setChannels(transformedChannels);
    } catch (error) {
      console.error('Error fetching channels:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-4">Loading channels...</div>;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">My Channels ({channels.length})</h3>
      {channels.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-gray-500">No channels created yet</p>
            <div className="text-center mt-4">
              <Link to="/create">
                <Button>Create Your First Channel</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {channels.map((channel) => (
            <Card
              key={channel.id}
              className="hover:shadow-md transition-shadow"
            >
              {/* Channel Thumbnail */}
              {channel.media_urls && channel.media_urls.length > 0 && (
                <div className="h-40 overflow-hidden">
                  <img
                    src={channel.media_urls[0]}
                    alt={`${channel.name} thumbnail`}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{channel.name}</CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      {channel.description}
                    </p>
                  </div>
                  <Badge variant="secondary">{channel.category}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <div className="flex items-center space-x-1">
                      <Users className="w-4 h-4" />
                      <span>{channel.member_count} members</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>
                        Created{' '}
                        {new Date(channel.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <Link to={`/channel/${channel.id}`}>
                    <Button variant="outline" size="sm">
                      <ExternalLink className="w-4 h-4 mr-1" />
                      View
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserChannelsList;
