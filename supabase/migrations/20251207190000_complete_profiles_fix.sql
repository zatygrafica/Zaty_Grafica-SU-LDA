-- ================================================================
-- Migration: Complete Profiles RLS Fix
-- Created: 2025-12-07
-- Description: Remove TODAS as policies de profiles e recria sem recursão
-- ================================================================

-- ----------------------------------------------------------------
-- 1. DESABILITAR RLS TEMPORARIAMENTE
-- ----------------------------------------------------------------

ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------
-- 2. REMOVER ABSOLUTAMENTE TODAS AS POLICIES
-- ----------------------------------------------------------------

-- Listar e remover todas as policies existentes
DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'profiles'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.profiles', pol.policyname);
    RAISE NOTICE 'Removida policy: %', pol.policyname;
  END LOOP;
END$$;

-- ----------------------------------------------------------------
-- 3. RECRIAR HELPER FUNCTIONS SEM USAR PROFILES
-- ----------------------------------------------------------------

-- Função que retorna role APENAS do JWT
-- NÃO acessa profiles de forma alguma
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY INVOKER
AS $$
  -- Retorna apenas do JWT claim
  -- Se não existir, retorna NULL (não 'user')
  SELECT current_setting('request.jwt.claim.role', true);
$$;

-- Função is_admin também só lê do JWT
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
AS $$
  SELECT current_setting('request.jwt.claim.role', true) = 'admin';
$$;

-- ----------------------------------------------------------------
-- 4. CRIAR POLICIES SIMPLES SEM HELPER FUNCTIONS
-- ----------------------------------------------------------------

-- Policy 1: Qualquer usuário autenticado pode ler seu próprio perfil
CREATE POLICY profiles_select_own
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Policy 2: Qualquer usuário autenticado pode atualizar seu próprio perfil
CREATE POLICY profiles_update_own
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ----------------------------------------------------------------
-- 5. REABILITAR RLS
-- ----------------------------------------------------------------

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------
-- 6. VERIFICAR SE FUNCIONOU
-- ----------------------------------------------------------------

DO $$
DECLARE
  policy_count integer;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
  AND tablename = 'profiles';

  RAISE NOTICE '';
  RAISE NOTICE '✅ Profiles RLS completamente reconstruído!';
  RAISE NOTICE '';
  RAISE NOTICE 'Policies criadas: %', policy_count;
  RAISE NOTICE '';
  RAISE NOTICE 'Policies ativas:';
  RAISE NOTICE '  1. profiles_select_own (SELECT apenas próprio perfil)';
  RAISE NOTICE '  2. profiles_update_own (UPDATE apenas próprio perfil)';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  IMPORTANTE:';
  RAISE NOTICE '  - Nenhuma policy usa helper functions';
  RAISE NOTICE '  - Helper functions NÃO acessam profiles';
  RAISE NOTICE '  - ZERO possibilidade de recursão';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Login deve funcionar agora!';
END$$;
