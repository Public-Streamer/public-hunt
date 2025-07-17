import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useParams } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useAppContext } from '@/contexts/AppContext';
import { supabase } from '@/lib/supabase';
import ProfileCover from '@/components/ProfileCover';
import ProfileNewsfeedTab from '@/components/ProfileNewsfeedTab';
import ProfileAbout from '@/components/ProfileAbout';
import ProfilePhotos from '@/components/ProfilePhotos';
import ProfileVideos from '@/components/ProfileVideos';
import UserChannelsList from '@/components/UserChannelsList';
import UserEventsList from '@/components/UserEventsList';
import ProfileStories from '@/components/ProfileStories';
import ProfileFriends from '@/components/ProfileFriends';
import ProfileTimeline from '@/components/ProfileTimeline';
import ProfileMediaUpload from '@/components/ProfileMediaUpload';
import Messages from '@/components/Messages';
import Notifications from '@/components/Notifications';

interface UserProfile {
  id: string;
  username: string;
  display_name: string;
  bio: string;
  profile_picture_url: string;
  cover_photo_url?: string;
  location?: string;
  work?: string;
  education?: string;
  relationship_status?: string;
  website?: string;
  birthday?: string;
  occupation?: string;
  interests?: string[];
  created_at: string;
}

const Profile: React.FC = () => {
  const { userId } = useParams<{ userId?: string }>();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [friendsCount, setFriendsCount] = useState(0);
  const [followersCount, setFollowersCount] = useState(0);
  const { toast } = useToast();
  const { user, userProfile, isAuthenticated } = useAppContext();

  const handleProfileUpdate = async (updatedProfile: UserProfile) => {
    setProfile(updatedProfile);
    
    // Persist the profile updates to Supabase
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          username: updatedProfile.username,
          display_name: updatedProfile.display_name,
          bio: updatedProfile.bio,
          profile_picture_url: updatedProfile.profile_picture_url,
          cover_photo_url: updatedProfile.cover_photo_url,
          location: updatedProfile.location,
          website: updatedProfile.website,
          birthday: updatedProfile.birthday
        })
        .eq('id', updatedProfile.id);
        
      if (error) {
        console.error('Error updating profile:', error);
        toast({
          title: 'Update Error',
          description: 'Failed to save profile changes to the database',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error persisting profile update:', error);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      window.location.href = '/login';
      return;
    }
    loadProfile();
  }, [userId, user, isAuthenticated]);

  const loadProfile = async () => {
    try {
      if (!user) return;
      
      const targetUserId = userId || user.id;
      setIsOwnProfile(targetUserId === user.id);
      
      // Fetch the actual profile data from Supabase
      const { data: profileData, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', targetUserId)
        .single();
      
      if (error) {
        throw error;
      }
      
      if (profileData) {
        // Use real profile data from the database
        const userProfileData: UserProfile = {
          id: profileData.id,
          username: profileData.username || user.email?.split('@')[0] || 'user',
          display_name: profileData.display_name || `${userProfile?.firstName || ''} ${userProfile?.lastName || ''}`.trim() || 'User',
          bio: profileData.bio || userProfile?.bio || 'Welcome to my profile!',
          profile_picture_url: profileData.profile_picture_url || userProfile?.profilePhoto || '/placeholder.svg',
          cover_photo_url: profileData.cover_photo_url,
          location: profileData.location || userProfile?.location || 'San Francisco, CA',
          work: 'Content Creator',
          education: 'University of California',
          relationship_status: 'Single',
          website: profileData.website || 'https://example.com',
          birthday: profileData.birthday || userProfile?.birthDate || '1990-01-15',
          occupation: 'Digital Creator & Influencer',
          interests: ['Technology', 'Photography', 'Travel', 'Gaming', 'Music'],
          created_at: profileData.created_at || new Date().toISOString()
        };
        
        setProfile(userProfileData);
        setFriendsCount(profileData.friends_count || Math.floor(Math.random() * 500) + 50);
        setFollowersCount(profileData.followers_count || Math.floor(Math.random() * 1000) + 100);
      } else {
        // Fallback to mock data if no profile exists yet
        const mockProfile: UserProfile = {
          id: targetUserId,
          username: user.email?.split('@')[0] || 'user',
          display_name: userProfile ? `${userProfile.firstName} ${userProfile.lastName}` : 'User',
          bio: userProfile?.bio || 'Welcome to my profile! I love creating amazing content and connecting with the community.',
          profile_picture_url: userProfile?.profilePhoto || '/placeholder.svg',
          cover_photo_url: undefined,
          location: userProfile?.location || 'San Francisco, CA',
          work: 'Content Creator',
          education: 'University of California',
          relationship_status: 'Single',
          website: 'https://example.com',
          birthday: userProfile?.birthDate || '1990-01-15',
          occupation: 'Digital Creator & Influencer',
          interests: ['Technology', 'Photography', 'Travel', 'Gaming', 'Music'],
          created_at: new Date().toISOString()
        };
        
        setProfile(mockProfile);
        setFriendsCount(Math.floor(Math.random() * 500) + 50);
        setFollowersCount(Math.floor(Math.random() * 1000) + 100);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to load profile',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Loading profile...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">Profile Not Found</h2>
        <p className="text-gray-600">The profile you're looking for doesn't exist.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4">
      <ProfileCover 
        profile={profile}
        isOwnProfile={isOwnProfile}
        friendsCount={friendsCount}
        followersCount={followersCount}
        onProfileUpdate={handleProfileUpdate}
      />
      
      {/* Stories Section */}
      <div className="mb-6">
        <ProfileStories userId={profile.id} isOwnProfile={isOwnProfile} />
      </div>
      
      <Tabs defaultValue="timeline" className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-9">
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="about">About</TabsTrigger>
          <TabsTrigger value="friends">Friends</TabsTrigger>
          <TabsTrigger value="media">Media</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="channels">Channels</TabsTrigger>
          {isOwnProfile && <TabsTrigger value="messages">Messages</TabsTrigger>}
          {isOwnProfile && <TabsTrigger value="notifications">Notifications</TabsTrigger>}
          {isOwnProfile && <TabsTrigger value="admin">Admin</TabsTrigger>}
        </TabsList>
        
        <TabsContent value="timeline" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <ProfileTimeline 
                userId={profile.id} 
                isOwnProfile={isOwnProfile} 
                userProfile={{
                  id: profile.id,
                  username: profile.username,
                  display_name: profile.display_name,
                  profile_picture_url: profile.profile_picture_url
                }}
              />
            </div>
            <div className="space-y-6">
              <ProfileAbout profile={profile} />
              <ProfileMediaUpload userId={profile.id} isOwnProfile={isOwnProfile} />
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="about" className="mt-6">
          <ProfileAbout profile={profile} />
        </TabsContent>
        
        <TabsContent value="friends" className="mt-6">
          <ProfileFriends userId={profile.id} isOwnProfile={isOwnProfile} />
        </TabsContent>
        
        <TabsContent value="media" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ProfilePhotos userId={profile.id} isOwnProfile={isOwnProfile} />
            <ProfileVideos userId={profile.id} isOwnProfile={isOwnProfile} />
          </div>
        </TabsContent>
        
        <TabsContent value="events" className="mt-6">
          <UserEventsList userId={profile.id} />
        </TabsContent>
        
        <TabsContent value="channels" className="mt-6">
          <UserChannelsList userId={profile.id} />
        </TabsContent>
        
        {isOwnProfile && (
          <TabsContent value="messages" className="mt-6">
            <Messages userId={profile.id} />
          </TabsContent>
        )}
        
        {isOwnProfile && (
          <TabsContent value="notifications" className="mt-6">
            <Notifications userId={profile.id} />
          </TabsContent>
        )}
        
        {isOwnProfile && (
          <TabsContent value="admin" className="mt-6">
            <div className="bg-card rounded-lg shadow p-6">
              <h3 className="text-2xl font-bold mb-4">Admin Panel</h3>
              <p className="text-muted-foreground mb-4">Administrative tools and platform management.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">User Management</h4>
                  <p className="text-sm text-muted-foreground">Manage user accounts and permissions</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">Content Moderation</h4>
                  <p className="text-sm text-muted-foreground">Review and moderate platform content</p>
                </div>
              </div>
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default Profile;