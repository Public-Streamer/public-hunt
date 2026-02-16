-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create ad_campaigns table (advertiser campaigns)
CREATE TABLE IF NOT EXISTS ad_campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    advertiser_id UUID REFERENCES user_profiles(user_id),
    name TEXT NOT NULL,
    budget_cents INTEGER NOT NULL DEFAULT 0, -- Total budget in cents
    spent_cents INTEGER NOT NULL DEFAULT 0,  -- Amount spent so far
    cpm_cents INTEGER NOT NULL DEFAULT 100,  -- Cost per 1000 impressions in cents
    status TEXT NOT NULL DEFAULT 'active', -- active, paused, exhausted
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create ads table (individual ad creatives)
CREATE TABLE IF NOT EXISTS ads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID REFERENCES ad_campaigns(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    image_url TEXT NOT NULL,
    click_url TEXT NOT NULL,
    cta_text TEXT DEFAULT 'Learn More',
    target_events UUID[], -- Array of event IDs to target (null = all events)
    status TEXT NOT NULL DEFAULT 'active', -- active, paused
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create ad_impressions table
CREATE TABLE IF NOT EXISTS ad_impressions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ad_id UUID REFERENCES ads(id) ON DELETE CASCADE,
    viewer_id UUID, -- Can be null for anonymous viewers
    event_id UUID REFERENCES events(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create ad_clicks table
CREATE TABLE IF NOT EXISTS ad_clicks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ad_id UUID REFERENCES ads(id) ON DELETE CASCADE,
    viewer_id UUID,
    event_id UUID REFERENCES events(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ad_impressions_ad_id ON ad_impressions(ad_id);
CREATE INDEX IF NOT EXISTS idx_ad_impressions_created_at ON ad_impressions(created_at);
CREATE INDEX IF NOT EXISTS idx_ad_clicks_ad_id ON ad_clicks(ad_id);
CREATE INDEX IF NOT EXISTS idx_ad_clicks_created_at ON ad_clicks(created_at);
CREATE INDEX IF NOT EXISTS idx_ads_campaign_id ON ads(campaign_id);

-- Enable RLS
ALTER TABLE ad_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_impressions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_clicks ENABLE ROW LEVEL SECURITY;

-- Policies for ad_campaigns
CREATE POLICY "Advertisers can view their own campaigns" ON ad_campaigns
    FOR SELECT USING (advertiser_id = auth.uid());

CREATE POLICY "Advertisers can create campaigns" ON ad_campaigns
    FOR INSERT WITH CHECK (advertiser_id = auth.uid());

CREATE POLICY "Advertisers can update their own campaigns" ON ad_campaigns
    FOR UPDATE USING (advertiser_id = auth.uid());

-- Policies for ads
CREATE POLICY "Advertisers can view their own ads" ON ads
    FOR SELECT USING (
        campaign_id IN (SELECT id FROM ad_campaigns WHERE advertiser_id = auth.uid())
    );

CREATE POLICY "Advertisers can create ads" ON ads
    FOR INSERT WITH CHECK (
        campaign_id IN (SELECT id FROM ad_campaigns WHERE advertiser_id = auth.uid())
    );

CREATE POLICY "Advertisers can update their own ads" ON ads
    FOR UPDATE USING (
        campaign_id IN (SELECT id FROM ad_campaigns WHERE advertiser_id = auth.uid())
    );

-- Policies for impressions/clicks (read-only for advertisers, insert via service role)
CREATE POLICY "Advertisers can view impressions for their ads" ON ad_impressions
    FOR SELECT USING (
        ad_id IN (
            SELECT a.id FROM ads a
            JOIN ad_campaigns c ON a.campaign_id = c.id
            WHERE c.advertiser_id = auth.uid()
        )
    );

CREATE POLICY "Advertisers can view clicks for their ads" ON ad_clicks
    FOR SELECT USING (
        ad_id IN (
            SELECT a.id FROM ads a
            JOIN ad_campaigns c ON a.campaign_id = c.id
            WHERE c.advertiser_id = auth.uid()
        )
    );
