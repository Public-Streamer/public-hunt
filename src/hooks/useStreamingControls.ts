import { useState, useCallback } from "react";
import { useLocalParticipant, useRoomContext } from "@livekit/components-react";
import { Track } from "livekit-client";
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

  // Helper function to manage event streams
  const manageEventStream = useCallback(async (
    streamType: 'camera' | 'microphone' | 'screen',
    isActive: boolean
  ) => {
    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        console.error("Authentication required for event stream management");
        return;
      }

      const streamName = `${localParticipant.identity} ${streamType === 'camera' ? 'Camera' : streamType === 'microphone' ? 'Microphone' : 'Screen'}`;
      
      // Check if record exists
      const { data: existingStream } = await supabase
        .from("event_streams")
        .select("id")
        .eq("event_id", eventId)
        .eq("streamer_id", session.user.id)
        .eq("stream_type", streamType)
        .single();

      if (existingStream) {
        // Update existing record
        await supabase
          .from("event_streams")
          .update({
            is_active: isActive,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingStream.id);
      } else {
        // Create new record
        await supabase
          .from("event_streams")
          .insert({
            event_id: eventId,
            streamer_id: session.user.id,
            stream_name: streamName,
            stream_type: streamType,
            is_active: isActive,
          });
      }
    } catch (error) {
      console.error("Failed to manage event stream:", error);
      // Don't show toast error to user - this is background operation
    }
  }, [eventId, localParticipant]);

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

      // Update event streams in database
      await manageEventStream('camera', enabled);

      if (enabled) {
        toast.success("Camera turned on");
      } else {
        toast.info("Camera turned off");
      }
    } catch (error) {
      toast.error("Failed to toggle camera");
      console.error("Toggle video error:", error);
    }
  }, [localParticipant, isVideoEnabled, manageEventStream]);

  const toggleAudio = useCallback(async () => {
    if (!localParticipant) {
      toast.error("Not connected to room");
      return;
    }

    try {
      const enabled = !isAudioEnabled;
      await localParticipant.setMicrophoneEnabled(enabled);
      setIsAudioEnabled(enabled);

      // Update event streams in database
      await manageEventStream('microphone', enabled);

      if (enabled) {
        toast.success("Microphone turned on");
      } else {
        toast.info("Microphone muted");
      }
    } catch (error) {
      toast.error("Failed to toggle microphone");
      console.error("Toggle audio error:", error);
    }
  }, [localParticipant, isAudioEnabled, manageEventStream]);

  const toggleScreenShare = useCallback(async () => {
    if (!localParticipant) {
      toast.error("Not connected to room");
      return;
    }

    try {
      const enabled = !isScreenSharing;
      await localParticipant.setScreenShareEnabled(enabled);
      setIsScreenSharing(enabled);

      // Update event streams in database
      await manageEventStream('screen', enabled);

      if (enabled) {
        toast.success("Screen sharing started");
      } else {
        toast.info("Screen sharing stopped");
      }
    } catch (error) {
      toast.error("Failed to toggle screen share");
      console.error("Toggle screen share error:", error);
    }
  }, [localParticipant, isScreenSharing, manageEventStream]);

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

      // Update event as live - will be handled by useEventLiveStatus hook
      // await supabase.from("events").update({ is_live: true }).eq("id", eventId);

      toast.success("Stream started successfully");
    } catch (error) {
      setIsStreaming(false);
      setGoLive(false);
      toast.error("Failed to start stream");
      console.error("Start stream error:", error);
    }
  }, [eventId]);

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

      // Update event as not live
      await supabase
        .from("events")
        .update({ is_live: false })
        .eq("id", eventId);

      toast.success("Stream stopped");
    } catch (error) {
      toast.error("Failed to stop stream");
      console.error("Stop stream error:", error);
    }
  }, [eventId]);

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
