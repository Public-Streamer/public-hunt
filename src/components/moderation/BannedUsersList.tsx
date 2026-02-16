import React, { useEffect, useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Loader2, Ban, Unlock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface BannedUser {
    id: string; // This is the moderation log ID for the ban
    target_user_id: string;
    target_user: { display_name: string; avatar_url?: string };
    moderator_id: string;
    created_at: string;
    reason?: string;
}

interface BannedUsersListProps {
    eventId?: string; // If provided, filter by event. If not, show all for host? API might limit.
}

export const BannedUsersList: React.FC<BannedUsersListProps> = ({ eventId }) => {
    const [bannedUsers, setBannedUsers] = useState<BannedUser[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    const fetchBannedUsers = async () => {
        setLoading(true);
        try {
            // Logic: Find latest ban log for each user where no unban log exists later?
            // Or simpler: We don't have a 'banned_users' table, we rely on logs.
            // A user is banned if the LAST action for them was 'ban' and not 'unban'.
            // This is complex to query efficiently without a materialized view or state table.
            // For now, let's fetch all 'ban' actions and 'unban' actions and compute pending bans client side.
            // Optimized approach: Fetch all unique target_user_ids who have 'ban' logs.
            // Then check their latest status.
            // This is getting complicated for a edge function.
            // Ideally we should have updated the `event_participants` table with a `status: banned` field.
            // But adhering to the plan which says "Fetch banned users from moderation_logs (filter by action='ban', no unban log)".

            // Let's assume we can fetch all bans.
            let query = supabase
                .from('moderation_logs' as any)
                .select(`
          id,
          target_user_id,
          target_user:user_profiles!target_user_id(display_name, avatar_url),
          moderator_id,
          created_at,
          reason,
          action
        `)
                .in('action', ['ban', 'unban'])
                .order('created_at', { ascending: false });

            if (eventId) {
                query = query.eq('event_id', eventId);
            }

            const { data, error } = await query;

            if (error) throw error;

            // Process logs to find currently banned users
            const userStatus = new Map<string, { isBanned: boolean; lastLog: any }>();

            (data as any[])?.forEach((log) => {
                if (!userStatus.has(log.target_user_id)) {
                    // First time seeing this user (most recent log)
                    userStatus.set(log.target_user_id, {
                        isBanned: log.action === 'ban',
                        lastLog: log
                    });
                }
            });

            const activeBans = Array.from(userStatus.values())
                .filter((status) => status.isBanned)
                .map((status) => status.lastLog);

            setBannedUsers(activeBans);
        } catch (error) {
            console.error('Error fetching banned users:', error);
            toast({
                title: 'Error',
                description: 'Failed to load banned users',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBannedUsers();
    }, [eventId]);

    const handleUnban = async (userId: string) => {
        if (!eventId) return; // Need event ID to unban

        try {
            const { error } = await supabase.functions.invoke('manage-event-messages', {
                body: {
                    action: 'moderate',
                    eventId,
                    userId,
                    moderationType: 'unban'
                }
            });

            if (error) throw error;

            toast({
                title: 'User Unbanned',
                description: 'User has been unbanned successfully.',
            });

            // Refresh list
            fetchBannedUsers();
        } catch (error) {
            console.error('Error unbanning user:', error);
            toast({
                title: 'Unban Failed',
                description: 'Failed to unban user.',
                variant: 'destructive',
            });
        }
    };

    if (loading) {
        return <div className="flex justify-center p-4"><Loader2 className="animate-spin" /></div>;
    }

    if (bannedUsers.length === 0) {
        return <div className="text-center p-4 text-muted-foreground">No banned users found.</div>;
    }

    return (
        <div className="border rounded-md">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Banned At</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {bannedUsers.map((ban) => (
                        <TableRow key={ban.id}>
                            <TableCell className="font-medium flex items-center gap-2">
                                <Ban className="w-4 h-4 text-red-500" />
                                {ban.target_user?.display_name || 'Unknown'}
                            </TableCell>
                            <TableCell>{format(new Date(ban.created_at), 'MMM d, yyyy')}</TableCell>
                            <TableCell>{ban.reason || '-'}</TableCell>
                            <TableCell className="text-right">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleUnban(ban.target_user_id)}
                                    className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                >
                                    <Unlock className="w-4 h-4 mr-1" />
                                    Unban
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
};
