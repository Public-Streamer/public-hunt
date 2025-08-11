-- 1) Create event_reports table, add report_count to events, RLS, trigger

-- Create enum types for reason and status if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'report_reason') THEN
    CREATE TYPE public.report_reason AS ENUM (
      'spam_scam',
      'hate_harassment',
      'sexual_nudity',
      'violence',
      'copyright_ip',
      'misleading',
      'other'
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'report_status') THEN
    CREATE TYPE public.report_status AS ENUM ('pending','reviewed','dismissed');
  END IF;
END $$;

-- Add report_count column to events if not exists
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS report_count integer NOT NULL DEFAULT 0;

-- Create event_reports table
CREATE TABLE IF NOT EXISTS public.event_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  reporter_user_id uuid NOT NULL,
  reason_category public.report_reason NOT NULL,
  reason_text text NULL,
  reporter_ip text NULL,
  user_agent text NULL,
  status public.report_status NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT event_reports_unique UNIQUE (event_id, reporter_user_id)
);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_event_reports_event_id ON public.event_reports(event_id);
CREATE INDEX IF NOT EXISTS idx_event_reports_reporter ON public.event_reports(reporter_user_id);
CREATE INDEX IF NOT EXISTS idx_event_reports_created_at ON public.event_reports(created_at);

-- Enable RLS
ALTER TABLE public.event_reports ENABLE ROW LEVEL SECURITY;

-- Only allow inserts by authenticated users who are not host/streamer of the event
CREATE POLICY IF NOT EXISTS "Viewers can file event reports" ON public.event_reports
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id = event_reports.event_id AND e.created_by = auth.uid()
  )
  AND NOT EXISTS (
    SELECT 1 FROM public.event_participants ep
    WHERE ep.event_id = event_reports.event_id
      AND ep.user_id = auth.uid()
      AND ep.role IN ('host','streamer')
  )
);

-- No public selects for now (future admin only). Allow reporters to view their own report if needed.
CREATE POLICY IF NOT EXISTS "Reporters can view own reports" ON public.event_reports
FOR SELECT
USING (reporter_user_id = auth.uid());

-- Trigger to increment events.report_count on new report insert
CREATE OR REPLACE FUNCTION public.increment_event_report_count()
RETURNS trigger AS $$
BEGIN
  UPDATE public.events SET report_count = COALESCE(report_count,0) + 1
  WHERE id = NEW.event_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_increment_event_report_count ON public.event_reports;
CREATE TRIGGER trg_increment_event_report_count
AFTER INSERT ON public.event_reports
FOR EACH ROW EXECUTE FUNCTION public.increment_event_report_count();