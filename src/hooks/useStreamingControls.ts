import { useState, useCallback } from 'react';
import { useLocalParticipant, useRoomContext } from '@livekit/components-react';
import { Track } from 'livekit-client';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface StreamingControls {
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
  isScreenSharing: boolean;
  isConnected: boolean;
  isStreaming: boolean;
  toggleVideo: () => Promise<void>;
  toggleAudio: () => Promise<void>;
  toggleScreenShare: () => Promise<void>;
  startStream: () => Promise<void>;
  stopStream: () => Promise<void>;
  participantCount: number;
}

export const useStreamingControls = (eventId: string): StreamingControls => {
  const { localParticipant } = useLocalParticipant();
  const room = useRoomContext();
  
  const [isStreaming, setIsStreaming] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  const participantCount = room?.numParticipants || 1;

  // Safety check for room context
  if (!room) {
    console.warn('useStreamingControls: Room context not available');
    return {
      isVideoEnabled: false,
      isAudioEnabled: false,
      isScreenSharing: false,
      isConnected: false,
      isStreaming: false,
      toggleVideo: async () => {},
      toggleAudio: async () => {},
      toggleScreenShare: async () => {},
      startStream: async () => {},
      stopStream: async () => {},
      participantCount: 0,
    };
  }

  const toggleVideo = useCallback(async () => {
    if (!localParticipant) {
      toast.error('Not connected to room');
      return;
    }
    
    try {
      const enabled = !isVideoEnabled;
      await localParticipant.setCameraEnabled(enabled);
      setIsVideoEnabled(enabled);
      
      if (enabled) {
        toast.success('Camera turned on');
      } else {
        toast.info('Camera turned off');
      }
    } catch (error) {
      toast.error('Failed to toggle camera');
      console.error('Toggle video error:', error);
    }
  }, [localParticipant, isVideoEnabled]);

  const toggleAudio = useCallback(async () => {
    if (!localParticipant) {
      toast.error('Not connected to room');
      return;
    }
    
    try {
      const enabled = !isAudioEnabled;
      await localParticipant.setMicrophoneEnabled(enabled);
      setIsAudioEnabled(enabled);
      
      if (enabled) {
        toast.success('Microphone turned on');
      } else {
        toast.info('Microphone muted');
      }
    } catch (error) {
      toast.error('Failed to toggle microphone');
      console.error('Toggle audio error:', error);
    }
  }, [localParticipant, isAudioEnabled]);

  const toggleScreenShare = useCallback(async () => {
    if (!localParticipant) {
      toast.error('Not connected to room');
      return;
    }
    
    try {
      const enabled = !isScreenSharing;
      await localParticipant.setScreenShareEnabled(enabled);
      setIsScreenSharing(enabled);
      
      if (enabled) {
        toast.success('Screen sharing started');
      } else {
        toast.info('Screen sharing stopped');
      }
    } catch (error) {
      toast.error('Failed to toggle screen share');
      console.error('Toggle screen share error:', error);
    }
  }, [localParticipant, isScreenSharing]);

  const startStream = useCallback(async () => {
    try {
      setIsStreaming(true);
      
      // Create LiveKit room
      const { error } = await supabase.functions.invoke('manage-livekit-room', {
        body: {
          action: 'create',
          eventId,
          roomConfig: {
            maxParticipants: 100,
            emptyTimeout: 300,
          },
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      // Update event as live
      await supabase
        .from('events')
        .update({ is_live: true })
        .eq('id', eventId);

      toast.success('Stream started successfully');
    } catch (error) {
      setIsStreaming(false);
      toast.error('Failed to start stream');
      console.error('Start stream error:', error);
    }
  }, [eventId]);

  const stopStream = useCallback(async () => {
    try {
      setIsStreaming(false);
      
      // Close LiveKit room
      const { error } = await supabase.functions.invoke('manage-livekit-room', {
        body: {
          action: 'close',
          eventId,
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      // Update event as not live
      await supabase
        .from('events')
        .update({ is_live: false })
        .eq('id', eventId);

      toast.success('Stream stopped');
    } catch (error) {
      toast.error('Failed to stop stream');
      console.error('Stop stream error:', error);
    }
  }, [eventId]);

  return {
    isVideoEnabled,
    isAudioEnabled,
    isScreenSharing,
    isConnected: room?.state === 'connected',
    isStreaming,
    toggleVideo,
    toggleAudio,
    toggleScreenShare,
    startStream,
    stopStream,
    participantCount,
  };
};