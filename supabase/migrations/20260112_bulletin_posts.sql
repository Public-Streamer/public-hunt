-- Create bulletin_posts table
CREATE TABLE IF NOT EXISTS bulletin_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    author_id UUID REFERENCES user_profiles(user_id),
    title TEXT NOT NULL,
    content TEXT NOT NULL, -- HTML content
    is_pinned BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE bulletin_posts ENABLE ROW LEVEL SECURITY;

-- Policies
-- Anyone can view bulletin posts for events
CREATE POLICY "Anyone can view bulletin posts" ON bulletin_posts
    FOR SELECT USING (true);

-- Event hosts can create posts
CREATE POLICY "Hosts can create bulletin posts" ON bulletin_posts
    FOR INSERT WITH CHECK (
        event_id IN (
            SELECT id FROM events WHERE host_id = auth.uid() OR created_by = auth.uid()
        )
    );

-- Event hosts can update their posts
CREATE POLICY "Hosts can update their bulletin posts" ON bulletin_posts
    FOR UPDATE USING (
        author_id = auth.uid()
    );

-- Event hosts can delete their posts
CREATE POLICY "Hosts can delete their bulletin posts" ON bulletin_posts
    FOR DELETE USING (
        author_id = auth.uid()
    );

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_bulletin_posts_event_id ON bulletin_posts(event_id);
CREATE INDEX IF NOT EXISTS idx_bulletin_posts_created_at ON bulletin_posts(created_at DESC);
