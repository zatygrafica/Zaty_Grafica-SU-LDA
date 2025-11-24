-- ensure payments table tracks fields used by the application
ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS date timestamptz DEFAULT timezone('utc', now()),
  ADD COLUMN IF NOT EXISTS notes text,
  ALTER COLUMN method SET DEFAULT 'transfer';
