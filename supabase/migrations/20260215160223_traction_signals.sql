CREATE TABLE traction_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  signal_type TEXT NOT NULL CHECK (signal_type IN (
    'feature_shipped', 'customer_added', 'revenue_logged'
  )),
  description TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'prompt',
  prompt_message_id UUID,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE traction_signals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner can view own traction signals"
  ON traction_signals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Owner can insert traction signals"
  ON traction_signals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Public can view signals for listed projects"
  ON traction_signals FOR SELECT
  USING (
    project_id IN (
      SELECT id FROM projects WHERE status = 'listed'
    )
  );

-- Index for fast lookups by project
CREATE INDEX idx_traction_signals_project_id ON traction_signals(project_id);
CREATE INDEX idx_traction_signals_created_at ON traction_signals(project_id, created_at DESC);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE traction_signals;
ALTER TABLE traction_signals REPLICA IDENTITY FULL;
