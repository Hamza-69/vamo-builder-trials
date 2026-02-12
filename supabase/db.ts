import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase'; // Adjust the path as needed

export const supabase = createClient<Database>(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);
