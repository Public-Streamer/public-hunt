import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Loader2, Users, Video } from 'lucide-react';
import { useAppContext } from '@/contexts/AppContext';
import { useNavigate } from 'react-router-dom';

interface FollowedChannel {
    host_id: string;
    host: {
        user_id: string;
        display_name: string;
        avatar_url: string;
    };
    created_at: string;
}

export const FollowedChannelsList: React.FC = () => {
    const [channels, setChannels] = useState<FollowedChannel[]>([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAppContext();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchFollowedChannels = async () => {
            if (!user) return;

            try {
                const { data, error } = await supabase
                    .from('followers' as any)
                    .select(`
                        host_id,
                        created_at,
                        host:user_profiles!host_id (
                            user_id,
                            display_name,
                            avatar_url
                        )
                    `)
                    .eq('follower_id', user.id)
                    .order('created_at', { ascending: false });

                if (error) throw error;
                setChannels(data || []);
            } catch (err) {
                console.error('Error fetching followed channels:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchFollowedChannels();
    }, [user]);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-pink-600" />
            </div>
        );
    }

    if (channels.length === 0) {
        return (
            <Card>
                <CardContent className="py-12 text-center">
                    <Users className="h-12 w-12 mx-auto text-neutral-300 mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Channels Followed</h3>
                    <p className="text-neutral-500 max-w-md mx-auto">
                        Follow your favorite streamers to see their updates here.
                    </p>
                    <Button className="mt-4" onClick={() => navigate('/events')}>
                        Discover Streamers
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
                <Users className="h-5 w-5" />
                Following ({channels.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {channels.map((channel) => (
                    <Card
                        key={channel.host_id}
                        className="cursor-pointer hover:border-pink-500 transition-colors"
                        onClick={() => navigate(`/channel/${channel.host_id}`)}
                    >
                        <CardContent className="p-4 flex items-center gap-4">
                            <Avatar className="h-12 w-12">
                                <AvatarImage src={channel.host?.avatar_url} />
                                <AvatarFallback>
                                    {channel.host?.display_name?.charAt(0) || 'U'}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">
                                    {channel.host?.display_name || 'Unknown'}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    View channel
                                </p>
                            </div>
                            <Video className="h-5 w-5 text-neutral-400" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default FollowedChannelsList;
