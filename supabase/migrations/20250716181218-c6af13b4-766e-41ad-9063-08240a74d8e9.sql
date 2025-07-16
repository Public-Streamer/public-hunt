-- Create enum for channel roles
CREATE TYPE channel_role AS ENUM ('channel_master', 'channel_admin', 'member');

-- Create channel_permissions table to track user permissions for channels
CREATE TABLE channel_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
    role channel_role NOT NULL DEFAULT 'member',
    assigned_by UUID REFERENCES auth.users(id),
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, channel_id)
);

-- Enable RLS on channel_permissions
ALTER TABLE channel_permissions ENABLE ROW LEVEL SECURITY;

-- Create policies for channel_permissions
CREATE POLICY "Users can view channel permissions"
    ON channel_permissions FOR SELECT
    USING (true);

CREATE POLICY "Channel masters can manage permissions"
    ON channel_permissions FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM channel_permissions cp
            WHERE cp.channel_id = channel_permissions.channel_id
            AND cp.user_id = auth.uid()
            AND cp.role = 'channel_master'
        )
        OR
        EXISTS (
            SELECT 1 FROM channels c
            WHERE c.id = channel_permissions.channel_id
            AND c.user_id = auth.uid()
        )
    );

CREATE POLICY "Channel admins can manage member permissions"
    ON channel_permissions FOR ALL
    USING (
        (EXISTS (
            SELECT 1 FROM channel_permissions cp
            WHERE cp.channel_id = channel_permissions.channel_id
            AND cp.user_id = auth.uid()
            AND cp.role IN ('channel_master', 'channel_admin')
        )
        OR
        EXISTS (
            SELECT 1 FROM channels c
            WHERE c.id = channel_permissions.channel_id
            AND c.user_id = auth.uid()
        ))
        AND channel_permissions.role = 'member'
    );

-- Create trigger to automatically give channel creators master permissions
CREATE OR REPLACE FUNCTION create_channel_master_permission()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO channel_permissions (user_id, channel_id, role, assigned_by)
    VALUES (NEW.user_id, NEW.id, 'channel_master', NEW.user_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER channel_master_permission_trigger
    AFTER INSERT ON channels
    FOR EACH ROW
    EXECUTE FUNCTION create_channel_master_permission();

-- Create event_channel_requests table for pending channel assignment requests
CREATE TABLE event_channel_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
    requested_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by UUID REFERENCES auth.users(id),
    message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on event_channel_requests
ALTER TABLE event_channel_requests ENABLE ROW LEVEL SECURITY;

-- Create policies for event_channel_requests
CREATE POLICY "Users can view requests for their events"
    ON event_channel_requests FOR SELECT
    USING (
        auth.uid() = requested_by
        OR
        EXISTS (
            SELECT 1 FROM channel_permissions cp
            WHERE cp.channel_id = event_channel_requests.channel_id
            AND cp.user_id = auth.uid()
            AND cp.role IN ('channel_master', 'channel_admin')
        )
        OR
        EXISTS (
            SELECT 1 FROM channels c
            WHERE c.id = event_channel_requests.channel_id
            AND c.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create requests for their events"
    ON event_channel_requests FOR INSERT
    WITH CHECK (auth.uid() = requested_by);

CREATE POLICY "Channel masters and admins can manage requests"
    ON event_channel_requests FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM channel_permissions cp
            WHERE cp.channel_id = event_channel_requests.channel_id
            AND cp.user_id = auth.uid()
            AND cp.role IN ('channel_master', 'channel_admin')
        )
        OR
        EXISTS (
            SELECT 1 FROM channels c
            WHERE c.id = event_channel_requests.channel_id
            AND c.user_id = auth.uid()
        )
    );

-- Add channel_id to events table if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'events' 
        AND column_name = 'channel_id'
    ) THEN
        ALTER TABLE events ADD COLUMN channel_id UUID REFERENCES channels(id);
    END IF;
END $$;

-- Create updated_at trigger for channel_permissions
CREATE TRIGGER channel_permissions_updated_at
    BEFORE UPDATE ON channel_permissions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create updated_at trigger for event_channel_requests
CREATE TRIGGER event_channel_requests_updated_at
    BEFORE UPDATE ON event_channel_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();