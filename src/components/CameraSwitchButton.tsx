
import React from 'react';
import { Button } from '@/components/ui/button';
import { RotateCcw, Camera } from 'lucide-react';
import { useScreenSize } from '@/hooks/use-mobile';

interface CameraSwitchButtonProps {
  availableCameras: MediaDeviceInfo[];
  isSwitchingCamera: boolean;
  isVideoEnabled: boolean;
  onSwitchCamera: () => Promise<void>;
}

const CameraSwitchButton: React.FC<CameraSwitchButtonProps> = ({
  availableCameras,
  isSwitchingCamera,
  isVideoEnabled,
  onSwitchCamera
}) => {
  const screenSize = useScreenSize();

  // Only show if multiple cameras available and video is enabled
  if (availableCameras.length < 2 || !isVideoEnabled) {
    return null;
  }

  return (
    <Button
      onClick={onSwitchCamera}
      variant="secondary"
      className="w-full text-xs sm:text-sm"
      size={screenSize === "mobile" ? "sm" : "default"}
      disabled={isSwitchingCamera}
    >
      {isSwitchingCamera ? (
        <>
          <RotateCcw className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 animate-spin" />
          {screenSize === "mobile" ? "Switching..." : "Switching Camera..."}
        </>
      ) : (
        <>
          <Camera className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
          {screenSize === "mobile" ? "Flip" : "Switch Camera"}
        </>
      )}
    </Button>
  );
};

export default CameraSwitchButton;
