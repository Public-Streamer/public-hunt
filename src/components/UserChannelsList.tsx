import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { Users, Calendar, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Channel {
  id: string;
  name: string;
  description: string;
  category: string;
  member_count: number;
  created_at: string;
  is_public: boolean;
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
      // Mock data for now - replace with actual Supabase query
      const mockChannels: Channel[] = [
        {
          id: '1',
          name: 'Gaming Central',
          description: 'Live gaming streams and tournaments',
          category: 'Gaming',
          member_count: 1250,
          created_at: '2024-01-15T10:00:00Z',
          is_public: true
        },
        {
          id: '2',
          name: 'Music Lounge',
          description: 'Live music performances and jam sessions',
          category: 'Music',
          member_count: 890,
          created_at: '2024-02-20T14:30:00Z',
          is_public: true
        }
      ];
      setChannels(mockChannels);
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
            <Card key={channel.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{channel.name}</CardTitle>
                    <p className="text-sm text-gray-600 mt-1">{channel.description}</p>
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
                      <span>Created {new Date(channel.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <Link to={`/channels/${channel.id}`}>
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