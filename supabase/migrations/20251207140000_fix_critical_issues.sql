-- ================================================================
-- Migration: Fix Critical Issues
-- Created: 2025-12-07
-- Description: Correção de problemas críticos identificados na análise
-- ================================================================

-- ----------------------------------------------------------------
-- 1. SALARY PAYMENTS: Adicionar constraint UNIQUE
-- ----------------------------------------------------------------
-- Previne pagamentos duplicados para o mesmo funcionário no mesmo mês/ano
-- Impacto: CRÍTICO - Evita race conditions que criam registros duplicados

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'salary_payments_employee_month_year_unique'
  ) THEN
    ALTER TABLE public.salary_payments
      ADD CONSTRAINT salary_payments_employee_month_year_unique
      UNIQUE (employee_id, month, year);

    RAISE NOTICE 'Constraint UNIQUE adicionado em salary_payments';
  END IF;
END$$;

-- ----------------------------------------------------------------
-- 2. SETTINGS: Restringir acesso apenas a admins/managers
-- ----------------------------------------------------------------
-- Remove policies permissivas que permitem qualquer usuário autenticado

DROP POLICY IF EXISTS settings_select_auth ON public.settings;
DROP POLICY IF EXISTS settings_insert_auth ON public.settings;
DROP POLICY IF EXISTS settings_update_auth ON public.settings;

-- Policy segura: Apenas admins podem ler/modificar settings
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'settings'
    AND policyname = 'settings_admin_access'
  ) THEN
    CREATE POLICY settings_admin_access ON public.settings
      FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM public.profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role = 'admin'
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role = 'admin'
        )
      );
  END IF;
END$$;

-- ----------------------------------------------------------------
-- 3. TASKS: Restringir acesso por ownership
-- ----------------------------------------------------------------
-- Remove policy permissiva que permite acesso a todas as tasks

DROP POLICY IF EXISTS tasks_read_write ON public.tasks;

-- Policy segura: Acesso apenas a tasks próprias ou se admin/manager
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'tasks'
    AND policyname = 'tasks_owner_access'
  ) THEN
    CREATE POLICY tasks_owner_access ON public.tasks
      FOR ALL
      USING (
        auth.uid() = assigned_to OR
        auth.uid() = created_by OR
        EXISTS (
          SELECT 1 FROM public.profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role IN ('admin')
        )
      )
      WITH CHECK (
        auth.uid() = assigned_to OR
        auth.uid() = created_by OR
        EXISTS (
          SELECT 1 FROM public.profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role IN ('admin')
        )
      );
  END IF;
END$$;

-- ----------------------------------------------------------------
-- 4. STORAGE: Restringir acesso por ownership
-- ----------------------------------------------------------------
-- Corrige policies de storage que permitem qualquer usuário acessar/deletar arquivos

DROP POLICY IF EXISTS "app-files-select" ON storage.objects;
DROP POLICY IF EXISTS "app-files-delete" ON storage.objects;
DROP POLICY IF EXISTS "app-files-select-secure" ON storage.objects;
DROP POLICY IF EXISTS "app-files-delete-secure" ON storage.objects;

-- Policy segura para leitura: Apenas arquivos próprios ou admins
CREATE POLICY "app-files-select-secure" ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'app-files' AND (
      (storage.foldername(name))[1] = auth.uid()::text OR
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin')
      )
    )
  );

-- Policy segura para deleção: Apenas owner ou admins
CREATE POLICY "app-files-delete-secure" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'app-files' AND (
      owner = auth.uid() OR
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin')
      )
    )
  );

-- ----------------------------------------------------------------
-- 5. PROFILES: Garantir que RLS está habilitado
-- ----------------------------------------------------------------

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Verificar se policies de profiles existem e são adequadas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'profiles' AND policyname = 'profiles_read_own'
  ) THEN
    CREATE POLICY profiles_read_own ON public.profiles
      FOR SELECT
      USING (id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
      ));
  END IF;
END$$;

-- ----------------------------------------------------------------
-- 6. STOCK MOVEMENTS: Adicionar campo material_name
-- ----------------------------------------------------------------
-- Persiste o nome do material para histórico

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'stock_movements'
    AND column_name = 'material_name'
  ) THEN
    ALTER TABLE public.stock_movements
      ADD COLUMN material_name text;

    RAISE NOTICE 'Campo material_name adicionado em stock_movements';
  END IF;
END$$;

-- ----------------------------------------------------------------
-- 7. PURCHASES: Adicionar campo created_by
-- ----------------------------------------------------------------

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'purchases'
    AND column_name = 'created_by'
  ) THEN
    ALTER TABLE public.purchases
      ADD COLUMN created_by uuid;

    RAISE NOTICE 'Campo created_by adicionado em purchases';
  END IF;
END$$;

-- ----------------------------------------------------------------
-- 8. INDEXES para melhorar performance
-- ----------------------------------------------------------------

-- Orders
CREATE INDEX IF NOT EXISTS idx_orders_client_id ON public.orders(client_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_by ON public.orders(created_by);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);

-- Payments
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON public.payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_invoice_id ON public.payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_date ON public.payments(date);

-- Stock Movements
CREATE INDEX IF NOT EXISTS idx_stock_movements_material_id ON public.stock_movements(material_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_reference_id ON public.stock_movements(reference_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_created_at ON public.stock_movements(created_at);

-- Attendance Events
CREATE INDEX IF NOT EXISTS idx_attendance_events_employee_id ON public.attendance_events(employee_id);
CREATE INDEX IF NOT EXISTS idx_attendance_events_date ON public.attendance_events(date);

-- Salary Payments
CREATE INDEX IF NOT EXISTS idx_salary_payments_employee_id ON public.salary_payments(employee_id);
CREATE INDEX IF NOT EXISTS idx_salary_payments_month_year ON public.salary_payments(month, year);

-- Expenses
CREATE INDEX IF NOT EXISTS idx_expenses_type ON public.expenses(type);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON public.expenses(date);
CREATE INDEX IF NOT EXISTS idx_expenses_created_by ON public.expenses(created_by);

-- Clients
CREATE INDEX IF NOT EXISTS idx_clients_created_by ON public.clients(created_by);
CREATE INDEX IF NOT EXISTS idx_clients_owner_org ON public.clients(owner_org);

-- Employees
CREATE INDEX IF NOT EXISTS idx_employees_owner_org ON public.employees(owner_org);

-- ----------------------------------------------------------------
-- FIM DA MIGRATION
-- ----------------------------------------------------------------

-- Mensagem de sucesso
DO $$
BEGIN
  RAISE NOTICE '✅ Migration 20251207140000_fix_critical_issues executada com sucesso!';
  RAISE NOTICE 'Problemas corrigidos:';
  RAISE NOTICE '  ✓ Constraint UNIQUE em salary_payments';
  RAISE NOTICE '  ✓ Policies RLS restringidas (settings, tasks, storage)';
  RAISE NOTICE '  ✓ RLS habilitado em profiles';
  RAISE NOTICE '  ✓ Campos adicionados (material_name, created_by)';
  RAISE NOTICE '  ✓ Índices criados para performance';
END$$;
