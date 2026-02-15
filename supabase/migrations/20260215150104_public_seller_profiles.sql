-- Allow public (including anonymous) SELECT on profiles of users who have
-- an active listing.  This lets the marketplace listing detail page join
-- profiles for the seller's name and avatar without requiring authentication.
CREATE POLICY "Public can view listing seller profiles"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM listings
      WHERE listings.user_id = profiles.id
        AND listings.status = 'active'
    )
  );
