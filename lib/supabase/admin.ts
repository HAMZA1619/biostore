import { createClient } from "@supabase/supabase-js"

export function createAdminClient() {
  // Use service role key if available, fall back to anon key
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.startsWith("eyJ")
    ? process.env.SUPABASE_SERVICE_ROLE_KEY
    : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    key
  )
}
