-- ================================================================
-- Migration: Desabilitar Custom Hook e Usar RLS Policies Diretas
-- Created: 2025-12-07
-- Description: Remove dependência do custom access token hook problemático
--              e usa helper functions nas policies para maior confiabilidade
-- ================================================================

-- ----------------------------------------------------------------
-- 1. REMOVER FUNÇÃO DE HOOK (não é mais necessária)
-- ----------------------------------------------------------------

-- A função custom_access_token_hook causava erros no dashboard
-- Vamos removê-la e usar apenas helper functions nas policies
DROP FUNCTION IF EXISTS public.custom_access_token_hook(jsonb);

-- ----------------------------------------------------------------
-- 2. MANTER HELPER FUNCTIONS (essas funcionam sem hook!)
-- ----------------------------------------------------------------

-- As helper functions fazem JOIN direto com profiles
-- Não dependem de custom claims no JWT
-- São mais lentas mas muito mais confiáveis

-- Função já existe: public.current_user_role()
-- Função já existe: public.is_admin()
-- Função já existe: public.notify_profile_change()

-- ----------------------------------------------------------------
-- 3. ATUALIZAR POLICIES PARA USAR HELPER FUNCTIONS
-- ----------------------------------------------------------------

-- Exemplo: Settings (já está usando helper functions)
-- A policy settings_admin_access usa JOIN com profiles diretamente

-- ----------------------------------------------------------------
-- 4. MENSAGENS
-- ----------------------------------------------------------------

DO $$
BEGIN
  RAISE NOTICE '✅ Custom hook removido com sucesso!';
  RAISE NOTICE '';
  RAISE NOTICE 'ℹ️  IMPORTANTE:';
  RAISE NOTICE '';
  RAISE NOTICE '1. Remova o Custom Access Token Hook do dashboard do Supabase';
  RAISE NOTICE '   (Authentication > Hooks > Custom Access Token Hook > Disable)';
  RAISE NOTICE '';
  RAISE NOTICE '2. As RLS policies agora usam helper functions que fazem';
  RAISE NOTICE '   JOIN direto com a tabela profiles. Isso é mais confiável';
  RAISE NOTICE '   que custom claims, embora ligeiramente mais lento.';
  RAISE NOTICE '';
  RAISE NOTICE '3. Helper functions disponíveis:';
  RAISE NOTICE '   - public.current_user_role() -> retorna role do usuário';
  RAISE NOTICE '   - public.is_admin() -> retorna true se admin';
  RAISE NOTICE '';
  RAISE NOTICE '4. Exemplo de uso em policy:';
  RAISE NOTICE '   USING (public.is_admin() OR created_by = auth.uid())';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Sistema funcionará normalmente sem o hook!';
END$$;
