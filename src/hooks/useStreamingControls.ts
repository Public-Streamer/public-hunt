import { useState, useCallback, useEffect } from "react";
import {
  useLocalParticipant,
  useRoomContext,
  useMediaDevices,
  useMediaDeviceSelect,
} from "@livekit/components-react";
import { Track } from "livekit-client";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useMobileMediaPermissions } from "./useMobileMediaPermissions";

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

interface LiveStatusResult {
  should_close_room: boolean;
  event_was_live: boolean;
  live_participants_count: number;
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

  const navigate = useNavigate();

  // Mobile media permissions handler
  const {
    permissionStatus,
    requestCameraPermission,
    requestMicrophonePermission,
    requestBothPermissions,
    checkScreenShareSupport,
    requestScreenShare,
  } = useMobileMediaPermissions();

  // Use LiveKit's hooks for camera management
  const videoDevices = useMediaDevices({ kind: "videoinput" });
  const { activeDeviceId: currentCamera, setActiveMediaDevice } =
    useMediaDeviceSelect({ kind: "videoinput" });

  // State for tracking camera switching
  const [isSwitchingCamera, setIsSwitchingCamera] = useState(false);

  // State for tracking current facing mode
  const [currentFacingMode, setCurrentFacingMode] = useState<
    "user" | "environment"
  >("user");

  const participantCount = room?.numParticipants || 1;

  // Enhanced mobile debugging - Log available cameras whenever they change
  useEffect(() => {
    console.log(
      "📱 MOBILE DEBUG - Available Video Devices:",
      JSON.stringify(
        {
          deviceCount: videoDevices.length,
          devices: videoDevices.map((device) => ({
            deviceId: device.deviceId,
            label: device.label,
            kind: device.kind,
            groupId: device.groupId,
          })),
          currentActiveCamera: currentCamera,
          currentFacingMode: currentFacingMode,
        },
        null,
        2
      )
    );
  }, [videoDevices, currentCamera, currentFacingMode]);

  // Helper function to detect camera type from device info
  const getCameraType = useCallback(
    (device: MediaDeviceInfo): "user" | "environment" | "unknown" => {
      const label = device.label.toLowerCase();
      console.log(
        "📱 MOBILE DEBUG - Camera Classification:",
        JSON.stringify(
          {
            deviceId: device.deviceId,
            originalLabel: device.label,
            lowercaseLabel: label,
            containsFront: label.includes("front"),
            containsUser: label.includes("user"),
            containsFacing: label.includes("facing"),
            containsBack: label.includes("back"),
            containsRear: label.includes("rear"),
            containsEnvironment: label.includes("environment"),
          },
          null,
          2
        )
      );

      if (
        label.includes("front") ||
        label.includes("user") ||
        label.includes("facing")
      ) {
        console.log("📱 MOBILE DEBUG - Classified as USER camera");
        return "user";
      }
      if (
        label.includes("back") ||
        label.includes("rear") ||
        label.includes("environment")
      ) {
        console.log("📱 MOBILE DEBUG - Classified as ENVIRONMENT camera");
        return "environment";
      }
      console.log("📱 MOBILE DEBUG - Classified as UNKNOWN camera");
      return "unknown";
    },
    []
  );

  // Enhanced camera switching with LiveKit hooks
  const switchCamera = useCallback(async () => {
    console.log(
      "📱 MOBILE DEBUG - Camera Switch Initiated:",
      JSON.stringify(
        {
          hasLocalParticipant: !!localParticipant,
          isSwitchingCamera: isSwitchingCamera,
          videoDevicesCount: videoDevices.length,
          currentCamera: currentCamera,
          currentFacingMode: currentFacingMode,
        },
        null,
        2
      )
    );

    if (!localParticipant || isSwitchingCamera || videoDevices.length < 2) {
      console.log(
        "📱 MOBILE DEBUG - Camera Switch Blocked:",
        JSON.stringify(
          {
            reason: !localParticipant
              ? "No local participant"
              : isSwitchingCamera
              ? "Already switching"
              : "Insufficient cameras",
            localParticipant: !!localParticipant,
            isSwitchingCamera: isSwitchingCamera,
            videoDevicesCount: videoDevices.length,
          },
          null,
          2
        )
      );
      return;
    }

    setIsSwitchingCamera(true);
    try {
      // Determine the target facing mode
      const newFacingMode =
        currentFacingMode === "user" ? "environment" : "user";

      console.log(
        "📱 MOBILE DEBUG - Camera Switch Details:",
        JSON.stringify(
          {
            switchingFrom: currentFacingMode,
            switchingTo: newFacingMode,
            timestamp: new Date().toISOString(),
          },
          null,
          2
        )
      );

      // Find cameras of the target type
      const targetCameras = videoDevices.filter((device) => {
        const cameraType = getCameraType(device);
        return cameraType === newFacingMode;
      });

      console.log(
        "📱 MOBILE DEBUG - Target Cameras Found:",
        JSON.stringify(
          {
            targetFacingMode: newFacingMode,
            targetCamerasCount: targetCameras.length,
            targetCameras: targetCameras.map((cam) => ({
              deviceId: cam.deviceId,
              label: cam.label,
              classifiedType: getCameraType(cam),
            })),
          },
          null,
          2
        )
      );

      // If no specific cameras found for the target type, try to find any different camera
      let targetCamera: MediaDeviceInfo | undefined;

      if (targetCameras.length > 0) {
        // Use the first camera of the target type
        targetCamera = targetCameras[0];
        console.log("📱 MOBILE DEBUG - Using classified target camera");
      } else {
        // Fallback: use any camera that's not the current one
        targetCamera = videoDevices.find(
          (device) => device.deviceId !== currentCamera
        );
        console.log(
          "📱 MOBILE DEBUG - Using fallback camera (any different camera)"
        );
      }

      if (!targetCamera) {
        console.log("📱 MOBILE DEBUG - No target camera found");
        toast.error("No alternative camera found");
        return;
      }

      console.log(
        "📱 MOBILE DEBUG - Final Camera Selection:",
        JSON.stringify(
          {
            selectedCamera: {
              deviceId: targetCamera.deviceId,
              label: targetCamera.label,
              detectedType: getCameraType(targetCamera),
            },
            selectionMethod:
              targetCameras.length > 0 ? "classified" : "fallback",
          },
          null,
          2
        )
      );

      // Use LiveKit's device selection
      console.log("📱 MOBILE DEBUG - Calling setActiveMediaDevice...");
      await setActiveMediaDevice(targetCamera.deviceId);
      console.log(
        "📱 MOBILE DEBUG - setActiveMediaDevice completed successfully"
      );

      // Update the facing mode state
      const actualCameraType = getCameraType(targetCamera);
      if (actualCameraType !== "unknown") {
        setCurrentFacingMode(actualCameraType);
        console.log(
          "📱 MOBILE DEBUG - Updated facing mode to detected type:",
          actualCameraType
        );
      } else {
        // Toggle the facing mode even if we couldn't detect the type
        setCurrentFacingMode(newFacingMode);
        console.log(
          "📱 MOBILE DEBUG - Updated facing mode to target type:",
          newFacingMode
        );
      }

      const cameraType =
        actualCameraType !== "unknown" ? actualCameraType : newFacingMode;
      const friendlyName = cameraType === "environment" ? "back" : "front";

      console.log(
        "📱 MOBILE DEBUG - Camera Switch Success:",
        JSON.stringify(
          {
            finalFacingMode: cameraType,
            friendlyName: friendlyName,
            actualCameraType: actualCameraType,
            newFacingMode: newFacingMode,
          },
          null,
          2
        )
      );

      toast.success(`Switched to ${friendlyName} camera`);
    } catch (error) {
      console.error(
        "📱 MOBILE DEBUG - Camera Switch Error:",
        JSON.stringify(
          {
            error:
              error instanceof Error
                ? {
                    name: error.name,
                    message: error.message,
                    stack: error.stack,
                  }
                : error,
            timestamp: new Date().toISOString(),
            currentCamera: currentCamera,
            currentFacingMode: currentFacingMode,
            videoDevicesCount: videoDevices.length,
          },
          null,
          2
        )
      );
      toast.error("Failed to switch camera. Please try again.");
    } finally {
      setIsSwitchingCamera(false);
      console.log("📱 MOBILE DEBUG - Camera switching state reset to false");
    }
  }, [
    localParticipant,
    currentFacingMode,
    isSwitchingCamera,
    videoDevices,
    currentCamera,
    setActiveMediaDevice,
    getCameraType,
  ]);

  // Helper function to update participant live status
  const updateParticipantLiveStatus = useCallback(
    async (status: boolean) => {
      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();
        if (sessionError || !session) return;

        const { error } = await supabase
          .from("event_participants")
          .update({ is_live: status, is_active: status })
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
  // const createEventParticipant = useCallback(
  //   async (role: "host" | "streamer" | "viewer") => {
  //     try {
  //       const {
  //         data: { session },
  //         error: sessionError,
  //       } = await supabase.auth.getSession();
  //       if (sessionError || !session) return;

  //       const { error } = await supabase.from("event_participants").upsert(
  //         {
  //           event_id: eventId,
  //           user_id: session.user.id,
  //           role: role,
  //           is_active: true,
  //           is_live: true,
  //         },
  //         {
  //           onConflict: "event_id,user_id",
  //         }
  //       );

  //       if (error) {
  //         console.error("Error creating event participant:", error);
  //       }
  //     } catch (error) {
  //       console.error("Error creating event participant:", error);
  //     }
  //   },
  //   [eventId]
  // );

  const checkAndUpdateLiveStatus =
    useCallback(async (): Promise<LiveStatusResult | null> => {
      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();
        if (sessionError || !session) return null;

        // Use a database transaction with advisory lock to prevent race conditions
        const { data, error } = await supabase.rpc(
          "update_event_live_status_atomic" as any,
          {
            p_event_id: eventId,
          }
        );

        if (error) {
          console.error("Error in atomic live status update:", error);
          return null;
        }

        // Extract the result from the returned data
        const result = Array.isArray(data) ? data[0] : data;
        return result as LiveStatusResult;
      } catch (error) {
        console.error("Error updating event live status:", error);
        return null;
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

      // If enabling camera, first request permission on mobile
      if (enabled) {
        console.log("📱 MOBILE DEBUG - Requesting camera permission before enabling");
        const hasPermission = await requestCameraPermission(currentFacingMode);
        if (!hasPermission) {
          console.log("📱 MOBILE DEBUG - Camera permission denied, aborting toggle");
          return;
        }
      }

      await localParticipant.setCameraEnabled(enabled);
      setIsVideoEnabled(enabled);

      if (enabled) {
        toast.success("Camera turned on");
      } else {
        toast.info("Camera turned off");
      }
    } catch (error) {
      toast.error("Failed to toggle camera");
      console.error("📱 MOBILE DEBUG - Toggle video error:", error);
    }
  }, [localParticipant, isVideoEnabled, requestCameraPermission, currentFacingMode]);

  const toggleVideoLiveButton = useCallback(
    async (enabled: boolean) => {
      if (!localParticipant) {
        toast.error("Not connected to room");
        return;
      }

      try {
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
    },
    [localParticipant, isVideoEnabled]
  );

  const toggleAudio = useCallback(async () => {
    if (!localParticipant) {
      toast.error("Not connected to room");
      return;
    }

    try {
      const enabled = !isAudioEnabled;
      
      // If enabling microphone, first request permission on mobile
      if (enabled) {
        console.log("📱 MOBILE DEBUG - Requesting microphone permission before enabling");
        const hasPermission = await requestMicrophonePermission();
        if (!hasPermission) {
          console.log("📱 MOBILE DEBUG - Microphone permission denied, aborting toggle");
          return;
        }
      }

      await localParticipant.setMicrophoneEnabled(enabled);
      setIsAudioEnabled(enabled);

      if (enabled) {
        toast.success("Microphone turned on");
      } else {
        toast.info("Microphone muted");
      }
    } catch (error) {
      toast.error("Failed to toggle microphone");
      console.error("📱 MOBILE DEBUG - Toggle audio error:", error);
    }
  }, [localParticipant, isAudioEnabled, requestMicrophonePermission]);

  const toggleAudioLiveButton = useCallback(
    async (enabled: boolean) => {
      if (!localParticipant) {
        toast.error("Not connected to room");
        return;
      }

      try {
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
    },
    [localParticipant, isAudioEnabled]
  );

  const toggleScreenShare = useCallback(async () => {
    if (!localParticipant) {
      toast.error("Not connected to room");
      return;
    }

    // Check if screen share is supported (fails gracefully on mobile)
    if (!checkScreenShareSupport()) {
      console.log("📱 MOBILE DEBUG - Screen share not supported, failing gracefully");
      return;
    }

    try {
      const enabled = !isScreenSharing;
      
      // If enabling screen share, first request permission
      if (enabled) {
        console.log("📱 MOBILE DEBUG - Requesting screen share permission before enabling");
        const hasPermission = await requestScreenShare();
        if (!hasPermission) {
          console.log("📱 MOBILE DEBUG - Screen share permission denied, aborting toggle");
          return;
        }
      }

      await localParticipant.setScreenShareEnabled(enabled);
      setIsScreenSharing(enabled);

      if (enabled) {
        toast.success("Screen sharing started");
      } else {
        toast.info("Screen sharing stopped");
      }
    } catch (error) {
      toast.error("Failed to toggle screen share");
      console.error("📱 MOBILE DEBUG - Toggle screen share error:", error);
    }
  }, [localParticipant, isScreenSharing, checkScreenShareSupport, requestScreenShare]);

  const startStream = useCallback(async () => {
    //TODO: actually it's doing nothing
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

      await updateParticipantLiveStatus(true); // NOTE: make sure this runs first
      
      // Request media permissions before going live
      console.log("📱 MOBILE DEBUG - Requesting media permissions for going live");
      const permissions = await requestBothPermissions(currentFacingMode);
      
      if (permissions.camera && !isVideoEnabled) {
        toggleVideoLiveButton(true);
      }
      if (permissions.microphone && !isAudioEnabled) {
        toggleAudioLiveButton(true);
      }
      
      // Warn if permissions were denied
      if (!permissions.camera && !permissions.microphone) {
        toast.error("Camera and microphone access required to go live");
        setIsStreaming(false);
        setGoLive(false);
        return;
      } else if (!permissions.camera) {
        toast.error("Camera access denied - going live with audio only");
      } else if (!permissions.microphone) {
        toast.error("Microphone access denied - going live with video only");
      }

      setTimeout(async () => {
        await checkAndUpdateLiveStatus();
      }, 10);

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
  }, [
    eventId,
    checkAndUpdateLiveStatus,
    updateParticipantLiveStatus,
    toggleVideoLiveButton,
    toggleAudioLiveButton,
    isVideoEnabled,
    isAudioEnabled,
    requestBothPermissions,
    currentFacingMode,
  ]);

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
      if (isVideoEnabled) {
        toggleVideoLiveButton(false);
      }
      if (isAudioEnabled) {
        toggleAudioLiveButton(false);
      }
      await supabase
        .from("event_streams")
        .update({ is_active: false })
        .eq("event_id", eventId)
        .eq("streamer_id", session.user.id);

      setTimeout(async () => {
        const result = await checkAndUpdateLiveStatus();

        console.log({ result });

        if (result.should_close_room) {
          await supabase.functions.invoke("manage-livekit-room", {
            body: {
              action: "close",
              eventId,
            },
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
          });
          navigate(`/event/${eventId}`);
          console.log(`room closed for event: ${eventId}`);
        } else {
          navigate(`/event/${eventId}`);
        }

        // Modify your code at line 663 to this:
      }, 10);

      toast.success("Stream stopped");
    } catch (error) {
      toast.error("Failed to stop stream");
      console.error("Stop stream error:", error);
    }
  }, [
    eventId,
    updateParticipantLiveStatus,
    checkAndUpdateLiveStatus,
    toggleVideoLiveButton,
    toggleAudioLiveButton,
    isVideoEnabled,
    isAudioEnabled,
    navigate,
  ]);

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
