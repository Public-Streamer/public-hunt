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
import { format } from "date-fns";
import { Loader2, Shield } from "lucide-react";

interface ModerationLogEntry {
    id: string;
    action: string;
    target_user_id: string;
    moderator_id: string;
    created_at: string;
    target_user?: { display_name: string };
    moderator?: { display_name: string };
    reason?: string;
}

interface ModerationLogProps {
    eventId: string;
}

export const ModerationLog: React.FC<ModerationLogProps> = ({ eventId }) => {
    const [logs, setLogs] = useState<ModerationLogEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLogs = async () => {
            const { data, error } = await supabase
                .from('moderation_logs')
                .select(`
          *,
          target_user:user_profiles!target_user_id(display_name),
          moderator:user_profiles!moderator_id(display_name)
        `)
                .eq('event_id', eventId)
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) {
                console.error('Error fetching moderation logs:', error);
            } else {
                setLogs(data || []);
            }
            setLoading(false);
        };

        fetchLogs();

        // Real-time subscription for new logs
        const channel = supabase
            .channel('moderation-logs')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'moderation_logs',
                    filter: `event_id=eq.${eventId}`,
                },
                async (payload) => {
                    // Fetch the complete record with relations
                    const { data } = await supabase
                        .from('moderation_logs')
                        .select(`
              *,
              target_user:user_profiles!target_user_id(display_name),
              moderator:user_profiles!moderator_id(display_name)
            `)
                        .eq('id', payload.new.id)
                        .single();

                    if (data) {
                        setLogs((prev) => [data, ...prev]);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [eventId]);

    if (loading) {
        return <div className="flex justify-center p-4"><Loader2 className="animate-spin" /></div>;
    }

    if (logs.length === 0) {
        return <div className="text-center p-4 text-muted-foreground">No moderation actions yet.</div>;
    }

    return (
        <div className="border rounded-md">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Time</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>Target User</TableHead>
                        <TableHead>Moderator</TableHead>
                        <TableHead>Reason</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {logs.map((log) => (
                        <TableRow key={log.id}>
                            <TableCell>{format(new Date(log.created_at), 'MMM d, h:mm a')}</TableCell>
                            <TableCell className="font-medium capitalize">
                                {log.action === 'ban' && <span className="text-red-500 flex items-center gap-1"><Shield className="w-3 h-3" /> Ban</span>}
                                {log.action === 'timeout' && <span className="text-yellow-500">Timeout</span>}
                                {log.action === 'delete' && <span className="text-orange-500">Delete Message</span>}
                                {log.action === 'unban' && <span className="text-green-500">Unban</span>}
                            </TableCell>
                            <TableCell>{log.target_user?.display_name || 'Unknown'}</TableCell>
                            <TableCell>{log.moderator?.display_name || 'Unknown'}</TableCell>
                            <TableCell>{log.reason || '-'}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
};
