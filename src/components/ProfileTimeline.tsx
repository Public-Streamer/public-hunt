import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { 
  Heart, MessageCircle, Share2, Image as ImageIcon, Video, 
  MapPin, Calendar, Users, Play, Send, MoreHorizontal, Bookmark, Upload, X, Check, Loader2, Trash2, AtSign, Zap
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { useAppContext } from '@/contexts/AppContext';
import SocialPost from './SocialPost';
import MultiSelectTags from './MultiSelectTags';
import LiveStreamLogo from '@/components/ui/live-stream-logo';

interface UserProfile {
  id: string;
  username: string;
  display_name: string;
  profile_picture_url: string;
}

interface TimelinePost {
  id: string;
  content: string;
  media_url?: string;
  media_type?: 'image' | 'video';
  created_at: string;
  user_id: string;
  user_profile: UserProfile;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  is_liked: boolean;
  is_bookmarked: boolean;
  type: 'post' | 'event' | 'channel' | 'milestone';
  metadata?: {
    event_id?: string;
    channel_id?: string;
    location?: string;
    attendees?: number;
  };
  channel?: {
    id: string;
    name: string;
  };
  event?: {
    id: string;
    name: string;
  };
  taggedUsers?: {
    id: string;
    name: string;
    username: string;
  }[];
}

interface Comment {
  id: string;
  content: string;
  user_profile: UserProfile;
  created_at: string;
  likes_count: number;
  is_liked: boolean;
}

interface ProfileTimelineProps {
  userId: string;
  isOwnProfile: boolean;
  userProfile?: UserProfile;
}

const ProfileTimeline: React.FC<ProfileTimelineProps> = ({ userId, isOwnProfile, userProfile }) => {
  const [posts, setPosts] = useState<TimelinePost[]>([]);
  const [newPost, setNewPost] = useState('');
  const [selectedMedia, setSelectedMedia] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [locationOpen, setLocationOpen] = useState(false);
  const [locationInput, setLocationInput] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<TimelinePost | null>(null);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [expandedPost, setExpandedPost] = useState(false);
  const [userChannels, setUserChannels] = useState<any[]>([]);
  const [userEvents, setUserEvents] = useState<any[]>([]);
  const [allChannels, setAllChannels] = useState<any[]>([]);
  const [allEvents, setAllEvents] = useState<any[]>([]);
  const [selectedChannels, setSelectedChannels] = useState<any[]>([]);
  const [selectedEvents, setSelectedEvents] = useState<any[]>([]);
  const [channelOpen, setChannelOpen] = useState(false);
  const [eventOpen, setEventOpen] = useState(false);
  const [postsCache, setPostsCache] = useState<TimelinePost[]>([]);
  const [persistedPosts, setPersistedPosts] = useState<TimelinePost[]>([]);
  const [channelInput, setChannelInput] = useState<string>('');
  const [eventInput, setEventInput] = useState<string>('');
  const [taggedUsers, setTaggedUsers] = useState<any[]>([]);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [userSearchResults, setUserSearchResults] = useState<any[]>([]);
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [showGoLivePopover, setShowGoLivePopover] = useState(false);
  const [ticketPrice, setTicketPrice] = useState(0);
  const { toast } = useToast();
  const { user, userProfile: currentUserProfile } = useAppContext();
  
  // Get the appropriate user profile data
  const profileData: UserProfile = userProfile || {
    id: userId,
    username: user?.email?.split('@')[0] || 'user',
    display_name: currentUserProfile ? `${currentUserProfile.firstName || ''} ${currentUserProfile.lastName || ''}`.trim() || 'User' : 'User',
    profile_picture_url: currentUserProfile?.profilePhoto || '/placeholder.svg'
  };

  // Common locations for autocomplete
  const commonLocations = [
    'San Francisco, CA',
    'New York, NY',
    'Los Angeles, CA',
    'Chicago, IL',
    'Houston, TX',
    'Phoenix, AZ',
    'Philadelphia, PA',
    'San Antonio, TX',
    'San Diego, CA',
    'Dallas, TX',
    'Miami, FL',
    'Atlanta, GA',
    'Seattle, WA',
    'Denver, CO',
    'Boston, MA'
  ];

  useEffect(() => {
    fetchPosts();
    if (isOwnProfile) {
      fetchUserChannels();
      fetchUserEvents();
    }
    fetchAllChannels();
    fetchAllEvents();
  }, [userId, isOwnProfile]);

  const searchUsers = async (query: string) => {
    if (!query.trim()) {
      setUserSearchResults([]);
      return;
    }

    try {
      // Mock user search - in real app, search from user_profiles table
      const mockUsers = [
        { id: 'user-1', username: 'sarah_j', display_name: 'Sarah Johnson', profile_picture_url: '/placeholder.svg' },
        { id: 'user-2', username: 'mike_chen', display_name: 'Mike Chen', profile_picture_url: '/placeholder.svg' },
        { id: 'user-3', username: 'emma_w', display_name: 'Emma Wilson', profile_picture_url: '/placeholder.svg' },
        { id: 'user-4', username: 'john_doe', display_name: 'John Doe', profile_picture_url: '/placeholder.svg' },
        { id: 'user-5', username: 'jane_smith', display_name: 'Jane Smith', profile_picture_url: '/placeholder.svg' }
      ];

      const results = mockUsers.filter(user =>
        user.username.toLowerCase().includes(query.toLowerCase()) ||
        user.display_name.toLowerCase().includes(query.toLowerCase())
      ).filter(user => !taggedUsers.find(taggedUser => taggedUser.id === user.id));

      setUserSearchResults(results);
    } catch (error) {
      console.error('Error searching users:', error);
    }
  };

  const handleTagUser = (user: any) => {
    if (!taggedUsers.find(u => u.id === user.id)) {
      setTaggedUsers(prev => [...prev, user]);
    }
    setShowUserSearch(false);
    setUserSearchTerm('');
    setUserSearchResults([]);
  };

  const removeTaggedUser = (userId: string) => {
    setTaggedUsers(prev => prev.filter(user => user.id !== userId));
  };

  const fetchUserChannels = async () => {
    try {
      const { data, error } = await supabase
        .from('channels')
        .select('*')
        .eq('user_id', userId);
      
      if (error) throw error;
      setUserChannels(data || []);
    } catch (error) {
      console.error('Error fetching user channels:', error);
    }
  };

  const fetchAllChannels = async () => {
    try {
      const { data, error } = await supabase
        .from('channels')
        .select('*')
        .limit(20);
      
      if (error) throw error;
      setAllChannels(data || []);
    } catch (error) {
      console.error('Error fetching all channels:', error);
    }
  };

  const fetchUserEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('created_by', userId);
      
      if (error) throw error;
      setUserEvents(data || []);
    } catch (error) {
      console.error('Error fetching user events:', error);
    }
  };

  const fetchAllEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .limit(20);
      
      if (error) throw error;
      setAllEvents(data || []);
    } catch (error) {
      console.error('Error fetching all events:', error);
    }
  };

  const fetchPosts = async () => {
    try {
      // Check if we have cached posts first
      if (persistedPosts.length > 0) {
        setPosts(persistedPosts);
        setLoading(false);
        return;
      }

      // Mock timeline posts with different types
      const mockPosts: TimelinePost[] = [
        {
          id: '1',
          content: 'Just finished an amazing livestream session! Thank you to everyone who joined. The energy was incredible! 🎉',
          media_url: '/placeholder.svg',
          media_type: 'image',
          created_at: new Date(Date.now() - 3600000).toISOString(),
          user_id: userId,
          user_profile: {
            id: profileData.id,
            display_name: profileData.display_name,
            username: profileData.username,
            profile_picture_url: profileData.profile_picture_url
          },
          likes_count: 42,
          comments_count: 8,
          shares_count: 3,
          is_liked: false,
          is_bookmarked: false,
          type: 'post'
        },
        {
          id: '2',
          content: 'Excited to announce my upcoming event! Join me for an exclusive workshop on content creation.',
          created_at: new Date(Date.now() - 7200000).toISOString(),
          user_id: userId,
          user_profile: {
            id: profileData.id,
            display_name: profileData.display_name,
            username: profileData.username,
            profile_picture_url: profileData.profile_picture_url
          },
          likes_count: 67,
          comments_count: 15,
          shares_count: 12,
          is_liked: true,
          is_bookmarked: false,
          type: 'event',
          metadata: {
            event_id: 'event-1',
            location: 'San Francisco, CA',
            attendees: 150
          },
          event: {
            id: 'event-1',
            name: 'Content Creation Workshop'
          }
        },
        {
          id: '3',
          content: 'Behind the scenes of today\'s photo shoot! Creating content is so much fun when you have the right team.',
          media_url: '/placeholder.svg',
          media_type: 'video',
          created_at: new Date(Date.now() - 14400000).toISOString(),
          user_id: userId,
          user_profile: {
            id: profileData.id,
            display_name: profileData.display_name,
            username: profileData.username,
            profile_picture_url: profileData.profile_picture_url
          },
          likes_count: 89,
          comments_count: 23,
          shares_count: 7,
          is_liked: false,
          is_bookmarked: true,
          type: 'post',
          channel: {
            id: 'channel-1',
            name: 'Photography Channel'
          }
        },
        {
          id: '4',
          content: '🎉 Milestone achieved! Just reached 10,000 followers! Thank you all for your amazing support.',
          created_at: new Date(Date.now() - 86400000).toISOString(),
          user_id: userId,
          user_profile: {
            id: profileData.id,
            display_name: profileData.display_name,
            username: profileData.username,
            profile_picture_url: profileData.profile_picture_url
          },
          likes_count: 234,
          comments_count: 45,
          shares_count: 18,
          is_liked: true,
          is_bookmarked: false,
          type: 'milestone',
          taggedUsers: [
            {
              id: 'user-1',
              name: 'John Doe',
              username: 'johndoe'
            },
            {
              id: 'user-2',
              name: 'Jane Smith',
              username: 'janesmith'
            }
          ]
        }
      ];
      
      setPosts(mockPosts);
      setPersistedPosts(mockPosts); // Cache the posts
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast({
        title: 'Error',
        description: 'Failed to load timeline posts',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async (postId: string) => {
    // Mock comments
    const mockComments: Comment[] = [
      {
        id: '1',
        content: 'Amazing content! Keep up the great work!',
        user_profile: {
          id: 'user-sarah',
          display_name: 'Sarah Johnson',
          username: 'sarah_j',
          profile_picture_url: '/placeholder.svg'
        },
        created_at: new Date(Date.now() - 1800000).toISOString(),
        likes_count: 5,
        is_liked: false
      },
      {
        id: '2',
        content: 'This is so inspiring! Thank you for sharing.',
        user_profile: {
          id: 'user-mike',
          display_name: 'Mike Chen',
          username: 'mike_chen',
          profile_picture_url: '/placeholder.svg'
        },
        created_at: new Date(Date.now() - 900000).toISOString(),
        likes_count: 3,
        is_liked: true
      }
    ];
    setComments(mockComments);
  };

  const handleCreatePost = async () => {
    if (!newPost.trim() && !selectedMedia) return;

    setUploading(true);
    try {
      let mediaUrl: string | undefined;
      let mediaType: 'image' | 'video' | undefined;

      if (selectedMedia) {
        // Mock upload - in real app, upload to Supabase storage
        mediaUrl = URL.createObjectURL(selectedMedia);
        mediaType = selectedMedia.type.startsWith('image/') ? 'image' : 'video';
      }

      // Get full channel and event objects
      const selectedChannelData = selectedChannels && selectedChannels[0] ? 
        (userChannels.find(c => c.id === selectedChannels[0].id) || allChannels.find(c => c.id === selectedChannels[0].id)) : 
        undefined;
      
      const selectedEventData = selectedEvents && selectedEvents[0] ? 
        (userEvents.find(e => e.id === selectedEvents[0].id) || allEvents.find(e => e.id === selectedEvents[0].id)) : 
        undefined;

      const newPostData: TimelinePost = {
        id: Date.now().toString(),
        content: newPost,
        media_url: mediaUrl,
        media_type: mediaType,
        created_at: new Date().toISOString(),
        user_id: userId,
        user_profile: {
          id: profileData.id,
          display_name: profileData.display_name,
          username: profileData.username,
          profile_picture_url: profileData.profile_picture_url
        },
        likes_count: 0,
        comments_count: 0,
        shares_count: 0,
        is_liked: false,
        is_bookmarked: false,
        type: selectedChannels && selectedChannels.length > 0 ? 'channel' : selectedEvents && selectedEvents.length > 0 ? 'event' : 'post',
        metadata: {
          ...(selectedLocation && { location: selectedLocation }),
          ...(selectedChannels && selectedChannels[0] && { channel_id: selectedChannels[0].id }),
          ...(selectedEvents && selectedEvents[0] && { event_id: selectedEvents[0].id })
        },
        // Add structured data for SocialPost component
        channel: selectedChannelData ? {
          id: selectedChannelData.id,
          name: selectedChannelData.name
        } : undefined,
        event: selectedEventData ? {
          id: selectedEventData.id,
          name: selectedEventData.name
        } : undefined,
        taggedUsers: taggedUsers.map(user => ({
          id: user.id,
          name: user.display_name,
          username: user.username
        }))
      };

      const updatedPosts = [newPostData, ...posts];
      setPosts(updatedPosts);
      setPersistedPosts(updatedPosts); // Update cache
      setNewPost('');
      setSelectedMedia(null);
      setMediaPreview(null);
      setSelectedLocation('');
      setSelectedChannels([]);
      setSelectedEvents([]);
      setTaggedUsers([]);
      setExpandedPost(false);
      
      toast({
        title: 'Success',
        description: 'Post created successfully!'
      });
    } catch (error) {
      console.error('Error creating post:', error);
      toast({
        title: 'Error',
        description: 'Failed to create post',
        variant: 'destructive'
      });
    } finally {
      setUploading(false);
    }
  };

  const handleMediaUpload = (file: File, type: 'image' | 'video') => {
    if (file) {
      setSelectedMedia(file);
      setMediaPreview(URL.createObjectURL(file));
      toast({
        title: 'Media selected',
        description: `${type} ready to upload`
      });
    }
  };

  const handleRemoveMedia = () => {
    setSelectedMedia(null);
    setMediaPreview(null);
  };

  const getCurrentLocation = async (): Promise<string> => {
    return new Promise((resolve) => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            try {
              const response = await fetch(
                `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${position.coords.latitude}&longitude=${position.coords.longitude}&localityLanguage=en`
              );
              const data = await response.json();
              resolve(data.city || data.locality || 'Live Online');
            } catch (error) {
              resolve('Live Online');
            }
          },
          () => resolve('Live Online')
        );
      } else {
        resolve('Live Online');
      }
    });
  };

  const handleGoLiveSolo = async () => {
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) {
        toast({ 
          title: "Authentication Required", 
          description: "You must be logged in to go live.", 
          variant: "destructive" 
        });
        return;
      }

      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const currentTime = now.toTimeString().slice(0, 5);
      const location = selectedLocation || await getCurrentLocation();
      
      // Auto-populate event data
      const eventData = {
        name: `${profileData.display_name}'s Live Stream`,
        description: newPost || `Join ${profileData.display_name} for an exclusive live streaming session!`,
        date: today,
        time: currentTime,
        location: location,
        category: 'Live Stream',
        ticket_price: ticketPrice,
        media_urls: selectedMedia ? [URL.createObjectURL(selectedMedia)] : [],
        is_live: true,
        created_by: userData.user.id,
        channel_id: selectedChannels && selectedChannels[0] ? selectedChannels[0].id : null
      };

      // Create the event
      const { data: eventResult, error: eventError } = await supabase
        .from('events')
        .insert(eventData)
        .select()
        .single();

      if (eventError) throw eventError;

      // Create a corresponding post about the live event
      const livePost = {
        content: newPost || `🔴 LIVE NOW: ${eventData.name}`,
        media_url: selectedMedia ? URL.createObjectURL(selectedMedia) : undefined,
        media_type: selectedMedia?.type.startsWith('image/') ? 'image' as const : 'video' as const,
        created_at: new Date().toISOString(),
        user_id: userId,
        user_profile: {
          id: profileData.id,
          display_name: profileData.display_name,
          username: profileData.username,
          profile_picture_url: profileData.profile_picture_url
        },
        likes_count: 0,
        comments_count: 0,
        shares_count: 0,
        is_liked: false,
        is_bookmarked: false,
        type: 'event' as const,
        metadata: {
          event_id: eventResult.id,
          location: location,
          ...(selectedChannels && selectedChannels[0] && { channel_id: selectedChannels[0].id })
        }
      };

      // Add the live post to the timeline
      setPosts(prev => [{
        ...livePost,
        id: (Date.now() + 1).toString()
      }, ...prev]);

      // Clear the post form
      setNewPost('');
      setSelectedMedia(null);
      setMediaPreview(null);
      setSelectedLocation('');
      setSelectedChannels([]);
      setSelectedEvents([]);
      setTaggedUsers([]);
      setExpandedPost(false);
      setShowGoLivePopover(false);
      setTicketPrice(0);

      toast({
        title: 'You\'re Live!',
        description: 'Your solo livestream is now active and visible across all feeds.',
        duration: 5000
      });

      // Navigate to the event page after a short delay
      setTimeout(() => {
        window.location.href = `/event/${eventResult.id}`;
      }, 2000);

    } catch (error) {
      console.error('Error creating solo live stream:', error);
      toast({
        title: 'Error',
        description: 'Failed to start live stream. Please try again.',
        variant: 'destructive'
      });
    }
  };


  const handleLike = async (postId: string) => {
    const updatePost = (prev: TimelinePost[]) => prev.map(post => 
      post.id === postId 
        ? { 
            ...post, 
            is_liked: !post.is_liked, 
            likes_count: post.is_liked ? post.likes_count - 1 : post.likes_count + 1 
          }
        : post
    );
    
    setPosts(updatePost);
    setPersistedPosts(updatePost);
  };

  const handleBookmark = async (postId: string) => {
    const updatePost = (prev: TimelinePost[]) => prev.map(post => 
      post.id === postId 
        ? { ...post, is_bookmarked: !post.is_bookmarked }
        : post
    );
    
    setPosts(updatePost);
    setPersistedPosts(updatePost);
  };

  const handleViewComments = (post: TimelinePost) => {
    setSelectedPost(post);
    fetchComments(post.id);
    setShowComments(true);
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !selectedPost) return;

    const comment: Comment = {
      id: Date.now().toString(),
      content: newComment,
      user_profile: {
        id: profileData.id,
        display_name: profileData.display_name,
        username: profileData.username,
        profile_picture_url: profileData.profile_picture_url
      },
      created_at: new Date().toISOString(),
      likes_count: 0,
      is_liked: false
    };

    setComments(prev => [...prev, comment]);
    setNewComment('');
    
    // Update comment count
    const updatePost = (prev: TimelinePost[]) => prev.map(post => 
      post.id === selectedPost.id 
        ? { ...post, comments_count: post.comments_count + 1 }
        : post
    );
    
    setPosts(updatePost);
    setPersistedPosts(updatePost);
  };

  const handleDeletePost = async (postId: string) => {
    try {
      // For mock posts, skip database deletion
      // In a real app, you would delete from the database here
      
      // Update the local state
      const updatePost = (prev: TimelinePost[]) => prev.filter(post => post.id !== postId);
      setPosts(updatePost);
      setPersistedPosts(updatePost);

      toast({
        title: 'Success',
        description: 'Post deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting post:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete post',
        variant: 'destructive'
      });
    }
  };

  const handleShare = async (post: TimelinePost) => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Post by ${post.user_profile.display_name}`,
          text: post.content,
          url: window.location.href
        });
      } else {
        navigator.clipboard.writeText(window.location.href);
        toast({
          title: 'Link copied',
          description: 'Post link copied to clipboard'
        });
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleEditPost = async (postId: string, newContent: string, mediaFile?: File | null) => {
    try {
      let mediaUrl: string | undefined = undefined;
      
      // Handle media file if provided (for real uploads in actual app)
      if (mediaFile) {
        // For mock posts, just create object URL
        mediaUrl = URL.createObjectURL(mediaFile);
      }
      
      // For mock posts, skip database update
      // In a real app, you would update the database here

      // Update the local state
      const updatePost = (prev: TimelinePost[]) => prev.map(post => 
        post.id === postId 
          ? { 
              ...post, 
              content: newContent,
              media_url: mediaFile === null ? undefined : (mediaUrl || post.media_url), // Remove media if null, keep existing or use new
              media_type: mediaFile === null ? undefined : (mediaFile ? (mediaFile.type.startsWith('image/') ? 'image' : 'video') : post.media_type)
            }
          : post
      );
      
      setPosts(updatePost);
      setPersistedPosts(updatePost);

      toast({
        title: 'Success',
        description: 'Post updated successfully'
      });
    } catch (error) {
      console.error('Error updating post:', error);
      toast({
        title: 'Error',
        description: 'Failed to update post',
        variant: 'destructive'
      });
    }
  };


  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'event': return <Calendar className="w-4 h-4" />;
      case 'channel': return <Play className="w-4 h-4" />;
      case 'milestone': return <Users className="w-4 h-4" />;
      default: return null;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'event': return 'bg-blue-500';
      case 'channel': return 'bg-purple-500';
      case 'milestone': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Loading timeline...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Create Post */}
      {isOwnProfile && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex space-x-4">
              <Avatar>
                <AvatarImage src={profileData.profile_picture_url} />
                <AvatarFallback>{profileData.display_name[0]}</AvatarFallback>
              </Avatar>
               <div className="flex-1">
                 {/* Move text entry below media when media is uploaded */}
                 {mediaPreview && (
                   <div className="relative mb-4">
                     <Button
                       variant="secondary"
                       size="sm"
                       onClick={handleRemoveMedia}
                       className="absolute top-2 right-2 z-10"
                     >
                       <X className="w-4 h-4" />
                     </Button>
                     {selectedMedia?.type.startsWith('image/') ? (
                       <img
                         src={mediaPreview}
                         alt="Preview"
                         className="w-full max-h-64 object-cover rounded-lg"
                       />
                     ) : (
                       <video
                         src={mediaPreview}
                         controls
                         className="w-full max-h-64 object-cover rounded-lg"
                       />
                     )}
                   </div>
                 )}
                 
                 <Textarea
                   placeholder="What's on your mind?"
                   value={newPost}
                   onChange={(e) => setNewPost(e.target.value)}
                   onFocus={() => setExpandedPost(true)}
                   className={`resize-none border-0 focus:ring-0 text-lg transition-all duration-300 ${
                     expandedPost ? 'min-h-[120px]' : 'min-h-[60px]'
                   }`}
                 />
                 
                 {/* Expanded Post Creation Template */}
                 {expandedPost && (
                   <div className="mt-4 space-y-4">
                    
                    {/* Selection Displays */}
                    <div className="space-y-2">
                      {selectedLocation && (
                        <div className="flex items-center text-sm text-muted-foreground bg-muted p-2 rounded">
                          <MapPin className="w-4 h-4 mr-2" />
                          <span>{selectedLocation}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedLocation('')}
                            className="ml-auto h-6 w-6 p-0"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      )}
                      
                       {selectedChannels && selectedChannels.map(channel => (
                         <div key={channel.id} className="flex items-center text-sm text-muted-foreground bg-muted p-2 rounded">
                           <Play className="w-4 h-4 mr-2" />
                           <span>
                             {userChannels.find(c => c.id === channel.id)?.name || 
                              allChannels.find(c => c.id === channel.id)?.name || 
                              channel.name}
                           </span>
                           <Button
                             variant="ghost"
                             size="sm"
                             onClick={() => setSelectedChannels(channels => channels.filter(c => c.id !== channel.id))}
                             className="ml-auto h-6 w-6 p-0"
                           >
                             <X className="w-3 h-3" />
                           </Button>
                         </div>
                       ))}
                       
                       {selectedEvents && selectedEvents.map(event => (
                         <div key={event.id} className="flex items-center text-sm text-muted-foreground bg-muted p-2 rounded">
                           <Calendar className="w-4 h-4 mr-2" />
                           <span>
                             {userEvents.find(e => e.id === event.id)?.name || 
                              allEvents.find(e => e.id === event.id)?.name || 
                              event.name}
                           </span>
                           <Button
                             variant="ghost"
                             size="sm"
                             onClick={() => setSelectedEvents(events => events.filter(e => e.id !== event.id))}
                             className="ml-auto h-6 w-6 p-0"
                           >
                             <X className="w-3 h-3" />
                           </Button>
                         </div>
                       ))}
                    </div>
                    
                     {/* Tagged Users Display */}
                     {taggedUsers.length > 0 && (
                       <div className="flex flex-wrap gap-2 mb-4">
                         {taggedUsers.map((user) => (
                           <Badge key={user.id} variant="secondary" className="flex items-center gap-1">
                             <AtSign className="w-3 h-3" />
                             {user.display_name}
                             <Button
                               variant="ghost"
                               size="sm"
                               onClick={() => removeTaggedUser(user.id)}
                               className="h-4 w-4 p-0 ml-1"
                             >
                               <X className="w-3 h-3" />
                             </Button>
                           </Badge>
                         ))}
                       </div>
                     )}
                     
                     {/* Action Buttons */}
                     <div className="flex flex-wrap gap-2 p-4 bg-muted/50 rounded-lg">
                       {/* Photo Upload */}
                       <div>
                         <Input
                           type="file"
                           accept="image/*,video/*"
                           onChange={(e) => {
                             const file = e.target.files?.[0];
                             if (file) {
                               const type = file.type.startsWith('image/') ? 'image' : 'video';
                               handleMediaUpload(file, type);
                             }
                           }}
                           className="hidden"
                           id="photo-upload"
                         />
                         <Button variant="ghost" size="sm" asChild>
                           <label htmlFor="photo-upload" className="cursor-pointer">
                             <ImageIcon className="w-4 h-4 mr-2" />
                             Photo/Video
                           </label>
                         </Button>
                       </div>
                       
                        {/* Location Selector */}
                        <Popover open={locationOpen} onOpenChange={setLocationOpen}>
                         <PopoverTrigger asChild>
                           <Button variant="ghost" size="sm">
                             <MapPin className="w-4 h-4 mr-2" />
                             Location
                           </Button>
                         </PopoverTrigger>
                         <PopoverContent className="w-80">
                           <Command>
                             <CommandInput 
                               placeholder="Type any location..." 
                               value={locationInput}
                               onValueChange={setLocationInput}
                             />
                             <CommandList>
                               <CommandEmpty>
                                 {locationInput && (
                                   <div className="p-2">
                                     <Button 
                                       variant="ghost" 
                                       className="w-full justify-start"
                                       onClick={() => {
                                         setSelectedLocation(locationInput);
                                         setLocationOpen(false);
                                         setLocationInput('');
                                       }}
                                     >
                                       <MapPin className="w-4 h-4 mr-2" />
                                       Use "{locationInput}"
                                     </Button>
                                   </div>
                                 )}
                               </CommandEmpty>
                               <CommandGroup>
                                 {commonLocations
                                   .filter(location => 
                                     location.toLowerCase().includes(locationInput.toLowerCase())
                                   )
                                   .map((location) => (
                                   <CommandItem
                                     key={location}
                                     value={location}
                                     onSelect={() => {
                                       setSelectedLocation(location);
                                       setLocationOpen(false);
                                       setLocationInput('');
                                     }}
                                   >
                                     <Check
                                       className={`mr-2 h-4 w-4 ${
                                         selectedLocation === location ? 'opacity-100' : 'opacity-0'
                                       }`}
                                     />
                                     {location}
                                   </CommandItem>
                                 ))}
                               </CommandGroup>
                             </CommandList>
                           </Command>
                         </PopoverContent>
                        </Popover>
                       
                        {/* Event Selector - moved to left of channel */}
                        <Popover open={eventOpen} onOpenChange={setEventOpen}>
                          <PopoverTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Calendar className="w-4 h-4 mr-2" />
                              Event
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-80">
                            <Command>
                              <CommandInput 
                                placeholder="Search or type event name..." 
                                value={eventInput}
                                onValueChange={setEventInput}
                              />
                              <CommandList>
                                <CommandEmpty>
                                  {eventInput && (
                                    <div className="p-2">
                                      <Button 
                                        variant="ghost" 
                                        className="w-full justify-start"
                                        onClick={() => {
                                          setSelectedEvents([{ id: 'new', name: eventInput }]);
                                          setEventOpen(false);
                                          setEventInput('');
                                        }}
                                      >
                                        <Calendar className="w-4 h-4 mr-2" />
                                        Use "{eventInput}"
                                      </Button>
                                    </div>
                                  )}
                                </CommandEmpty>
                                {userEvents.length > 0 && (
                                  <CommandGroup heading="Your Events">
                                    {userEvents
                                      .filter(event => 
                                        event.name.toLowerCase().includes(eventInput.toLowerCase())
                                      )
                                      .map((event) => (
                                      <CommandItem
                                        key={event.id}
                                        value={event.name}
                                        onSelect={() => {
                                          setSelectedEvents([{ id: event.id, name: event.name }]);
                                          setEventOpen(false);
                                          setEventInput('');
                                        }}
                                      >
                                        <Check
                                          className={`mr-2 h-4 w-4 ${
                                            selectedEvents?.some(e => e.id === event.id) ? 'opacity-100' : 'opacity-0'
                                          }`}
                                        />
                                        {event.name}
                                        <Badge variant="outline" className="ml-2">
                                          {event.is_live ? 'Live' : 'Scheduled'}
                                        </Badge>
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                )}
                                {allEvents.length > 0 && (
                                  <CommandGroup heading="All Events">
                                    {allEvents
                                      .filter(event => 
                                        event.name.toLowerCase().includes(eventInput.toLowerCase()) &&
                                        !userEvents.find(ue => ue.id === event.id)
                                      )
                                      .map((event) => (
                                      <CommandItem
                                        key={event.id}
                                        value={event.name}
                                        onSelect={() => {
                                          setSelectedEvents([{ id: event.id, name: event.name }]);
                                          setEventOpen(false);
                                          setEventInput('');
                                        }}
                                      >
                                        <Check
                                          className={`mr-2 h-4 w-4 ${
                                            selectedEvents?.some(e => e.id === event.id) ? 'opacity-100' : 'opacity-0'
                                          }`}
                                        />
                                        {event.name}
                                        <Badge variant="outline" className="ml-2">
                                          {event.is_live ? 'Live' : 'Scheduled'}
                                        </Badge>
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                )}
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                       
                        {/* Channel Selector */}
                        <Popover open={channelOpen} onOpenChange={setChannelOpen}>
                          <PopoverTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Play className="w-4 h-4 mr-2" />
                              Channel
                            </Button>
                          </PopoverTrigger>
                         <PopoverContent className="w-80">
                           <Command>
                             <CommandInput 
                               placeholder="Search or type channel name..." 
                               value={channelInput}
                               onValueChange={setChannelInput}
                             />
                             <CommandList>
                               <CommandEmpty>
                                 {channelInput && (
                                   <div className="p-2">
                                     <Button 
                                       variant="ghost" 
                                       className="w-full justify-start"
                                       onClick={() => {
                                         setSelectedChannels([{ id: 'new', name: channelInput }]);
                                         setChannelOpen(false);
                                         setChannelInput('');
                                       }}
                                     >
                                       <Play className="w-4 h-4 mr-2" />
                                       Use "{channelInput}"
                                     </Button>
                                   </div>
                                 )}
                               </CommandEmpty>
                               {userChannels.length > 0 && (
                                 <CommandGroup heading="Your Channels">
                                   {userChannels
                                     .filter(channel => 
                                       channel.name.toLowerCase().includes(channelInput.toLowerCase())
                                     )
                                     .map((channel) => (
                                     <CommandItem
                                       key={channel.id}
                                       value={channel.name}
                                       onSelect={() => {
                                          setSelectedChannels([{ id: channel.id, name: channel.name }]);
                                         setChannelOpen(false);
                                         setChannelInput('');
                                       }}
                                     >
                                       <Check
                                         className={`mr-2 h-4 w-4 ${
                                            selectedChannels?.some(c => c.id === channel.id) ? 'opacity-100' : 'opacity-0'
                                         }`}
                                       />
                                       {channel.name}
                                     </CommandItem>
                                   ))}
                                 </CommandGroup>
                               )}
                               {allChannels.length > 0 && (
                                 <CommandGroup heading="All Channels">
                                   {allChannels
                                     .filter(channel => 
                                       channel.name.toLowerCase().includes(channelInput.toLowerCase()) &&
                                       !userChannels.find(uc => uc.id === channel.id)
                                     )
                                     .map((channel) => (
                                     <CommandItem
                                       key={channel.id}
                                       value={channel.name}
                                       onSelect={() => {
                                         setSelectedChannels([{ id: channel.id, name: channel.name }]);
                                         setChannelOpen(false);
                                         setChannelInput('');
                                       }}
                                     >
                                       <Check
                                         className={`mr-2 h-4 w-4 ${
                                           selectedChannels?.some(c => c.id === channel.id) ? 'opacity-100' : 'opacity-0'
                                         }`}
                                       />
                                       {channel.name}
                                     </CommandItem>
                                   ))}
                                 </CommandGroup>
                               )}
                             </CommandList>
                           </Command>
                         </PopoverContent>
                        </Popover>
                        
                         {/* Tag People Button */}
                         <Popover open={showUserSearch} onOpenChange={setShowUserSearch}>
                           <PopoverTrigger asChild>
                             <Button variant="ghost" size="sm">
                               <AtSign className="w-4 h-4 mr-2" />
                               Tag People
                             </Button>
                           </PopoverTrigger>
                           <PopoverContent className="w-80">
                             <Command>
                               <CommandInput 
                                 placeholder="Search for people to tag..." 
                                 value={userSearchTerm}
                                 onValueChange={(value) => {
                                   setUserSearchTerm(value);
                                   searchUsers(value);
                                 }}
                               />
                               <CommandList>
                                 <CommandEmpty>
                                   {userSearchTerm ? 'No users found' : 'Start typing to search for people'}
                                 </CommandEmpty>
                                 <CommandGroup>
                                   {userSearchResults.map((user) => (
                                     <CommandItem
                                       key={user.id}
                                       value={user.username}
                                       onSelect={() => handleTagUser(user)}
                                     >
                                       <div className="flex items-center gap-2">
                                         <Avatar className="w-6 h-6">
                                           <AvatarImage src={user.profile_picture_url} />
                                           <AvatarFallback>{user.display_name[0]}</AvatarFallback>
                                         </Avatar>
                                         <div>
                                           <p className="font-medium">{user.display_name}</p>
                                           <p className="text-sm text-muted-foreground">@{user.username}</p>
                                         </div>
                                       </div>
                                     </CommandItem>
                                   ))}
                                 </CommandGroup>
                               </CommandList>
                             </Command>
                           </PopoverContent>
                         </Popover>
                         
                         {/* Go Live Right Now Solo Button */}
                         <Popover open={showGoLivePopover} onOpenChange={setShowGoLivePopover}>
                            <PopoverTrigger asChild>
                              <Button variant="ghost" size="sm" className="bg-red-600 hover:bg-red-700 text-white">
                                <LiveStreamLogo size="sm" className="mr-2" />
                                <Zap className="w-4 h-4 mr-2" />
                                Go Live Right Now Solo
                              </Button>
                            </PopoverTrigger>
                           <PopoverContent className="w-80 p-4">
                             <div className="space-y-4">
                               <div className="text-center">
                                 <h3 className="font-semibold text-lg mb-2">Set Event Price</h3>
                                 <p className="text-sm text-muted-foreground mb-4">
                                   Choose the admission cost for your solo livestream
                                 </p>
                               </div>
                               
                               <div className="space-y-3">
                                 <div className="flex items-center justify-between">
                                   <span className="text-sm font-medium">Price: ${ticketPrice.toFixed(2)}</span>
                                   <Button 
                                     variant="outline" 
                                     size="sm"
                                     onClick={() => setTicketPrice(0)}
                                   >
                                     Free
                                   </Button>
                                 </div>
                                 
                                 <div className="px-3">
                                   <input
                                     type="range"
                                     min="0"
                                     max="100"
                                     step="0.01"
                                     value={ticketPrice}
                                     onChange={(e) => setTicketPrice(parseFloat(e.target.value))}
                                     className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                   />
                                   <div className="flex justify-between text-xs text-muted-foreground mt-1">
                                     <span>$0</span>
                                     <span>$100</span>
                                   </div>
                                 </div>
                               </div>
                               
                               <div className="flex gap-2 pt-2">
                                 <Button 
                                   variant="outline" 
                                   size="sm" 
                                   onClick={() => setShowGoLivePopover(false)}
                                   className="flex-1"
                                 >
                                   Cancel
                                 </Button>
                                  <Button 
                                    size="sm" 
                                    onClick={handleGoLiveSolo}
                                    className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                                  >
                                    <LiveStreamLogo size="sm" className="mr-2" />
                                    <Zap className="w-4 h-4 mr-2" />
                                    Go Live Now
                                  </Button>
                               </div>
                             </div>
                           </PopoverContent>
                         </Popover>
                     </div>
                  </div>
                )}
                
                {/* Post Button */}
                <div className="flex justify-between items-center mt-4">
                  {expandedPost && (
                    <Button 
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setExpandedPost(false);
                        setNewPost('');
                        setSelectedMedia(null);
                        setMediaPreview(null);
                         setSelectedLocation('');
                          setSelectedChannels([]);
                          setSelectedEvents([]);
                         setLocationInput('');
                         setChannelInput('');
                         setEventInput('');
                       }}
                    >
                      Cancel
                    </Button>
                  )}
                  <Button 
                    onClick={handleCreatePost} 
                    disabled={(!newPost.trim() && !selectedMedia) || uploading}
                    className="ml-auto"
                  >
                    {uploading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4 mr-2" />
                    )}
                    {uploading ? 'Posting...' : 'Post'}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Timeline Posts */}
      {posts.map((post) => (
        <SocialPost
          key={post.id}
          postId={post.id}
          author={{
            name: post.user_profile.display_name,
            avatar: post.user_profile.profile_picture_url,
            username: post.user_profile.username
          }}
          content={post.content}
          timestamp={new Date(post.created_at).toLocaleDateString() + ' · ' + new Date(post.created_at).toLocaleTimeString()}
          likes={post.likes_count}
          comments={post.comments_count}
          shares={post.shares_count}
          media_url={post.media_url}
          media_type={post.media_type}
          channels={post.channel ? [post.channel] : []}
          events={post.event ? [post.event] : []}
          taggedUsers={post.taggedUsers}
          isLiked={post.is_liked}
          isOwnPost={post.user_id === user?.id}
          onLike={handleLike}
          onComment={(postId, comment) => {
            // Set the selected post and comment, then call handleAddComment
            setSelectedPost(post);
            setNewComment(comment);
            handleAddComment();
          }}
          onShare={(postId) => {
            // Find the post and call handleShare
            const foundPost = posts.find(p => p.id === postId);
            if (foundPost) handleShare(foundPost);
          }}
          onEdit={handleEditPost}
          onDelete={handleDeletePost}
        />
      ))}

      {/* Comments Dialog */}
      <Dialog open={showComments} onOpenChange={setShowComments}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Comments</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {comments.map((comment) => (
              <div key={comment.id} className="flex space-x-3">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={comment.user_profile.profile_picture_url} />
                  <AvatarFallback>{comment.user_profile.display_name[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="bg-muted p-3 rounded-lg">
                    <h5 className="font-semibold text-sm">{comment.user_profile.display_name}</h5>
                    <p className="text-sm">{comment.content}</p>
                  </div>
                  <div className="flex items-center space-x-4 mt-1">
                    <span className="text-xs text-muted-foreground">
                      {new Date(comment.created_at).toLocaleTimeString()}
                    </span>
                    <Button variant="ghost" size="sm" className="text-xs">
                      <Heart className="w-3 h-3 mr-1" />
                      {comment.likes_count}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            
            <div className="flex space-x-3 mt-4">
              <Avatar className="w-8 h-8">
                <AvatarImage src={profileData.profile_picture_url} />
                <AvatarFallback>{profileData.display_name[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <Textarea
                  placeholder="Write a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="min-h-[60px] resize-none"
                />
                <div className="flex justify-end mt-2">
                  <Button onClick={handleAddComment} disabled={!newComment.trim()}>
                    <Send className="w-4 h-4 mr-2" />
                    Comment
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProfileTimeline;