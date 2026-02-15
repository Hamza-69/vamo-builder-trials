import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Create a Supabase client using the **service role** key.
 * This bypasses RLS entirely — use ONLY inside API routes / server actions
 * after you have already verified the user's identity and authorization.
 *
 * NEVER expose this client or its key to the browser.
 */
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SECRET_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY env vars",
    );
  }

  return createSupabaseClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
