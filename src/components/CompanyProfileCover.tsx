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
  Building,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

const companyProfileFormSchema = z.object({
  company_name: z.string().min(1, 'Company name is required'),
  description: z
    .string()
    .max(1000, 'Description must be less than 1000 characters')
    .optional(),
  industry: z.string().optional(),
  headquarters: z.string().optional(),
  website: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  contact_email: z
    .string()
    .email('Must be a valid email')
    .optional()
    .or(z.literal('')),
  employee_count: z.string().optional(),
});

type CompanyProfileFormData = z.infer<typeof companyProfileFormSchema>;

interface CompanyProfileCoverProps {
  profile: {
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
    created_at: string;
  };
  isCompanyMaster: boolean;
  followersCount?: number;
  onProfileUpdate?: (updatedProfile: any) => void;
}

const CompanyProfileCover: React.FC<CompanyProfileCoverProps> = ({
  profile,
  isCompanyMaster,
  followersCount = 0,
  onProfileUpdate,
}) => {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const form = useForm<CompanyProfileFormData>({
    resolver: zodResolver(companyProfileFormSchema),
    defaultValues: {
      company_name: profile.company_name,
      description: profile.description || '',
      industry: profile.industry || '',
      headquarters: profile.headquarters || '',
      website: profile.website || '',
      contact_email: profile.contact_email || '',
      employee_count: profile.employee_count || '',
    },
  });

  useEffect(() => {
    getCurrentUser();
  }, []);

  const getCurrentUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    setCurrentUser(user);
  };

  const handleFollowCompany = () => {
    toast({
      title: 'Following Company',
      description: `Now following ${profile.company_name}`,
    });
  };

  const handleCoverUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      // Upload to Supabase storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${profile.company_id}-cover.${fileExt}`;
      const filePath = `company-covers/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('media')
        .getPublicUrl(filePath);

      // Update company profile with new cover photo
      const { error: updateError } = await supabase
        .from('company_profiles')
        .update({ cover_photo_url: urlData.publicUrl })
        .eq('company_id', profile.company_id);

      if (updateError) throw updateError;

      if (onProfileUpdate) {
        onProfileUpdate({
          ...profile,
          cover_photo_url: urlData.publicUrl,
        });
      }

      toast({
        title: 'Success',
        description: 'Cover photo updated successfully!',
      });
    } catch (error) {
      console.error('Error uploading cover photo:', error);
      toast({
        title: 'Error',
        description: 'Failed to upload cover photo',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleProfileUpdate = async (data: CompanyProfileFormData) => {
    try {
      const { error } = await supabase
        .from('company_profiles')
        .update(data)
        .eq('company_id', profile.company_id);

      if (error) throw error;

      const updatedProfile = {
        ...profile,
        ...data,
      };

      if (onProfileUpdate) {
        onProfileUpdate(updatedProfile);
      }

      toast({
        title: 'Success',
        description: 'Company profile updated successfully!',
      });

      setShowEditDialog(false);
    } catch (error) {
      console.error('Error updating company profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to update company profile',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card className="mb-6 overflow-hidden">
      {/* Cover Photo */}
      <div
        className="h-48 sm:h-56 md:h-64 bg-gradient-to-r from-blue-600 to-purple-700 relative"
        style={{
          backgroundImage: profile.cover_photo_url
            ? `url(${profile.cover_photo_url})`
            : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {isCompanyMaster && (
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
              <AvatarImage src={profile.logo_url} />
              <AvatarFallback className="text-3xl">
                <Building className="w-16 h-16" />
              </AvatarFallback>
            </Avatar>
            {isCompanyMaster && (
              <Button
                size="sm"
                className="absolute bottom-2 right-2 rounded-full w-8 h-8 p-0"
              >
                <Camera className="w-4 h-4" />
              </Button>
            )}
          </div>

          <div className="sm:ml-6 flex-1 text-center sm:text-left mt-4 sm:mt-0">
            <div className="flex items-center justify-center sm:justify-start space-x-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground break-words">
                {profile.company_name}
              </h1>
              <Badge variant="secondary" className="text-xs">
                <Building className="w-3 h-3 mr-1" />
                Company
              </Badge>
            </div>
            {profile.industry && (
              <p className="text-muted-foreground text-base sm:text-lg">
                {profile.industry}
              </p>
            )}
            <div className="flex justify-center sm:justify-start items-center space-x-4 mt-2 text-sm text-muted-foreground">
              <span>{followersCount} followers</span>
              {profile.employee_count && (
                <span>{profile.employee_count} employees</span>
              )}
              {profile.founded_year && (
                <span>Founded {profile.founded_year}</span>
              )}
            </div>
          </div>

          <div className="flex space-x-2 mt-4 sm:mt-0">
            {isCompanyMaster ? (
              <>
                <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <Settings className="w-4 h-4 mr-2" />
                      Edit Profile
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Edit Company Profile</DialogTitle>
                    </DialogHeader>
                    <Form {...form}>
                      <form
                        onSubmit={form.handleSubmit(handleProfileUpdate)}
                        className="space-y-4"
                      >
                        <FormField
                          control={form.control}
                          name="company_name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Company Name</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Your company name"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Description</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Tell the world about your company..."
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
                          name="industry"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Industry</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Technology, Healthcare, etc."
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="headquarters"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Headquarters</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="City, State, Country"
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
                                  placeholder="https://yourcompany.com"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="contact_email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Contact Email</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="contact@yourcompany.com"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="employee_count"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Employee Count</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="1-10, 11-50, 51-200, etc."
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="flex justify-end space-x-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setShowEditDialog(false)}
                          >
                            Cancel
                          </Button>
                          <Button type="submit">Save Changes</Button>
                        </div>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
                <Dialog
                  open={showShareDialog}
                  onOpenChange={setShowShareDialog}
                >
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <Share2 className="w-4 h-4 mr-2" />
                      Share Profile
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Share Company Profile</DialogTitle>
                    </DialogHeader>
                    <SocialShareMenu
                      title={`Check out ${profile.company_name}`}
                      description={profile.description}
                      url={`${window.location.origin}/company/${profile.company_id}`}
                    />
                  </DialogContent>
                </Dialog>
              </>
            ) : (
              <>
                <FollowButton
                  targetId={profile.company_id}
                  targetType="company"
                  currentUserId={currentUser?.id}
                />
                <Button variant="outline" onClick={handleFollowCompany}>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Follow
                </Button>
                <Button variant="outline">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Contact
                </Button>
                <Dialog
                  open={showShareDialog}
                  onOpenChange={setShowShareDialog}
                >
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Share2 className="w-4 h-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Share Company Profile</DialogTitle>
                    </DialogHeader>
                    <SocialShareMenu
                      title={`Check out ${profile.company_name}`}
                      description={profile.description}
                      url={`${window.location.origin}/company/${profile.company_id}`}
                    />
                  </DialogContent>
                </Dialog>
              </>
            )}
          </div>
        </div>

        {profile.description && (
          <p className="text-foreground mt-4 max-w-2xl">
            {profile.description}
          </p>
        )}

        {/* Company Details and Quick Stats */}
        <div className="flex flex-wrap items-center gap-4 mt-4">
          {profile.headquarters && (
            <div className="flex items-center space-x-1 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4" />
              <span>{profile.headquarters}</span>
            </div>
          )}
          {profile.founded_year && (
            <div className="flex items-center space-x-1 text-sm text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span>Founded {profile.founded_year}</span>
            </div>
          )}
          <div className="flex items-center space-x-1 text-sm text-muted-foreground">
            <Heart className="w-4 h-4" />
            <span>{Math.floor(Math.random() * 1000) + 100} likes</span>
          </div>
          <div className="flex items-center space-x-1 text-sm text-muted-foreground">
            <Star className="w-4 h-4" />
            <span>4.{Math.floor(Math.random() * 9) + 1} rating</span>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default CompanyProfileCover;
