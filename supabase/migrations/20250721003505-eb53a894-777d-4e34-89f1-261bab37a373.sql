-- Simplified test data generation for Public Streamer MVP

-- Create 100 test advertiser users
DO $$
DECLARE
    i INT;
    user_id UUID;
BEGIN
    FOR i IN 1..100 LOOP
        INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_user_meta_data)
        VALUES (
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
        ) RETURNING id INTO user_id;
        
        -- Create profile for this user
        INSERT INTO user_profiles (id, user_id, username, display_name, bio, location, profile_picture_url, cover_photo_url, followers_count, following_count, friends_count)
        VALUES (
            gen_random_uuid(),
            user_id,
            'advertiser' || (i + 1000),
            'Advertiser ' || (i + 1000),
            'Professional advertiser specializing in digital marketing.',
            'New York, NY',
            'https://api.dicebear.com/7.x/avataaars/svg?seed=advertiser' || (i + 1000),
            'https://picsum.photos/800/200?random=' || (i + 1000),
            floor(random() * 10000 + 100)::int,
            floor(random() * 1000 + 50)::int,
            floor(random() * 500 + 25)::int
        );
        
        -- Create 10 ads for each advertiser
        FOR j IN 1..10 LOOP
            INSERT INTO ads (
                id, user_id, title, description, ad_type, budget, start_date, end_date, 
                status, media_urls, created_at, updated_at
            ) VALUES (
                gen_random_uuid(),
                user_id,
                'Campaign ' || j || ' - Tech Product',
                'Engaging advertisement for tech products targeting young professionals.',
                'video',
                (random() * 9000 + 1000)::numeric(10,2),
                CURRENT_DATE - (random() * 180)::integer,
                CURRENT_DATE + (random() * 90)::integer,
                (ARRAY['active', 'paused', 'completed', 'draft'])[floor(random() * 4 + 1)::int],
                ARRAY['https://picsum.photos/800/600?random=' || (i * 10 + j)],
                NOW() - (random() * interval '6 months'),
                NOW() - (random() * interval '7 days')
            );
        END LOOP;
    END LOOP;
END $$;

-- Create 25 test creator users with channels and events
DO $$
DECLARE
    i INT;
    j INT;
    user_id UUID;
    channel_id UUID;
BEGIN
    FOR i IN 1..25 LOOP
        INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_user_meta_data)
        VALUES (
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
        ) RETURNING id INTO user_id;
        
        -- Create profile for this user
        INSERT INTO user_profiles (id, user_id, username, display_name, bio, location, profile_picture_url, cover_photo_url, followers_count, following_count, friends_count)
        VALUES (
            gen_random_uuid(),
            user_id,
            'creator' || (i + 2000),
            'Creator ' || (i + 2000),
            'Content creator passionate about live streaming and entertainment.',
            'Los Angeles, CA',
            'https://api.dicebear.com/7.x/avataaars/svg?seed=creator' || (i + 2000),
            'https://picsum.photos/800/200?random=' || (i + 2000),
            floor(random() * 10000 + 100)::int,
            floor(random() * 1000 + 50)::int,
            floor(random() * 500 + 25)::int
        );
        
        -- Create 20 channels for each creator
        FOR j IN 1..20 LOOP
            INSERT INTO channels (
                id, user_id, name, description, category, 
                owner_first_name, owner_last_name, owner_email, 
                media_urls, created_at, updated_at
            ) VALUES (
                gen_random_uuid(),
                user_id,
                'Creator ' || (i + 2000) || '''s Gaming Channel ' || j,
                'Welcome to my gaming channel! Amazing live content focused on gaming and entertainment.',
                'Gaming',
                'Creator',
                (i + 2000)::text,
                'creator' || (i + 2000) || '@publicstreamer.com',
                ARRAY['https://picsum.photos/800/600?random=' || (i * 20 + j)],
                NOW() - (random() * interval '1 year'),
                NOW() - (random() * interval '7 days')
            ) RETURNING id INTO channel_id;
            
            -- Create 2 events for each channel
            FOR k IN 1..2 LOOP
                INSERT INTO events (
                    id, name, description, date, time, location, category, 
                    ticket_price, created_by, channel_id, max_participants,
                    is_live, viewer_count, stream_quality, created_at, updated_at,
                    livekit_room_name
                ) VALUES (
                    gen_random_uuid(),
                    'Live Gaming Stream ' || k || ' - Creator ' || (i + 2000),
                    'Join us for an incredible gaming experience with live audience participation!',
                    CURRENT_DATE + (random() * 90)::integer,
                    TIME '14:00:00' + (random() * interval '8 hours'),
                    'Online',
                    'Gaming',
                    CASE WHEN random() < 0.3 THEN 0 ELSE (random() * 50 + 5)::numeric(10,2) END,
                    user_id,
                    channel_id,
                    floor(random() * 200 + 50)::int,
                    CASE WHEN random() < 0.1 THEN true ELSE false END,
                    floor(random() * 1000)::int,
                    'HD',
                    NOW() - (random() * interval '6 months'),
                    NOW() - (random() * interval '7 days'),
                    'event-' || gen_random_uuid()
                );
            END LOOP;
        END LOOP;
    END LOOP;
END $$;

-- Add some ad feedback
INSERT INTO ad_feedback (
    ad_id, viewer_session_id, star_rating, feedback_text, selected_tags, 
    viewer_ip, user_agent, is_flagged, is_moderated, created_at
)
SELECT 
    a.id,
    'session_' || floor(random() * 100000)::int,
    floor(random() * 5 + 1)::int,
    'Great ad! Really engaging content.',
    ARRAY['Creative', 'Engaging'],
    '192.168.1.100',
    'Mozilla/5.0 (compatible; TestBot/1.0)',
    false,
    true,
    NOW() - (random() * interval '30 days')
FROM ads a
ORDER BY random()
LIMIT 500;

-- Add some channel subscriptions
INSERT INTO channel_subscribers (channel_id, subscriber_id, subscribed_at)
SELECT 
    c.id,
    up.user_id,
    NOW() - (random() * interval '6 months')
FROM channels c
CROSS JOIN user_profiles up
WHERE random() < 0.02 -- 2% subscription rate to keep data manageable
LIMIT 1000;