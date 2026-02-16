-- Migration for Host Analytics Dashboard

-- Create host_analytics table
CREATE TABLE host_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total_revenue NUMERIC DEFAULT 0.00,
  total_events INTEGER DEFAULT 0,
  total_viewers INTEGER DEFAULT 0,
  total_stream_time INTEGER DEFAULT 0, -- in minutes
  average_rating NUMERIC DEFAULT 0.00,
  last_updated TIMESTAMP DEFAULT NOW()
);

-- Create payment_transactions table
CREATE TABLE payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  host_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  platform_fee NUMERIC NOT NULL,
  net_amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'USD',
  payment_method TEXT,
  status TEXT DEFAULT 'completed',
  stripe_payment_id TEXT,
  stripe_charge_id TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create stream_performance table
CREATE TABLE stream_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  stream_id UUID REFERENCES event_streams(id) ON DELETE SET NULL,
  timestamp TIMESTAMP DEFAULT NOW(),
  viewer_count INTEGER DEFAULT 0,
  average_bitrate NUMERIC,
  connection_quality TEXT,
  buffer_events INTEGER DEFAULT 0,
  resolution TEXT,
  fps NUMERIC,
  dropped_frames INTEGER DEFAULT 0
);

-- Create indexes for performance
CREATE INDEX idx_host_analytics_host_id ON host_analytics(host_id);
CREATE INDEX idx_payment_transactions_host_id ON payment_transactions(host_id);
CREATE INDEX idx_payment_transactions_event_id ON payment_transactions(event_id);
CREATE INDEX idx_stream_performance_event_id ON stream_performance(event_id);
CREATE INDEX idx_stream_performance_timestamp ON stream_performance(timestamp);

-- Add revenue tracking to events table
ALTER TABLE events ADD COLUMN IF NOT EXISTS total_revenue NUMERIC DEFAULT 0.00;
ALTER TABLE events ADD COLUMN IF NOT EXISTS ticket_sales INTEGER DEFAULT 0;
ALTER TABLE events ADD COLUMN IF NOT EXISTS average_viewer_count INTEGER DEFAULT 0;

-- Create RLS policies for new tables
ALTER TABLE host_analytics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Hosts can view their own analytics" ON host_analytics
  FOR SELECT USING (auth.uid() = host_id);

ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Hosts can view their own transactions" ON payment_transactions
  FOR SELECT USING (auth.uid() = host_id);

ALTER TABLE stream_performance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Hosts can view their event performance" ON stream_performance
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = stream_performance.event_id
      AND events.created_by = auth.uid()
    )
  );