-- =========================================================================
-- CRIAR/ATUALIZAR USUÁRIO DE TESTE: user@test.com
-- =========================================================================
-- Este script garante que user@test.com existe e tem perfil válido
-- Execute no Supabase Studio: http://localhost:54323 > SQL Editor
-- =========================================================================

-- 1. Verificar se usuário existe
DO $$
DECLARE
  user_exists boolean;
  user_id uuid;
BEGIN
  SELECT EXISTS(SELECT 1 FROM auth.users WHERE email = 'user@test.com') INTO user_exists;

  IF NOT user_exists THEN
    RAISE NOTICE '❌ Usuário user@test.com não existe!';
    RAISE NOTICE '⚠️  Você precisa criar o usuário manualmente via Supabase Auth.';
    RAISE NOTICE '   Email: user@test.com';
    RAISE NOTICE '   Senha: 123456';
  ELSE
    SELECT id INTO user_id FROM auth.users WHERE email = 'user@test.com';
    RAISE NOTICE '✅ Usuário user@test.com existe: %', user_id;

    -- Criar/atualizar perfil
    INSERT INTO public.profiles (id, email, full_name, role, permissions)
    VALUES (
      user_id,
      'user@test.com',
      'Test User',
      'user',
      ARRAY['clients', 'orders', 'services', 'tasks', 'notes', 'chat']
    )
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      full_name = EXCLUDED.full_name,
      role = EXCLUDED.role,
      permissions = EXCLUDED.permissions;

    RAISE NOTICE '✅ Perfil criado/atualizado para user@test.com';
  END IF;
END$$;

-- 2. Verificar resultado final
SELECT
  u.id,
  u.email,
  u.created_at,
  p.full_name,
  p.role,
  p.permissions
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE u.email = 'user@test.com';

-- =========================================================================
-- INSTRUÇÕES:
--
-- Se o usuário NÃO existir:
-- 1. No Supabase Studio, vá para Authentication > Users
-- 2. Clique em "Add User"
-- 3. Email: user@test.com
-- 4. Password: 123456
-- 5. Auto Confirm: ✓ (marque esta opção)
-- 6. Execute este script novamente
--
-- SENHA CORRETA: 123456 (NÃO é user123)
-- =========================================================================
