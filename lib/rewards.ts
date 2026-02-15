import { SupabaseClient } from "@supabase/supabase-js";
import { trackEventServer } from "@/lib/analytics-server";

// ── Reward schedule ──────────────────────────────────────────────────────────
export const REWARD_AMOUNTS: Record<string, number> = {
  prompt: 1,
  tag_prompt: 1, // bonus for tagging a prompt
  link_linkedin: 5,
  link_github: 5,
  link_website: 3,
  feature_shipped: 3,
  customer_added: 5,
  revenue_logged: 10,
};

// ── Anti-spam constants ──────────────────────────────────────────────────────
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_PROMPT_REWARDS_PER_HOUR = 60;

// ── Types ────────────────────────────────────────────────────────────────────
export interface AwardRewardParams {
  supabase: SupabaseClient;
  userId: string;
  projectId: string;
  eventType: string;
  idempotencyKey: string;
}

export interface AwardRewardResult {
  rewarded: boolean;
  duplicate: boolean;
  amount: number;
  newBalance: number;
  ledgerEntryId?: string;
}

/**
 * Award pineapples for a given event.
 *
 * - Idempotent: duplicate `idempotencyKey` returns existing record.
 * - Ledger-based: every reward is recorded with `balance_after`.
 * - Rate-limited: prompt/tag_prompt events are capped at 60/project/hour.
 *
 * Call this from any server-side API route — no HTTP overhead.
 */
export async function awardReward(
  params: AwardRewardParams,
): Promise<AwardRewardResult> {
  const { supabase, userId, projectId, eventType, idempotencyKey } = params;

  if (!(eventType in REWARD_AMOUNTS)) {
    throw new Error(
      `Invalid eventType "${eventType}". Must be one of: ${Object.keys(REWARD_AMOUNTS).join(", ")}`,
    );
  }

  // ── 1. Idempotency check ─────────────────────────────────────────────────
  const { data: existing, error: lookupError } = await supabase
    .from("reward_ledger")
    .select("*")
    .eq("idempotency_key", idempotencyKey)
    .maybeSingle();

  if (lookupError) {
    throw lookupError;
  }

  if (existing) {
    return {
      rewarded: false,
      duplicate: true,
      amount: existing.reward_amount,
      newBalance: existing.balance_after,
      ledgerEntryId: existing.id,
    };
  }

  // ── 2. Calculate reward amount ───────────────────────────────────────────
  let rewardAmount = REWARD_AMOUNTS[eventType]!;

  // ── 3. Anti-spam: rate-limit prompt-type rewards ─────────────────────────
  if (eventType === "prompt" || eventType === "tag_prompt") {
    const oneHourAgo = new Date(
      Date.now() - RATE_LIMIT_WINDOW_MS,
    ).toISOString();

    const { count, error: countError } = await supabase
      .from("reward_ledger")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("project_id", projectId)
      .in("event_type", ["prompt", "tag_prompt"])
      .gte("created_at", oneHourAgo);

    if (countError) {
      throw countError;
    }

    if ((count ?? 0) >= MAX_PROMPT_REWARDS_PER_HOUR) {
      rewardAmount = 0;
    }
  }

  // ── 4. Get current balance ───────────────────────────────────────────────
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("pineapple_balance")
    .eq("id", userId)
    .single();

  if (profileError || !profile) {
    throw new Error("Profile not found");
  }

  const currentBalance = profile.pineapple_balance ?? 0;
  const newBalance = currentBalance + rewardAmount;

  // ── 5. Insert ledger entry ───────────────────────────────────────────────
  const { data: ledgerEntry, error: insertError } = await supabase
    .from("reward_ledger")
    .insert({
      user_id: userId,
      project_id: projectId,
      event_type: eventType,
      reward_amount: rewardAmount,
      balance_after: newBalance,
      idempotency_key: idempotencyKey,
    })
    .select()
    .single();

  if (insertError) {
    // Race condition: unique constraint violation → treat as duplicate
    if (
      insertError.code === "23505" ||
      insertError.message?.includes("duplicate key") ||
      insertError.message?.includes("unique constraint")
    ) {
      const { data: raceExisting } = await supabase
        .from("reward_ledger")
        .select("*")
        .eq("idempotency_key", idempotencyKey)
        .single();

      return {
        rewarded: false,
        duplicate: true,
        amount: raceExisting?.reward_amount ?? rewardAmount,
        newBalance: raceExisting?.balance_after ?? newBalance,
        ledgerEntryId: raceExisting?.id,
      };
    }

    throw insertError;
  }

  // ── 6. Update profile balance ────────────────────────────────────────────
  if (rewardAmount > 0) {
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ pineapple_balance: newBalance })
      .eq("id", userId);

    if (updateError) {
      console.error(
        "[rewards] Failed to update pineapple_balance:",
        updateError.message,
      );
    }
  }

  // ── 7. Insert activity event ─────────────────────────────────────────────
  const { error: activityError } = await supabase
    .from("activity_events")
    .insert({
      project_id: projectId,
      user_id: userId,
      event_type: "reward_earned",
      description: `Earned ${rewardAmount} 🍍 for ${eventType}`,
      metadata: {
        reward_amount: rewardAmount,
        event_type: eventType,
        balance_after: newBalance,
        idempotency_key: idempotencyKey,
      },
    });

  if (activityError) {
    console.error(
      "[rewards] Failed to insert activity event:",
      activityError.message,
    );
  }

  // ── Analytics (non-blocking) ─────────────────────────────────────────────
  await trackEventServer(
    supabase,
    userId,
    "reward_earned",
    { eventType, rewardAmount, newBalance, projectId },
    projectId,
  );

  return {
    rewarded: true,
    duplicate: false,
    amount: rewardAmount,
    newBalance,
    ledgerEntryId: ledgerEntry.id,
  };
}
