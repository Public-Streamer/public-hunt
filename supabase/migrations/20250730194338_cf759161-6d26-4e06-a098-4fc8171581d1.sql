-- Update handle_new_user function to extract all profile fields from signup metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  INSERT INTO public.user_profiles (
    id, 
    user_id, 
    username, 
    display_name,
    bio,
    location,
    website,
    birthday
  )
  VALUES (
    gen_random_uuid(),
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'bio',
    NEW.raw_user_meta_data->>'location',
    NEW.raw_user_meta_data->>'website',
    CASE 
      WHEN NEW.raw_user_meta_data->>'birthday' IS NOT NULL AND NEW.raw_user_meta_data->>'birthday' != ''
      THEN (NEW.raw_user_meta_data->>'birthday')::date
      ELSE NULL
    END
  );
  RETURN NEW;
END;
$function$