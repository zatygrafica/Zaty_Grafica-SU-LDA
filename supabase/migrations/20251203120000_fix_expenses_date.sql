-- Ensure expenses table has a date column used by the app
ALTER TABLE public.expenses
  ADD COLUMN IF NOT EXISTS date timestamptz DEFAULT timezone('utc', now());

-- Backfill date for existing rows that might be null
UPDATE public.expenses
SET date = COALESCE(date, created_at, timezone('utc', now()))
WHERE date IS NULL;
