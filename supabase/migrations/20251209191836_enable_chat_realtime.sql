-- =========================================================================
-- HABILITAR SUPABASE REALTIME PARA CHAT
-- =========================================================================
-- Esta migration habilita o Realtime nas tabelas conversations e messages
-- para permitir atualizações em tempo real no chat interno.
-- =========================================================================

-- 1. Configurar REPLICA IDENTITY FULL para as tabelas de chat
-- Isso permite que o Realtime capture todas as mudanças (INSERTs, UPDATEs, DELETEs)
ALTER TABLE public.conversations REPLICA IDENTITY FULL;
ALTER TABLE public.messages REPLICA IDENTITY FULL;

-- 2. Adicionar tabelas à publicação do Realtime
-- Isso permite que o Supabase Realtime envie eventos de mudanças para os clientes
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- =========================================================================
-- IMPORTANTE:
-- Após aplicar esta migration, o chat funcionará em tempo real:
-- - Novas mensagens aparecerão instantaneamente
-- - Mudanças em conversas serão refletidas automaticamente
-- - Funciona para todos os usuários conectados
-- =========================================================================

-- Verificar resultado
DO $$
BEGIN
  RAISE NOTICE '✅ Realtime habilitado para chat!';
  RAISE NOTICE '';
  RAISE NOTICE 'Tabelas configuradas:';
  RAISE NOTICE '  ✓ conversations (REPLICA IDENTITY FULL)';
  RAISE NOTICE '  ✓ messages (REPLICA IDENTITY FULL)';
  RAISE NOTICE '';
  RAISE NOTICE 'Publicação supabase_realtime atualizada!';
  RAISE NOTICE '';
  RAISE NOTICE '⚡ Chat agora funciona em tempo real!';
END$$;
