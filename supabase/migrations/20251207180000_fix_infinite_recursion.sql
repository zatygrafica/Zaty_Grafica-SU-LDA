-- ================================================================
-- Migration: Fix Infinite Recursion in RLS Policies
-- Created: 2025-12-07
-- Description: Corrige recursão infinita causada por helper functions
--              que acessam profiles dentro de policies de profiles
-- ================================================================

-- ----------------------------------------------------------------
-- 1. RECRIAR HELPER FUNCTIONS SEM RECURSÃO
-- ----------------------------------------------------------------

-- Esta versão NÃO acessa a tabela profiles
-- Usa apenas auth.uid() para evitar recursão
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY INVOKER  -- Mudado de DEFINER para INVOKER
AS $$
  -- Retorna apenas do JWT claim, sem JOIN com profiles
  -- Isso evita recursão infinita
  SELECT COALESCE(
    current_setting('request.jwt.claim.role', true),
    'user'  -- Default para usuários sem role no JWT
  );
$$;

-- Função is_admin também não acessa profiles
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER  -- Mudado de DEFINER para INVOKER
AS $$
  SELECT COALESCE(
    current_setting('request.jwt.claim.role', true),
    'user'
  ) = 'admin';
$$;

-- ----------------------------------------------------------------
-- 2. CORRIGIR POLICIES DA TABELA PROFILES
-- ----------------------------------------------------------------

-- Remover policies antigas que causavam recursão
DROP POLICY IF EXISTS profiles_self ON public.profiles;
DROP POLICY IF EXISTS profiles_admin ON public.profiles;
DROP POLICY IF EXISTS profiles_select_own ON public.profiles;
DROP POLICY IF EXISTS profiles_update_own ON public.profiles;
DROP POLICY IF EXISTS profiles_admin_all ON public.profiles;

-- Policy simples: usuário vê apenas seu próprio perfil
CREATE POLICY profiles_select_own
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Policy para updates: usuário atualiza apenas seu próprio perfil
CREATE POLICY profiles_update_own
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Admins podem ver e editar todos os perfis
-- MAS não usamos helper function aqui para evitar recursão!
-- Verificamos diretamente o JWT claim
CREATE POLICY profiles_admin_all
  ON public.profiles
  FOR ALL
  USING (
    current_setting('request.jwt.claim.role', true) = 'admin'
  )
  WITH CHECK (
    current_setting('request.jwt.claim.role', true) = 'admin'
  );

-- ----------------------------------------------------------------
-- 3. GARANTIR QUE RLS ESTÁ HABILITADO
-- ----------------------------------------------------------------

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------
-- 4. MENSAGENS
-- ----------------------------------------------------------------

DO $$
BEGIN
  RAISE NOTICE '✅ Recursão infinita corrigida!';
  RAISE NOTICE '';
  RAISE NOTICE 'Mudanças aplicadas:';
  RAISE NOTICE '  - Helper functions agora usam SECURITY INVOKER';
  RAISE NOTICE '  - Helper functions não acessam mais a tabela profiles';
  RAISE NOTICE '  - Policies de profiles simplificadas';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  IMPORTANTE:';
  RAISE NOTICE '  - Helper functions agora retornam apenas do JWT';
  RAISE NOTICE '  - Se JWT não tiver role claim, retorna "user" por padrão';
  RAISE NOTICE '  - Sistema funcionará normalmente mesmo sem custom claims';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Login deve funcionar agora!';
END$$;
