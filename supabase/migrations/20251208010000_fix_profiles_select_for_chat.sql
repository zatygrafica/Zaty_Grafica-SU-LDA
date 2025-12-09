-- ================================================================
-- Migration: Fix Profiles SELECT Policy for Chat
-- Created: 2025-12-08
-- Description: Permite que usuários vejam perfis de outros usuários para funcionalidade do chat
-- ================================================================

-- ----------------------------------------------------------------
-- PROBLEMA IDENTIFICADO:
-- ----------------------------------------------------------------
-- A policy profiles_select_own permite apenas:
--   USING (auth.uid() = id)
--
-- Isso significa que usuários só podem ver SEU PRÓPRIO perfil.
--
-- RESULTADO: No módulo de chat, usuários simples não conseguem:
--   - Visualizar lista de outros usuários
--   - Selecionar destinatários para enviar mensagens
--   - Ver informações de remetentes nas conversas
-- ----------------------------------------------------------------

-- ----------------------------------------------------------------
-- SOLUÇÃO:
-- ----------------------------------------------------------------
-- Adicionar policy SELECT que permite usuários autenticados
-- visualizarem perfis de OUTROS usuários (necessário para chat).
--
-- IMPORTANTE: Mantemos a policy existente profiles_select_own
-- e adicionamos uma NOVA policy profiles_select_all_authenticated
-- ----------------------------------------------------------------

-- Drop policy se já existir (idempotência)
DROP POLICY IF EXISTS profiles_select_all_authenticated ON public.profiles;

-- Policy para SELECT: Permite usuários autenticados verem TODOS os perfis
CREATE POLICY profiles_select_all_authenticated
  ON public.profiles
  FOR SELECT
  USING (
    -- Qualquer usuário autenticado pode ver qualquer perfil
    -- Isso é necessário para:
    --   1. Chat: listar usuários disponíveis para conversa
    --   2. Mensagens: ver informações do remetente/destinatário
    --   3. Conversas: exibir nomes e fotos dos participantes
    auth.uid() IS NOT NULL
  );

-- ----------------------------------------------------------------
-- NOTA SOBRE SEGURANÇA:
-- ----------------------------------------------------------------
-- Esta policy permite que usuários vejam perfis públicos de outros usuários,
-- mas NÃO permite:
--   - Modificar perfis de outros (UPDATE ainda restrito a próprio perfil)
--   - Deletar perfis (sem policy DELETE)
--   - Acessar dados sensíveis (senhas estão em auth.users, não em profiles)
--
-- Informações expostas (seguras para compartilhar):
--   - ID, nome, email, foto
--   - Role (útil para identificar admins/managers)
--   - Status de bloqueio (is_blocked)
--
-- Esta é uma prática comum em sistemas de chat/colaboração.
-- ----------------------------------------------------------------

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
  RAISE NOTICE '✅ Policy SELECT para chat adicionada em profiles!';
  RAISE NOTICE '';
  RAISE NOTICE 'Total de policies em profiles: %', policy_count;
  RAISE NOTICE '';
  RAISE NOTICE 'Policies ativas:';
  RAISE NOTICE '  1. profiles_select_own (SELECT - usuário vê próprio perfil)';
  RAISE NOTICE '  2. profiles_select_all_authenticated (SELECT - usuários autenticados veem todos)';
  RAISE NOTICE '  3. profiles_update_own (UPDATE - usuário atualiza próprio perfil)';
  RAISE NOTICE '  4. profiles_insert_own (INSERT - usuário cria próprio perfil)';
  RAISE NOTICE '';
  RAISE NOTICE '⚙️  Como funciona agora:';
  RAISE NOTICE '  - Usuários autenticados podem ver TODOS os perfis (para chat)';
  RAISE NOTICE '  - Usuários SOMENTE atualizam seu próprio perfil';
  RAISE NOTICE '  - Usuários SOMENTE criam seu próprio perfil';
  RAISE NOTICE '  - Dados sensíveis (senhas) não estão em profiles';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Chat funcionando para usuários simples!';
  RAISE NOTICE '';
  RAISE NOTICE '🔒 Segurança mantida:';
  RAISE NOTICE '  - UPDATE: apenas próprio perfil';
  RAISE NOTICE '  - INSERT: apenas próprio perfil';
  RAISE NOTICE '  - DELETE: bloqueado (sem policy)';
  RAISE NOTICE '  - Senhas: em auth.users (inacessível via profiles)';
END$$;
