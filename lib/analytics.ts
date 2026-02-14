"use client";

import { createClient } from "@/utils/supabase/client";

export type AnalyticsEvent =
  | { event: "project_created"; properties: { projectId: string } }
  | { event: "prompt_sent"; properties: { projectId: string; messageId: string } }
  | { event: "reward_earned"; properties: { projectId: string; amount: number; eventType: string } }
  | { event: "reward_redeemed"; properties: { amount: number; rewardType: string } }
  | { event: "listing_created"; properties: { projectId: string; listingId: string } }
  | { event: "offer_requested"; properties: { projectId: string; offerId: string } }
  | { event: "link_added"; properties: { projectId: string; linkType: string } }
  | { event: "page_view"; properties: { path: string } };

/**
 * Track an analytics event from a client component.
 * Inserts directly into analytics_events using the authenticated Supabase
 * client (anon key + user JWT). RLS allows users to insert their own events.
 *
 * Fires asynchronously — errors are logged but never thrown so they don't
 * break the user flow.
 */
export async function trackEvent<T extends AnalyticsEvent>(
  eventName: T["event"],
  properties: T["properties"],
) {
  try {
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return; // not logged in — skip silently

    const projectId =
      "projectId" in properties ? (properties as { projectId?: string }).projectId : undefined;

    await supabase.from("analytics_events").insert({
      user_id: user.id,
      project_id: projectId ?? null,
      event_name: eventName,
      properties,
    });
  } catch (error) {
    console.error("[analytics] Failed to track event:", eventName, error);
  }
}
