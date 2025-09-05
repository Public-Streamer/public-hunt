import { createClient } from '@supabase/supabase-js';

// DEPRECATED: Use supabaseBrowser() from @/lib/supabase/browser instead
// This export exists for compatibility but should be replaced

// Initialize Supabase client
// Using direct values from project configuration
const supabaseUrl = 'https://zmfugicftfwvuudensdo.supabase.co';
const supabaseKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InptZnVnaWNmdGZ3dnV1ZGVuc2RvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwNjU2ODUsImV4cCI6MjA2NzY0MTY4NX0.J8CA_K_oxhcd2wlQf0KvEarwi0ejq0nBgAVMEhQlXE8';
const supabase = createClient(supabaseUrl, supabaseKey);

export { supabase };
