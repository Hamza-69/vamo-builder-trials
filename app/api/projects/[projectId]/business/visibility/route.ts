import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { verifyCsrfToken } from "@/lib/csrf";

/**
 * PATCH /api/projects/[projectId]/business/visibility
 * Toggle visibility of business panel sections.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { projectId: string } },
) {
  const csrfValid = await verifyCsrfToken(request);
  if (!csrfValid) {
    return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
  }

  const supabase = createClient();
  const projectId = params.projectId;

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify ownership
  const { data: project } = await supabase
    .from("projects")
    .select("id, owner_id")
    .eq("id", projectId)
    .eq("owner_id", user.id)
    .single();

  if (!project) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let body: Record<string, boolean>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Only allow toggling known visibility fields
  const allowedFields = [
    "is_quote_shown",
    "is_valuation_shown",
    "is_why_shown",
    "is_progress_shown",
    "is_traction_shown",
    "is_links_shown",
    "is_activity_timeline_shown",
  ];

  const updates: Record<string, boolean> = {};
  for (const [key, value] of Object.entries(body)) {
    if (allowedFields.includes(key) && typeof value === "boolean") {
      updates[key] = value;
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  const { data: updated, error: updateError } = await supabase
    .from("projects")
    .update(updates)
    .eq("id", projectId)
    .select()
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ project: updated });
}
