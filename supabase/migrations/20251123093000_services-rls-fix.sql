-- relax RLS for services: allow NULL owner_org (global entries) and admin/manager/user access
DROP POLICY IF EXISTS services_select ON public.services;
DROP POLICY IF EXISTS services_modify ON public.services;

CREATE POLICY services_select
  ON public.services
  FOR SELECT
  USING (
    owner_org IS NULL
    OR owner_org = NULLIF(current_setting('request.jwt.claim.org_id', true), '')::uuid
    OR COALESCE(current_setting('request.jwt.claim.role', true), '') IN ('admin','manager','user')
  );

CREATE POLICY services_modify
  ON public.services
  FOR ALL
  USING (
    owner_org IS NULL
    OR owner_org = NULLIF(current_setting('request.jwt.claim.org_id', true), '')::uuid
    OR COALESCE(current_setting('request.jwt.claim.role', true), '') IN ('admin','manager','user')
  )
  WITH CHECK (
    owner_org IS NULL
    OR owner_org = NULLIF(current_setting('request.jwt.claim.org_id', true), '')::uuid
    OR COALESCE(current_setting('request.jwt.claim.role', true), '') IN ('admin','manager','user')
  );
