import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/lib/supabase';
import { useAppContext } from '@/contexts/AppContext';
import { useToast } from '@/hooks/use-toast';
import { Play, Pause, Download, Share2, Trash2, Eye, EyeOff, Loader2, AlertCircle, CheckCircle, Clock, Video, Calendar, RotateCcw, RotateCw, Settings } from 'lucide-react';
import { format } from 'date-fns';

interface Recording {
  id: string;
  event_id: string;
  recording_name: string;
  recording_url: string;
  status: string;
  starts_at: string;
  ends_at: string;
  duration: number;
  file_size: number;
  is_public: boolean;
  created_at: string;
  event_name?: string;
}

const RecordingPlayback: React.FC = () => {
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeRecording, setActiveRecording] = useState<Recording | null>(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const [processingRecordings, setProcessingRecordings] = useState<Record<string, boolean>>({});
  const { user: currentUser } = useAppContext();
  const { toast } = useToast();

  const fetchRecordings = async () => {
    try {
      if (!currentUser?.id) {
        throw new Error('User not authenticated');
      }

      setLoading(true);
      setError('');

      // Fetch user's events
      const { data: userEvents, error: eventsError } = await supabase
        .from('events')
        .select('id, name')
        .eq('created_by', currentUser.id);

      if (eventsError) {
        throw new Error('Failed to fetch your events');
      }

      if (!userEvents || userEvents.length === 0) {
        setRecordings([]);
        return;
      }

      const eventIds = userEvents.map(event => event.id);

      // Fetch recordings for these events
      const { data: recordingsData, error: recordingsError } = await supabase
        .from('recordings')
        .select('*')
        .in('event_id', eventIds)
        .order('created_at', { ascending: false });

      if (recordingsError) {
        throw new Error('Failed to fetch recordings');
      }

      // Enrich recordings with event names
      const enrichedRecordings = recordingsData.map(recording => {
        const event = userEvents.find(e => e.id === recording.event_id);
        return {
          ...recording,
          event_name: event?.name || 'Unknown Event',
          duration: recording.duration || calculateDuration(recording.starts_at, recording.ends_at)
        };
      });

      setRecordings(enrichedRecordings);

      // Check for recordings that need processing
      const processingMap: Record<string, boolean> = {};
      enrichedRecordings.forEach(recording => {
        if (recording.status === 'processing') {
          processingMap[recording.id] = true;
        }
      });
      setProcessingRecordings(processingMap);

    } catch (error) {
      console.error('Error fetching recordings:', error);
      setError(error instanceof Error ? error.message : 'Failed to load recordings');
      toast({
        title: 'Error',
        description: 'Failed to load your recordings',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateDuration = (startTime: string, endTime: string): number => {
    if (!startTime || !endTime) return 0;
    const start = new Date(startTime).getTime();
    const end = new Date(endTime).getTime();
    return Math.floor((end - start) / 1000);
  };

  const formatDuration = (seconds: number): string => {
    if (!seconds) return '0s';

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (!bytes) return '0 MB';

    const mb = bytes / (1024 * 1024);
    if (mb >= 1024) {
      return `${(mb / 1024).toFixed(2)} GB`;
    } else {
      return `${mb.toFixed(2)} MB`;
    }
  };

  const getRecordingUrl = async (recording: Recording): Promise<string> => {
    try {
      const { data } = supabase
        .storage
        .from('recordings')
        .getPublicUrl(recording.recording_url);

      return data.publicUrl;
    } catch (error) {
      console.error('Error getting recording URL:', error);
      throw new Error('Failed to get recording URL');
    }
  };

  const handlePlayRecording = async (recording: Recording) => {
    try {
      setLoading(true);
      setActiveRecording(recording);

      // Get signed URL for the recording
      const url = await getRecordingUrl(recording);
      setVideoUrl(url);
      setIsPlaying(true);

      // Mark as processed if it was processing
      if (processingRecordings[recording.id]) {
        const updatedProcessing = { ...processingRecordings };
        delete updatedProcessing[recording.id];
        setProcessingRecordings(updatedProcessing);
      }
    } catch (error) {
      console.error('Error playing recording:', error);
      toast({
        title: 'Error',
        description: 'Failed to load recording for playback',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRecording = async (recordingId: string) => {
    if (!window.confirm('Are you sure you want to delete this recording? This action cannot be undone.')) {
      return;
    }

    try {
      setLoading(true);

      // Delete from database
      const { error: dbError } = await supabase
        .from('recordings')
        .delete()
        .eq('id', recordingId);

      if (dbError) {
        throw new Error('Failed to delete recording from database');
      }

      // Remove from state
      setRecordings(recordings.filter(r => r.id !== recordingId));

      // If this was the active recording, clear it
      if (activeRecording?.id === recordingId) {
        setActiveRecording(null);
        setVideoUrl('');
        setIsPlaying(false);
      }

      toast({
        title: 'Recording Deleted',
        description: 'The recording has been successfully deleted',
      });
    } catch (error) {
      console.error('Error deleting recording:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete recording',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleVisibility = async (recording: Recording) => {
    try {
      setLoading(true);

      const { error } = await supabase
        .from('recordings')
        .update({
          is_public: !recording.is_public
        })
        .eq('id', recording.id);

      if (error) {
        throw new Error('Failed to update recording visibility');
      }

      // Update in state
      setRecordings(recordings.map(r =>
        r.id === recording.id ? { ...r, is_public: !r.is_public } : r
      ));

      toast({
        title: 'Visibility Updated',
        description: `Recording is now ${!recording.is_public ? 'public' : 'private'}`,
      });
    } catch (error) {
      console.error('Error updating visibility:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update visibility',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadRecording = async (recording: Recording) => {
    try {
      setLoading(true);

      // Get signed URL
      const url = await getRecordingUrl(recording);

      // Create download link
      const a = document.createElement('a');
      a.href = url;
      a.download = `${recording.recording_name}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      toast({
        title: 'Download Started',
        description: 'Your recording download should begin shortly',
      });
    } catch (error) {
      console.error('Error downloading recording:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to download recording',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSeek = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime += seconds;
    }
  };

  const handlePlaybackRateChange = (rate: number) => {
    setPlaybackRate(rate);
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'recording':
        return <Badge className="bg-red-100 text-red-800"><Loader2 className="h-3 w-3 mr-1 animate-spin" /> Recording</Badge>;
      case 'processing':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" /> Processing</Badge>;
      case 'completed':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" /> Completed</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800"><AlertCircle className="h-3 w-3 mr-1" /> Unknown</Badge>;
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchRecordings();
    }
  }, [currentUser]);

  if (loading && recordings.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading your recordings...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (recordings.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-16">
          <div className="w-20 h-20 mx-auto mb-6 bg-muted rounded-full flex items-center justify-center">
            <Video className="h-10 w-10 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No Recordings Yet</h3>
          <p className="text-muted-foreground max-w-md mx-auto mb-6">
            You haven't recorded any streams for this event.
            <br />
            Start recording from the "Recording Controls" panel during your next live session.
          </p>
          <div className="flex justify-center gap-4">
            <div className="text-xs text-muted-foreground bg-secondary/50 px-3 py-1 rounded-full">
              Tip: Enable "Auto Record" to never miss a moment
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Active Recording Player */}
      {activeRecording && videoUrl && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Recording Playback</span>
              {getStatusBadge(activeRecording.status)}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="aspect-video bg-black rounded-lg overflow-hidden relative">
              <video
                ref={videoRef}
                src={videoUrl}
                controls
                className="w-full h-full"
                autoPlay={isPlaying}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
              />
            </div>

            {/* Playback Controls */}
            <div className="flex items-center justify-between bg-muted/20 p-2 rounded-md">
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => handleSeek(-10)}>
                  <RotateCcw className="h-4 w-4 mr-1" /> -10s
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleSeek(10)}>
                  <RotateCw className="h-4 w-4 mr-1" /> +10s
                </Button>
              </div>
              <div className="flex gap-2 items-center">
                <span className="text-sm text-muted-foreground mr-1">Speed:</span>
                {[0.5, 1, 1.5, 2].map(rate => (
                  <Button
                    key={rate}
                    variant={playbackRate === rate ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => handlePlaybackRateChange(rate)}
                    className="h-7 px-2 text-xs"
                  >
                    {rate}x
                  </Button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium">Recording Details</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Event:</span>
                    <span>{activeRecording.event_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Date:</span>
                    <span>{format(new Date(activeRecording.starts_at), 'PPpp')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Duration:</span>
                    <span>{formatDuration(activeRecording.duration)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">File Size:</span>
                    <span>{formatFileSize(activeRecording.file_size)}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Actions</h4>
                <div className="space-y-2">
                  <Button
                    onClick={() => handleDownloadRecording(activeRecording)}
                    className="w-full"
                    disabled={loading}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                  <Button
                    onClick={() => handleToggleVisibility(activeRecording)}
                    className="w-full"
                    variant="outline"
                    disabled={loading}
                  >
                    {activeRecording.is_public ? (
                      <>
                        <EyeOff className="h-4 w-4 mr-2" />
                        Make Private
                      </>
                    ) : (
                      <>
                        <Eye className="h-4 w-4 mr-2" />
                        Make Public
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={() => handleDeleteRecording(activeRecording.id)}
                    className="w-full"
                    variant="destructive"
                    disabled={loading}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Recording
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recordings List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="h-5 w-5" />
            Your Recordings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recordings.map((recording) => (
              <div
                key={recording.id}
                className={`border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer ${activeRecording?.id === recording.id ? 'ring-2 ring-purple-500' : ''
                  }`}
                onClick={() => recording.status === 'completed' && handlePlayRecording(recording)}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-sm truncate flex-1">
                      {recording.recording_name}
                    </h4>
                    {getStatusBadge(recording.status)}
                  </div>

                  <div className="space-y-1 text-sm">
                    <div className="flex items-center gap-1">
                      <Video className="h-3 w-3 text-muted-foreground" />
                      <span className="text-muted-foreground truncate">
                        {recording.event_name}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        {formatDuration(recording.duration)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        {format(new Date(recording.starts_at), 'MMM d, yyyy')}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    {recording.status === 'completed' && (
                      <Button
                        size="sm"
                        className="flex-1 text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePlayRecording(recording);
                        }}
                      >
                        <Play className="h-3 w-3 mr-1" />
                        Play
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownloadRecording(recording);
                      }}
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Download
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RecordingPlayback;