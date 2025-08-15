import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/integrations/supabase/types'

const SUPABASE_URL = 'https://zmfugicftfwvuudensdo.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InptZnVnaWNmdGZ3dnV1ZGVuc2RvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwNjU2ODUsImV4cCI6MjA2NzY0MTY4NX0.J8CA_K_oxhcd2wlQf0KvEarwi0ejq0nBgAVMEhQlXE8'

// Browser client factory - creates a new instance each time
export function supabaseBrowser() {
  return createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      storage: localStorage,
      persistSession: true,
      autoRefreshToken: true,
    }
  })
}