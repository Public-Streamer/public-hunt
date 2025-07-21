-- Create seed data for channels, events, and past events

DO $$
DECLARE
    test_user_id uuid;
    test_channel_id uuid;
BEGIN
    -- First, create a test user profile if it doesn't exist
    INSERT INTO user_profiles (id, user_id, username, display_name, bio)
    VALUES (
        gen_random_uuid(),
        gen_random_uuid(),
        'demo_user',
        'Demo User',
        'This is a demo user for testing purposes'
    )
    ON CONFLICT (username) DO NOTHING
    RETURNING user_id INTO test_user_id;
    
    -- If no user was created (conflict), get the existing one
    IF test_user_id IS NULL THEN
        SELECT user_id INTO test_user_id 
        FROM user_profiles 
        WHERE username = 'demo_user' 
        LIMIT 1;
    END IF;
    
    -- If still no user, create a random one
    IF test_user_id IS NULL THEN
        test_user_id := gen_random_uuid();
        INSERT INTO user_profiles (id, user_id, username, display_name, bio)
        VALUES (
            gen_random_uuid(),
            test_user_id,
            'demo_user_' || substring(test_user_id::text from 1 for 8),
            'Demo User',
            'Demo user for testing'
        );
    END IF;
    
    -- Insert demo channels with the test user
    INSERT INTO channels (id, name, description, category, user_id, owner_first_name, owner_last_name, owner_email, media_urls)
    VALUES 
      (gen_random_uuid(), 'Tech Innovations Hub', 'Latest technology news and innovations', 'Technology', test_user_id, 'Alex', 'Johnson', 'alex@techhub.com', ARRAY['https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=800']),
      (gen_random_uuid(), 'Gaming Central', 'Epic gaming content and live streams', 'Gaming', test_user_id, 'Sam', 'Wilson', 'sam@gamingcentral.com', ARRAY['https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800']),
      (gen_random_uuid(), 'Music & Arts Studio', 'Creative content and live performances', 'Music', test_user_id, 'Maya', 'Rodriguez', 'maya@musicarts.com', ARRAY['https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800']),
      (gen_random_uuid(), 'Business Insights', 'Professional development and business tips', 'Business', test_user_id, 'David', 'Chen', 'david@bizinsights.com', ARRAY['https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=800'])
    ON CONFLICT (id) DO NOTHING;
    
    -- Get a channel ID for events
    SELECT id INTO test_channel_id FROM channels WHERE user_id = test_user_id LIMIT 1;
    
    -- Update existing events to be live
    UPDATE events SET is_live = true WHERE name IN ('Event Xenon 1', 'event with xenon 2');
    
    -- Insert more live events
    INSERT INTO events (id, name, description, date, time, location, category, ticket_price, is_live, viewer_count, created_by, channel_id, media_urls)
    VALUES 
      (gen_random_uuid(), 'Live Coding Session', 'Learn React development in real-time', CURRENT_DATE, CURRENT_TIME, 'Online Studio', 'Technology', 19.99, true, 156, test_user_id, test_channel_id, ARRAY['https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800']),
      (gen_random_uuid(), 'Music Production Workshop', 'Create beats and melodies live', CURRENT_DATE, CURRENT_TIME, 'Music Studio', 'Music', 29.99, true, 89, test_user_id, test_channel_id, ARRAY['https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800']),
      (gen_random_uuid(), 'Gaming Tournament Finals', 'Epic battle royale championship', CURRENT_DATE, CURRENT_TIME, 'Gaming Arena', 'Gaming', 15.99, true, 423, test_user_id, test_channel_id, ARRAY['https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800'])
    ON CONFLICT (id) DO NOTHING;
    
    -- Insert scheduled events
    INSERT INTO events (id, name, description, date, time, location, category, ticket_price, is_live, viewer_count, created_by, channel_id, media_urls)
    VALUES 
      (gen_random_uuid(), 'AI Workshop Series', 'Learn about artificial intelligence', CURRENT_DATE + INTERVAL '2 days', '15:00:00', 'Tech Center', 'Technology', 35.00, false, 0, test_user_id, test_channel_id, ARRAY['https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800']),
      (gen_random_uuid(), 'Digital Marketing Masterclass', 'Advanced marketing strategies', CURRENT_DATE + INTERVAL '5 days', '18:00:00', 'Conference Hall', 'Business', 50.00, false, 0, test_user_id, test_channel_id, ARRAY['https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=800']),
      (gen_random_uuid(), 'Jazz Night Live', 'Smooth jazz and blues performance', CURRENT_DATE + INTERVAL '1 week', '20:00:00', 'Jazz Club', 'Music', 25.00, false, 0, test_user_id, test_channel_id, ARRAY['https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800'])
    ON CONFLICT (id) DO NOTHING;
    
    -- Insert past events
    INSERT INTO past_events (id, title, description, category, channel_id, event_master_id, channel_master_id, recorded_at, duration, view_count, thumbnail_url, video_url, price, visibility)
    VALUES 
      (gen_random_uuid(), 'Web Development Bootcamp', 'Complete guide to modern web development', 'Technology', test_channel_id, test_user_id, test_user_id, NOW() - INTERVAL '2 days', 7200, 2100, 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800', 'https://example.com/video1', 39.99, 'public'),
      (gen_random_uuid(), 'Business Strategy Workshop', 'How to build successful business strategies', 'Business', test_channel_id, test_user_id, test_user_id, NOW() - INTERVAL '1 week', 5400, 1560, 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=800', 'https://example.com/video2', 29.99, 'public'),
      (gen_random_uuid(), 'Live Concert Experience', 'Amazing live music performance', 'Music', test_channel_id, test_user_id, test_user_id, NOW() - INTERVAL '10 days', 9000, 3200, 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800', 'https://example.com/video3', 15.99, 'public'),
      (gen_random_uuid(), 'Gaming Championship', 'Intense competitive gaming tournament', 'Gaming', test_channel_id, test_user_id, test_user_id, NOW() - INTERVAL '2 weeks', 10800, 5400, 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800', 'https://example.com/video4', 19.99, 'public'),
      (gen_random_uuid(), 'Photography Masterclass', 'Professional photography techniques', 'Education', test_channel_id, test_user_id, test_user_id, NOW() - INTERVAL '3 weeks', 6600, 890, 'https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?w=800', 'https://example.com/video5', 24.99, 'public')
    ON CONFLICT (id) DO NOTHING;
    
    RAISE NOTICE 'Successfully created seed data with user_id: %', test_user_id;
END $$;