import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

const MESSAGES_PER_PAGE = 20;

/**
 * GET /api/chat/messages?projectId=uuid&page=1
 * Returns paginated messages (newest first), with total count.
 */
export async function GET(request: NextRequest) {
  const supabase = createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("projectId");
  const page = Math.max(1, Number(searchParams.get("page") || 1));

  if (!projectId) {
    return NextResponse.json({ error: "projectId is required" }, { status: 400 });
  }

  // Verify project ownership
  const { data: project } = await supabase
    .from("projects")
    .select("id")
    .eq("id", projectId)
    .eq("owner_id", user.id)
    .single();

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const from = (page - 1) * MESSAGES_PER_PAGE;
  const to = from + MESSAGES_PER_PAGE - 1;

  const { data: messages, count, error } = await supabase
    .from("messages")
    .select("*", { count: "exact" })
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    messages: (messages ?? []).reverse(), // Return in chronological order
    total: count ?? 0,
    page,
    perPage: MESSAGES_PER_PAGE,
    hasMore: (count ?? 0) > page * MESSAGES_PER_PAGE,
  });
}
