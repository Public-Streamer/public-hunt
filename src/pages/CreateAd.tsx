import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Upload,
  PlayCircle,
  Music,
  Wand2,
  Download,
  Save,
  ArrowRight,
  Info,
  Video,
  Image as ImageIcon,
  FileImage,
  Sparkles,
  Volume2,
  Eye,
  Settings,
  Zap,
  MessageSquare,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import AdWithFeedback from '@/components/AdWithFeedback';

interface MediaFile {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  file: File;
}

interface MusicTrack {
  id: string;
  name: string;
  mood: string;
  duration: string;
  previewUrl: string;
}

const CreateAd: React.FC = () => {
  const navigate = useNavigate();
  const [uploadedMedia, setUploadedMedia] = useState<MediaFile[]>([]);
  const [adDescription, setAdDescription] = useState('');
  const [selectedMusicTrack, setSelectedMusicTrack] =
    useState<MusicTrack | null>(null);
  const [selectedStyle, setSelectedStyle] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generatedAdUrl, setGeneratedAdUrl] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);

  // Sample music tracks
  const musicTracks: MusicTrack[] = [
    {
      id: '1',
      name: 'Upbeat Energy',
      mood: 'upbeat',
      duration: '2:30',
      previewUrl: '#',
    },
    {
      id: '2',
      name: 'Professional Focus',
      mood: 'professional',
      duration: '3:00',
      previewUrl: '#',
    },
    {
      id: '3',
      name: 'Chill Vibes',
      mood: 'chill',
      duration: '2:45',
      previewUrl: '#',
    },
    {
      id: '4',
      name: 'Dramatic Impact',
      mood: 'dramatic',
      duration: '2:15',
      previewUrl: '#',
    },
    {
      id: '5',
      name: 'Modern Tech',
      mood: 'tech',
      duration: '2:50',
      previewUrl: '#',
    },
  ];

  const stylePresets = [
    {
      id: 'upbeat',
      name: 'Upbeat & Energetic',
      description: 'Fast transitions, bright colors',
    },
    {
      id: 'professional',
      name: 'Clean & Professional',
      description: 'Smooth transitions, minimal text',
    },
    {
      id: 'dramatic',
      name: 'Bold & Dramatic',
      description: 'Strong effects, impactful music',
    },
    {
      id: 'chill',
      name: 'Calm & Relaxed',
      description: 'Gentle transitions, soft tones',
    },
    {
      id: 'modern',
      name: 'Modern & Tech',
      description: 'Sharp cuts, dynamic effects',
    },
  ];

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { files } = event.target;
    if (!files) return;

    Array.from(files).forEach((file) => {
      // Validate file type
      const validTypes = [
        'video/mp4',
        'video/mov',
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
      ];
      if (!validTypes.includes(file.type)) {
        toast.error(`${file.name} is not a supported file type`);
        return;
      }

      // Validate file size (50MB limit)
      if (file.size > 50 * 1024 * 1024) {
        toast.error(`${file.name} is too large. Please use files under 50MB.`);
        return;
      }

      const mediaFile: MediaFile = {
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        type: file.type,
        size: file.size,
        url: URL.createObjectURL(file),
        file,
      };

      setUploadedMedia((prev) => [...prev, mediaFile]);
      toast.success(`${file.name} uploaded successfully!`);
    });
  };

  const removeMedia = (id: string) => {
    setUploadedMedia((prev) => prev.filter((media) => media.id !== id));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
  };

  const generateAdPreview = async () => {
    if (uploadedMedia.length === 0) {
      toast.error('Please upload at least one media file first');
      return;
    }
    if (!adDescription.trim()) {
      toast.error('Please tell us what your ad is about');
      return;
    }
    if (!selectedStyle) {
      toast.error('Please select a style preset');
      return;
    }

    setIsGenerating(true);
    setGenerationProgress(0);

    // Simulate AI generation process
    const steps = [
      'Analyzing your media...',
      'Applying style preset...',
      'Adding transitions...',
      'Syncing background music...',
      'Finalizing your ad...',
    ];

    for (let i = 0; i < steps.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setGenerationProgress((i + 1) * 20);
      toast.info(steps[i]);
    }

    // Mock generated ad URL
    setGeneratedAdUrl('/mock-generated-ad.mp4');
    setIsGenerating(false);
    setCurrentStep(4);
    toast.success('Your ad has been generated successfully!');
  };

  const saveAd = () => {
    toast.success('Ad saved to your profile!');
  };

  const downloadAd = () => {
    toast.success('Ad download started!');
  };

  const goToRunAd = () => {
    navigate('/advertisers');
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
                    <strong>
                      Not sure how to advertise or where to start? Need help
                      creating an ad?
                    </strong>{' '}
                    That's what this page is for! Just upload your media, tell
                    us what your ad is about, and we'll help you create a
                    professional-looking ad you can run immediately on Public
                    Streamer channels and events — and even save for future use.
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
              { step: 1, label: 'Upload Media', icon: Upload },
              { step: 2, label: 'Describe Ad', icon: FileImage },
              { step: 3, label: 'Customize', icon: Settings },
              { step: 4, label: 'Preview & Save', icon: Eye },
            ].map(({ step, label, icon: Icon }, index) => (
              <div key={step} className="flex items-center">
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full ${
                    currentStep >= step
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                      : 'bg-white/20 text-white/60'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <span
                  className={`ml-2 text-sm ${
                    currentStep >= step ? 'text-white' : 'text-white/60'
                  }`}
                >
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
                  <input
                    type="file"
                    multiple
                    accept="video/mp4,video/mov,image/jpeg,image/jpg,image/png,image/gif"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="media-upload"
                  />
                  <label htmlFor="media-upload" className="cursor-pointer">
                    <div className="space-y-3">
                      <div className="flex justify-center">
                        <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-3 rounded-full">
                          <Upload className="h-8 w-8 text-white" />
                        </div>
                      </div>
                      <div>
                        <p className="text-white font-medium">
                          Click to upload or drag and drop
                        </p>
                        <p className="text-white/60 text-sm">
                          MP4, MOV, JPG, PNG, GIF (max 50MB)
                        </p>
                      </div>
                    </div>
                  </label>
                </div>

                {/* Uploaded Files */}
                {uploadedMedia.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-white font-medium">
                      Uploaded Media ({uploadedMedia.length})
                    </h4>
                    {uploadedMedia.map((media) => (
                      <div
                        key={media.id}
                        className="flex items-center space-x-3 bg-white/5 rounded-lg p-3"
                      >
                        <div className="flex-shrink-0">
                          {media.type.startsWith('video/') ? (
                            <Video className="h-8 w-8 text-blue-300" />
                          ) : (
                            <ImageIcon className="h-8 w-8 text-green-300" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-medium truncate">
                            {media.name}
                          </p>
                          <p className="text-white/60 text-xs">
                            {formatFileSize(media.size)}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeMedia(media.id)}
                          className="text-red-300 hover:text-red-200 hover:bg-red-500/20"
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Step 2: Ad Description */}
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center space-x-2">
                  <FileImage className="h-5 w-5" />
                  <span>2. What is your ad about?</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Tell us about your product, service, or offer. What makes it special? Who is it for? Include any key details like pricing, benefits, or special offers..."
                  value={adDescription}
                  onChange={(e) => {
                    setAdDescription(e.target.value);
                    if (e.target.value.trim() && currentStep < 2)
                      setCurrentStep(2);
                  }}
                  className="min-h-[120px] bg-white/10 border-white/20 text-white placeholder:text-white/50 resize-none"
                />
                <p className="text-white/60 text-xs mt-2">
                  {adDescription.length}/500 characters
                </p>
              </CardContent>
            </Card>

            {/* Step 3: Style & Music */}
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center space-x-2">
                  <Settings className="h-5 w-5" />
                  <span>3. Customize Your Ad</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Style Presets */}
                <div>
                  <h4 className="text-white font-medium mb-3">
                    Choose a Style
                  </h4>
                  <div className="grid grid-cols-1 gap-3">
                    {stylePresets.map((preset) => (
                      <div
                        key={preset.id}
                        className={`cursor-pointer rounded-lg border-2 p-3 transition-all ${
                          selectedStyle === preset.id
                            ? 'border-blue-400 bg-blue-500/20'
                            : 'border-white/20 bg-white/5 hover:border-white/40'
                        }`}
                        onClick={() => {
                          setSelectedStyle(preset.id);
                          if (currentStep < 3) setCurrentStep(3);
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-white font-medium">
                              {preset.name}
                            </p>
                            <p className="text-white/60 text-sm">
                              {preset.description}
                            </p>
                          </div>
                          <Sparkles
                            className={`h-5 w-5 ${
                              selectedStyle === preset.id
                                ? 'text-blue-300'
                                : 'text-white/40'
                            }`}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Music Selection */}
                <div>
                  <h4 className="text-white font-medium mb-3 flex items-center space-x-2">
                    <Music className="h-4 w-4" />
                    <span>Background Music (Optional)</span>
                  </h4>
                  <div className="space-y-2">
                    <div
                      className={`cursor-pointer rounded-lg border-2 p-3 transition-all ${
                        !selectedMusicTrack
                          ? 'border-blue-400 bg-blue-500/20'
                          : 'border-white/20 bg-white/5 hover:border-white/40'
                      }`}
                      onClick={() => setSelectedMusicTrack(null)}
                    >
                      <div className="flex items-center space-x-3">
                        <Wand2 className="h-5 w-5 text-purple-300" />
                        <div>
                          <p className="text-white font-medium">
                            Auto-match music for me
                          </p>
                          <p className="text-white/60 text-sm">
                            We'll pick the perfect track
                          </p>
                        </div>
                      </div>
                    </div>
                    {musicTracks.slice(0, 3).map((track) => (
                      <div
                        key={track.id}
                        className={`cursor-pointer rounded-lg border-2 p-3 transition-all ${
                          selectedMusicTrack?.id === track.id
                            ? 'border-blue-400 bg-blue-500/20'
                            : 'border-white/20 bg-white/5 hover:border-white/40'
                        }`}
                        onClick={() => setSelectedMusicTrack(track)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <Volume2 className="h-4 w-4 text-green-300" />
                            <div>
                              <p className="text-white text-sm font-medium">
                                {track.name}
                              </p>
                              <div className="flex items-center space-x-2">
                                <Badge variant="secondary" className="text-xs">
                                  {track.mood}
                                </Badge>
                                <span className="text-white/60 text-xs">
                                  {track.duration}
                                </span>
                              </div>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-white/60 hover:text-white"
                          >
                            <PlayCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Generation & Preview */}
          <div className="space-y-6">
            {/* Generate Button */}
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardContent className="p-6 text-center">
                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-3 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
                    <Wand2 className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white text-xl font-bold mb-2">
                      Ready to Create Magic?
                    </h3>
                    <p className="text-white/70 mb-4">
                      We'll combine your media with professional effects and
                      create an amazing ad in seconds!
                    </p>
                  </div>

                  {!isGenerating && !generatedAdUrl && (
                    <Button
                      onClick={generateAdPreview}
                      disabled={
                        uploadedMedia.length === 0 ||
                        !adDescription.trim() ||
                        !selectedStyle
                      }
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 text-lg font-bold shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                      <Sparkles className="h-5 w-5 mr-2" />
                      Generate Ad Preview for Me
                    </Button>
                  )}

                  {isGenerating && (
                    <div className="space-y-4">
                      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-lg">
                        <Zap className="h-5 w-5 mr-2 inline animate-spin" />
                        Creating your amazing ad...
                      </div>
                      <Progress value={generationProgress} className="w-full" />
                      <p className="text-white/70 text-sm">
                        This usually takes 30-60 seconds
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Preview & Actions */}
            {generatedAdUrl && (
              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardHeader>
                  <CardTitle className="text-white flex items-center space-x-2">
                    <Eye className="h-5 w-5" />
                    <span>4. Your Ad Preview</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Video Preview */}
                  <div className="bg-black rounded-lg overflow-hidden">
                    <div className="aspect-video flex items-center justify-center text-white">
                      <div className="text-center">
                        <PlayCircle className="h-16 w-16 mx-auto mb-3 text-white/60" />
                        <p className="text-white/80">
                          Your Generated Ad Preview
                        </p>
                        <p className="text-white/60 text-sm">Click to play</p>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-3">
                    <Button
                      onClick={() => toast.info('Playing your ad preview...')}
                      className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-bold py-3"
                    >
                      <PlayCircle className="h-5 w-5 mr-2" />
                      Preview My Ad
                    </Button>

                    <Separator className="bg-white/20" />

                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        onClick={saveAd}
                        variant="secondary"
                        className="bg-white/10 border border-white/30 text-white hover:bg-white/20"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        Save Ad
                      </Button>
                      <Button
                        onClick={downloadAd}
                        variant="secondary"
                        className="bg-white/10 border border-white/30 text-white hover:bg-white/20"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </div>

                    <Button
                      onClick={goToRunAd}
                      className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white font-bold py-3"
                    >
                      <Zap className="h-5 w-5 mr-2" />
                      Run My Ad Now
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Ad with Feedback Demo */}
            {generatedAdUrl && (
              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardHeader>
                  <CardTitle className="text-white text-lg flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Preview: How Viewers Will See Your Ad
                  </CardTitle>
                  <p className="text-white/80 text-sm">
                    This shows how your ad will appear to viewers with the
                    feedback system
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="max-w-sm mx-auto">
                    <AdWithFeedback
                      adId={`demo-${Date.now()}`}
                      adName={adDescription || 'Your Amazing Ad'}
                      adType="video"
                      adDuration={30}
                      thumbnailUrl={generatedAdUrl}
                    />
                  </div>
                  <div className="mt-4 p-3 bg-black/20 rounded-lg">
                    <p className="text-white/80 text-xs text-center">
                      📝 Try watching the full ad to see the feedback popup in
                      action!
                      <br />
                      Viewer feedback helps you improve future ads.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Helper Tips */}
            <Card className="bg-white/10 backdrop-blur-sm border-white/20 relative z-0">
              <CardHeader>
                <CardTitle className="text-white text-lg">
                  💡 Pro Tips
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-white/80 text-sm space-y-2">
                  <li>• Use high-quality images and videos for best results</li>
                  <li>• Keep your description clear and compelling</li>
                  <li>• Square or landscape formats work best for ads</li>
                  <li>• Background music can increase engagement by 40%</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateAd;
