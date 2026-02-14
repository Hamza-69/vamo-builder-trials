-- ============================================================
-- 1) Update process_redemption to accept an optional project_id
--    so the user can choose which project to associate with
--    the reward ledger entry and activity event.
-- ============================================================
CREATE OR REPLACE FUNCTION public.process_redemption(
  p_amount INTEGER,
  p_reward_type TEXT DEFAULT 'uber_eats',
  p_project_id UUID DEFAULT NULL
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
  v_user_id := auth.uid();
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
