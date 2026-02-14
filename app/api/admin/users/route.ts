import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

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

  let query = supabase.from("profiles").select("*");

  if (search) {
    query = query.or(
      `email.ilike.%${search}%,full_name.ilike.%${search}%`
    );
  }

  query = query.order("created_at", { ascending: false });

  const { data: users, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Get project counts for each user
  const userIds = users?.map((u) => u.id) ?? [];
  let projectCounts: Record<string, number> = {};

  if (userIds.length > 0) {
    const { data: projects } = await supabase
      .from("projects")
      .select("owner_id")
      .in("owner_id", userIds);

    if (projects) {
      projectCounts = projects.reduce(
        (acc, p) => {
          acc[p.owner_id] = (acc[p.owner_id] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );
    }
  }

  const usersWithCounts = (users ?? []).map((u) => ({
    ...u,
    projects_count: projectCounts[u.id] || 0,
  }));

  return NextResponse.json({ users: usersWithCounts });
}
