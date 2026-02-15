-- ============================================================
-- Enable Supabase Realtime for projects and activity_events
-- ============================================================

-- Realtime filtered subscriptions require REPLICA IDENTITY FULL
ALTER TABLE projects REPLICA IDENTITY FULL;
ALTER TABLE activity_events REPLICA IDENTITY FULL;

-- Add both tables to the supabase_realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE projects;
ALTER PUBLICATION supabase_realtime ADD TABLE activity_events;

-- ============================================================
-- RLS: Allow public SELECT on activity_events for listed projects
-- (needed for the public business panel page)
-- ============================================================
CREATE POLICY "Public can view events for listed projects"
  ON activity_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = activity_events.project_id
        AND projects.status = 'listed'
    )
  );
