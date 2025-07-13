-- Clean up test events with null created_by
DELETE FROM events WHERE created_by IS NULL;