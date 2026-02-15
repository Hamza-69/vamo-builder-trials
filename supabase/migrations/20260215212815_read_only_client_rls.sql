-- ============================================================
-- READ-ONLY CLIENT RLS
-- ============================================================
-- Drop ALL INSERT / UPDATE / DELETE policies for authenticated
-- users across every table. Only SELECT (read) policies remain.
-- All mutations now go through API routes using the service-role
-- key, which bypasses RLS entirely.
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- profiles
-- ────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Enable insert for auth" ON profiles;
-- Keep: "Users can view own profile" (SELECT)
-- Keep: "Admins can view all profiles" (SELECT)

-- ────────────────────────────────────────────────────────────
-- projects
-- ────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Owner can insert projects" ON projects;
DROP POLICY IF EXISTS "Owner can update own projects" ON projects;
DROP POLICY IF EXISTS "Owner can delete own projects" ON projects;
-- Keep: "Owner can select own projects" (SELECT)
-- Keep: "Public can view listed projects" (SELECT)
-- Keep: "Admins can view all projects" (SELECT)

-- ────────────────────────────────────────────────────────────
-- messages
-- ────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Owner can insert messages" ON messages;
-- Keep: "Owner can select own messages" (SELECT)
-- Keep: "Admins can view all messages" (SELECT)

-- ────────────────────────────────────────────────────────────
-- activity_events
-- ────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Owner can insert events" ON activity_events;
-- Keep: "Owner can select own events" (SELECT)
-- Keep: "Admins can view all activity_events" (SELECT)
-- Keep: "Public can view events for listed projects" (SELECT)

-- ────────────────────────────────────────────────────────────
-- analytics_events
-- ────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can insert own analytics" ON analytics_events;
-- Keep: "Admins can view analytics" (SELECT)

-- ────────────────────────────────────────────────────────────
-- listings
-- ────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Owner can insert listings" ON listings;
DROP POLICY IF EXISTS "Owner can update own listings" ON listings;
-- Keep: "Owner can select own listings" (SELECT)
-- Keep: "Public can view active listings" (SELECT)
-- Keep: "Admins can view all listings" (SELECT)

-- ────────────────────────────────────────────────────────────
-- offers
-- ────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Owner can insert own offers" ON offers;
DROP POLICY IF EXISTS "Owner can update own offers" ON offers;
-- Keep: "Owner can view own offers" (SELECT)

-- ────────────────────────────────────────────────────────────
-- traction_signals
-- ────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Owner can insert traction signals" ON traction_signals;
-- Keep: "Owner can view own traction signals" (SELECT)
-- Keep: "Public can view signals for listed projects" (SELECT)

-- ────────────────────────────────────────────────────────────
-- chat_summaries
-- ────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Owner can insert summaries" ON chat_summaries;
-- Keep: "Owner can select own summaries" (SELECT)

-- ────────────────────────────────────────────────────────────
-- redemptions  (user INSERT was already removed in security_hardening)
-- ────────────────────────────────────────────────────────────
-- Keep: "Owner can view own redemptions" (SELECT)
-- Keep: "Admins can view all redemptions" (SELECT)
-- Keep: "Admins can update redemptions" (SELECT) — admin still uses server client

-- ────────────────────────────────────────────────────────────
-- reward_ledger  (user INSERT was already removed in security_hardening)
-- ────────────────────────────────────────────────────────────
-- Keep: "Owner can view own ledger" (SELECT)
-- Keep: "Admins can view all ledger" (SELECT)

-- ────────────────────────────────────────────────────────────
-- Storage: tighten upload policies to require a valid
-- signed upload token (handled via service-role presigned URLs).
-- We keep the existing INSERT/UPDATE/DELETE storage policies
-- as-is because they already enforce user-folder scoping, and
-- direct client uploads are secured by folder-based ownership.
-- ────────────────────────────────────────────────────────────
-- Storage policies remain unchanged (see secure upload notes).
