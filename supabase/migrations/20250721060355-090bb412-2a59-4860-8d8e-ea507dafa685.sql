-- First get an existing user_id 
DO $$
DECLARE
    existing_user_id uuid;
BEGIN
    -- Get the first available user_id from channels
    SELECT user_id INTO existing_user_id FROM channels WHERE user_id IS NOT NULL LIMIT 1;
    
    -- If we have a user_id, proceed with adding data
    IF existing_user_id IS NOT NULL THEN
        -- Update existing events to be live
        UPDATE events SET is_live = true WHERE name = 'Event Xenon 1';
        
        -- Add more events with proper user_id
        INSERT INTO events (id, name, description, date, time, location, category, ticket_price, is_live, viewer_count, created_by, channel_id, media_urls)
        VALUES 
          (gen_random_uuid(), 'Live Gaming Tournament', 'Epic gaming showdown happening now!', CURRENT_DATE, CURRENT_TIME, 'Online Arena', 'Gaming', 15.99, true, 234, existing_user_id, (SELECT id FROM channels WHERE user_id = existing_user_id LIMIT 1), ARRAY['https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800']),
          (gen_random_uuid(), 'Tech Conference 2024', 'Latest innovations in technology', CURRENT_DATE + INTERVAL '3 days', '14:00:00', 'Convention Center', 'Technology', 25.00, false, 0, existing_user_id, (SELECT id FROM channels WHERE user_id = existing_user_id LIMIT 1), ARRAY['https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800']),
          (gen_random_uuid(), 'Music Festival Live', 'Amazing artists performing live', CURRENT_DATE + INTERVAL '1 week', '19:00:00', 'Central Park', 'Music', 45.00, false, 0, existing_user_id, (SELECT id FROM channels WHERE user_id = existing_user_id LIMIT 1), ARRAY['https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800']);

        -- Add past events
        INSERT INTO past_events (id, title, description, category, channel_id, event_master_id, channel_master_id, recorded_at, duration, view_count, thumbnail_url, video_url, price, visibility)
        VALUES 
          (gen_random_uuid(), 'Epic Battle Royale Championship', 'Last week''s intense gaming competition', 'Gaming', (SELECT id FROM channels WHERE user_id = existing_user_id LIMIT 1), existing_user_id, existing_user_id, NOW() - INTERVAL '3 days', 7200, 1500, 'https://images.unsplash.com/photo-1551103782-8ab07afd4c8d?w=800', 'https://example.com/video1', 12.99, 'public'),
          (gen_random_uuid(), 'Cooking Masterclass', 'Professional chef shares secret recipes', 'Education', (SELECT id FROM channels WHERE user_id = existing_user_id LIMIT 1), existing_user_id, existing_user_id, NOW() - INTERVAL '1 week', 5400, 890, 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800', 'https://example.com/video2', 8.99, 'public'),
          (gen_random_uuid(), 'Startup Pitch Competition', 'Entrepreneurs present innovative ideas', 'Business', (SELECT id FROM channels WHERE user_id = existing_user_id LIMIT 1), existing_user_id, existing_user_id, NOW() - INTERVAL '2 weeks', 9000, 2300, 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=800', 'https://example.com/video3', 0, 'public');
    END IF;
END $$;