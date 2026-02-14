import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

/**
 * GET /api/marketplace/[id]
 * Public — returns a single listing with project and seller profile data.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
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
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
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
        .gt("created_at", snapshotEvent.created_at)
        .not("event_type", "in", "(listing_created,listing_relisted)");

      is_outdated = (count ?? 0) > 0;
    }
  }

  return NextResponse.json({ listing: { ...listing, is_outdated } });
}
