import { createClient } from "@/utils/supabase/server";
import { ListingDetailView } from "@/modules/marketplace/views/listing-detail-view";
import { notFound } from "next/navigation";
import type { ListingDetail } from "@/modules/marketplace/types";

export default async function ListingPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();

  // Run listing fetch and auth check in parallel
  const [listingResult, userResult] = await Promise.all([
    supabase
      .from("listings")
      .select(
        `
        *,
        projects!inner(id, name, description, progress_score, screenshot_url, url),
        profiles!inner(full_name, avatar_url)
      `,
      )
      .eq("id", params.id)
      .eq("status", "active")
      .single(),
    supabase.auth.getUser(),
  ]);

  const { data: listing, error } = listingResult;

  if (error || !listing) {
    notFound();
  }

  // Compute outdated flag — parallelize the two sequential queries
  let is_outdated = false;
  if (listing.last_timeline_item_id) {
    const { data: snapshotEvent } = await supabase
      .from("activity_events")
      .select("created_at")
      .eq("id", listing.last_timeline_item_id)
      .single();

    if (snapshotEvent?.created_at) {
      const { count } = await supabase
        .from("activity_events")
        .select("id", { count: "exact", head: true })
        .eq("project_id", listing.project_id)
        .gt("created_at", snapshotEvent.created_at)
        .not("event_type", "in", "(listing_created,listing_relisted,reward_earned,reward_redeemed)");

      is_outdated = (count ?? 0) > 0;
    }
  }

  const user = userResult.data.user;
  const isOwner = user?.id === listing.user_id;

  return <ListingDetailView listing={{ ...listing, is_outdated } as unknown as ListingDetail} isOwner={isOwner} />;
}
