-- Enhance user_posts table with additional columns for rich features
ALTER TABLE user_posts 
ADD COLUMN IF NOT EXISTS media_url TEXT,
ADD COLUMN IF NOT EXISTS media_type TEXT CHECK (media_type IN ('image', 'video')),
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS post_type TEXT DEFAULT 'post' CHECK (post_type IN ('post', 'event', 'channel', 'milestone')),
ADD COLUMN IF NOT EXISTS channel_id UUID,
ADD COLUMN IF NOT EXISTS event_id UUID,
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Create user_post_tags table for tagging users in posts
CREATE TABLE IF NOT EXISTS user_post_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES user_posts(id) ON DELETE CASCADE,
  tagged_user_id UUID NOT NULL,
  tagged_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on user_post_tags
ALTER TABLE user_post_tags ENABLE ROW LEVEL SECURITY;

-- Create policies for user_post_tags
CREATE POLICY "Users can view tags in posts they can see" ON user_post_tags
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_posts 
      WHERE user_posts.id = user_post_tags.post_id 
      AND (user_posts.user_id = auth.uid() OR auth.uid() IS NOT NULL)
    )
  );

CREATE POLICY "Users can create tags in their own posts" ON user_post_tags
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_posts 
      WHERE user_posts.id = user_post_tags.post_id 
      AND user_posts.user_id = auth.uid()
    )
    AND tagged_by = auth.uid()
  );

CREATE POLICY "Users can delete tags they created" ON user_post_tags
  FOR DELETE USING (tagged_by = auth.uid());

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_post_tags_post_id ON user_post_tags(post_id);
CREATE INDEX IF NOT EXISTS idx_user_post_tags_tagged_user ON user_post_tags(tagged_user_id);
CREATE INDEX IF NOT EXISTS idx_user_posts_channel_id ON user_posts(channel_id);
CREATE INDEX IF NOT EXISTS idx_user_posts_event_id ON user_posts(event_id);
CREATE INDEX IF NOT EXISTS idx_user_posts_post_type ON user_posts(post_type);
CREATE INDEX IF NOT EXISTS idx_user_posts_created_at ON user_posts(created_at DESC);