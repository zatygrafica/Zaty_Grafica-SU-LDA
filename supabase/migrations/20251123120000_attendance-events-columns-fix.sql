-- Ensure attendance events table matches application contract

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'attendance_events'
      AND column_name = 'event_type'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'attendance_events'
      AND column_name = 'type'
  ) THEN
    ALTER TABLE public.attendance_events RENAME COLUMN event_type TO type;
  END IF;
END$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'attendance_events'
      AND column_name = 'event_date'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'attendance_events'
      AND column_name = 'date'
  ) THEN
    ALTER TABLE public.attendance_events RENAME COLUMN event_date TO date;
  END IF;
END$$;

ALTER TABLE public.attendance_events
  ADD COLUMN IF NOT EXISTS status text,
  ADD COLUMN IF NOT EXISTS actual_arrival_time text,
  ADD COLUMN IF NOT EXISTS deduction numeric DEFAULT 0;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'attendance_events'
      AND column_name = 'date'
      AND data_type = 'date'
  ) THEN
    ALTER TABLE public.attendance_events
      ALTER COLUMN date TYPE timestamptz
      USING timezone('utc', date::timestamp);
  END IF;
END$$;

ALTER TABLE public.attendance_events
  ALTER COLUMN date SET DEFAULT timezone('utc', now()),
  ALTER COLUMN minutes SET DEFAULT 0,
  ALTER COLUMN hours SET DEFAULT 0,
  ALTER COLUMN deduction SET DEFAULT 0,
  ALTER COLUMN created_at SET DEFAULT timezone('utc', now()),
  ALTER COLUMN updated_at SET DEFAULT timezone('utc', now());

UPDATE public.attendance_events
SET status = 'present'
WHERE status IS NULL;

ALTER TABLE public.attendance_events
  ALTER COLUMN status SET DEFAULT 'present';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE table_schema = 'public'
      AND table_name = 'attendance_events'
      AND constraint_name = 'attendance_events_status_check'
  ) THEN
    ALTER TABLE public.attendance_events
      ADD CONSTRAINT attendance_events_status_check CHECK (status IN ('present','late'));
  END IF;
END$$;
