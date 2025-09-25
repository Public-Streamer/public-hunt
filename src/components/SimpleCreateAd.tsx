import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Upload, Video, X } from 'lucide-react';

export function SimpleCreateAd() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [budget, setBudget] = useState('');
  const [targetChannels, setTargetChannels] = useState('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleVideoUpload = async (file: File) => {
    if (!file) return;

    // Validate file size (50MB limit)
    if (file.size > 50 * 1024 * 1024) {
      toast.error('Video file must be less than 50MB');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('video/')) {
      toast.error('Please upload a valid video file');
      return;
    }

    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('You must be logged in to upload videos');
        return;
      }

      // Create unique filename with user folder structure
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('ad-videos')
        .upload(fileName, file);

      if (error) {
        console.error('Upload error:', error);
        toast.error('Failed to upload video: ' + error.message);
        return;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('ad-videos')
        .getPublicUrl(data.path);

      setVideoUrl(publicUrl);
      setVideoFile(file);
      toast.success('Video uploaded successfully!');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload video');
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleVideoUpload(file);
    }
  };

  const removeVideo = () => {
    setVideoFile(null);
    setVideoUrl('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !description || !budget || !videoUrl) {
      toast.error('Please fill in all fields and upload a video file');
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('You must be logged in to create ads');
        return;
      }

      const { error } = await supabase
        .from('ads')
        .insert({
          title,
          description,
          budget: parseFloat(budget),
          video_url: videoUrl,
          user_id: user.id,
          target_channels: targetChannels ? targetChannels.split(',').map(id => id.trim()) : [],
          status: 'draft',
          campaign_status: 'draft'
        });

      if (error) {
        console.error('Error creating ad:', error);
        toast.error('Failed to create ad: ' + error.message);
        return;
      }

      toast.success('Ad created successfully!');
      // Reset form
      setTitle('');
      setDescription('');
      setBudget('');
      setTargetChannels('');
      setVideoFile(null);
      setVideoUrl('');
    } catch (error) {
      console.error('Error creating ad:', error);
      toast.error('Failed to create ad');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Create Advertising Campaign</CardTitle>
        <CardDescription>
          Reach thousands of viewers across our streaming platform. Upload your video ad to get started.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Video Upload Section */}
          <div className="space-y-2">
            <Label htmlFor="video-upload">Upload Your Video Ad</Label>
            <div className="border-2 border-dashed border-gray-200 rounded-lg p-6">
              {!videoFile ? (
                <div className="text-center">
                  <Video className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-2">Upload your video advertisement</p>
                  <p className="text-sm text-gray-500 mb-4">Only video files are supported (MP4, MOV, AVI, etc.) up to 50MB</p>
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="video/*"
                      onChange={handleFileChange}
                      className="hidden"
                      disabled={uploading}
                    />
                    <Button type="button" disabled={uploading} className="pointer-events-none">
                      <Upload className="h-4 w-4 mr-2" />
                      {uploading ? 'Uploading...' : 'Choose Video File'}
                    </Button>
                  </label>
                </div>
              ) : (
                <div className="relative">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded">
                    <div className="flex items-center space-x-3">
                      <Video className="h-6 w-6 text-blue-600" />
                      <span className="text-sm font-medium">{videoFile.name}</span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={removeVideo}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  {videoUrl && (
                    <video 
                      src={videoUrl} 
                      controls 
                      className="w-full mt-4 rounded-lg max-h-64"
                    />
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Ad Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter your ad title"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your ad campaign"
              rows={3}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="budget">Budget ($)</Label>
            <Input
              id="budget"
              type="number"
              step="0.01"
              min="1"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              placeholder="Enter your budget"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="target-channels">Target Channels (Optional)</Label>
            <Input
              id="target-channels"
              value={targetChannels}
              onChange={(e) => setTargetChannels(e.target.value)}
              placeholder="Enter channel IDs separated by commas"
            />
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={isSubmitting || uploading || !videoUrl}
          >
            {isSubmitting ? 'Creating Campaign...' : 'Create Campaign'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}