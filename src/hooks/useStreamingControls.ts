import { useState, useCallback } from "react";
import { useLocalParticipant, useRoomContext } from "@livekit/components-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface StreamingControls {
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
  isScreenSharing: boolean;
  isConnected: boolean;
  isStreaming: boolean;
  goLive: boolean;
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
  const [goLive, setGoLive] = useState(false);

  const participantCount = room?.numParticipants || 1;

  // Helper function to update participant live status
  const updateParticipantLiveStatus = useCallback(async (isLive: boolean) => {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) return;

      const { error } = await supabase
        .from('event_participants')
        .update({ is_live: isLive })
        .match({
          event_id: eventId,
          user_id: session.user.id
        });

      if (error) {
        console.error('Error updating participant live status:', error);
      }
    } catch (error) {
      console.error('Error updating participant live status:', error);
    }
  }, [eventId]);

  // Helper function to create event participant record
  const createEventParticipant = useCallback(async (role: 'host' | 'streamer' | 'viewer') => {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) return;

      const { error } = await supabase
        .from('event_participants')
        .upsert({
          event_id: eventId,
          user_id: session.user.id,
          role: role,
          is_active: true
        }, {
          onConflict: 'event_id,user_id'
        });

      if (error) {
        console.error('Error creating event participant:', error);
      }
    } catch (error) {
      console.error('Error creating event participant:', error);
    }
  }, [eventId]);

  // Safety check for room context
  if (!room || !localParticipant) {
    return {
      isVideoEnabled: false,
      isAudioEnabled: false,
      isScreenSharing: false,
      isConnected: false,
      isStreaming: false,
      goLive: false,
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
      toast.error("Not connected to room");
      return;
    }

    try {
      const enabled = !isVideoEnabled;
      await localParticipant.setCameraEnabled(enabled);
      setIsVideoEnabled(enabled);

      if (enabled) {
        toast.success("Camera turned on");
      } else {
        toast.info("Camera turned off");
      }
    } catch (error) {
      toast.error("Failed to toggle camera");
      console.error("Toggle video error:", error);
    }
  }, [localParticipant, isVideoEnabled]);

  const toggleAudio = useCallback(async () => {
    if (!localParticipant) {
      toast.error("Not connected to room");
      return;
    }

    try {
      const enabled = !isAudioEnabled;
      await localParticipant.setMicrophoneEnabled(enabled);
      setIsAudioEnabled(enabled);

      if (enabled) {
        toast.success("Microphone turned on");
      } else {
        toast.info("Microphone muted");
      }
    } catch (error) {
      toast.error("Failed to toggle microphone");
      console.error("Toggle audio error:", error);
    }
  }, [localParticipant, isAudioEnabled]);

  const toggleScreenShare = useCallback(async () => {
    if (!localParticipant) {
      toast.error("Not connected to room");
      return;
    }

    try {
      const enabled = !isScreenSharing;
      await localParticipant.setScreenShareEnabled(enabled);
      setIsScreenSharing(enabled);

      if (enabled) {
        toast.success("Screen sharing started");
      } else {
        toast.info("Screen sharing stopped");
      }
    } catch (error) {
      toast.error("Failed to toggle screen share");
      console.error("Toggle screen share error:", error);
    }
  }, [localParticipant, isScreenSharing]);

  const startStream = useCallback(async () => {
    try {
      setIsStreaming(true);
      setGoLive(true);
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error("Please log in to access this stream");
      }
      
      // Create event participant record
      await createEventParticipant('host');
      
      // Set participant as live
      await updateParticipantLiveStatus(true);
      
      // Create LiveKit room
      const { error } = await supabase.functions.invoke("manage-livekit-room", {
        body: {
          action: "create",
          eventId,
          roomConfig: {
            maxParticipants: 100,
            emptyTimeout: 300,
          },
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      toast.success("Stream started successfully");
    } catch (error) {
      setIsStreaming(false);
      setGoLive(false);
      toast.error("Failed to start stream");
      console.error("Start stream error:", error);
    }
  }, [eventId, createEventParticipant, updateParticipantLiveStatus]);

  const stopStream = useCallback(async () => {
    try {
      setIsStreaming(false);
      setGoLive(false);
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error("Please log in to access this stream");
      }
      
      // Set participant as not live
      await updateParticipantLiveStatus(false);

      // Deactivate event participant
      await supabase
        .from("event_participants")
        .update({ is_active: false })
        .eq("event_id", eventId)
        .eq("user_id", session.user.id);
      
      // Close LiveKit room
      const { error } = await supabase.functions.invoke("manage-livekit-room", {
        body: {
          action: "close",
          eventId,
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      toast.success("Stream stopped");
    } catch (error) {
      toast.error("Failed to stop stream");
      console.error("Stop stream error:", error);
    }
  }, [eventId, updateParticipantLiveStatus]);

  return {
    isVideoEnabled,
    isAudioEnabled,
    isScreenSharing,
    isConnected: room?.state === "connected",
    isStreaming,
    goLive,
    toggleVideo,
    toggleAudio,
    toggleScreenShare,
    startStream,
    stopStream,
    participantCount,
  };
};
