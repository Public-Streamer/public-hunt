import React, { useState, useEffect, useMemo, useRef } from "react";
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
  Lock,
  Unlock,
} from "lucide-react";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { useToast } from "@/hooks/use-toast";
import { useStreamingControls } from "@/hooks/useStreamingControls";
import StageShareMenu from "@/components/StageShareMenu";
import EventSharePanel from "@/components/EventSharePanel";
import { useScreenSize } from "@/hooks/use-mobile";
import { useMobileMediaPermissions } from "@/hooks/useMobileMediaPermissions";
import LiveStreamLogo from "@/components/ui/live-stream-logo";
import TooltipWrapper from "@/components/ui/tooltip-wrapper";
import CameraSwitchButton from "@/components/CameraSwitchButton";
import TorchButton from "@/components/TorchButton";
import { CoonhoundScorecardV2 } from "@/components/scorecard/CoonhoundScorecardV2";
import { CustomScoreboard } from "@/components/CustomScoreboard";
import { ScoreboardGameSelector } from "@/components/ScoreboardGameSelector";
import { PinnedMessageSection } from "@/components/PinnedMessageSection";
import EventProductionTeam from "@/components/EventProductionTeam";
import { useScoreboardTeams } from "@/hooks/useScoreboardTeams";
import { useEventScoreboardMeta } from "@/hooks/useEventScoreboardMeta";
import InStreamChatOverlay from "./InStreamChatOverlay";
import { EventSocialSection } from "./EventSocialSection";
import { StreamNameEditor } from "@/components/StreamNameEditor";

interface StreamerInterfaceProps {
  eventId: string;
  eventTitle: string;
  isLive: boolean;
  userRole?: "host" | "streamer";
  userId?: string;
  eventHostId?: string;
  streamId?: string;
  autoGoLive?: boolean;
  generateToken: () => Promise<string>;
}

export const StreamerInterface: React.FC<StreamerInterfaceProps> = ({
  eventId,
  eventTitle,
  isLive,
  userRole,
  userId,
  eventHostId,
  streamId,
  autoGoLive,
  generateToken,
}) => {
  const { localParticipant } = useLocalParticipant();
  const participants = useParticipants();
  const controls = useStreamingControls(eventId, generateToken);
  const screenSize = useScreenSize();
  const { checkScreenShareSupport } = useMobileMediaPermissions();
  const { toast } = useToast();

  const TrackSource = useLiveKitTrackSource();

  // ----- Title edit state -----
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(eventTitle);
  const [isSaving, setIsSaving] = useState(false);

  const [isChatVisible, setIsChatVisible] = useState(false);

  // ===== Stream name: managed by StreamNameEditor component

  // Prevent accidental stop: lock stop button
  const [controlsLocked, setControlsLocked] = useState(false);
  const prevIsStreamingRef = useRef(controls.isStreaming);
  useEffect(() => {
    if (!prevIsStreamingRef.current && controls.isStreaming)
      setControlsLocked(true);
    if (prevIsStreamingRef.current && !controls.isStreaming)
      setControlsLocked(false);
    prevIsStreamingRef.current = controls.isStreaming;
  }, [controls.isStreaming]);

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
        const supabase = supabaseBrowser();

        // event_participants (new)
        const { data: participantData, error: participantError } =
          await supabase
            .from("event_participants")
            .select("permissions")
            .eq("event_id", eventId)
            .eq("user_id", userId)
            .maybeSingle();

        if (!participantError && participantData?.permissions) {
          const hasJudgePermission = (
            participantData.permissions as string[]
          ).includes("scorecard_judge");
          setIsJudge(hasJudgePermission);
          return;
        }

        // event_streamers (legacy)
        const { data: streamerData, error: streamerError } = await supabase
          .from("event_streamers")
          .select("permissions")
          .eq("event_id", eventId)
          .eq("streamer_id", userId)
          .maybeSingle();

        if (!streamerError && streamerData?.permissions) {
          const hasJudgePermission = (
            streamerData.permissions as string[]
          ).includes("scorecard_judge");
          setIsJudge(hasJudgePermission);
        } else {
          setIsJudge(false);
        }
      } catch {
        setIsJudge(false);
      }
    };
    checkJudge();
  }, [eventId, userId]);

  // Permission logic
  const isEventCreator = userRole === "host";
  const isStreamerWithJudgePermissions = userRole === "streamer" && isJudge;
  const canEdit = isEventCreator || isStreamerWithJudgePermissions;
  const canManageScoreboard = canEdit;
  const canSeeScoreboard = canManageScoreboard || !!selectedGameType;

  // Realtime permission updates
  useEffect(() => {
    if (!eventId || !userId) return;

    const supabase = supabaseBrowser();
    const participantsChannel = supabase
      .channel(`judge-perms-participants-${eventId}-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "event_participants",
          filter: `event_id=eq.${eventId}`,
        },
        (payload) => {
          const row: any = payload.new;
          if (row.user_id === userId) {
            const perms = (row.permissions || []) as string[];
            setIsJudge(perms.includes("scorecard_judge"));
          }
        }
      )
      .subscribe();

    const streamersChannel = supabase
      .channel(`judge-perms-streamers-${eventId}-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "event_streamers",
          filter: `event_id=eq.${eventId}`,
        },
        (payload) => {
          const row: any = payload.new;
          if (row.streamer_id === userId) {
            const perms = (row.permissions || []) as string[];
            setIsJudge(perms.includes("scorecard_judge"));
          }
        }
      )
      .subscribe();

    return () => {
      participantsChannel.unsubscribe();
      streamersChannel.unsubscribe();
    };
  }, [eventId, userId]);

  // Load event metadata and selected game type
  const loadEventData = async () => {
    try {
      const supabase = supabaseBrowser();
      const { data: event, error } = await supabase
        .from("events")
        .select("metadata")
        .eq("id", eventId)
        .single();

      if (error) throw error;

      const gameType = (event?.metadata as any)?.selectedGameType;
      if (gameType) {
        setLocalSelectedGameType(gameType);
        await fetchTeams(gameType);
      }
    } catch (error) {
      console.error("Error loading event data:", error);
    } finally {
      setLoadingScoreboard(false);
    }
  };

  // Fetch teams
  const fetchTeams = async (gameType?: string) => {
    const scoreboardType = gameType || selectedGameType;
    if (!scoreboardType) return;

    try {
      const supabase = supabaseBrowser();
      const { data, error } = await supabase.functions.invoke(
        "scoreboard-operations",
        {
          body: { action: "fetch", eventId, scoreboardType },
        }
      );
      if (error) throw error;
      setTeams(Array.isArray(data) ? data : (data as any)?.teams || []);
    } catch (error) {
      console.error("Error fetching teams:", error);
    }
  };

  const viewerCount = controls.participantCount - 1;
  useEffect(() => {
    const updateViewerCount = async () => {
      try {
        const supabase = supabaseBrowser();
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

  useEffect(() => {
    loadEventData();
  }, [eventId]);

  // Save selected game type to event metadata
  const saveGameTypeToEvent = async (gameType: string) => {
    try {
      const supabase = supabaseBrowser();
      const { error } = await supabase
        .from("events")
        .update({ metadata: { selectedGameType: gameType } })
        .eq("id", eventId);
      if (error) throw error;
    } catch (error) {
      console.error("Error saving scoreboard type", error);
      toast({
        title: "Error",
        description: "Failed to save scoreboard type",
        variant: "destructive",
      });
    }
  };

  const handleGameTypeSelect = async (gameType: string) => {
    setLocalSelectedGameType(gameType);
    saveGameTypeToEvent(gameType);
    setTeams([]);
    toast({
      title: "Success",
      description: "Scoreboard type selected successfully",
    });
  };

  const handleDeleteScoreboard = async () => {
    if (!selectedGameType) return;
    try {
      const supabase = supabaseBrowser();
      const { error: fnError } = await supabase.functions.invoke(
        "scoreboard-operations",
        {
          body: {
            action: "deleteAll",
            eventId,
            scoreboardType: selectedGameType,
          },
        }
      );
      if (fnError) throw fnError;

      await supabase.from("events").update({ metadata: {} }).eq("id", eventId);

      setLocalSelectedGameType(null);
      setTeams([]);
      toast({
        title: "Success",
        description: "Scoreboard deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting scoreboard:", error);
      toast({
        title: "Error",
        description: "Failed to delete scoreboard",
        variant: "destructive",
      });
    }
  };

  // ----- Title handlers -----
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
      const supabase = supabaseBrowser();
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
    if (e.key === "Enter") handleSaveClick();
    else if (e.key === "Escape") handleCancelClick();
  };

  // Get local camera track
  const localCameraTracks = useTracks(TrackSource ? [TrackSource.Camera] : [], {
    onlySubscribed: false,
  });
  const localCameraTrack = localCameraTracks.find(
    (t) => t.participant === localParticipant
  );

  // Other participants' camera tracks
  const otherCameraTracks = useTracks(TrackSource ? [TrackSource.Camera] : [], {
    onlySubscribed: true,
  }).filter((t) => t.participant !== localParticipant);

  const totalTracksLength = useMemo(
    () => localCameraTracks.length + otherCameraTracks.length,
    [localCameraTracks, otherCameraTracks]
  );

  // Auto start stream when ready
  const autoStartAttemptedRef = useRef(false);
  useEffect(() => {
    const allowedRole = userRole === "host" || userRole === "streamer";
    if (
      autoGoLive &&
      allowedRole &&
      controls.isConnected &&
      !controls.isStreaming &&
      !controls.controlsLoading &&
      !autoStartAttemptedRef.current
    ) {
      autoStartAttemptedRef.current = true;
      try {
        controls.startStream(totalTracksLength);
      } catch {
        autoStartAttemptedRef.current = false;
      }
    }
  }, [autoGoLive, userRole, controls, totalTracksLength]);

  // Heartbeat for active streamer
  useEffect(() => {
    if (!eventId || !userId || !streamId) return;

    let cancelled = false;
    const sendHeartbeat = async () => {
      try {
        if (cancelled) return;
        const supabase = supabaseBrowser();
        await supabase
          .from("event_streams")
          .update({
            is_active: true,
            updated_at: new Date().toISOString(),
            streamer_counts: totalTracksLength,
          })
          .eq("id", streamId);
      } catch (err) {
        console.error("error in heartbeat ", err);
      }
    };
    sendHeartbeat();
    const interval = setInterval(sendHeartbeat, 20000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [eventId, userId, totalTracksLength, streamId]);

  if (!localParticipant) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
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

        {/* Judge Editing Enabled Badge */}
        {canEdit && selectedGameType && (
          <div className="flex justify-center sm:justify-end">
            <TooltipWrapper content="You have full editing rights for all team boxes in this event.">
              <Badge
                variant="default"
                className="bg-green-600 hover:bg-green-700 text-white font-bold px-3 py-1 text-sm shadow-lg border-green-500"
              >
                Judge Editing Enabled
              </Badge>
            </TooltipWrapper>
          </div>
        )}

        <div
          className={`grid gap-3 sm:gap-6 ${
            screenSize === "desktop" ? "lg:grid-cols-3" : "grid-cols-1"
          }`}
        >
          {/* Video & Controls Column */}
          <div
            className={`space-y-3 sm:space-y-4 ${
              screenSize === "desktop" ? "lg:col-span-2" : ""
            }`}
          >
            <Card>
              <CardHeader className="p-3 sm:p-3">
                <StreamNameEditor
                  eventId={eventId}
                  userId={userId}
                  participant={localParticipant ?? undefined}
                  placeholder="Enter stream name (e.g., Camera 01)"
                />
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
                    camName="Stream" // Use generic name since we can't easily access the current stream name here
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

            {/* Stream Controls */}
            <Card>
              <CardHeader className="p-3 sm:p-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm sm:text-base">
                    Stream Controls
                  </CardTitle>
                  {controls.isStreaming && (
                    <TooltipWrapper
                      content={
                        controlsLocked
                          ? "Unlock to modify stream controls"
                          : "Lock to prevent changes"
                      }
                    >
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setControlsLocked(!controlsLocked)}
                        aria-pressed={controlsLocked}
                        className="ml-2"
                      >
                        {controlsLocked ? (
                          <Lock className="h-4 w-4 mr-1" />
                        ) : (
                          <Unlock className="h-4 w-4 mr-1" />
                        )}
                        {controlsLocked ? "Locked" : "Unlock"}
                      </Button>
                    </TooltipWrapper>
                  )}
                </div>
              </CardHeader>
              <CardContent
                className={`space-y-3 sm:space-y-4 p-3 sm:p-3 ${
                  controlsLocked ? "pointer-events-none opacity-60" : ""
                }`}
              >
                {/* Go Live / Stop Stream */}
                <div className="space-y-2">
                  {!controls.isStreaming ? (
                    <Button
                      onClick={() => controls.startStream(totalTracksLength)}
                      className="w-full text-sm sm:text-base px-3 sm:px-4 py-3 sm:py-4 max-w-full"
                      size={screenSize === "mobile" ? "sm" : "lg"}
                      disabled={!controls.isConnected}
                    >
                      <LiveStreamLogo
                        size="md"
                        className="mr-1 flex-shrink-0"
                      />
                      <Play className="h-4 w-4 sm:h-4 sm:w-4 md:h-5 md:w-5 mr-1 sm:mr-2 flex-shrink-0" />
                      {controls.controlsLoading ? (
                        <span className="animate-pulse">Starting...</span>
                      ) : (
                        <span>Go Live</span>
                      )}
                    </Button>
                  ) : (
                    <div className="space-y-2">
                      <TooltipWrapper
                        content={
                          controlsLocked
                            ? "Controls locked — unlock to stop your stream"
                            : "Stop your personal stream"
                        }
                      >
                        <span className="block w-full">
                          <Button
                            onClick={controls.stopStream}
                            variant="destructive"
                            className="w-full text-xs sm:text-sm"
                            size={screenSize === "mobile" ? "sm" : "lg"}
                            disabled={
                              controlsLocked || controls.controlsLoading
                            }
                          >
                            <Square className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                            {controls.controlsLoading ? (
                              <span className="animate-pulse">Stopping...</span>
                            ) : (
                              <span>Stop Stream (for you)</span>
                            )}
                          </Button>
                        </span>
                      </TooltipWrapper>
                      {userRole === "host" && (
                        <Button
                          onClick={controls.stopEvent}
                          variant="destructive"
                          className="w-full text-xs sm:text-sm"
                          size={screenSize === "mobile" ? "sm" : "lg"}
                          disabled={controlsLocked || controls.controlsLoading}
                        >
                          <Square className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                          {controls.controlsLoading ? (
                            <span className="animate-pulse">Stopping...</span>
                          ) : (
                            <span>Stop Event (for all)</span>
                          )}
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

                  {/* Camera Switch (mobile) */}
                  {screenSize === "mobile" && (
                    <CameraSwitchButton
                      availableCameras={controls.availableCameras}
                      isSwitchingCamera={controls.isSwitchingCamera}
                      isVideoEnabled={controls.isVideoEnabled}
                      currentFacingMode={controls.currentFacingMode}
                      onSwitchCamera={controls.switchCamera}
                    />
                  )}

                  {/* Torch (mobile) */}
                  {screenSize === "mobile" && (
                    <TorchButton
                      isTorchEnabled={controls.isTorchEnabled}
                      isTorchSupported={controls.isTorchSupported}
                      currentFacingMode={controls.currentFacingMode}
                      isVideoEnabled={controls.isVideoEnabled}
                      onToggleTorch={controls.toggleTorch}
                    />
                  )}

                  {/* Screen Share */}
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

                {/* Camera Switch (desktop) */}
                {screenSize !== "mobile" && (
                  <CameraSwitchButton
                    availableCameras={controls.availableCameras}
                    isSwitchingCamera={controls.isSwitchingCamera}
                    isVideoEnabled={controls.isVideoEnabled}
                    currentFacingMode={controls.currentFacingMode}
                    onSwitchCamera={controls.switchCamera}
                  />
                )}

                {/* Torch (desktop) */}
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

            <EventSocialSection eventId={eventId} />

            {/* Scoreboard */}
            {canSeeScoreboard && (
              <Card>
                <CardHeader>
                  <CardTitle>Leaderboard</CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingScoreboard ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
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

          {/* Right panel */}
          <div className="space-y-3 sm:space-y-4">
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

            {userRole === "host" && (
              <StageShareMenu eventId={eventId} eventTitle={eventTitle} />
            )}

            {userRole === "host" && (
              <EventSharePanel eventId={eventId} eventTitle={eventTitle} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
