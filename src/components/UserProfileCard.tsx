import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { UserPlus, UserCheck, MessageCircle, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface currentUserProfile {
  id: string;
  username: string;
  display_name: string;
  bio: string;
  profile_picture_url: string;
  followers_count: number;
  following_count: number;
  friends_count: number;
}

interface currentUserProfileCardProps {
  profile: currentUserProfile;
  showFollowButton?: boolean;
  compact?: boolean;
}

const currentUserProfileCard: React.FC<currentUserProfileCardProps> = ({ 
  profile, 
  showFollowButton = true, 
  compact = false 
}) => {
  const [isFollowing, setIsFollowing] = useState(false);
  const [currentUserProfile, setcurrentUserProfile] = useState<any>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    getcurrentUserProfile();
  }, []);

  useEffect(() => {
    if (currentUserProfile) {
      checkFollowStatus();
    }
  }, [currentUserProfile, profile.id]);

  const getcurrentUserProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: currentUserProfile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      setcurrentUserProfile(currentUserProfile);
    }
  };

  const checkFollowStatus = async () => {
    if (!currentUserProfile) return;

    try {
      const { data } = await supabase
        .from('user_follows')
        .select('id')
        .eq('follower_id', currentUserProfile.id)
        .eq('following_id', profile.id)
        .single();
      setIsFollowing(!!data);
    } catch (error) {
      // User is not following
      setIsFollowing(false);
    }
  };

  const handleFollow = async () => {
    if (!currentUserProfile) return;

    try {
      if (isFollowing) {
        await supabase
          .from('user_follows')
          .delete()
          .eq('follower_id', currentUserProfile.id)
          .eq('following_id', profile.id);
        setIsFollowing(false);
      } else {
        await supabase
          .from('user_follows')
          .insert({
            follower_id: currentUserProfile.id,
            following_id: profile.id
          });
        setIsFollowing(true);
      }
      toast({
        title: isFollowing ? 'Unfollowed' : 'Following',
        description: `You are now ${isFollowing ? 'not following' : 'following'} ${profile.display_name || profile.username}`
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update follow status',
        variant: 'destructive'
      });
    }
  };

  const handleProfileClick = () => {
    navigate(`/profile/${profile.id}`);
  };

  if (compact) {
    return (
      <div className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer" onClick={handleProfileClick}>
        <Avatar className="w-10 h-10">
          <AvatarImage src={profile.profile_picture_url} />
          <AvatarFallback>
            {profile.display_name?.[0] || profile.username[0]}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <p className="font-semibold text-sm">{profile.display_name || profile.username}</p>
          <p className="text-xs text-gray-500">@{profile.username}</p>
        </div>
        {showFollowButton && currentUserProfile && currentUserProfile.id !== profile.id && (
          <Button
            size="sm"
            variant={isFollowing ? "outline" : "default"}
            onClick={(e) => {
              e.stopPropagation();
              handleFollow();
            }}
          >
            {isFollowing ? <UserCheck className="w-3 h-3" /> : <UserPlus className="w-3 h-3" />}
          </Button>
        )}
      </div>
    );
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start space-x-4">
          <Avatar className="w-16 h-16 cursor-pointer" onClick={handleProfileClick}>
            <AvatarImage src={profile.profile_picture_url} />
            <AvatarFallback className="text-lg">
              {profile.display_name?.[0] || profile.username[0]}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h3 className="font-semibold cursor-pointer hover:underline" onClick={handleProfileClick}>
              {profile.display_name || profile.username}
            </h3>
            <p className="text-sm text-gray-500">@{profile.username}</p>
            {profile.bio && (
              <p className="text-sm text-gray-700 mt-1 line-clamp-2">{profile.bio}</p>
            )}
            
            <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
              <div className="flex items-center space-x-1">
                <Users className="w-3 h-3" />
                <span>{profile.followers_count} followers</span>
              </div>
              <span>{profile.following_count} following</span>
            </div>
          </div>
        </div>
        
        {showFollowButton && currentUserProfile && currentUserProfile.id !== profile.id && (
          <div className="flex space-x-2 mt-4">
            <Button
              size="sm"
              variant={isFollowing ? "outline" : "default"}
              onClick={handleFollow}
              className="flex-1"
            >
              {isFollowing ? (
                <><UserCheck className="w-4 h-4 mr-2" />Following</>
              ) : (
                <><UserPlus className="w-4 h-4 mr-2" />Follow</>
              )}
            </Button>
            <Button size="sm" variant="outline">
              <MessageCircle className="w-4 h-4 mr-2" />
              Message
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default currentUserProfileCard;