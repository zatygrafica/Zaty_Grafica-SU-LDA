-- ensure employees table has all fields required by the application
ALTER TABLE public.employees
  ADD COLUMN IF NOT EXISTS mother_name text,
  ADD COLUMN IF NOT EXISTS photo_url text,
  ADD COLUMN IF NOT EXISTS position text,
  ADD COLUMN IF NOT EXISTS nuit text,
  ADD COLUMN IF NOT EXISTS neighborhood text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS payment_date integer,
  ADD COLUMN IF NOT EXISTS work_schedule jsonb DEFAULT '{"start":"08:00","end":"18:00","totalHours":10}'::jsonb,
  ADD COLUMN IF NOT EXISTS documents jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS custom_term text;
