-- =========================================================================
-- SCRIPT: Corrigir Permissões dos Usuários de Teste
-- =========================================================================
-- Este script cria perfis com permissões completas para os usuários de teste
-- Execute no Supabase Studio: http://localhost:54323 > SQL Editor
-- =========================================================================

-- 1. Ver usuários existentes (para referência)
SELECT
  id,
  email,
  created_at
FROM auth.users
ORDER BY created_at DESC;

-- 2. Criar perfis para TODOS os usuários sem perfil
-- Isso garante que qualquer usuário criado tenha acesso
INSERT INTO public.profiles (id, full_name, role, permissions, owner_org)
SELECT
  u.id,
  COALESCE(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1)) as full_name,
  'admin' as role, -- Todos como admin para teste
  ARRAY[
    'clients', 'orders', 'invoices', 'payments', 'materials', 'services',
    'employees', 'purchases', 'tasks', 'notes', 'documents', 'settings',
    'financial', 'reports', 'chat', 'users', 'audit'
  ] as permissions,
  '00000000-0000-0000-0000-000000000000'::uuid as owner_org
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.id = u.id
);

-- 3. Atualizar perfis existentes para ter permissões completas (caso já existam)
UPDATE public.profiles
SET
  role = 'admin',
  permissions = ARRAY[
    'clients', 'orders', 'invoices', 'payments', 'materials', 'services',
    'employees', 'purchases', 'tasks', 'notes', 'documents', 'settings',
    'financial', 'reports', 'chat', 'users', 'audit'
  ]
WHERE role IS NULL OR permissions IS NULL OR array_length(permissions, 1) IS NULL;

-- 4. Verificar resultado
SELECT
  p.id,
  u.email,
  p.full_name,
  p.role,
  array_length(p.permissions, 1) as num_permissions,
  p.owner_org
FROM public.profiles p
JOIN auth.users u ON u.id = p.id
ORDER BY u.created_at DESC;

-- =========================================================================
-- RESULTADO ESPERADO:
-- Todos os usuários devem aparecer com:
-- - role: 'admin'
-- - num_permissions: 17
-- - owner_org: 00000000-0000-0000-0000-000000000000
-- =========================================================================
