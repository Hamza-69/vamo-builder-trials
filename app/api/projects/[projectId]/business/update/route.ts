import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createServiceClient } from "@/utils/supabase/service";
import { verifyCsrfToken } from "@/lib/csrf";

/**
 * PATCH /api/projects/[projectId]/business/update
 * Update editable project fields: name, description, valuation_low, valuation_high, why_built.
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
  const admin = createServiceClient();
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

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Only allow updating known editable fields
  const allowedFields = [
    "name",
    "description",
    "valuation_low",
    "valuation_high",
    "why_built",
  ];

  const updates: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(body)) {
    if (!allowedFields.includes(key)) continue;

    if (key === "name") {
      const name = typeof value === "string" ? value.trim() : "";
      if (!name || name.length === 0) {
        return NextResponse.json(
          { error: "Project name is required" },
          { status: 400 },
        );
      }
      if (name.length > 100) {
        return NextResponse.json(
          { error: "Project name must be 100 characters or fewer" },
          { status: 400 },
        );
      }
      updates.name = name;
    } else if (key === "description") {
      const desc = typeof value === "string" ? value.trim() : "";
      if (desc.length > 500) {
        return NextResponse.json(
          { error: "Description must be 500 characters or fewer" },
          { status: 400 },
        );
      }
      updates.description = desc || null;
    } else if (key === "why_built") {
      const wb = typeof value === "string" ? value.trim() : "";
      if (wb.length > 1000) {
        return NextResponse.json(
          { error: "Why you built this must be 1000 characters or fewer" },
          { status: 400 },
        );
      }
      updates.why_built = wb || null;
    } else if (key === "valuation_low" || key === "valuation_high") {
      const num = Number(value);
      if (isNaN(num) || num < 0) {
        return NextResponse.json(
          { error: `${key} must be a non-negative number` },
          { status: 400 },
        );
      }
      updates[key] = Math.round(num);
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  const { data: updated, error: updateError } = await admin
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
