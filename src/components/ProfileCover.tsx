import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Camera, Settings, MessageCircle } from 'lucide-react';
import FollowButton from '@/components/FollowButton';
import { supabase } from '@/lib/supabase';

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

  useEffect(() => {
    getCurrentUser();
  }, []);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUser(user);
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
              <Button variant="outline">
                <Settings className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>
            ) : (
              <>
                <FollowButton 
                  targetId={profile.id}
                  targetType="user"
                  currentUserId={currentUser?.id}
                />
                <Button variant="outline">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Message
                </Button>
              </>
            )}
          </div>
        </div>
        
        {profile.bio && (
          <p className="text-gray-700 mt-4 max-w-2xl">{profile.bio}</p>
        )}
      </div>
    </Card>
  );
};

export default ProfileCover;