-- ============================================================================
-- Etapa 7 – Policies alinhadas ao novo modelo (org_id + roles)
-- ============================================================================

-- Assertions/helpers
DO $$
DECLARE
  _org text := current_setting('request.jwt.claim.org_id', true);
  _role text := current_setting('request.jwt.claim.role', true);
BEGIN
  -- apenas valida acessos; não altera dados
END$$;

-- Helper expressions (usadas nos comentários)
--   org_match  => owner_org = NULLIF(current_setting('request.jwt.claim.org_id', true), '')::uuid
--   admin_role => COALESCE(current_setting('request.jwt.claim.role', true), '') IN ('admin','manager')

-- Profiles
DROP POLICY IF EXISTS profiles_self  ON public.profiles;
DROP POLICY IF EXISTS profiles_admin ON public.profiles;

CREATE POLICY profiles_self
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY profiles_admin
  ON public.profiles
  FOR ALL
  USING (COALESCE(current_setting('request.jwt.claim.role', true), '') IN ('admin','manager'))
  WITH CHECK (COALESCE(current_setting('request.jwt.claim.role', true), '') IN ('admin','manager'));

-- Settings (por organização)
DROP POLICY IF EXISTS settings_org_access ON public.settings;
CREATE POLICY settings_org_access
  ON public.settings
  FOR ALL
  USING (
    COALESCE(current_setting('request.jwt.claim.role', true), '') IN ('admin','manager')
    OR org_id = NULLIF(current_setting('request.jwt.claim.org_id', true), '')::uuid
  )
  WITH CHECK (
    COALESCE(current_setting('request.jwt.claim.role', true), '') IN ('admin','manager')
    OR org_id = NULLIF(current_setting('request.jwt.claim.org_id', true), '')::uuid
  );

-- Helper macro: aplica padrão para tabelas com owner_org
CREATE OR REPLACE FUNCTION public.__owner_policy(_table regclass)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  EXECUTE format('DROP POLICY IF EXISTS %I_access ON %s;', _table::text || '_', _table);
END;$$;
DROP FUNCTION public.__owner_policy(regclass);
-- Observação: devido às limitações, policies são definidas manualmente abaixo.

-- Cada bloco drop/create segue o padrão: leitura p/ org ou admin; escrita idem.

-- Clients
DROP POLICY IF EXISTS clients_select ON public.clients;
DROP POLICY IF EXISTS clients_modify ON public.clients;
CREATE POLICY clients_select ON public.clients
  FOR SELECT USING (
    owner_org = NULLIF(current_setting('request.jwt.claim.org_id', true), '')::uuid
    OR COALESCE(current_setting('request.jwt.claim.role', true), '') IN ('admin','manager')
  );
CREATE POLICY clients_modify ON public.clients
  FOR ALL USING (
    owner_org = NULLIF(current_setting('request.jwt.claim.org_id', true), '')::uuid
    OR COALESCE(current_setting('request.jwt.claim.role', true), '') IN ('admin','manager')
  )
  WITH CHECK (
    owner_org = NULLIF(current_setting('request.jwt.claim.org_id', true), '')::uuid
    OR COALESCE(current_setting('request.jwt.claim.role', true), '') IN ('admin','manager')
  );

-- Employees
DROP POLICY IF EXISTS employees_select ON public.employees;
DROP POLICY IF EXISTS employees_modify ON public.employees;
CREATE POLICY employees_select ON public.employees
  FOR SELECT USING (
    owner_org = NULLIF(current_setting('request.jwt.claim.org_id', true), '')::uuid
    OR COALESCE(current_setting('request.jwt.claim.role', true), '') IN ('admin','manager')
  );
CREATE POLICY employees_modify ON public.employees
  FOR ALL USING (
    owner_org = NULLIF(current_setting('request.jwt.claim.org_id', true), '')::uuid
    OR COALESCE(current_setting('request.jwt.claim.role', true), '') IN ('admin','manager')
  )
  WITH CHECK (
    owner_org = NULLIF(current_setting('request.jwt.claim.org_id', true), '')::uuid
    OR COALESCE(current_setting('request.jwt.claim.role', true), '') IN ('admin','manager')
  );

-- Services
DROP POLICY IF EXISTS services_select ON public.services;
DROP POLICY IF EXISTS services_modify ON public.services;
CREATE POLICY services_select ON public.services
  FOR SELECT USING (
    owner_org = NULLIF(current_setting('request.jwt.claim.org_id', true), '')::uuid
    OR COALESCE(current_setting('request.jwt.claim.role', true), '') IN ('admin','manager')
  );
CREATE POLICY services_modify ON public.services
  FOR ALL USING (
    COALESCE(current_setting('request.jwt.claim.role', true), '') IN ('admin','manager')
    AND owner_org = NULLIF(current_setting('request.jwt.claim.org_id', true), '')::uuid
  )
  WITH CHECK (
    COALESCE(current_setting('request.jwt.claim.role', true), '') IN ('admin','manager')
    AND owner_org = NULLIF(current_setting('request.jwt.claim.org_id', true), '')::uuid
  );

-- Materials
DROP POLICY IF EXISTS materials_select ON public.materials;
DROP POLICY IF EXISTS materials_modify ON public.materials;
CREATE POLICY materials_select ON public.materials
  FOR SELECT USING (
    owner_org = NULLIF(current_setting('request.jwt.claim.org_id', true), '')::uuid
    OR COALESCE(current_setting('request.jwt.claim.role', true), '') IN ('admin','manager')
  );
CREATE POLICY materials_modify ON public.materials
  FOR ALL USING (
    COALESCE(current_setting('request.jwt.claim.role', true), '') IN ('admin','manager')
    AND owner_org = NULLIF(current_setting('request.jwt.claim.org_id', true), '')::uuid
  )
  WITH CHECK (
    COALESCE(current_setting('request.jwt.claim.role', true), '') IN ('admin','manager')
    AND owner_org = NULLIF(current_setting('request.jwt.claim.org_id', true), '')::uuid
  );

-- Document templates
DROP POLICY IF EXISTS document_templates_access ON public.document_templates;
CREATE POLICY document_templates_access ON public.document_templates
  FOR ALL USING (
    owner_org = NULLIF(current_setting('request.jwt.claim.org_id', true), '')::uuid
    OR COALESCE(current_setting('request.jwt.claim.role', true), '') IN ('admin','manager')
  )
  WITH CHECK (
    owner_org = NULLIF(current_setting('request.jwt.claim.org_id', true), '')::uuid
    OR COALESCE(current_setting('request.jwt.claim.role', true), '') IN ('admin','manager')
  );

-- Generated documents
DROP POLICY IF EXISTS generated_documents_access ON public.generated_documents;
CREATE POLICY generated_documents_access ON public.generated_documents
  FOR ALL USING (
    owner_org = NULLIF(current_setting('request.jwt.claim.org_id', true), '')::uuid
    OR auth.uid() = user_id
    OR COALESCE(current_setting('request.jwt.claim.role', true), '') IN ('admin','manager')
  )
  WITH CHECK (
    owner_org = NULLIF(current_setting('request.jwt.claim.org_id', true), '')::uuid
    OR auth.uid() = user_id
    OR COALESCE(current_setting('request.jwt.claim.role', true), '') IN ('admin','manager')
  );

-- Stock movements
DROP POLICY IF EXISTS stock_movements_access ON public.stock_movements;
CREATE POLICY stock_movements_access ON public.stock_movements
  FOR ALL USING (
    owner_org = NULLIF(current_setting('request.jwt.claim.org_id', true), '')::uuid
    OR COALESCE(current_setting('request.jwt.claim.role', true), '') IN ('admin','manager')
  )
  WITH CHECK (
    owner_org = NULLIF(current_setting('request.jwt.claim.org_id', true), '')::uuid
    OR COALESCE(current_setting('request.jwt.claim.role', true), '') IN ('admin','manager')
  );

-- Orders
DROP POLICY IF EXISTS orders_access ON public.orders;
CREATE POLICY orders_access ON public.orders
  FOR ALL USING (
    owner_org = NULLIF(current_setting('request.jwt.claim.org_id', true), '')::uuid
    OR COALESCE(current_setting('request.jwt.claim.role', true), '') IN ('admin','manager')
  )
  WITH CHECK (
    owner_org = NULLIF(current_setting('request.jwt.claim.org_id', true), '')::uuid
    OR COALESCE(current_setting('request.jwt.claim.role', true), '') IN ('admin','manager')
  );

-- Invoices
DROP POLICY IF EXISTS invoices_access ON public.invoices;
CREATE POLICY invoices_access ON public.invoices
  FOR ALL USING (
    owner_org = NULLIF(current_setting('request.jwt.claim.org_id', true), '')::uuid
    OR COALESCE(current_setting('request.jwt.claim.role', true), '') IN ('admin','manager')
  )
  WITH CHECK (
    owner_org = NULLIF(current_setting('request.jwt.claim.org_id', true), '')::uuid
    OR COALESCE(current_setting('request.jwt.claim.role', true), '') IN ('admin','manager')
  );

-- Payments
DROP POLICY IF EXISTS payments_access ON public.payments;
CREATE POLICY payments_access ON public.payments
  FOR ALL USING (
    owner_org = NULLIF(current_setting('request.jwt.claim.org_id', true), '')::uuid
    OR COALESCE(current_setting('request.jwt.claim.role', true), '') IN ('admin','manager')
  )
  WITH CHECK (
    owner_org = NULLIF(current_setting('request.jwt.claim.org_id', true), '')::uuid
    OR COALESCE(current_setting('request.jwt.claim.role', true), '') IN ('admin','manager')
  );

-- Salary payments
DROP POLICY IF EXISTS salary_payments_access ON public.salary_payments;
CREATE POLICY salary_payments_access ON public.salary_payments
  FOR ALL USING (
    owner_org = NULLIF(current_setting('request.jwt.claim.org_id', true), '')::uuid
    OR COALESCE(current_setting('request.jwt.claim.role', true), '') IN ('admin','manager')
  )
  WITH CHECK (
    owner_org = NULLIF(current_setting('request.jwt.claim.org_id', true), '')::uuid
    OR COALESCE(current_setting('request.jwt.claim.role', true), '') IN ('admin','manager')
  );

-- Purchases
DROP POLICY IF EXISTS purchases_access ON public.purchases;
CREATE POLICY purchases_access ON public.purchases
  FOR ALL USING (
    owner_org = NULLIF(current_setting('request.jwt.claim.org_id', true), '')::uuid
    OR COALESCE(current_setting('request.jwt.claim.role', true), '') IN ('admin','manager')
  )
  WITH CHECK (
    owner_org = NULLIF(current_setting('request.jwt.claim.org_id', true), '')::uuid
    OR COALESCE(current_setting('request.jwt.claim.role', true), '') IN ('admin','manager')
  );

-- Tasks
DROP POLICY IF EXISTS tasks_access ON public.tasks;
CREATE POLICY tasks_access ON public.tasks
  FOR ALL USING (
    owner_org = NULLIF(current_setting('request.jwt.claim.org_id', true), '')::uuid
    OR auth.uid() = assigned_to
    OR COALESCE(current_setting('request.jwt.claim.role', true), '') IN ('admin','manager')
  )
  WITH CHECK (
    owner_org = NULLIF(current_setting('request.jwt.claim.org_id', true), '')::uuid
    OR auth.uid() = assigned_to
    OR COALESCE(current_setting('request.jwt.claim.role', true), '') IN ('admin','manager')
  );

-- Notes
DROP POLICY IF EXISTS notes_access ON public.notes;
CREATE POLICY notes_access ON public.notes
  FOR ALL USING (
    owner_org = NULLIF(current_setting('request.jwt.claim.org_id', true), '')::uuid
    OR auth.uid() = created_by
    OR COALESCE(current_setting('request.jwt.claim.role', true), '') IN ('admin','manager')
  )
  WITH CHECK (
    owner_org = NULLIF(current_setting('request.jwt.claim.org_id', true), '')::uuid
    OR auth.uid() = created_by
    OR COALESCE(current_setting('request.jwt.claim.role', true), '') IN ('admin','manager')
  );

-- Attendance events
DROP POLICY IF EXISTS attendance_events_access ON public.attendance_events;
CREATE POLICY attendance_events_access ON public.attendance_events
  FOR ALL USING (
    owner_org = NULLIF(current_setting('request.jwt.claim.org_id', true), '')::uuid
    OR COALESCE(current_setting('request.jwt.claim.role', true), '') IN ('admin','manager')
  )
  WITH CHECK (
    owner_org = NULLIF(current_setting('request.jwt.claim.org_id', true), '')::uuid
    OR COALESCE(current_setting('request.jwt.claim.role', true), '') IN ('admin','manager')
  );

-- Expenses
DROP POLICY IF EXISTS expenses_access ON public.expenses;
CREATE POLICY expenses_access ON public.expenses
  FOR ALL USING (
    owner_org = NULLIF(current_setting('request.jwt.claim.org_id', true), '')::uuid
    OR COALESCE(current_setting('request.jwt.claim.role', true), '') IN ('admin','manager')
  )
  WITH CHECK (
    owner_org = NULLIF(current_setting('request.jwt.claim.org_id', true), '')::uuid
    OR COALESCE(current_setting('request.jwt.claim.role', true), '') IN ('admin','manager')
  );

-- Conversations
DROP POLICY IF EXISTS conversations_access ON public.conversations;
CREATE POLICY conversations_access ON public.conversations
  FOR ALL USING (
    owner_org = NULLIF(current_setting('request.jwt.claim.org_id', true), '')::uuid
    OR auth.uid() = created_by
    OR auth.uid() = ANY(participant_ids)
    OR COALESCE(current_setting('request.jwt.claim.role', true), '') IN ('admin','manager')
  )
  WITH CHECK (
    owner_org = NULLIF(current_setting('request.jwt.claim.org_id', true), '')::uuid
    OR auth.uid() = created_by
    OR auth.uid() = ANY(participant_ids)
    OR COALESCE(current_setting('request.jwt.claim.role', true), '') IN ('admin','manager')
  );

-- Messages
DROP POLICY IF EXISTS messages_access ON public.messages;
CREATE POLICY messages_access ON public.messages
  FOR ALL USING (
    owner_org = NULLIF(current_setting('request.jwt.claim.org_id', true), '')::uuid
    OR auth.uid() = sender_id
    OR COALESCE(current_setting('request.jwt.claim.role', true), '') IN ('admin','manager')
  )
  WITH CHECK (
    owner_org = NULLIF(current_setting('request.jwt.claim.org_id', true), '')::uuid
    OR auth.uid() = sender_id
    OR COALESCE(current_setting('request.jwt.claim.role', true), '') IN ('admin','manager')
  );
