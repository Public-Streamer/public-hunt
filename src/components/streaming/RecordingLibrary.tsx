import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Play, Download, Trash2, Calendar, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useAppContext } from '@/contexts/AppContext';

interface Recording {
    id: string;
    event_id: string;
    recording_url: string;
    duration_seconds: number;
    size_bytes: number;
    status: string;
    created_at: string;
    event?: {
        name: string;
    };
}

export const RecordingLibrary: React.FC = () => {
    const [recordings, setRecordings] = useState<Recording[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();
    const { user } = useAppContext();

    useEffect(() => {
        const fetchRecordings = async () => {
            if (!user) return;

            try {
                // Fetch recordings for events the user hosts
                const { data, error } = await supabase
                    .from('stream_recordings' as any)
                    .select(`
                        id,
                        event_id,
                        recording_url,
                        duration_seconds,
                        size_bytes,
                        status,
                        created_at,
                        event:events!event_id (
                            name
                        )
                    `)
                    .order('created_at', { ascending: false });

                if (error) throw error;
                setRecordings(data || []);
            } catch (err) {
                console.error('Error fetching recordings:', err);
                toast({
                    title: 'Error',
                    description: 'Failed to load recordings.',
                    variant: 'destructive'
                });
            } finally {
                setLoading(false);
            }
        };

        fetchRecordings();
    }, [user]);

    const formatDuration = (seconds: number): string => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    };

    const formatSize = (bytes: number): string => {
        if (bytes < 1024 * 1024) {
            return `${(bytes / 1024).toFixed(1)} KB`;
        }
        if (bytes < 1024 * 1024 * 1024) {
            return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
        }
        return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
    };

    const handleDelete = async (recordingId: string) => {
        if (!confirm('Are you sure you want to delete this recording?')) return;

        try {
            const { error } = await supabase
                .from('stream_recordings' as any)
                .delete()
                .eq('id', recordingId);

            if (error) throw error;

            setRecordings(prev => prev.filter(r => r.id !== recordingId));
            toast({
                title: 'Recording Deleted',
                description: 'The recording has been removed.',
            });
        } catch (err) {
            console.error('Error deleting recording:', err);
            toast({
                title: 'Error',
                description: 'Failed to delete recording.',
                variant: 'destructive'
            });
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-pink-600" />
            </div>
        );
    }

    if (recordings.length === 0) {
        return (
            <Card>
                <CardContent className="py-12 text-center">
                    <Play className="h-12 w-12 mx-auto text-neutral-300 mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Recordings Yet</h3>
                    <p className="text-neutral-500 max-w-md mx-auto">
                        Enable auto-recording on your events to capture your streams.
                        Recordings will appear here after your stream ends.
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">Recording Library</h2>
                <Badge variant="secondary">{recordings.length} recordings</Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {recordings.map((recording) => (
                    <Card key={recording.id} className="overflow-hidden">
                        <div className="aspect-video bg-neutral-900 relative flex items-center justify-center">
                            <Play className="h-12 w-12 text-white/50" />
                            <Badge className="absolute top-2 right-2 bg-black/60">
                                {formatDuration(recording.duration_seconds)}
                            </Badge>
                        </div>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base truncate">
                                {recording.event?.name || 'Untitled Event'}
                            </CardTitle>
                            <CardDescription className="flex items-center gap-3 text-xs">
                                <span className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {format(new Date(recording.created_at), 'MMM d, yyyy')}
                                </span>
                                <span>{formatSize(recording.size_bytes)}</span>
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                className="flex-1"
                                asChild
                            >
                                <a href={recording.recording_url} target="_blank" rel="noopener noreferrer">
                                    <Play className="h-4 w-4 mr-1" />
                                    Watch
                                </a>
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                asChild
                            >
                                <a href={recording.recording_url} download>
                                    <Download className="h-4 w-4" />
                                </a>
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-destructive"
                                onClick={() => handleDelete(recording.id)}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default RecordingLibrary;
