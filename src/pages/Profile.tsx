import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useParams } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useAppContext } from '@/contexts/AppContext';
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
import BottomSlidePanel from '@/components/BottomSlidePanel';
import type { Database } from '@/integrations/supabase/types';

type UserProfile = Database['public']['Tables']['user_profiles']['Row'];

const Profile: React.FC = () => {
  const { userId } = useParams<{ userId?: string }>();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [friendsCount, setFriendsCount] = useState(0);
  const [followersCount, setFollowersCount] = useState(0);
  const { toast } = useToast();
  const { user, userProfile, isAuthenticated, authLoaded,  loading : profileLoading } = useAppContext();

  console.log({userProfile});

  const handleProfileUpdate = (updatedProfile: UserProfile) => {
    setProfile(updatedProfile);
  };

  useEffect(() => {
    if (!authLoaded) return;
    if (!isAuthenticated) {
      window.location.href = '/login';
      return;
    }
  if(userProfile) {loadProfile()};
  }, [userId, user, userProfile, isAuthenticated, authLoaded, ]);


   const loadProfile = async () => {
    try {
      if (!user) return;
      
      const targetUserId = userId || userProfile.id;
      setIsOwnProfile(targetUserId === userProfile.id);
      
      console.log(userProfile.cover_photo_url);

      const mockProfile: UserProfile = {
        id: userProfile.id,
        user_id: userProfile.user_id,
        username: user.email?.split('@')[0] || 'user',
        display_name: userProfile ? `${userProfile.display_name}` : 'User',
        bio: userProfile?.bio || 'Welcome to my profile! I love creating amazing content and connecting with the community.',
        profile_picture_url: userProfile?.profile_picture_url || '/placeholder.svg',
        cover_photo_url: userProfile?.cover_photo_url,
        location: userProfile?.location || 'San Francisco, CA',
        company_name: userProfile?.company_name || 'Content Creator',
        company_id: userProfile?.company_id || '',
        education: userProfile?.education || 'University of California',
        relationship_status: userProfile?.relationship_status || 'Single',
        website: userProfile?.website || 'https://example.com',
        birthday: userProfile?.birthday || '1990-01-15',
        occupation: userProfile?.occupation || 'Digital Creator & Influencer',
        interests: userProfile?.interests || ['Technology', 'Photography', 'Travel', 'Gaming', 'Music'],
        followers_count: userProfile?.followers_count || 0,
        following_count: userProfile?.following_count || 0,
        friends_count: userProfile?.friends_count || 0,
        is_company_account: userProfile?.is_company_account || false,
        cam_name: userProfile?.cam_name || 'Camera 01',
        created_at: userProfile?.created_at || new Date().toISOString(),
        updated_at: userProfile?.updated_at || new Date().toISOString()
      };
      
      setProfile(mockProfile);
      setFriendsCount(Math.floor(Math.random() * 500) + 50);
      setFollowersCount(Math.floor(Math.random() * 1000) + 100);
      setLoading(false);
    } catch (error) {
      setLoading(false);
      console.error('Error loading profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to load profile',
        variant: 'destructive'
      });
    } 
  };

  if (!authLoaded || loading || profileLoading) {
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
  console.log(profile);

  return (
    <div className="max-w-6xl mx-auto p-4 w-full overflow-hidden">
      {!isOwnProfile && (
        <div className="mb-4 bg-blue-100 border border-blue-300 text-blue-800 px-4 py-3 rounded-lg text-center font-medium">
          You are viewing a public profile. Editing and posting are disabled.
        </div>
      )}
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
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-11">
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="about">About</TabsTrigger>
          <TabsTrigger value="friends">Friends</TabsTrigger>
          <TabsTrigger value="media">Media</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="channels">Channels</TabsTrigger>
          {isOwnProfile && <TabsTrigger value="dashboard">Dashboard</TabsTrigger>}
          {isOwnProfile && <TabsTrigger value="my-ads">My Ads</TabsTrigger>}
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
          <UserEventsList userId={profile.user_id} />
        </TabsContent>
        
        <TabsContent value="channels" className="mt-6">
          <UserChannelsList userId={profile.id} />
        </TabsContent>
        
        {isOwnProfile && (
          <TabsContent value="dashboard" className="mt-6">
            <div className="bg-card rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-2xl font-bold">Advertiser Dashboard</h3>
                <button 
                  onClick={() => window.location.href = '/advertiser-dashboard'}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Open Full Dashboard
                </button>
              </div>
              <p className="text-muted-foreground mb-4">Manage your advertising campaigns, track performance, and optimize your ad spend.</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">Campaign Overview</h4>
                  <p className="text-sm text-muted-foreground mb-3">View all your active campaigns and their performance</p>
                  <button 
                    onClick={() => window.location.href = '/advertiser-dashboard'}
                    className="text-primary hover:underline text-sm"
                  >
                    View Campaigns →
                  </button>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">Real-Time Analytics</h4>
                  <p className="text-sm text-muted-foreground mb-3">Track impressions, clicks, and spend in real-time</p>
                  <button 
                    onClick={() => window.location.href = '/advertiser-dashboard'}
                    className="text-primary hover:underline text-sm"
                  >
                    View Analytics →
                  </button>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">Create New Campaign</h4>
                  <p className="text-sm text-muted-foreground mb-3">Start advertising on Public Streamer</p>
                  <button 
                    onClick={() => window.location.href = '/create-ad'}
                    className="text-primary hover:underline text-sm"
                  >
                    Create Ad →
                  </button>
                </div>
              </div>
            </div>
          </TabsContent>
        )}
        
        {isOwnProfile && (
          <TabsContent value="messages" className="mt-6">
            <Messages userId={profile.id} />
          </TabsContent>
        )}
        
        {isOwnProfile && (
          <TabsContent value="my-ads" className="mt-6">
            <div className="bg-card rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-2xl font-bold">My Ad Campaigns</h3>
                <button 
                  onClick={() => window.location.href = '/my-ads'}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                  View All Ads
                </button>
              </div>
              <p className="text-muted-foreground mb-4">Manage your advertising campaigns and view performance metrics.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">Create New Ad</h4>
                  <p className="text-sm text-muted-foreground mb-3">Start a new advertising campaign</p>
                  <button 
                    onClick={() => window.location.href = '/create?tab=ad'}
                    className="text-primary hover:underline text-sm"
                  >
                    Create Ad Campaign →
                  </button>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">Campaign Analytics</h4>
                  <p className="text-sm text-muted-foreground mb-3">View detailed performance metrics</p>
                  <button 
                    onClick={() => window.location.href = '/my-ads'}
                    className="text-primary hover:underline text-sm"
                  >
                    View Analytics →
                  </button>
                </div>
              </div>
            </div>
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
      
      {/* Bottom Slide Panel for Mobile */}
      <BottomSlidePanel />
    </div>
  );
};

export default Profile;