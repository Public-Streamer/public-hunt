
-- 1) Add streamer_counts for aggregate tracking
ALTER TABLE public.event_streams
  ADD COLUMN IF NOT EXISTS streamer_counts integer NOT NULL DEFAULT 0;

-- 2) Allow aggregator rows to omit streamer_id (stop requiring a single user owner)
ALTER TABLE public.event_streams
  ALTER COLUMN streamer_id DROP NOT NULL;

-- 3) Deduplicate event_streams so we can enforce a unique constraint
--    Keep the most recently active (or newest) row per event
WITH ranked AS (
  SELECT
    id,
    event_id,
    is_active,
    updated_at,
    created_at,
    ROW_NUMBER() OVER (
      PARTITION BY event_id
      ORDER BY
        CASE WHEN is_active THEN 0 ELSE 1 END,
        COALESCE(updated_at, created_at) DESC
    ) AS rn
  FROM public.event_streams
),
to_delete AS (
  SELECT id FROM ranked WHERE rn > 1
)
DELETE FROM public.event_streams es
USING to_delete d
WHERE es.id = d.id;

-- 4) Enforce a single row per event (required for ON CONFLICT in upsert)
ALTER TABLE public.event_streams
  ADD CONSTRAINT event_streams_one_per_event UNIQUE (event_id);

-- 5) Ensure updated_at refreshes automatically on any update
DROP TRIGGER IF EXISTS set_event_streams_updated_at ON public.event_streams;
CREATE TRIGGER set_event_streams_updated_at
BEFORE UPDATE ON public.event_streams
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 6) RLS policies for aggregator row management
-- Note: RLS already enabled on event_streams per your project state

-- 6a) Allow hosts (event creators) to INSERT aggregator row
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'event_streams'
      AND policyname = 'Hosts can insert event stream aggregator'
  ) THEN
    CREATE POLICY "Hosts can insert event stream aggregator"
    ON public.event_streams
    FOR INSERT
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.events e
        WHERE e.id = event_streams.event_id
          AND e.created_by = auth.uid()
      )
    );
  END IF;
END$$;

-- 6b) Allow event participants (host or streamer role) to INSERT aggregator row
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'event_streams'
      AND policyname = 'Participants can insert event stream aggregator'
  ) THEN
    CREATE POLICY "Participants can insert event stream aggregator"
    ON public.event_streams
    FOR INSERT
    WITH CHECK (
      EXISTS (
        SELECT 1
        FROM public.event_participants ep
        WHERE ep.event_id = event_streams.event_id
          AND ep.user_id = auth.uid()
          AND ep.role IN ('host','streamer')
      )
    );
  END IF;
END$$;

-- 6c) Allow event participants (host or streamer role) to UPDATE aggregator row
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'event_streams'
      AND policyname = 'Participants can update event stream aggregator'
  ) THEN
    CREATE POLICY "Participants can update event stream aggregator"
    ON public.event_streams
    FOR UPDATE
    USING (
      EXISTS (
        SELECT 1
        FROM public.event_participants ep
        WHERE ep.event_id = event_streams.event_id
          AND ep.user_id = auth.uid()
          AND ep.role IN ('host','streamer')
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1
        FROM public.event_participants ep
        WHERE ep.event_id = event_streams.event_id
          AND ep.user_id = auth.uid()
          AND ep.role IN ('host','streamer')
      )
    );
  END IF;
END$$;

-- Note: You already have "Public can view active streams" SELECT policy. We leave it intact.

-- 7) Indexing
-- The UNIQUE(event_id) constraint creates a btree index automatically, satisfying fast lookups by event_id.
