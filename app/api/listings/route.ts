import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { verifyCsrfToken } from "@/lib/csrf";

/**
 * POST /api/listings
 * Creates a new listing for a project.
 * - Inserts listing row
 * - Updates project status to 'listed'
 * - Inserts activity_event with event_type = 'listing_created'
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

  if (project.status === "listed") {
    return NextResponse.json(
      { error: "Project is already listed" },
      { status: 400 },
    );
  }

  if ((project.progress_score ?? 0) < 20) {
    return NextResponse.json(
      { error: "Progress score must be at least 20 to list" },
      { status: 400 },
    );
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

  // Insert listing
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

  // Update project status to 'listed'
  await supabase
    .from("projects")
    .update({ status: "listed" })
    .eq("id", project_id);

  // Insert activity event
  await supabase.from("activity_events").insert({
    project_id,
    user_id: user.id,
    event_type: "listing_created",
    description: `Project listed on marketplace: "${title}"`,
    metadata: { listing_id: listing.id },
  });

  // Log analytics event
  await supabase.from("analytics_events").insert({
    user_id: user.id,
    project_id,
    event_name: "listing_created",
    properties: {
      listing_id: listing.id,
      asking_price_low,
      asking_price_high,
      progress_score: project.progress_score,
    },
  });

  return NextResponse.json({ listing }, { status: 201 });
}
