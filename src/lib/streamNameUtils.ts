import type { Participant } from 'livekit-client';

/**
 * Stream name utilities for consistent metadata parsing and validation
 */

export interface StreamNameMetadata {
  streamName?: string;
  [key: string]: any;
}

/**
 * Safely parse participant metadata for stream name
 */
export function parseStreamName(participant?: Participant | null): string {
  if (!participant) return '';
  
  try {
    if (!participant.metadata) {
      return participant.name || participant.identity || '';
    }

    const metadata: StreamNameMetadata = JSON.parse(participant.metadata);
    return metadata.streamName || participant.name || participant.identity || '';
  } catch (error) {
    console.warn('Failed to parse participant metadata:', error);
    return participant.name || participant.identity || '';
  }
}

/**
 * Create updated metadata with new stream name
 */
export function createStreamNameMetadata(
  currentMetadata: string | null | undefined,
  newStreamName: string
): string {
  try {
    const metadata: StreamNameMetadata = currentMetadata 
      ? JSON.parse(currentMetadata) 
      : {};
    
    return JSON.stringify({
      ...metadata,
      streamName: newStreamName || undefined
    });
  } catch (error) {
    console.warn('Failed to parse current metadata, creating new:', error);
    return JSON.stringify({ streamName: newStreamName || undefined });
  }
}

/**
 * Validate stream name format and length
 */
export function validateStreamName(name: string): { isValid: boolean; error?: string } {
  const trimmed = name.trim();
  
  if (trimmed.length === 0) {
    return { isValid: true }; // Empty names are allowed
  }
  
  if (trimmed.length > 64) {
    return { isValid: false, error: 'Stream name too long (max 64 characters)' };
  }
  
  // Check for invalid characters (optional - adjust as needed)
  const invalidChars = /[<>\"'&]/;
  if (invalidChars.test(trimmed)) {
    return { isValid: false, error: 'Stream name contains invalid characters' };
  }
  
  return { isValid: true };
}

/**
 * Normalize stream name for consistent display
 */
export function normalizeStreamName(name: string): string {
  return name.trim();
}