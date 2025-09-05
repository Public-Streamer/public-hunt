import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { LocalParticipant } from 'livekit-client';
import { supabaseBrowser } from '@/lib/supabase/browser';
import {
  createStreamNameMetadata,
  validateStreamName,
  normalizeStreamName,
} from '@/lib/streamNameUtils';

type SyncStatus = 'idle' | 'saving' | 'error' | 'success';

interface StreamNameManager {
  value: string;
  setValue: (value: string) => void;
  isEditing: boolean;
  isSaving: boolean;
  syncStatus: SyncStatus;
  error: string | null;
  startEdit: () => void;
  cancelEdit: () => void;
  save: () => Promise<void>;
  hasUnsavedChanges: boolean;
}

interface UseStreamNameManagerProps {
  eventId: string;
  userId?: string;
  participant?: LocalParticipant | null;
}

export function useStreamNameManager({
  eventId,
  userId,
  participant,
}: UseStreamNameManagerProps): StreamNameManager {
  const supabase = useMemo(() => supabaseBrowser(), []);

  // State management
  const [value, setValue] = useState('');
  const [originalValue, setOriginalValue] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  // Refs for managing async operations
  const latestSaveId = useRef(0);
  const saveTimeoutRef = useRef<NodeJS.Timeout>();
  const channelRef = useRef<any>(null);

  // Computed properties
  const hasUnsavedChanges = value !== originalValue;

  /**
   * Update participant metadata with stream name
   */
  const updateParticipantMetadata = useCallback(
    async (streamName: string) => {
      if (!participant) return;

      try {
        const newMetadata = createStreamNameMetadata(
          participant.metadata,
          streamName
        );
        await participant.setMetadata(newMetadata);
      } catch (error) {
        console.error('Failed to update participant metadata:', error);
      }
    },
    [participant]
  );

  /**
   * Load initial stream name from database
   */
  const loadStreamName = useCallback(async () => {
    if (!userId || !eventId) return;

    try {
      const { data, error } = await supabase
        .from('event_streamers')
        .select('camera_name')
        .eq('event_id', eventId)
        .eq('streamer_id', userId)
        .maybeSingle();

      if (error) throw error;

      const name = data?.camera_name ?? '';
      setValue(name);
      setOriginalValue(name);

      // Update participant metadata to match database
      await updateParticipantMetadata(name);
    } catch (err) {
      console.error('Error loading stream name:', err);
      setError('Failed to load stream name');
      setSyncStatus('error');
    }
  }, [eventId, userId, supabase, updateParticipantMetadata]);

  /**
   * Save stream name to database
   */
  const saveStreamName = useCallback(async () => {
    if (!userId || !eventId) return;

    const trimmedValue = normalizeStreamName(value);

    // Validate stream name
    const validation = validateStreamName(trimmedValue);
    if (!validation.isValid) {
      setError(validation.error || 'Invalid stream name');
      setSyncStatus('error');
      throw new Error(validation.error);
    }

    setIsSaving(true);
    setSyncStatus('saving');
    setError(null);

    const thisSaveId = ++latestSaveId.current;

    try {
      console.log('Attempting to save stream name:', {
        eventId,
        userId,
        trimmedValue,
      });

      // Use UPSERT logic to handle both INSERT and UPDATE cases
      const { error } = await supabase.from('event_streamers').upsert(
        {
          event_id: eventId,
          streamer_id: userId,
          camera_name: trimmedValue,
          assigned_by: userId, // Required field
          permissions: [], // Default empty permissions
        },
        {
          onConflict: 'event_id,streamer_id',
          ignoreDuplicates: false,
        }
      );

      if (error) {
        console.error('Database error:', error);
        throw error;
      }

      console.log('Stream name saved successfully');

      // Only update state if this is still the latest save
      if (latestSaveId.current === thisSaveId) {
        await updateParticipantMetadata(trimmedValue);
        setOriginalValue(trimmedValue);
        setIsEditing(false);
        setSyncStatus('success');

        // Show success status briefly
        setTimeout(() => {
          if (latestSaveId.current === thisSaveId) {
            setSyncStatus('idle');
          }
        }, 2000);
      }
    } catch (err) {
      console.error('Failed to save stream name:', err);
      if (latestSaveId.current === thisSaveId) {
        setError(err instanceof Error ? err.message : 'Failed to save');
        setSyncStatus('error');
      }
      throw err;
    } finally {
      if (latestSaveId.current === thisSaveId) {
        setIsSaving(false);
      }
    }
  }, [eventId, userId, value, supabase, updateParticipantMetadata]);

  /**
   * Load initial data on mount
   */
  useEffect(() => {
    loadStreamName();
  }, [loadStreamName, eventId, userId]);

  // // Cleanup on unmount
  // useEffect(() => {
  //   return () => {
  //     if (saveTimeoutRef.current) {
  //       clearTimeout(saveTimeoutRef.current);
  //     }
  //   };
  // }, []);

  // Handler functions
  const startEdit = useCallback(() => {
    setIsEditing(true);
    setError(null);
    setSyncStatus('idle');
  }, []);

  const cancelEdit = useCallback(() => {
    setValue(originalValue);
    setIsEditing(false);
    setError(null);
    setSyncStatus('idle');
  }, [originalValue]);

  const save = useCallback(async () => {
    await saveStreamName();
  }, [saveStreamName]);

  console.log('value from useStreamNameManager', value);

  return {
    value,
    setValue,
    isEditing,
    isSaving,
    syncStatus,
    error,
    startEdit,
    cancelEdit,
    save,
    hasUnsavedChanges,
  };
}
