import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

/**
 * GET /api/projects/[projectId]/business/timeline
 * Returns the full activity timeline for a project.
 * Accessible by owner or publicly for listed projects.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { projectId: string } },
) {
  const supabase = createClient();
  const projectId = params.projectId;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch project for access control
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("id, owner_id, name, status")
    .eq("id", projectId)
    .single();

  if (projectError || !project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const isOwner = user?.id === project.owner_id;
  if (!isOwner && project.status !== "listed") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Parse pagination params
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get("page") || 1));
  const perPage = Math.min(100, Math.max(1, Number(searchParams.get("perPage") || 50)));

  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  const { data: events, count, error } = await supabase
    .from("activity_events")
    .select("id, event_type, description, metadata, created_at", { count: "exact" })
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    events: events ?? [],
    total: count ?? 0,
    page,
    perPage,
    projectName: project.name,
  });
}
