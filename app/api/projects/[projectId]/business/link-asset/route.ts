import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { verifyCsrfToken } from "@/lib/csrf";
import { awardReward } from "@/lib/rewards";

/**
 * POST /api/projects/[projectId]/business/link-asset
 * Link an asset (LinkedIn, GitHub, Website) to the project.
 * Creates an activity_event and awards pineapples.
 */
export async function POST(
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

  let body: { type: string; url: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { type, url } = body;

  // Validate type
  const typeMap: Record<string, { field: string; eventType: string; label: string }> = {
    linkedin: { field: "linkedin_url", eventType: "link_linkedin", label: "LinkedIn" },
    github: { field: "github_url", eventType: "link_github", label: "GitHub" },
    website: { field: "url", eventType: "link_website", label: "Website" },
  };

  const config = typeMap[type];
  if (!config) {
    return NextResponse.json(
      { error: "Invalid link type. Must be 'linkedin', 'github', or 'website'" },
      { status: 400 },
    );
  }

  // Validate URL
  const trimmedUrl = url?.trim();
  if (!trimmedUrl) {
    return NextResponse.json({ error: "URL is required" }, { status: 400 });
  }

  if (!trimmedUrl.startsWith("http://") && !trimmedUrl.startsWith("https://")) {
    return NextResponse.json(
      { error: "URL must start with http:// or https://" },
      { status: 400 },
    );
  }

  // Update the project with the linked URL
  const { error: updateError } = await supabase
    .from("projects")
    .update({ [config.field]: trimmedUrl })
    .eq("id", projectId);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // Create activity event
  const { error: eventError } = await supabase.from("activity_events").insert({
    project_id: projectId,
    user_id: user.id,
    event_type: config.eventType,
    description: `Linked ${config.label}: ${trimmedUrl}`,
  });

  if (eventError) {
    console.error("Failed to insert link activity event:", eventError.message);
  }

  // Award pineapples (idempotent, ledger-based — correct amount per type)
  let pineapplesEarned = 0;
  try {
    const reward = await awardReward({
      supabase,
      userId: user.id,
      projectId,
      eventType: config.eventType,
      idempotencyKey: `${config.eventType}_${projectId}`,
    });
    pineapplesEarned = reward.amount;
  } catch (err) {
    console.error("[link-asset] Failed to award pineapples:", err);
  }

  return NextResponse.json({
    success: true,
    pineapples_earned: pineapplesEarned,
  });
}
