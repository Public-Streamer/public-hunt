-- Enable required extensions (idempotent)
create extension if not exists pg_net with schema extensions;
create extension if not exists pg_cron with schema extensions;

-- Unschedule existing job to keep this migration idempotent
select cron.unschedule('cleanup-stale-streams-every-minute');

-- Schedule the cleanup-stale-streams function to run every minute
select
  cron.schedule(
    'cleanup-stale-streams-every-minute',           -- job name
    '* * * * *',                                    -- every minute
    $$
    select
      net.http_post(
        url := 'https://zmfugicftfwvuudensdo.functions.supabase.co/functions/v1/cleanup-stale-streams',
        headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InptZnVnaWNmdGZ3dnV1ZGVuc2RvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwNjU2ODUsImV4cCI6MjA2NzY0MTY4NX0.J8CA_K_oxhcd2wlQf0KvEarwi0ejq0nBgAVMEhQlXE8"}'::jsonb,
        body := jsonb_build_object('source', 'pg_cron', 'invoked_at', now())
      )
    $$
  );