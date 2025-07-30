import React from "react";
import { Button } from "@/components/ui/button";
import { Flashlight, FlashlightOff } from "lucide-react";
import { useScreenSize } from "@/hooks/use-mobile";

interface TorchButtonProps {
  isTorchEnabled: boolean;
  isTorchSupported: boolean;
  currentFacingMode: "user" | "environment";
  isVideoEnabled: boolean;
  onToggleTorch: () => Promise<void>;
}

const TorchButton: React.FC<TorchButtonProps> = ({
  isTorchEnabled,
  isTorchSupported,
  currentFacingMode,
  isVideoEnabled,
  onToggleTorch,
}) => {
  const screenSize = useScreenSize();

  // Enhanced torch button visibility logic
  // Show torch button if back camera is active and video is enabled
  // Don't hide immediately if torch support is uncertain - let the user try
  if (currentFacingMode !== "environment" || !isVideoEnabled) {
    console.log('[TorchButton] Hidden - not environment camera or video disabled:', {
      currentFacingMode,
      isVideoEnabled,
      isTorchSupported,
    });
    return null;
  }

  // Only hide if torch is definitively not supported AND we have a clear determination
  // This allows the button to show during detection phase and for optimistic support
  console.log('[TorchButton] Visible - showing torch button:', {
    currentFacingMode,
    isVideoEnabled,
    isTorchSupported,
  });

  return (
    <Button
      onClick={onToggleTorch}
      variant={isTorchEnabled ? "default" : "secondary"}
      className="w-full text-xs sm:text-sm"
      size={screenSize === "mobile" ? "sm" : "default"}
    >
      {isTorchEnabled ? (
        <>
          <Flashlight className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
          {screenSize === "mobile" ? "Torch" : "Torch On"}
        </>
      ) : (
        <>
          <FlashlightOff className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
          {screenSize === "mobile" ? "Torch" : "Torch Off"}
        </>
      )}
    </Button>
  );
};

export default TorchButton;
