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
import { 
  Heart, MessageCircle, Share2, Image as ImageIcon, Video, 
  MapPin, Calendar, Users, Play, Send, MoreHorizontal, Bookmark, Upload, X, Check, Loader2
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { useAppContext } from '@/contexts/AppContext';

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
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<TimelinePost | null>(null);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [detectingLocation, setDetectingLocation] = useState(false);
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
  }, [userId]);

  const fetchPosts = async () => {
    try {
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
          type: 'post'
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
          type: 'milestone'
        }
      ];
      setPosts(mockPosts);
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
        type: 'post',
        metadata: selectedLocation ? { location: selectedLocation } : undefined
      };

      setPosts(prev => [newPostData, ...prev]);
      setNewPost('');
      setSelectedMedia(null);
      setMediaPreview(null);
      setSelectedLocation('');
      
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

  const handleLocationDetect = async () => {
    if (!navigator.geolocation) {
      toast({
        title: 'Location not supported',
        description: 'Geolocation is not supported by this browser',
        variant: 'destructive'
      });
      return;
    }

    setDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          // Mock reverse geocoding - in real app, use a geocoding service
          const { latitude, longitude } = position.coords;
          const mockLocation = `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`;
          setSelectedLocation(mockLocation);
          toast({
            title: 'Location detected',
            description: `Location set to ${mockLocation}`
          });
        } catch (error) {
          console.error('Error getting location:', error);
          toast({
            title: 'Error',
            description: 'Failed to get location',
            variant: 'destructive'
          });
        } finally {
          setDetectingLocation(false);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        toast({
          title: 'Location access denied',
          description: 'Please allow location access or select manually',
          variant: 'destructive'
        });
        setDetectingLocation(false);
      }
    );
  };

  const handleLike = async (postId: string) => {
    setPosts(prev => prev.map(post => 
      post.id === postId 
        ? { 
            ...post, 
            is_liked: !post.is_liked, 
            likes_count: post.is_liked ? post.likes_count - 1 : post.likes_count + 1 
          }
        : post
    ));
  };

  const handleBookmark = async (postId: string) => {
    setPosts(prev => prev.map(post => 
      post.id === postId 
        ? { ...post, is_bookmarked: !post.is_bookmarked }
        : post
    ));
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
    setPosts(prev => prev.map(post => 
      post.id === selectedPost.id 
        ? { ...post, comments_count: post.comments_count + 1 }
        : post
    ));
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
                <Textarea
                  placeholder="What's on your mind?"
                  value={newPost}
                  onChange={(e) => setNewPost(e.target.value)}
                  className="min-h-[100px] resize-none border-0 focus:ring-0 text-lg"
                />
                
                {/* Media Preview */}
                {mediaPreview && (
                  <div className="mt-4 relative">
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
                
                {/* Location Display */}
                {selectedLocation && (
                  <div className="mt-2 flex items-center text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4 mr-1" />
                    <span>{selectedLocation}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedLocation('')}
                      className="ml-2 h-6 w-6 p-0"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                )}
                
                <div className="flex justify-between items-center mt-4 pt-4 border-t">
                  <div className="flex space-x-2">
                    {/* Photo Upload */}
                    <div>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleMediaUpload(file, 'image');
                        }}
                        className="hidden"
                        id="photo-upload"
                      />
                      <Button variant="ghost" size="sm" asChild>
                        <label htmlFor="photo-upload" className="cursor-pointer">
                          <ImageIcon className="w-4 h-4 mr-2" />
                          Photo
                        </label>
                      </Button>
                    </div>
                    
                    {/* Video Upload */}
                    <div>
                      <Input
                        type="file"
                        accept="video/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleMediaUpload(file, 'video');
                        }}
                        className="hidden"
                        id="video-upload"
                      />
                      <Button variant="ghost" size="sm" asChild>
                        <label htmlFor="video-upload" className="cursor-pointer">
                          <Video className="w-4 h-4 mr-2" />
                          Video
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
                        <div className="space-y-4">
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleLocationDetect}
                              disabled={detectingLocation}
                            >
                              {detectingLocation ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              ) : (
                                <MapPin className="w-4 h-4 mr-2" />
                              )}
                              Detect Location
                            </Button>
                          </div>
                          <Command>
                            <CommandInput placeholder="Search locations..." />
                            <CommandList>
                              <CommandEmpty>No locations found.</CommandEmpty>
                              <CommandGroup>
                                {commonLocations.map((location) => (
                                  <CommandItem
                                    key={location}
                                    value={location}
                                    onSelect={() => {
                                      setSelectedLocation(location);
                                      setLocationOpen(false);
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
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  <Button 
                    onClick={handleCreatePost} 
                    disabled={(!newPost.trim() && !selectedMedia) || uploading}
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
        <Card key={post.id} className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Avatar>
                  <AvatarImage src={post.user_profile.profile_picture_url} />
                  <AvatarFallback>{post.user_profile.display_name[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center space-x-2">
                    <h4 className="font-semibold">{post.user_profile.display_name}</h4>
                    {post.type !== 'post' && (
                      <Badge className={`text-white ${getTypeColor(post.type)}`}>
                        {getTypeIcon(post.type)}
                        <span className="ml-1 capitalize">{post.type}</span>
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {new Date(post.created_at).toLocaleDateString()} · {new Date(post.created_at).toLocaleTimeString()}
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          
          <CardContent className="pt-0">
            <p className="mb-4 text-lg">{post.content}</p>
            
            {post.metadata && (
              <div className="flex items-center space-x-4 mb-4 text-sm text-muted-foreground">
                {post.metadata.location && (
                  <span className="flex items-center">
                    <MapPin className="w-4 h-4 mr-1" />
                    {post.metadata.location}
                  </span>
                )}
                {post.metadata.attendees && (
                  <span className="flex items-center">
                    <Users className="w-4 h-4 mr-1" />
                    {post.metadata.attendees} attending
                  </span>
                )}
              </div>
            )}
            
            {post.media_url && (
              <div className="mb-4 rounded-lg overflow-hidden">
                {post.media_type === 'image' ? (
                  <img
                    src={post.media_url}
                    alt="Post media"
                    className="w-full h-auto max-h-96 object-cover"
                  />
                ) : (
                  <div className="relative">
                    <video
                      src={post.media_url}
                      className="w-full h-auto max-h-96 object-cover"
                      controls
                    />
                  </div>
                )}
              </div>
            )}
            
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="flex items-center space-x-6">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => handleLike(post.id)}
                  className={post.is_liked ? 'text-red-500' : ''}
                >
                  <Heart className={`w-4 h-4 mr-2 ${post.is_liked ? 'fill-current' : ''}`} />
                  {post.likes_count}
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => handleViewComments(post)}
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  {post.comments_count}
                </Button>
                <Button variant="ghost" size="sm">
                  <Share2 className="w-4 h-4 mr-2" />
                  {post.shares_count}
                </Button>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => handleBookmark(post.id)}
                className={post.is_bookmarked ? 'text-blue-500' : ''}
              >
                <Bookmark className={`w-4 h-4 ${post.is_bookmarked ? 'fill-current' : ''}`} />
              </Button>
            </div>
          </CardContent>
        </Card>
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