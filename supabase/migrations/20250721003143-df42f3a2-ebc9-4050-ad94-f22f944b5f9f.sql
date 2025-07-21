-- Generate comprehensive test data for Public Streamer MVP with unique usernames

-- First, let's create 100 test users for ads with unique timestamps
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_user_meta_data)
SELECT 
  gen_random_uuid(),
  'advertiser' || (i + 1000) || '@publicstreamer.com',
  crypt('password123', gen_salt('bf')),
  now(),
  now() - (random() * interval '6 months'),
  now() - (random() * interval '30 days'),
  json_build_object(
    'username', 'advertiser' || (i + 1000),
    'display_name', 'Advertiser ' || (i + 1000)
  )::jsonb
FROM generate_series(1, 100) as i;

-- Create 25 test users for channels and events with unique timestamps
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_user_meta_data)
SELECT 
  gen_random_uuid(),
  'creator' || (i + 2000) || '@publicstreamer.com',
  crypt('password123', gen_salt('bf')),
  now(),
  now() - (random() * interval '1 year'),
  now() - (random() * interval '7 days'),
  json_build_object(
    'username', 'creator' || (i + 2000),
    'display_name', 'Creator ' || (i + 2000)
  )::jsonb
FROM generate_series(1, 25) as i;

-- Create user profiles for all new test users
INSERT INTO user_profiles (id, user_id, username, display_name, bio, location, website, profile_picture_url, cover_photo_url, followers_count, following_count, friends_count)
SELECT 
  gen_random_uuid(),
  au.id,
  au.raw_user_meta_data->>'username',
  au.raw_user_meta_data->>'display_name',
  CASE 
    WHEN au.email LIKE 'advertiser%' THEN 'Professional advertiser specializing in ' || (ARRAY['tech', 'lifestyle', 'gaming', 'fitness', 'travel', 'food', 'fashion', 'music'])[floor(random() * 8 + 1)] || ' content.'
    ELSE 'Content creator passionate about ' || (ARRAY['live streaming', 'gaming', 'music', 'art', 'cooking', 'fitness', 'tech reviews', 'travel'])[floor(random() * 8 + 1)] || '.'
  END,
  (ARRAY['New York, NY', 'Los Angeles, CA', 'Chicago, IL', 'Houston, TX', 'Phoenix, AZ', 'Philadelphia, PA', 'San Antonio, TX', 'San Diego, CA', 'Dallas, TX', 'Austin, TX'])[floor(random() * 10 + 1)],
  CASE 
    WHEN random() > 0.5 THEN 'https://www.' || (au.raw_user_meta_data->>'username') || '.com'
    ELSE NULL
  END,
  'https://api.dicebear.com/7.x/avataaars/svg?seed=' || (au.raw_user_meta_data->>'username'),
  'https://picsum.photos/800/200?random=' || extract(epoch from au.created_at)::integer,
  floor(random() * 10000) + 100,
  floor(random() * 1000) + 50,
  floor(random() * 500) + 25
FROM auth.users au
WHERE au.email LIKE '%@publicstreamer.com' AND au.created_at > NOW() - interval '1 minute';

-- Generate 1000 test ads from 100 advertiser users
WITH advertiser_users AS (
  SELECT au.id as user_id, up.username
  FROM auth.users au
  JOIN user_profiles up ON au.id = up.user_id
  WHERE au.email LIKE 'advertiser%@publicstreamer.com'
  AND au.created_at > NOW() - interval '1 minute'
  LIMIT 100
),
ad_data AS (
  SELECT 
    au.user_id,
    au.username,
    i as ad_number,
    (ARRAY['video', 'image', 'carousel'])[floor(random() * 3 + 1)] as ad_type,
    (ARRAY['Tech & Gadgets', 'Fashion & Style', 'Health & Fitness', 'Food & Dining', 'Travel & Adventure', 'Gaming', 'Music & Entertainment', 'Home & Garden', 'Sports', 'Education'])[floor(random() * 10 + 1)] as category,
    (ARRAY['Brand Awareness', 'Lead Generation', 'Sales', 'Traffic', 'Engagement'])[floor(random() * 5 + 1)] as campaign_goal
  FROM advertiser_users au
  CROSS JOIN generate_series(1, 10) as i
)
INSERT INTO ads (
  id, user_id, title, description, ad_type, budget, start_date, end_date, 
  status, media_urls, created_at, updated_at
)
SELECT 
  gen_random_uuid(),
  ad.user_id,
  ad.campaign_goal || ' Campaign ' || ad.ad_number || ' - ' || ad.category,
  'Engaging ' || ad.ad_type || ' advertisement for ' || ad.category || ' targeting ' || 
  (ARRAY['young adults', 'professionals', 'families', 'students', 'seniors'])[floor(random() * 5 + 1)] || 
  '. Created by ' || ad.username || ' with proven results.',
  ad.ad_type,
  (random() * 9000 + 1000)::numeric(10,2), -- Budget between $1000-$10000
  CURRENT_DATE - (random() * 180)::integer, -- Start date within last 6 months
  CURRENT_DATE + (random() * 90)::integer,  -- End date within next 3 months
  (ARRAY['active', 'paused', 'completed', 'draft'])[floor(random() * 4 + 1)],
  CASE 
    WHEN ad.ad_type = 'video' THEN ARRAY['https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4']
    WHEN ad.ad_type = 'carousel' THEN ARRAY['https://picsum.photos/800/600?random=' || floor(random() * 1000), 'https://picsum.photos/800/600?random=' || floor(random() * 1000)]
    ELSE ARRAY['https://picsum.photos/800/600?random=' || floor(random() * 1000)]
  END,
  NOW() - (random() * interval '6 months'),
  NOW() - (random() * interval '7 days')
FROM ad_data ad;

-- Generate ad feedback for random new ads
WITH random_ads AS (
  SELECT a.id as ad_id 
  FROM ads a
  JOIN auth.users au ON a.user_id = au.id
  WHERE au.created_at > NOW() - interval '1 minute'
  ORDER BY random() 
  LIMIT 500
)
INSERT INTO ad_feedback (
  ad_id, viewer_session_id, star_rating, feedback_text, selected_tags, 
  viewer_ip, user_agent, is_flagged, is_moderated, created_at
)
SELECT 
  ra.ad_id,
  'session_' || floor(random() * 100000),
  floor(random() * 5 + 1), -- 1-5 star rating
  CASE floor(random() * 5)
    WHEN 0 THEN 'Great ad! Really caught my attention.'
    WHEN 1 THEN 'Good product showcase, would consider buying.'
    WHEN 2 THEN 'Interesting but not quite what I was looking for.'
    WHEN 3 THEN 'Well made advertisement with clear messaging.'
    ELSE 'Creative and engaging content.'
  END,
  (ARRAY[
    ARRAY['Funny', 'Creative'],
    ARRAY['Informative', 'Clear'],
    ARRAY['Great Product', 'High Quality'],
    ARRAY['Entertaining', 'Engaging'],
    ARRAY['Professional', 'Well Made']
  ])[floor(random() * 5 + 1)],
  '192.168.' || floor(random() * 255) || '.' || floor(random() * 255),
  'Mozilla/5.0 (compatible; TestBot/1.0)',
  random() < 0.05, -- 5% flagged
  true,
  NOW() - (random() * interval '30 days')
FROM random_ads ra
CROSS JOIN generate_series(1, floor(random() * 10 + 1)) -- 1-10 feedback per ad
LIMIT 2000;

-- Generate 500 channels from 25 creator users
WITH creator_users AS (
  SELECT au.id as user_id, up.username, up.display_name
  FROM auth.users au
  JOIN user_profiles up ON au.id = up.user_id
  WHERE au.email LIKE 'creator%@publicstreamer.com'
  AND au.created_at > NOW() - interval '1 minute'
  LIMIT 25
)
INSERT INTO channels (
  id, user_id, name, description, category, 
  owner_first_name, owner_last_name, owner_email, 
  media_urls, created_at, updated_at
)
SELECT 
  gen_random_uuid(),
  cu.user_id,
  cu.display_name || '''s ' || 
  (ARRAY['Gaming', 'Music', 'Tech', 'Cooking', 'Fitness', 'Art', 'Travel', 'Education', 'Comedy', 'Sports'])[floor(random() * 10 + 1)] || 
  ' Channel ' || channel_num,
  'Welcome to my channel! I create ' || 
  (ARRAY['amazing live content', 'interactive experiences', 'educational content', 'entertaining shows', 'community events'])[floor(random() * 5 + 1)] ||
  ' focused on ' || 
  (ARRAY['gaming', 'technology', 'lifestyle', 'creativity', 'learning', 'entertainment'])[floor(random() * 6 + 1)] ||
  '. Join our community and don''t miss any live streams!',
  (ARRAY['Gaming', 'Music', 'Technology', 'Cooking', 'Fitness', 'Art', 'Travel', 'Education', 'Comedy', 'Sports', 'Lifestyle', 'Business'])[floor(random() * 12 + 1)],
  split_part(cu.display_name, ' ', 1),
  split_part(cu.display_name, ' ', 2),
  'creator' || split_part(cu.username, 'creator', 2) || '@publicstreamer.com',
  ARRAY['https://picsum.photos/800/600?random=' || floor(random() * 1000)],
  NOW() - (random() * interval '1 year'),
  NOW() - (random() * interval '7 days')
FROM creator_users cu
CROSS JOIN generate_series(1, 20) as channel_num -- 20 channels per creator
LIMIT 500;

-- Generate channel subscribers for new channels
WITH new_channels AS (
  SELECT c.id as channel_id
  FROM channels c
  JOIN auth.users au ON c.user_id = au.id
  WHERE au.created_at > NOW() - interval '1 minute'
),
subscriber_sample AS (
  SELECT user_id FROM user_profiles ORDER BY random() LIMIT 100
)
INSERT INTO channel_subscribers (channel_id, subscriber_id, subscribed_at)
SELECT 
  nc.channel_id,
  ss.user_id,
  NOW() - (random() * interval '6 months')
FROM new_channels nc
CROSS JOIN subscriber_sample ss
WHERE random() < 0.1 -- 10% subscription rate
LIMIT 1000;

-- Generate 1000 events from the new channels
WITH new_channels AS (
  SELECT 
    c.id as channel_id,
    c.user_id,
    c.name as channel_name,
    c.category
  FROM channels c
  JOIN auth.users au ON c.user_id = au.id
  WHERE au.created_at > NOW() - interval '1 minute'
  ORDER BY random()
)
INSERT INTO events (
  id, name, description, date, time, location, category, 
  ticket_price, created_by, channel_id, max_participants,
  is_live, viewer_count, stream_quality, created_at, updated_at,
  livekit_room_name
)
SELECT 
  gen_random_uuid(),
  (ARRAY['Live', 'Special', 'Weekly', 'Premium', 'Exclusive'])[floor(random() * 5 + 1)] || ' ' ||
  nc.category || ' ' ||
  (ARRAY['Show', 'Stream', 'Event', 'Session', 'Experience'])[floor(random() * 5 + 1)] || ' ' ||
  event_num,
  'Join us for an incredible ' || nc.category || ' experience! ' ||
  (ARRAY[
    'Interactive Q&A session with live audience participation.',
    'Exclusive content you won''t find anywhere else.',
    'Behind the scenes access and special guests.',
    'Community event with prizes and giveaways.',
    'Educational content with hands-on demonstrations.',
    'Entertainment show with live performances.',
    'Workshop-style learning experience.'
  ])[floor(random() * 7 + 1)],
  CURRENT_DATE + (random() * 90)::integer, -- Future dates within 3 months
  TIME '10:00:00' + (random() * interval '12 hours'), -- Random time between 10 AM - 10 PM
  (ARRAY['Online', 'New York', 'Los Angeles', 'Chicago', 'Virtual Studio', 'Home Studio'])[floor(random() * 6 + 1)],
  nc.category,
  CASE 
    WHEN random() < 0.3 THEN 0 -- 30% free events
    ELSE (random() * 50 + 5)::numeric(10,2) -- $5-$55 paid events
  END,
  nc.user_id,
  nc.channel_id,
  floor(random() * 200 + 50)::integer, -- 50-250 max participants
  random() < 0.1, -- 10% currently live for more test data
  floor(random() * 1000)::integer, -- 0-999 viewers
  (ARRAY['HD', '4K', 'HD', 'SD'])[floor(random() * 4 + 1)],
  NOW() - (random() * interval '6 months'),
  NOW() - (random() * interval '7 days'),
  'event-' || gen_random_uuid()
FROM new_channels nc
CROSS JOIN generate_series(1, 2) as event_num -- 2 events per channel
LIMIT 1000;