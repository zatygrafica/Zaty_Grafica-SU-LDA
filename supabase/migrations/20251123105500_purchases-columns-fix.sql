-- ensure purchases table has all columns used by the app
ALTER TABLE public.purchases
  ADD COLUMN IF NOT EXISTS material_id uuid,
  ADD COLUMN IF NOT EXISTS material_name text,
  ADD COLUMN IF NOT EXISTS quantity numeric,
  ADD COLUMN IF NOT EXISTS unit_price numeric,
  ADD COLUMN IF NOT EXISTS total numeric,
  ADD COLUMN IF NOT EXISTS date timestamptz DEFAULT timezone('utc', now()),
  ADD COLUMN IF NOT EXISTS supplier text;
