-- =========================================================================
-- CONFIGURAR ROLES CORRETAS: Admin vs User
-- =========================================================================
-- Execute no Supabase Studio: http://localhost:54323 > SQL Editor
-- =========================================================================

-- 1. ADMIN: admin@test.com - Permissões COMPLETAS
UPDATE public.profiles
SET
  role = 'admin',
  permissions = '["clients","orders","invoices","payments","materials","services","employees","purchases","tasks","notes","documents","settings","financial","reports","chat","users","audit"]'::jsonb,
  full_name = 'Admin Test'
WHERE id = 'c382fd18-b129-4877-83f1-4078418df3a8';

-- 2. USER: user@test.com - Permissões RESTRITAS
-- Usuário simples pode:
-- - Ver clientes, pedidos, serviços
-- - Usar chat
-- - Ver suas próprias tarefas e notas
-- NÃO pode:
-- - Configurações, usuários, audit
-- - Gestão financeira completa
-- - Funcionários, compras
UPDATE public.profiles
SET
  role = 'user',
  permissions = '["clients","orders","services","tasks","notes","chat"]'::jsonb,
  full_name = 'User Test'
WHERE id = 'cba0b1f0-902d-4f4e-872f-128b99b4a50c';

-- 3. Verificar resultado
SELECT
  u.email,
  p.role,
  jsonb_array_length(p.permissions) as num_perms,
  p.permissions
FROM public.profiles p
JOIN auth.users u ON u.id = p.id
ORDER BY p.role DESC, u.email;

-- =========================================================================
-- RESULTADO ESPERADO:
--
-- admin@test.com | admin | 17 perms | [todas as permissões]
-- user@test.com  | user  | 6 perms  | ["clients","orders","services","tasks","notes","chat"]
--
-- =========================================================================
-- IMPORTANTE:
-- Após executar, faça LOGOUT e LOGIN novamente para atualizar o JWT!
-- =========================================================================
