-- Function to initialize budget_remaining when creating a new ad
CREATE OR REPLACE FUNCTION public.initialize_ad_budget()
RETURNS trigger AS $$
BEGIN
  -- Initialize budget_remaining to budget if not provided or zero
  IF NEW.budget_remaining IS NULL OR NEW.budget_remaining = 0 THEN
    NEW.budget_remaining := NEW.budget;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to run before insert on ads table
CREATE TRIGGER set_initial_budget
BEFORE INSERT ON public.ads
FOR EACH ROW
EXECUTE FUNCTION public.initialize_ad_budget();