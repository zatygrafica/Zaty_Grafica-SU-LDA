-- =========================================================================
-- FIX RÁPIDO: Adicionar Permissões aos Usuários de Teste
-- =========================================================================
-- Execute este SQL no Supabase Studio: http://localhost:54323
-- SQL Editor > New Query > Cole e Execute
-- =========================================================================

-- 1. Criar perfil para user@test.com (se não existir)
INSERT INTO public.profiles (id, email, full_name, role, permissions, owner_org)
SELECT
  'cba0b1f0-902d-4f4e-872f-128b99b4a50c'::uuid,
  'user@test.com',
  'User Test',
  'admin',
  '["clients","orders","invoices","payments","materials","services","employees","purchases","tasks","notes","documents","settings","financial","reports","chat","users","audit"]'::jsonb,
  '00000000-0000-0000-0000-000000000000'::uuid
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles WHERE id = 'cba0b1f0-902d-4f4e-872f-128b99b4a50c'
);

-- 2. Atualizar permissões do admin@test.com
UPDATE public.profiles
SET
  permissions = '["clients","orders","invoices","payments","materials","services","employees","purchases","tasks","notes","documents","settings","financial","reports","chat","users","audit"]'::jsonb,
  role = 'admin'
WHERE id = 'c382fd18-b129-4877-83f1-4078418df3a8';

-- 3. Verificar resultado
SELECT
  u.email,
  p.role,
  jsonb_array_length(p.permissions) as num_permissions,
  p.permissions::text as permissions_preview
FROM public.profiles p
JOIN auth.users u ON u.id = p.id
ORDER BY u.email;

-- =========================================================================
-- RESULTADO ESPERADO:
-- Ambos os usuários devem ter:
-- - role: 'admin'
-- - num_permissions: 17
-- =========================================================================
