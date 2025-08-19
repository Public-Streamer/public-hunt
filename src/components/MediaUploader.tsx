import React, { useEffect, useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Upload, X, FileImage, FileVideo, File } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

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
  onUploadUrls?: (urls: string[]) => void;
  maxFiles?: number;
  acceptedTypes?: string[];
  initialUrls?: string[];
}

const MediaUploader: React.FC<MediaUploaderProps> = ({
  onUpload,
  onUploadUrls,
  maxFiles = 5,
  acceptedTypes = ["image/jpeg", "image/png", "image/gif"],
  initialUrls = [],
}) => {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const initializedRef = useRef(false);

  // Generate unique ID for files
  const generateFileId = useCallback(() => {
    return `file-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  }, []);

  // Initialize with existing URLs once
  useEffect(() => {
    if (initialUrls.length > 0 && !initializedRef.current) {
      console.log('MediaUploader: Initializing with existing URLs:', initialUrls);
      const existingFiles: MediaFile[] = initialUrls.map((url, index) => {
        const fileName = url.split('/').pop() || `media-${index}`;
        const fileType = fileName.includes('.') 
          ? `image/${fileName.split('.').pop()}`
          : 'image/jpeg';
        
        return {
          id: `existing-${index}-${Math.random().toString(36).substring(2, 8)}`,
          name: fileName,
          type: fileType,
          size: 0, // Unknown size for existing files
          url: url,
          uploadProgress: 100, // Mark as completed
        };
      });
      setFiles(existingFiles);
      initializedRef.current = true;
    }
  }, [initialUrls]);

  const handleFileSelect = useCallback(async (selectedFiles: FileList) => {
    console.log('MediaUploader: File selection started, files:', selectedFiles.length);
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB in bytes
    const newFiles: MediaFile[] = [];
    const remaining = Math.max(0, maxFiles - files.length);

    console.log('MediaUploader: Current files count:', files.length, 'Max files:', maxFiles, 'Remaining slots:', remaining);

    for (
      let i = 0;
      i < selectedFiles.length && newFiles.length < remaining;
      i++
    ) {
      const file = selectedFiles[i];
      console.log('MediaUploader: Processing file:', file.name, 'Type:', file.type, 'Size:', file.size);

      // Check file size limit
      if (file.size > MAX_FILE_SIZE) {
        toast({
          title: "File Too Large",
          description: `${file.name} exceeds the 10 MB size limit`,
          variant: "destructive",
        });
        continue; // skip file
      }

      // Check accepted type
      if (acceptedTypes.includes(file.type)) {
        const fileId = generateFileId();
        console.log('MediaUploader: Adding file with ID:', fileId);
        newFiles.push({
          id: fileId,
          name: file.name,
          type: file.type,
          size: file.size,
          uploadProgress: 0,
          file: file,
        });
      } else {
        console.log('MediaUploader: File type not accepted:', file.type);
        toast({
          title: "File Type Not Supported",
          description: `${file.name} is not a supported file type`,
          variant: "destructive",
        });
      }
    }

    console.log('MediaUploader: New files to upload:', newFiles.length);

    if (maxFiles === 1) {
      if (files.length > 0) {
        console.log('MediaUploader: Removing existing file for single file mode');
        await removeFile(files[0].id);
      }
      setFiles(newFiles.slice(0, 1));
    } else {
      setFiles((prev) => {
        const merged = [...prev, ...newFiles];
        const result = merged.slice(0, maxFiles);
        console.log('MediaUploader: Updated files array, total count:', result.length);
        return result;
      });
    }

    if (newFiles.length > 0) {
      await uploadFiles(newFiles);
    }
  }, [files.length, maxFiles, acceptedTypes, generateFileId, toast]);

  const uploadFiles = async (filesToUpload: MediaFile[]) => {
    setIsUploading(true);

    for (const mediaFile of filesToUpload) {
      try {
        if (!mediaFile.file) continue;

        const fileExt = mediaFile.name.split(".").pop();
        const fileName = `${Date.now()}-${Math.random()
          .toString(36)
          .substring(2)}.${fileExt}`;

        setFiles((prev) =>
          prev.map((f) =>
            f.id === mediaFile.id ? { ...f, uploadProgress: 50 } : f
          )
        );

        const { data, error } = await supabase.storage
          .from("media")
          .upload(fileName, mediaFile.file);

        if (error) throw error;

        const { data: urlData } = supabase.storage
          .from("media")
          .getPublicUrl(fileName);

        setFiles((prev) =>
          prev.map((f) =>
            f.id === mediaFile.id
              ? { ...f, uploadProgress: 100, url: urlData.publicUrl }
              : f
          )
        );
      } catch (error) {
        console.error("Upload error:", error);
        let errorMessage = `Failed to upload ${mediaFile.name}`;

        if (error instanceof Error) {
          if (error.message.includes("row-level security")) {
            errorMessage = `Permission denied: Please make sure you're logged in to upload files`;
          } else if (error.message.includes("size")) {
            errorMessage = `File too large: ${mediaFile.name}`;
          } else if (error.message.includes("bucket")) {
            errorMessage = `Storage error: Cannot access media storage`;
          } else {
            errorMessage = `Upload failed: ${error.message}`;
          }
        }

        toast({
          title: "Upload Failed",
          description: errorMessage,
          variant: "destructive",
        });

        setFiles((prev) => prev.filter((f) => f.id !== mediaFile.id));
      }
    }

    setIsUploading(false);
  };

  const removeFile = useCallback(async (fileId: string) => {
    console.log('MediaUploader: Removing file with ID:', fileId);
    const fileToRemove = files.find((f) => f.id === fileId);

    // Only remove from storage if it's a newly uploaded file (not an existing one)
    if (fileToRemove?.url && !fileId.startsWith('existing-')) {
      try {
        const fileName = fileToRemove.url.split("/").pop();
        if (fileName) {
          console.log('MediaUploader: Removing from storage:', fileName);
          await supabase.storage.from("media").remove([fileName]);
        }
      } catch (error) {
        console.error("Error removing file:", error);
      }
    }

    setFiles((prev) => {
      const updated = prev.filter((file) => file.id !== fileId);
      console.log('MediaUploader: Files after removal:', updated.length);
      return updated;
    });
  }, [files]);

  // Stabilized callback to prevent unnecessary re-renders
  const stableOnUpload = useCallback(onUpload, []);
  const stableOnUploadUrls = useCallback(onUploadUrls || (() => {}), [onUploadUrls]);

  useEffect(() => {
    const completedFiles = files.filter((f) => f.uploadProgress === 100);
    console.log('MediaUploader: Triggering onUpload callback with', completedFiles.length, 'completed files');
    
    // Always call onUpload with current files (even if empty array)
    stableOnUpload(completedFiles);
    if (typeof stableOnUploadUrls === "function") {
      const urls = completedFiles.map((f) => f.url!).filter(Boolean);
      console.log('MediaUploader: Triggering onUploadUrls callback with URLs:', urls);
      stableOnUploadUrls(urls);
    }
  }, [files, stableOnUpload, stableOnUploadUrls]);

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
    if (type.startsWith("image/")) return <FileImage className="h-8 w-8" />;
    if (type.startsWith("video/")) return <FileVideo className="h-8 w-8" />;
    return <File className="h-8 w-8" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Upload className="h-5 w-5 mr-2" />
          Media Upload{" "}
          <span className="text-sm font-normal text-gray-500 ml-2">
            (optional)
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
            isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300"
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {files.length > 0 && files.some((f) => f.uploadProgress === 100) ? (
            <div className="grid grid-cols-3 gap-4 mb-4">
              {files
                .filter((f) => f.uploadProgress === 100)
                .map((file) => (
                  <div key={file.id} className="relative group">
                    {file.type.startsWith("image/") ? (
                      <img
                        src={file.url}
                        alt={file.name}
                        className="aspect-video object-cover rounded border"
                      />
                    ) : file.type.startsWith("video/") ? (
                      <video
                        src={file.url}
                        className="aspect-video object-cover rounded border"
                        controls={false}
                        muted
                      />
                    ) : (
                      <div className="aspect-video bg-gray-100 rounded border flex items-center justify-center">
                        {getFileIcon(file.type)}
                      </div>
                    )}
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        removeFile(file.id);
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
            </div>
          ) : (
            <>
              <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium mb-2">
                Drop files here or click to upload
              </p>
              <p className="text-sm text-gray-500 mb-4">
                Supported formats: JPG, PNG, GIF <br />
                Max file size: 10 MB
              </p>
            </>
          )}

          <input
            type="file"
            accept={acceptedTypes.join(",")}
            onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
            className="hidden"
            id="file-upload"
            disabled={isUploading || files.length >= maxFiles}
            multiple={maxFiles > 1}
          />
          <Label htmlFor="file-upload" className="cursor-pointer">
            <div className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2">
              {isUploading
                ? "Uploading..."
                : files.length >= maxFiles
                ? "Max files reached"
                : "Select files"}
            </div>
          </Label>
        </div>

        {files.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium">Uploaded File</h4>
            {files.map((file) => (
              <div
                key={file.id}
                className="flex items-center gap-3 p-2 border rounded-lg"
              >
                <div className="text-gray-500">{getFileIcon(file.type)}</div>
                <div className="flex-1 ">
                  <div className="font-medium truncate-1">{file.name}</div>
                  <div className="text-sm text-gray-500">
                    {formatFileSize(file.size)}
                  </div>
                  {file.uploadProgress !== undefined &&
                    file.uploadProgress < 100 && (
                      <Progress value={file.uploadProgress} className="mt-1" />
                    )}
                  {file.uploadProgress === 100 && (
                    <div className="text-sm text-green-600 mt-1">✓</div>
                  )}
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    removeFile(file.id);
                  }}
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
