/* eslint-disable react-hooks/rules-of-hooks */
import { useState, useCallback, useEffect } from "react";
import {
  useLocalParticipant,
  useRoomContext,
  useMediaDevices,
  useMediaDeviceSelect,
} from "@livekit/components-react";
// import { Track } from "livekit-client";
import { useLiveKitTrackSource } from "@/lib/livekitLazy";
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
  // Updated to accept streamerCount (aggregate tracks)
  startStream: (streamerCount: number) => Promise<void>;
  stopStream: () => Promise<void>;
  stopEvent: () => Promise<void>;
  participantCount: number;
  // Camera switching functionality
  availableCameras: MediaDeviceInfo[];
  currentCamera: string | null;
  currentFacingMode: "user" | "environment";
  isSwitchingCamera: boolean;
  switchCamera: () => Promise<void>;
  // Torch functionality
  isTorchEnabled: boolean;
  isTorchSupported: boolean;
  toggleTorch: () => Promise<void>;
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

  const TrackSource = useLiveKitTrackSource();

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

  // State for torch functionality
  const [isTorchEnabled, setIsTorchEnabled] = useState(false);
  const [isTorchSupported, setIsTorchSupported] = useState(false);

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

  // Enhanced helper function to detect camera type from device info for Android devices
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
            // Android-specific patterns
            containsCamera2_0: label.includes("camera2 0"),
            containsCamera2_1: label.includes("camera2 1"),
            containsCamera_0: label.includes("camera 0"),
            containsCamera_1: label.includes("camera 1"),
          },
          null,
          2
        )
      );

      // Standard front camera detection
      if (
        label.includes("front") ||
        label.includes("user") ||
        label.includes("facing")
      ) {
        console.log("📱 MOBILE DEBUG - Classified as USER camera (standard)");
        return "user";
      }

      // Standard back camera detection
      if (
        label.includes("back") ||
        label.includes("rear") ||
        label.includes("environment")
      ) {
        console.log(
          "📱 MOBILE DEBUG - Classified as ENVIRONMENT camera (standard)"
        );
        return "environment";
      }

      // Android-specific camera detection patterns
      // On most Android devices: camera2 0 = back, camera2 1 = front
      // On some devices: camera 0 = back, camera 1 = front
      if (label.includes("camera2 0") || label.includes("camera 0")) {
        console.log(
          "📱 MOBILE DEBUG - Classified as ENVIRONMENT camera (Android numeric - camera 0)"
        );
        return "environment";
      }

      if (label.includes("camera2 1") || label.includes("camera 1")) {
        console.log(
          "📱 MOBILE DEBUG - Classified as USER camera (Android numeric - camera 1)"
        );
        return "user";
      }

      // Fallback: Use device enumeration order for Android devices with generic labels
      const isAndroid = /Android/.test(navigator.userAgent);
      if (isAndroid && videoDevices.length >= 2) {
        const deviceIndex = videoDevices.findIndex(
          (d) => d.deviceId === device.deviceId
        );
        if (deviceIndex === 0) {
          console.log(
            "📱 MOBILE DEBUG - Classified as USER camera (Android fallback - first device)"
          );
          return "user";
        } else if (deviceIndex === 1) {
          console.log(
            "📱 MOBILE DEBUG - Classified as ENVIRONMENT camera (Android fallback - second device)"
          );
          return "environment";
        }
      }

      console.log("📱 MOBILE DEBUG - Classified as UNKNOWN camera");
      return "unknown";
    },
    [videoDevices]
  );

  // Sync currentFacingMode with the actual active camera from LiveKit
  useEffect(() => {
    if (!currentCamera || videoDevices.length === 0) {
      console.log(
        "📱 MOBILE DEBUG - Camera sync skipped: no current camera or devices"
      );
      return;
    }

    const activeCamera = videoDevices.find(
      (device) => device.deviceId === currentCamera
    );
    if (!activeCamera) {
      console.log(
        "📱 MOBILE DEBUG - Camera sync skipped: active camera not found in device list"
      );
      return;
    }

    const detectedFacingMode = getCameraType(activeCamera);
    if (
      detectedFacingMode !== "unknown" &&
      detectedFacingMode !== currentFacingMode
    ) {
      console.log(
        "📱 MOBILE DEBUG - Camera sync: Updating facing mode",
        JSON.stringify(
          {
            previousFacingMode: currentFacingMode,
            detectedFacingMode: detectedFacingMode,
            activeCamera: {
              deviceId: activeCamera.deviceId,
              label: activeCamera.label,
            },
          },
          null,
          2
        )
      );
      setCurrentFacingMode(detectedFacingMode);
    } else {
      console.log(
        "📱 MOBILE DEBUG - Camera sync: No change needed",
        JSON.stringify(
          {
            currentFacingMode: currentFacingMode,
            detectedFacingMode: detectedFacingMode,
            activeCamera: {
              deviceId: activeCamera.deviceId,
              label: activeCamera.label,
            },
          },
          null,
          2
        )
      );
    }
  }, [currentCamera, videoDevices, getCameraType, currentFacingMode]);

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

      // Reset torch when switching cameras
      if (isTorchEnabled) {
        setIsTorchEnabled(false);
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

  // const checkAndUpdateLiveStatus =
  //   useCallback(async (): Promise<LiveStatusResult | null> => {
  //     try {
  //       const {
  //         data: { session },
  //         error: sessionError,
  //       } = await supabase.auth.getSession();
  //       if (sessionError || !session) return null;

  //       // Use a database transaction with advisory lock to prevent race conditions
  //       const { data, error } = await supabase.rpc(
  //         "update_event_live_status_atomic" as any,
  //         {
  //           p_event_id: eventId,
  //         }
  //       );

  //       if (error) {
  //         console.error("Error in atomic live status update:", error);
  //         return null;
  //       }

  //       // Extract the result from the returned data
  //       const result = Array.isArray(data) ? data[0] : data;
  //       return result as LiveStatusResult;
  //     } catch (error) {
  //       console.error("Error updating event live status:", error);
  //       return null;
  //     }
  //   }, [eventId]);

  const checkStreamerCounts = useCallback(async () => {
    const { data, error } = await supabase
      .from("event_streams")
      .select("streamer_counts")
      .eq("event_id", eventId)
      .single();
    if (error) {
      console.error("Error checking streamer counts:", error);
      return null;
    }
    return data?.streamer_counts;
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
      stopEvent: async () => {},
      participantCount: 0,
      availableCameras: [],
      currentCamera: null,
      currentFacingMode: "user" as const,
      isSwitchingCamera: false,
      switchCamera: async () => {},
      isTorchEnabled: false,
      isTorchSupported: false,
      toggleTorch: async () => {},
    };
  }

  const toggleVideo = useCallback(async () => {
    if (!localParticipant) {
      toast.error("Not connected to room");
      return;
    }

    try {
      const enabled = !isVideoEnabled;

      // Only do direct permission check on mobile browsers to fix mobile prompting
      // Let desktop browsers use the normal LiveKit flow
      const isMobile =
        /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent
        );

      if (enabled && isMobile) {
        console.log(
          "📱 MOBILE DEBUG - Requesting camera permission before enabling (direct approach)"
        );

        try {
          // Direct getUserMedia call for camera in user interaction context
          const constraints: MediaStreamConstraints = {
            video: {
              facingMode: { ideal: currentFacingMode },
              width: { ideal: 1280, max: 1920 },
              height: { ideal: 720, max: 1080 },
            } as MediaTrackConstraints,
            audio: false,
          };

          // Add torch constraint for back camera if enabled
          if (currentFacingMode === "environment" && isTorchEnabled) {
            (constraints.video as any).torch = true;
          }

          const stream = await navigator.mediaDevices.getUserMedia(constraints);

          console.log("📱 MOBILE DEBUG - Direct camera permission granted");
          // Stop the test stream immediately
          stream.getTracks().forEach((track) => track.stop());
        } catch (permissionError) {
          console.log(
            "📱 MOBILE DEBUG - Direct camera permission failed:",
            permissionError
          );

          if (permissionError instanceof Error) {
            if (
              permissionError.name === "NotAllowedError" ||
              permissionError.name === "PermissionDeniedError"
            ) {
              toast.error(
                "Camera access denied. Please tap 'Allow' when prompted, or enable camera permissions in your browser settings."
              );
            } else if (permissionError.name === "NotFoundError") {
              toast.error("No camera found on this device.");
            } else {
              toast.error("Camera error. Please try again.");
            }
          }
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
  }, [localParticipant, isVideoEnabled, currentFacingMode, isTorchEnabled]);

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

      // Only do direct permission check on mobile browsers to fix mobile prompting
      // Let desktop browsers use the normal LiveKit flow
      const isMobile =
        /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent
        );

      if (enabled && isMobile) {
        console.log(
          "📱 MOBILE DEBUG - Requesting microphone permission before enabling (direct approach)"
        );

        try {
          // Direct getUserMedia call for microphone in user interaction context
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
              sampleRate: 44100,
            },
            video: false,
          });

          console.log("📱 MOBILE DEBUG - Direct microphone permission granted");
          // Stop the test stream immediately
          stream.getTracks().forEach((track) => track.stop());
        } catch (permissionError) {
          console.log(
            "📱 MOBILE DEBUG - Direct microphone permission failed:",
            permissionError
          );

          if (permissionError instanceof Error) {
            if (
              permissionError.name === "NotAllowedError" ||
              permissionError.name === "PermissionDeniedError"
            ) {
              toast.error(
                "Microphone access denied. Please tap 'Allow' when prompted, or enable microphone permissions in your browser settings."
              );
            } else if (permissionError.name === "NotFoundError") {
              toast.error("No microphone found on this device.");
            } else {
              toast.error("Microphone error. Please try again.");
            }
          }
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
  }, [localParticipant, isAudioEnabled]);

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
      console.log(
        "📱 MOBILE DEBUG - Screen share not supported, failing gracefully"
      );
      return;
    }

    try {
      const enabled = !isScreenSharing;

      // If enabling screen share, first request permission
      if (enabled) {
        console.log(
          "📱 MOBILE DEBUG - Requesting screen share permission before enabling"
        );
        const hasPermission = await requestScreenShare();
        if (!hasPermission) {
          console.log(
            "📱 MOBILE DEBUG - Screen share permission denied, aborting toggle"
          );
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
  }, [
    localParticipant,
    isScreenSharing,
    checkScreenShareSupport,
    requestScreenShare,
  ]);

  // Enhanced torch support detection with multi-method approach
  useEffect(() => {
    const getDeviceInfo = () => {
      const userAgent = navigator.userAgent;
      const isIOS = /iPad|iPhone|iPod/.test(userAgent);
      const isAndroid = /Android/.test(userAgent);
      const isSafari = /Safari/.test(userAgent) && !/Chrome/.test(userAgent);
      const isChrome = /Chrome/.test(userAgent);

      return {
        isIOS,
        isAndroid,
        isSafari,
        isChrome,
        isMobile: isIOS || isAndroid,
        userAgent,
      };
    };

    const checkTorchSupport = async () => {
      const deviceInfo = getDeviceInfo();
      console.log("[Torch] Enhanced torch detection starting:", {
        currentFacingMode,
        deviceInfo,
        hasLocalParticipant: !!localParticipant,
      });

      if (currentFacingMode !== "environment") {
        console.log(
          "[Torch] Not environment camera, setting torch support to false"
        );
        setIsTorchSupported(false);
        setIsTorchEnabled(false);
        return;
      }

      // For non-mobile devices, assume no torch support
      if (!deviceInfo.isMobile) {
        console.log("[Torch] Desktop device detected, no torch support");
        setIsTorchSupported(false);
        return;
      }

      try {
        // Get the native MediaStreamTrack from LiveKit's video track
        const cameraPublication = TrackSource
          ? localParticipant?.getTrackPublication(TrackSource.Camera)
          : undefined;
        const videoTrack = cameraPublication?.track;

        if (!videoTrack || !("mediaStreamTrack" in videoTrack)) {
          console.log(
            "[Torch] No video track available, using optimistic detection for mobile"
          );

          // Optimistic approach: assume torch support on mobile back cameras
          if (deviceInfo.isMobile && currentFacingMode === "environment") {
            console.log(
              "[Torch] Optimistic torch support enabled for mobile back camera"
            );
            setIsTorchSupported(true);
          } else {
            setIsTorchSupported(false);
          }
          return;
        }

        const nativeTrack = (videoTrack as any).mediaStreamTrack;
        console.log(
          "[Torch] Native track found, starting multi-method detection"
        );

        // Method 1: Check getCapabilities()
        let torchSupportedByCapabilities = false;
        if (typeof nativeTrack.getCapabilities === "function") {
          try {
            const capabilities = nativeTrack.getCapabilities();
            console.log("[Torch] Method 1 - Track capabilities:", capabilities);
            torchSupportedByCapabilities = capabilities.torch === true;
          } catch (capError) {
            console.log("[Torch] Method 1 - getCapabilities failed:", capError);
          }
        }

        // Method 2: Check getSupportedConstraints()
        let torchSupportedByConstraints = false;
        if (
          typeof navigator.mediaDevices?.getSupportedConstraints === "function"
        ) {
          try {
            const supportedConstraints =
              navigator.mediaDevices.getSupportedConstraints();
            console.log(
              "[Torch] Method 2 - Supported constraints:",
              supportedConstraints
            );
            torchSupportedByConstraints =
              (supportedConstraints as any).torch === true;
          } catch (constraintError) {
            console.log(
              "[Torch] Method 2 - getSupportedConstraints failed:",
              constraintError
            );
          }
        }

        // Method 3: Progressive constraint testing
        let torchSupportedByTesting = false;
        try {
          console.log("[Torch] Method 3 - Testing constraint application");

          // Try to apply a torch constraint temporarily to test support
          const currentSettings = nativeTrack.getSettings();
          console.log("[Torch] Current track settings:", currentSettings);

          // Test constraint application with current torch state
          await nativeTrack.applyConstraints({ torch: false });
          console.log("[Torch] Method 3 - Standard constraint test passed");
          torchSupportedByTesting = true;
        } catch (testError) {
          console.log(
            "[Torch] Method 3 - Standard constraint test failed, trying advanced format"
          );

          try {
            await nativeTrack.applyConstraints({
              advanced: [{ torch: false }],
            });
            console.log("[Torch] Method 3 - Advanced constraint test passed");
            torchSupportedByTesting = true;
          } catch (advancedError) {
            console.log(
              "[Torch] Method 3 - All constraint tests failed:",
              advancedError
            );
          }
        }

        // Method 4: Device-specific logic
        let torchSupportedByDevice = false;
        if (deviceInfo.isMobile && currentFacingMode === "environment") {
          if (deviceInfo.isIOS && deviceInfo.isSafari) {
            // iOS Safari: More reliable API support on newer devices
            torchSupportedByDevice =
              torchSupportedByCapabilities || torchSupportedByConstraints;
          } else if (deviceInfo.isAndroid && deviceInfo.isChrome) {
            // Android Chrome: Less reliable API, use optimistic approach
            torchSupportedByDevice = true; // Assume support, test during actual usage
          }
        }

        // Combine results with weighted decision
        const detectionResults = {
          capabilities: torchSupportedByCapabilities,
          constraints: torchSupportedByConstraints,
          testing: torchSupportedByTesting,
          device: torchSupportedByDevice,
        };

        console.log(
          "[Torch] All detection methods completed:",
          detectionResults
        );

        // Decision logic: any positive result enables torch support
        const finalTorchSupport =
          torchSupportedByCapabilities ||
          torchSupportedByConstraints ||
          torchSupportedByTesting ||
          torchSupportedByDevice;

        console.log("[Torch] Final torch support decision:", finalTorchSupport);
        setIsTorchSupported(finalTorchSupport);
      } catch (error) {
        console.warn("[Torch] Error in enhanced torch detection:", error);

        // Fallback: optimistic approach for mobile devices
        if (deviceInfo.isMobile && currentFacingMode === "environment") {
          console.log(
            "[Torch] Fallback: enabling optimistic torch support for mobile"
          );
          setIsTorchSupported(true);
        } else {
          setIsTorchSupported(false);
        }
      }
    };

    // Only check when we have environment camera mode
    if (currentFacingMode === "environment") {
      checkTorchSupport();
    } else {
      setIsTorchSupported(false);
      setIsTorchEnabled(false);
    }
  }, [currentFacingMode, localParticipant, TrackSource]);

  const toggleTorch = useCallback(async () => {
    console.log("[Torch] Toggle requested, current state:", isTorchEnabled);

    if (!localParticipant || currentFacingMode !== "environment") {
      console.log(
        "[Torch] Torch toggle blocked - missing participant or not back camera"
      );
      return;
    }

    // Guard for TrackSource not loaded
    const cameraPublication = TrackSource
      ? localParticipant.getTrackPublication(TrackSource.Camera)
      : undefined;
    if (!TrackSource) {
      console.warn(
        "[Torch] Track source not loaded yet; skipping torch toggle"
      );
      return;
    }

    try {
      const newTorchState = !isTorchEnabled;

      // Get current video track
      // const cameraPublication = localParticipant.getTrackPublication(
      //   Track.Source.Camera
      // );

      if (
        !cameraPublication?.track ||
        !("mediaStreamTrack" in cameraPublication.track)
      ) {
        console.warn(
          "[Torch] No video track or mediaStreamTrack available for torch control"
        );
        toast.error("Camera not available for torch control");
        return;
      }

      const nativeTrack = (cameraPublication.track as any).mediaStreamTrack;
      console.log("[Torch] Applying constraints to native track:", {
        torch: newTorchState,
      });

      let constraintApplied = false;
      let lastError: any = null;

      // Method 1: Try standard constraint format
      try {
        await nativeTrack.applyConstraints({ torch: newTorchState });
        console.log("[Torch] Standard constraint applied successfully");
        constraintApplied = true;
      } catch (standardError) {
        console.warn("[Torch] Standard constraint failed:", standardError);
        lastError = standardError;

        // Method 2: Try advanced constraint format
        try {
          await nativeTrack.applyConstraints({
            advanced: [{ torch: newTorchState }],
          });
          console.log("[Torch] Advanced constraint applied successfully");
          constraintApplied = true;
        } catch (advancedError) {
          console.warn("[Torch] Advanced constraint failed:", advancedError);
          lastError = advancedError;

          // Method 3: Try with video constraints wrapper
          try {
            await nativeTrack.applyConstraints({
              video: { torch: newTorchState },
            } as any);
            console.log(
              "[Torch] Video-wrapped constraint applied successfully"
            );
            constraintApplied = true;
          } catch (videoError) {
            console.warn(
              "[Torch] Video-wrapped constraint failed:",
              videoError
            );
            lastError = videoError;
          }
        }
      }

      if (constraintApplied) {
        setIsTorchEnabled(newTorchState);
        toast.success(`Torch ${newTorchState ? "on" : "off"}`);
        console.log(
          `[Torch] Successfully ${newTorchState ? "enabled" : "disabled"} torch`
        );

        // If this was the first successful toggle and torch wasn't previously supported,
        // update torch support status
        if (!isTorchSupported) {
          console.log(
            "[Torch] First successful toggle detected, updating support status"
          );
          setIsTorchSupported(true);
        }
      } else {
        throw (
          lastError || new Error("All constraint application methods failed")
        );
      }
    } catch (error) {
      console.error("[Torch] Error toggling torch:", error);

      // Provide device-specific error messages
      const userAgent = navigator.userAgent;
      const isIOS = /iPad|iPhone|iPod/.test(userAgent);
      const isAndroid = /Android/.test(userAgent);

      let errorMessage = "Failed to toggle torch";
      if (isIOS) {
        errorMessage = "Torch not available on this iOS device/browser";
      } else if (isAndroid) {
        errorMessage = "Torch not supported on this Android device";
      }

      toast.error(errorMessage);

      // Update support status if torch definitively doesn't work
      setIsTorchSupported(false);
      setIsTorchEnabled(false);
    }
  }, [
    localParticipant,
    currentFacingMode,
    isTorchEnabled,
    isTorchSupported,
    TrackSource,
  ]);

  const startStream = useCallback(
    async (streamerCount: number) => {
      try {
        // Use a more direct approach - request permissions using native getUserMedia
        // This bypasses any potential issues with the custom permission hook
        let cameraGranted = false;
        let microphoneGranted = false;

        try {
          console.log(
            "📱 MOBILE DEBUG - Attempting direct getUserMedia call for both camera and mic"
          );
          const constraints: MediaStreamConstraints = {
            video: {
              facingMode: { ideal: currentFacingMode },
              width: { ideal: 1280, max: 1920 },
              height: { ideal: 720, max: 1080 },
            } as MediaTrackConstraints,
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            },
          };

          if (currentFacingMode === "environment" && isTorchEnabled) {
            (constraints.video as any).torch = true;
          }

          const stream = await navigator.mediaDevices.getUserMedia(constraints);

          const videoTracks = stream.getVideoTracks();
          const audioTracks = stream.getAudioTracks();

          cameraGranted = videoTracks.length > 0;
          microphoneGranted = audioTracks.length > 0;

          console.log("📱 MOBILE DEBUG - Direct getUserMedia success:", {
            cameraGranted,
            microphoneGranted,
            videoTracks: videoTracks.length,
            audioTracks: audioTracks.length,
          });

          stream.getTracks().forEach((track) => track.stop());
        } catch (directError) {
          console.log(
            "📱 MOBILE DEBUG - Direct getUserMedia failed, falling back to individual requests:",
            directError
          );

          const permissions = await requestBothPermissions(currentFacingMode);
          cameraGranted = permissions.camera;
          microphoneGranted = permissions.microphone;
        }

        if (!cameraGranted && !microphoneGranted) {
          console.log(
            "📱 MOBILE DEBUG - No permissions granted, aborting stream start"
          );
          toast.error(
            "Camera and microphone access is required to start streaming. Please tap 'Allow' when prompted, or enable permissions in your browser settings."
          );
          return;
        }

        console.log(
          "📱 MOBILE DEBUG - Step 2: Permissions granted, proceeding with stream setup"
        );

        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();
        if (sessionError || !session) {
          throw new Error("Please log in to access this stream");
        }

        console.log("📱 MOBILE DEBUG - Step 4: Setting streaming state");
        setIsStreaming(true);
        setGoLive(true);

        // await updateParticipantLiveStatus(true);

        if (cameraGranted && !isVideoEnabled) {
          console.log("📱 MOBILE DEBUG - Enabling camera");
          toggleVideoLiveButton(true);
        }
        if (microphoneGranted && !isAudioEnabled) {
          console.log("📱 MOBILE DEBUG - Enabling microphone");
          toggleAudioLiveButton(true);
        }

        if (!cameraGranted) {
          toast.warning("Camera access denied - streaming with audio only");
        } else if (!microphoneGranted) {
          toast.warning("Microphone access denied - streaming with video only");
        } else {
          toast.success("Camera and microphone ready!");
        }

        // setTimeout(async () => {
        //   await checkAndUpdateLiveStatus();
        // }, 10);

        // Single-row aggregator per event:
        // Upsert by event_id with streamer_counts and is_active=true.
        // Concurrency-safe due to UNIQUE(event_id).
        console.log("🔁 Upserting event_streams aggregator row", {
          event_id: eventId,
          streamer_counts: streamerCount,
        });

        const { error: eventError } = await supabase
          .from("events")
          .update({
            is_live: true,
          })
          .eq("id", eventId)
          .single();

        if (eventError) {
          console.error("Failed to update event status", eventError);
        }

        const { error: upsertErr } = await supabase
          .from("event_streams")
          .upsert(
            {
              event_id: eventId,
              // Keep a consistent name to identify aggregator row; not user-specific
              stream_name: "Main Stream",
              // streamer_id intentionally omitted; aggregator is not tied to one user
              is_active: true,
              streamer_counts: streamerCount,
              // updated_at will be auto-updated by trigger on UPDATE
            },
            // { onConflict: "event_id" }
          );

        if (upsertErr) {
          console.error(
            "❌ Error upserting event_streams aggregator:",
            upsertErr
          );
          throw upsertErr;
        }

        toast.success("Stream started successfully");
      } catch (error) {
        setIsStreaming(false);
        setGoLive(false);
        toast.error("Failed to start stream");
        console.error("Start stream error:", error);
      }
    },
    [
      eventId,
      toggleVideoLiveButton,
      toggleAudioLiveButton,
      isVideoEnabled,
      isAudioEnabled,
      requestBothPermissions,
      currentFacingMode,
      isTorchEnabled,
    ]
  );

  const closeRoom = useCallback(
    async (session: any) => {
      try {
        await supabase.functions.invoke("manage-livekit-room", {
          body: {
            action: "close",
            eventId,
          },
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });
      } catch (error) {
        console.error("Error closing room:", error);
      }
    },
    [eventId]
  );

  // Helper: fetch event URL (by slug if available)
  const fetchEventUrl = useCallback(async (): Promise<string> => {
    const { data: eventData } = await supabase
      .from("events")
      .select("slug")
      .eq("id", eventId)
      .single();

    return eventData?.slug ? `/event/${eventData.slug}` : `/event/${eventId}`;
  }, [eventId]);

  // Helper: navigate to event page
  const navigateToEvent = useCallback(async () => {
    const eventUrl = await fetchEventUrl();
    navigate(eventUrl);
  }, [fetchEventUrl, navigate]);

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

      // await updateParticipantLiveStatus(false);
      if (isVideoEnabled) {
        toggleVideoLiveButton(false);
      }
      if (isAudioEnabled) {
        toggleAudioLiveButton(false);
      }

      setTimeout(async () => {
        console.log("called stop stream");
        const result = await checkStreamerCounts();
        if (result && result < 2) {
          const {
            data: { session: latestSession },
          } = await supabase.auth.getSession();
          if (latestSession) {
            await closeRoom(latestSession);
          }
        }

        await navigateToEvent();
      }, 10);

      toast.success("Stream stopped");
    } catch (error) {
      toast.error("Failed to stop stream");
      console.error("Stop stream error:", error);
    }
  }, [
    checkStreamerCounts,
    toggleVideoLiveButton,
    toggleAudioLiveButton,
    isVideoEnabled,
    isAudioEnabled,
    navigateToEvent,
    closeRoom,
  ]);

  const stopEvent = useCallback(async () => {
    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error("Please log in to access this stream");
      }
      const { data, error } = await supabase
        .from("events")
        .update({ is_live: false })
        .eq("id", eventId);

      await supabase
        .from("event_participants")
        .update({ is_live: false })
        .eq("event_id", eventId);

      await supabase.from("event_streams").delete().eq("event_id", eventId);

      await closeRoom(session);

      await navigateToEvent();

      if (error) {
        console.error("Error stopping event:", error);
        toast.error("Failed to stop event");
        return;
      }

      toast.success("Event stopped successfully");
    } catch (error) {
      console.error("Error stopping event:", error);
      toast.error("Failed to stop event");
    }
  }, [eventId, closeRoom, navigateToEvent]);

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
    stopEvent,
    participantCount,
    availableCameras: videoDevices,
    currentCamera,
    currentFacingMode,
    isSwitchingCamera,
    switchCamera,
    isTorchEnabled,
    isTorchSupported,
    toggleTorch,
  };
};
