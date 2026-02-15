import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createServiceClient } from "@/utils/supabase/service";
import { verifyCsrfToken } from "@/lib/csrf";
import { trackEventServer } from "@/lib/analytics-server";
import { awardReward } from "@/lib/rewards";
import { escapeFilterValue } from "@/lib/utils";

export async function GET(request: NextRequest) {
  const supabase = createClient();

  // Authenticate
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Parse query params
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";
  const sortBy = searchParams.get("sortBy") || "newest";
  const valuationMin = searchParams.get("valuationMin");
  const valuationMax = searchParams.get("valuationMax");
  const progressMin = searchParams.get("progressMin");
  const progressMax = searchParams.get("progressMax");
  const page = Math.max(1, Number(searchParams.get("page") || 1));
  const perPage = Math.min(50, Math.max(1, Number(searchParams.get("perPage") || 12)));

  let query = supabase
    .from("projects")
    .select("*", { count: "exact" })
    .eq("owner_id", user.id);

  // Search by name or description
  if (search) {
    const escaped = escapeFilterValue(search);
    query = query.or(`name.ilike.%${escaped}%,description.ilike.%${escaped}%`);
  }

  // Filter by valuation range
  if (valuationMin) {
    query = query.gte("valuation_low", Number(valuationMin));
  }
  if (valuationMax) {
    query = query.lte("valuation_high", Number(valuationMax));
  }

  // Filter by progress score range
  if (progressMin) {
    query = query.gte("progress_score", Number(progressMin));
  }
  if (progressMax) {
    query = query.lte("progress_score", Number(progressMax));
  }

  // Sort
  switch (sortBy) {
    case "oldest":
      query = query.order("created_at", { ascending: true });
      break;
    case "progress_asc":
      query = query.order("progress_score", { ascending: true, nullsFirst: false });
      break;
    case "progress_desc":
      query = query.order("progress_score", { ascending: false, nullsFirst: false });
      break;
    case "valuation_low":
      query = query.order("valuation_low", { ascending: true, nullsFirst: false });
      break;
    case "valuation_high":
      query = query.order("valuation_high", { ascending: false, nullsFirst: false });
      break;
    case "newest":
    default:
      query = query.order("created_at", { ascending: false });
      break;
  }

  const from = (page - 1) * perPage;
  const to = from + perPage - 1;
  query = query.range(from, to);

  const { data: projects, count, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ projects, total: count ?? 0, page, perPage });
}

export async function POST(request: NextRequest) {
  const csrfValid = await verifyCsrfToken(request);
  if (!csrfValid) {
    return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
  }

  const supabase = createClient();
  const admin = createServiceClient();

  // Authenticate
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Parse body
  let body: {
    name?: string;
    description?: string;
    url?: string;
    why_built?: string;
    screenshot_url?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Validate name
  const name = body.name?.trim();
  if (!name || name.length === 0) {
    return NextResponse.json(
      { error: "Project name is required" },
      { status: 400 }
    );
  }
  if (name.length > 100) {
    return NextResponse.json(
      { error: "Project name must be 100 characters or fewer" },
      { status: 400 }
    );
  }

  // Validate description
  if (body.description && body.description.length > 500) {
    return NextResponse.json(
      { error: "Description must be 500 characters or fewer" },
      { status: 400 }
    );
  }

  // Validate URL
  if (body.url) {
    const trimmedUrl = body.url.trim();
    if (trimmedUrl && !trimmedUrl.startsWith("http://") && !trimmedUrl.startsWith("https://")) {
      return NextResponse.json(
        { error: "URL must start with http:// or https://" },
        { status: 400 }
      );
    }
  }

  // Validate why_built
  if (body.why_built && body.why_built.length > 1000) {
    return NextResponse.json(
      { error: "Why you built this must be 1000 characters or fewer" },
      { status: 400 }
    );
  }

  // Insert project (service role — bypasses RLS)
  const { data: project, error: insertError } = await admin
    .from("projects")
    .insert({
      owner_id: user.id,
      name,
      description: body.description?.trim() || null,
      url: body.url?.trim() || null,
      why_built: body.why_built?.trim() || null,
      screenshot_url: body.screenshot_url?.trim() || null,
    })
    .select()
    .single();

  if (insertError || !project) {
    return NextResponse.json(
      { error: insertError?.message ?? "Failed to create project" },
      { status: 500 }
    );
  }

  // Insert activity event (service role)
  const { error: eventError } = await admin
    .from("activity_events")
    .insert({
      project_id: project.id,
      user_id: user.id,
      event_type: "project_created",
      description: `Created project "${name}"`,
    });

  if (eventError) {
    console.error("Failed to insert activity event:", eventError.message);
    // Non-blocking — project was already created
  }

  // Award pineapples for links provided at creation time (idempotent, ledger-based)
  let pineapplesEarned = 0;

  try {
    // Website link provided at creation → link_website (3 🍍)
    if (project.url) {
      const reward = await awardReward({
        supabase: admin,
        userId: user.id,
        projectId: project.id,
        eventType: "link_website",
        idempotencyKey: `link_website_${project.id}`,
      });
      if (reward.rewarded) pineapplesEarned += reward.amount;
    }
  } catch (err) {
    console.error("[projects] Failed to award creation rewards:", err);
  }

  // Track analytics event (service role)
  await trackEventServer(admin, user.id, "project_created", {
    projectId: project.id,
    pineapples: pineapplesEarned,
  }, project.id);

  return NextResponse.json({ project, pineapples_earned: pineapplesEarned }, { status: 201 });
}

/**
 * PATCH /api/projects
 * Rename a project. Body: { projectId: string, name: string }
 */
export async function PATCH(request: NextRequest) {
  const csrfValid = await verifyCsrfToken(request);
  if (!csrfValid) {
    return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
  }

  const supabase = createClient();
  const { createServiceClient } = await import("@/utils/supabase/service");
  const admin = createServiceClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { projectId?: string; name?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { projectId, name: rawName } = body;
  if (!projectId || typeof projectId !== "string") {
    return NextResponse.json({ error: "projectId is required" }, { status: 400 });
  }

  const name = rawName?.trim();
  if (!name || name.length === 0) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }
  if (name.length > 100) {
    return NextResponse.json({ error: "Name must be 100 characters or fewer" }, { status: 400 });
  }

  // Verify ownership via RLS-scoped read
  const { data: project, error: projError } = await supabase
    .from("projects")
    .select("id, owner_id")
    .eq("id", projectId)
    .eq("owner_id", user.id)
    .single();

  if (projError || !project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  // Mutate with service role (bypasses RLS)
  const { error: updateError } = await admin
    .from("projects")
    .update({ name, updated_at: new Date().toISOString() })
    .eq("id", projectId);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, name });
}
