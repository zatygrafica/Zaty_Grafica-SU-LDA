-- Add details column if missing (schema cache errors)
ALTER TABLE public.stock_movements
  ADD COLUMN IF NOT EXISTS details text;

-- No data change needed; null is acceptable
