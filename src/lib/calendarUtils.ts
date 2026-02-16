import { createEvents, EventAttributes } from 'ics';
import { format, parseISO } from 'date-fns';
import { formatInTimeZone, toZonedTime } from 'date-fns-tz';

/**
 * Detects the user's timezone from browser settings
 */
export function detectUserTimezone(): string {
    try {
        return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
        return 'America/New_York'; // Default fallback
    }
}

/**
 * Gets a list of common timezones for selection
 */
export function getCommonTimezones(): { value: string; label: string }[] {
    return [
        { value: 'America/New_York', label: 'Eastern Time (ET)' },
        { value: 'America/Chicago', label: 'Central Time (CT)' },
        { value: 'America/Denver', label: 'Mountain Time (MT)' },
        { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
        { value: 'America/Anchorage', label: 'Alaska Time (AKT)' },
        { value: 'Pacific/Honolulu', label: 'Hawaii Time (HT)' },
        { value: 'UTC', label: 'UTC' },
        { value: 'Europe/London', label: 'London (GMT/BST)' },
        { value: 'Europe/Paris', label: 'Paris (CET)' },
        { value: 'Europe/Berlin', label: 'Berlin (CET)' },
        { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
        { value: 'Asia/Shanghai', label: 'Shanghai (CST)' },
        { value: 'Asia/Singapore', label: 'Singapore (SGT)' },
        { value: 'Australia/Sydney', label: 'Sydney (AEST)' },
    ];
}

/**
 * Formats a date for display in a specific timezone
 */
export function formatDateInTimezone(
    date: Date | string,
    timezone: string,
    formatStr: string = 'PPP p'
): string {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return formatInTimeZone(dateObj, timezone, formatStr);
}

/**
 * Gets the UTC offset label for a timezone
 */
export function getTimezoneOffset(timezone: string): string {
    const now = new Date();
    const zonedDate = toZonedTime(now, timezone);
    return formatInTimeZone(zonedDate, timezone, 'XXX'); // e.g., "-05:00"
}

interface EventData {
    id: string;
    title: string;
    description?: string;
    date: string; // ISO string
    duration?: number; // minutes
    location?: string;
}

/**
 * Generates an .ics file content for an event
 */
export async function generateICS(event: EventData): Promise<Blob | null> {
    try {
        const eventDate = parseISO(event.date);

        // ICS requires [year, month, day, hour, minute] format
        const startArray: [number, number, number, number, number] = [
            eventDate.getFullYear(),
            eventDate.getMonth() + 1, // ICS months are 1-indexed
            eventDate.getDate(),
            eventDate.getHours(),
            eventDate.getMinutes()
        ];

        const durationMinutes = event.duration || 60; // Default 1 hour

        const icsEvent: EventAttributes = {
            start: startArray,
            duration: { minutes: durationMinutes },
            title: event.title,
            description: event.description || `Join ${event.title} on PublicStreamer`,
            location: event.location || 'Online Event',
            url: `${window.location.origin}/event/${event.id}`,
            status: 'CONFIRMED',
            organizer: { name: 'PublicStreamer', email: 'events@publicstreamer.com' },
            productId: 'publicstreamer/events',
        };

        return new Promise((resolve, reject) => {
            createEvents([icsEvent], (error, value) => {
                if (error) {
                    console.error('ICS generation error:', error);
                    reject(error);
                    return;
                }

                const blob = new Blob([value], { type: 'text/calendar;charset=utf-8' });
                resolve(blob);
            });
        });
    } catch (error) {
        console.error('Error generating ICS:', error);
        return null;
    }
}

/**
 * Downloads an .ics file for an event
 */
export async function downloadEventICS(event: EventData): Promise<boolean> {
    try {
        const blob = await generateICS(event);
        if (!blob) return false;

        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${event.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.ics`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        return true;
    } catch (error) {
        console.error('Error downloading ICS:', error);
        return false;
    }
}
