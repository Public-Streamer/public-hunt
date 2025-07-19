
import { useEffect, useState, useCallback } from 'react';
import { Room, RoomConnectOptions, RoomOptions, LocalParticipant, RemoteParticipant } from 'livekit-client';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

interface LiveKitConfig {
  token: string;
  roomName: string;
  serverUrl: string;
}

interface UseLiveKitProps {
  eventId: string;
  userRole?: 'host' | 'streamer' | 'viewer';
  autoConnect?: boolean;
}

export const useLiveKit = ({ eventId, userRole = 'viewer', autoConnect = false }: UseLiveKitProps) => {
  const [room, setRoom] = useState<Room | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [participants, setParticipants] = useState<(LocalParticipant | RemoteParticipant)[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Add room lookup function to find existing room for event
  const findExistingRoom = useCallback(async (eventId: string) => {
    try {
      console.log('🔍 useLiveKit: Looking up existing room for event:', eventId);
      const { data, error } = await supabase
        .from('livekit_rooms')
        .select('*')
        .eq('event_id', eventId)
        .eq('is_active', true)
        .maybeSingle();

      if (error) {
        console.error('❌ useLiveKit: Error finding existing room:', error);
        return null;
      }

      console.log('🏠 useLiveKit: Room lookup result:', data ? {
        roomName: data.room_name,
        roomSid: data.livekit_room_sid,
        isActive: data.is_active,
        eventId: data.event_id
      } : 'No active room found');
      
      return data;
    } catch (err) {
      console.error('❌ useLiveKit: Error in findExistingRoom:', err);
      return null;
    }
  }, []);

  const createRoom = useCallback(async () => {
    try {
      console.log('🏗️ useLiveKit: Creating new room for event:', eventId);
      const { data, error } = await supabase.functions.invoke('manage-livekit-room', {
        body: {
          action: 'create',
          eventId,
          roomConfig: {
            maxParticipants: 100,
            emptyTimeout: 300,
            enableRecording: false
          }
        }
      });

      if (error) {
        console.error('❌ useLiveKit: Room creation failed:', error);
        throw error;
      }
      
      console.log('✅ useLiveKit: Room created successfully:', data);
      toast({
        title: "Room Created",
        description: "Live streaming room is ready"
      });
      
      return data;
    } catch (err) {
      console.error('❌ useLiveKit: Error creating LiveKit room:', err);
      toast({
        title: "Room Creation Failed",
        description: "Could not create streaming room",
        variant: "destructive"
      });
      return null;
    }
  }, [eventId, toast]);

  const createLiveKitToken = useCallback(async (): Promise<LiveKitConfig | null> => {
    try {
      console.log('🎫 useLiveKit: Requesting token for event:', eventId, 'role:', userRole);
      const { data, error } = await supabase.functions.invoke('create-livekit-token', {
        body: {
          eventId,
          userRole,
          permissions: {
            canPublish: userRole === 'host' || userRole === 'streamer',
            canSubscribe: true,
            canPublishData: true,
          }
        }
      });

      if (error) {
        console.error('❌ useLiveKit: Token creation failed:', error);
        throw error;
      }
      
      console.log('✅ useLiveKit: Token created successfully:', {
        roomName: data.roomName,
        serverUrl: data.serverUrl,
        userRole
      });
      
      return data;
    } catch (err) {
      console.error('❌ useLiveKit: Error creating LiveKit token:', err);
      setError('Failed to create session token');
      toast({
        title: "Connection Error",
        description: "Failed to create streaming session",
        variant: "destructive"
      });
      return null;
    }
  }, [eventId, userRole, toast]);

  const connectToRoom = useCallback(async () => {
    if (isConnecting || isConnected) {
      console.log('⚠️ useLiveKit: Already connecting or connected, skipping');
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      console.log('🔗 useLiveKit: Starting connection process for event:', eventId, 'role:', userRole);
      
      // Check if room already exists for this event
      const existingRoom = await findExistingRoom(eventId);
      console.log('🏠 useLiveKit: Room lookup before connection:', { eventId, existingRoom, userRole });

      // Only hosts can create new rooms, others must wait for existing room
      if (!existingRoom && userRole !== 'host') {
        const errorMsg = 'No active stream found for this event';
        console.error('❌ useLiveKit:', errorMsg);
        setError(errorMsg);
        toast({
          title: "No Stream Available",
          description: "This event is not currently live",
          variant: "destructive"
        });
        setIsConnecting(false);
        return;
      }

      // If host and no room exists, create one first
      if (!existingRoom && userRole === 'host') {
        console.log('👑 useLiveKit: Host creating new room for event:', eventId);
        const roomCreated = await createRoom();
        if (!roomCreated) {
          console.error('❌ useLiveKit: Room creation failed');
          setIsConnecting(false);
          return;
        }
        // Wait a moment for room creation to complete
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Now get the token (this will verify the room exists)
      const config = await createLiveKitToken();
      if (!config) {
        console.error('❌ useLiveKit: Token creation failed');
        setIsConnecting(false);
        return;
      }

      console.log('🔗 useLiveKit: Connecting to LiveKit with config:', {
        roomName: config.roomName,
        serverUrl: config.serverUrl,
        userRole
      });

      const roomInstance = new Room();
      
      // Set up event listeners
      roomInstance.on('connected', () => {
        console.log('✅ useLiveKit: Connected to LiveKit room:', config.roomName);
        setIsConnected(true);
        setParticipants([roomInstance.localParticipant, ...Array.from(roomInstance.remoteParticipants.values())]);
        toast({
          title: "Connected",
          description: "Successfully joined the stream"
        });
      });

      roomInstance.on('disconnected', () => {
        console.log('🔌 useLiveKit: Disconnected from LiveKit room');
        setIsConnected(false);
        setParticipants([]);
      });

      roomInstance.on('participantConnected', (participant: RemoteParticipant) => {
        console.log('👤 useLiveKit: Participant connected:', participant.identity);
        setParticipants(prev => [...prev, participant]);
      });

      roomInstance.on('participantDisconnected', (participant: RemoteParticipant) => {
        console.log('👤 useLiveKit: Participant disconnected:', participant.identity);
        setParticipants(prev => prev.filter(p => p.identity !== participant.identity));
      });

      const connectOptions: RoomConnectOptions = {
        autoSubscribe: true,
      };

      await roomInstance.connect(config.serverUrl, config.token, connectOptions);
      setRoom(roomInstance);

      console.log('🎉 useLiveKit: Successfully connected to room:', config.roomName);

    } catch (err) {
      console.error('❌ useLiveKit: Error connecting to LiveKit room:', err);
      setError('Failed to connect to stream');
      toast({
        title: "Connection Failed",
        description: "Could not connect to the live stream",
        variant: "destructive"
      });
    } finally {
      setIsConnecting(false);
    }
  }, [isConnecting, isConnected, createLiveKitToken, toast, findExistingRoom, eventId, userRole, createRoom]);

  const disconnectFromRoom = useCallback(async () => {
    if (room) {
      console.log('🔌 useLiveKit: Disconnecting from room');
      await room.disconnect();
      setRoom(null);
      setIsConnected(false);
      setParticipants([]);
    }
  }, [room]);

  const closeRoom = useCallback(async () => {
    try {
      console.log('🚪 useLiveKit: Closing room for event:', eventId);
      const { data, error } = await supabase.functions.invoke('manage-livekit-room', {
        body: {
          action: 'close',
          eventId
        }
      });

      if (error) throw error;
      
      await disconnectFromRoom();
      
      console.log('✅ useLiveKit: Room closed successfully');
      toast({
        title: "Stream Ended",
        description: "Live streaming room has been closed"
      });
      
      return data;
    } catch (err) {
      console.error('❌ useLiveKit: Error closing LiveKit room:', err);
      toast({
        title: "Error",
        description: "Could not close streaming room",
        variant: "destructive"
      });
      return null;
    }
  }, [eventId, disconnectFromRoom, toast]);

  const cleanupInactiveRooms = useCallback(async () => {
    try {
      console.log('🧹 useLiveKit: Starting cleanup of inactive rooms');
      const { data, error } = await supabase.functions.invoke('manage-livekit-room', {
        body: {
          action: 'cleanup',
          eventId // Required for auth, but cleanup is global
        }
      });

      if (error) throw error;
      
      console.log('✅ useLiveKit: Room cleanup completed:', data);
      return data;
    } catch (err) {
      console.error('❌ useLiveKit: Error cleaning up rooms:', err);
      return null;
    }
  }, [eventId]);

  // Auto-connect if specified
  useEffect(() => {
    if (autoConnect && !isConnected && !isConnecting) {
      console.log('🚀 useLiveKit: Auto-connecting to room');
      connectToRoom();
    }
  }, [autoConnect, isConnected, isConnecting, connectToRoom]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (room) {
        console.log('🧹 useLiveKit: Cleaning up room connection on unmount');
        room.disconnect();
      }
    };
  }, [room]);

  return {
    room,
    isConnected,
    isConnecting,
    participants,
    error,
    connectToRoom,
    disconnectFromRoom,
    createRoom,
    closeRoom,
    cleanupInactiveRooms,
    findExistingRoom
  };
};
