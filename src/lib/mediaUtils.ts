// Utility functions for handling media URLs (images and videos)

export const isVideoUrl = (url: string): boolean => {
  if (!url) return false;
  
  const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv'];
  const lowercaseUrl = url.toLowerCase();
  
  return videoExtensions.some(ext => lowercaseUrl.includes(ext));
};

export const isImageUrl = (url: string): boolean => {
  if (!url) return false;
  
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp'];
  const lowercaseUrl = url.toLowerCase();
  
  return imageExtensions.some(ext => lowercaseUrl.includes(ext));
};

export const getMediaType = (url: string): 'image' | 'video' | 'unknown' => {
  if (isImageUrl(url)) return 'image';
  if (isVideoUrl(url)) return 'video';
  return 'unknown';
};