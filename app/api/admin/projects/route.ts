import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { escapeFilterValue } from "@/lib/utils";

export async function GET(request: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";
  const status = searchParams.get("status") || "";
  const sortBy = searchParams.get("sortBy") || "newest";
  const page = Math.max(1, Number(searchParams.get("page") || 1));
  const perPage = Math.min(50, Math.max(1, Number(searchParams.get("perPage") || 20)));

  let query = supabase
    .from("projects")
    .select("*, profiles!inner(email, full_name)", { count: "exact" });

  if (search) {
    const escaped = escapeFilterValue(search);
    query = query.or(
      `name.ilike.%${escaped}%,description.ilike.%${escaped}%`
    );
  }
  if (status) {
    query = query.eq("status", status);
  }

  switch (sortBy) {
    case "oldest":
      query = query.order("created_at", { ascending: true });
      break;
    case "progress_desc":
      query = query.order("progress_score", {
        ascending: false,
        nullsFirst: false,
      });
      break;
    case "progress_asc":
      query = query.order("progress_score", {
        ascending: true,
        nullsFirst: false,
      });
      break;
    case "newest":
    default:
      query = query.order("created_at", { ascending: false });
      break;
  }

  const from = (page - 1) * perPage;
  const to = from + perPage - 1;
  query = query.range(from, to);

  const { data: projects, count, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ projects: projects ?? [], total: count ?? 0, page, perPage });
}
