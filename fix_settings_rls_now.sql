-- Quick fix for Settings RLS - Run this directly on Supabase
-- This can be executed without resetting the database

-- Drop existing policies
DROP POLICY IF EXISTS settings_select_auth ON public.settings;
DROP POLICY IF EXISTS settings_insert_auth ON public.settings;
DROP POLICY IF EXISTS settings_update_auth ON public.settings;
DROP POLICY IF EXISTS settings_delete_auth ON public.settings;
DROP POLICY IF EXISTS settings_select_policy ON public.settings;
DROP POLICY IF EXISTS settings_insert_policy ON public.settings;
DROP POLICY IF EXISTS settings_update_policy ON public.settings;
DROP POLICY IF EXISTS settings_delete_policy ON public.settings;

-- Enable RLS
ALTER TABLE IF EXISTS public.settings ENABLE ROW LEVEL SECURITY;

-- Create simple, permissive policies for all authenticated users
CREATE POLICY settings_select_policy
  ON public.settings
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY settings_insert_policy
  ON public.settings
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY settings_update_policy
  ON public.settings
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.settings TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Verify policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'settings';
