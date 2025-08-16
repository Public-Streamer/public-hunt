import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Detects if a URL points to an image file based on file extension
 */
export function isImageUrl(url: string): boolean {
  if (!url) return false;
  
  const imageExtensions = [
    '.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg', '.ico', '.tiff', '.tif'
  ];
  
  const urlPath = url.toLowerCase().split('?')[0]; // Remove query params
  return imageExtensions.some(ext => urlPath.endsWith(ext));
}

/**
 * Filters an array of URLs to only include images
 */
export function filterImageUrls(urls: string[]): string[] {
  return urls.filter(isImageUrl);
}
