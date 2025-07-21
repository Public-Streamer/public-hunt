-- Re-run the test data population for Public Streamer MVP
-- This will add the missing seed data that should have been populated

-- First, let's add some advertiser users and ads
DO $$
DECLARE
    advertiser_user_id uuid;
    advertiser_profile_id uuid;
    i integer;
    j integer;
BEGIN
    -- Create 10 advertiser users with associated profiles and ads
    FOR i IN 1..10 LOOP
        -- Insert advertiser user profile
        INSERT INTO user_profiles (
            id, 
            user_id, 
            username, 
            display_name, 
            bio,
            is_company_account,
            company_name
        ) VALUES (
            gen_random_uuid(),
            gen_random_uuid(), -- This would normally be from auth.users
            'advertiser_' || i,
            'Advertiser Company ' || i,
            'Professional advertising company specializing in digital marketing',
            true,
            'AdCorp ' || i
        ) RETURNING id, user_id INTO advertiser_profile_id, advertiser_user_id;

        -- Create 3 ads for each advertiser
        FOR j IN 1..3 LOOP
            INSERT INTO ads (
                id,
                user_id,
                title,
                description,
                budget,
                ad_type,
                status,
                start_date,
                end_date,
                media_urls,
                target_channels
            ) VALUES (
                gen_random_uuid(),
                advertiser_user_id,
                'Premium Ad Campaign ' || i || '-' || j,
                'High-impact advertising campaign targeting streaming audiences with engaging content and measurable results.',
                (RANDOM() * 5000 + 500)::numeric(10,2),
                CASE (j % 3) 
                    WHEN 0 THEN 'video'
                    WHEN 1 THEN 'banner'
                    ELSE 'sponsored_content'
                END,
                CASE (j % 2)
                    WHEN 0 THEN 'active'
                    ELSE 'pending'
                END,
                CURRENT_DATE + (j - 1) * INTERVAL '1 day',
                CURRENT_DATE + (j + 7) * INTERVAL '1 day',
                ARRAY['https://example.com/ad' || i || '-' || j || '.jpg'],
                ARRAY[]::uuid[]
            );
        END LOOP;
    END LOOP;
END $$;

-- Add creator users with channels and events
DO $$
DECLARE
    creator_user_id uuid;
    creator_profile_id uuid;
    channel_id uuid;
    i integer;
    j integer;
    k integer;
BEGIN
    -- Create 5 creator users with channels and events
    FOR i IN 1..5 LOOP
        -- Insert creator user profile
        INSERT INTO user_profiles (
            id,
            user_id,
            username,
            display_name,
            bio,
            profile_picture_url,
            followers_count,
            following_count
        ) VALUES (
            gen_random_uuid(),
            gen_random_uuid(), -- This would normally be from auth.users
            'creator_' || i,
            'Creator ' || i,
            'Content creator passionate about live streaming and community building.',
            'https://example.com/avatar' || i || '.jpg',
            (RANDOM() * 10000 + 100)::integer,
            (RANDOM() * 1000 + 50)::integer
        ) RETURNING id, user_id INTO creator_profile_id, creator_user_id;

        -- Create 4 channels for each creator
        FOR j IN 1..4 LOOP
            INSERT INTO channels (
                id,
                user_id,
                name,
                description,
                category,
                owner_first_name,
                owner_last_name,
                owner_email,
                media_urls
            ) VALUES (
                gen_random_uuid(),
                creator_user_id,
                'Channel ' || i || '-' || j || ': ' || 
                CASE (j % 4)
                    WHEN 0 THEN 'Gaming Hub'
                    WHEN 1 THEN 'Music Live'
                    WHEN 2 THEN 'Tech Talk'
                    ELSE 'Lifestyle Vlogs'
                END,
                'Engaging ' ||
                CASE (j % 4)
                    WHEN 0 THEN 'gaming content with live gameplay, reviews, and community events'
                    WHEN 1 THEN 'music performances, covers, and live jam sessions'
                    WHEN 2 THEN 'technology discussions, product reviews, and tutorials'
                    ELSE 'lifestyle content, daily vlogs, and personal stories'
                END,
                CASE (j % 4)
                    WHEN 0 THEN 'gaming'
                    WHEN 1 THEN 'music'
                    WHEN 2 THEN 'technology'
                    ELSE 'lifestyle'
                END,
                'Creator',
                'User ' || i,
                'creator' || i || '@example.com',
                ARRAY['https://example.com/channel' || i || '-' || j || '.jpg']
            ) RETURNING id INTO channel_id;

            -- Create 2 events for each channel
            FOR k IN 1..2 LOOP
                INSERT INTO events (
                    id,
                    name,
                    description,
                    date,
                    time,
                    location,
                    category,
                    ticket_price,
                    channel_id,
                    created_by,
                    is_live,
                    viewer_count,
                    media_urls,
                    max_participants
                ) VALUES (
                    gen_random_uuid(),
                    'Event ' || i || '-' || j || '-' || k || ': ' ||
                    CASE ((i + j + k) % 6)
                        WHEN 0 THEN 'Live Gaming Tournament'
                        WHEN 1 THEN 'Music Concert'
                        WHEN 2 THEN 'Tech Product Launch'
                        WHEN 3 THEN 'Cooking Masterclass'
                        WHEN 4 THEN 'Fitness Workshop'
                        ELSE 'Q&A Session'
                    END,
                    'Join us for an exciting ' ||
                    CASE ((i + j + k) % 6)
                        WHEN 0 THEN 'gaming tournament with prizes and live commentary'
                        WHEN 1 THEN 'music concert featuring original songs and covers'
                        WHEN 2 THEN 'product launch with demos and exclusive previews'
                        WHEN 3 THEN 'cooking class with professional chef techniques'
                        WHEN 4 THEN 'fitness workshop for all skill levels'
                        ELSE 'interactive Q&A session with the community'
                    END,
                    CURRENT_DATE + ((i + j + k) % 30) * INTERVAL '1 day',
                    (8 + (i + j + k) % 12)::text || ':00:00',
                    CASE ((i + j) % 5)
                        WHEN 0 THEN 'New York, NY'
                        WHEN 1 THEN 'Los Angeles, CA'
                        WHEN 2 THEN 'Chicago, IL'
                        WHEN 3 THEN 'Austin, TX'
                        ELSE 'Miami, FL'
                    END,
                    CASE ((i + j + k) % 6)
                        WHEN 0 THEN 'gaming'
                        WHEN 1 THEN 'music'
                        WHEN 2 THEN 'technology'
                        WHEN 3 THEN 'lifestyle'
                        WHEN 4 THEN 'fitness'
                        ELSE 'education'
                    END,
                    CASE (k % 3)
                        WHEN 0 THEN 0.00
                        WHEN 1 THEN (RANDOM() * 50 + 10)::numeric(10,2)
                        ELSE (RANDOM() * 100 + 25)::numeric(10,2)
                    END,
                    channel_id,
                    creator_user_id,
                    CASE (k % 4) WHEN 0 THEN true ELSE false END, -- Some events are live
                    CASE WHEN (k % 4) = 0 THEN (RANDOM() * 1000 + 50)::integer ELSE 0 END,
                    ARRAY['https://example.com/event' || i || '-' || j || '-' || k || '.jpg'],
                    100 + (i * 50)
                );
            END LOOP;
        END LOOP;
    END LOOP;
END $$;

-- Add some past events
DO $$
DECLARE
    i integer;
BEGIN
    FOR i IN 1..10 LOOP
        INSERT INTO past_events (
            id,
            title,
            description,
            category,
            recorded_at,
            duration,
            view_count,
            thumbnail_url,
            video_url,
            visibility,
            tags,
            price
        ) VALUES (
            gen_random_uuid(),
            'Past Event ' || i || ': ' ||
            CASE (i % 5)
                WHEN 0 THEN 'Epic Gaming Marathon'
                WHEN 1 THEN 'Concert Under the Stars'
                WHEN 2 THEN 'Tech Innovation Summit'
                WHEN 3 THEN 'Cooking Championship'
                ELSE 'Community Meetup'
            END,
            'Recorded event featuring ' ||
            CASE (i % 5)
                WHEN 0 THEN 'hours of non-stop gaming action with multiple streamers'
                WHEN 1 THEN 'live music performances from talented artists'
                WHEN 2 THEN 'cutting-edge technology presentations and demos'
                WHEN 3 THEN 'competitive cooking with professional chefs'
                ELSE 'community discussions and networking opportunities'
            END,
            CASE (i % 5)
                WHEN 0 THEN 'gaming'
                WHEN 1 THEN 'music'
                WHEN 2 THEN 'technology'
                WHEN 3 THEN 'lifestyle'
                ELSE 'community'
            END,
            CURRENT_TIMESTAMP - (i * INTERVAL '1 week'),
            (60 + (i % 3) * 30), -- Duration in minutes
            (RANDOM() * 5000 + 500)::integer,
            'https://example.com/thumbnail' || i || '.jpg',
            'https://example.com/video' || i || '.mp4',
            'public',
            ARRAY[
                CASE (i % 5)
                    WHEN 0 THEN 'gaming'
                    WHEN 1 THEN 'music'
                    WHEN 2 THEN 'tech'
                    WHEN 3 THEN 'cooking'
                    ELSE 'community'
                END,
                'recorded',
                'popular'
            ],
            CASE (i % 3)
                WHEN 0 THEN 0
                WHEN 1 THEN (RANDOM() * 20 + 5)::numeric(10,2)
                ELSE (RANDOM() * 50 + 15)::numeric(10,2)
            END
        );
    END LOOP;
END $$;