-- Ajuste RLS materiais: permite owner_org nulo e acesso para admin/user
DROP POLICY IF EXISTS materials_select ON public.materials;
DROP POLICY IF EXISTS materials_modify ON public.materials;

CREATE POLICY materials_select
  ON public.materials
  FOR SELECT
  USING (
    owner_org IS NULL
    OR owner_org = NULLIF(current_setting('request.jwt.claim.org_id', true), '')::uuid
    OR COALESCE(current_setting('request.jwt.claim.role', true), '') IN ('admin','manager','user')
  );

CREATE POLICY materials_modify
  ON public.materials
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
