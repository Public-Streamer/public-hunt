-- Create tickets table
CREATE TABLE IF NOT EXISTS tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES events(id),
    user_id UUID REFERENCES user_profiles(user_id),
    stripe_payment_intent_id TEXT UNIQUE,
    qr_code TEXT, -- base64 data URI of the QR code image
    status TEXT DEFAULT 'active', -- active, used, refunded
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

-- Policies
-- Users can view their own tickets
CREATE POLICY "Users can view their own tickets" ON tickets
    FOR SELECT
    USING (
        user_id = auth.uid()
    );

-- Hosts can view tickets for their events
CREATE POLICY "Hosts can view tickets for their events" ON tickets
    FOR SELECT
    USING (
        event_id IN (
            SELECT id FROM events WHERE host_id = auth.uid()
        )
    );

-- Service role can do everything
