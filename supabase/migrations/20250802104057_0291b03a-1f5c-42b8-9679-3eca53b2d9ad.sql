-- Add slug and slug_counter columns to events table
ALTER TABLE events 
ADD COLUMN slug text,
ADD COLUMN slug_counter integer DEFAULT 1;

-- Create unique index on slug
CREATE UNIQUE INDEX idx_events_slug ON events(slug);

-- Create function to generate slug from event name
CREATE OR REPLACE FUNCTION generate_slug(event_name text)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
    base_slug text;
    final_slug text;
    counter integer := 1;
BEGIN
    -- Convert event name to URL-friendly slug
    base_slug := lower(regexp_replace(
        regexp_replace(
            regexp_replace(event_name, '[^a-zA-Z0-9\s]', '', 'g'),
            '\s+', '-', 'g'
        ),
        '^-+|-+$', '', 'g'
    ));
    
    -- Ensure slug is not empty
    IF base_slug = '' OR base_slug IS NULL THEN
        base_slug := 'event';
    END IF;
    
    -- Limit slug length to 50 characters
    base_slug := left(base_slug, 50);
    
    -- Find next available slug with counter
    final_slug := base_slug;
    WHILE EXISTS (SELECT 1 FROM events WHERE slug = final_slug) LOOP
        final_slug := base_slug || '-' || lpad(counter::text, 3, '0');
        counter := counter + 1;
    END LOOP;
    
    RETURN final_slug;
END;
$$;

-- Create function to auto-generate slug on insert/update
CREATE OR REPLACE FUNCTION auto_generate_event_slug()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    -- Only generate slug if it's null or if name changed
    IF NEW.slug IS NULL OR (TG_OP = 'UPDATE' AND OLD.name != NEW.name) THEN
        NEW.slug := generate_slug(NEW.name);
        
        -- Extract counter from slug for slug_counter column
        IF NEW.slug ~ '-[0-9]+$' THEN
            NEW.slug_counter := (regexp_match(NEW.slug, '-([0-9]+)$'))[1]::integer;
        ELSE
            NEW.slug_counter := 1;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Create trigger to auto-generate slugs
CREATE TRIGGER trigger_auto_generate_event_slug
    BEFORE INSERT OR UPDATE ON events
    FOR EACH ROW
    EXECUTE FUNCTION auto_generate_event_slug();

-- Generate slugs for existing events
UPDATE events SET slug = generate_slug(name) WHERE slug IS NULL;

-- Update slug_counter for existing events
UPDATE events 
SET slug_counter = CASE 
    WHEN slug ~ '-[0-9]+$' THEN (regexp_match(slug, '-([0-9]+)$'))[1]::integer
    ELSE 1
END
WHERE slug_counter IS NULL;