import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { verifyCsrfToken } from "@/lib/csrf";

/**
 * POST /api/redeem
 * Body: { amount: number, rewardType?: string }
 *
 * 1. Verify user has sufficient balance.
 * 2. Deduct from profiles.pineapple_balance.
 * 3. Insert into redemptions with status = 'pending'.
 * 4. Insert into reward_ledger with negative amount.
 * 5. Insert activity_event with event_type = 'reward_redeemed'.
 * 6. Return success.
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
  let body: { amount?: number; rewardType?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const amount = body.amount;
  const rewardType = body.rewardType || "uber_eats";

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

  // --- 1. Verify balance ---
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("pineapple_balance")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return NextResponse.json(
      { error: "Could not fetch profile" },
      { status: 500 }
    );
  }

  const currentBalance = profile.pineapple_balance ?? 0;

  if (amount > currentBalance) {
    return NextResponse.json(
      { error: "Insufficient balance" },
      { status: 400 }
    );
  }

  const newBalance = currentBalance - amount;

  // --- 2. Deduct from pineapple_balance ---
  const { error: updateError } = await supabase
    .from("profiles")
    .update({ pineapple_balance: newBalance, updated_at: new Date().toISOString() })
    .eq("id", user.id);

  if (updateError) {
    return NextResponse.json(
      { error: "Failed to update balance" },
      { status: 500 }
    );
  }

  // --- 3. Insert redemption ---
  const { error: redemptionError } = await supabase
    .from("redemptions")
    .insert({
      user_id: user.id,
      amount,
      reward_type: rewardType,
      status: "pending",
    });

  if (redemptionError) {
    // Rollback balance
    await supabase
      .from("profiles")
      .update({ pineapple_balance: currentBalance })
      .eq("id", user.id);

    return NextResponse.json(
      { error: "Failed to create redemption" },
      { status: 500 }
    );
  }

  // --- 4. Insert reward_ledger entry (negative amount) ---
  const idempotencyKey = `redeem_${user.id}_${Date.now()}_${crypto.randomUUID()}`;
  const { error: ledgerError } = await supabase.from("reward_ledger").insert({
    user_id: user.id,
    event_type: "reward_redeemed",
    reward_amount: -amount,
    balance_after: newBalance,
    idempotency_key: idempotencyKey,
  });

  if (ledgerError) {
    console.error("Failed to insert ledger entry:", ledgerError);
    // Non-critical — redemption already recorded
  }

  // --- 5. Insert activity_event ---
  // activity_events requires project_id, so we pick the user's first project or skip
  const { data: firstProject } = await supabase
    .from("projects")
    .select("id")
    .eq("owner_id", user.id)
    .limit(1)
    .single();

  if (firstProject) {
    const { error: activityError } = await supabase
      .from("activity_events")
      .insert({
        project_id: firstProject.id,
        user_id: user.id,
        event_type: "reward_redeemed",
        description: `Redeemed ${amount} 🍍 for ${rewardType}`,
        metadata: { amount, reward_type: rewardType },
      });

    if (activityError) {
      console.error("Failed to insert activity event:", activityError);
    }
  }

  // --- 6. Return success ---
  return NextResponse.json({
    success: true,
    newBalance,
    message: "Redemption submitted! You'll receive your reward within 48 hours.",
  });
}
