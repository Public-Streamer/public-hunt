import { useState, useCallback } from 'react';
import { useLocalParticipant } from '@livekit/components-react';
import { LocalParticipant } from 'livekit-client';

export const useStreamingControls = (localParticipant: LocalParticipant | null) => {
  const [isPublishing, setIsPublishing] = useState(false);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string>('');
  const [selectedMicrophone, setSelectedMicrophone] = useState<string>('');
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [micEnabled, setMicEnabled] = useState(true);
  const [screenShare, setScreenShare] = useState(false);

  const startPublishing = useCallback(async () => {
    if (!localParticipant) return;

    try {
      await localParticipant.enableCameraAndMicrophone();
      setIsPublishing(true);
      setCameraEnabled(true);
      setMicEnabled(true);
    } catch (error) {
      console.error('Failed to start publishing:', error);
      throw error;
    }
  }, [localParticipant]);

  const stopPublishing = useCallback(async () => {
    if (!localParticipant) return;

    try {
      await localParticipant.setCameraEnabled(false);
      await localParticipant.setMicrophoneEnabled(false);
      setIsPublishing(false);
      setCameraEnabled(false);
      setMicEnabled(false);
    } catch (error) {
      console.error('Failed to stop publishing:', error);
      throw error;
    }
  }, [localParticipant]);

  const toggleCamera = useCallback(async () => {
    if (!localParticipant) return;

    try {
      const newState = !cameraEnabled;
      await localParticipant.setCameraEnabled(newState);
      setCameraEnabled(newState);
    } catch (error) {
      console.error('Failed to toggle camera:', error);
      throw error;
    }
  }, [localParticipant, cameraEnabled]);

  const toggleMicrophone = useCallback(async () => {
    if (!localParticipant) return;

    try {
      const newState = !micEnabled;
      await localParticipant.setMicrophoneEnabled(newState);
      setMicEnabled(newState);
    } catch (error) {
      console.error('Failed to toggle microphone:', error);
      throw error;
    }
  }, [localParticipant, micEnabled]);

  const toggleScreenShare = useCallback(async () => {
    if (!localParticipant) return;

    try {
      const newState = !screenShare;
      await localParticipant.setScreenShareEnabled(newState);
      setScreenShare(newState);
    } catch (error) {
      console.error('Failed to toggle screen share:', error);
      throw error;
    }
  }, [localParticipant, screenShare]);

  const switchCamera = useCallback(async (deviceId: string) => {
    if (!localParticipant) return;

    try {
      // Note: switchActiveDevice is not available in current LiveKit client
      // This would need to be implemented using device selection before publishing
      console.log('Camera switch requested to device:', deviceId);
      setSelectedCamera(deviceId);
      // In practice, you would need to:
      // 1. Stop current camera
      // 2. Set new device constraints
      // 3. Restart camera with new device
    } catch (error) {
      console.error('Failed to switch camera:', error);
      throw error;
    }
  }, [localParticipant]);

  const switchMicrophone = useCallback(async (deviceId: string) => {
    if (!localParticipant) return;

    try {
      // Note: switchActiveDevice is not available in current LiveKit client
      console.log('Microphone switch requested to device:', deviceId);
      setSelectedMicrophone(deviceId);
      // In practice, you would need to:
      // 1. Stop current microphone
      // 2. Set new device constraints
      // 3. Restart microphone with new device
    } catch (error) {
      console.error('Failed to switch microphone:', error);
      throw error;
    }
  }, [localParticipant]);

  return {
    isPublishing,
    devices,
    selectedCamera,
    selectedMicrophone,
    cameraEnabled,
    micEnabled,
    screenShare,
    startPublishing,
    stopPublishing,
    toggleCamera,
    toggleMicrophone,
    toggleScreenShare,
    switchCamera,
    switchMicrophone,

    // Aliases for StreamerInterface compatibility
    isStreaming: isPublishing,
    isVideoEnabled: cameraEnabled,
    isAudioEnabled: micEnabled,
    isScreenSharing: screenShare,
    startStream: startPublishing,
    stopStream: stopPublishing,
    toggleVideo: toggleCamera,
    toggleAudio: toggleMicrophone,
    availableCameras: devices.filter(d => d.kind === 'videoinput'),
    isConnected: !!localParticipant,
    controlsLoading: false,
    isSwitchingCamera: false,
    currentFacingMode: 'user',
    isTorchEnabled: false,
    isTorchSupported: false,
    toggleTorch: async () => { },
  };
};
