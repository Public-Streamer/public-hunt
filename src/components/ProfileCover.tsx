import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Camera, Settings, MessageCircle, Share2, UserPlus, MapPin, Calendar, Users, Heart, Star } from 'lucide-react';
import FollowButton from '@/components/FollowButton';
import SocialShareMenu from '@/components/SocialShareMenu';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

interface ProfileCoverProps {
  profile: {
    id: string;
    username: string;
    display_name: string;
    bio: string;
    profile_picture_url: string;
    cover_photo_url?: string;
    created_at: string;
  };
  isOwnProfile: boolean;
  friendsCount?: number;
  followersCount?: number;
}

const ProfileCover: React.FC<ProfileCoverProps> = ({ 
  profile, 
  isOwnProfile, 
  friendsCount = 0, 
  followersCount = 0 
}) => {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    getCurrentUser();
    // Mock live status
    setIsLive(Math.random() > 0.7);
  }, []);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUser(user);
  };

  const handleSendFriendRequest = () => {
    toast({
      title: 'Friend Request Sent',
      description: `Friend request sent to ${profile.display_name}`
    });
  };

  return (
    <Card className="mb-6 overflow-hidden">
      {/* Cover Photo */}
      <div 
        className="h-64 bg-gradient-to-r from-blue-500 to-purple-600 relative"
        style={{
          backgroundImage: profile.cover_photo_url ? `url(${profile.cover_photo_url})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        {isOwnProfile && (
          <Button 
            variant="secondary" 
            size="sm" 
            className="absolute bottom-4 right-4"
          >
            <Camera className="w-4 h-4 mr-2" />
            Edit Cover
          </Button>
        )}
      </div>
      
      {/* Profile Info */}
      <div className="p-6 pb-4">
        <div className="flex items-end -mt-20 mb-4">
          <div className="relative">
            <Avatar className="w-32 h-32 border-4 border-white shadow-lg">
              <AvatarImage src={profile.profile_picture_url} />
              <AvatarFallback className="text-3xl">
                {profile.display_name?.[0] || profile.username[0]}
              </AvatarFallback>
            </Avatar>
            {isOwnProfile && (
              <Button 
                size="sm" 
                className="absolute bottom-2 right-2 rounded-full w-8 h-8 p-0"
              >
                <Camera className="w-4 h-4" />
              </Button>
            )}
          </div>
          
          <div className="ml-6 flex-1">
            <h1 className="text-3xl font-bold text-gray-900">{profile.display_name}</h1>
            <p className="text-gray-600 text-lg">@{profile.username}</p>
            <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
              <span>{friendsCount} friends</span>
              <span>{followersCount} followers</span>
            </div>
          </div>
          
          <div className="flex space-x-2">
            {isOwnProfile ? (
              <>
                <Button variant="outline">
                  <Settings className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
                <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <Share2 className="w-4 h-4 mr-2" />
                      Share Profile
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Share Profile</DialogTitle>
                    </DialogHeader>
                    <SocialShareMenu
                      title={`Check out ${profile.display_name}'s profile`}
                      description={profile.bio}
                      url={`${window.location.origin}/profile/${profile.id}`}
                    />
                  </DialogContent>
                </Dialog>
              </>
            ) : (
              <>
                <FollowButton 
                  targetId={profile.id}
                  targetType="user"
                  currentUserId={currentUser?.id}
                />
                <Button variant="outline" onClick={handleSendFriendRequest}>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add Friend
                </Button>
                <Button variant="outline">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Message
                </Button>
                <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Share2 className="w-4 h-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Share Profile</DialogTitle>
                    </DialogHeader>
                    <SocialShareMenu
                      title={`Check out ${profile.display_name}'s profile`}
                      description={profile.bio}
                      url={`${window.location.origin}/profile/${profile.id}`}
                    />
                  </DialogContent>
                </Dialog>
              </>
            )}
          </div>
        </div>
        
        {profile.bio && (
          <p className="text-foreground mt-4 max-w-2xl">{profile.bio}</p>
        )}
        
        {/* Live Status and Quick Stats */}
        <div className="flex items-center space-x-4 mt-4">
          {isLive && (
            <Badge variant="destructive" className="animate-pulse">
              <div className="w-2 h-2 bg-white rounded-full mr-2" />
              LIVE
            </Badge>
          )}
          <div className="flex items-center space-x-1 text-sm text-muted-foreground">
            <Heart className="w-4 h-4" />
            <span>4.8k likes</span>
          </div>
          <div className="flex items-center space-x-1 text-sm text-muted-foreground">
            <Star className="w-4 h-4" />
            <span>5.0 rating</span>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default ProfileCover;