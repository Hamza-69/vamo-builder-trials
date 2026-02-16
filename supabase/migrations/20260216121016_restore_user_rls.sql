-- ============================================================
-- RESTORE USER RLS POLICIES
-- ============================================================
-- Enable authenticated users to perform necessary CRUD operations
-- on their own data, replacing the need for service-role bypass.
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- profiles
-- ────────────────────────────────────────────────────────────
-- Allow users to update their own profile
-- (previously removed in read_only_client_rls.sql)
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ────────────────────────────────────────────────────────────
-- projects
-- ────────────────────────────────────────────────────────────
-- Allow users to insert projects (they become owner)
CREATE POLICY "Users can insert projects"
  ON projects FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

-- Allow users to update their own projects
CREATE POLICY "Users can update own projects"
  ON projects FOR UPDATE
  USING (auth.uid() = owner_id);

-- Allow users to delete their own projects
CREATE POLICY "Users can delete own projects"
  ON projects FOR DELETE
  USING (auth.uid() = owner_id);

-- ────────────────────────────────────────────────────────────
-- listings
-- ────────────────────────────────────────────────────────────
-- Allow users to insert listings for their own projects
CREATE POLICY "Users can insert listings"
  ON listings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own listings
CREATE POLICY "Users can update own listings"
  ON listings FOR UPDATE
  USING (auth.uid() = user_id);

-- ────────────────────────────────────────────────────────────
-- activity_events
-- ────────────────────────────────────────────────────────────
-- Allow users to insert activity events (scoped to their user_id)
CREATE POLICY "Users can insert activity events"
  ON activity_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ────────────────────────────────────────────────────────────
-- analytics_events
-- ────────────────────────────────────────────────────────────
-- Allow users to insert analytics events
CREATE POLICY "Users can insert analytics events"
  ON analytics_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ────────────────────────────────────────────────────────────
-- messages
-- ────────────────────────────────────────────────────────────
-- Allow users to insert messages
CREATE POLICY "Users can insert messages"
  ON messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ────────────────────────────────────────────────────────────
-- offers
-- ────────────────────────────────────────────────────────────
-- Allow users to insert offers
CREATE POLICY "Users can insert offers"
  ON offers FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own offers (e.g. to expire them)
CREATE POLICY "Users can update own offers"
  ON offers FOR UPDATE
  USING (auth.uid() = user_id);

-- ────────────────────────────────────────────────────────────
-- traction_signals
-- ────────────────────────────────────────────────────────────
-- Allow users to insert traction signals
CREATE POLICY "Users can insert traction signals"
  ON traction_signals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ────────────────────────────────────────────────────────────
-- chat_summaries
-- ────────────────────────────────────────────────────────────
-- Allow users to insert chat summaries (must own the project)
CREATE POLICY "Users can insert chat summaries"
  ON chat_summaries FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = chat_summaries.project_id
        AND projects.owner_id = auth.uid()
    )
  );
