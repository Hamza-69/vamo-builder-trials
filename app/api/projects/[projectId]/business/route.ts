import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

/**
 * GET /api/projects/[projectId]/business
 * Returns the full business panel data: project info, traction signals, and recent activity.
 * Accessible by the project owner (authenticated) OR publicly for listed projects.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { projectId: string } },
) {
  const supabase = createClient();
  const projectId = params.projectId;

  // Try to get authenticated user (optional – public access allowed for listed projects)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch project
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .single();

  if (projectError || !project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  // Access control: owner can always access; others only if listed
  const isOwner = user?.id === project.owner_id;
  if (!isOwner && project.status !== "listed") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Fetch traction signals from dedicated table
  const { data: tractionSignals } = await supabase
    .from("traction_signals")
    .select("id, signal_type, description, source, metadata, created_at")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  // Fetch last 10 activity events
  const { data: activityTimeline } = await supabase
    .from("activity_events")
    .select("id, event_type, description, created_at")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(10);

  return NextResponse.json({
    project,
    tractionSignals: tractionSignals ?? [],
    activityTimeline: activityTimeline ?? [],
    isOwner,
  });
}
