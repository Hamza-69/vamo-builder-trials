import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createServiceClient } from "@/utils/supabase/service";
import { verifyCsrfToken } from "@/lib/csrf";

export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, avatar_url")
    .eq("id", user.id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ profile, authEmail: user.email });
}

export async function PATCH(request: NextRequest) {
  const csrfValid = await verifyCsrfToken(request);
  if (!csrfValid) {
    return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
  }

  const supabase = createClient();
  const admin = createServiceClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { full_name, avatar_url } = body;

  const updates: Record<string, string> = {};

  if (full_name !== undefined) {
    if (typeof full_name !== "string") {
      return NextResponse.json({ error: "full_name must be a string" }, { status: 400 });
    }
    const cleaned = full_name.replace(/<[^>]*>/g, "").trim();
    if (cleaned.length === 0 || cleaned.length > 100) {
      return NextResponse.json(
        { error: "Full name must be between 1 and 100 characters" },
        { status: 400 },
      );
    }
    updates.full_name = cleaned;
  }

  if (avatar_url !== undefined) {
    if (typeof avatar_url !== "string") {
      return NextResponse.json({ error: "avatar_url must be a string" }, { status: 400 });
    }
    const trimmedUrl = avatar_url.trim();
    if (trimmedUrl.length > 2048) {
      return NextResponse.json({ error: "avatar_url is too long" }, { status: 400 });
    }
    if (trimmedUrl && !trimmedUrl.startsWith("https://")) {
      return NextResponse.json(
        { error: "avatar_url must be an HTTPS URL" },
        { status: 400 },
      );
    }
    updates.avatar_url = trimmedUrl;
  }

  updates.updated_at = new Date().toISOString();

  const { error } = await admin
    .from("profiles")
    .update(updates)
    .eq("id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
