import { createClient } from '@supabase/supabase-js'

export const useSupabaseServer = () => {
  const config = useRuntimeConfig()
  
  const supabaseUrl = config.public.supabaseUrl || process.env.SUPABASE_URL
  const supabaseServiceKey = config.supabaseServiceKey || process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase URL and Service Key are required')
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  })
}
