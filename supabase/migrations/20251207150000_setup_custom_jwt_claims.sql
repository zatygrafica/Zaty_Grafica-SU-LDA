-- ================================================================
-- Migration: Setup Custom JWT Claims
-- Created: 2025-12-07
-- Description: Configura custom claims no JWT para uso em RLS policies
-- ================================================================

-- ----------------------------------------------------------------
-- 1. FUNÇÃO PARA ADICIONAR CUSTOM CLAIMS AO JWT
-- ----------------------------------------------------------------
-- Esta função é chamada automaticamente pelo Supabase Auth
-- para adicionar claims customizados ao JWT de cada usuário

CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE  -- IMPORTANTE: Deve ser VOLATILE para hooks do Supabase Auth
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  claims jsonb;
  user_role text;
  user_permissions text[];
BEGIN
  -- Buscar role e permissions do perfil do usuário
  SELECT
    role,
    permissions
  INTO
    user_role,
    user_permissions
  FROM public.profiles
  WHERE id = (event->>'user_id')::uuid;

  -- Se não encontrar perfil, usar valores padrão
  IF user_role IS NULL THEN
    user_role := 'user';
  END IF;

  IF user_permissions IS NULL THEN
    user_permissions := ARRAY[]::text[];
  END IF;

  -- Obter claims existentes do evento
  claims := event->'claims';

  -- Adicionar custom claims
  claims := jsonb_set(claims, '{role}', to_jsonb(user_role));
  claims := jsonb_set(claims, '{permissions}', to_jsonb(user_permissions));

  -- Atualizar o evento com os novos claims
  event := jsonb_set(event, '{claims}', claims);

  RETURN event;
END;
$$;

-- ----------------------------------------------------------------
-- 2. GRANT PERMISSIONS
-- ----------------------------------------------------------------

-- Permitir que o serviço de autenticação execute a função
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO supabase_auth_admin;

-- Revogar acesso público
REVOKE ALL ON FUNCTION public.custom_access_token_hook FROM authenticated, anon, public;

-- ----------------------------------------------------------------
-- 3. TRIGGER PARA ATUALIZAR CLAIMS QUANDO PERFIL MUDAR
-- ----------------------------------------------------------------
-- Quando role ou org_id mudam, usuário precisa fazer re-login
-- para obter novo JWT com claims atualizados

CREATE OR REPLACE FUNCTION public.notify_profile_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Apenas notificar se role ou permissions mudaram
  IF (OLD.role IS DISTINCT FROM NEW.role) OR
     (OLD.permissions IS DISTINCT FROM NEW.permissions) THEN

    -- Em produção, você pode implementar uma notificação ao usuário
    -- para fazer re-login, ou forçar logout
    RAISE NOTICE 'Profile updated for user %. User should re-login to update JWT claims.', NEW.id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_profile_change ON public.profiles;

CREATE TRIGGER trigger_profile_change
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_profile_change();

-- ----------------------------------------------------------------
-- 4. HELPER FUNCTION: Obter role do usuário atual
-- ----------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT COALESCE(
    current_setting('request.jwt.claim.role', true),
    (SELECT role FROM public.profiles WHERE id = auth.uid())
  );
$$;

-- ----------------------------------------------------------------
-- 5. HELPER FUNCTION: Verificar se usuário é admin
-- ----------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT public.current_user_role() = 'admin';
$$;

-- ----------------------------------------------------------------
-- 6. ATUALIZAR POLICIES PARA USAR HELPER FUNCTIONS
-- ----------------------------------------------------------------
-- Exemplo de como usar nas policies:
--
-- CREATE POLICY example_policy ON public.some_table
--   FOR ALL
--   USING (
--     public.is_admin() OR
--     created_by = auth.uid()
--   );
--
-- Isso garante que mesmo sem custom claims no JWT,
-- as policies ainda funcionam fazendo JOIN com profiles.

-- ----------------------------------------------------------------
-- 7. MENSAGENS DE SUCESSO
-- ----------------------------------------------------------------

DO $$
BEGIN
  RAISE NOTICE '✅ Custom JWT Claims configurado com sucesso!';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  AÇÕES NECESSÁRIAS NO SUPABASE DASHBOARD:';
  RAISE NOTICE '';
  RAISE NOTICE '1. Acesse: Authentication > Hooks';
  RAISE NOTICE '2. Em "Custom Access Token Hook", configure:';
  RAISE NOTICE '   - Enabled: YES';
  RAISE NOTICE '   - Postgres Function: public.custom_access_token_hook';
  RAISE NOTICE '';
  RAISE NOTICE '3. Salve as configurações';
  RAISE NOTICE '';
  RAISE NOTICE '4. TESTE: Faça logout e login novamente';
  RAISE NOTICE '   Os novos JWTs terão os custom claims (role, permissions)';
  RAISE NOTICE '';
  RAISE NOTICE 'Helper functions disponíveis:';
  RAISE NOTICE '  - public.current_user_role()';
  RAISE NOTICE '  - public.is_admin()';
  RAISE NOTICE '';
  RAISE NOTICE 'Use essas funções nas RLS policies para garantir compatibilidade';
  RAISE NOTICE 'mesmo se o custom access token hook não estiver configurado.';
END$$;
