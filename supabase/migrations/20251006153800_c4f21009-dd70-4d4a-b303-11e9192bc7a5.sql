-- Add viewed_duration column to ads table
ALTER TABLE ads ADD COLUMN viewed_duration INTEGER DEFAULT 0;

-- Update the update_ad_metrics function to include viewed_duration
CREATE OR REPLACE FUNCTION public.update_ad_metrics()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  -- Update actual impressions, spend, and viewed duration for the ad
  UPDATE ads 
  SET 
    actual_impressions = (
      SELECT COUNT(*) FROM ad_impressions 
      WHERE ad_id = NEW.ad_id AND viewed_at_2s = true
    ),
    spend_amount = (
      SELECT COUNT(*) * (cpm_rate / 1000) FROM ad_impressions 
      WHERE ad_id = NEW.ad_id AND viewed_at_2s = true
    ),
    budget_remaining = budget - (
      SELECT COUNT(*) * (cpm_rate / 1000) FROM ad_impressions 
      WHERE ad_id = NEW.ad_id AND viewed_at_2s = true
    ),
    viewed_duration = (
      SELECT COALESCE(SUM(view_duration_seconds), 0) FROM ad_impressions 
      WHERE ad_id = NEW.ad_id AND viewed_at_2s = true
    )
  WHERE id = NEW.ad_id;
  
  RETURN NEW;
END;
$function$;