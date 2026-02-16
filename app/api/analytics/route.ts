import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { verifyCsrfToken } from "@/lib/csrf";
import { writeLimiter } from "@/lib/rate-limit";

/**
 * POST /api/analytics
 * Track a client-side analytics event.
 * Body: { event_name: string, properties: object }
 */
export async function POST(request: NextRequest) {
  // --- CSRF verification ---
  const csrfValid = await verifyCsrfToken(request);
  if (!csrfValid) {
    return NextResponse.json(
      { error: "Invalid CSRF token" },
      { status: 403 },
    );
  }

  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // --- Rate limiting ---
  const { success: rateLimitOk } = writeLimiter.check(user.id);
  if (!rateLimitOk) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429 },
    );
  }

  let body: { event_name?: string; properties?: Record<string, unknown> };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { event_name, properties = {} } = body;

  if (!event_name || typeof event_name !== "string") {
    return NextResponse.json(
      { error: "event_name is required" },
      { status: 400 },
    );
  }

  const projectId =
    typeof properties === "object" && properties !== null && "projectId" in properties
      ? (properties as { projectId?: string }).projectId ?? null
      : null;

  const { error } = await supabase.from("analytics_events").insert({
    user_id: user.id,
    project_id: projectId,
    event_name,
    properties,
  });

  if (error) {
    console.error("[analytics] Failed to insert event:", event_name, error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
