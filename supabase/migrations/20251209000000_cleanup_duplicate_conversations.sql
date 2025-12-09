-- ================================================================
-- Migration: Cleanup Duplicate Conversations and Add Unique Constraint
-- Created: 2025-12-09
-- Description: Remove duplicate conversations in database and prevent future duplicates
-- ================================================================

-- ----------------------------------------------------------------
-- PROBLEMA IDENTIFICADO:
-- ----------------------------------------------------------------
-- Conversas duplicadas no banco de dados para os mesmos participantes
-- Causa: Ausência de constraint única baseada em participant_ids
-- Resultado: Mesmo usuário aparece múltiplas vezes na lista do chat
-- ----------------------------------------------------------------

-- ----------------------------------------------------------------
-- PARTE 1: LIMPAR DUPLICATAS EXISTENTES
-- ----------------------------------------------------------------

DO $$
DECLARE
  duplicates_count integer;
  conversations_before integer;
  conversations_after integer;
BEGIN
  -- Contar conversas antes da limpeza
  SELECT COUNT(*) INTO conversations_before FROM public.conversations;

  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE 'LIMPEZA DE CONVERSAS DUPLICADAS';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE 'Conversas antes da limpeza: %', conversations_before;
  RAISE NOTICE '';

  -- Identificar duplicatas (mesmos participant_ids)
  WITH duplicated_conversations AS (
    SELECT
      participant_ids,
      COUNT(*) as count,
      ARRAY_AGG(id ORDER BY last_message_timestamp DESC NULLS LAST, created_at DESC) as ids
    FROM public.conversations
    GROUP BY participant_ids
    HAVING COUNT(*) > 1
  )
  SELECT COUNT(*) INTO duplicates_count FROM duplicated_conversations;

  RAISE NOTICE 'Grupos de conversas duplicadas encontrados: %', duplicates_count;

  -- Se houver duplicatas, limpar
  IF duplicates_count > 0 THEN
    RAISE NOTICE '';
    RAISE NOTICE 'Iniciando limpeza de duplicatas...';
    RAISE NOTICE '';

    -- Para cada grupo de duplicatas, manter apenas a mais recente
    WITH duplicated_conversations AS (
      SELECT
        participant_ids,
        ARRAY_AGG(id ORDER BY last_message_timestamp DESC NULLS LAST, created_at DESC) as ids
      FROM public.conversations
      GROUP BY participant_ids
      HAVING COUNT(*) > 1
    ),
    conversations_to_keep AS (
      SELECT participant_ids, ids[1] as id_to_keep
      FROM duplicated_conversations
    ),
    conversations_to_delete AS (
      SELECT
        dc.participant_ids,
        unnest(dc.ids[2:]) as id_to_delete,
        ctk.id_to_keep
      FROM duplicated_conversations dc
      JOIN conversations_to_keep ctk ON dc.participant_ids = ctk.participant_ids
    )
    -- Atualizar mensagens das conversas que serão deletadas
    -- para apontar para a conversa que será mantida
    UPDATE public.messages m
    SET conversation_id = ctd.id_to_keep
    FROM conversations_to_delete ctd
    WHERE m.conversation_id = ctd.id_to_delete;

    -- Deletar conversas duplicadas (mantendo apenas a mais recente de cada grupo)
    WITH duplicated_conversations AS (
      SELECT
        participant_ids,
        ARRAY_AGG(id ORDER BY last_message_timestamp DESC NULLS LAST, created_at DESC) as ids
      FROM public.conversations
      GROUP BY participant_ids
      HAVING COUNT(*) > 1
    )
    DELETE FROM public.conversations
    WHERE id IN (
      SELECT unnest(ids[2:])
      FROM duplicated_conversations
    );

    -- Contar conversas após limpeza
    SELECT COUNT(*) INTO conversations_after FROM public.conversations;

    RAISE NOTICE 'Conversas removidas: %', (conversations_before - conversations_after);
    RAISE NOTICE 'Conversas restantes: %', conversations_after;
  ELSE
    RAISE NOTICE 'Nenhuma duplicata encontrada. ✅';
    SELECT COUNT(*) INTO conversations_after FROM public.conversations;
  END IF;

  RAISE NOTICE '';
END$$;

-- ----------------------------------------------------------------
-- PARTE 2: CRIAR ÍNDICE ÚNICO PARA PREVENIR DUPLICATAS FUTURAS
-- ----------------------------------------------------------------

DO $$
BEGIN
  RAISE NOTICE '───────────────────────────────────────────────────────────';
  RAISE NOTICE 'CRIANDO ÍNDICE ÚNICO';
  RAISE NOTICE '───────────────────────────────────────────────────────────';
  RAISE NOTICE '';

  -- Drop index se já existir
  DROP INDEX IF EXISTS public.idx_conversations_participants_unique;

  -- Criar índice único baseado em participant_ids
  -- Isso garante que não haverá duas conversas com os mesmos participantes
  CREATE UNIQUE INDEX idx_conversations_participants_unique
    ON public.conversations (participant_ids);

  RAISE NOTICE 'Índice único criado: idx_conversations_participants_unique';
  RAISE NOTICE 'Agora é impossível criar conversas duplicadas com os mesmos participantes. ✅';
  RAISE NOTICE '';
END$$;

-- ----------------------------------------------------------------
-- PARTE 3: GARANTIR participant_ids ESTÁ SEMPRE POPULADO
-- ----------------------------------------------------------------

DO $$
DECLARE
  empty_participant_ids_count integer;
BEGIN
  RAISE NOTICE '───────────────────────────────────────────────────────────';
  RAISE NOTICE 'VERIFICANDO participant_ids';
  RAISE NOTICE '───────────────────────────────────────────────────────────';
  RAISE NOTICE '';

  -- Verificar se há conversas com participant_ids vazio ou nulo
  SELECT COUNT(*) INTO empty_participant_ids_count
  FROM public.conversations
  WHERE participant_ids IS NULL OR participant_ids = '{}';

  IF empty_participant_ids_count > 0 THEN
    RAISE NOTICE 'Conversas com participant_ids vazio: %', empty_participant_ids_count;
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  ATENÇÃO: Há conversas sem participant_ids definido!';
    RAISE NOTICE '   Isso pode causar problemas. Considere popular manualmente:';
    RAISE NOTICE '';
    RAISE NOTICE '   UPDATE public.conversations';
    RAISE NOTICE '   SET participant_ids = string_to_array(id, ''-'')::uuid[]';
    RAISE NOTICE '   WHERE participant_ids IS NULL OR participant_ids = ''{}''';
    RAISE NOTICE '';
  ELSE
    RAISE NOTICE 'Todas as conversas têm participant_ids populado. ✅';
    RAISE NOTICE '';
  END IF;
END$$;

-- ----------------------------------------------------------------
-- PARTE 4: RESUMO FINAL
-- ----------------------------------------------------------------

DO $$
DECLARE
  total_conversations integer;
  unique_participant_pairs integer;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE 'RESUMO FINAL';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '';

  SELECT COUNT(*) INTO total_conversations FROM public.conversations;
  SELECT COUNT(DISTINCT participant_ids) INTO unique_participant_pairs FROM public.conversations;

  RAISE NOTICE 'Total de conversas: %', total_conversations;
  RAISE NOTICE 'Pares únicos de participantes: %', unique_participant_pairs;
  RAISE NOTICE '';

  IF total_conversations = unique_participant_pairs THEN
    RAISE NOTICE '✅ PERFEITO! Não há duplicatas.';
    RAISE NOTICE '   Cada par de participantes tem exatamente 1 conversa.';
  ELSE
    RAISE NOTICE '⚠️  ATENÇÃO! Ainda há duplicatas:';
    RAISE NOTICE '   Diferença: % conversas extras', (total_conversations - unique_participant_pairs);
    RAISE NOTICE '   Execute novamente este script ou investigue manualmente.';
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE 'MIGRATION COMPLETA';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE 'Próximos passos:';
  RAISE NOTICE '  1. Fazer hard refresh no navegador (Ctrl+Shift+R)';
  RAISE NOTICE '  2. Verificar se duplicatas sumiram da lista';
  RAISE NOTICE '  3. Testar envio/recebimento de mensagens';
  RAISE NOTICE '';
END$$;
