import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useParams } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useAppContext } from '@/contexts/AppContext';
import { supabase } from '@/lib/supabase';
import CompanyProfileCover from '@/components/CompanyProfileCover';
import ProfileNewsfeedTab from '@/components/ProfileNewsfeedTab';
import CompanyProfileAbout from '@/components/CompanyProfileAbout';
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
import CompanyRoleManager from '@/components/CompanyRoleManager';

interface CompanyProfile {
  id: string;
  company_id: string;
  company_name: string;
  description: string;
  industry?: string;
  founded_year?: number;
  headquarters?: string;
  website?: string;
  logo_url: string;
  cover_photo_url?: string;
  employee_count?: string;
  contact_email?: string;
  contact_phone?: string;
  social_links?: any;
  created_at: string;
}

const CompanyProfile: React.FC = () => {
  const { companyId } = useParams<{ companyId?: string }>();
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCompanyMaster, setIsCompanyMaster] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const { toast } = useToast();
  const { user, currentUserProfile, isAuthenticated } = useAppContext();

  const handleProfileUpdate = (updatedProfile: CompanyProfile) => {
    setProfile(updatedProfile);
  };

  useEffect(() => {
    if (!isAuthenticated) {
      window.location.href = '/login';
      return;
    }
    loadCompanyProfile();
  }, [companyId, user, isAuthenticated]);

  const loadCompanyProfile = async () => {
    try {
      if (!user || !companyId) return;
      
      // Fetch company profile
      const { data: companyProfile, error: profileError } = await supabase
        .from('company_profiles')
        .select('*')
        .eq('company_id', companyId)
        .single();

      if (profileError) {
        console.error('Error loading company profile:', profileError);
        // Create a mock profile if not found
        const mockProfile: CompanyProfile = {
          id: companyId,
          company_id: companyId,
          company_name: 'Tech Innovations Inc.',
          description: 'Leading the future of technology with innovative solutions and cutting-edge products.',
          industry: 'Technology',
          founded_year: 2020,
          headquarters: 'San Francisco, CA',
          website: 'https://techinnovations.com',
          logo_url: '/placeholder.svg',
          cover_photo_url: undefined,
          employee_count: '50-100',
          contact_email: 'contact@techinnovations.com',
          contact_phone: '+1 (555) 123-4567',
          social_links: {},
          created_at: new Date().toISOString()
        };
        setProfile(mockProfile);
      } else {
        setProfile(companyProfile);
      }

      // Check if current user is company master
      const { data: userRole, error: roleError } = await supabase
        .from('company_roles')
        .select('role')
        .eq('company_id', companyId)
        .eq('user_id', user.id)
        .single();

      if (!roleError && userRole?.role === 'company_master') {
        setIsCompanyMaster(true);
      }

      setFollowersCount(Math.floor(Math.random() * 5000) + 500);
    } catch (error) {
      console.error('Error loading company profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to load company profile',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Loading company profile...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">Company Profile Not Found</h2>
        <p className="text-gray-600">The company profile you're looking for doesn't exist.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4">
      <CompanyProfileCover 
        profile={profile}
        isCompanyMaster={isCompanyMaster}
        followersCount={followersCount}
        onProfileUpdate={handleProfileUpdate}
      />
      
      {/* Stories Section */}
      <div className="mb-6">
        <ProfileStories userId={profile.company_id} isOwnProfile={isCompanyMaster} />
      </div>
      
      <Tabs defaultValue="timeline" className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-9">
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="about">About</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="media">Media</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="channels">Channels</TabsTrigger>
          {isCompanyMaster && <TabsTrigger value="messages">Messages</TabsTrigger>}
          {isCompanyMaster && <TabsTrigger value="notifications">Notifications</TabsTrigger>}
          {isCompanyMaster && <TabsTrigger value="admin">Admin</TabsTrigger>}
        </TabsList>
        
        <TabsContent value="timeline" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <ProfileTimeline 
                userId={profile.company_id} 
                isOwnProfile={isCompanyMaster} 
                currentUserProfile={{
                  id: profile.company_id,
                  username: profile.company_name.toLowerCase().replace(/\s+/g, ''),
                  display_name: profile.company_name,
                  profile_picture_url: profile.logo_url
                }}
              />
            </div>
            <div className="space-y-6">
              <CompanyProfileAbout profile={profile} />
              <ProfileMediaUpload userId={profile.company_id} isOwnProfile={isCompanyMaster} />
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="about" className="mt-6">
          <CompanyProfileAbout profile={profile} />
        </TabsContent>
        
        <TabsContent value="team" className="mt-6">
          <CompanyRoleManager companyId={profile.company_id} isCompanyMaster={isCompanyMaster} />
        </TabsContent>
        
        <TabsContent value="media" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ProfilePhotos userId={profile.company_id} isOwnProfile={isCompanyMaster} />
            <ProfileVideos userId={profile.company_id} isOwnProfile={isCompanyMaster} />
          </div>
        </TabsContent>
        
        <TabsContent value="events" className="mt-6">
          <UserEventsList userId={profile.company_id} />
        </TabsContent>
        
        <TabsContent value="channels" className="mt-6">
          <UserChannelsList userId={profile.company_id} />
        </TabsContent>
        
        {isCompanyMaster && (
          <TabsContent value="messages" className="mt-6">
            <Messages userId={profile.company_id} />
          </TabsContent>
        )}
        
        {isCompanyMaster && (
          <TabsContent value="notifications" className="mt-6">
            <Notifications userId={profile.company_id} />
          </TabsContent>
        )}
        
        {isCompanyMaster && (
          <TabsContent value="admin" className="mt-6">
            <div className="bg-card rounded-lg shadow p-6">
              <h3 className="text-2xl font-bold mb-4">Company Admin Panel</h3>
              <p className="text-muted-foreground mb-4">Administrative tools and company management.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">Team Management</h4>
                  <p className="text-sm text-muted-foreground">Manage company members and roles</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">Content Moderation</h4>
                  <p className="text-sm text-muted-foreground">Review and moderate company content</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">Analytics</h4>
                  <p className="text-sm text-muted-foreground">View company performance metrics</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">Settings</h4>
                  <p className="text-sm text-muted-foreground">Configure company settings</p>
                </div>
              </div>
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default CompanyProfile;