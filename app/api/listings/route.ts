import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { verifyCsrfToken } from "@/lib/csrf";

/**
 * POST /api/listings
 * Creates a new listing for a project.
 * If the project is already listed, archives the old listing first (relist flow).
 * - Archives old listing (if any)
 * - Inserts listing row
 * - Updates project status to 'listed'
 * - Inserts activity_event with event_type = 'listing_created' or 'listing_relisted'
 * - Logs analytics event
 */
export async function POST(request: NextRequest) {
  // --- CSRF verification ---
  const csrfValid = await verifyCsrfToken(request);
  if (!csrfValid) {
    return NextResponse.json(
      { error: "Invalid CSRF token" },
      { status: 403 }
    );
  }

  const supabase = createClient();

  // Authenticate
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const {
    project_id,
    title,
    description,
    asking_price_low,
    asking_price_high,
    screenshots,
  } = body;

  if (!project_id || !title) {
    return NextResponse.json(
      { error: "project_id and title are required" },
      { status: 400 },
    );
  }

  // Verify ownership and project status
  const { data: project, error: projError } = await supabase
    .from("projects")
    .select("id, owner_id, status, progress_score")
    .eq("id", project_id)
    .single();

  if (projError || !project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  if (project.owner_id !== user.id) {
    return NextResponse.json({ error: "Not your project" }, { status: 403 });
  }

  if ((project.progress_score ?? 0) < 20) {
    return NextResponse.json(
      { error: "Progress score must be at least 20 to list" },
      { status: 400 },
    );
  }

  // ── Relist flow: archive existing active listing ──────────
  const isRelist = project.status === "listed";

  if (isRelist) {
    await supabase
      .from("listings")
      .update({ status: "archived", updated_at: new Date().toISOString() })
      .eq("project_id", project_id)
      .eq("user_id", user.id)
      .eq("status", "active");
  }

  // Get activity events for timeline snapshot
  const { data: events } = await supabase
    .from("activity_events")
    .select("id, event_type, description, created_at")
    .eq("project_id", project_id)
    .order("created_at", { ascending: false });

  const timelineSnapshot = events ?? [];
  const lastTimelineItemId = timelineSnapshot[0]?.id ?? null;

  // Count metrics
  const promptCount = timelineSnapshot.filter(
    (e) => e.event_type === "prompt",
  ).length;
  const tractionSignals = timelineSnapshot.filter((e) =>
    ["customer_added", "revenue_logged", "feature_shipped"].includes(
      e.event_type,
    ),
  ).length;

  const metrics = {
    progress_score: project.progress_score ?? 0,
    prompt_count: promptCount,
    traction_signals: tractionSignals,
    timeline_snapshot: timelineSnapshot,
  };

  // Insert listing (service role)
  const { data: listing, error: listingError } = await supabase
    .from("listings")
    .insert({
      project_id,
      user_id: user.id,
      title,
      description: description || null,
      asking_price_low: asking_price_low ?? null,
      asking_price_high: asking_price_high ?? null,
      last_timeline_item_id: lastTimelineItemId,
      screenshots: screenshots ?? [],
      metrics,
      status: "active",
    })
    .select()
    .single();

  if (listingError) {
    return NextResponse.json(
      { error: listingError.message },
      { status: 500 },
    );
  }

  // Update project status to 'listed' and sync valuation from listing price
  await supabase
    .from("projects")
    .update({
      status: "listed",
      valuation_low: asking_price_low ?? null,
      valuation_high: asking_price_high ?? null,
    })
    .eq("id", project_id);

  const eventType = isRelist ? "listing_relisted" : "listing_created";
  const eventDescription = isRelist
    ? `Project relisted on marketplace: "${title}"`
    : `Project listed on marketplace: "${title}"`;

  // Insert activity event (service role)
  await supabase.from("activity_events").insert({
    project_id,
    user_id: user.id,
    event_type: eventType,
    description: eventDescription,
    metadata: { listing_id: listing.id },
  });

  // Log analytics event (service role)
  await supabase.from("analytics_events").insert({
    user_id: user.id,
    project_id,
    event_name: eventType,
    properties: {
      listing_id: listing.id,
      asking_price_low,
      asking_price_high,
      progress_score: project.progress_score,
      is_relist: isRelist,
    },
  });

  return NextResponse.json({ listing }, { status: 201 });
}

/**
 * PATCH /api/listings
 * Update a listing's screenshots (remove individual images).
 * Body: { listing_id: string, screenshots: string[] }
 */
export async function PATCH(request: NextRequest) {
  const csrfValid = await verifyCsrfToken(request);
  if (!csrfValid) {
    return NextResponse.json(
      { error: "Invalid CSRF token" },
      { status: 403 },
    );
  }

  const supabase = createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { listing_id, screenshots } = body;

  if (!listing_id) {
    return NextResponse.json(
      { error: "listing_id is required" },
      { status: 400 },
    );
  }

  if (!Array.isArray(screenshots)) {
    return NextResponse.json(
      { error: "screenshots must be an array" },
      { status: 400 },
    );
  }

  // Verify ownership
  const { data: listing, error: listingError } = await supabase
    .from("listings")
    .select("id, user_id")
    .eq("id", listing_id)
    .single();

  if (listingError || !listing) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  if (listing.user_id !== user.id) {
    return NextResponse.json({ error: "Not your listing" }, { status: 403 });
  }

  const { data: updated, error: updateError } = await supabase
    .from("listings")
    .update({
      screenshots,
      updated_at: new Date().toISOString(),
    })
    .eq("id", listing_id)
    .select()
    .single();

  if (updateError) {
    return NextResponse.json(
      { error: updateError.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ listing: updated });
}
