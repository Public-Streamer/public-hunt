import { useState, useCallback, useEffect } from "react";
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

  // Camera switching state
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>(
    []
  );
  const [currentCamera, setCurrentCamera] = useState<string | null>(null);
  const [currentFacingMode, setCurrentFacingMode] = useState<
    "user" | "environment"
  >("user");
  const [isSwitchingCamera, setIsSwitchingCamera] = useState(false);

  const participantCount = room?.numParticipants || 1;

  // Enhanced camera enumeration with better detection
  const enumerateCameras = useCallback(async () => {
    try {
      // Request permissions first to get proper device labels
      await navigator.mediaDevices.getUserMedia({ video: true });

      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(
        (device) =>
          device.kind === "videoinput" && device.deviceId !== "default"
      );
      
      // Enhanced camera detection
      const enhancedCameras = videoDevices.map((device) => {
        const label = device.label.toLowerCase();
        const isFront = label.includes('front') || label.includes('user') || label.includes('facing');
        const isBack = label.includes('back') || label.includes('rear') || label.includes('environment');
        
        return {
          ...device,
          isFront,
          isBack,
          detectedType: isFront ? 'front' : isBack ? 'back' : 'unknown'
        };
      });

      setAvailableCameras(videoDevices);

      // Set current camera if not already set
      if (!currentCamera && videoDevices.length > 0) {
        setCurrentCamera(videoDevices[0].deviceId);
      }

      console.log("Available cameras:", JSON.stringify(enhancedCameras.map(cam => ({
        label: cam.label,
        deviceId: cam.deviceId,
        detectedType: cam.detectedType
      })), null, 2));
    } catch (error) {
      console.error("Error enumerating cameras:", error);
    }
  }, [currentCamera]);

  // Initialize cameras on mount
  useEffect(() => {
    enumerateCameras();
  }, [enumerateCameras]);

  // Enhanced camera switching with facingMode-first approach
  const switchCamera = useCallback(async () => {
    if (!localParticipant || isSwitchingCamera) {
      return;
    }

    setIsSwitchingCamera(true);

    try {
      // Toggle between front and back camera
      const newFacingMode =
        currentFacingMode === "user" ? "environment" : "user";

      console.log(`Switching from ${currentFacingMode} to ${newFacingMode} camera`);

      // Get the current video track publication
      const videoPublication = localParticipant.videoTrackPublications.values().next().value;
      
      if (videoPublication?.track) {
        const currentTrack = videoPublication.track;
        
        // Method 1: Try facingMode first (recommended for mobile)
        let newStream: MediaStream | null = null;
        
        try {
          // Primary approach: Use facingMode
          const facingModeConstraints = {
            video: {
              facingMode: { exact: newFacingMode },
              width: { ideal: 1280 },
              height: { ideal: 720 },
            }
          };
          
          newStream = await navigator.mediaDevices.getUserMedia(facingModeConstraints);
          console.log("Camera switched using facingMode");
        } catch (facingModeError) {
          console.log("FacingMode failed, trying with ideal constraint:", facingModeError);
          
          // Fallback 1: Use ideal facingMode
          try {
            const idealConstraints = {
              video: {
                facingMode: { ideal: newFacingMode },
                width: { ideal: 1280 },
                height: { ideal: 720 },
              }
            };
            
            newStream = await navigator.mediaDevices.getUserMedia(idealConstraints);
            console.log("Camera switched using ideal facingMode");
          } catch (idealError) {
            console.log("Ideal facingMode failed, trying deviceId approach:", idealError);
            
            // Fallback 2: Use specific deviceId if available
            const targetCamera = availableCameras.find((camera) => {
              const label = camera.label.toLowerCase();
              return newFacingMode === "environment" 
                ? label.includes('back') || label.includes('rear') || label.includes('environment')
                : label.includes('front') || label.includes('user') || label.includes('facing');
            });
            
            if (targetCamera) {
              const deviceConstraints = {
                video: {
                  deviceId: { exact: targetCamera.deviceId },
                  width: { ideal: 1280 },
                  height: { ideal: 720 },
                }
              };
              
              newStream = await navigator.mediaDevices.getUserMedia(deviceConstraints);
              console.log("Camera switched using deviceId");
            } else {
              throw new Error("No suitable camera found");
            }
          }
        }

        if (newStream) {
          // Stop the current track
          currentTrack.stop();
          
          // Unpublish the current track
          await localParticipant.unpublishTrack(currentTrack);
          
          // Create and publish new track
          const newVideoTrack = newStream.getVideoTracks()[0];
          await localParticipant.publishTrack(newVideoTrack, {
            name: "camera",
            source: Track.Source.Camera
          });

          // Update state
          setCurrentFacingMode(newFacingMode);
          
          // Update current camera deviceId
          const settings = newVideoTrack.getSettings();
          if (settings.deviceId) {
            setCurrentCamera(settings.deviceId);
          }

          const cameraType = newFacingMode === "environment" ? "back" : "front";
          toast.success(`Switched to ${cameraType} camera`);
        }
      }
    } catch (error) {
      console.error("Error switching camera:", error);
      toast.error(
        "Failed to switch camera. Make sure your device has multiple cameras."
      );
    } finally {
      setIsSwitchingCamera(false);
    }
  }, [localParticipant, currentFacingMode, isSwitchingCamera, availableCameras]);

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
        // Re-enumerate cameras when video is enabled
        setTimeout(enumerateCameras, 500);
      } else {
        toast.info("Camera turned off");
      }
    } catch (error) {
      toast.error("Failed to toggle camera");
      console.error("Toggle video error:", error);
    }
  }, [localParticipant, isVideoEnabled, enumerateCameras]);

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
    availableCameras,
    currentCamera,
    currentFacingMode,
    isSwitchingCamera,
    switchCamera,
  };
};
