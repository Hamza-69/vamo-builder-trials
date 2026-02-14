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

  const { data: listing, error } = await supabase
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
    .single();

  if (error || !listing) {
    notFound();
  }

  // Compute outdated flag
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
        .gt("created_at", snapshotEvent.created_at);

      is_outdated = (count ?? 0) > 0;
    }
  }

  return <ListingDetailView listing={{ ...listing, is_outdated } as unknown as ListingDetail} />;
}
