import { useState, useEffect, useRef } from 'react';

interface DataPoint {
    time: string;
    viewers: number;
    timestamp: number;
}

interface UseLiveAnalyticsOptions {
    eventId: string;
    getViewerCount: () => number;
    intervalMs?: number;
    maxDataPoints?: number;
}

interface UseLiveAnalyticsResult {
    data: DataPoint[];
    currentViewers: number;
    peakViewers: number;
    avgViewers: number;
}

export function useLiveAnalytics({
    eventId,
    getViewerCount,
    intervalMs = 10000, // 10 seconds
    maxDataPoints = 180 // 30 minutes at 10s intervals
}: UseLiveAnalyticsOptions): UseLiveAnalyticsResult {
    const [data, setData] = useState<DataPoint[]>([]);
    const [peakViewers, setPeakViewers] = useState(0);
    const intervalRef = useRef<NodeJS.Timeout>();

    useEffect(() => {
        // Collect initial data point
        const collectDataPoint = () => {
            const viewers = getViewerCount();
            const now = new Date();

            const dataPoint: DataPoint = {
                time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                viewers,
                timestamp: now.getTime()
            };

            setData(prev => {
                const newData = [...prev, dataPoint];
                // Keep only the last maxDataPoints
                if (newData.length > maxDataPoints) {
                    return newData.slice(-maxDataPoints);
                }
                return newData;
            });

            if (viewers > peakViewers) {
                setPeakViewers(viewers);
            }
        };

        // Collect first point immediately
        collectDataPoint();

        // Set up interval
        intervalRef.current = setInterval(collectDataPoint, intervalMs);

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [eventId, intervalMs, maxDataPoints]);

    // Calculate averages
    const currentViewers = data.length > 0 ? data[data.length - 1].viewers : 0;
    const avgViewers = data.length > 0
        ? Math.round(data.reduce((sum, d) => sum + d.viewers, 0) / data.length)
        : 0;

    return {
        data,
        currentViewers,
        peakViewers,
        avgViewers
    };
}

export default useLiveAnalytics;
