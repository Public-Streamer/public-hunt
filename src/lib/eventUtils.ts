/**
 * Utility functions for event URL generation and management
 */

/**
 * Generate a URL-friendly slug from an event name
 */
export function generateSlug(eventName: string): string {
  return eventName
    .toLowerCase()
    .replace(/[^a-zA-Z0-9\s]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
    .substring(0, 50) // Limit length
    || 'event'; // Fallback if empty
}

/**
 * Check if a string is a valid UUID
 */
export function isUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

/**
 * Generate the full event URL using slug
 */
export function getEventUrl(slug: string): string {
  const baseUrl = window.location.origin;
  return `${baseUrl}/event/${slug}`;
}

/**
 * Generate social media share URLs
 */
export function getSocialShareUrls(eventUrl: string, eventTitle: string, eventDescription?: string) {
  const encodedUrl = encodeURIComponent(eventUrl);
  const encodedTitle = encodeURIComponent(eventTitle);
  const encodedDescription = encodeURIComponent(eventDescription || '');

  return {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
    whatsapp: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`,
    instagram: `https://www.instagram.com/`, // Instagram doesn't support direct URL sharing
  };
}

/**
 * Extract event identifier from URL parameter (could be UUID or slug)
 */
export function parseEventIdentifier(param: string): { isUuid: boolean; identifier: string } {
  return {
    isUuid: isUUID(param),
    identifier: param
  };
}