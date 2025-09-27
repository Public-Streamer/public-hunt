import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Upload, Video, X, FileText, Settings, Eye, Info, Sparkles, Lightbulb, ArrowRight } from 'lucide-react';
import AdPreview from '@/components/AdPreview';

const CreateAd = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [budget, setBudget] = useState('');
  const [ctaLabel, setCtaLabel] = useState('');
  const [ctaUrl, setCtaUrl] = useState('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const handleFileSelection = (file: File) => {
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

    // Store file locally and create preview URL
    setVideoFile(file);
    const previewUrl = URL.createObjectURL(file);
    setVideoPreviewUrl(previewUrl);
    toast.success('Video selected successfully!');
  };

  const uploadVideoToStorage = async (file: File): Promise<string> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('You must be logged in to upload videos');
    }

    // Create unique filename with user folder structure
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('ad-videos')
      .upload(fileName, file);

    if (error) {
      throw new Error('Failed to upload video: ' + error.message);
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('ad-videos')
      .getPublicUrl(data.path);

    return publicUrl;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelection(file);
    }
  };

  const removeVideo = () => {
    // Clean up preview URL to prevent memory leaks
    if (videoPreviewUrl) {
      URL.revokeObjectURL(videoPreviewUrl);
    }
    setVideoFile(null);
    setVideoPreviewUrl('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !description || !budget || !videoFile) {
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

      // First upload the video to storage
      toast.info('Uploading video...');
      const videoUrl = await uploadVideoToStorage(videoFile);
      
      // Then create the ad record with the uploaded video URL
      toast.info('Creating ad campaign...');
      const { error } = await supabase
        .from('ads')
        .insert({
          title,
          description,
          budget: parseFloat(budget),
          video_url: videoUrl,
          user_id: user.id,
          cta_label: ctaLabel || null,
          cta_url: ctaUrl || null,
          status: 'draft',
          campaign_status: 'draft'
        });

      if (error) {
        console.error('Error creating ad:', error);
        toast.error('Failed to create ad: ' + error.message);
        return;
      }

      toast.success('Ad campaign created successfully!');
      
      // Clean up preview URL and reset form
      if (videoPreviewUrl) {
        URL.revokeObjectURL(videoPreviewUrl);
      }
      setTitle('');
      setDescription('');
      setBudget('');
      setCtaLabel('');
      setCtaUrl('');
      setVideoFile(null);
      setVideoPreviewUrl('');
    } catch (error) {
      console.error('Error creating ad:', error);
      toast.error('Failed to create ad: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGeneratePreview = () => {
    if (!videoFile || !description || !title) {
      toast.error('Please fill in the title, description, and upload a video first');
      return;
    }
    
    setShowPreview(true);
  };

  const handleClosePreview = () => {
    setShowPreview(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,_rgba(120,_119,_198,_0.3),_transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,_rgba(255,_255,_255,_0.1),_transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_40%_40%,_rgba(120,_119,_198,_0.2),_transparent_50%)]" />

      <div className="relative z-10 container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
            Create Your Ad
          </h1>
          
          {/* Introduction Message */}
          <Card className="bg-white/10 backdrop-blur-sm border-white/20 mb-8">
            <CardContent className="p-6">
              <div className="flex items-start space-x-3">
                <Info className="text-blue-300 h-6 w-6 mt-1 flex-shrink-0" />
                <div className="text-white/90 text-left">
                  <p className="text-lg leading-relaxed">
                    <strong>Create professional video ads in minutes.</strong> Upload your video content, set your budget, 
                    and target specific channels or let our system find the best placement for your ad. Your ads will appear 
                    on live streams and events across the Public Streamer network, reaching engaged audiences in real-time.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-4">
            {[
              { step: 1, label: "Upload Media", icon: Upload },
              { step: 2, label: "Describe Ad", icon: FileText },
              { step: 3, label: "Customize", icon: Settings },
              { step: 4, label: "Preview & Save", icon: Eye }
            ].map(({ step, label, icon: Icon }, index) => (
              <div key={step} className="flex items-center">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                  <Icon className="h-5 w-5" />
                </div>
                <span className="ml-2 text-sm text-white">
                  {label}
                </span>
                {index < 3 && (
                  <ArrowRight className="h-4 w-4 text-white/40 mx-3" />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Upload & Configuration */}
          <div className="space-y-6">
            {/* Step 1: Media Upload */}
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center space-x-2">
                  <Upload className="h-5 w-5" />
                  <span>1. Upload Your Media</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-2 border-dashed border-white/30 rounded-lg p-8 text-center hover:border-white/50 transition-colors">
                  {!videoFile ? (
                    <>
                      <input
                        type="file"
                        accept="video/*"
                        onChange={handleFileChange}
                        className="hidden"
                        id="media-upload"
                        disabled={uploading}
                      />
                      <label htmlFor="media-upload" className="cursor-pointer">
                        <div className="space-y-3">
                          <div className="flex justify-center">
                            <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-3 rounded-full">
                              <Upload className="h-8 w-8 text-white" />
                            </div>
                          </div>
                          <div>
                            <p className="text-white font-medium">Click to upload or drag and drop</p>
                            <p className="text-white/60 text-sm">MP4, MOV, JPG, PNG, GIF (max 50MB)</p>
                          </div>
                        </div>
                      </label>
                    </>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-white/5 rounded">
                        <div className="flex items-center space-x-3">
                          <Video className="h-6 w-6 text-blue-300" />
                          <span className="text-white text-sm font-medium">{videoFile.name}</span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={removeVideo}
                          className="text-red-300 hover:text-red-200 hover:bg-red-500/20"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      {videoPreviewUrl && (
                        <video 
                          src={videoPreviewUrl} 
                          controls 
                          className="w-full rounded-lg max-h-64"
                        />
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Step 2: Ad Description */}
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center space-x-2">
                  <FileText className="h-5 w-5" />
                  <span>2. What is your ad about?</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <Textarea
                    placeholder="Tell us about your product, service, or offer. What makes it special? Who is it for? Include any key details like pricing, benefits, or special offers..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="min-h-[120px] bg-white/10 border-white/20 text-white placeholder:text-white/50 resize-none"
                    required
                  />
                  <p className="text-white/60 text-xs">
                    {description.length}/500 characters
                  </p>
                  
                  <div className="space-y-4">
                    <div>
                      <Label className="text-white">Ad Title</Label>
                      <Input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Enter your ad title"
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                        required
                      />
                    </div>
                    
                    <div>
                      <Label className="text-white">Budget ($)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="5"
                        value={budget}
                        onChange={(e) => setBudget(e.target.value)}
                        placeholder="Enter your budget (minimum $5)"
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                        required
                      />
                    </div>

                    <div>
                      <Label className="text-white">Call-to-Action Button Text (Optional)</Label>
                      <Input
                        value={ctaLabel}
                        onChange={(e) => setCtaLabel(e.target.value)}
                        placeholder="e.g., Learn More, Shop Now, Sign Up"
                        maxLength={25}
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                      />
                      <p className="text-white/60 text-xs mt-1">
                        {ctaLabel.length}/25 characters
                      </p>
                    </div>

                    <div>
                      <Label className="text-white">CTA URL (Optional)</Label>
                      <Input
                        type="url"
                        value={ctaUrl}
                        onChange={(e) => setCtaUrl(e.target.value)}
                        placeholder="https://your-website.com"
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                      />
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white" 
                      disabled={isSubmitting || !videoFile}
                    >
                      {isSubmitting ? 'Creating Campaign...' : 'Create Campaign'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Magic & Tips */}
          <div className="space-y-6">
            {/* Ready to Create Magic */}
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardContent className="p-6 text-center">
                <div className="space-y-4">
                  <div className="flex justify-center">
                    <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-4 rounded-full">
                      <Sparkles className="h-8 w-8 text-white" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-white text-xl font-bold mb-2">Ready to Create Magic?</h3>
                    <p className="text-white/80 text-sm">
                      We'll combine your media with professional effects and create an amazing ad in seconds!
                    </p>
                  </div>
                  <Button 
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                    disabled={!videoFile || !description || !title}
                    onClick={handleGeneratePreview}
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate Ad Preview for Me
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Pro Tips */}
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center space-x-2">
                  <Lightbulb className="h-5 w-5 text-yellow-400" />
                  <span>Pro Tips</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-white/80 text-sm">
                  <div className="flex items-start space-x-2">
                    <span className="text-green-400">•</span>
                    <span>Use high-quality images and videos for best results</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="text-green-400">•</span>
                    <span>Keep your description clear and compelling</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="text-green-400">•</span>
                    <span>Square or landscape formats work best for ads</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="text-green-400">•</span>
                    <span>Background music can increase engagement by 40%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Ad Preview Modal */}
      {showPreview && (
        <AdPreview
          adData={{
            title,
            description,
            videoUrl: videoPreviewUrl,
            budget,
            ctaLabel,
            ctaUrl
          }}
          onClose={handleClosePreview}
        />
      )}
    </div>
  );
};

export default CreateAd;