-- Add simplified seed data that doesn't require auth.users entries
-- This adds test data for channels, events, ads, and past events using existing user IDs

-- Check if we have existing users to work with
DO $$
DECLARE
    existing_user_count integer;
    sample_user_id uuid;
BEGIN
    -- Check existing users
    SELECT COUNT(*) INTO existing_user_count FROM user_profiles;
    
    IF existing_user_count > 0 THEN
        -- Get a sample user ID to use for creating content
        SELECT user_id INTO sample_user_id FROM user_profiles LIMIT 1;
        
        -- Add more channels
        INSERT INTO channels (
            id, user_id, name, description, category, 
            owner_first_name, owner_last_name, owner_email, media_urls
        ) VALUES 
        (gen_random_uuid(), sample_user_id, 'Gaming Central Hub', 'The ultimate destination for gaming content, live streams, and community events', 'gaming', 'Gaming', 'Master', 'gaming@example.com', ARRAY['https://picsum.photos/800/600?random=1']),
        (gen_random_uuid(), sample_user_id, 'Music Live Studio', 'Live music performances, concerts, and musical collaborations', 'music', 'Music', 'Producer', 'music@example.com', ARRAY['https://picsum.photos/800/600?random=2']),
        (gen_random_uuid(), sample_user_id, 'Tech Innovation Channel', 'Latest technology trends, product reviews, and tech discussions', 'technology', 'Tech', 'Expert', 'tech@example.com', ARRAY['https://picsum.photos/800/600?random=3']),
        (gen_random_uuid(), sample_user_id, 'Lifestyle & Wellness', 'Health, fitness, cooking, and lifestyle content for modern living', 'lifestyle', 'Lifestyle', 'Coach', 'lifestyle@example.com', ARRAY['https://picsum.photos/800/600?random=4']),
        (gen_random_uuid(), sample_user_id, 'Educational Hub', 'Learning content, tutorials, and educational live streams', 'education', 'Education', 'Teacher', 'education@example.com', ARRAY['https://picsum.photos/800/600?random=5']);

        -- Add more events (some live, some scheduled)
        INSERT INTO events (
            id, name, description, date, time, location, category, 
            ticket_price, created_by, is_live, viewer_count, media_urls
        ) VALUES 
        (gen_random_uuid(), 'Live Gaming Tournament Championship', 'Epic gaming tournament with multiple players competing for the championship title', CURRENT_DATE, '20:00:00', 'Online Arena', 'gaming', 25.00, sample_user_id, true, 1547, ARRAY['https://picsum.photos/800/600?random=10']),
        (gen_random_uuid(), 'Music Concert Under the Stars', 'Live outdoor concert featuring indie artists and bands', CURRENT_DATE + 1, '19:30:00', 'Central Park, NY', 'music', 35.00, sample_user_id, false, 0, ARRAY['https://picsum.photos/800/600?random=11']),
        (gen_random_uuid(), 'Tech Product Launch Event', 'Exclusive launch of the latest tech innovations and gadgets', CURRENT_DATE + 2, '15:00:00', 'Tech Center, CA', 'technology', 0.00, sample_user_id, false, 0, ARRAY['https://picsum.photos/800/600?random=12']),
        (gen_random_uuid(), 'Cooking Masterclass with Chef Marco', 'Professional cooking techniques and recipe demonstrations', CURRENT_DATE + 3, '17:00:00', 'Culinary Studio', 'lifestyle', 45.00, sample_user_id, false, 0, ARRAY['https://picsum.photos/800/600?random=13']),
        (gen_random_uuid(), 'Live Fitness Bootcamp', 'High-energy fitness session with professional trainers', CURRENT_DATE, '18:00:00', 'Fitness Studio', 'lifestyle', 15.00, sample_user_id, true, 892, ARRAY['https://picsum.photos/800/600?random=14']),
        (gen_random_uuid(), 'Educational Q&A Session', 'Interactive learning session covering various educational topics', CURRENT_DATE + 4, '14:00:00', 'Learning Center', 'education', 0.00, sample_user_id, false, 0, ARRAY['https://picsum.photos/800/600?random=15']);

        -- Add past events
        INSERT INTO past_events (
            id, title, description, category, recorded_at, duration, view_count, 
            thumbnail_url, video_url, visibility, tags, price
        ) VALUES 
        (gen_random_uuid(), 'Epic Gaming Marathon 2024', 'A 12-hour gaming marathon featuring the best streamers and epic gameplay moments', 'gaming', CURRENT_TIMESTAMP - INTERVAL '1 week', 720, 15420, 'https://picsum.photos/800/600?random=20', 'https://example.com/gaming-marathon.mp4', 'public', ARRAY['gaming', 'marathon', 'epic'], 0.00),
        (gen_random_uuid(), 'Summer Music Festival Highlights', 'Best moments from the summer music festival with amazing performances', 'music', CURRENT_TIMESTAMP - INTERVAL '2 weeks', 180, 8934, 'https://picsum.photos/800/600?random=21', 'https://example.com/music-festival.mp4', 'public', ARRAY['music', 'festival', 'summer'], 12.99),
        (gen_random_uuid(), 'Tech Innovation Showcase 2024', 'Cutting-edge technology presentations and breakthrough innovations', 'technology', CURRENT_TIMESTAMP - INTERVAL '3 days', 150, 5678, 'https://picsum.photos/800/600?random=22', 'https://example.com/tech-showcase.mp4', 'public', ARRAY['tech', 'innovation', 'showcase'], 19.99),
        (gen_random_uuid(), 'Masterchef Championship Finals', 'The ultimate cooking competition with professional chefs', 'lifestyle', CURRENT_TIMESTAMP - INTERVAL '5 days', 240, 12456, 'https://picsum.photos/800/600?random=23', 'https://example.com/cooking-championship.mp4', 'public', ARRAY['cooking', 'championship', 'masterchef'], 24.99),
        (gen_random_uuid(), 'Community Fitness Challenge', 'Community-wide fitness challenge and workout sessions', 'lifestyle', CURRENT_TIMESTAMP - INTERVAL '10 days', 90, 3421, 'https://picsum.photos/800/600?random=24', 'https://example.com/fitness-challenge.mp4', 'public', ARRAY['fitness', 'community', 'challenge'], 0.00);

        -- Add some ads
        INSERT INTO ads (
            id, user_id, title, description, budget, ad_type, status, 
            start_date, end_date, media_urls
        ) VALUES 
        (gen_random_uuid(), sample_user_id, 'Premium Gaming Gear Sale', 'Best deals on gaming equipment, peripherals, and accessories', 2500.00, 'banner', 'active', CURRENT_DATE - 5, CURRENT_DATE + 10, ARRAY['https://picsum.photos/800/400?random=30']),
        (gen_random_uuid(), sample_user_id, 'Music Streaming Service Ad', 'Discover unlimited music with our premium streaming service', 1800.00, 'video', 'active', CURRENT_DATE - 3, CURRENT_DATE + 15, ARRAY['https://picsum.photos/800/400?random=31']),
        (gen_random_uuid(), sample_user_id, 'Latest Tech Gadgets', 'Revolutionary technology products that will change your life', 3200.00, 'sponsored_content', 'active', CURRENT_DATE - 7, CURRENT_DATE + 20, ARRAY['https://picsum.photos/800/400?random=32']),
        (gen_random_uuid(), sample_user_id, 'Fitness App Promotion', 'Transform your fitness journey with our mobile app', 1500.00, 'banner', 'pending', CURRENT_DATE, CURRENT_DATE + 12, ARRAY['https://picsum.photos/800/400?random=33']),
        (gen_random_uuid(), sample_user_id, 'Online Learning Platform', 'Expand your knowledge with our comprehensive course library', 2000.00, 'video', 'active', CURRENT_DATE - 2, CURRENT_DATE + 25, ARRAY['https://picsum.photos/800/400?random=34']);

    ELSE
        RAISE NOTICE 'No existing user profiles found. Cannot create sample content.';
    END IF;
END $$;