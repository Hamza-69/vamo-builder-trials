import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { verifyCsrfToken } from "@/lib/csrf";
import { trackEventServer } from "@/lib/analytics-server";

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

  let query = supabase
    .from("projects")
    .select("*")
    .eq("owner_id", user.id);

  // Search by name or description
  if (search) {
    query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
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

  const { data: projects, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ projects });
}

export async function POST(request: NextRequest) {
  const csrfValid = await verifyCsrfToken(request);
  if (!csrfValid) {
    return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
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

  // Insert project
  const { data: project, error: insertError } = await supabase
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

  // Insert activity event
  const { error: eventError } = await supabase
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

  // Track analytics event
  await trackEventServer(supabase, user.id, "project_created", {
    projectId: project.id,
  }, project.id);

  return NextResponse.json({ project }, { status: 201 });
}
