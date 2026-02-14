-- Fix infinite recursion: admin policies on `profiles` and `projects`
-- were doing `SELECT 1 FROM profiles` which re-triggers profiles RLS.
-- Replace with auth.jwt()-based check or a security-definer helper.

-- 1. Create a security-definer function that bypasses RLS to check admin status.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM profiles WHERE id = auth.uid()),
    false
  );
$$;

-- 2. Drop the recursive policies
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can view all projects" ON projects;

-- 3. Re-create them using the security-definer helper (no recursion)
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can view all projects"
  ON projects FOR SELECT
  USING (public.is_admin());
