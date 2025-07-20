import React from "react";
import {
  VideoTrack,
  AudioTrack,
  useLocalParticipant,
  useParticipants,
  useTracks,
} from "@livekit/components-react";
import { Track } from "livekit-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Monitor,
  MonitorOff,
  Play,
  Square,
  Users,
  Eye,
  ScreenShare,
} from "lucide-react";
import { useStreamingControls } from "@/hooks/useStreamingControls";
import { useEventLiveStatus } from "@/hooks/useEventLiveStatus";
import StageShareMenu from "@/components/StageShareMenu";
import EventSharePanel from "@/components/EventSharePanel";
import { useScreenSize } from "@/hooks/use-mobile";
import LiveStreamLogo from "@/components/ui/live-stream-logo";
import CameraSwitchButton from "@/components/CameraSwitchButton";

interface StreamerInterfaceProps {
  eventId: string;
  eventTitle: string;
  isLive: boolean;
  userRole?: "host" | "streamer";
  userId?: string;
}

export const StreamerInterface: React.FC<StreamerInterfaceProps> = ({
  eventId,
  eventTitle,
  isLive,
  userRole,
  userId,
}) => {
  const { localParticipant } = useLocalParticipant();
  const participants = useParticipants();
  const controls = useStreamingControls(eventId);
  const screenSize = useScreenSize();

  // Get local camera track
  const localCameraTracks = useTracks([Track.Source.Camera], {
    onlySubscribed: false,
  });
  const localCameraTrack = localCameraTracks.find(
    (t) => t.participant === localParticipant
  );

  // Get local screen share track
  const localScreenTracks = useTracks([Track.Source.ScreenShare], {
    onlySubscribed: false,
  });
  const localScreenTrack = localScreenTracks.find(
    (t) => t.participant === localParticipant
  );

  // Get other participants' tracks
  const otherCameraTracks = useTracks([Track.Source.Camera], {
    onlySubscribed: true,
  }).filter((t) => t.participant !== localParticipant);

  const otherScreenTracks = useTracks([Track.Source.ScreenShare], {
    onlySubscribed: true,
  }).filter((t) => t.participant !== localParticipant);

  // Combine other participants' tracks
  const otherTracks = [...otherCameraTracks, ...otherScreenTracks];

  // Debug logging
  console.log("🎬 STREAMER INTERFACE - Track Status:", {
    localCamera: {
      exists: !!localCameraTrack,
      enabled: controls.isVideoEnabled,
      trackEnabled: localCameraTrack?.publication.isEnabled
    },
    localScreenShare: {
      exists: !!localScreenTrack,
      enabled: controls.isScreenSharing,
      trackEnabled: localScreenTrack?.publication.isEnabled
    },
    otherParticipants: otherTracks.length,
    isStreaming: controls.isStreaming
  });

  if (!localParticipant) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Initializing stream...</p>
        </div>
      </div>
    );
  }

  // Determine what to show in the main preview
  const getMainPreviewContent = () => {
    // Priority: Screen share > Camera > Placeholder
    if (localScreenTrack && controls.isScreenSharing) {
      console.log("🎬 STREAMER INTERFACE - Showing screen share in preview");
      return (
        <VideoTrack
          trackRef={localScreenTrack}
          style={{ width: "100%", height: "100%" }}
        />
      );
    } else if (localCameraTrack && controls.isVideoEnabled) {
      console.log("🎬 STREAMER INTERFACE - Showing camera in preview");
      return (
        <VideoTrack
          trackRef={localCameraTrack}
          style={{ width: "100%", height: "100%" }}
        />
      );
    } else {
      console.log("🎬 STREAMER INTERFACE - Showing placeholder in preview");
      return (
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          <div className="text-center">
            <VideoOff className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">
              {controls.isScreenSharing ? "Screen sharing..." : "Camera is off"}
            </p>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="min-h-screen bg-background p-2 sm:p-4">
      <div className="container mx-auto space-y-3 sm:space-y-6 max-w-7xl">
        {/* Header */}
        <Card>
          <CardHeader className="p-3 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
              <div className="min-w-0 flex-1">
                <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                  <Video className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                  <span className="truncate">
                    {screenSize === "mobile"
                      ? "Streaming"
                      : `${eventTitle} - Streaming Controls`}
                  </span>
                </CardTitle>
              </div>
              <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
                <Badge
                  variant={controls.isConnected ? "default" : "secondary"}
                  className="text-xs"
                >
                  {controls.isConnected ? "Connected" : "Disconnected"}
                </Badge>
                <div className="flex items-center gap-1 text-xs sm:text-sm text-muted-foreground">
                  <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span>
                    {controls.participantCount}{" "}
                    {screenSize === "mobile" ? "" : "participants"}
                  </span>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        <div
          className={`grid gap-3 sm:gap-6 ${
            screenSize === "desktop" ? "lg:grid-cols-3" : "grid-cols-1"
          }`}
        >
          {/* Video Preview */}
          <div
            className={`space-y-3 sm:space-y-4 ${
              screenSize === "desktop" ? "lg:col-span-2" : ""
            }`}
          >
            <Card>
              <CardHeader className="p-3 sm:p-6">
                <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                  {controls.isScreenSharing ? (
                    <>
                      <ScreenShare className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                      Your Screen Share Preview
                    </>
                  ) : (
                    <>
                      <Video className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                      Your Stream Preview
                    </>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-6">
                <div className="aspect-video bg-muted rounded-lg overflow-hidden relative">
                  {getMainPreviewContent()}

                  {/* Stream Status Overlay */}
                  <div className="absolute top-2 left-2">
                    {controls.isStreaming && (
                      <Badge className="bg-red-600 text-white text-xs">
                        <div className="w-1.5 h-1.5 bg-white rounded-full mr-1 animate-pulse" />
                        LIVE
                      </Badge>
                    )}
                  </div>

                  {/* Track Type Indicator */}
                  <div className="absolute top-2 right-2">
                    <div className="flex items-center gap-2">
                      {controls.isScreenSharing && (
                        <Badge variant="secondary" className="flex items-center gap-1 text-xs">
                          <ScreenShare className="h-3 w-3" />
                          Screen
                        </Badge>
                      )}
                      {controls.isVideoEnabled && (
                        <Badge variant="secondary" className="flex items-center gap-1 text-xs">
                          <Video className="h-3 w-3" />
                          Camera
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Viewer Count */}
                  <div className="absolute bottom-2 right-2">
                    <Badge
                      variant="secondary"
                      className="flex items-center gap-1 text-xs"
                    >
                      <Eye className="h-3 w-3" />
                      {controls.participantCount - 1}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Other Participants */}
            {otherTracks.length > 0 && (
              <Card>
                <CardHeader className="p-3 sm:p-6">
                  <CardTitle className="text-sm sm:text-base">
                    Other Streamers
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 sm:p-6">
                  <div
                    className={`grid gap-2 sm:gap-4 ${
                      screenSize === "mobile" ? "grid-cols-1" : "grid-cols-2"
                    }`}
                  >
                    {otherTracks.map((trackRef) => (
                      <div
                        key={trackRef.participant.sid + trackRef.publication.source}
                        className="aspect-video bg-muted rounded-lg overflow-hidden relative"
                      >
                        <VideoTrack
                          trackRef={trackRef}
                          style={{ width: "100%", height: "100%" }}
                        />
                        <div className="absolute bottom-2 left-2">
                          <Badge variant="secondary" className="text-xs">
                            {trackRef.participant.name || trackRef.participant.identity}
                            {trackRef.publication.source === Track.Source.ScreenShare && ' (Screen)'}
                          </Badge>
                        </div>
                        {trackRef.publication.source === Track.Source.ScreenShare && (
                          <div className="absolute top-2 left-2">
                            <Badge className="bg-blue-600 text-white text-xs">
                              <ScreenShare className="h-3 w-3 mr-1" />
                              SCREEN
                            </Badge>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Controls Panel */}
          <div className="space-y-3 sm:space-y-4">
            {/* Stream Controls */}
            <Card>
              <CardHeader className="p-3 sm:p-6">
                <CardTitle className="text-sm sm:text-base">
                  Stream Controls
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-6">
                {/* Go Live / Stop Stream */}
                <div className="space-y-2">
                  {!controls.isStreaming ? (
                    <Button
                      onClick={controls.startStream}
                      className="w-full text-sm sm:text-base px-3 sm:px-4 py-3 sm:py-4 max-w-full"
                      size={screenSize === "mobile" ? "sm" : "lg"}
                      disabled={!controls.isConnected}
                    >
                      <LiveStreamLogo
                        size="md"
                        className="mr-1 flex-shrink-0"
                      />
                      <Play className="h-4 w-4 sm:h-4 sm:w-4 md:h-5 md:w-5 mr-1 sm:mr-2 flex-shrink-0" />
                      <span className="truncate">Go Live</span>
                    </Button>
                  ) : (
                    <Button
                      onClick={controls.stopStream}
                      variant="destructive"
                      className="w-full text-xs sm:text-sm"
                      size={screenSize === "mobile" ? "sm" : "lg"}
                    >
                      <Square className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                      Stop Stream
                    </Button>
                  )}
                </div>

                <Separator />

                {/* Media Controls */}
                <div
                  className={`space-y-2 ${
                    screenSize === "mobile"
                      ? "grid grid-cols-2 gap-2 space-y-0"
                      : ""
                  }`}
                >
                  <Button
                    onClick={controls.toggleVideo}
                    variant={controls.isVideoEnabled ? "default" : "secondary"}
                    className="w-full text-xs sm:text-sm"
                    size={screenSize === "mobile" ? "sm" : "default"}
                  >
                    {controls.isVideoEnabled ? (
                      <>
                        <Video className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                        {screenSize === "mobile" ? "Cam" : "Camera On"}
                      </>
                    ) : (
                      <>
                        <VideoOff className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                        {screenSize === "mobile" ? "Cam" : "Camera Off"}
                      </>
                    )}
                  </Button>

                  <Button
                    onClick={controls.toggleAudio}
                    variant={controls.isAudioEnabled ? "default" : "secondary"}
                    className="w-full text-xs sm:text-sm"
                    size={screenSize === "mobile" ? "sm" : "default"}
                  >
                    {controls.isAudioEnabled ? (
                      <>
                        <Mic className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                        {screenSize === "mobile" ? "Mic" : "Mic On"}
                      </>
                    ) : (
                      <>
                        <MicOff className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                        {screenSize === "mobile" ? "Mic" : "Mic Off"}
                      </>
                    )}
                  </Button>

                  {/* Camera Switch Button - Show in mobile layout */}
                  {screenSize === "mobile" && (
                    <CameraSwitchButton
                      availableCameras={controls.availableCameras}
                      isSwitchingCamera={controls.isSwitchingCamera}
                      isVideoEnabled={controls.isVideoEnabled}
                      currentFacingMode={controls.currentFacingMode}
                      onSwitchCamera={controls.switchCamera}
                    />
                  )}

                  <Button
                    onClick={controls.toggleScreenShare}
                    variant={controls.isScreenSharing ? "default" : "secondary"}
                    className={`w-full text-xs sm:text-sm ${
                      screenSize === "mobile" ? "col-span-1" : ""
                    }`}
                    size={screenSize === "mobile" ? "sm" : "default"}
                  >
                    {controls.isScreenSharing ? (
                      <>
                        <Monitor className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                        {screenSize === "mobile"
                          ? "Stop Share"
                          : "Stop Sharing"}
                      </>
                    ) : (
                      <>
                        <MonitorOff className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                        {screenSize === "mobile" ? "Share" : "Share Screen"}
                      </>
                    )}
                  </Button>
                </div>

                {/* Camera Switch Button - Show in desktop layout */}
                {screenSize !== "mobile" && (
                  <CameraSwitchButton
                    availableCameras={controls.availableCameras}
                    isSwitchingCamera={controls.isSwitchingCamera}
                    isVideoEnabled={controls.isVideoEnabled}
                    currentFacingMode={controls.currentFacingMode}
                    onSwitchCamera={controls.switchCamera}
                  />
                )}
              </CardContent>
            </Card>

            {/* Stream Info */}
            <Card>
              <CardHeader className="p-3 sm:p-6">
                <CardTitle className="text-sm sm:text-base">
                  Stream Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 p-3 sm:p-6">
                <div className="flex justify-between">
                  <span className="text-xs sm:text-sm text-muted-foreground">
                    Status:
                  </span>
                  <span className="text-xs sm:text-sm font-medium">
                    {controls.isStreaming ? "Live" : "Offline"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs sm:text-sm text-muted-foreground">
                    Viewers:
                  </span>
                  <span className="text-xs sm:text-sm font-medium">
                    {Math.max(0, controls.participantCount - 1)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs sm:text-sm text-muted-foreground">
                    Connection:
                  </span>
                  <span className="text-xs sm:text-sm font-medium">
                    {controls.isConnected ? "Connected" : "Disconnected"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs sm:text-sm text-muted-foreground">
                    Active Tracks:
                  </span>
                  <span className="text-xs sm:text-sm font-medium">
                    {[
                      controls.isVideoEnabled && "Camera",
                      controls.isScreenSharing && "Screen",
                      controls.isAudioEnabled && "Audio"
                    ].filter(Boolean).join(", ") || "None"}
                  </span>
                </div>
                {controls.availableCameras.length > 1 && (
                  <div className="flex justify-between">
                    <span className="text-xs sm:text-sm text-muted-foreground">
                      Cameras:
                    </span>
                    <span className="text-xs sm:text-sm font-medium">
                      {controls.availableCameras.length} available
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Stage Share Menu - Only for hosts */}
            {userRole === "host" && (
              <StageShareMenu eventId={eventId} eventTitle={eventTitle} />
            )}

            {/* Event Share Panel - Only for hosts */}
            {userRole === "host" && (
              <EventSharePanel eventId={eventId} eventTitle={eventTitle} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
