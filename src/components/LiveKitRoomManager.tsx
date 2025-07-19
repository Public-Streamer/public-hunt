import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trash2, RefreshCw, Database, AlertTriangle } from 'lucide-react';
import { useLiveKit } from '@/hooks/useLiveKit';
import { useToast } from '@/hooks/use-toast';

interface LiveKitRoomManagerProps {
  eventId: string;
  userRole: 'host' | 'streamer' | 'viewer';
  onRoomStatusChange?: (status: { hasRoom: boolean; isActive: boolean }) => void;
}

const LiveKitRoomManager: React.FC<LiveKitRoomManagerProps> = ({
  eventId,
  userRole,
  onRoomStatusChange
}) => {
  const [isChecking, setIsChecking] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);
  const [roomStatus, setRoomStatus] = useState<any>(null);
  
  const { findExistingRoom, cleanupInactiveRooms } = useLiveKit({ 
    eventId, 
    userRole, 
    autoConnect: false 
  });
  const { toast } = useToast();

  const checkRoomStatus = async () => {
    setIsChecking(true);
    try {
      const room = await findExistingRoom(eventId);
      setRoomStatus(room);
      
      const hasRoom = !!room;
      const isActive = room?.is_active || false;
      
      onRoomStatusChange?.({ hasRoom, isActive });
      
      toast({
        title: "Room Status",
        description: hasRoom 
          ? `Room found: ${room.room_name} (${isActive ? 'Active' : 'Inactive'})`
          : "No room found for this event",
        variant: hasRoom ? "default" : "destructive"
      });
    } catch (error) {
      console.error('Error checking room status:', error);
      toast({
        title: "Error",
        description: "Failed to check room status",
        variant: "destructive"
      });
    } finally {
      setIsChecking(false);
    }
  };

  const handleCleanup = async () => {
    if (userRole !== 'host') {
      toast({
        title: "Permission Denied",
        description: "Only event hosts can cleanup rooms",
        variant: "destructive"
      });
      return;
    }

    setIsCleaning(true);
    try {
      const result = await cleanupInactiveRooms();
      
      toast({
        title: "Cleanup Complete",
        description: result?.message || "Room cleanup completed",
      });
      
      // Refresh room status after cleanup
      await checkRoomStatus();
    } catch (error) {
      console.error('Error during cleanup:', error);
      toast({
        title: "Cleanup Failed",
        description: "Failed to cleanup inactive rooms",
        variant: "destructive"
      });
    } finally {
      setIsCleaning(false);
    }
  };

  return (
    <Card className="border-blue-200">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Database className="h-5 w-5 mr-2" />
          LiveKit Room Manager
          {userRole === 'host' && (
            <Badge variant="outline" className="ml-2">
              Host Controls
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">
              Event ID: <code className="text-xs bg-gray-100 px-1 rounded">{eventId}</code>
            </p>
            <p className="text-sm text-gray-600">
              Your Role: <Badge variant="secondary" className="text-xs">{userRole}</Badge>
            </p>
          </div>
          
          <Button
            onClick={checkRoomStatus}
            disabled={isChecking}
            variant="outline"
            size="sm"
          >
            {isChecking ? (
              <RefreshCw className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Check Status
          </Button>
        </div>

        {roomStatus && (
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">Room Status:</span>
              <Badge 
                variant={roomStatus.is_active ? "default" : "secondary"}
                className={roomStatus.is_active ? "bg-green-600" : "bg-gray-500"}
              >
                {roomStatus.is_active ? "Active" : "Inactive"}
              </Badge>
            </div>
            <div className="text-sm space-y-1">
              <p><strong>Room Name:</strong> {roomStatus.room_name}</p>
              <p><strong>Room SID:</strong> {roomStatus.livekit_room_sid}</p>
              <p><strong>Max Participants:</strong> {roomStatus.max_participants}</p>
              <p><strong>Created:</strong> {new Date(roomStatus.created_at).toLocaleString()}</p>
            </div>
          </div>
        )}

        {roomStatus === null && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center">
              <AlertTriangle className="h-4 w-4 text-yellow-600 mr-2" />
              <span className="text-sm text-yellow-700">
                No room information available. Click "Check Status" to verify.
              </span>
            </div>
          </div>
        )}

        {userRole === 'host' && (
          <div className="pt-2 border-t">
            <Button
              onClick={handleCleanup}
              disabled={isCleaning}
              variant="destructive"
              size="sm"
              className="w-full"
            >
              {isCleaning ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Cleanup Inactive Rooms
            </Button>
            <p className="text-xs text-gray-500 mt-2 text-center">
              This will remove all inactive LiveKit rooms from the server
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LiveKitRoomManager;