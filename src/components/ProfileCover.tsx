import React, { useState, useEffect } from 'react';
import {
  Camera,
  Settings,
  MessageCircle,
  Share2,
  UserPlus,
  MapPin,
  Calendar,
  Users,
  Heart,
  Star,
  Upload,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import FollowButton from '@/components/FollowButton';
import SocialShareMenu from '@/components/SocialShareMenu';
import { BirthdaySelector } from '@/components/BirthdaySelector';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import TooltipWrapper from '@/components/ui/tooltip-wrapper';

const profileFormSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be less than 30 characters')
    .regex(
      /^[a-zA-Z0-9_]+$/,
      'Username can only contain letters, numbers and underscores'
    ),
  display_name: z.string().min(1, 'Display name is required'),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
  location: z.string().optional(),
  website: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  birthday: z.string().optional(),
  education: z.string().optional(),
  relationship_status: z.string().optional(),
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
    birthday?: string;
    education?: string;
    relationship_status?: string;
    created_at: string;
    user_id: string;
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
  onProfileUpdate,
}) => {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [profilePictureUploading, setProfilePictureUploading] = useState(false);
  const [profilePicturePreview, setProfilePicturePreview] = useState<
    string | null
  >(null);
  const { toast } = useToast();

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      username: profile.username,
      display_name: profile.display_name,
      bio: profile.bio || '',
      location: profile.location || '',
      website: profile.website || '',
      birthday: profile.birthday || '',
      education: profile.education || '',
      relationship_status: profile.relationship_status || '',
    },
  });

  // Update form values when profile changes
  useEffect(() => {
    form.reset({
      username: profile.username,
      display_name: profile.display_name,
      bio: profile.bio || '',
      location: profile.location || '',
      website: profile.website || '',
      birthday: profile.birthday || '',
      education: profile.education || '',
      relationship_status: profile.relationship_status || '',
    });
  }, [profile, form]);

  useEffect(() => {
    getCurrentUser();
    // Mock live status
    setIsLive(Math.random() > 0.7);
  }, []);

  const getCurrentUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    setCurrentUser(user);
  };

  const handleSendFriendRequest = () => {
    toast({
      title: 'Friend Request Sent',
      description: `Friend request sent to ${profile.display_name}`,
    });
  };

  const handleCoverUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Immediate UI feedback with blob URL
    const blobUrl = URL.createObjectURL(file);
    setPreviewUrl(blobUrl);
    setUploading(true);

    try {
      // First check if current user has permission to modify this profile
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || user.id !== profile.user_id) {
        throw new Error('Unauthorized to update this profile');
      }

      // Delete old cover photo if it exists
      if (profile.cover_photo_url) {
        const oldPath = profile.cover_photo_url.split('/').pop();
        if (oldPath && oldPath.includes(profile.id)) {
          await supabase.storage.from('media').remove([`covers/${oldPath}`]);
        }
      }

      // Upload to Supabase storage with timestamp for cache busting
      const fileExt = file.name.split('.').pop();
      const timestamp = Date.now();
      const fileName = `${profile.id}-cover-${timestamp}.${fileExt}`;
      const filePath = `covers/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL with cache busting parameter
      const { data: urlData } = supabase.storage
        .from('media')
        .getPublicUrl(filePath);

      const cacheBustedUrl = `${urlData.publicUrl}?t=${timestamp}`;

      // Update profile with new cover photo
      const result = await supabase
        .from('user_profiles')
        .update({ cover_photo_url: cacheBustedUrl })
        .eq('user_id', profile.user_id);

      if (result.error) throw result.error;

      // Clean up blob URL
      URL.revokeObjectURL(blobUrl);
      setPreviewUrl(null);

      if (onProfileUpdate) {
        onProfileUpdate({
          ...profile,
          cover_photo_url: cacheBustedUrl,
        });
      }

      toast({
        title: 'Success',
        description: 'Cover photo updated successfully!',
      });
    } catch (error) {
      console.error('Error uploading cover photo:', error);

      // Revert UI changes on error
      URL.revokeObjectURL(blobUrl);
      setPreviewUrl(null);

      toast({
        title: 'Error',
        description: 'Failed to upload cover photo',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleShareProfile = async () => {
    const profileUrl = `${window.location.origin}/profile/${profile.user_id}`;
    try {
      await navigator.clipboard.writeText(profileUrl);
      toast({
        title: 'Profile Link Copied',
        description: 'The profile link has been copied to your clipboard.',
      });
    } catch (err) {
      toast({
        title: 'Copy Failed',
        description: 'Could not copy the profile link to clipboard.',
        variant: 'destructive',
      });
    }
  };

  const handleProfilePictureUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Immediate UI feedback with blob URL
    const blobUrl = URL.createObjectURL(file);
    setProfilePicturePreview(blobUrl);
    setProfilePictureUploading(true);

    try {
      // First check if current user has permission to modify this profile
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || user.id !== profile.user_id) {
        throw new Error('Unauthorized to update this profile');
      }

      // Delete old profile picture if it exists
      if (profile.profile_picture_url) {
        const oldPath = profile.profile_picture_url.split('/').pop();
        if (oldPath && oldPath.includes(profile.id)) {
          await supabase.storage.from('media').remove([`avatars/${oldPath}`]);
        }
      }

      // Upload to Supabase storage with timestamp for cache busting
      const fileExt = file.name.split('.').pop();
      const timestamp = Date.now();
      const fileName = `${profile.id}-avatar-${timestamp}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL with cache busting parameter
      const { data: urlData } = supabase.storage
        .from('media')
        .getPublicUrl(filePath);

      const cacheBustedUrl = `${urlData.publicUrl}?t=${timestamp}`;

      // Update profile with new profile picture
      const result = await supabase
        .from('user_profiles')
        .update({ profile_picture_url: cacheBustedUrl })
        .eq('user_id', profile.user_id);

      if (result.error) throw result.error;

      // Clean up blob URL
      URL.revokeObjectURL(blobUrl);
      setProfilePicturePreview(null);

      if (onProfileUpdate) {
        onProfileUpdate({
          ...profile,
          profile_picture_url: cacheBustedUrl,
        });
      }

      toast({
        title: 'Success',
        description: 'Profile picture updated successfully!',
      });
    } catch (error) {
      console.error('Error uploading profile picture:', error);

      // Revert UI changes on error
      URL.revokeObjectURL(blobUrl);
      setProfilePicturePreview(null);

      toast({
        title: 'Error',
        description: 'Failed to upload profile picture',
        variant: 'destructive',
      });
    } finally {
      setProfilePictureUploading(false);
    }
  };

  const handleProfileUpdate = async (data: ProfileFormData) => {
    try {
      // First check if current user has permission to modify this profile
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || user.id !== profile.user_id) {
        throw new Error('Unauthorized to update this profile');
      }

      // Check if username is being changed and if it's unique
      if (data.username && data.username !== profile.username) {
        const { data: existingUser, error: checkError } = await supabase
          .from('user_profiles')
          .select('id')
          .eq('username', data.username)
          .neq('user_id', profile.user_id)
          .maybeSingle();

        if (checkError) throw checkError;

        if (existingUser) {
          toast({
            title: 'Error',
            description:
              'Username is already taken. Please choose a different one.',
            variant: 'destructive',
          });
          return;
        }
      }

      // Prepare update data
      const updateData: any = {
        username: data.username,
        display_name: data.display_name,
        bio: data.bio || null,
        location: data.location || null,
        website: data.website || null,
        education: data.education || null,
        relationship_status: data.relationship_status || null,
        updated_at: new Date().toISOString(),
      };

      // Add birthday if provided
      if (data.birthday) {
        updateData.birthday = data.birthday;
      }

      // Update profile in database
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update(updateData)
        .eq('user_id', profile.user_id);

      if (updateError) throw updateError;

      // Create updated profile object
      const updatedProfile = {
        ...profile,
        ...data,
        bio: data.bio || '',
        location: data.location || '',
        website: data.website || '',
        birthday: data.birthday || '',
        education: data.education || '',
        relationship_status: data.relationship_status || '',
      };

      if (onProfileUpdate) {
        onProfileUpdate(updatedProfile);
      }

      toast({
        title: 'Success',
        description: 'Profile updated successfully!',
      });

      setShowEditDialog(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Error',
        description:
          error instanceof Error ? error.message : 'Failed to update profile',
        variant: 'destructive',
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
          backgroundImage:
            previewUrl || profile.cover_photo_url
              ? `url(${previewUrl || profile.cover_photo_url})`
              : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
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
                    <Upload className="w-4 h-4 animate-spin" />
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
              <AvatarImage
                src={profilePicturePreview || profile.profile_picture_url}
              />
              <AvatarFallback className="text-3xl">
                {profile.display_name?.[0] || profile.username[0]}
              </AvatarFallback>
            </Avatar>
            {isOwnProfile && (
              <div>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleProfilePictureUpload}
                  disabled={profilePictureUploading}
                  className="hidden"
                  id="profile-picture-upload"
                />
                <Label
                  htmlFor="profile-picture-upload"
                  className="cursor-pointer"
                >
                  <TooltipWrapper content="Change profile picture">
                    <Button
                      size="sm"
                      className="absolute bottom-2 right-2 rounded-full w-8 h-8 p-0"
                      disabled={profilePictureUploading}
                      asChild
                    >
                      <span>
                        {profilePictureUploading ? (
                          <Upload className="w-4 h-4 animate-spin" />
                        ) : (
                          <Camera className="w-4 h-4" />
                        )}
                      </span>
                    </Button>
                  </TooltipWrapper>
                </Label>
              </div>
            )}
          </div>

          <div className="sm:ml-6 flex-1 text-center sm:text-left mt-4 sm:mt-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground break-words">
              {profile.display_name}
            </h1>
            <p className="text-muted-foreground text-base sm:text-lg">
              @{profile.username}
            </p>
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
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs sm:text-sm px-3 py-2"
                      >
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
                      <form
                        onSubmit={form.handleSubmit(handleProfileUpdate)}
                        className="space-y-4"
                      >
                        <FormField
                          control={form.control}
                          name="username"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Username</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Your unique username"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="display_name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Display Name</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Your display name"
                                  {...field}
                                />
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
                                  placeholder="Welcome to my profile! I love creating amazing content and connecting with the community."
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
                                <Input
                                  placeholder="San Francisco, CA"
                                  {...field}
                                />
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
                                <Input
                                  placeholder="https://example.com"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="birthday"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Birthday</FormLabel>
                              <FormControl>
                                <BirthdaySelector
                                  value={field.value || ''}
                                  onChange={field.onChange}
                                  className="w-full"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="education"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Education</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="University of California, Berkeley"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="relationship_status"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Relationship Status</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Single, Married, In a relationship, etc."
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="flex justify-end space-x-2">
                          <TooltipWrapper content="Cancel changes and close dialog">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setShowEditDialog(false)}
                            >
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
                <TooltipWrapper content="Share your profile with others">
                  <Button
                    onClick={handleShareProfile}
                    variant="outline"
                    size="sm"
                    className="text-xs sm:text-sm px-3 py-2"
                  >
                    <Share2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    <span className="hidden xs:inline">Share Profile</span>
                    <span className="xs:hidden">Share</span>
                  </Button>
                </TooltipWrapper>
              </>
            ) : (
              <>
                <FollowButton
                  targetId={profile.id}
                  targetType="user"
                  currentUserId={currentUser?.id}
                />
                <TooltipWrapper content="Send a friend request to this user">
                  <Button
                    variant="outline"
                    onClick={handleSendFriendRequest}
                    size="sm"
                    className="text-xs sm:text-sm px-3 py-2"
                  >
                    <UserPlus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    <span className="hidden xs:inline">Add Friend</span>
                    <span className="xs:hidden">Add</span>
                  </Button>
                </TooltipWrapper>
                <TooltipWrapper content="Send a private message">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs sm:text-sm px-3 py-2"
                  >
                    <MessageCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    <span className="hidden xs:inline">Message</span>
                    <span className="xs:hidden">Msg</span>
                  </Button>
                </TooltipWrapper>
                <TooltipWrapper content="Share this profile">
                  <Button
                    onClick={handleShareProfile}
                    variant="outline"
                    size="sm"
                    className="p-2"
                  >
                    <Share2 className="w-3 h-3 sm:w-4 sm:h-4" />
                  </Button>
                </TooltipWrapper>
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
