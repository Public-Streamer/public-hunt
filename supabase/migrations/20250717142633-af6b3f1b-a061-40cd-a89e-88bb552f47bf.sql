-- Clean up any existing duplicate records first using row_number
WITH duplicates AS (
  SELECT id, 
         ROW_NUMBER() OVER (PARTITION BY event_id, user_id ORDER BY created_at DESC) as rn
  FROM event_participants
)
DELETE FROM event_participants 
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

-- Now add unique constraint on event_participants to prevent duplicates
ALTER TABLE event_participants 
ADD CONSTRAINT unique_event_participant 
UNIQUE (event_id, user_id);