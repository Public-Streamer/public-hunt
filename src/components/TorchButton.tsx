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

  // Only show if back camera is active, video is enabled, and torch is supported
  if (
    currentFacingMode !== "environment" ||
    !isVideoEnabled ||
    !isTorchSupported
  ) {
    return null;
  }

  return (
    <Button
      onClick={onToggleTorch}
      variant={isTorchEnabled ? "default" : "secondary"}
      className="w-full text-xs sm:text-sm"
      size={"sm"}
    >
      {isTorchEnabled ? (
        <>
          <Flashlight className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
          {"Torch On"}
        </>
      ) : (
        <>
          <FlashlightOff className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
          {"Torch Off"}
        </>
      )}
    </Button>
  );
};

export default TorchButton;
