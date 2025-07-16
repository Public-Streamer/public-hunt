import React, { useState, useEffect } from "react";
import { useParams, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { LiveKitRoom, RoomAudioRenderer } from "@livekit/components-react";
import "@livekit/components-styles";
import { StreamerInterface } from "@/components/StreamerInterface";
import { toast } from "sonner";

const StagePage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<"host" | "streamer" | null>(null);
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [serverUrl, setServerUrl] = useState<string>("");
  const [tokenLoading, setTokenLoading] = useState(false);

  useEffect(() => {
    const checkAuthAndFetchEvent = async () => {
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

        // Fetch event details
        const { data: eventData, error: eventError } = await supabase
          .from("events")
          .select("*")
          .eq("id", eventId)
          .single();

        if (eventError) {
          toast.error("Event not found");
          return;
        }

        setEvent(eventData);

        // Check if user is host (event creator)
        if (eventData.created_by === currentUser.id) {
          setUserRole("host");
          return;
        }

        // Check if user is assigned as streamer
        const { data: streamerData } = await supabase
          .from("event_streamers")
          .select("*")
          .eq("event_id", eventId)
          .eq("streamer_id", currentUser.id)
          .single();

        if (streamerData) {
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

    checkAuthAndFetchEvent();
  }, [eventId]);

  // Generate LiveKit token when event and user role are available
  useEffect(() => {
    const generateToken = async () => {
      if (!eventId || !userRole || !user) return;

      try {
        setTokenLoading(true);

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
              eventId,
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
      } finally {
        setTokenLoading(false);
      }
    };

    generateToken();
  }, [eventId, userRole, user]);

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
    return <Navigate to="/login" replace />;
  }

  if (!event || !userRole) {
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
    <LiveKitRoom
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
        toast.info("Disconnected from live stream");
      }}
      onError={(error) => {
        console.error("LiveKit room error:", error);
        toast.error("Live stream connection error: " + error.message);
      }}
      style={{ height: "100vh" }}
    >
      <RoomAudioRenderer />
      <StreamerInterface
        eventId={eventId}
        eventTitle={event.name}
        isLive={event.is_live}
        userRole={userRole}
      />
    </LiveKitRoom>
  );
};

export default StagePage;
