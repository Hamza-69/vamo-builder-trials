import { SupabaseClient } from "@supabase/supabase-js";
import { trackEventServer } from "@/lib/analytics-server";

// ── Reward schedule (kept for reference / validation client-side) ─────────────
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
 * - Uses a SECURITY DEFINER RPC to bypass RLS on reward_ledger.
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

  // Call the SECURITY DEFINER function that handles everything atomically
  const { data, error } = await supabase.rpc("award_pineapple_reward", {
    p_project_id: projectId,
    p_event_type: eventType,
    p_idempotency_key: idempotencyKey,
  });

  if (error) {
    throw error;
  }

  const result = data as {
    rewarded: boolean;
    duplicate: boolean;
    amount: number;
    new_balance: number;
    ledger_entry_id: string;
  };

  // Analytics (non-blocking) — only for new rewards
  if (result.rewarded) {
    await trackEventServer(
      supabase,
      userId,
      "reward_earned",
      {
        eventType,
        rewardAmount: result.amount,
        newBalance: result.new_balance,
        projectId,
      },
      projectId,
    );
  }

  return {
    rewarded: result.rewarded,
    duplicate: result.duplicate,
    amount: result.amount,
    newBalance: result.new_balance,
    ledgerEntryId: result.ledger_entry_id,
  };
}
