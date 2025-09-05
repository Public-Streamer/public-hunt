import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Detects if a URL points to an image file based on file extension
 */
export function isImageUrl(url: string): boolean {
  if (!url) return false;

  const imageExtensions = [
    '.jpg',
    '.jpeg',
    '.png',
    '.gif',
    '.webp',
    '.bmp',
    '.svg',
    '.ico',
    '.tiff',
    '.tif',
  ];

  const urlPath = url.toLowerCase().split('?')[0]; // Remove query params
  return imageExtensions.some((ext) => urlPath.endsWith(ext));
}

/**
 * Filters an array of URLs to only include images
 */
export function filterImageUrls(urls: string[]): string[] {
  return urls.filter(isImageUrl);
}

/**
 * Detects if a URL points to a video file based on file extension
 */
export function isVideoUrl(url: string): boolean {
  if (!url) return false;

  const videoExtensions = [
    '.mp4',
    '.webm',
    '.ogg',
    '.mov',
    '.avi',
    '.mkv',
    '.m4v',
    '.flv',
    '.wmv',
  ];

  const urlPath = url.toLowerCase().split('?')[0]; // Remove query params
  return videoExtensions.some((ext) => urlPath.endsWith(ext));
}

/**
 * Determines the media type of a URL
 */
export function getMediaType(url: string): 'image' | 'video' | 'unknown' {
  if (isImageUrl(url)) return 'image';
  if (isVideoUrl(url)) return 'video';
  return 'unknown';
}

/**
 * Filters an array of URLs to only include videos
 */
export function filterVideoUrls(urls: string[]): string[] {
  return urls.filter(isVideoUrl);
}
