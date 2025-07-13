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
      
      const mockProfile: UserProfile = {
        id: targetUserId,
        username: user.email?.split('@')[0] || 'user',
        display_name: userProfile ? `${userProfile.firstName} ${userProfile.lastName}` : 'User',
        bio: userProfile?.bio || 'Welcome to my profile! I love creating amazing content and connecting with the community.',
        profile_picture_url: userProfile?.profilePhoto || '/placeholder.svg',
        cover_photo_url: undefined,
        location: userProfile?.location || 'Earth',
        work: 'Content Creator',
        education: 'School of Life',
        relationship_status: 'Single',
        website: 'https://example.com',
        created_at: new Date().toISOString()
      };
      
      setProfile(mockProfile);
      setFriendsCount(Math.floor(Math.random() * 500) + 50);
      setFollowersCount(Math.floor(Math.random() * 1000) + 100);
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
      />
      
      <Tabs defaultValue="newsfeed" className="w-full">
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="newsfeed">Newsfeed</TabsTrigger>
          <TabsTrigger value="about">About</TabsTrigger>
          <TabsTrigger value="photos">Photos</TabsTrigger>
          <TabsTrigger value="videos">Videos</TabsTrigger>
          <TabsTrigger value="channels">My Channels</TabsTrigger>
          <TabsTrigger value="events">My Events</TabsTrigger>
          <TabsTrigger value="admin">Admin</TabsTrigger>
          <TabsTrigger value="withdraw">Withdraw</TabsTrigger>
        </TabsList>
        
        <TabsContent value="newsfeed" className="mt-6">
          <ProfileNewsfeedTab userId={profile.id} isOwnProfile={isOwnProfile} />
        </TabsContent>
        
        <TabsContent value="about" className="mt-6">
          <ProfileAbout profile={profile} />
        </TabsContent>
        
        <TabsContent value="photos" className="mt-6">
          <ProfilePhotos userId={profile.id} isOwnProfile={isOwnProfile} />
        </TabsContent>
        
        <TabsContent value="videos" className="mt-6">
          <ProfileVideos userId={profile.id} isOwnProfile={isOwnProfile} />
        </TabsContent>
        
        <TabsContent value="channels" className="mt-6">
          <UserChannelsList userId={profile.id} />
        </TabsContent>
        
        <TabsContent value="events" className="mt-6">
          <UserEventsList userId={profile.id} />
        </TabsContent>
        
        <TabsContent value="admin" className="mt-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-2xl font-bold mb-4">Admin Panel</h3>
            <p className="text-gray-600 mb-4">Administrative tools and platform management.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2">User Management</h4>
                <p className="text-sm text-gray-600">Manage user accounts and permissions</p>
              </div>
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2">Content Moderation</h4>
                <p className="text-sm text-gray-600">Review and moderate platform content</p>
              </div>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="withdraw" className="mt-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-2xl font-bold mb-4">Withdraw Funds</h3>
            <p className="text-gray-600 mb-6">Withdraw your earnings from events and donations.</p>
            <div className="space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h4 className="font-semibold text-green-800 mb-2">Available Balance</h4>
                <p className="text-2xl font-bold text-green-600">$1,234.56</p>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Profile;