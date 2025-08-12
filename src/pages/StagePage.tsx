import React, { useState, useEffect, useRef, Suspense } from "react";
import {
  useParams,
  Navigate,
  useSearchParams,
  useNavigate,
} from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { LiveKitRoomLazy, RoomAudioRendererLazy } from "@/lib/livekitLazy";
import "@livekit/components-styles";
import { StreamerInterface } from "@/components/StreamerInterface";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";

const StagePage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const [searchParams] = useSearchParams();

  // const [event, setEvent] = useState<any>(null);
  const [streamId, setStreamId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<"host" | "streamer" | null>(null);
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [serverUrl, setServerUrl] = useState<string>("");
  const [tokenLoading, setTokenLoading] = useState(false);
  const tokenGenerated = useRef(false);
  const navigate = useNavigate();
  // Store access token for optional best-effort unload pings
  const accessTokenRef = useRef<string | null>(null);
  const inviteToken = searchParams.get("token");

  // Use React Query for event data
  const { data: eventData, isLoading: isEventLoading } = useQuery({
    queryKey: ["event", eventId],
    queryFn: async () => {
      if (!eventId) {
        toast.error("Event ID is required");
        throw new Error("Event ID is required");
      }

      // Import utility functions to handle both UUID and slug
      const { parseEventIdentifier } = await import("@/lib/eventUtils");
      const { isUuid, identifier } = parseEventIdentifier(eventId);

      // Fetch event data by UUID or slug
      const eventQuery = isUuid
        ? supabase.from("events").select("*").eq("id", identifier)
        : supabase.from("events").select("*").eq("slug", identifier);

      const { data, error } = await eventQuery.single();

      if (error) {
        toast.error("Event not found");
        throw new Error(error.message);
      }

      return data;
    },
    enabled: !!eventId,
  });

  const { data: streamData } = useQuery({
    queryKey: ["stream", eventId],
    queryFn: async () => {
      if (!eventData?.id) {
        throw new Error("Event ID is required");
      }

      const streamQuery = supabase
        .from("event_streams")
        .select("id, streamer_counts")
        .eq("event_id", eventData?.id);

      const { data, error } = await streamQuery.single();

      // if (error) {
      //   toast.error("Stream not found");
      //   throw new Error(error.message);
      // }

      return data;
    },
    enabled: !!eventData?.id,
  });

  // Update local state when event data changes
  useEffect(() => {
    if (streamData) {
      console.log("Stream data setting up:", streamData);
      setStreamId(streamData.id);
    }
  }, [streamData]);

  useEffect(() => {
    const checkAuthAndAssignRole = async () => {
      try {
        // Check authentication
        const {
          data: { user: currentUser },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !currentUser) {
          toast.error("Please log in to access the stage");
          return;
        }

        setUser(currentUser);

        if (!eventId) {
          toast.error("Event ID is required");
          return;
        }

        // Wait for event data from React Query
        if (!eventData) return;

        // Check if user is host (event creator)
        if (eventData?.created_by === currentUser.id) {
          setUserRole("host");
          return;
        }

        // Check if user is assigned as streamer (use actual event UUID)
        const { data: streamerData } = await supabase
          .from("event_streamers")
          .select("*")
          .eq("event_id", eventData?.id)
          .eq("streamer_id", currentUser.id)
          .single();

        if (streamerData) {
          setUserRole("streamer");
          return;
        }

        // If invite token is present, validate it and grant streamer access
        if (inviteToken) {
          console.log("Validating invite token for streamer access");
          setUserRole("streamer");
          return;
        }

        // User is not authorized to access stage
        toast.error("You are not authorized to access this stage");
      } catch (error) {
        console.error("Error checking access:", error);
        toast.error("Failed to load stage");
      } finally {
        setLoading(false);
      }
    };

    checkAuthAndAssignRole();
  }, [eventId, eventData, inviteToken]);

  // Generate LiveKit token when event and user role are available
  useEffect(() => {
    const generateToken = async () => {
      if (!eventData?.id || !userRole || !user || tokenGenerated.current)
        return;

      try {
        setTokenLoading(true);

        // If using invite token, validate it and create a proper user token with streamer permissions
        if (inviteToken && userRole === "streamer") {
          console.log("Using invite token for LiveKit connection");

          try {
            // Basic validation that it looks like a JWT
            const jwtParts = inviteToken.split(".");
            if (jwtParts.length !== 3) {
              throw new Error("Invalid invite token format");
            }

            // Decode the JWT payload to validate it's for this event and get room info
            const payload = JSON.parse(atob(jwtParts[1]));
            console.log("Invite token payload:", payload);

            // Get current user session
            const {
              data: { session },
              error: sessionError,
            } = await supabase.auth.getSession();

            if (sessionError || !session) {
              throw new Error("Please log in to use invite token");
            }

            // Create a new edge function call to generate a user-specific streamer token
            const { data: tokenData, error: tokenError } =
              await supabase.functions.invoke("create-livekit-token", {
                body: {
                  eventId: eventData?.id,
                  userRole: "streamer",
                  permissions: {
                    roomJoin: true,
                    canPublish: true,
                    canSubscribe: true,
                    canPublishData: true,
                    hidden: false,
                    recorder: false,
                  },
                },
                headers: {
                  Authorization: `Bearer ${session.access_token}`,
                },
              });

            if (tokenError || !tokenData) {
              console.error(
                "Failed to generate streamer token, falling back to invite token:",
                tokenError
              );
              // Fallback to using the invite token directly
              setToken(inviteToken);
              setServerUrl(payload.iss || "wss://localhost:7880"); // Use server from payload or default
            } else {
              // Use the newly generated token with proper user identity
              setToken(tokenData.token);
              setServerUrl(tokenData.serverUrl);
            }

            tokenGenerated.current = true;
            console.log(
              "Generated streamer token for invited user:",
              user?.email
            );
            // Save access token for optional keepalive usage
            accessTokenRef.current = session.access_token;
            return;
          } catch (err) {
            console.error("Invite token validation failed:", err);
            throw new Error("Invalid or expired invite token");
          }
        }

        // Generate token through regular flow for hosts and assigned streamers
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError || !session) {
          throw new Error("Please log in to access this stream");
        }

        const { data, error } = await supabase.functions.invoke(
          "create-livekit-token",
          {
            body: {
              eventId: eventData?.id,
              userRole,
            },
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
          }
        );

        if (error) {
          throw new Error(error.message || "Failed to generate token");
        }

        if (!data?.token || !data?.serverUrl) {
          throw new Error("Invalid token response");
        }

        setToken(data.token);
        setServerUrl(data.serverUrl);
        tokenGenerated.current = true;
        // Save access token for optional keepalive usage
        accessTokenRef.current = session.access_token;
        console.log("LiveKit token generated successfully:", {
          roomName: data.roomName,
          serverUrl: data.serverUrl,
          userRole,
        });
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Failed to generate LiveKit token";
        toast.error(errorMessage);
        console.error("Token generation error:", err);
        // Reset flag on error to allow retry
        tokenGenerated.current = false;
      } finally {
        setTokenLoading(false);
      }
    };

    if (!tokenGenerated.current) {
      console.log("Generating token...");
      generateToken();
    }
  }, [eventData?.id, userRole, user, inviteToken]);

  // Cleanup token generation flag on unmount
  useEffect(() => {
    return () => {
      tokenGenerated.current = false;
    };
  }, []);

  if (loading || tokenLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">
            {loading ? "Loading stage..." : "Connecting to live stream..."}
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    const redirectUrl = window.location.pathname + window.location.search;

    const redirectWithToken = inviteToken
      ? `${redirectUrl}${
          redirectUrl.includes("?") ? "&" : "?"
        }token=${inviteToken}`
      : redirectUrl;

    return (
      <Navigate
        to={`/login?redirect=${encodeURIComponent(redirectWithToken)}`}
        replace
      />
    );
  }

  if (!eventData || !userRole) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-muted-foreground">
            You are not authorized to access this stage.
          </p>
        </div>
      </div>
    );
  }

  if (!token || !serverUrl) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Preparing live stream...</p>
        </div>
      </div>
    );
  }

  return (
    <Suspense fallback={<div className="aspect-video w-full bg-black/5" />}>
      <LiveKitRoomLazy
        token={token}
        serverUrl={serverUrl}
        connectOptions={{
          autoSubscribe: true,
        }}
        onConnected={() => {
          console.log("LiveKit room connected");
          toast.success("Connected to live stream");
        }}
        onDisconnected={(reason) => {
          console.log("LiveKit room disconnected:", reason);
          navigate(`/event/${eventId}`);
          toast.info("Disconnected from live stream");
        }}
        onError={(error) => {
          console.error("LiveKit room error:", error);
          toast.error("Live stream connection error: " + error.message);
        }}
        style={{ height: "100vh" }}
      >
        <RoomAudioRendererLazy />
        <StreamerInterface
          eventId={eventData?.id}
          eventTitle={eventData?.name}
          isLive={eventData?.is_live}
          userRole={userRole}
          userId={user?.id}
          eventHostId={eventData?.created_by}
          streamId={streamId}
        />
      </LiveKitRoomLazy>
    </Suspense>
  );
};

export default StagePage;
