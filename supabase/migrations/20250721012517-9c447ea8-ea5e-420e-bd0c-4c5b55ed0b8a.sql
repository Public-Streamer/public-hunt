-- Fix existing events to have proper live status and add more test data
UPDATE events SET is_live = true WHERE name = 'Event Xenon 1';

-- Add more test events
INSERT INTO events (id, name, description, date, time, location, category, ticket_price, is_live, viewer_count, created_by, channel_id, media_urls)
VALUES 
  (gen_random_uuid(), 'Live Gaming Tournament', 'Epic gaming showdown happening now!', CURRENT_DATE, CURRENT_TIME, 'Online Arena', 'Gaming', 15.99, true, 234, (SELECT user_id FROM channels LIMIT 1), (SELECT id FROM channels LIMIT 1), ARRAY['https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800']),
  (gen_random_uuid(), 'Tech Conference 2024', 'Latest innovations in technology', CURRENT_DATE + INTERVAL '3 days', '14:00:00', 'Convention Center', 'Technology', 25.00, false, 0, (SELECT user_id FROM channels LIMIT 1), (SELECT id FROM channels LIMIT 1), ARRAY['https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800']),
  (gen_random_uuid(), 'Music Festival Live', 'Amazing artists performing live', CURRENT_DATE + INTERVAL '1 week', '19:00:00', 'Central Park', 'Music', 45.00, false, 0, (SELECT user_id FROM channels LIMIT 1), (SELECT id FROM channels LIMIT 1), ARRAY['https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800']);

-- Add past events
INSERT INTO past_events (id, title, description, category, channel_id, event_master_id, channel_master_id, recorded_at, duration, view_count, thumbnail_url, video_url, price, visibility)
VALUES 
  (gen_random_uuid(), 'Epic Battle Royale Championship', 'Last week''s intense gaming competition', 'Gaming', (SELECT id FROM channels LIMIT 1), (SELECT user_id FROM channels LIMIT 1), (SELECT user_id FROM channels LIMIT 1), NOW() - INTERVAL '3 days', 7200, 1500, 'https://images.unsplash.com/photo-1551103782-8ab07afd4c8d?w=800', 'https://example.com/video1', 12.99, 'public'),
  (gen_random_uuid(), 'Cooking Masterclass', 'Professional chef shares secret recipes', 'Education', (SELECT id FROM channels LIMIT 1), (SELECT user_id FROM channels LIMIT 1), (SELECT user_id FROM channels LIMIT 1), NOW() - INTERVAL '1 week', 5400, 890, 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800', 'https://example.com/video2', 8.99, 'public'),
  (gen_random_uuid(), 'Startup Pitch Competition', 'Entrepreneurs present innovative ideas', 'Business', (SELECT id FROM channels LIMIT 1), (SELECT user_id FROM channels LIMIT 1), (SELECT user_id FROM channels LIMIT 1), NOW() - INTERVAL '2 weeks', 9000, 2300, 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=800', 'https://example.com/video3', 0, 'public');

-- Add more channels
INSERT INTO channels (id, name, description, category, user_id, media_urls, owner_first_name, owner_last_name, owner_email)
VALUES 
  (gen_random_uuid(), 'Tech Innovators Hub', 'Latest technology trends and innovations', 'Technology', (SELECT user_id FROM channels LIMIT 1), ARRAY['https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=800'], 'Tech', 'Master', 'tech@example.com'),
  (gen_random_uuid(), 'Gaming Central', 'Ultimate destination for gaming content', 'Gaming', (SELECT user_id FROM channels LIMIT 1), ARRAY['https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800'], 'Game', 'Master', 'games@example.com'),
  (gen_random_uuid(), 'Creative Arts Studio', 'Inspiring artistic content and tutorials', 'Arts', (SELECT user_id FROM channels LIMIT 1), ARRAY['https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=800'], 'Art', 'Creator', 'art@example.com');