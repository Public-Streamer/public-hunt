import { useCallback, useRef } from 'react';

/**
 * Hook to debounce callback functions, useful for preventing rapid-fire execution
 * of event handlers, API calls, or state updates.
 */
export const useDebounceCallback = <T extends (...args: any[]) => void>(
  callback: T,
  delay: number
): T => {
  const debounceTimer = useRef<NodeJS.Timeout>();

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      // Clear existing timer
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }

      // Set new timer
      debounceTimer.current = setTimeout(() => {
        callback(...args);
      }, delay);
    },
    [callback, delay]
  ) as T;

  return debouncedCallback;
};