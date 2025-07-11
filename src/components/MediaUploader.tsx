import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Upload, X, FileImage, FileVideo, File } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

interface MediaFile {
  id: string;
  name: string;
  type: string;
  size: number;
  url?: string;
  uploadProgress?: number;
  file?: File;
}

interface MediaUploaderProps {
  onUpload: (files: MediaFile[]) => void;
  maxFiles?: number;
  acceptedTypes?: string[];
}

const MediaUploader: React.FC<MediaUploaderProps> = ({ 
  onUpload, 
  maxFiles = 10,
  acceptedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'video/mp4', 'video/mpeg', 'video/quicktime']
}) => {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const handleFileSelect = async (selectedFiles: FileList) => {
    const newFiles: MediaFile[] = [];
    
    for (let i = 0; i < selectedFiles.length && files.length + newFiles.length < maxFiles; i++) {
      const file = selectedFiles[i];
      
      if (acceptedTypes.includes(file.type)) {
        newFiles.push({
          id: Date.now() + i + '',
          name: file.name,
          type: file.type,
          size: file.size,
          uploadProgress: 0,
          file: file
        });
      }
    }
    
    const updatedFiles = [...files, ...newFiles];
    setFiles(updatedFiles);
    
    // Upload files to Supabase
    await uploadFiles(newFiles);
  };

  const uploadFiles = async (filesToUpload: MediaFile[]) => {
    setIsUploading(true);
    
    for (const mediaFile of filesToUpload) {
      try {
        if (!mediaFile.file) continue;
        
        const fileExt = mediaFile.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        
        // Update progress
        setFiles(prev => prev.map(f => 
          f.id === mediaFile.id ? { ...f, uploadProgress: 50 } : f
        ));
        
        const { data, error } = await supabase.storage
          .from('media')
          .upload(fileName, mediaFile.file);
        
        if (error) {
          throw error;
        }
        
        // Get public URL
        const { data: urlData } = supabase.storage
          .from('media')
          .getPublicUrl(fileName);
        
        // Update file with URL and complete progress
        setFiles(prev => prev.map(f => 
          f.id === mediaFile.id ? { 
            ...f, 
            uploadProgress: 100, 
            url: urlData.publicUrl 
          } : f
        ));
        
      } catch (error) {
        console.error('Upload error:', error);
        toast({
          title: "Upload Failed",
          description: `Failed to upload ${mediaFile.name}`,
          variant: "destructive"
        });
        
        // Remove failed file
        setFiles(prev => prev.filter(f => f.id !== mediaFile.id));
      }
    }
    
    setIsUploading(false);
    
    // Notify parent component
    const completedFiles = files.filter(f => f.uploadProgress === 100);
    onUpload(completedFiles);
  };

  const removeFile = async (fileId: string) => {
    const fileToRemove = files.find(f => f.id === fileId);
    
    if (fileToRemove?.url) {
      try {
        // Extract filename from URL
        const fileName = fileToRemove.url.split('/').pop();
        if (fileName) {
          await supabase.storage.from('media').remove([fileName]);
        }
      } catch (error) {
        console.error('Error removing file:', error);
      }
    }
    
    const updatedFiles = files.filter(file => file.id !== fileId);
    setFiles(updatedFiles);
    onUpload(updatedFiles);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <FileImage className="h-8 w-8" />;
    if (type.startsWith('video/')) return <FileVideo className="h-8 w-8" />;
    return <File className="h-8 w-8" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Upload className="h-5 w-5 mr-2" />
          Media Upload <span className="text-sm font-normal text-gray-500 ml-2">(optional)</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p className="text-lg font-medium mb-2">Drop files here or click to upload</p>
          <p className="text-sm text-gray-500 mb-4">
            Supported formats: JPG, PNG, GIF, PDF, MP4, MPEG, MOV
          </p>
          <input
            type="file"
            multiple
            accept={acceptedTypes.join(',')}
            onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
            className="hidden"
            id="file-upload"
            disabled={isUploading}
          />
          <Label htmlFor="file-upload">
            <Button variant="outline" className="cursor-pointer" disabled={isUploading}>
              {isUploading ? 'Uploading...' : 'Select Files'}
            </Button>
          </Label>
        </div>

        {files.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium">Uploaded Files ({files.length}/{maxFiles})</h4>
            {files.map(file => (
              <div key={file.id} className="flex items-center gap-3 p-3 border rounded-lg">
                <div className="text-gray-500">
                  {getFileIcon(file.type)}
                </div>
                <div className="flex-1">
                  <div className="font-medium">{file.name}</div>
                  <div className="text-sm text-gray-500">{formatFileSize(file.size)}</div>
                  {file.uploadProgress !== undefined && file.uploadProgress < 100 && (
                    <Progress value={file.uploadProgress} className="mt-1" />
                  )}
                  {file.uploadProgress === 100 && (
                    <div className="text-sm text-green-600 mt-1">✓ Uploaded successfully</div>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => removeFile(file.id)}
                  disabled={isUploading}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MediaUploader;