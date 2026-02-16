import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { useAppContext } from '@/contexts/AppContext';
import { useToast } from '@/hooks/use-toast';
import { Heart, Loader2, Users } from 'lucide-react';

interface FollowButtonProps {
    hostId: string;
    hostName?: string;
    showCount?: boolean;
    size?: 'sm' | 'default' | 'lg';
}

export const FollowButton: React.FC<FollowButtonProps> = ({
    hostId,
    hostName,
    showCount = true,
    size = 'default'
}) => {
    const [isFollowing, setIsFollowing] = useState(false);
    const [followerCount, setFollowerCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const { user } = useAppContext();
    const { toast } = useToast();

    useEffect(() => {
        const checkFollowStatus = async () => {
            try {
                // Get follower count
                const { count: totalFollowers } = await supabase
                    .from('followers' as any)
                    .select('*', { count: 'exact', head: true })
                    .eq('host_id', hostId);

                setFollowerCount(totalFollowers || 0);

                // Check if current user follows
                if (user) {
                    const { data } = await supabase
                        .from('followers' as any)
                        .select('id')
                        .eq('follower_id', user.id)
                        .eq('host_id', hostId)
                        .maybeSingle();

                    setIsFollowing(!!data);
                }
            } catch (err) {
                console.error('Error checking follow status:', err);
            } finally {
                setLoading(false);
            }
        };

        checkFollowStatus();
    }, [hostId, user]);

    const handleToggleFollow = async () => {
        if (!user) {
            toast({
                title: 'Sign In Required',
                description: 'Please sign in to follow channels.',
                variant: 'destructive'
            });
            return;
        }

        if (user.id === hostId) {
            toast({
                title: 'Cannot Follow Yourself',
                description: 'You cannot follow your own channel.',
                variant: 'destructive'
            });
            return;
        }

        setActionLoading(true);

        try {
            if (isFollowing) {
                // Unfollow
                const { error } = await supabase
                    .from('followers' as any)
                    .delete()
                    .eq('follower_id', user.id)
                    .eq('host_id', hostId);

                if (error) throw error;

                setIsFollowing(false);
                setFollowerCount(prev => Math.max(0, prev - 1));
                toast({
                    title: 'Unfollowed',
                    description: hostName ? `You unfollowed ${hostName}` : 'Unfollowed successfully',
                });
            } else {
                // Follow
                const { error } = await supabase
                    .from('followers' as any)
                    .insert({
                        follower_id: user.id,
                        host_id: hostId
                    });

                if (error) throw error;

                setIsFollowing(true);
                setFollowerCount(prev => prev + 1);
                toast({
                    title: 'Following!',
                    description: hostName ? `You are now following ${hostName}` : 'Following successfully',
                });
            }
        } catch (err) {
            console.error('Error toggling follow:', err);
            toast({
                title: 'Error',
                description: 'Failed to update follow status.',
                variant: 'destructive'
            });
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) {
        return (
            <Button variant="outline" size={size} disabled>
                <Loader2 className="h-4 w-4 animate-spin" />
            </Button>
        );
    }

    return (
        <div className="flex items-center gap-2">
            <Button
                variant={isFollowing ? 'default' : 'outline'}
                size={size}
                onClick={handleToggleFollow}
                disabled={actionLoading}
                className={isFollowing ? 'bg-pink-600 hover:bg-pink-700' : ''}
            >
                {actionLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                    <Heart className={`h-4 w-4 mr-2 ${isFollowing ? 'fill-current' : ''}`} />
                )}
                {isFollowing ? 'Following' : 'Follow'}
            </Button>
            {showCount && (
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {followerCount.toLocaleString()}
                </span>
            )}
        </div>
    );
};

export default FollowButton;
