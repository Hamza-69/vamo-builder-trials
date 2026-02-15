-- Create a SECURITY DEFINER function for awarding pineapple rewards.
-- This replaces direct INSERT into reward_ledger (which was blocked by
-- the security hardening migration that removed the user INSERT policy).

CREATE OR REPLACE FUNCTION public.award_pineapple_reward(
  p_project_id UUID,
  p_event_type TEXT,
  p_idempotency_key TEXT,
  p_rate_limit_window_ms INTEGER DEFAULT 3600000,
  p_max_prompt_rewards INTEGER DEFAULT 60
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
  v_user_id := auth.uid();
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
