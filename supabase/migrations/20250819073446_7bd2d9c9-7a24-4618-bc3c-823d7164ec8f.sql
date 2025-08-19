-- Create function to get events with consolidated social data
CREATE OR REPLACE FUNCTION public.get_events_with_social_data(user_id_param uuid DEFAULT NULL)
RETURNS TABLE(
  id uuid,
  name text,
  description text,
  date date,
  time time,
  location text,
  category text,
  media_urls text[],
  created_at timestamptz,
  updated_at timestamptz,
  ticket_price numeric,
  channel_id uuid,
  livekit_room_name text,
  is_live boolean,
  stream_url text,
  viewer_count int,
  created_by uuid,
  max_participants int,
  stream_quality text,
  stripe_account_id text,
  payment_enabled boolean,
  slug text,
  slug_counter int,
  pinned_message text,
  metadata jsonb,
  report_count int,
  channel_name text,
  channel_description text,
  likes_count bigint,
  comments_count bigint,
  user_has_liked boolean,
  user_has_ticket boolean,
  recent_likers jsonb
)
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
SELECT 
  e.id,
  e.name,
  e.description,
  e.date,
  e.time,
  e.location,
  e.category,
  e.media_urls,
  e.created_at,
  e.updated_at,
  e.ticket_price,
  e.channel_id,
  e.livekit_room_name,
  e.is_live,
  e.stream_url,
  e.viewer_count,
  e.created_by,
  e.max_participants,
  e.stream_quality,
  e.stripe_account_id,
  e.payment_enabled,
  e.slug,
  e.slug_counter,
  e.pinned_message,
  e.metadata,
  e.report_count,
  c.name as channel_name,
  c.description as channel_description,
  COALESCE(likes_agg.likes_count, 0) as likes_count,
  COALESCE(comments_agg.comments_count, 0) as comments_count,
  CASE WHEN user_likes.event_id IS NOT NULL THEN true ELSE false END as user_has_liked,
  CASE WHEN user_tickets.event_id IS NOT NULL THEN true ELSE false END as user_has_ticket,
  COALESCE(recent_likes.recent_likers, '[]'::jsonb) as recent_likers
FROM events e
LEFT JOIN channels c ON e.channel_id = c.id
LEFT JOIN (
  SELECT 
    event_id, 
    COUNT(*) as likes_count 
  FROM event_likes 
  GROUP BY event_id
) likes_agg ON e.id = likes_agg.event_id
LEFT JOIN (
  SELECT 
    event_id, 
    COUNT(*) as comments_count 
  FROM event_comments 
  WHERE parent_comment_id IS NULL
  GROUP BY event_id
) comments_agg ON e.id = comments_agg.event_id
LEFT JOIN (
  SELECT DISTINCT event_id 
  FROM event_likes 
  WHERE user_id = user_id_param
) user_likes ON e.id = user_likes.event_id
LEFT JOIN (
  SELECT DISTINCT event_id 
  FROM tickets 
  WHERE user_id = user_id_param AND status = 'active'
) user_tickets ON e.id = user_tickets.event_id
LEFT JOIN (
  SELECT 
    event_id,
    jsonb_agg(
      jsonb_build_object(
        'name', display_name,
        'id', user_id
      )
      ORDER BY created_at DESC
    ) FILTER (WHERE display_name IS NOT NULL) as recent_likers
  FROM (
    SELECT DISTINCT ON (event_id, user_id) 
      event_id, 
      user_id, 
      display_name, 
      created_at
    FROM event_likes 
    ORDER BY event_id, user_id, created_at DESC
  ) unique_likes
  GROUP BY event_id
) recent_likes ON e.id = recent_likes.event_id
ORDER BY e.created_at DESC;
$$;