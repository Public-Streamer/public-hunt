import { useState, useCallback } from 'react';
import { toast } from 'sonner';

export interface MediaPermissionStatus {
  camera: 'granted' | 'denied' | 'prompt' | 'unknown';
  microphone: 'granted' | 'denied' | 'prompt' | 'unknown';
  screenShare: 'supported' | 'unsupported';
}

export interface MobileMediaPermissions {
  permissionStatus: MediaPermissionStatus;
  requestCameraPermission: (
    facingMode?: 'user' | 'environment'
  ) => Promise<boolean>;
  requestMicrophonePermission: () => Promise<boolean>;
  requestBothPermissions: (
    facingMode?: 'user' | 'environment'
  ) => Promise<{ camera: boolean; microphone: boolean }>;
  checkScreenShareSupport: () => boolean;
  requestScreenShare: () => Promise<boolean>;
}

export const useMobileMediaPermissions = (): MobileMediaPermissions => {
  const [permissionStatus, setPermissionStatus] =
    useState<MediaPermissionStatus>({
      camera: 'unknown',
      microphone: 'unknown',
      screenShare: checkScreenShareSupport() ? 'supported' : 'unsupported',
    });

  // Check if screen share is supported
  function checkScreenShareSupport(): boolean {
    return !!(
      navigator.mediaDevices &&
      navigator.mediaDevices.getDisplayMedia &&
      // Screen share is generally not supported on mobile browsers
      !/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      )
    );
  }

  // Request camera permission with mobile-optimized constraints
  const requestCameraPermission = useCallback(
    async (facingMode: 'user' | 'environment' = 'user'): Promise<boolean> => {
      try {
        console.log(
          '📱 MOBILE DEBUG - Requesting camera permission with facingMode:',
          facingMode
        );

        // Mobile-optimized video constraints
        const constraints: MediaStreamConstraints = {
          video: {
            facingMode: { ideal: facingMode },
            width: { ideal: 1280, max: 1920 },
            height: { ideal: 720, max: 1080 },
            frameRate: { ideal: 30, max: 30 },
          },
          audio: false, // Only request video for this function
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);

        // Successfully got camera access
        console.log('📱 MOBILE DEBUG - Camera permission granted');
        setPermissionStatus((prev) => ({ ...prev, camera: 'granted' }));

        // Stop the test stream immediately
        stream.getTracks().forEach((track) => track.stop());

        return true;
      } catch (error) {
        console.error('📱 MOBILE DEBUG - Camera permission error:', error);

        if (error instanceof Error) {
          if (
            error.name === 'NotAllowedError' ||
            error.name === 'PermissionDeniedError'
          ) {
            setPermissionStatus((prev) => ({ ...prev, camera: 'denied' }));
            toast.error(
              'Camera access denied. Please enable camera permissions in your browser settings.'
            );
          } else if (
            error.name === 'NotFoundError' ||
            error.name === 'DevicesNotFoundError'
          ) {
            toast.error('No camera found on this device.');
          } else if (error.name === 'NotSupportedError') {
            toast.error('Camera is not supported on this device.');
          } else if (error.name === 'OverconstrainedError') {
            // Try with basic constraints as fallback
            try {
              console.log('📱 MOBILE DEBUG - Retrying with basic constraints');
              const basicStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode },
                audio: false,
              });
              basicStream.getTracks().forEach((track) => track.stop());
              setPermissionStatus((prev) => ({ ...prev, camera: 'granted' }));
              return true;
            } catch (fallbackError) {
              console.error(
                '📱 MOBILE DEBUG - Fallback camera request failed:',
                fallbackError
              );
              toast.error(
                'Camera constraints not supported. Please try a different device.'
              );
            }
          } else {
            toast.error(`Camera error: ${error.message}`);
          }
        }

        return false;
      }
    },
    []
  );

  // Request microphone permission with mobile-optimized constraints
  const requestMicrophonePermission =
    useCallback(async (): Promise<boolean> => {
      try {
        console.log('📱 MOBILE DEBUG - Requesting microphone permission');

        // Mobile-optimized audio constraints
        const constraints: MediaStreamConstraints = {
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            sampleRate: 44100,
          },
          video: false, // Only request audio for this function
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);

        // Successfully got microphone access
        console.log('📱 MOBILE DEBUG - Microphone permission granted');
        setPermissionStatus((prev) => ({ ...prev, microphone: 'granted' }));

        // Stop the test stream immediately
        stream.getTracks().forEach((track) => track.stop());

        return true;
      } catch (error) {
        console.error('📱 MOBILE DEBUG - Microphone permission error:', error);

        if (error instanceof Error) {
          if (
            error.name === 'NotAllowedError' ||
            error.name === 'PermissionDeniedError'
          ) {
            setPermissionStatus((prev) => ({ ...prev, microphone: 'denied' }));
            toast.error(
              'Microphone access denied. Please enable microphone permissions in your browser settings.'
            );
          } else if (
            error.name === 'NotFoundError' ||
            error.name === 'DevicesNotFoundError'
          ) {
            toast.error('No microphone found on this device.');
          } else if (error.name === 'NotSupportedError') {
            toast.error('Microphone is not supported on this device.');
          } else {
            toast.error(`Microphone error: ${error.message}`);
          }
        }

        return false;
      }
    }, []);

  // Request both camera and microphone permissions together (recommended for mobile)
  const requestBothPermissions = useCallback(
    async (facingMode: 'user' | 'environment' = 'user') => {
      try {
        console.log(
          '📱 MOBILE DEBUG - Requesting both camera and microphone permissions'
        );

        // Request both permissions in a single getUserMedia call for better UX
        const constraints: MediaStreamConstraints = {
          video: {
            facingMode: { ideal: facingMode },
            width: { ideal: 1280, max: 1920 },
            height: { ideal: 720, max: 1080 },
            frameRate: { ideal: 30, max: 30 },
          },
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            sampleRate: 44100,
          },
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);

        // Check what we actually got
        const videoTracks = stream.getVideoTracks();
        const audioTracks = stream.getAudioTracks();

        const cameraGranted = videoTracks.length > 0;
        const microphoneGranted = audioTracks.length > 0;

        console.log('📱 MOBILE DEBUG - Combined permission result:', {
          cameraGranted,
          microphoneGranted,
          videoTracks: videoTracks.length,
          audioTracks: audioTracks.length,
        });

        setPermissionStatus((prev) => ({
          ...prev,
          camera: cameraGranted ? 'granted' : 'denied',
          microphone: microphoneGranted ? 'granted' : 'denied',
        }));

        // Stop the test stream immediately
        stream.getTracks().forEach((track) => track.stop());

        if (cameraGranted && microphoneGranted) {
          toast.success('Camera and microphone access granted!');
        } else if (cameraGranted) {
          toast.success('Camera access granted!');
          toast.error('Microphone access denied.');
        } else if (microphoneGranted) {
          toast.success('Microphone access granted!');
          toast.error('Camera access denied.');
        } else {
          toast.error('Both camera and microphone access denied.');
        }

        return { camera: cameraGranted, microphone: microphoneGranted };
      } catch (error) {
        console.error('📱 MOBILE DEBUG - Combined permission error:', error);

        // Fallback: try individual permissions
        console.log(
          '📱 MOBILE DEBUG - Falling back to individual permission requests'
        );
        const cameraResult = await requestCameraPermission(facingMode);
        const microphoneResult = await requestMicrophonePermission();

        return { camera: cameraResult, microphone: microphoneResult };
      }
    },
    [requestCameraPermission, requestMicrophonePermission]
  );

  // Handle screen share request
  const requestScreenShare = useCallback(async (): Promise<boolean> => {
    if (!checkScreenShareSupport()) {
      console.log(
        '📱 MOBILE DEBUG - Screen share not supported on this device'
      );
      toast.info('Screen sharing is not supported on mobile devices.');
      return false;
    }

    try {
      console.log('📱 MOBILE DEBUG - Requesting screen share permission');

      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });

      console.log('📱 MOBILE DEBUG - Screen share permission granted');

      // Stop the test stream immediately
      stream.getTracks().forEach((track) => track.stop());

      toast.success('Screen sharing permission granted!');
      return true;
    } catch (error) {
      console.error('📱 MOBILE DEBUG - Screen share permission error:', error);

      if (error instanceof Error) {
        if (
          error.name === 'NotAllowedError' ||
          error.name === 'PermissionDeniedError'
        ) {
          toast.error('Screen sharing access denied.');
        } else if (error.name === 'NotSupportedError') {
          toast.error('Screen sharing is not supported on this device.');
        } else {
          toast.error(`Screen sharing error: ${error.message}`);
        }
      }

      return false;
    }
  }, []);

  return {
    permissionStatus,
    requestCameraPermission,
    requestMicrophonePermission,
    requestBothPermissions,
    checkScreenShareSupport,
    requestScreenShare,
  };
};
