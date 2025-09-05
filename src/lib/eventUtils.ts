/**
 * Utility functions for event URL generation and management
 */

/**
 * Generate a URL-friendly slug from an event name
 */
export function generateSlug(eventName: string): string {
  return (
    eventName
      .toLowerCase()
      .replace(/[^a-zA-Z0-9\s]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
      .substring(0, 50) || // Limit length
    'event'
  ); // Fallback if empty
}

/**
 * Check if a string is a valid UUID
 */
export function isUUID(str: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
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
 * Extract event identifier from URL parameter (could be UUID or slug)
 */
export function parseEventIdentifier(param: string): {
  isUuid: boolean;
  identifier: string;
} {
  return {
    isUuid: isUUID(param),
    identifier: param,
  };
}
