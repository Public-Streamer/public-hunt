import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Camera, Settings, MessageCircle, Share2, UserPlus, MapPin, Calendar, Users, Heart, Star, Upload } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import FollowButton from '@/components/FollowButton';
import SocialShareMenu from '@/components/SocialShareMenu';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import TooltipWrapper from '@/components/ui/tooltip-wrapper';

const profileFormSchema = z.object({
  display_name: z.string().min(1, 'Display name is required'),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
  location: z.string().optional(),
  website: z.string().url('Must be a valid URL').optional().or(z.literal('')),
});

type ProfileFormData = z.infer<typeof profileFormSchema>;

interface ProfileCoverProps {
  profile: {
    id: string;
    username: string;
    display_name: string;
    bio: string;
    profile_picture_url: string;
    cover_photo_url?: string;
    location?: string;
    website?: string;
    created_at: string;
  };
  isOwnProfile: boolean;
  friendsCount?: number;
  followersCount?: number;
  onProfileUpdate?: (updatedProfile: any) => void;
}

const ProfileCover: React.FC<ProfileCoverProps> = ({ 
  profile, 
  isOwnProfile, 
  friendsCount = 0, 
  followersCount = 0,
  onProfileUpdate 
}) => {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();
  
  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      display_name: profile.display_name,
      bio: profile.bio,
      location: profile.location || '',
      website: profile.website || '',
    },
  });

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

  const handleCoverUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      // Upload to Supabase storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${profile.id}-cover.${fileExt}`;
      const filePath = `covers/${fileName}`;

      // First check if current user has permission to modify this profile
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || user.id !== profile.user_id) {
        throw new Error('Unauthorized to update this profile');
      }

      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('media')
        .getPublicUrl(filePath);
        console.log(urlData);

      // Update profile with new cover photo
      const result = await supabase
        .from('user_profiles')
        .update({ cover_photo_url: urlData.publicUrl })
        .eq('user_id', profile.id);
        console.log("result:", result);

      if (result.error) throw result.error;
      
      if (onProfileUpdate) {
        onProfileUpdate({
          ...profile,
          cover_photo_url: urlData.publicUrl
        });
      }
      
      toast({
        title: 'Success',
        description: 'Cover photo updated successfully!'
      });
    } catch (error) {
      console.error('Error uploading cover photo:', error);
      toast({
        title: 'Error',
        description: 'Failed to upload cover photo',
        variant: 'destructive'
      });
    } finally {
      setUploading(false);
    }
  };


 

  const handleProfileUpdate = async (data: ProfileFormData) => {
    try {
      // Mock update - in real app, update in Supabase
      const updatedProfile = {
        ...profile,
        ...data
      };
      
      if (onProfileUpdate) {
        onProfileUpdate(updatedProfile);
      }
      
      toast({
        title: 'Success',
        description: 'Profile updated successfully!'
      });
      
      setShowEditDialog(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to update profile',
        variant: 'destructive'
      });
    }
  };

  console.log(profile);

  return (
    <Card className="mb-6 overflow-hidden">
      {/* Cover Photo */}
      <div 
        className="h-48 sm:h-56 md:h-64 bg-gradient-to-r from-blue-500 to-purple-600 relative"
        style={{
          backgroundImage: profile.cover_photo_url ? `url(${profile.cover_photo_url})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        {isOwnProfile && (
          <div className="absolute bottom-4 right-4">
            <Input
              type="file"
              accept="image/*"
              onChange={handleCoverUpload}
              disabled={uploading}
              className="hidden"
              id="cover-upload"
            />
            <Label htmlFor="cover-upload" className="cursor-pointer">
              <Button 
                variant="secondary" 
                size="sm"
                disabled={uploading}
                asChild
              >
                <span>
                  {uploading ? (
                    <Upload className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Camera className="w-4 h-4 mr-2" />
                  )}
                  {uploading ? 'Uploading...' : 'Edit Cover'}
                </span>
              </Button>
            </Label>
          </div>
        )}
      </div>
      
      {/* Profile Info */}
      <div className="p-6 pb-4">
        <div className="flex flex-col sm:flex-row items-center sm:items-start mb-4 space-y-4 sm:space-y-0">
          <div className="relative -mt-20">
            <Avatar className="w-32 h-32 border-4 border-white shadow-lg">
              <AvatarImage src={profile.profile_picture_url} />
              <AvatarFallback className="text-3xl">
                {profile.display_name?.[0] || profile.username[0]}
              </AvatarFallback>
            </Avatar>
            {isOwnProfile && (
              <TooltipWrapper content="Change profile picture">
                <Button 
                  size="sm" 
                  className="absolute bottom-2 right-2 rounded-full w-8 h-8 p-0"
                >
                  <Camera className="w-4 h-4" />
                </Button>
              </TooltipWrapper>
            )}
          </div>
          
          <div className="sm:ml-6 flex-1 text-center sm:text-left mt-4 sm:mt-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground break-words">{profile.display_name}</h1>
            <p className="text-muted-foreground text-base sm:text-lg">@{profile.username}</p>
            <div className="flex justify-center sm:justify-start items-center space-x-4 mt-2 text-sm text-muted-foreground">
              <span>{friendsCount} friends</span>
              <span>{followersCount} followers</span>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2 mt-4 sm:mt-0 justify-center sm:justify-start">
            {isOwnProfile ? (
              <>
                <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
                  <TooltipWrapper content="Edit your profile information">
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="text-xs sm:text-sm px-3 py-2">
                        <Settings className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                        <span className="hidden xs:inline">Edit Profile</span>
                        <span className="xs:hidden">Edit</span>
                      </Button>
                    </DialogTrigger>
                  </TooltipWrapper>
                  <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Edit Profile</DialogTitle>
                    </DialogHeader>
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(handleProfileUpdate)} className="space-y-4">
                        <FormField
                          control={form.control}
                          name="display_name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Display Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Your display name" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="bio"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Bio</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Tell us about yourself..."
                                  className="min-h-[100px]"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="location"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Location</FormLabel>
                              <FormControl>
                                <Input placeholder="City, State, Country" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="website"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Website</FormLabel>
                              <FormControl>
                                <Input placeholder="https://yourwebsite.com" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="flex justify-end space-x-2">
                          <TooltipWrapper content="Cancel changes and close dialog">
                            <Button type="button" variant="outline" onClick={() => setShowEditDialog(false)}>
                              Cancel
                            </Button>
                          </TooltipWrapper>
                          <TooltipWrapper content="Save your profile changes">
                            <Button type="submit">Save Changes</Button>
                          </TooltipWrapper>
                        </div>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
                <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
                  <DialogTrigger asChild>
                    <TooltipWrapper content="Share your profile with others">
                      <Button variant="outline" size="sm" className="text-xs sm:text-sm px-3 py-2">
                        <Share2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                        <span className="hidden xs:inline">Share Profile</span>
                        <span className="xs:hidden">Share</span>
                      </Button>
                    </TooltipWrapper>
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
                <TooltipWrapper content="Send a friend request to this user">
                  <Button variant="outline" onClick={handleSendFriendRequest} size="sm" className="text-xs sm:text-sm px-3 py-2">
                    <UserPlus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    <span className="hidden xs:inline">Add Friend</span>
                    <span className="xs:hidden">Add</span>
                  </Button>
                </TooltipWrapper>
                <TooltipWrapper content="Send a private message">
                  <Button variant="outline" size="sm" className="text-xs sm:text-sm px-3 py-2">
                    <MessageCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    <span className="hidden xs:inline">Message</span>
                    <span className="xs:hidden">Msg</span>
                  </Button>
                </TooltipWrapper>
                <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
                  <DialogTrigger asChild>
                    <TooltipWrapper content="Share this profile">
                      <Button variant="outline" size="sm" className="p-2">
                        <Share2 className="w-3 h-3 sm:w-4 sm:h-4" />
                      </Button>
                    </TooltipWrapper>
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