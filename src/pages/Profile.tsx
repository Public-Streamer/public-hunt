import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAppContext } from "@/contexts/AppContext";
import ProfileCover from "@/components/ProfileCover";
import ProfileNewsfeedTab from "@/components/ProfileNewsfeedTab";
import ProfileAbout from "@/components/ProfileAbout";
import ProfilePhotos from "@/components/ProfilePhotos";
import ProfileVideos from "@/components/ProfileVideos";
import UserChannelsList from "@/components/UserChannelsList";
import UserEventsList from "@/components/UserEventsList";
import ProfileStories from "@/components/ProfileStories";
import ProfileFriends from "@/components/ProfileFriends";
import ProfileTimeline from "@/components/ProfileTimeline";
import ProfileMediaUpload from "@/components/ProfileMediaUpload";
import Messages from "@/components/Messages";
import Notifications from "@/components/Notifications";
import BottomSlidePanel from "@/components/BottomSlidePanel";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/integrations/supabase/types";

type currentUserProfile = Database["public"]["Tables"]["user_profiles"]["Row"];

const Profile: React.FC = () => {
  const { userId } = useParams<{ userId?: string }>();
  const [friendsCount, setFriendsCount] = useState(0);
  const [followersCount, setFollowersCount] = useState(0);
  const { user, isAuthenticated, authLoaded } = useAppContext();
  const queryClient = useQueryClient();

  console.log("from profile: user", user);

  // React Query to fetch profile data
  const {
    data: profile,
    isLoading: loading,
    refetch,
  } = useQuery({
    queryKey: ["profile", userId || user?.id],
    queryFn: async () => {
      const targetUserId = userId || user?.id;
      if (!targetUserId) return null;

      const { data, error } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("user_id", targetUserId)
        .maybeSingle();

      return data;
    },
    enabled: !!(userId || user?.id) && authLoaded,
    staleTime: 0,
    refetchOnWindowFocus: true,
    retry: 1,
  });

  const handleProfileUpdate = (updatedProfile: currentUserProfile) => {
    // Update the query cache with new profile data
    queryClient.setQueryData(["profile", userId || user?.id], updatedProfile);
    queryClient.invalidateQueries({
      queryKey: ["profile", userId || user?.id],
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <img src="/logo.png" className="w-24 h-24 animate-pulse" alt="Logo" />
      </div>
    );
  }
  const isOwnProfile = userId === user?.id;

  if (!authLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    window.location.href = "/login";
    return null;
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Profile Not Found</h2>
          <p className="text-muted-foreground">
            The profile you're looking for doesn't exist.
          </p>
        </div>
      </div>
    );
  }

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
          {isOwnProfile && (
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          )}
          {isOwnProfile && <TabsTrigger value="my-ads">My Ads</TabsTrigger>}
          {isOwnProfile && <TabsTrigger value="messages">Messages</TabsTrigger>}
          {isOwnProfile && (
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
          )}
          {isOwnProfile && <TabsTrigger value="admin">Admin</TabsTrigger>}
        </TabsList>

        <TabsContent value="timeline" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <ProfileTimeline
                userId={profile.id}
                isOwnProfile={isOwnProfile}
                currentUserProfile={{
                  id: profile.id,
                  username: profile.username,
                  display_name: profile.display_name,
                  profile_picture_url: profile.profile_picture_url,
                }}
              />
            </div>
            <div className="space-y-6">
              <ProfileAbout profile={profile} />
              <ProfileMediaUpload
                userId={profile.id}
                isOwnProfile={isOwnProfile}
              />
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
                  onClick={() =>
                    (window.location.href = "/advertiser-dashboard")
                  }
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Open Full Dashboard
                </button>
              </div>
              <p className="text-muted-foreground mb-4">
                Manage your advertising campaigns, track performance, and
                optimize your ad spend.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">Campaign Overview</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    View all your active campaigns and their performance
                  </p>
                  <button
                    onClick={() =>
                      (window.location.href = "/advertiser-dashboard")
                    }
                    className="text-primary hover:underline text-sm"
                  >
                    View Campaigns →
                  </button>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">Real-Time Analytics</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Track impressions, clicks, and spend in real-time
                  </p>
                  <button
                    onClick={() =>
                      (window.location.href = "/advertiser-dashboard")
                    }
                    className="text-primary hover:underline text-sm"
                  >
                    View Analytics →
                  </button>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">Create New Campaign</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Start advertising on Public Streamer
                  </p>
                  <button
                    onClick={() => (window.location.href = "/create-ad")}
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
                  onClick={() => (window.location.href = "/my-ads")}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                  View All Ads
                </button>
              </div>
              <p className="text-muted-foreground mb-4">
                Manage your advertising campaigns and view performance metrics.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">Create New Ad</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Start a new advertising campaign
                  </p>
                  <button
                    onClick={() => (window.location.href = "/create?tab=ad")}
                    className="text-primary hover:underline text-sm"
                  >
                    Create Ad Campaign →
                  </button>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">Campaign Analytics</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    View detailed performance metrics
                  </p>
                  <button
                    onClick={() => (window.location.href = "/my-ads")}
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
              <p className="text-muted-foreground mb-4">
                Administrative tools and platform management.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">User Management</h4>
                  <p className="text-sm text-muted-foreground">
                    Manage user accounts and permissions
                  </p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">Content Moderation</h4>
                  <p className="text-sm text-muted-foreground">
                    Review and moderate platform content
                  </p>
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
