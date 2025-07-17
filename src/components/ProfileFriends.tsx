import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserPlus, Users, UserCheck, UserX, Search, MessageCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import MessageDialog from '@/components/MessageDialog';

interface Friend {
  id: string;
  user_id: string;
  display_name: string;
  username: string;
  profile_picture_url: string;
  bio?: string;
  mutual_friends: number;
  status: 'friend' | 'pending' | 'requested';
  created_at: string;
}

interface FriendRequest {
  id: string;
  requester_id: string;
  requester_name: string;
  requester_username: string;
  requester_avatar: string;
  created_at: string;
}

interface ProfileFriendsProps {
  userId: string;
  isOwnProfile: boolean;
}

const ProfileFriends: React.FC<ProfileFriendsProps> = ({ userId, isOwnProfile }) => {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showMessageDialog, setShowMessageDialog] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchFriends();
    if (isOwnProfile) {
      fetchFriendRequests();
    }
  }, [userId, isOwnProfile]);

  const fetchFriends = async () => {
    try {
      // Mock friends data - replace with actual Supabase query
      const mockFriends: Friend[] = [
        {
          id: '1',
          user_id: 'user-1',
          display_name: 'Sarah Johnson',
          username: 'sarah_j',
          profile_picture_url: '/placeholder.svg',
          bio: 'Digital artist and content creator',
          mutual_friends: 12,
          status: 'friend',
          created_at: '2024-01-15T10:30:00Z'
        },
        {
          id: '2',
          user_id: 'user-2',
          display_name: 'Mike Chen',
          username: 'mike_chen',
          profile_picture_url: '/placeholder.svg',
          bio: 'Tech enthusiast and gamer',
          mutual_friends: 8,
          status: 'friend',
          created_at: '2024-01-20T14:20:00Z'
        },
        {
          id: '3',
          user_id: 'user-3',
          display_name: 'Emma Wilson',
          username: 'emma_w',
          profile_picture_url: '/placeholder.svg',
          bio: 'Photographer and travel blogger',
          mutual_friends: 15,
          status: 'friend',
          created_at: '2024-02-01T09:45:00Z'
        }
      ];
      setFriends(mockFriends);
    } catch (error) {
      console.error('Error fetching friends:', error);
      toast({
        title: 'Error',
        description: 'Failed to load friends',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchFriendRequests = async () => {
    try {
      // Mock friend requests
      const mockRequests: FriendRequest[] = [
        {
          id: '1',
          requester_id: 'user-4',
          requester_name: 'Alex Rodriguez',
          requester_username: 'alex_rod',
          requester_avatar: '/placeholder.svg',
          created_at: '2024-03-10T16:30:00Z'
        },
        {
          id: '2',
          requester_id: 'user-5',
          requester_name: 'Lisa Park',
          requester_username: 'lisa_p',
          requester_avatar: '/placeholder.svg',
          created_at: '2024-03-12T11:15:00Z'
        }
      ];
      setFriendRequests(mockRequests);
    } catch (error) {
      console.error('Error fetching friend requests:', error);
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    try {
      // Mock accepting friend request
      setFriendRequests(prev => prev.filter(req => req.id !== requestId));
      toast({
        title: 'Success',
        description: 'Friend request accepted'
      });
    } catch (error) {
      console.error('Error accepting friend request:', error);
      toast({
        title: 'Error',
        description: 'Failed to accept friend request',
        variant: 'destructive'
      });
    }
  };

  const handleDeclineRequest = async (requestId: string) => {
    try {
      // Mock declining friend request
      setFriendRequests(prev => prev.filter(req => req.id !== requestId));
      toast({
        title: 'Success',
        description: 'Friend request declined'
      });
    } catch (error) {
      console.error('Error declining friend request:', error);
      toast({
        title: 'Error',
        description: 'Failed to decline friend request',
        variant: 'destructive'
      });
    }
  };

  const filteredFriends = friends.filter(friend =>
    friend.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    friend.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Loading friends...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="friends" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="friends">
            <Users className="w-4 h-4 mr-2" />
            Friends ({friends.length})
          </TabsTrigger>
          {isOwnProfile && (
            <TabsTrigger value="requests">
              <UserPlus className="w-4 h-4 mr-2" />
              Requests ({friendRequests.length})
            </TabsTrigger>
          )}
          <TabsTrigger value="suggestions">
            <UserPlus className="w-4 h-4 mr-2" />
            Suggestions
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="friends" className="space-y-4">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search friends..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredFriends.map((friend) => (
              <Card key={friend.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={friend.profile_picture_url} />
                      <AvatarFallback>{friend.display_name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate">{friend.display_name}</h4>
                      <p className="text-sm text-muted-foreground truncate">@{friend.username}</p>
                      {friend.bio && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{friend.bio}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">
                        {friend.mutual_friends} mutual friends
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-2 mt-3">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => {
                        setSelectedFriend(friend);
                        setShowMessageDialog(true);
                      }}
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Message
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => {
                        // Add to group chat functionality
                        toast({
                          title: 'Feature Coming Soon',
                          description: 'Group chat functionality will be available soon!',
                        });
                      }}
                    >
                      <UserPlus className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        {isOwnProfile && (
          <TabsContent value="requests" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <UserPlus className="w-5 h-5 mr-2" />
                  Friend Requests
                </CardTitle>
              </CardHeader>
              <CardContent>
                {friendRequests.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No pending friend requests</p>
                ) : (
                  <div className="space-y-4">
                    {friendRequests.map((request) => (
                      <div key={request.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Avatar>
                            <AvatarImage src={request.requester_avatar} />
                            <AvatarFallback>{request.requester_name[0]}</AvatarFallback>
                          </Avatar>
                          <div>
                            <h4 className="font-medium">{request.requester_name}</h4>
                            <p className="text-sm text-muted-foreground">@{request.requester_username}</p>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            onClick={() => handleAcceptRequest(request.id)}
                          >
                            <UserCheck className="w-4 h-4 mr-2" />
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeclineRequest(request.id)}
                          >
                            <UserX className="w-4 h-4 mr-2" />
                            Decline
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
        
        <TabsContent value="suggestions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>People You May Know</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-center text-muted-foreground py-8">
                Friend suggestions will appear here based on your activity and mutual connections.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {showMessageDialog && selectedFriend && (
        <MessageDialog
          isOpen={showMessageDialog}
          onClose={() => {
            setShowMessageDialog(false);
            setSelectedFriend(null);
          }}
          recipientId={selectedFriend.user_id}
          recipientName={selectedFriend.display_name}
          recipientAvatar={selectedFriend.profile_picture_url}
        />
      )}
    </div>
  );
};

export default ProfileFriends;