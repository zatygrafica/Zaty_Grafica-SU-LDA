-- ================================================================
-- Migration: Fix Custom Access Token Hook Volatility
-- Created: 2025-12-07
-- Description: Corrige a volatilidade da função hook de STABLE para VOLATILE
-- ================================================================

-- Recriar a função com VOLATILE ao invés de STABLE
-- Hooks do Supabase Auth devem ser VOLATILE
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE  -- Alterado de STABLE para VOLATILE
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

-- Mensagem de sucesso
DO $$
BEGIN
  RAISE NOTICE '✅ Hook corrigido para VOLATILE!';
  RAISE NOTICE 'Agora você pode configurar o hook no dashboard sem erros.';
END$$;
