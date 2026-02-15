-- Fix: protect_profile_fields trigger was blocking pineapple_balance updates
-- even from SECURITY DEFINER functions (award_pineapple_reward, redeem_pineapples).
-- The trigger checks is_admin() which uses auth.uid() — regular users are not admin,
-- so the balance revert fires even inside trusted RPC calls.
--
-- Fix: only apply the guard when current_user = 'authenticated' (direct client call).
-- SECURITY DEFINER functions run as 'postgres', so they bypass the guard naturally.

CREATE OR REPLACE FUNCTION public.protect_profile_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only guard against direct client-side updates (role = 'authenticated').
  -- SECURITY DEFINER functions (award_pineapple_reward, redeem_pineapples)
  -- run as the function owner ('postgres'), so they are allowed through.
  IF current_user = 'authenticated' AND NOT public.is_admin() THEN
    NEW.is_admin := OLD.is_admin;
    NEW.pineapple_balance := OLD.pineapple_balance;
  END IF;
  RETURN NEW;
END;
$$;
