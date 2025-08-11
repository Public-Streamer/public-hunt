import React, { useState, useEffect } from "react";
import {
  useLocalParticipant,
  useParticipants,
  useTracks,
} from "@livekit/components-react";
import { VideoTrackLazy, useLiveKitTrackSource } from "@/lib/livekitLazy";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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
  Edit,
  Check,
  X,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useStreamingControls } from "@/hooks/useStreamingControls";
import { useEventLiveStatus } from "@/hooks/useEventLiveStatus";
import StageShareMenu from "@/components/StageShareMenu";
import EventSharePanel from "@/components/EventSharePanel";
import { useScreenSize } from "@/hooks/use-mobile";
import { useMobileMediaPermissions } from "@/hooks/useMobileMediaPermissions";
import LiveStreamLogo from "@/components/ui/live-stream-logo";
import CameraSwitchButton from "@/components/CameraSwitchButton";
import TorchButton from "@/components/TorchButton";
import LiveChatSection from "@/components/LiveChatSection";
import { CoonhoundScorecardV2 } from "@/components/scorecard/CoonhoundScorecardV2";
import { CustomScoreboard } from "@/components/CustomScoreboard";
import { ScoreboardGameSelector } from "@/components/ScoreboardGameSelector";
import { PinnedMessageSection } from "@/components/PinnedMessageSection";
import EventProductionTeam from "@/components/EventProductionTeam";
import { useStreamName } from "@/hooks/useStreamName";
import { useScoreboardTeams } from "@/hooks/useScoreboardTeams";
import { useEventScoreboardMeta } from "@/hooks/useEventScoreboardMeta";
import InStreamChatOverlay from "./InStreamChatOverlay";

interface StreamerInterfaceProps {
  eventId: string;
  eventTitle: string;
  isLive: boolean;
  userRole?: "host" | "streamer";
  userId?: string;
  eventHostId?: string;
}

export const StreamerInterface: React.FC<StreamerInterfaceProps> = ({
  eventId,
  eventTitle,
  isLive,
  userRole,
  userId,
  eventHostId,
}) => {
  const { localParticipant } = useLocalParticipant();
  const participants = useParticipants();
  const controls = useStreamingControls(eventId);
  const screenSize = useScreenSize();
  const { checkScreenShareSupport } = useMobileMediaPermissions();
  const { toast } = useToast();

  const TrackSource = useLiveKitTrackSource();

  // Edit state management
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(eventTitle);
  const [isSaving, setIsSaving] = useState(false);

  const [isChatVisible, setIsChatVisible] = useState(false);

  // Stream name edit state
  const [isEditingStreamName, setIsEditingStreamName] = useState(false);
  const [streamNameValue, setStreamNameValue] = useState("");
  const [isSavingStreamName, setIsSavingStreamName] = useState(false);

  // livekit stream name
  const track = useTracks();
  const streamName = useStreamName(track[0]?.participant);

  // Real-time scoreboard metadata tracking
  const { selectedGameType: realtimeGameType, scoreboardName } =
    useEventScoreboardMeta(eventId);

  // Local state for game type (prioritize real-time data)
  const [localSelectedGameType, setLocalSelectedGameType] = useState<
    string | null
  >(null);
  const selectedGameType = realtimeGameType || localSelectedGameType;

  // Real-time team count tracking
  const { hasTeams: hasCustomTeams } = useScoreboardTeams(
    eventId,
    selectedGameType === "custom" ? "custom" : undefined
  );
  const { hasTeams: hasCoonHuntTeams } = useScoreboardTeams(
    eventId,
    selectedGameType === "coon_hunt" ? "coon_hunt" : undefined
  );

  // Legacy state (kept for compatibility)
  const [teams, setTeams] = useState<any[]>([]);
  const [loadingScoreboard, setLoadingScoreboard] = useState(true);

  // Judge permission (scorecard access)
  const [isJudge, setIsJudge] = useState(false);
  useEffect(() => {
    const checkJudge = async () => {
      try {
        if (!userId) return;
        const { data, error } = await supabase
          .from('event_streamers')
          .select('permissions')
          .eq('event_id', eventId)
          .eq('streamer_id', userId)
          .maybeSingle();
        if (!error && data?.permissions) {
          setIsJudge((data.permissions as string[]).includes('scorecard_judge'));
        } else {
          setIsJudge(false);
        }
      } catch (e) {
        setIsJudge(false);
      }
    };
    checkJudge();
  }, [eventId, userId]);

  const canManageScoreboard = userRole === 'host' || isJudge;
  const canSeeScoreboard = canManageScoreboard;

  // Load event metadata and selected game type
  const loadEventData = async () => {
    try {
      const { data: event, error } = await supabase
        .from("events")
        .select("metadata")
        .eq("id", eventId)
        .single();

      if (error) throw error;

      const gameType = (event?.metadata as any)?.selectedGameType;
      if (gameType) {
        setLocalSelectedGameType(gameType);
        // Load teams for this game type
        await fetchTeams(gameType);
      }
    } catch (error) {
      console.error("Error loading event data:", error);
    } finally {
      setLoadingScoreboard(false);
    }
  };

  // Fetch teams for the selected scoreboard type
  const fetchTeams = async (gameType?: string) => {
    const scoreboardType = gameType || selectedGameType;
    if (!scoreboardType) return;

    try {
      const response = await fetch(
        "https://zmfugicftfwvuudensdo.supabase.co/functions/v1/scoreboard-operations",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization:
              "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InptZnVnaWNmdGZ3dnV1ZGVuc2RvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwNjU2ODUsImV4cCI6MjA2NzY0MTY4NX0.J8CA_K_oxhcd2wlQf0KvEarwi0ejq0nBgAVMEhQlXE8",
          },
          body: JSON.stringify({
            action: "fetch",
            eventId,
            scoreboardType,
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        setTeams(data || []);
      }
    } catch (error) {
      console.error("Error fetching teams:", error);
    }
  };

  const viewerCount = controls.participantCount - 1;

  useEffect(() => {
    const updateViewerCount = async () => {
      try {
        const { error } = await supabase
          .from("events")
          .update({ viewer_count: viewerCount })
          .eq("id", eventId);
        if (error) throw error;
      } catch (error) {
        console.error("Error updating viewer count:", error);
      }
    };
    updateViewerCount();
  }, [viewerCount, eventId]);

  // Load event data on mount
  useEffect(() => {
    loadEventData();
  }, [eventId]);

  // Save selected game type to event metadata
  const saveGameTypeToEvent = async (gameType: string) => {
    try {
      const { error } = await supabase
        .from("events")
        .update({
          metadata: { selectedGameType: gameType },
        })
        .eq("id", eventId);

      if (error) throw error;
    } catch (error) {
      console.error("Error saving game type:", error);
      toast({
        title: "Error",
        description: "Failed to save scoreboard type",
        variant: "destructive",
      });
    }
  };

  // Handle game type selection
  const handleGameTypeSelect = async (gameType: string) => {
    setLocalSelectedGameType(gameType);
    saveGameTypeToEvent(gameType);
    setTeams([]); // Clear existing teams
    toast({
      title: "Success",
      description: "Scoreboard type selected successfully",
    });
  };

  // Delete entire scoreboard
  const handleDeleteScoreboard = async () => {
    if (!selectedGameType) return;

    try {
      const response = await fetch(
        "https://zmfugicftfwvuudensdo.supabase.co/functions/v1/scoreboard-operations",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization:
              "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InptZnVnaWNmdGZ3dnV1ZGVuc2RvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwNjU2ODUsImV4cCI6MjA2NzY0MTY4NX0.J8CA_K_oxhcd2wlQf0KvEarwi0ejq0nBgAVMEhQlXE8",
          },
          body: JSON.stringify({
            action: "deleteAll",
            eventId,
            scoreboardType: selectedGameType,
          }),
        }
      );

      if (response.ok) {
        // Clear metadata
        await supabase
          .from("events")
          .update({
            metadata: {},
          })
          .eq("id", eventId);

        setLocalSelectedGameType(null);
        setTeams([]);
        toast({
          title: "Success",
          description: "Scoreboard deleted successfully",
        });
      }
    } catch (error) {
      console.error("Error deleting scoreboard:", error);
      toast({
        title: "Error",
        description: "Failed to delete scoreboard",
        variant: "destructive",
      });
    }
  };

  // Edit handlers
  const handleEditClick = () => {
    setEditValue(eventTitle);
    setIsEditing(true);
  };

  const handleSaveClick = async () => {
    if (!editValue.trim()) {
      toast({
        title: "Error",
        description: "Event name cannot be empty",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("events")
        .update({ name: editValue.trim() })
        .eq("id", eventId);

      if (error) throw error;

      setIsEditing(false);
      toast({
        title: "Success",
        description: "Event name updated successfully",
      });
    } catch (error) {
      console.error("Error updating event name:", error);
      toast({
        title: "Error",
        description: "Failed to update event name",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelClick = () => {
    setEditValue(eventTitle);
    setIsEditing(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSaveClick();
    } else if (e.key === "Escape") {
      handleCancelClick();
    }
  };

  // Stream name edit handlers
  const handleEditStreamName = () => {
    const currentStreamName = localParticipant?.metadata
      ? JSON.parse(localParticipant.metadata).streamName || ""
      : "";
    setStreamNameValue(currentStreamName);
    setIsEditingStreamName(true);
  };

  // console.log(streamNameValue);

  const handleSaveStreamName = async () => {
    if (!localParticipant) return;

    setIsSavingStreamName(true);
    try {
      const currentMetadata = localParticipant.metadata
        ? JSON.parse(localParticipant.metadata)
        : {};
      const newMetadata = {
        ...currentMetadata,
        streamName: streamNameValue.trim() || undefined,
      };

      await localParticipant.setMetadata(JSON.stringify(newMetadata));
      setIsEditingStreamName(false);
      toast({
        title: "Success",
        description: "Stream name updated successfully",
      });
    } catch (error) {
      console.error("Error updating stream name:", error);
      toast({
        title: "Error",
        description: "Failed to update stream name",
        variant: "destructive",
      });
    } finally {
      setIsSavingStreamName(false);
    }
  };

  const handleCancelStreamName = () => {
    const currentStreamName = localParticipant?.metadata
      ? JSON.parse(localParticipant.metadata).streamName || ""
      : "";
    setStreamNameValue(currentStreamName);
    setIsEditingStreamName(false);
  };

  const handleStreamNameKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSaveStreamName();
    } else if (e.key === "Escape") {
      handleCancelStreamName();
    }
  };

  // Get local camera track
  const localCameraTracks = useTracks(TrackSource ? [TrackSource.Camera] : [], {
    onlySubscribed: false,
  });
  const localCameraTrack = localCameraTracks.find(
    (t) => t.participant === localParticipant
  );

  // Get other participants' camera tracks
  const otherCameraTracks = useTracks(TrackSource ? [TrackSource.Camera] : [], {
    onlySubscribed: true,
  }).filter((t) => t.participant !== localParticipant);

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
    <div className="min-h-screen bg-background py-2">
      <div className="container px-2 mx-auto space-y-3 sm:space-y-6 max-w-7xl">
        {/* Header */}
        <Card>
          <CardHeader className="p-3 ">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
              <div className="min-w-0 flex-1">
                <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                  <Video className="h-4 w-4 sm:h-5 sm:w-5 " />
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {isEditing ? (
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <Input
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onKeyDown={handleKeyPress}
                          className="text-sm sm:text-base h-8 min-w-0 flex-1"
                          autoFocus
                          disabled={isSaving}
                        />
                        <Button
                          size={
                            screenSize === "mobile" || screenSize === "tablet"
                              ? "xs"
                              : "sm"
                          }
                          onClick={handleSaveClick}
                          disabled={isSaving}
                          className="h-8 w-8 p-0"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          size={
                            screenSize === "mobile" || screenSize === "tablet"
                              ? "xs"
                              : "sm"
                          }
                          variant="outline"
                          onClick={handleCancelClick}
                          disabled={isSaving}
                          className="h-8 w-8 p-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <span className="truncate">
                          {editValue} - Streaming Controls
                        </span>

                        {userRole === "host" && (
                          <Button
                            size={
                              screenSize === "mobile" || screenSize === "tablet"
                                ? "xs"
                                : "sm"
                            }
                            variant="ghost"
                            onClick={handleEditClick}
                            className="h-8 w-8 p-0 ml-2"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </CardTitle>
              </div>

              <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
                {userRole === "host" && isEditing && (
                  <div>
                    <span className="text-xs text-muted-foreground flex items-center gap-2">
                      <AlertTriangle className="text-yellow-500 h-4 w-4" />
                      Changing the name will change the link of the stream
                    </span>
                  </div>
                )}
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
              <CardHeader className="p-3 sm:p-3">
                <div className="flex items-center justify-between">
                  {isEditingStreamName ? (
                    <div className="flex items-center gap-2 flex-1">
                      <Input
                        value={streamNameValue}
                        onChange={(e) => setStreamNameValue(e.target.value)}
                        onKeyDown={handleStreamNameKeyPress}
                        placeholder="Enter stream name (e.g., Camera 01)"
                        className="text-sm h-8 flex-1"
                        autoFocus
                        disabled={isSavingStreamName}
                      />
                      <Button
                        size={
                          screenSize === "mobile" || screenSize === "tablet"
                            ? "xs"
                            : "sm"
                        }
                        onClick={handleSaveStreamName}
                        disabled={isSavingStreamName}
                        className="h-8 w-8 p-0"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        size={
                          screenSize === "mobile" || screenSize === "tablet"
                            ? "xs"
                            : "sm"
                        }
                        variant="outline"
                        onClick={handleCancelStreamName}
                        disabled={isSavingStreamName}
                        className="h-8 w-8 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-sm sm:text-base">
                        {streamName}{" "}
                        <span className="text-xs text-muted-foreground">
                          (click to edit)
                        </span>
                      </CardTitle>
                      <Button
                        size={
                          screenSize === "mobile" || screenSize === "tablet"
                            ? "xs"
                            : "sm"
                        }
                        variant="ghost"
                        onClick={handleEditStreamName}
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>

              <CardContent className="p-3 sm:p-3">
                <div className=" aspect-video bg-muted rounded-lg overflow-hidden relative">
                  {localCameraTrack && controls.isVideoEnabled ? (
                    <VideoTrackLazy
                      trackRef={localCameraTrack as any}
                      className="w-full h-full"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-muted">
                      <div className="text-center">
                        <VideoOff className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                        <p className="text-muted-foreground">Camera is off</p>
                      </div>
                    </div>
                  )}

                  {/* In-Stream Chat Overlay */}
                  <InStreamChatOverlay
                    camName={streamName}
                    eventId={eventId}
                    isVisible={isChatVisible}
                    onVisibilityToggle={() => setIsChatVisible(!isChatVisible)}
                    eventHostId={eventHostId}
                  />

                  {/* Stream Status Overlay */}
                  <div className="absolute top-2 left-2">
                    {controls.isStreaming && (
                      <Badge className="bg-red-600 text-white text-xs">
                        <div className="w-1.5 h-1.5 bg-white rounded-full mr-1 animate-pulse" />
                        LIVE
                      </Badge>
                    )}
                  </div>

                  {/* Viewer Count */}
                  <div className="absolute top-2 right-2">
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
            {otherCameraTracks.length > 0 && (
              <Card>
                <CardHeader className="p-3 sm:p-3">
                  <CardTitle className="text-sm sm:text-base">
                    Other Streamers
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 sm:p-3">
                  <div
                    className={`grid gap-2 sm:gap-4 ${
                      screenSize === "mobile" ? "grid-cols-1" : "grid-cols-2"
                    }`}
                  >
                    {otherCameraTracks.map((trackRef) => (
                      <div
                        key={trackRef.participant.sid}
                        className="aspect-video bg-muted rounded-lg overflow-hidden relative"
                      >
                        <VideoTrackLazy
                          trackRef={trackRef as any}
                          className="w-full h-full"
                        />
                        <div className="absolute bottom-2 left-2">
                          <Badge variant="secondary" className="text-xs">
                            {(() => {
                              try {
                                const metadata = trackRef.participant.metadata
                                  ? JSON.parse(trackRef.participant.metadata)
                                  : {};
                                return (
                                  metadata.streamName ||
                                  trackRef.participant.name ||
                                  trackRef.participant.identity
                                );
                              } catch {
                                return (
                                  trackRef.participant.name ||
                                  trackRef.participant.identity
                                );
                              }
                            })()}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Pinned Message Section */}
            <PinnedMessageSection
              eventId={eventId}
              isHost={userRole === "host"}
            />

            {/* Scoreboard Section - Show for hosts (when creating or managing) and streamers (when teams exist) */}
            {canSeeScoreboard && (
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>
                      {canManageScoreboard ? " Leaderboard" : " Leaderboard"}
                    </CardTitle>
                    {canManageScoreboard && selectedGameType && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size={
                              screenSize === "mobile" || screenSize === "tablet"
                                ? "xs"
                                : "sm"
                            }
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Delete Scoreboard
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this scoreboard?
                              This will permanently remove all teams and scores.
                              This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={handleDeleteScoreboard}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete Scoreboard
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </CardHeader>
                  <CardContent>
                    {loadingScoreboard ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                        <p className="text-muted-foreground">
                          Loading scoreboard...
                        </p>
                      </div>
                    ) : !selectedGameType ? (
                      <div className="text-center py-8">
                        <div className="space-y-4">
                          <p className="text-muted-foreground">
                            Create a specialized scoreboard for your competition
                          </p>
                          <ScoreboardGameSelector
                            onGameSelect={handleGameTypeSelect}
                          />
                        </div>
                      </div>
                    ) : selectedGameType === "coon_hunt" ? (
                      <CoonhoundScorecardV2
                        eventId={eventId}
                        isHost={canManageScoreboard}
                      />
                    ) : selectedGameType === "custom" ? (
                      <CustomScoreboard
                        eventId={eventId}
                        isHost={canManageScoreboard}
                      />
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <p>This game type is not yet supported.</p>
                        {userRole === "host" && (
                          <Button
                            variant="outline"
                            onClick={() => setLocalSelectedGameType(null)}
                            className="mt-4"
                          >
                            Choose Different Game
                          </Button>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

            {/* Event Production Team - Only for hosts */}
            {userRole === "host" && <EventProductionTeam eventId={eventId} />}
          </div>

          {/* Controls Panel */}
          <div className="space-y-3 sm:space-y-4">
            {/* Stream Controls */}
            <Card>
              <CardHeader className="p-3 sm:p-3">
                <CardTitle className="text-sm sm:text-base">
                  Stream Controls
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-3">
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
                    <div className="space-y-2">
                      <Button
                        onClick={controls.stopStream}
                        variant="destructive"
                        className="w-full text-xs sm:text-sm"
                        size={screenSize === "mobile" ? "sm" : "lg"}
                      >
                        <Square className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                        Stop Stream (for you)
                      </Button>
                      {userRole === "host" && (
                        <Button
                          onClick={controls.stopEvent}
                          variant="destructive"
                          className="w-full text-xs sm:text-sm"
                          size={screenSize === "mobile" ? "sm" : "lg"}
                        >
                          <Square className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                          Stop Event (for all)
                        </Button>
                      )}
                    </div>
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

                  {/* Torch Button - Show in mobile layout */}
                  {screenSize === "mobile" && (
                    <TorchButton
                      isTorchEnabled={controls.isTorchEnabled}
                      isTorchSupported={controls.isTorchSupported}
                      currentFacingMode={controls.currentFacingMode}
                      isVideoEnabled={controls.isVideoEnabled}
                      onToggleTorch={controls.toggleTorch}
                    />
                  )}

                  {/* Screen Share Button - Only show if supported */}
                  {checkScreenShareSupport() && (
                    <Button
                      onClick={controls.toggleScreenShare}
                      variant={
                        controls.isScreenSharing ? "default" : "secondary"
                      }
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
                  )}
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

                {/* Torch Button - Show in desktop layout */}
                {screenSize !== "mobile" && (
                  <TorchButton
                    isTorchEnabled={controls.isTorchEnabled}
                    isTorchSupported={controls.isTorchSupported}
                    currentFacingMode={controls.currentFacingMode}
                    isVideoEnabled={controls.isVideoEnabled}
                    onToggleTorch={controls.toggleTorch}
                  />
                )}
              </CardContent>
            </Card>

            {/* Stream Info */}
            <Card>
              <CardHeader className="p-3 sm:p-3">
                <CardTitle className="text-sm sm:text-base">
                  Stream Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 p-3 sm:p-3">
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

            {/* Live Chat */}
            {/* <LiveChatSection eventId={eventId} /> */}

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
