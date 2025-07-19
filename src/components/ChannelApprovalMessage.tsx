import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, X, Trash2, AlertCircle, Calendar, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';

interface ChannelApprovalMessageProps {
  requestId: string;
  eventName: string;
  eventDescription: string;
  channelName: string;
  requestedBy: string;
  requestedByName: string;
  requestedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  onStatusChange?: (newStatus: 'approved' | 'rejected') => void;
  onDelete?: () => void;
}

const ChannelApprovalMessage: React.FC<ChannelApprovalMessageProps> = ({
  requestId,
  eventName,
  eventDescription,
  channelName,
  requestedBy,
  requestedByName,
  requestedAt,
  status,
  onStatusChange,
  onDelete
}) => {
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();

  const handleApproval = async (approved: boolean) => {
    setProcessing(true);
    try {
      const newStatus = approved ? 'approved' : 'rejected';
      const reviewedAt = new Date().toISOString();
      
      // Get current user
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) {
        throw new Error('User not authenticated');
      }

      // Update the event channel request
      const { error: updateError } = await supabase
        .from('event_channel_requests')
        .update({
          status: newStatus,
          reviewed_at: reviewedAt,
          reviewed_by: userData.user.id
        })
        .eq('id', requestId);

      if (updateError) throw updateError;

      if (approved) {
        // Get the event ID from the request
        const { data: requestData, error: requestError } = await supabase
          .from('event_channel_requests')
          .select('event_id, channel_id')
          .eq('id', requestId)
          .single();

        if (requestError) throw requestError;

        // Update the event to assign it to the channel
        const { error: eventUpdateError } = await supabase
          .from('events')
          .update({ channel_id: requestData.channel_id })
          .eq('id', requestData.event_id);

        if (eventUpdateError) throw eventUpdateError;

        toast({
          title: "Request Approved",
          description: `Event "${eventName}" has been assigned to ${channelName}.`,
          variant: "default"
        });
      } else {
        toast({
          title: "Request Rejected",
          description: `Event "${eventName}" assignment to ${channelName} has been rejected.`,
          variant: "default"
        });
      }

      onStatusChange?.(newStatus);
    } catch (error) {
      console.error('Error processing approval:', error);
      toast({
        title: "Error",
        description: "Failed to process approval request.",
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async () => {
    setProcessing(true);
    try {
      const { error } = await supabase
        .from('event_channel_requests')
        .delete()
        .eq('id', requestId);

      if (error) throw error;

      toast({
        title: "Request Deleted",
        description: `Channel assignment request for "${eventName}" has been deleted.`,
        variant: "default"
      });

      onDelete?.();
    } catch (error) {
      console.error('Error deleting request:', error);
      toast({
        title: "Error",
        description: "Failed to delete request.",
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'approved':
        return 'Approved';
      case 'rejected':
        return 'Rejected';
      default:
        return 'Pending Approval';
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center">
            <AlertCircle className="h-5 w-5 mr-2 text-orange-500" />
            Channel Assignment Request
          </CardTitle>
          <Badge className={getStatusColor()}>
            {getStatusText()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center text-sm">
            <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
            <strong>Event:</strong>
            <span className="ml-1">{eventName}</span>
          </div>
          <div className="flex items-center text-sm">
            <User className="h-4 w-4 mr-2 text-muted-foreground" />
            <strong>Requested by:</strong>
            <span className="ml-1">{requestedByName}</span>
          </div>
          <div className="text-sm">
            <strong>Channel:</strong> {channelName}
          </div>
          <div className="text-sm">
            <strong>Description:</strong> {eventDescription}
          </div>
          <div className="text-xs text-muted-foreground">
            Requested: {new Date(requestedAt).toLocaleString()}
          </div>
        </div>

        {status === 'pending' && (
          <div className="space-y-2 pt-2">
            <div className="flex space-x-2">
              <Button
                onClick={() => handleApproval(true)}
                disabled={processing}
                className="flex-1 bg-green-600 hover:bg-green-700"
                size="sm"
              >
                <Check className="h-4 w-4 mr-1" />
                Approve
              </Button>
              <Button
                onClick={() => handleApproval(false)}
                disabled={processing}
                variant="destructive"
                className="flex-1"
                size="sm"
              >
                <X className="h-4 w-4 mr-1" />
                Reject
              </Button>
            </div>
            <Button
              onClick={handleDelete}
              disabled={processing}
              variant="outline"
              className="w-full border-red-200 text-red-600 hover:bg-red-50"
              size="sm"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete Request
            </Button>
          </div>
        )}

        {status !== 'pending' && (
          <div className="pt-2 text-center text-sm text-muted-foreground">
            {status === 'approved' ? 'This request has been approved.' : 'This request has been rejected.'}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ChannelApprovalMessage;