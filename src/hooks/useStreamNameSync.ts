import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { LocalParticipant } from "livekit-client";
import { supabaseBrowser } from "@/lib/supabase/browser";

type Args = {
  eventId: string;
  userId?: string;
  participant?: LocalParticipant | null;
};

export function useStreamNameSync({ eventId, userId, participant }: Args) {
  const supabase = useMemo(() => supabaseBrowser(), []);
  const [value, setValue] = useState("");          // controlled input
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const latestSaveId = useRef(0);                  // prevent out-of-order writes

  const setParticipantMetadata = useCallback(async (nameFromDb: string) => {
    if (!participant) return;
    try {
      const current = participant.metadata ? JSON.parse(participant.metadata) : {};
      const next = { ...current, streamName: nameFromDb || undefined };
      // LiveKit allows empty string? Keep undefined when empty
      await participant.setMetadata(JSON.stringify(next));
    } catch (e) {
      console.error("Failed to set participant metadata", e);
    }
  }, [participant]);

  // Load once on mount
  useEffect(() => {
    if (!userId || !eventId) return;
    let isActive = true;

    (async () => {
      try {
        const { data, error } = await supabase
          .from("event_streamers")
          .select("camera_name")
          .eq("event_id", eventId)
          .eq("streamer_id", userId)
          .maybeSingle();

        if (error) throw error;
        const name = data?.camera_name ?? "";
        if (!isActive) return;

        setValue(name);
        await setParticipantMetadata(name); // always reflect DB on mount
      } catch (e) {
        console.error("Error loading camera_name", e);
      }
    })();

    // Realtime: keep LiveKit metadata synced from DB
    const channel = supabase
      .channel(`stream-name-${eventId}-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "event_streamers",
          filter: `event_id=eq.${eventId}`,
        },
        async (payload) => {
          const row: any = payload.new;
          if (row.streamer_id !== userId) return;

          const name = row.camera_name ?? "";
          setValue((v) => (isEditing ? v : name)); // don't fight the user while typing
          await setParticipantMetadata(name);
        }
      )
      .subscribe();

    return () => {
      isActive = false;
      channel.unsubscribe();
    };
  }, [eventId, userId, supabase, isEditing, setParticipantMetadata]);

  // Handlers
  const startEdit = useCallback(() => setIsEditing(true), []);
  const cancelEdit = useCallback(() => setIsEditing(false), []);

  const save = useCallback(async () => {
    if (!userId || !eventId) return;
    const trimmed = value.trim();
    if (trimmed.length > 64) {
      throw new Error("Stream name too long (max 64 characters).");
    }

    setIsSaving(true);
    const thisSaveId = ++latestSaveId.current;

    try {
      const { error } = await supabase
        .from("event_streamers")
        .update({ camera_name: trimmed })
        .eq("event_id", eventId)
        .eq("streamer_id", userId);

      if (error) throw error;

      // Don’t set LiveKit metadata here directly — let the realtime listener
      // update from DB so DB remains the source of truth.
      if (latestSaveId.current === thisSaveId) {
        setIsEditing(false);
      }
    } catch (e) {
      console.error("Failed to save stream name", e);
      throw e;
    } finally {
      if (latestSaveId.current === thisSaveId) {
        setIsSaving(false);
      }
    }
  }, [eventId, userId, value, supabase]);

  console.log("participant", participant);


  return {
    value, setValue,
    isEditing, isSaving,
    startEdit, cancelEdit, save,
  };
}
