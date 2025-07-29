-- Add performance indexes for common queries

-- Index for host Stripe account lookups (used in payment flow)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_host_stripe_accounts_user_id 
ON host_stripe_accounts(user_id);

-- Composite index for ticket ownership checks
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tickets_event_user 
ON tickets(event_id, user_id);

-- Index for individual ticket user lookups
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tickets_user_id 
ON tickets(user_id);

-- Index for event participant lookups
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_event_participants_event_id 
ON event_participants(event_id);

-- Composite index for event participant user checks
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_event_participants_event_user 
ON event_participants(event_id, user_id);

-- Index for channel subscription lookups
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_channel_subscriptions_user_id 
ON channel_subscriptions(user_id);

-- Add foreign key relationship for data integrity
-- This ensures event creators must have a user profile
ALTER TABLE events 
ADD CONSTRAINT fk_events_created_by_user_profiles 
FOREIGN KEY (created_by) REFERENCES user_profiles(user_id) 
ON DELETE SET NULL;

-- Index for event creator lookups (if not already exists)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_events_created_by 
ON events(created_by);