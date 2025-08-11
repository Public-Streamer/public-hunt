-- Add RLS policy for event hosts to delete chat messages
CREATE POLICY "Event hosts can delete chat messages" 
ON public.event_chat_messages 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 
    FROM events 
    WHERE events.id = event_chat_messages.event_id 
    AND events.created_by = auth.uid()
  )
);