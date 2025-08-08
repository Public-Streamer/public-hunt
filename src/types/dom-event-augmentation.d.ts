
/**
 * Minimal augmentation so components that (incorrectly) use the global DOM Event
 * type for app "Event" objects can compile without modifying read-only files.
 * Only add the exact properties that are accessed.
 */
declare global {
  interface Event {
    id?: string;
    mediaUrls?: string[];
  }
}

export {};
