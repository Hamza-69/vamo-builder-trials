-- ============================================================
-- Allow service-role callers to pass p_user_id explicitly.
-- When called with the anon/authenticated key auth.uid() is used;
-- when called via the service role key auth.uid() is NULL so
-- p_user_id is required.
-- ============================================================

-- 1) Recreate award_pineapple_reward with optional p_user_id
CREATE OR REPLACE FUNCTION public.award_pineapple_reward(
  p_project_id UUID,
  p_event_type TEXT,
  p_idempotency_key TEXT,
  p_rate_limit_window_ms INTEGER DEFAULT 3600000,
  p_max_prompt_rewards INTEGER DEFAULT 60,
  p_user_id UUID DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_existing RECORD;
  v_reward_amount INTEGER;
  v_current_balance INTEGER;
  v_new_balance INTEGER;
  v_ledger_id UUID;
  v_rate_count INTEGER;
  v_one_hour_ago TIMESTAMPTZ;
  v_reward_amounts jsonb := '{
    "prompt": 1,
    "tag_prompt": 1,
    "link_linkedin": 5,
    "link_github": 5,
    "link_website": 3,
    "feature_shipped": 3,
    "customer_added": 5,
    "revenue_logged": 10
  }'::jsonb;
BEGIN
  -- Use explicit user_id when provided (service-role), otherwise auth.uid()
  v_user_id := COALESCE(p_user_id, auth.uid());
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Validate event type
  IF NOT v_reward_amounts ? p_event_type THEN
    RAISE EXCEPTION 'Invalid event type: %', p_event_type;
  END IF;

  -- 1. Idempotency check
  SELECT id, reward_amount, balance_after
  INTO v_existing
  FROM reward_ledger
  WHERE idempotency_key = p_idempotency_key;

  IF FOUND THEN
    RETURN jsonb_build_object(
      'rewarded', false,
      'duplicate', true,
      'amount', v_existing.reward_amount,
      'new_balance', v_existing.balance_after,
      'ledger_entry_id', v_existing.id
    );
  END IF;

  -- 2. Calculate reward amount
  v_reward_amount := (v_reward_amounts ->> p_event_type)::INTEGER;

  -- 3. Rate limiting for prompt-type rewards
  IF p_event_type IN ('prompt', 'tag_prompt') THEN
    v_one_hour_ago := now() - (p_rate_limit_window_ms || ' milliseconds')::INTERVAL;

    SELECT count(*) INTO v_rate_count
    FROM reward_ledger
    WHERE user_id = v_user_id
      AND project_id = p_project_id
      AND event_type IN ('prompt', 'tag_prompt')
      AND created_at >= v_one_hour_ago;

    IF v_rate_count >= p_max_prompt_rewards THEN
      v_reward_amount := 0;
    END IF;
  END IF;

  -- 4. Get current balance (with lock)
  SELECT pineapple_balance INTO v_current_balance
  FROM profiles
  WHERE id = v_user_id
  FOR UPDATE;

  IF v_current_balance IS NULL THEN
    RAISE EXCEPTION 'Profile not found';
  END IF;

  v_new_balance := v_current_balance + v_reward_amount;

  -- 5. Insert ledger entry
  BEGIN
    INSERT INTO reward_ledger (user_id, project_id, event_type, reward_amount, balance_after, idempotency_key)
    VALUES (v_user_id, p_project_id, p_event_type, v_reward_amount, v_new_balance, p_idempotency_key)
    RETURNING id INTO v_ledger_id;
  EXCEPTION WHEN unique_violation THEN
    -- Race condition: idempotency key already exists
    SELECT id, reward_amount, balance_after
    INTO v_existing
    FROM reward_ledger
    WHERE idempotency_key = p_idempotency_key;

    RETURN jsonb_build_object(
      'rewarded', false,
      'duplicate', true,
      'amount', v_existing.reward_amount,
      'new_balance', v_existing.balance_after,
      'ledger_entry_id', v_existing.id
    );
  END;

  -- 6. Update profile balance
  IF v_reward_amount > 0 THEN
    UPDATE profiles
    SET pineapple_balance = v_new_balance, updated_at = now()
    WHERE id = v_user_id;
  END IF;

  -- 7. Insert activity event
  INSERT INTO activity_events (project_id, user_id, event_type, description, metadata)
  VALUES (
    p_project_id,
    v_user_id,
    'reward_earned',
    'Earned ' || v_reward_amount || ' 🍍 for ' || p_event_type,
    jsonb_build_object(
      'reward_amount', v_reward_amount,
      'event_type', p_event_type,
      'balance_after', v_new_balance,
      'idempotency_key', p_idempotency_key
    )
  );

  RETURN jsonb_build_object(
    'rewarded', true,
    'duplicate', false,
    'amount', v_reward_amount,
    'new_balance', v_new_balance,
    'ledger_entry_id', v_ledger_id
  );
END;
$$;


-- 2) Recreate process_redemption with optional p_user_id
CREATE OR REPLACE FUNCTION public.process_redemption(
  p_amount INTEGER,
  p_reward_type TEXT DEFAULT 'uber_eats',
  p_project_id UUID DEFAULT NULL,
  p_user_id UUID DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_current_balance INTEGER;
  v_new_balance INTEGER;
  v_redemption_id UUID;
  v_idempotency_key TEXT;
  v_project_id UUID;
BEGIN
  -- Use explicit user_id when provided (service-role), otherwise auth.uid()
  v_user_id := COALESCE(p_user_id, auth.uid());
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Validate amount
  IF p_amount IS NULL OR p_amount < 50 THEN
    RAISE EXCEPTION 'Minimum redemption is 50 pineapples';
  END IF;

  IF p_amount != trunc(p_amount) THEN
    RAISE EXCEPTION 'Amount must be a whole number';
  END IF;

  -- Resolve project_id: use provided value if the user owns it, else fall back to first project
  IF p_project_id IS NOT NULL THEN
    SELECT id INTO v_project_id
    FROM projects
    WHERE id = p_project_id AND owner_id = v_user_id;
  END IF;

  IF v_project_id IS NULL THEN
    SELECT id INTO v_project_id
    FROM projects
    WHERE owner_id = v_user_id
    LIMIT 1;
  END IF;

  -- Lock the profile row to prevent race conditions
  SELECT pineapple_balance INTO v_current_balance
  FROM profiles
  WHERE id = v_user_id
  FOR UPDATE;

  IF v_current_balance IS NULL THEN
    RAISE EXCEPTION 'Profile not found';
  END IF;

  IF p_amount > v_current_balance THEN
    RAISE EXCEPTION 'Insufficient balance';
  END IF;

  v_new_balance := v_current_balance - p_amount;

  -- Deduct balance
  UPDATE profiles
  SET pineapple_balance = v_new_balance, updated_at = now()
  WHERE id = v_user_id;

  -- Insert redemption
  INSERT INTO redemptions (user_id, amount, reward_type, status)
  VALUES (v_user_id, p_amount, p_reward_type, 'pending')
  RETURNING id INTO v_redemption_id;

  -- Insert ledger entry (with project_id)
  v_idempotency_key := 'redeem_' || v_user_id || '_' || extract(epoch from now())::text || '_' || gen_random_uuid()::text;
  INSERT INTO reward_ledger (user_id, project_id, event_type, reward_amount, balance_after, idempotency_key)
  VALUES (v_user_id, v_project_id, 'reward_redeemed', -p_amount, v_new_balance, v_idempotency_key);

  -- Insert activity event
  IF v_project_id IS NOT NULL THEN
    INSERT INTO activity_events (project_id, user_id, event_type, description, metadata)
    VALUES (
      v_project_id,
      v_user_id,
      'reward_redeemed',
      'Redeemed ' || p_amount || ' 🍍 for ' || p_reward_type,
      jsonb_build_object('amount', p_amount, 'reward_type', p_reward_type)
    );
  END IF;

  RETURN jsonb_build_object(
    'redemption_id', v_redemption_id,
    'new_balance', v_new_balance
  );
END;
$$;
