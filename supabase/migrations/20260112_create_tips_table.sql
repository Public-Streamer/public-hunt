-- Create tips table
CREATE TABLE IF NOT EXISTS tips (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES events(id),
    tipper_id UUID REFERENCES user_profiles(user_id),
    host_id UUID REFERENCES user_profiles(user_id),
    amount DECIMAL(10,2) NOT NULL,
    stripe_payment_intent_id TEXT UNIQUE,
    message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE tips ENABLE ROW LEVEL SECURITY;

-- Policies
-- Hosts can view tips for their events
CREATE POLICY "Hosts can view tips received" ON tips
    FOR SELECT
    USING (
        host_id = auth.uid()
    );

-- Tippers can view their own tips
CREATE POLICY "Users can view their own tips sent" ON tips
    FOR SELECT
    USING (
        tipper_id = auth.uid()
    );

-- Service role (Edge Functions) can do anything (insert)
-- Implicitly allowed for service_role
