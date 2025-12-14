-- Create test users for local development
-- This migration creates test users with known credentials

-- Delete existing test users (for idempotency)
DELETE FROM auth.users WHERE email IN ('admin@test.com', 'user@test.com');

-- Create ADMIN user
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

-- Create USER
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

-- Create profiles
INSERT INTO public.profiles (id, email, full_name, role, permissions)
SELECT
  id,
  'admin@test.com',
  'Admin User',
  'admin',
  to_jsonb(ARRAY[
    'clients', 'orders', 'invoices', 'payments', 'materials', 'services',
    'employees', 'purchases', 'tasks', 'notes', 'documents', 'settings',
    'financial', 'reports', 'chat', 'users', 'audit'
  ])
FROM auth.users
WHERE email = 'admin@test.com'
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.profiles (id, email, full_name, role, permissions)
SELECT
  id,
  'user@test.com',
  'Test User',
  'user',
  to_jsonb(ARRAY['clients', 'orders', 'services', 'tasks', 'notes', 'chat'])
FROM auth.users
WHERE email = 'user@test.com'
ON CONFLICT (id) DO NOTHING;

-- Confirmation log
DO $$
BEGIN
  RAISE NOTICE 'Test users created successfully!';
  RAISE NOTICE 'Admin: admin@test.com / 123456';
  RAISE NOTICE 'User:  user@test.com / 123456';
END$$;
