-- Business panel visibility toggles
ALTER TABLE projects
  ADD COLUMN is_quote_shown       BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN is_valuation_shown   BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN is_why_shown         BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN is_progress_shown    BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN is_traction_shown    BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN is_links_shown       BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN is_activity_timeline_shown BOOLEAN NOT NULL DEFAULT true;