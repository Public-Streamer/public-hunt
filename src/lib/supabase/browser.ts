import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/integrations/supabase/types'

const SUPABASE_URL = 'https://zmfugicftfwvuudensdo.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InptZnVnaWNmdGZ3dnV1ZGVuc2RvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwNjU2ODUsImV4cCI6MjA2NzY0MTY4NX0.J8CA_K_oxhcd2wlQf0KvEarwi0ejq0nBgAVMEhQlXE8'

// Create a single instance to prevent multiple client warnings
let browserClient: ReturnType<typeof createClient<Database>> | null = null

// Browser client factory - reuses single instance to prevent multiple clients
export function supabaseBrowser() {
  if (!browserClient) {
    browserClient = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        storage: localStorage,
        persistSession: true,
        autoRefreshToken: true,
      }
    })
  }
  return browserClient
}