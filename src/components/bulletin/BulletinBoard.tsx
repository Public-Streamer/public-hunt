import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { formatDistanceToNow } from 'date-fns';
import { Loader2, Pin, MessageSquare } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface BulletinPost {
    id: string;
    title: string;
    content: string;
    is_pinned: boolean;
    created_at: string;
    author: {
        display_name: string;
        avatar_url: string;
    };
}

interface BulletinBoardProps {
    eventId: string;
}

export const BulletinBoard: React.FC<BulletinBoardProps> = ({ eventId }) => {
    const [posts, setPosts] = useState<BulletinPost[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPosts = async () => {
            try {
                const { data, error } = await supabase
                    .from('bulletin_posts' as any)
                    .select(`
                        id,
                        title,
                        content,
                        is_pinned,
                        created_at,
                        author:user_profiles!author_id (
                            display_name,
                            avatar_url
                        )
                    `)
                    .eq('event_id', eventId)
                    .order('is_pinned', { ascending: false })
                    .order('created_at', { ascending: false });

                if (error) throw error;
                setPosts(data || []);
            } catch (err) {
                console.error('Error fetching bulletin posts:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchPosts();

        // Subscribe to real-time updates
        const channel = supabase
            .channel(`bulletin:${eventId}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'bulletin_posts',
                filter: `event_id=eq.${eventId}`
            }, () => {
                fetchPosts(); // Refetch on any change
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [eventId]);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-pink-600" />
            </div>
        );
    }

    if (posts.length === 0) {
        return (
            <Card>
                <CardContent className="py-12 text-center">
                    <MessageSquare className="h-12 w-12 mx-auto text-neutral-300 mb-4" />
                    <p className="text-neutral-500">No updates yet</p>
                    <p className="text-sm text-neutral-400 mt-1">
                        The host hasn't posted any bulletins for this event.
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            {posts.map((post) => (
                <Card key={post.id} className={post.is_pinned ? 'border-pink-500' : ''}>
                    <CardHeader className="pb-2">
                        <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={post.author?.avatar_url} />
                                    <AvatarFallback>
                                        {post.author?.display_name?.charAt(0) || 'H'}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <CardTitle className="text-base flex items-center gap-2">
                                        {post.title}
                                        {post.is_pinned && (
                                            <Badge variant="secondary" className="text-xs">
                                                <Pin className="h-3 w-3 mr-1" />
                                                Pinned
                                            </Badge>
                                        )}
                                    </CardTitle>
                                    <p className="text-xs text-muted-foreground">
                                        {post.author?.display_name} • {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div
                            className="prose prose-sm max-w-none"
                            dangerouslySetInnerHTML={{ __html: post.content }}
                        />
                    </CardContent>
                </Card>
            ))}
        </div>
    );
};

export default BulletinBoard;
