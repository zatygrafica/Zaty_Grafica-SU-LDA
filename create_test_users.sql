-- =========================================================================
-- CRIAR USUÁRIOS DE TESTE
-- =========================================================================
-- Execute este script no Supabase Studio: http://localhost:54323
-- SQL Editor > New Query > Cole este código > Run
-- =========================================================================

-- 1. Deletar usuários de teste existentes (para reset)
DELETE FROM auth.users WHERE email IN ('admin@test.com', 'user@test.com');

-- 2. Criar usuário ADMIN
-- Email: admin@test.com
-- Senha: 123456
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@test.com',
  -- Senha: 123456 (hash bcrypt)
  crypt('123456', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Admin User","role":"admin"}',
  now(),
  now(),
  '',
  '',
  '',
  ''
);

-- 3. Criar usuário COMUM
-- Email: user@test.com
-- Senha: 123456
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'user@test.com',
  -- Senha: 123456 (hash bcrypt)
  crypt('123456', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Test User","role":"user"}',
  now(),
  now(),
  '',
  '',
  '',
  ''
);

-- 4. Criar perfis para os usuários
-- Perfil ADMIN
INSERT INTO public.profiles (id, email, full_name, role, permissions)
SELECT
  id,
  'admin@test.com',
  'Admin User',
  'admin',
  ARRAY[
    'clients', 'orders', 'invoices', 'payments', 'materials', 'services',
    'employees', 'purchases', 'tasks', 'notes', 'documents', 'settings',
    'financial', 'reports', 'chat', 'users', 'audit'
  ]
FROM auth.users
WHERE email = 'admin@test.com';

-- Perfil USER
INSERT INTO public.profiles (id, email, full_name, role, permissions)
SELECT
  id,
  'user@test.com',
  'Test User',
  'user',
  ARRAY['clients', 'orders', 'services', 'tasks', 'notes', 'chat']
FROM auth.users
WHERE email = 'user@test.com';

-- 5. Verificar resultado
SELECT
  u.id,
  u.email,
  u.email_confirmed_at IS NOT NULL as confirmed,
  p.full_name,
  p.role,
  array_length(p.permissions, 1) as num_permissions
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE u.email IN ('admin@test.com', 'user@test.com')
ORDER BY u.email;

-- =========================================================================
-- RESULTADO ESPERADO:
--
-- admin@test.com | confirmed: true | Admin User  | admin | 17 permissions
-- user@test.com  | confirmed: true | Test User   | user  | 6 permissions
--
-- CREDENCIAIS:
-- Admin: admin@test.com / 123456
-- User:  user@test.com / 123456
-- =========================================================================
