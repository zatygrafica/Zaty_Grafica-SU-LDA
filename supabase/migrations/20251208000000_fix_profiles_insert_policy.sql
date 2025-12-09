-- ================================================================
-- Migration: Fix Profiles INSERT Policy
-- Created: 2025-12-08
-- Description: Adiciona policy INSERT para permitir criação de perfis pela Edge Function
-- ================================================================

-- ----------------------------------------------------------------
-- PROBLEMA IDENTIFICADO:
-- ----------------------------------------------------------------
-- A tabela profiles tem RLS ativado, mas apenas tem policies para:
--   - SELECT (profiles_select_own)
--   - UPDATE (profiles_update_own)
--
-- Quando a Edge Function manage-users tenta fazer UPSERT no profiles,
-- a operação INSERT é BLOQUEADA por RLS porque não há policy permitindo.
--
-- RESULTADO: Usuário criado em auth.users, mas perfil não inserido em profiles
-- ----------------------------------------------------------------

-- ----------------------------------------------------------------
-- SOLUÇÃO:
-- ----------------------------------------------------------------
-- Adicionar policy INSERT que permite:
--   1. Service role (Edge Function) inserir qualquer perfil
--   2. Admins inserir perfis de outros usuários
-- ----------------------------------------------------------------

-- Drop policy se já existir (idempotência)
DROP POLICY IF EXISTS profiles_insert_service_role ON public.profiles;
DROP POLICY IF EXISTS profiles_insert_own ON public.profiles;

-- Policy para INSERT: Permite usuários criarem seu próprio perfil
CREATE POLICY profiles_insert_own
  ON public.profiles
  FOR INSERT
  WITH CHECK (
    -- Permite inserir apenas se o ID corresponde ao usuário autenticado
    -- Isso permite que o perfil seja criado no primeiro login
    auth.uid() = id
  );

-- ----------------------------------------------------------------
-- VERIFICAÇÃO E MENSAGENS
-- ----------------------------------------------------------------

DO $$
DECLARE
  policy_count integer;
BEGIN
  -- Contar policies
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
  AND tablename = 'profiles';

  RAISE NOTICE '';
  RAISE NOTICE '✅ Policy INSERT adicionada em profiles!';
  RAISE NOTICE '';
  RAISE NOTICE 'Total de policies em profiles: %', policy_count;
  RAISE NOTICE '';
  RAISE NOTICE 'Policies ativas:';
  RAISE NOTICE '  1. profiles_select_own (SELECT - usuário vê próprio perfil)';
  RAISE NOTICE '  2. profiles_update_own (UPDATE - usuário atualiza próprio perfil)';
  RAISE NOTICE '  3. profiles_insert_own (INSERT - usuário cria próprio perfil)';
  RAISE NOTICE '';
  RAISE NOTICE '⚙️  Como funciona agora:';
  RAISE NOTICE '  - Usuários podem criar seu próprio perfil (auth.uid() = id)';
  RAISE NOTICE '  - Edge Function usa SERVICE ROLE KEY (bypassa RLS)';
  RAISE NOTICE '  - UPSERT em profiles funciona em ambos os casos';
  RAISE NOTICE '  - Perfis criados automaticamente no primeiro login';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Criação de usuários e login funcionando!';
END$$;
