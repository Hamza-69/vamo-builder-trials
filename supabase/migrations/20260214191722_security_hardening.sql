-- ============================================================
-- Security Hardening Migration
-- Fixes: privilege escalation, balance manipulation, 
--        status bypass, missing admin policies, orphaned avatars
-- ============================================================

-- ============================================================
-- FIX #1: Protect profiles.is_admin and profiles.pineapple_balance
-- A BEFORE UPDATE trigger silently reverts protected fields
-- for non-admin callers, preventing privilege escalation and
-- balance manipulation via direct client-side updates.
-- ============================================================
CREATE OR REPLACE FUNCTION public.protect_profile_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    NEW.is_admin := OLD.is_admin;
    NEW.pineapple_balance := OLD.pineapple_balance;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER protect_profile_fields_trigger
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_profile_fields();

-- ============================================================
-- FIX #2 & #3: Remove direct user INSERT on reward_ledger
-- and redemptions. Replace the entire redemption flow with a
-- single atomic SECURITY DEFINER function that validates
-- balance, deducts, creates redemption, ledger entry, and
-- activity event — all within one transaction with row-level
-- locking to prevent race conditions.
-- ============================================================
DROP POLICY IF EXISTS "Owner can insert own ledger" ON reward_ledger;
DROP POLICY IF EXISTS "Owner can insert redemptions" ON redemptions;

CREATE OR REPLACE FUNCTION public.process_redemption(
  p_amount INTEGER,
  p_reward_type TEXT DEFAULT 'uber_eats'
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

  -- Insert ledger entry
  v_idempotency_key := 'redeem_' || v_user_id || '_' || extract(epoch from now())::text || '_' || gen_random_uuid()::text;
  INSERT INTO reward_ledger (user_id, event_type, reward_amount, balance_after, idempotency_key)
  VALUES (v_user_id, 'reward_redeemed', -p_amount, v_new_balance, v_idempotency_key);

  -- Insert activity event (use first project if available)
  SELECT id INTO v_project_id
  FROM projects
  WHERE owner_id = v_user_id
  LIMIT 1;

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

-- ============================================================
-- FIX #4: Admin SELECT policy on activity_events
-- Without this, admin user-detail queries return empty results
-- because auth.uid() doesn't match the target user's user_id.
-- ============================================================
CREATE POLICY "Admins can view all activity_events"
  ON activity_events FOR SELECT
  USING (public.is_admin());

-- ============================================================
-- FIX #5: Enforce project status transitions
-- Prevent reverting a 'sold' project to any other status.
-- Admins are exempt.
-- ============================================================
CREATE OR REPLACE FUNCTION public.enforce_project_status_transition()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.is_admin() THEN
    RETURN NEW;
  END IF;

  -- Cannot change a sold project's status
  IF OLD.status = 'sold' THEN
    RAISE EXCEPTION 'Cannot change status of a sold project';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER enforce_project_status_trigger
  BEFORE UPDATE ON projects
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.enforce_project_status_transition();

-- ============================================================
-- FIX #6: Enforce listing status transitions
-- Prevent reactivating sold, withdrawn, or archived listings.
-- Admins are exempt.
-- ============================================================
CREATE OR REPLACE FUNCTION public.enforce_listing_status_transition()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.is_admin() THEN
    RETURN NEW;
  END IF;

  -- Cannot reactivate sold or withdrawn listings
  IF OLD.status IN ('sold', 'withdrawn') AND NEW.status = 'active' THEN
    RAISE EXCEPTION 'Cannot reactivate a sold or withdrawn listing';
  END IF;

  -- Cannot reactivate archived listings (must create a new listing)
  IF OLD.status = 'archived' AND NEW.status = 'active' THEN
    RAISE EXCEPTION 'Cannot reactivate an archived listing';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER enforce_listing_status_trigger
  BEFORE UPDATE ON listings
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.enforce_listing_status_transition();

-- ============================================================
-- FIX #7: Add avatar DELETE storage policy
-- Allows users to delete their own old avatars, preventing
-- orphaned files in the bucket.
-- ============================================================
CREATE POLICY "Users can delete their own avatar"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
