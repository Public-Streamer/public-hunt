-- Add unique constraint on event_participants to prevent duplicates
ALTER TABLE event_participants 
ADD CONSTRAINT unique_event_participant 
UNIQUE (event_id, user_id);

-- Clean up any existing duplicate records first
DELETE FROM event_participants 
WHERE id NOT IN (
  SELECT MIN(id) 
  FROM event_participants 
  GROUP BY event_id, user_id
);