import { useCallback, useRef } from 'react';

/**
 * Hook to throttle callback functions, ensuring they're called at most once
 * per specified interval. Useful for performance optimization of frequent events.
 */
export const useThrottleCallback = <T extends (...args: any[]) => void>(
  callback: T,
  delay: number
): T => {
  const lastCall = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const throttledCallback = useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();
      
      if (now - lastCall.current >= delay) {
        // Execute immediately if enough time has passed
        lastCall.current = now;
        callback(...args);
      } else {
        // Schedule execution for later if we're within the throttle window
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        
        timeoutRef.current = setTimeout(() => {
          lastCall.current = Date.now();
          callback(...args);
        }, delay - (now - lastCall.current));
      }
    },
    [callback, delay]
  ) as T;

  return throttledCallback;
};