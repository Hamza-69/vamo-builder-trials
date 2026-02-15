import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase'; // Adjust the path as needed

/**
 * Service-role Supabase client for server-side utilities.
 * Bypasses RLS — use only in trusted server contexts.
 */
export const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);
