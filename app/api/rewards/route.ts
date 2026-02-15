import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createServiceClient } from "@/utils/supabase/service";
import { verifyCsrfToken } from "@/lib/csrf";
import { awardReward, REWARD_AMOUNTS } from "@/lib/rewards";

/**
 * POST /api/rewards
 *
 * Event-driven, idempotent, ledger-based reward system.
 * Thin HTTP wrapper around the shared `awardReward()` utility.
 *
 * Body: {
 *   userId:         string   — profile id (must match authenticated user)
 *   projectId:      string   — project id
 *   eventType:      string   — one of REWARD_AMOUNTS keys
 *   idempotencyKey: string   — deterministic key, e.g. `${messageId}-prompt-reward`
 * }
 */
export async function POST(request: NextRequest) {
  // ── CSRF ───────────────────────────────────────────────────────────
  const csrfValid = await verifyCsrfToken(request);
  if (!csrfValid) {
    return NextResponse.json(
      { error: "Invalid CSRF token" },
      { status: 403 },
    );
  }

  // ── Auth ───────────────────────────────────────────────────────────
  const supabase = createClient();  const admin = createServiceClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ── Parse & validate body ──────────────────────────────────────────
  let body: {
    userId?: string;
    projectId?: string;
    eventType?: string;
    idempotencyKey?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { userId, projectId, eventType, idempotencyKey } = body;

  if (!userId || !projectId || !eventType || !idempotencyKey) {
    return NextResponse.json(
      { error: "Missing required fields: userId, projectId, eventType, idempotencyKey" },
      { status: 400 },
    );
  }

  if (userId !== user.id) {
    return NextResponse.json(
      { error: "userId does not match authenticated user" },
      { status: 403 },
    );
  }

  if (!(eventType in REWARD_AMOUNTS)) {
    return NextResponse.json(
      { error: `Invalid eventType. Must be one of: ${Object.keys(REWARD_AMOUNTS).join(", ")}` },
      { status: 400 },
    );
  }

  // ── Delegate to shared reward logic ────────────────────────────────
  try {
    const result = await awardReward({
      supabase: admin,
      userId,
      projectId,
      eventType,
      idempotencyKey,
    });

    return NextResponse.json({
      rewarded: result.rewarded,
      duplicate: result.duplicate,
      amount: result.amount,
      newBalance: result.newBalance,
      ledgerEntryId: result.ledgerEntryId,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";

    if (message === "Profile not found") {
      return NextResponse.json({ error: message }, { status: 404 });
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
