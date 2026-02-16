import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/supabase';
import { useAppContext } from '@/contexts/AppContext';
import { useToast } from '@/hooks/use-toast';
import { Mic, Video, Disc, StopCircle, Settings, Save } from 'lucide-react';

interface RecordingControlsProps {
  eventId: string;
  isStreamer: boolean;
  onRecordingStart?: () => void;
  onRecordingStop?: () => void;
}

const RecordingControls: React.FC<RecordingControlsProps> = ({
  eventId,
  isStreamer,
  onRecordingStart,
  onRecordingStop,
}) => {
  const [recordingStatus, setRecordingStatus] = useState<'idle' | 'recording' | 'processing' | 'completed'>('idle');
  const [recordingSettings, setRecordingSettings] = useState({
    autoRecord: false,
    quality: 'HD',
    storageLimit: 1024,
  });
  const [isRecordingEnabled, setIsRecordingEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user: currentUser } = useAppContext();
  const { toast } = useToast();
  const [recordingDuration, setRecordingDuration] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (recordingStatus === 'recording') {
      interval = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } else {
      setRecordingDuration(0);
    }
    return () => clearInterval(interval);
  }, [recordingStatus]);

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const fetchRecordingStatus = async () => {
    try {
      if (!currentUser?.id || !eventId) return;

      setLoading(true);

      const { data, error } = await supabase.functions.invoke('manage-recording', {
        body: {
          eventId,
          action: 'get_status',
        },
      });

      if (error) {
        console.error('Error fetching recording status:', error);
        return;
      }

      if (data?.recording) {
        setRecordingStatus(data.recording.status as any);
      }

      // Fetch event recording settings
      const { data: eventData } = await supabase
        .from('events')
        .select('recording_enabled, auto_record, recording_quality, recording_storage_limit')
        .eq('id', eventId)
        .single();

      if (eventData) {
        setIsRecordingEnabled(eventData.recording_enabled || false);
        setRecordingSettings({
          autoRecord: eventData.auto_record || false,
          quality: eventData.recording_quality || 'HD',
          storageLimit: eventData.recording_storage_limit || 1024,
        });
      }
    } catch (error) {
      console.error('Error fetching recording data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecordingStatus();
  }, [currentUser?.id, eventId]);

  const handleStartRecording = async () => {
    try {
      if (!currentUser?.id || !eventId) {
        toast({
          title: 'Error',
          description: 'User not authenticated',
          variant: 'destructive',
        });
        return;
      }

      setLoading(true);

      const { data, error } = await supabase.functions.invoke('manage-recording', {
        body: {
          eventId,
          action: 'start',
          recordingSettings,
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data?.success) {
        setRecordingStatus('recording');
        toast({
          title: 'Recording Started',
          description: 'Your stream is now being recorded',
        });
        onRecordingStart?.();
      }
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to start recording',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStopRecording = async () => {
    try {
      if (!currentUser?.id || !eventId) {
        toast({
          title: 'Error',
          description: 'User not authenticated',
          variant: 'destructive',
        });
        return;
      }

      setLoading(true);

      const { data, error } = await supabase.functions.invoke('manage-recording', {
        body: {
          eventId,
          action: 'stop',
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data?.success) {
        setRecordingStatus('processing');
        toast({
          title: 'Recording Stopped',
          description: 'Your recording is being processed',
        });
        onRecordingStop?.();
      }
    } catch (error) {
      console.error('Error stopping recording:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to stop recording',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSettings = async () => {
    try {
      if (!currentUser?.id || !eventId) {
        toast({
          title: 'Error',
          description: 'User not authenticated',
          variant: 'destructive',
        });
        return;
      }

      setLoading(true);

      const { data, error } = await supabase.functions.invoke('manage-recording', {
        body: {
          eventId,
          action: 'update_settings',
          recordingSettings,
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data?.success) {
        toast({
          title: 'Settings Updated',
          description: 'Recording settings have been saved',
        });
      }
    } catch (error) {
      console.error('Error updating recording settings:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update settings',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = (key: string, value: any) => {
    setRecordingSettings(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const getStatusColor = () => {
    switch (recordingStatus) {
      case 'recording': return 'bg-red-500';
      case 'processing': return 'bg-yellow-500';
      case 'completed': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = () => {
    switch (recordingStatus) {
      case 'recording': return 'Recording in progress...';
      case 'processing': return 'Processing recording...';
      case 'completed': return 'Recording completed';
      default: return 'Ready to record';
    }
  };

  if (loading) {
    return (
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Recording Controls</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-8 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Recording Controls</span>
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${getStatusColor()} animate-pulse`}></div>
            <span className="text-sm text-muted-foreground font-mono">
              {recordingStatus === 'recording' ? formatDuration(recordingDuration) : getStatusText()}
            </span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Recording Controls */}
        <div className="flex space-x-2">
          {recordingStatus === 'recording' ? (
            <Button
              onClick={handleStopRecording}
              disabled={loading}
              className="flex-1 bg-red-600 hover:bg-red-700"
            >
              <StopCircle className="h-4 w-4 mr-2" />
              Stop Recording
            </Button>
          ) : (
            <Button
              onClick={handleStartRecording}
              disabled={loading || !isRecordingEnabled || !isStreamer}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              <Disc className="h-4 w-4 mr-2" />
              Start Recording
            </Button>
          )}
        </div>

        {/* Recording Settings */}
        <div className="space-y-4 pt-4 border-t">
          <div className="flex items-center justify-between">
            <Label htmlFor="recording-enabled" className="flex items-center">
              <Mic className="h-4 w-4 mr-2" />
              Enable Recording
            </Label>
            <Switch
              id="recording-enabled"
              checked={isRecordingEnabled}
              onCheckedChange={setIsRecordingEnabled}
              disabled={!isStreamer}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="auto-record">Auto Record</Label>
            <div className="flex items-center space-x-2">
              <Switch
                id="auto-record"
                checked={recordingSettings.autoRecord}
                onCheckedChange={(checked) => handleSettingChange('autoRecord', checked)}
                disabled={!isRecordingEnabled || !isStreamer}
              />
              <span className="text-sm text-muted-foreground">
                Automatically start recording when stream begins
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Recording Quality</Label>
            <Select
              value={recordingSettings.quality}
              onValueChange={(value) => handleSettingChange('quality', value)}
              disabled={!isRecordingEnabled || !isStreamer}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select quality" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SD">SD (480p)</SelectItem>
                <SelectItem value="HD">HD (720p)</SelectItem>
                <SelectItem value="FHD">FHD (1080p)</SelectItem>
                <SelectItem value="4K">4K (2160p)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Storage Limit (MB)</Label>
            <Select
              value={recordingSettings.storageLimit.toString()}
              onValueChange={(value) => handleSettingChange('storageLimit', Number(value))}
              disabled={!isRecordingEnabled || !isStreamer}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select storage limit" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="512">512 MB</SelectItem>
                <SelectItem value="1024">1 GB</SelectItem>
                <SelectItem value="2048">2 GB</SelectItem>
                <SelectItem value="4096">4 GB</SelectItem>
                <SelectItem value="8192">8 GB</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handleUpdateSettings}
            disabled={loading || !isStreamer}
            className="w-full"
          >
            <Save className="h-4 w-4 mr-2" />
            Save Settings
          </Button>
        </div>

        {/* Recording Info */}
        {recordingStatus !== 'idle' && (
          <div className="pt-4 border-t">
            <h4 className="font-medium mb-2">Recording Information</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status:</span>
                <span className="capitalize">{recordingStatus}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Quality:</span>
                <span>{recordingSettings.quality}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Storage Limit:</span>
                <span>{recordingSettings.storageLimit} MB</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RecordingControls;