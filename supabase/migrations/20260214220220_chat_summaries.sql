-- Stores rolling summaries of older chat messages per project
CREATE TABLE chat_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  summary TEXT NOT NULL,
  messages_up_to TIMESTAMPTZ NOT NULL,  -- summarises messages created_at <= this
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE chat_summaries ENABLE ROW LEVEL SECURITY;

-- Only the project owner (through project ownership) can see summaries
CREATE POLICY "Owner can select own summaries"
  ON chat_summaries FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = chat_summaries.project_id
        AND projects.owner_id = auth.uid()
    )
  );

CREATE POLICY "Owner can insert summaries"
  ON chat_summaries FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = chat_summaries.project_id
        AND projects.owner_id = auth.uid()
    )
  );
