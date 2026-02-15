import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { escapeFilterValue } from "@/lib/utils";

/**
 * GET /api/marketplace
 * Public endpoint — no auth required.
 * Returns active listings with project data, supports filtering/sorting/pagination.
 */
export async function GET(request: NextRequest) {
  const supabase = createClient();

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";
  const sortBy = searchParams.get("sortBy") || "newest";
  const priceMin = searchParams.get("priceMin");
  const priceMax = searchParams.get("priceMax");
  const progressMin = searchParams.get("progressMin");
  const progressMax = searchParams.get("progressMax");
  const page = Math.max(1, Number(searchParams.get("page") || 1));
  const perPage = Math.min(50, Math.max(1, Number(searchParams.get("perPage") || 12)));

  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  let query = supabase
    .from("listings")
    .select(
      "*, projects!inner(progress_score, screenshot_url, url, name)",
      { count: "exact" },
    )
    .eq("status", "active");

  // Search by title or description
  if (search) {
    const escaped = escapeFilterValue(search);
    query = query.or(
      `title.ilike.%${escaped}%,description.ilike.%${escaped}%`,
    );
  }

  // Filter by asking price range
  if (priceMin) {
    query = query.gte("asking_price_low", Number(priceMin));
  }
  if (priceMax) {
    query = query.lte("asking_price_high", Number(priceMax));
  }

  // Filter by progress score (via joined projects)
  if (progressMin) {
    query = query.gte("projects.progress_score", Number(progressMin));
  }
  if (progressMax) {
    query = query.lte("projects.progress_score", Number(progressMax));
  }

  // Sort
  switch (sortBy) {
    case "oldest":
      query = query.order("created_at", { ascending: true });
      break;
    case "price_asc":
      query = query.order("asking_price_low", {
        ascending: true,
        nullsFirst: false,
      });
      break;
    case "price_desc":
      query = query.order("asking_price_high", {
        ascending: false,
        nullsFirst: false,
      });
      break;
    case "progress_asc":
      query = query.order("progress_score", {
        ascending: true,
        nullsFirst: false,
        referencedTable: "projects",
      });
      break;
    case "progress_desc":
      query = query.order("progress_score", {
        ascending: false,
        nullsFirst: false,
        referencedTable: "projects",
      });
      break;
    case "newest":
    default:
      query = query.order("created_at", { ascending: false });
      break;
  }

  // Pagination
  query = query.range(from, to);

  const { data: listings, count, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Compute "outdated" flag for each listing:
  // A listing is outdated if there are newer activity events since last_timeline_item_id
  const enrichedListings = await Promise.all(
    (listings ?? []).map(async (listing) => {
      if (!listing.last_timeline_item_id) {
        return { ...listing, is_outdated: false };
      }

      // Get the timestamp of the snapshotted event
      const { data: snapshotEvent } = await supabase
        .from("activity_events")
        .select("created_at")
        .eq("id", listing.last_timeline_item_id)
        .single();

      if (!snapshotEvent?.created_at) {
        return { ...listing, is_outdated: false };
      }

      // Check if any newer events exist (exclude listing events)
      const { count: newerCount } = await supabase
        .from("activity_events")
        .select("id", { count: "exact", head: true })
        .eq("project_id", listing.project_id)
        .gt("created_at", snapshotEvent.created_at)
        .not("event_type", "in", "(listing_created,listing_relisted,reward_earned,reward_redeemed)");

      return { ...listing, is_outdated: (newerCount ?? 0) > 0 };
    }),
  );

  return NextResponse.json({
    listings: enrichedListings,
    total: count ?? 0,
    page,
    perPage,
  });
}
