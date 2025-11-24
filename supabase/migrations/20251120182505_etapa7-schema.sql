-- =========================================================================
-- Etapa 7 - Ajustes estruturais para o schema Supabase
-- =========================================================================

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := timezone('utc', now());
  RETURN NEW;
END;
$$;

-- =====================================================================
-- CLIENTS
-- =====================================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'clients' AND column_name = 'owner_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'clients' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE public.clients RENAME COLUMN owner_id TO created_by;
  END IF;
END$$;

ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS client_type text CHECK (client_type IN ('individual','company')),
  ADD COLUMN IF NOT EXISTS legal_representative text,
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS country text,
  ADD COLUMN IF NOT EXISTS nuit text,
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS owner_org uuid,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT timezone('utc', now());

ALTER TABLE public.clients
  ALTER COLUMN created_at SET DEFAULT timezone('utc', now()),
  ALTER COLUMN updated_at SET DEFAULT timezone('utc', now());

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_timestamp_clients') THEN
    CREATE TRIGGER set_timestamp_clients
    BEFORE UPDATE ON public.clients
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END$$;

-- =====================================================================
-- EMPLOYEES
-- =====================================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'employees' AND column_name = 'owner_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'employees' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE public.employees RENAME COLUMN owner_id TO created_by;
  END IF;
END$$;

ALTER TABLE public.employees
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS document_type text,
  ADD COLUMN IF NOT EXISTS document_number text,
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS salary numeric,
  ADD COLUMN IF NOT EXISTS start_date date,
  ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS photo_url text,
  ADD COLUMN IF NOT EXISTS custom_fields jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS owner_org uuid,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT timezone('utc', now());

ALTER TABLE public.employees
  ALTER COLUMN created_at SET DEFAULT timezone('utc', now()),
  ALTER COLUMN updated_at SET DEFAULT timezone('utc', now());

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_timestamp_employees') THEN
    CREATE TRIGGER set_timestamp_employees
    BEFORE UPDATE ON public.employees
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END$$;

-- =====================================================================
-- SERVICES (cat-logo por organiza--o)
-- =====================================================================
ALTER TABLE public.services DROP COLUMN IF EXISTS owner_id;

ALTER TABLE public.services
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS base_price numeric,
  ADD COLUMN IF NOT EXISTS unit text,
  ADD COLUMN IF NOT EXISTS variations jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS materials_used jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS created_by uuid,
  ADD COLUMN IF NOT EXISTS owner_org uuid,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT timezone('utc', now());

ALTER TABLE public.services
  ALTER COLUMN created_at SET DEFAULT timezone('utc', now()),
  ALTER COLUMN updated_at SET DEFAULT timezone('utc', now());

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_timestamp_services') THEN
    CREATE TRIGGER set_timestamp_services
    BEFORE UPDATE ON public.services
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END$$;

-- =====================================================================
-- MATERIALS (cat-logo por organiza--o)
-- =====================================================================
ALTER TABLE public.materials DROP COLUMN IF EXISTS owner_id;

ALTER TABLE public.materials
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS unit text,
  ADD COLUMN IF NOT EXISTS default_width numeric,
  ADD COLUMN IF NOT EXISTS default_length numeric,
  ADD COLUMN IF NOT EXISTS price_per_unit numeric,
  ADD COLUMN IF NOT EXISTS selling_price numeric,
  ADD COLUMN IF NOT EXISTS stock_min numeric,
  ADD COLUMN IF NOT EXISTS stock_current numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS supplier text,
  ADD COLUMN IF NOT EXISTS is_sellable boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS created_by uuid,
  ADD COLUMN IF NOT EXISTS owner_org uuid,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT timezone('utc', now());

ALTER TABLE public.materials
  ALTER COLUMN created_at SET DEFAULT timezone('utc', now()),
  ALTER COLUMN updated_at SET DEFAULT timezone('utc', now());

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_timestamp_materials') THEN
    CREATE TRIGGER set_timestamp_materials
    BEFORE UPDATE ON public.materials
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END$$;

-- =====================================================================
-- STOCK MOVEMENTS
-- =====================================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'stock_movements' AND column_name = 'owner_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'stock_movements' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE public.stock_movements RENAME COLUMN owner_id TO created_by;
  END IF;
END$$;

ALTER TABLE public.stock_movements
  ADD COLUMN IF NOT EXISTS material_id uuid,
  ADD COLUMN IF NOT EXISTS quantity numeric,
  ADD COLUMN IF NOT EXISTS movement_type text CHECK (movement_type IN ('addition','deduction','adjustment')),
  ADD COLUMN IF NOT EXISTS reference_type text,
  ADD COLUMN IF NOT EXISTS reference_id uuid,
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS owner_org uuid,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT timezone('utc', now());

ALTER TABLE public.stock_movements
  ALTER COLUMN created_at SET DEFAULT timezone('utc', now()),
  ALTER COLUMN updated_at SET DEFAULT timezone('utc', now());

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'stock_movements_material_id_fkey') THEN
    ALTER TABLE public.stock_movements
      ADD CONSTRAINT stock_movements_material_id_fkey
      FOREIGN KEY (material_id) REFERENCES public.materials(id) ON DELETE SET NULL;
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_timestamp_stock_movements') THEN
    CREATE TRIGGER set_timestamp_stock_movements
    BEFORE UPDATE ON public.stock_movements
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END$$;

-- =====================================================================
-- ORDERS
-- =====================================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'owner_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE public.orders RENAME COLUMN owner_id TO created_by;
  END IF;
END$$;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS client_id uuid,
  ADD COLUMN IF NOT EXISTS status text,
  ADD COLUMN IF NOT EXISTS type text,
  ADD COLUMN IF NOT EXISTS items jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS subtotal numeric,
  ADD COLUMN IF NOT EXISTS discount_type text,
  ADD COLUMN IF NOT EXISTS discount_value numeric,
  ADD COLUMN IF NOT EXISTS vat_enabled boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS vat_amount numeric,
  ADD COLUMN IF NOT EXISTS total numeric,
  ADD COLUMN IF NOT EXISTS due_date date,
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS invoice_generated boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS assigned_to uuid,
  ADD COLUMN IF NOT EXISTS owner_org uuid,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT timezone('utc', now());

ALTER TABLE public.orders
  ALTER COLUMN created_at SET DEFAULT timezone('utc', now()),
  ALTER COLUMN updated_at SET DEFAULT timezone('utc', now());

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'orders_client_id_fkey') THEN
    ALTER TABLE public.orders
      ADD CONSTRAINT orders_client_id_fkey
      FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE SET NULL;
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_timestamp_orders') THEN
    CREATE TRIGGER set_timestamp_orders
    BEFORE UPDATE ON public.orders
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END$$;

-- =====================================================================
-- INVOICES
-- =====================================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'invoices' AND column_name = 'owner_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'invoices' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE public.invoices RENAME COLUMN owner_id TO created_by;
  END IF;
END$$;

ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS order_id uuid,
  ADD COLUMN IF NOT EXISTS client_id uuid,
  ADD COLUMN IF NOT EXISTS issue_date date DEFAULT current_date,
  ADD COLUMN IF NOT EXISTS due_date date,
  ADD COLUMN IF NOT EXISTS vat_rate numeric,
  ADD COLUMN IF NOT EXISTS total numeric,
  ADD COLUMN IF NOT EXISTS status text,
  ADD COLUMN IF NOT EXISTS pdf_url text,
  ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS owner_org uuid,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT timezone('utc', now());

ALTER TABLE public.invoices
  ALTER COLUMN created_at SET DEFAULT timezone('utc', now()),
  ALTER COLUMN updated_at SET DEFAULT timezone('utc', now());

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'invoices_order_id_fkey') THEN
    ALTER TABLE public.invoices
      ADD CONSTRAINT invoices_order_id_fkey
      FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'invoices_client_id_fkey') THEN
    ALTER TABLE public.invoices
      ADD CONSTRAINT invoices_client_id_fkey
      FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE SET NULL;
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_timestamp_invoices') THEN
    CREATE TRIGGER set_timestamp_invoices
    BEFORE UPDATE ON public.invoices
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END$$;

-- =====================================================================
-- PAYMENTS
-- =====================================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'payments' AND column_name = 'owner_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'payments' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE public.payments RENAME COLUMN owner_id TO created_by;
  END IF;
END$$;

ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS order_id uuid,
  ADD COLUMN IF NOT EXISTS invoice_id uuid,
  ADD COLUMN IF NOT EXISTS method text,
  ADD COLUMN IF NOT EXISTS amount numeric,
  ADD COLUMN IF NOT EXISTS status text,
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS owner_org uuid,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT timezone('utc', now());

ALTER TABLE public.payments
  ALTER COLUMN created_at SET DEFAULT timezone('utc', now()),
  ALTER COLUMN updated_at SET DEFAULT timezone('utc', now());

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payments_order_id_fkey') THEN
    ALTER TABLE public.payments
      ADD CONSTRAINT payments_order_id_fkey
      FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payments_invoice_id_fkey') THEN
    ALTER TABLE public.payments
      ADD CONSTRAINT payments_invoice_id_fkey
      FOREIGN KEY (invoice_id) REFERENCES public.invoices(id) ON DELETE SET NULL;
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_timestamp_payments') THEN
    CREATE TRIGGER set_timestamp_payments
    BEFORE UPDATE ON public.payments
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END$$;

-- =====================================================================
-- SALARY PAYMENTS
-- =====================================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'salary_payments' AND column_name = 'owner_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'salary_payments' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE public.salary_payments RENAME COLUMN owner_id TO created_by;
  END IF;
END$$;

ALTER TABLE public.salary_payments
  ADD COLUMN IF NOT EXISTS employee_id uuid,
  ADD COLUMN IF NOT EXISTS amount numeric,
  ADD COLUMN IF NOT EXISTS month integer,
  ADD COLUMN IF NOT EXISTS year integer,
  ADD COLUMN IF NOT EXISTS payment_date date,
  ADD COLUMN IF NOT EXISTS deductions numeric,
  ADD COLUMN IF NOT EXISTS gross_salary numeric,
  ADD COLUMN IF NOT EXISTS method text,
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS owner_org uuid,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT timezone('utc', now());

ALTER TABLE public.salary_payments
  ALTER COLUMN created_at SET DEFAULT timezone('utc', now()),
  ALTER COLUMN updated_at SET DEFAULT timezone('utc', now());

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'salary_payments_employee_id_fkey') THEN
    ALTER TABLE public.salary_payments
      ADD CONSTRAINT salary_payments_employee_id_fkey
      FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE SET NULL;
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_timestamp_salary_payments') THEN
    CREATE TRIGGER set_timestamp_salary_payments
    BEFORE UPDATE ON public.salary_payments
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END$$;

-- =====================================================================
-- PURCHASES
-- =====================================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'purchases' AND column_name = 'owner_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'purchases' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE public.purchases RENAME COLUMN owner_id TO created_by;
  END IF;
END$$;

ALTER TABLE public.purchases
  ADD COLUMN IF NOT EXISTS supplier_name text,
  ADD COLUMN IF NOT EXISTS material_items jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS total numeric,
  ADD COLUMN IF NOT EXISTS status text,
  ADD COLUMN IF NOT EXISTS invoice_number text,
  ADD COLUMN IF NOT EXISTS purchase_date date,
  ADD COLUMN IF NOT EXISTS received_date date,
  ADD COLUMN IF NOT EXISTS owner_org uuid,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT timezone('utc', now());

ALTER TABLE public.purchases
  ALTER COLUMN created_at SET DEFAULT timezone('utc', now()),
  ALTER COLUMN updated_at SET DEFAULT timezone('utc', now());

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_timestamp_purchases') THEN
    CREATE TRIGGER set_timestamp_purchases
    BEFORE UPDATE ON public.purchases
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END$$;

-- =====================================================================
-- TASKS
-- =====================================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'tasks' AND column_name = 'owner_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'tasks' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE public.tasks RENAME COLUMN owner_id TO created_by;
  END IF;
END$$;

ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS related_type text,
  ADD COLUMN IF NOT EXISTS related_id uuid,
  ADD COLUMN IF NOT EXISTS due_date date,
  ADD COLUMN IF NOT EXISTS priority text,
  ADD COLUMN IF NOT EXISTS is_completed boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS assigned_to uuid,
  ADD COLUMN IF NOT EXISTS owner_org uuid,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT timezone('utc', now());

ALTER TABLE public.tasks
  ALTER COLUMN created at SET DEFAULT timezone('utc', now()),
  ALTER COLUMN updated at SET DEFAULT timezone('utc', now());

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_timestamp_tasks') THEN
    CREATE TRIGGER set_timestamp_tasks
    BEFORE UPDATE ON public.tasks
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END$$;

-- =====================================================================
-- NOTES
-- =====================================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'notes' AND column_name = 'owner_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'notes' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE public.notes RENAME COLUMN owner_id TO created_by;
  END IF;
END$$;

ALTER TABLE public.notes
  ADD COLUMN IF NOT EXISTS owner_type text,
  ADD COLUMN IF NOT EXISTS owner_id uuid,
  ADD COLUMN IF NOT EXISTS is_favorite boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS owner_org uuid,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT timezone('utc', now());

ALTER TABLE public.notes
  ALTER COLUMN created_at SET DEFAULT timezone('utc', now()),
  ALTER COLUMN updated_at SET DEFAULT timezone('utc', now());

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_timestamp_notes') THEN
    CREATE TRIGGER set_timestamp_notes
    BEFORE UPDATE ON public.notes
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END$$;

-- =====================================================================
-- ATTENDANCE EVENTS
-- =====================================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'attendance_events' AND column_name = 'timestamp'
  ) THEN
    ALTER TABLE public.attendance_events RENAME COLUMN "timestamp" TO event_timestamp;
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'attendance_events' AND column_name = 'owner_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema columns
    WHERE table_schema = 'public' AND table_name = 'attendance_events' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE public.attendance_events RENAME COLUMN owner_id TO created_by;
  END IF;
END$$;

ALTER TABLE public.attendance_events
  ADD COLUMN IF NOT EXISTS employee_id uuid,
  ADD COLUMN IF NOT EXISTS event_type text,
  ADD COLUMN IF NOT EXISTS event_date date,
  ADD COLUMN IF NOT EXISTS hours numeric,
  ADD COLUMN IF NOT EXISTS minutes numeric,
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS owner_org uuid,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT timezone('utc', now());

ALTER TABLE public.attendance_events
  ALTER COLUMN created at SET DEFAULT timezone('utc', now()),
  ALTER COLUMN updated at SET DEFAULT timezone('utc', now());

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'attendance_events_employee_id_fkey') THEN
    ALTER TABLE public.attendance_events
      ADD CONSTRAINT attendance_events_employee_id_fkey
      FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE SET NULL;
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_timestamp_attendance_events') THEN
    CREATE TRIGGER set_timestamp_attendance_events
    BEFORE UPDATE ON public.attendance_events
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END$$;

-- =====================================================================
-- DOCUMENT TEMPLATES
-- =====================================================================
ALTER TABLE public.document_templates
  ADD COLUMN IF NOT EXISTS type text,
  ADD COLUMN IF NOT EXISTS schema jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS template_html text,
  ADD COLUMN IF NOT EXISTS version integer DEFAULT 1,
  ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS created_by uuid,
  ADD COLUMN IF NOT EXISTS owner_org uuid,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT timezone('utc', now());

ALTER TABLE public.document_templates
  ALTER COLUMN created_at SET DEFAULT timezone('utc', now()),
  ALTER COLUMN updated_at SET DEFAULT timezone('utc', now());

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_timestamp_document_templates') THEN
    CREATE TRIGGER set_timestamp_document_templates
    BEFORE UPDATE ON public.document_templates
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END$$;

-- =====================================================================
-- GENERATED DOCUMENTS
-- =====================================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema columns
    WHERE table_schema = 'public' AND table_name = 'generated_documents' AND column_name = 'owner_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema columns
    WHERE table_schema = 'public' AND table_name = 'generated_documents' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE public.generated_documents RENAME COLUMN owner_id TO created_by;
  END IF;
END$$;

ALTER TABLE public.generated_documents
  ADD COLUMN IF NOT EXISTS template_id uuid,
  ADD COLUMN IF NOT EXISTS user_id uuid,
  ADD COLUMN IF NOT EXISTS client_id uuid,
  ADD COLUMN IF NOT EXISTS status text,
  ADD COLUMN IF NOT EXISTS storage_url text,
  ADD COLUMN IF NOT EXISTS owner_org uuid,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT timezone('utc', now());

ALTER TABLE public.generated_documents
  ALTER COLUMN created_at SET DEFAULT timezone('utc', now()),
  ALTER COLUMN updated_at SET DEFAULT timezone('utc', now());

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'generated_documents_template_id_fkey') THEN
    ALTER TABLE public.generated_documents
      ADD CONSTRAINT generated_documents_template_id_fkey
      FOREIGN KEY (template_id) REFERENCES public.document_templates(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg constraint WHERE conname = 'generated_documents_client_id_fkey') THEN
    ALTER TABLE public.generated_documents
      ADD CONSTRAINT generated_documents_client_id_fkey
      FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg constraint WHERE conname = 'generated_documents_user_id_fkey') THEN
    ALTER TABLE public.generated_documents
      ADD CONSTRAINT generated_documents_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_timestamp_generated_documents') THEN
    CREATE TRIGGER set_timestamp_generated_documents
    BEFORE UPDATE ON public.generated_documents
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END$$;

-- =====================================================================
-- SETTINGS
-- =====================================================================
ALTER TABLE public.settings DROP COLUMN IF EXISTS owner_id;

ALTER TABLE public.settings
  ADD COLUMN IF NOT EXISTS org_id uuid,
  ADD COLUMN IF NOT EXISTS value jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT timezone('utc', now());

ALTER TABLE public.settings
  ALTER COLUMN created_at SET DEFAULT timezone('utc', now()),
  ALTER COLUMN updated_at SET DEFAULT timezone('utc', now());

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_timestamp_settings') THEN
    CREATE TRIGGER set_timestamp_settings
    BEFORE UPDATE ON public.settings
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END$$;

-- =====================================================================
-- CONVERSATIONS & MESSAGES
-- =====================================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'conversations' AND column_name = 'owner_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema columns
    WHERE table_schema = 'public' AND table_name = 'conversations' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE public.conversations RENAME COLUMN owner_id TO created_by;
  END IF;
END$$;

ALTER TABLE public.conversations
  ADD COLUMN IF NOT EXISTS title text,
  ADD COLUMN IF NOT EXISTS participant_ids uuid[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS last_message_at timestamptz,
  ADD COLUMN IF NOT EXISTS unread_counts jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS owner_org uuid,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT timezone('utc', now());

ALTER TABLE public.conversations
  ALTER COLUMN created_at SET DEFAULT timezone('utc', now()),
  ALTER COLUMN updated_at SET DEFAULT timezone('utc', now());

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_timestamp_conversations') THEN
    CREATE TRIGGER set_timestamp_conversations
    BEFORE UPDATE ON public.conversations
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'messages' AND column_name = 'owner_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema columns
    WHERE table_schema = 'public' AND table_name = 'messages' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE public.messages RENAME COLUMN owner_id TO created_by;
  END IF;
END$$;

ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS conversation_id uuid,
  ADD COLUMN IF NOT EXISTS sender_id uuid,
  ADD COLUMN IF NOT EXISTS content text,
  ADD COLUMN IF NOT EXISTS attachments jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS status text,
  ADD COLUMN IF NOT EXISTS owner_org uuid,
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT timezone('utc', now()),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT timezone('utc', now());

ALTER TABLE public.messages
  ALTER COLUMN created_at SET DEFAULT timezone('utc', now()),
  ALTER COLUMN updated_at SET DEFAULT timezone('utc', now());

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'messages_conversation_id_fkey') THEN
    ALTER TABLE public.messages
      ADD CONSTRAINT messages_conversation_id_fkey
      FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE;
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_timestamp_messages') THEN
    CREATE TRIGGER set_timestamp_messages
    BEFORE UPDATE ON public.messages
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END$$;

-- =====================================================================
-- PROFILES / USERS / EXPENSES
-- =====================================================================
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS role text DEFAULT 'user',
  ADD COLUMN IF NOT EXISTS permissions jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS owner_org uuid,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT timezone('utc', now());

ALTER TABLE public.profiles
  ALTER COLUMN created_at SET DEFAULT timezone('utc', now()),
  ALTER COLUMN updated_at SET DEFAULT timezone('utc', now());

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_timestamp_profiles') THEN
    CREATE TRIGGER set_timestamp_profiles
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END$$;

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS role text,
  ADD COLUMN IF NOT EXISTS permissions jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS created_by uuid,
  ADD COLUMN IF NOT EXISTS owner_org uuid,
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT timezone('utc', now()),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT timezone('utc', now());

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_timestamp_users') THEN
    CREATE TRIGGER set_timestamp_users
    BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'expenses' AND column_name = 'owner_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema columns
    WHERE table_schema = 'public' AND table_name = 'expenses' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE public.expenses RENAME COLUMN owner_id TO created_by;
  END IF;
END$$;

ALTER TABLE public.expenses
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS amount numeric,
  ADD COLUMN IF NOT EXISTS type text,
  ADD COLUMN IF NOT EXISTS reference_id uuid,
  ADD COLUMN IF NOT EXISTS owner_org uuid,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT timezone('utc', now());

ALTER TABLE public.expenses
  ALTER COLUMN created_at SET DEFAULT timezone('utc', now()),
  ALTER COLUMN updated_at SET DEFAULT timezone('utc', now());

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_timestamp_expenses') THEN
    CREATE TRIGGER set_timestamp_expenses
    BEFORE UPDATE ON public.expenses
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END$$;

-- =====================================================================
-- Final
-- =====================================================================
-- Ap-s executar este arquivo, recrie as policies RLS alinhadas ao novo modelo.
-- =========================================================================
