-- Create event_templates table
CREATE TABLE IF NOT EXISTS event_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES user_profiles(user_id),
    name TEXT NOT NULL,
    description TEXT,
    config JSONB NOT NULL, -- stores event settings: ticket_price, media_urls, location, etc.
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE event_templates ENABLE ROW LEVEL SECURITY;

-- Policies
-- Users can view their own templates
CREATE POLICY "Users can view their own templates" ON event_templates
    FOR SELECT USING (user_id = auth.uid());

-- Users can create their own templates
CREATE POLICY "Users can create templates" ON event_templates
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users can update their own templates
CREATE POLICY "Users can update their own templates" ON event_templates
    FOR UPDATE USING (user_id = auth.uid());

-- Users can delete their own templates
CREATE POLICY "Users can delete their own templates" ON event_templates
    FOR DELETE USING (user_id = auth.uid());

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_event_templates_user_id ON event_templates(user_id);
