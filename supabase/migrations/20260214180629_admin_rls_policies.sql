-- Fix remaining admin policies that use recursive subqueries on profiles.
-- Use the existing public.is_admin() security-definer function instead.

-- ============================================================
-- redemptions: fix recursive admin policies
-- ============================================================
DROP POLICY IF EXISTS "Admins can view all redemptions" ON redemptions;
CREATE POLICY "Admins can view all redemptions"
  ON redemptions FOR SELECT
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can update redemptions" ON redemptions;
CREATE POLICY "Admins can update redemptions"
  ON redemptions FOR UPDATE
  USING (public.is_admin());

-- ============================================================
-- analytics_events: fix recursive admin policy
-- ============================================================
DROP POLICY IF EXISTS "Admins can view analytics" ON analytics_events;
CREATE POLICY "Admins can view analytics"
  ON analytics_events FOR SELECT
  USING (public.is_admin());

-- ============================================================
-- reward_ledger: fix recursive admin policy
-- ============================================================
DROP POLICY IF EXISTS "Admins can view all ledger" ON reward_ledger;
CREATE POLICY "Admins can view all ledger"
  ON reward_ledger FOR SELECT
  USING (public.is_admin());

-- ============================================================
-- messages: allow admins to view all messages (for prompt count)
-- ============================================================
CREATE POLICY "Admins can view all messages"
  ON messages FOR SELECT
  USING (public.is_admin());

-- ============================================================
-- listings: allow admins to view all listings
-- ============================================================
CREATE POLICY "Admins can view all listings"
  ON listings FOR SELECT
  USING (public.is_admin());
