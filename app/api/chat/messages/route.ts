import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

const MESSAGES_PER_PAGE = 10;

/**
 * GET /api/chat/messages?projectId=uuid[&before=ISO8601]
 * Cursor-based pagination: returns the N newest messages, or the N messages
 * older than `before` if the cursor is provided.
 * Returns messages in chronological (oldest-first) order.
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
  const before = searchParams.get("before"); // ISO-8601 cursor

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

  let query = supabase
    .from("messages")
    .select("*", { count: "exact" })
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(MESSAGES_PER_PAGE);

  if (before) {
    query = query.lt("created_at", before);
  }

  const { data: messages, count, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const reversed = (messages ?? []).reverse(); // chronological order

  return NextResponse.json({
    messages: reversed,
    total: count ?? 0,
    hasMore: (count ?? 0) > MESSAGES_PER_PAGE,
  });
}
