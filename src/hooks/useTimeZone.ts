import { useState, useEffect } from 'react';

/**
 * Custom hook for time zone detection and management
 * @returns Time zone detection and conversion utilities
 */
export const useTimeZone = () => {
  const [userTimeZone, setUserTimeZone] = useState<string>('');
  const [detectedTimeZone, setDetectedTimeZone] = useState<string>('');
  const [timeZoneError, setTimeZoneError] = useState<string | null>(null);

  // Detect user's time zone from browser
  useEffect(() => {
    try {
      // Try to detect time zone from browser
      const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (detected) {
        setDetectedTimeZone(detected);
        setUserTimeZone(detected);
      } else {
        // Fallback to UTC if detection fails
        setDetectedTimeZone('UTC');
        setUserTimeZone('UTC');
      }
    } catch (error) {
      console.error('Time zone detection failed:', error);
      setTimeZoneError('Failed to detect time zone');
      // Fallback to UTC
      setDetectedTimeZone('UTC');
      setUserTimeZone('UTC');
    }
  }, []);

  /**
   * Convert UTC time to user's local time
   * @param utcTime UTC time string
   * @param targetTimeZone Target time zone (defaults to user's time zone)
   * @returns Formatted local time string
   */
  const convertToLocalTime = (utcTime: string, targetTimeZone: string = userTimeZone): string => {
    try {
      if (!utcTime) return '';

      const date = new Date(utcTime);

      // Handle invalid dates
      if (isNaN(date.getTime())) {
        return 'Invalid date';
      }

      // Format with time zone
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: targetTimeZone,
        hour12: true
      }).format(date);
    } catch (error) {
      console.error('Time conversion error:', error);
      return 'Invalid time';
    }
  };

  /**
   * Convert local time to UTC
   * @param localTime Local time string
   * @param sourceTimeZone Source time zone (defaults to user's time zone)
   * @returns UTC time string
   */
  const convertToUTC = (localTime: string, sourceTimeZone: string = userTimeZone): string => {
    try {
      if (!localTime) return '';

      // Parse local time in the source time zone
      const date = new Date(localTime);
      if (isNaN(date.getTime())) {
        return 'Invalid date';
      }

      // Convert to UTC
      const utcDate = new Date(date.toLocaleString('en-US', { timeZone: sourceTimeZone }));
      return utcDate.toISOString();
    } catch (error) {
      console.error('UTC conversion error:', error);
      return 'Invalid time';
    }
  };

  /**
   * Get all available time zones
   * @returns Array of time zone options
   */
  const getTimeZones = (): Array<{ value: string; label: string; offset: string }> => {
    return [
      { value: 'America/New_York', label: 'Eastern Time (ET)', offset: 'UTC-5' },
      { value: 'America/Chicago', label: 'Central Time (CT)', offset: 'UTC-6' },
      { value: 'America/Denver', label: 'Mountain Time (MT)', offset: 'UTC-7' },
      { value: 'America/Los_Angeles', label: 'Pacific Time (PT)', offset: 'UTC-8' },
      { value: 'Europe/London', label: 'Greenwich Mean Time (GMT)', offset: 'UTC+0' },
      { value: 'Europe/Paris', label: 'Central European Time (CET)', offset: 'UTC+1' },
      { value: 'Asia/Tokyo', label: 'Japan Standard Time (JST)', offset: 'UTC+9' },
      { value: 'Australia/Sydney', label: 'Australian Eastern Time (AET)', offset: 'UTC+10' },
      { value: 'UTC', label: 'Coordinated Universal Time (UTC)', offset: 'UTC+0' }
    ];
  };

  /**
   * Get time zone offset for display
   * @param timeZone Time zone identifier
   * @returns Formatted offset string
   */
  const getTimeZoneOffset = (timeZone: string): string => {
    try {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = {
        timeZone,
        timeZoneName: 'short',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      };

      // Get formatter to extract offset
      const formatter = new Intl.DateTimeFormat('en-US', options);
      const parts = formatter.formatToParts(now);

      // Find the time zone part
      const tzPart = parts.find(part => part.type === 'timeZoneName');
      return tzPart?.value || 'UTC';
    } catch (error) {
      console.error('Error getting time zone offset:', error);
      return 'UTC';
    }
  };

  /**
   * Check if time zone is valid
   * @param timeZone Time zone to validate
   * @returns Boolean indicating validity
   */
  const isValidTimeZone = (timeZone: string): boolean => {
    try {
      if (!timeZone) return false;
      new Intl.DateTimeFormat('en-US', { timeZone }).format();
      return true;
    } catch (error) {
      return false;
    }
  };

  return {
    userTimeZone,
    detectedTimeZone,
    timeZoneError,
    setUserTimeZone,
    convertToLocalTime,
    convertToUTC,
    getTimeZones,
    getTimeZoneOffset,
    isValidTimeZone
  };
};