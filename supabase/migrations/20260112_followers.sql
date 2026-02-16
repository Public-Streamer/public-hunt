-- Create followers table
CREATE TABLE IF NOT EXISTS followers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    follower_id UUID REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    host_id UUID REFERENCES user_profiles(user_id) ON DELETE CASCADE, -- The channel/host being followed
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(follower_id, host_id)
);

-- Enable RLS
ALTER TABLE followers ENABLE ROW LEVEL SECURITY;

-- Policies
-- Anyone can see follower counts (aggregate)
CREATE POLICY "Anyone can view followers" ON followers
    FOR SELECT USING (true);

-- Users can follow (insert)
CREATE POLICY "Users can follow hosts" ON followers
    FOR INSERT WITH CHECK (follower_id = auth.uid());

-- Users can unfollow (delete their own follows)
CREATE POLICY "Users can unfollow" ON followers
    FOR DELETE USING (follower_id = auth.uid());

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_followers_follower_id ON followers(follower_id);
CREATE INDEX IF NOT EXISTS idx_followers_host_id ON followers(host_id);
