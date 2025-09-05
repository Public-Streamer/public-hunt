import React, { useState, useEffect } from 'react';
import { UserPlus, UserMinus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

interface FollowButtonProps {
  targetId: string;
  targetType: 'user' | 'channel' | 'event' | 'company';
  currentUserId?: string;
  className?: string;
}

const FollowButton: React.FC<FollowButtonProps> = ({
  targetId,
  targetType,
  currentUserId,
  className = '',
}) => {
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (currentUserId && targetId) {
      checkFollowStatus();
    }
  }, [currentUserId, targetId, targetType]);

  const checkFollowStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('user_follows')
        .select('id')
        .eq('follower_id', currentUserId)
        .eq('following_type', targetType)
        .eq('following_id', targetId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      setIsFollowing(!!data);
    } catch (error) {
      console.error('Error checking follow status:', error);
    }
  };

  const handleFollow = async () => {
    if (!currentUserId) {
      toast({
        title: 'Error',
        description: 'Please log in to follow',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      if (isFollowing) {
        const { error } = await supabase
          .from('user_follows')
          .delete()
          .eq('follower_id', currentUserId)
          .eq('following_type', targetType)
          .eq('following_id', targetId);

        if (error) throw error;
        setIsFollowing(false);
        toast({
          title: 'Success',
          description: `Unfollowed ${targetType}`,
        });
      } else {
        const { error } = await supabase.from('user_follows').insert({
          follower_id: currentUserId,
          following_type: targetType,
          following_id: targetId,
        });

        if (error) throw error;
        setIsFollowing(true);
        toast({
          title: 'Success',
          description: `Following ${targetType}`,
        });
      }
    } catch (error) {
      console.error('Error updating follow status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update follow status',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (currentUserId === targetId && targetType === 'user') {
    return null;
  }

  return (
    <Button
      onClick={handleFollow}
      disabled={loading}
      variant={isFollowing ? 'outline' : 'default'}
      size="sm"
      className={className}
    >
      {isFollowing ? (
        <>
          <UserMinus className="w-4 h-4 mr-2" />
          Unfollow
        </>
      ) : (
        <>
          <UserPlus className="w-4 h-4 mr-2" />
          Follow
        </>
      )}
    </Button>
  );
};

export default FollowButton;
