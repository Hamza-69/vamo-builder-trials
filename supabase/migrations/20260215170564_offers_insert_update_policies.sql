-- Add INSERT and UPDATE RLS policies for the offers table

CREATE POLICY "Owner can insert own offers"
  ON offers FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owner can update own offers"
  ON offers FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
