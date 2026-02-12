CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  url TEXT,                          -- linked Lovable/Replit/external URL
  screenshot_url TEXT,
  linkedin_url TEXT,
  github_url TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'listed', 'sold', 'archived')),
  progress_score INTEGER DEFAULT 0,  -- 0-100
  valuation_low INTEGER DEFAULT 0,
  valuation_high INTEGER DEFAULT 0,
  why_built TEXT,                     -- founder's "why" statement
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Owner can CRUD their own projects
CREATE POLICY "Owner can select own projects"
  ON projects FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Owner can insert projects"
  ON projects FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owner can update own projects"
  ON projects FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Owner can delete own projects"
  ON projects FOR DELETE USING (auth.uid() = owner_id);

-- Public can view listed projects (marketplace)
CREATE POLICY "Public can view listed projects"
  ON projects FOR SELECT USING (status = 'listed');

-- Admins can view all
CREATE POLICY "Admins can view all projects"
  ON projects FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );