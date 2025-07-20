
import { useState, useCallback, useEffect } from "react";
import { useLocalParticipant, useRoomContext, useMediaDevices, useMediaDeviceSelect } from "@livekit/components-react";
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
  // Camera switching functionality
  availableCameras: MediaDeviceInfo[];
  currentCamera: string | null;
  currentFacingMode: "user" | "environment";
  isSwitchingCamera: boolean;
  switchCamera: () => Promise<void>;
}

export const useStreamingControls = (eventId: string): StreamingControls => {
  const { localParticipant } = useLocalParticipant();
  const room = useRoomContext();

  console.log("room name", room.name);

  const [isStreaming, setIsStreaming] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [goLive, setGoLive] = useState(false);

  // Use LiveKit's hooks for camera management
  const videoDevices = useMediaDevices({ kind: 'videoinput' });
  const { 
    activeDeviceId: currentCamera, 
    setActiveMediaDevice
  } = useMediaDeviceSelect({ kind: 'videoinput' });
  
  // State for tracking camera switching
  const [isSwitchingCamera, setIsSwitchingCamera] = useState(false);

  // State for tracking current facing mode
  const [currentFacingMode, setCurrentFacingMode] = useState<"user" | "environment">("user");

  const participantCount = room?.numParticipants || 1;

  // Helper function to detect camera type from device info
  const getCameraType = useCallback((device: MediaDeviceInfo): "user" | "environment" | "unknown" => {
    const label = device.label.toLowerCase();
    if (label.includes('front') || label.includes('user') || label.includes('facing')) {
      return 'user';
    }
    if (label.includes('back') || label.includes('rear') || label.includes('environment')) {
      return 'environment';
    }
    return 'unknown';
  }, []);

  // Enhanced camera switching with LiveKit hooks
  const switchCamera = useCallback(async () => {
    if (!localParticipant || isSwitchingCamera || videoDevices.length < 2) {
      return;
    }

    setIsSwitchingCamera(true);
    try {
      // Determine the target facing mode
      const newFacingMode = currentFacingMode === "user" ? "environment" : "user";
      
      console.log(`Switching from ${currentFacingMode} to ${newFacingMode} camera`);

      // Find cameras of the target type
      const targetCameras = videoDevices.filter(device => {
        const cameraType = getCameraType(device);
        return cameraType === newFacingMode;
      });

      // If no specific cameras found for the target type, try to find any different camera
      let targetCamera: MediaDeviceInfo | undefined;
      
      if (targetCameras.length > 0) {
        // Use the first camera of the target type
        targetCamera = targetCameras[0];
      } else {
        // Fallback: use any camera that's not the current one
        targetCamera = videoDevices.find(device => device.deviceId !== currentCamera);
      }

      if (!targetCamera) {
        toast.error("No alternative camera found");
        return;
      }

      console.log("Switching to camera:", {
        deviceId: targetCamera.deviceId,
        label: targetCamera.label,
        detectedType: getCameraType(targetCamera)
      });

      // Use LiveKit's device selection
      await setActiveMediaDevice(targetCamera.deviceId);
      
      // Update the facing mode state
      const actualCameraType = getCameraType(targetCamera);
      if (actualCameraType !== "unknown") {
        setCurrentFacingMode(actualCameraType);
      } else {
        // Toggle the facing mode even if we couldn't detect the type
        setCurrentFacingMode(newFacingMode);
      }

      const cameraType = actualCameraType !== "unknown" ? actualCameraType : newFacingMode;
      const friendlyName = cameraType === "environment" ? "back" : "front";
      toast.success(`Switched to ${friendlyName} camera`);

    } catch (error) {
      console.error("Error switching camera:", error);
      toast.error("Failed to switch camera. Please try again.");
    } finally {
      setIsSwitchingCamera(false);
    }
  }, [localParticipant, currentFacingMode, isSwitchingCamera, videoDevices, currentCamera, setActiveMediaDevice, getCameraType]);

  // Helper function to update participant live status
  const updateParticipantLiveStatus = useCallback(
    async (isLive: boolean) => {
      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();
        if (sessionError || !session) return;

        const { error } = await supabase
          .from("event_participants")
          .update({ is_live: isLive })
          .match({
            event_id: eventId,
            user_id: session.user.id,
          });

        if (error) {
          console.error("Error updating participant live status:", error);
        }
      } catch (error) {
        console.error("Error updating participant live status:", error);
      }
    },
    [eventId]
  );

  // Helper function to create event participant record
  const createEventParticipant = useCallback(
    async (role: "host" | "streamer" | "viewer") => {
      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();
        if (sessionError || !session) return;

        const { error } = await supabase.from("event_participants").upsert(
          {
            event_id: eventId,
            user_id: session.user.id,
            role: role,
            is_active: true,
          },
          {
            onConflict: "event_id,user_id",
          }
        );

        if (error) {
          console.error("Error creating event participant:", error);
        }
      } catch (error) {
        console.error("Error creating event participant:", error);
      }
    },
    [eventId]
  );

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
      availableCameras: [],
      currentCamera: null,
      currentFacingMode: "user" as const,
      isSwitchingCamera: false,
      switchCamera: async () => {},
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
      await createEventParticipant("host");

      // Set participant as live
      await updateParticipantLiveStatus(true);

      // Create event stream record
      await supabase.from("event_streams").insert({
        event_id: eventId,
        streamer_id: session.user.id,
        stream_name: "Main Stream",
        is_active: true,
      });

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
        .update({ is_active: false, is_live: false })
        .eq("event_id", eventId)
        .eq("user_id", session.user.id);

      // Deactivate event streams
      await supabase
        .from("event_streams")
        .update({ is_active: false })
        .eq("event_id", eventId)
        .eq("streamer_id", session.user.id);

      const { data: event, error } = await supabase
        .from("events")
        .select("*")
        .eq("id", eventId)
        .single();

      if (error) {
        throw new Error(error.message);
      }

      if (event?.is_live === false) {
        console.log(
          `event is not live anymore , so closing room for event: ${eventId}`
        );
        await supabase.functions.invoke("manage-livekit-room", {
          body: {
            action: "close",
            eventId,
          },
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        console.log(`room closed for event: ${eventId}`);
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
    availableCameras: videoDevices,
    currentCamera,
    currentFacingMode,
    isSwitchingCamera,
    switchCamera,
  };
};
