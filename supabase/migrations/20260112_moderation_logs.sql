-- Create moderation_logs table
CREATE TABLE IF NOT EXISTS moderation_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    moderator_id UUID NOT NULL REFERENCES user_profiles(user_id),
    target_user_id UUID REFERENCES user_profiles(user_id),
    action TEXT NOT NULL CHECK (action IN ('ban', 'timeout', 'delete', 'unban')),
    duration INTEGER, -- in seconds, for timeouts
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE moderation_logs ENABLE ROW LEVEL SECURITY;

-- Policies
-- Hosts and moderators can view logs for their events
CREATE POLICY "Hosts and moderators can view logs" ON moderation_logs
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM events
            WHERE events.id = moderation_logs.event_id
            AND events.created_by = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM event_participants
            WHERE event_participants.event_id = moderation_logs.event_id
            AND event_participants.user_id = auth.uid()
            AND event_participants.permissions @> '{"moderator"}'
        )
    );

-- Only system/functions can insert logs (via edge function)
-- But we'll allow authenticated users to insert if they are the moderator (for client-side optimistic updates if we were doing that, but we are using edge function)
-- Actually, we'll let the edge function handle insertion with service role, or if we want to allow direct insertion from RLS.
-- Since the implementation plan says "Update manage-event-messages Edge Function to ... log to moderation_logs table", we will rely on key access or specific policies.
-- Let's allow hosts to insert just in case, but primary usage is via function.
CREATE POLICY "Hosts can insert logs" ON moderation_logs
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM events
            WHERE events.id = moderation_logs.event_id
            AND events.created_by = auth.uid()
        )
    );
