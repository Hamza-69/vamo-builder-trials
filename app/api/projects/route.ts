import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = createClient();

  // Authenticate
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Parse query params
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";
  const sortBy = searchParams.get("sortBy") || "newest";
  const valuationMin = searchParams.get("valuationMin");
  const valuationMax = searchParams.get("valuationMax");
  const progressMin = searchParams.get("progressMin");
  const progressMax = searchParams.get("progressMax");

  let query = supabase
    .from("projects")
    .select("*")
    .eq("owner_id", user.id);

  // Search by name or description
  if (search) {
    query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
  }

  // Filter by valuation range
  if (valuationMin) {
    query = query.gte("valuation_low", Number(valuationMin));
  }
  if (valuationMax) {
    query = query.lte("valuation_high", Number(valuationMax));
  }

  // Filter by progress score range
  if (progressMin) {
    query = query.gte("progress_score", Number(progressMin));
  }
  if (progressMax) {
    query = query.lte("progress_score", Number(progressMax));
  }

  // Sort
  switch (sortBy) {
    case "oldest":
      query = query.order("created_at", { ascending: true });
      break;
    case "progress_asc":
      query = query.order("progress_score", { ascending: true, nullsFirst: false });
      break;
    case "progress_desc":
      query = query.order("progress_score", { ascending: false, nullsFirst: false });
      break;
    case "valuation_low":
      query = query.order("valuation_low", { ascending: true, nullsFirst: false });
      break;
    case "valuation_high":
      query = query.order("valuation_high", { ascending: false, nullsFirst: false });
      break;
    case "newest":
    default:
      query = query.order("created_at", { ascending: false });
      break;
  }

  const { data: projects, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ projects });
}
