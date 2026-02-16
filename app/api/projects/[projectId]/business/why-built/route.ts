import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { verifyCsrfToken } from "@/lib/csrf";

/**
 * PATCH /api/projects/[projectId]/business/why-built
 * Update the "why I built this" text.
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

  let body: { why_built?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const whyBuilt = body.why_built?.trim() ?? "";
  if (whyBuilt.length > 1000) {
    return NextResponse.json(
      { error: "Why you built this must be 1000 characters or fewer" },
      { status: 400 },
    );
  }

  const { data: updated, error: updateError } = await supabase
    .from("projects")
    .update({ why_built: whyBuilt || null })
    .eq("id", projectId)
    .select()
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ project: updated });
}
