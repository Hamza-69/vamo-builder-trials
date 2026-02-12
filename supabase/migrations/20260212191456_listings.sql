CREATE TABLE listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  asking_price_low INTEGER,
  asking_price_high INTEGER,
  last_timeline_item_id UUID REFERENCES activity_events(id) ON DELETE SET NULL, -- this allows us to get a snapshot of the project at the time of listing, and track changes since then
  screenshots JSONB DEFAULT '[]',     -- Array of screenshot URLs
  metrics JSONB DEFAULT '{}',         -- Progress score, traction signals, etc.
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'sold', 'withdrawn')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE listings ENABLE ROW LEVEL SECURITY;

-- Owner can manage their own listings
CREATE POLICY "Owner can select own listings"
  ON listings FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Owner can insert listings"
  ON listings FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owner can update own listings"
  ON listings FOR UPDATE USING (auth.uid() = user_id);

-- Public can view active listings
CREATE POLICY "Public can view active listings"
  ON listings FOR SELECT USING (status = 'active');