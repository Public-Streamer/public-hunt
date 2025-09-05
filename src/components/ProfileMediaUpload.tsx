import React, { useState } from 'react';
import {
  Upload,
  Image as ImageIcon,
  Video,
  Music,
  File,
  X,
  Plus,
  Camera,
  Mic,
  Film,
  Play,
  Pause,
  Download,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface MediaFile {
  id: string;
  name: string;
  type: 'image' | 'video' | 'audio' | 'document';
  url: string;
  size: number;
  uploaded_at: string;
  caption?: string;
  tags?: string[];
}

interface ProfileMediaUploadProps {
  userId: string;
  isOwnProfile: boolean;
}

const ProfileMediaUpload: React.FC<ProfileMediaUploadProps> = ({
  userId,
  isOwnProfile,
}) => {
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [caption, setCaption] = useState('');
  const [tags, setTags] = useState('');
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setShowUploadDialog(true);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadProgress(0);

    // Simulate upload progress
    const uploadInterval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(uploadInterval);
          return 100;
        }
        return prev + 10;
      });
    }, 200);

    try {
      // Mock upload - replace with actual upload logic
      setTimeout(() => {
        const newMediaFile: MediaFile = {
          id: Date.now().toString(),
          name: selectedFile.name,
          type: selectedFile.type.startsWith('image/')
            ? 'image'
            : selectedFile.type.startsWith('video/')
              ? 'video'
              : selectedFile.type.startsWith('audio/')
                ? 'audio'
                : 'document',
          url: URL.createObjectURL(selectedFile),
          size: selectedFile.size,
          uploaded_at: new Date().toISOString(),
          caption,
          tags: tags
            .split(',')
            .map((tag) => tag.trim())
            .filter(Boolean),
        };

        setMediaFiles((prev) => [newMediaFile, ...prev]);
        setShowUploadDialog(false);
        setSelectedFile(null);
        setCaption('');
        setTags('');
        setIsUploading(false);
        setUploadProgress(0);

        toast({
          title: 'Success',
          description: 'Media uploaded successfully!',
        });
      }, 2000);
    } catch (error) {
      console.error('Upload error:', error);
      setIsUploading(false);
      setUploadProgress(0);
      toast({
        title: 'Error',
        description: 'Failed to upload media',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteMedia = (mediaId: string) => {
    setMediaFiles((prev) => prev.filter((media) => media.id !== mediaId));
    toast({
      title: 'Success',
      description: 'Media deleted successfully',
    });
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${Math.round((bytes / 1024 ** i) * 100) / 100} ${sizes[i]}`;
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'image':
        return <ImageIcon className="w-5 h-5" />;
      case 'video':
        return <Video className="w-5 h-5" />;
      case 'audio':
        return <Music className="w-5 h-5" />;
      default:
        return <File className="w-5 h-5" />;
    }
  };

  const getFileColor = (type: string) => {
    switch (type) {
      case 'image':
        return 'bg-green-500';
      case 'video':
        return 'bg-blue-500';
      case 'audio':
        return 'bg-purple-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center">
          <Upload className="w-5 h-5 mr-2" />
          Media Library
        </CardTitle>
        {isOwnProfile && (
          <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Upload
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Upload Media</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {!selectedFile ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="image-upload">Images</Label>
                      <Input
                        id="image-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                      <Button
                        variant="outline"
                        className="w-full h-20 flex flex-col items-center justify-center"
                        onClick={() =>
                          document.getElementById('image-upload')?.click()
                        }
                      >
                        <Camera className="w-6 h-6 mb-2" />
                        <span className="text-sm">Photos</span>
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="video-upload">Videos</Label>
                      <Input
                        id="video-upload"
                        type="file"
                        accept="video/*"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                      <Button
                        variant="outline"
                        className="w-full h-20 flex flex-col items-center justify-center"
                        onClick={() =>
                          document.getElementById('video-upload')?.click()
                        }
                      >
                        <Film className="w-6 h-6 mb-2" />
                        <span className="text-sm">Videos</span>
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="audio-upload">Audio</Label>
                      <Input
                        id="audio-upload"
                        type="file"
                        accept="audio/*"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                      <Button
                        variant="outline"
                        className="w-full h-20 flex flex-col items-center justify-center"
                        onClick={() =>
                          document.getElementById('audio-upload')?.click()
                        }
                      >
                        <Mic className="w-6 h-6 mb-2" />
                        <span className="text-sm">Audio</span>
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="file-upload">Documents</Label>
                      <Input
                        id="file-upload"
                        type="file"
                        accept=".pdf,.doc,.docx,.txt"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                      <Button
                        variant="outline"
                        className="w-full h-20 flex flex-col items-center justify-center"
                        onClick={() =>
                          document.getElementById('file-upload')?.click()
                        }
                      >
                        <File className="w-6 h-6 mb-2" />
                        <span className="text-sm">Files</span>
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-10 h-10 rounded-full ${getFileColor(selectedFile.type.split('/')[0])} flex items-center justify-center text-white`}
                        >
                          {getFileIcon(selectedFile.type.split('/')[0])}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium">{selectedFile.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {formatFileSize(selectedFile.size)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="caption">Caption</Label>
                      <Textarea
                        id="caption"
                        placeholder="Add a caption..."
                        value={caption}
                        onChange={(e) => setCaption(e.target.value)}
                        className="min-h-[80px]"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="tags">Tags</Label>
                      <Input
                        id="tags"
                        placeholder="Add tags separated by commas"
                        value={tags}
                        onChange={(e) => setTags(e.target.value)}
                      />
                    </div>

                    {isUploading && (
                      <div className="space-y-2">
                        <Label>Upload Progress</Label>
                        <Progress value={uploadProgress} className="w-full" />
                        <p className="text-sm text-muted-foreground text-center">
                          {uploadProgress}% complete
                        </p>
                      </div>
                    )}

                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSelectedFile(null);
                          setCaption('');
                          setTags('');
                        }}
                        disabled={isUploading}
                      >
                        Cancel
                      </Button>
                      <Button onClick={handleUpload} disabled={isUploading}>
                        {isUploading ? 'Uploading...' : 'Upload'}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </CardHeader>

      <CardContent>
        {mediaFiles.length === 0 ? (
          <div className="text-center py-8">
            <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {isOwnProfile
                ? 'No media uploaded yet. Start by uploading your first file!'
                : 'No media files to display'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {mediaFiles.map((media) => (
              <div
                key={media.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-10 h-10 rounded-full ${getFileColor(media.type)} flex items-center justify-center text-white`}
                  >
                    {getFileIcon(media.type)}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium">{media.name}</h4>
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <span>{formatFileSize(media.size)}</span>
                      <span>•</span>
                      <span>
                        {new Date(media.uploaded_at).toLocaleDateString()}
                      </span>
                    </div>
                    {media.caption && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                        {media.caption}
                      </p>
                    )}
                    {media.tags && media.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {media.tags.map((tag, index) => (
                          <Badge
                            key={index}
                            variant="secondary"
                            className="text-xs"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm">
                    <Download className="w-4 h-4" />
                  </Button>
                  {isOwnProfile && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteMedia(media.id)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProfileMediaUpload;
