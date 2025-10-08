-- Fix typo in update_ad_metrics function: cmp_rate -> cpm_rate
CREATE OR REPLACE FUNCTION public.update_ad_metrics()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  -- Update actual impressions and spend for the ad
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
    )
  WHERE id = NEW.ad_id;
  
  RETURN NEW;
END;
$function$;