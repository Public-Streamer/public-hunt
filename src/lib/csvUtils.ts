/**
 * CSV Utility Functions
 * Generates CSV files from analytics data
 */

interface CSVColumn {
    key: string;
    label: string;
}

/**
 * Converts an array of objects to CSV format
 */
export function generateCSV<T extends Record<string, any>>(
    data: T[],
    columns: CSVColumn[]
): string {
    if (data.length === 0) {
        return columns.map(c => c.label).join(',');
    }

    // Header row
    const header = columns.map(c => escapeCSVValue(c.label)).join(',');

    // Data rows
    const rows = data.map(row =>
        columns.map(col => escapeCSVValue(String(row[col.key] ?? ''))).join(',')
    );

    return [header, ...rows].join('\n');
}

/**
 * Escapes a value for CSV (handles commas, quotes, newlines)
 */
function escapeCSVValue(value: string): string {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
}

/**
 * Downloads a CSV file
 */
export function downloadCSV(csvContent: string, filename: string): void {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

/**
 * Standard columns for event analytics export
 */
export const EVENT_ANALYTICS_COLUMNS: CSVColumn[] = [
    { key: 'date', label: 'Date' },
    { key: 'event_name', label: 'Event' },
    { key: 'viewers', label: 'Peak Viewers' },
    { key: 'duration_minutes', label: 'Duration (min)' },
    { key: 'revenue', label: 'Revenue ($)' },
    { key: 'tips', label: 'Tips ($)' },
    { key: 'tickets_sold', label: 'Tickets Sold' },
];

/**
 * Standard columns for viewer analytics export
 */
export const VIEWER_ANALYTICS_COLUMNS: CSVColumn[] = [
    { key: 'date', label: 'Date' },
    { key: 'unique_viewers', label: 'Unique Viewers' },
    { key: 'total_watch_time', label: 'Watch Time (min)' },
    { key: 'avg_watch_time', label: 'Avg Watch Time (min)' },
    { key: 'peak_concurrent', label: 'Peak Concurrent' },
];

/**
 * Standard columns for revenue analytics export
 */
export const REVENUE_ANALYTICS_COLUMNS: CSVColumn[] = [
    { key: 'date', label: 'Date' },
    { key: 'tickets', label: 'Ticket Revenue ($)' },
    { key: 'tips', label: 'Tips ($)' },
    { key: 'ads', label: 'Ad Revenue ($)' },
    { key: 'total', label: 'Total ($)' },
];
