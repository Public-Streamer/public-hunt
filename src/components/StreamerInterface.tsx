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
} from "lucide-react";
import { useStreamingControls } from "@/hooks/useStreamingControls";
import { useEventLiveStatus } from "@/hooks/useEventLiveStatus";
import StageShareMenu from "@/components/StageShareMenu";
import EventSharePanel from "@/components/EventSharePanel";

interface StreamerInterfaceProps {
  eventId: string;
  eventTitle: string;
  isLive: boolean;
  userRole?: "host" | "streamer";
}

export const StreamerInterface: React.FC<StreamerInterfaceProps> = ({
  eventId,
  eventTitle,
  isLive,
  userRole,
}) => {
  const { localParticipant } = useLocalParticipant();
  const participants = useParticipants();
  const controls = useStreamingControls(eventId);
  const { goLive } = controls;

  // Get local camera track
  const localCameraTracks = useTracks([Track.Source.Camera], {
    onlySubscribed: false,
  });
  const localCameraTrack = localCameraTracks.find(
    (t) => t.participant === localParticipant
  );

  // Get other participants' camera tracks
  const otherCameraTracks = useTracks([Track.Source.Camera], {
    onlySubscribed: true,
  }).filter((t) => t.participant !== localParticipant);

  // Update event live status based on camera tracks
  useEventLiveStatus({
    eventId,
    localCameraTrack,
    otherCameraTracks,
    currentIsLive: isLive,
    goLive,
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

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="container mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Video className="h-5 w-5" />
                  {eventTitle} - Streaming Controls
                </CardTitle>
              </div>
              <div className="flex items-center gap-4">
                <Badge variant={controls.isConnected ? "default" : "secondary"}>
                  {controls.isConnected ? "Connected" : "Disconnected"}
                </Badge>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  {controls.participantCount} participants
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Video Preview */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Your Stream Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="aspect-video bg-muted rounded-lg overflow-hidden relative">
                  {localCameraTrack && controls.isVideoEnabled ? (
                    <VideoTrack
                      trackRef={localCameraTrack}
                      style={{ width: "100%", height: "100%" }}
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-muted">
                      <div className="text-center">
                        <VideoOff className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                        <p className="text-muted-foreground">Camera is off</p>
                      </div>
                    </div>
                  )}

                  {/* Stream Status Overlay */}
                  <div className="absolute top-4 left-4">
                    {controls.isStreaming && (
                      <Badge className="bg-red-600 text-white">
                        <div className="w-2 h-2 bg-white rounded-full mr-1 animate-pulse" />
                        LIVE
                      </Badge>
                    )}
                  </div>

                  {/* Viewer Count */}
                  <div className="absolute top-4 right-4">
                    <Badge
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      <Eye className="h-3 w-3" />
                      {controls.participantCount - 1}{" "}
                      {/* Exclude self from viewer count */}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Other Participants */}
            {otherCameraTracks.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Other Streamers</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    {otherCameraTracks.map((trackRef) => (
                      <div
                        key={trackRef.participant.sid}
                        className="aspect-video bg-muted rounded-lg overflow-hidden relative"
                      >
                        <VideoTrack
                          trackRef={trackRef}
                          style={{ width: "100%", height: "100%" }}
                        />
                        <div className="absolute bottom-2 left-2">
                          <Badge variant="secondary" className="text-xs">
                            {trackRef.participant.name ||
                              trackRef.participant.identity}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Controls Panel */}
          <div className="space-y-4">
            {/* Stream Controls */}
            <Card>
              <CardHeader>
                <CardTitle>Stream Controls</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Go Live / Stop Stream */}
                <div className="space-y-2">
                  {!controls.isStreaming ? (
                    <Button
                      onClick={controls.startStream}
                      className="w-full"
                      size="lg"
                      disabled={!controls.isConnected}
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Go Live
                    </Button>
                  ) : (
                    <Button
                      onClick={controls.stopStream}
                      variant="destructive"
                      className="w-full"
                      size="lg"
                    >
                      <Square className="h-4 w-4 mr-2" />
                      Stop Stream
                    </Button>
                  )}
                </div>

                <Separator />

                {/* Media Controls */}
                <div className="space-y-2">
                  <Button
                    onClick={controls.toggleVideo}
                    variant={controls.isVideoEnabled ? "default" : "secondary"}
                    className="w-full"
                  >
                    {controls.isVideoEnabled ? (
                      <>
                        <Video className="h-4 w-4 mr-2" />
                        Camera On
                      </>
                    ) : (
                      <>
                        <VideoOff className="h-4 w-4 mr-2" />
                        Camera Off
                      </>
                    )}
                  </Button>

                  <Button
                    onClick={controls.toggleAudio}
                    variant={controls.isAudioEnabled ? "default" : "secondary"}
                    className="w-full"
                  >
                    {controls.isAudioEnabled ? (
                      <>
                        <Mic className="h-4 w-4 mr-2" />
                        Mic On
                      </>
                    ) : (
                      <>
                        <MicOff className="h-4 w-4 mr-2" />
                        Mic Off
                      </>
                    )}
                  </Button>

                  <Button
                    onClick={controls.toggleScreenShare}
                    variant={controls.isScreenSharing ? "default" : "secondary"}
                    className="w-full"
                  >
                    {controls.isScreenSharing ? (
                      <>
                        <Monitor className="h-4 w-4 mr-2" />
                        Stop Sharing
                      </>
                    ) : (
                      <>
                        <MonitorOff className="h-4 w-4 mr-2" />
                        Share Screen
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Stream Info */}
            <Card>
              <CardHeader>
                <CardTitle>Stream Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Status:</span>
                  <span className="text-sm font-medium">
                    {controls.isStreaming ? "Live" : "Offline"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Viewers:
                  </span>
                  <span className="text-sm font-medium">
                    {Math.max(0, controls.participantCount - 1)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Connection:
                  </span>
                  <span className="text-sm font-medium">
                    {controls.isConnected ? "Connected" : "Disconnected"}
                  </span>
                </div>
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
