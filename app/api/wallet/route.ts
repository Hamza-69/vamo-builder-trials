import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

/**
 * GET /api/wallet
 * Returns the user's profile (pineapple_balance) plus paginated & sorted
 * reward_ledger entries and redemptions.
 *
 * Query params:
 *  - tab: "rewards" | "redemptions" (default: "rewards")
 *  - page: number (default: 1)
 *  - perPage: number (default: 20)
 *  - sortBy: "date_asc" | "date_desc" | "amount_asc" | "amount_desc" (default: "date_desc")
 *  - minAmount: number (optional filter)
 *  - maxAmount: number (optional filter)
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

  // --- Fetch profile balance ---
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("pineapple_balance, full_name, avatar_url")
    .eq("id", user.id)
    .single();

  if (profileError) {
    return NextResponse.json(
      { error: profileError.message },
      { status: 500 }
    );
  }

  // --- Parse query params ---
  const { searchParams } = new URL(request.url);
  const tab = searchParams.get("tab") || "rewards";
  const page = Math.max(1, Number(searchParams.get("page") || 1));
  const perPage = Math.min(100, Math.max(1, Number(searchParams.get("perPage") || 20)));
  const sortBy = searchParams.get("sortBy") || "date_desc";
  const minAmount = searchParams.get("minAmount");
  const maxAmount = searchParams.get("maxAmount");

  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  if (tab === "redemptions") {
    // --- Redemptions ---
    let query = supabase
      .from("redemptions")
      .select("*", { count: "exact" })
      .eq("user_id", user.id);

    if (minAmount) query = query.gte("amount", Number(minAmount));
    if (maxAmount) query = query.lte("amount", Number(maxAmount));

    switch (sortBy) {
      case "date_asc":
        query = query.order("created_at", { ascending: true });
        break;
      case "amount_asc":
        query = query.order("amount", { ascending: true });
        break;
      case "amount_desc":
        query = query.order("amount", { ascending: false });
        break;
      case "date_desc":
      default:
        query = query.order("created_at", { ascending: false });
        break;
    }

    query = query.range(from, to);

    const { data: redemptions, count, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      profile,
      redemptions,
      total: count ?? 0,
      page,
      perPage,
    });
  }

  // --- Reward Ledger (default) ---
  let query = supabase
    .from("reward_ledger")
    .select("*, projects:project_id(name)", { count: "exact" })
    .eq("user_id", user.id);

  if (minAmount) query = query.gte("reward_amount", Number(minAmount));
  if (maxAmount) query = query.lte("reward_amount", Number(maxAmount));

  switch (sortBy) {
    case "date_asc":
      query = query.order("created_at", { ascending: true });
      break;
    case "amount_asc":
      query = query.order("reward_amount", { ascending: true });
      break;
    case "amount_desc":
      query = query.order("reward_amount", { ascending: false });
      break;
    case "date_desc":
    default:
      query = query.order("created_at", { ascending: false });
      break;
  }

  query = query.range(from, to);

  const { data: rewards, count, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    profile,
    rewards,
    total: count ?? 0,
    page,
    perPage,
  });
}
