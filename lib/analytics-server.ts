import { SupabaseClient } from "@supabase/supabase-js";

/**
 * Track an analytics event from the server (API routes / server actions).
 * Uses the already-authenticated Supabase server client so the RLS
 * insert policy (`auth.uid() = user_id`) is satisfied automatically.
 *
 * Errors are logged but never thrown — analytics should not block the
 * primary request.
 */
export async function trackEventServer(
  supabase: SupabaseClient,
  userId: string,
  eventName: string,
  properties: Record<string, unknown> = {},
  projectId?: string | null,
) {
  try {
    const { error } = await supabase.from("analytics_events").insert({
      user_id: userId,
      project_id: projectId ?? null,
      event_name: eventName,
      properties,
    });

    if (error) {
      console.error("[analytics] Failed to insert event:", eventName, error.message);
    }
  } catch (error) {
    console.error("[analytics] Failed to track event:", eventName, error);
  }
}
