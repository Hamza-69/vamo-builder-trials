import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Run all counts in parallel
  const [
    usersRes,
    projectsRes,
    promptsRes,
    earnedRes,
    redeemedRes,
    listingsRes,
  ] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("projects").select("id", { count: "exact", head: true }),
    supabase
      .from("messages")
      .select("id", { count: "exact", head: true })
      .eq("role", "user"),
    supabase
      .from("reward_ledger")
      .select("reward_amount")
      .gt("reward_amount", 0),
    supabase.from("redemptions").select("amount"),
    supabase
      .from("listings")
      .select("id", { count: "exact", head: true })
      .eq("status", "active"),
  ]);

  const totalPineapplesEarned =
    earnedRes.data?.reduce((sum, r) => sum + r.reward_amount, 0) ?? 0;
  const totalPineapplesRedeemed =
    redeemedRes.data?.reduce((sum, r) => sum + r.amount, 0) ?? 0;

  return NextResponse.json({
    stats: {
      totalUsers: usersRes.count ?? 0,
      totalProjects: projectsRes.count ?? 0,
      totalPrompts: promptsRes.count ?? 0,
      totalPineapplesEarned,
      totalPineapplesRedeemed,
      activeListings: listingsRes.count ?? 0,
    },
  });
}
