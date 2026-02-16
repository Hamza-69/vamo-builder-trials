import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { verifyCsrfToken } from "@/lib/csrf";
import { trackEventServer } from "@/lib/analytics-server";

/**
 * POST /api/redeem
 * Body: { amount: number, rewardType?: string }
 *
 * Calls the `process_redemption` SECURITY DEFINER function which
 * atomically: verifies balance, deducts, creates redemption + ledger
 * entry + activity event — all within a single transaction with
 * row-level locking.
 */
export async function POST(request: NextRequest) {
  // --- CSRF verification ---
  const csrfValid = await verifyCsrfToken(request);
  if (!csrfValid) {
    return NextResponse.json(
      { error: "Invalid CSRF token" },
      { status: 403 }
    );
  }

  const supabase = createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // --- Parse body ---
  let body: { amount?: number; rewardType?: string; projectId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const amount = body.amount;
  const rewardType = body.rewardType || "uber_eats";
  const projectId = body.projectId || null;

  if (!amount || typeof amount !== "number" || amount < 50) {
    return NextResponse.json(
      { error: "Minimum redemption is 50 🍍" },
      { status: 400 }
    );
  }

  if (!Number.isInteger(amount)) {
    return NextResponse.json(
      { error: "Amount must be a whole number" },
      { status: 400 }
    );
  }

  // --- Call atomic redemption function (service role) ---
  const { data, error } = await supabase.rpc("process_redemption", {
    p_amount: amount,
    p_reward_type: rewardType,
    p_project_id: projectId,
    p_user_id: user.id,
  });

  if (error) {
    // Map DB exceptions to user-friendly errors
    const msg = error.message;
    if (msg.includes("Insufficient balance")) {
      return NextResponse.json({ error: "Insufficient balance" }, { status: 400 });
    }
    if (msg.includes("Minimum redemption")) {
      return NextResponse.json({ error: "Minimum redemption is 50 🍍" }, { status: 400 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  // Track analytics event (service role)
  await trackEventServer(supabase, user.id, "reward_redeemed", {
    amount,
    rewardType,
  });

  return NextResponse.json({
    success: true,
    newBalance: data.new_balance,
    message: "Redemption submitted! You'll receive your reward within 48 hours.",
  });
}
