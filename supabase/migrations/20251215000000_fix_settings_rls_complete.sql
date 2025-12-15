-- Fix Settings table RLS policies completely
-- Drop existing policies
DROP POLICY IF EXISTS settings_select_auth ON public.settings;
DROP POLICY IF EXISTS settings_insert_auth ON public.settings;
DROP POLICY IF EXISTS settings_update_auth ON public.settings;
DROP POLICY IF EXISTS settings_delete_auth ON public.settings;

-- Enable RLS
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Create permissive policies for authenticated users
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

CREATE POLICY settings_delete_policy
  ON public.settings
  FOR DELETE
  TO authenticated
  USING (true);

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.settings TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;
