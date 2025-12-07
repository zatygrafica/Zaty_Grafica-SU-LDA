# 🔐 Configuração de Custom JWT Claims

## 📋 O que são Custom JWT Claims?

Custom JWT Claims permitem adicionar informações personalizadas ao JSON Web Token (JWT) que o Supabase Auth gera para cada usuário autenticado. Essas informações ficam disponíveis em `request.jwt.claim.*` e podem ser usadas nas Row Level Security (RLS) policies.

## 🎯 Por que precisamos disso?

Nossas RLS policies precisam verificar o `role` e `org_id` do usuário. Por padrão, o Supabase JWT não inclui essas informações. Temos duas opções:

### ❌ Opção 1: JOIN com profiles em toda policy (lento)
```sql
CREATE POLICY example ON table
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );
```
**Problema:** Cada query faz JOIN adicional, degradando performance.

### ✅ Opção 2: Custom Claims no JWT (rápido)
```sql
CREATE POLICY example ON table
  USING (
    current_setting('request.jwt.claim.role', true) = 'admin'
  );
```
**Vantagem:** Informação já está no JWT, sem queries adicionais.

---

## 🚀 Passo a Passo de Configuração

### 1. Executar a Migration

A migration `20251207150000_setup_custom_jwt_claims.sql` já criou:
- ✅ Função `public.custom_access_token_hook`
- ✅ Helper functions (is_admin, current_user_role, etc.)
- ✅ Trigger para notificar mudanças de perfil

### 2. Configurar no Supabase Dashboard

⚠️ **IMPORTANTE:** Essa parte DEVE ser feita manualmente no dashboard.

1. **Acesse o Supabase Dashboard:**
   - URL: https://app.supabase.com
   - Selecione seu projeto

2. **Navegue para Authentication → Hooks:**
   - Menu lateral: `Authentication`
   - Submenu: `Hooks`

3. **Configure o Custom Access Token Hook:**
   - Encontre: `Custom Access Token Hook`
   - Clique em `Enable Hook`
   - Selecione: `Postgres Function`
   - Escolha: `public.custom_access_token_hook`
   - **Importante:** Deixe o schema como `public`

4. **Salvar:**
   - Clique em `Save`
   - Aguarde confirmação

### 3. Testar a Configuração

```sql
-- 1. No SQL Editor do Supabase, execute:
SELECT auth.uid() as user_id;

-- 2. Verifique se a função foi criada:
SELECT
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name = 'custom_access_token_hook';

-- 3. Teste uma helper function:
SELECT public.current_user_role();
```

### 4. Validar no Frontend

Após configurar, faça **logout e login** novamente no sistema.

Então, no console do navegador:

```javascript
// Obter o JWT atual
const { data: { session } } = await supabase.auth.getSession();
const token = session?.access_token;

// Decodificar (use jwt.io ou atob)
const payload = JSON.parse(atob(token.split('.')[1]));

// Verificar se tem os custom claims
console.log('Role:', payload.role);
console.log('Org ID:', payload.org_id);
console.log('Permissions:', payload.permissions);
```

**Esperado:**
```json
{
  "role": "admin",
  "org_id": "uuid-da-organizacao",
  "permissions": ["read", "write", "delete"]
}
```

---

## 🛠️ Helper Functions Disponíveis

A migration criou funções auxiliares que você pode usar nas policies:

### 1. `public.current_user_role()`
Retorna o role do usuário atual.

```sql
SELECT public.current_user_role();
-- Retorna: 'admin' | 'user'
```

**Uso em Policy:**
```sql
CREATE POLICY admin_only ON sensitive_table
  USING (public.current_user_role() = 'admin');
```

### 2. `public.current_user_org_id()`
Retorna o org_id do usuário atual.

```sql
SELECT public.current_user_org_id();
-- Retorna: uuid
```

**Uso em Policy:**
```sql
CREATE POLICY org_access ON documents
  USING (owner_org = public.current_user_org_id());
```

### 3. `public.is_admin()`
Verifica se usuário é admin.

```sql
SELECT public.is_admin();
-- Retorna: true | false
```

**Uso em Policy:**
```sql
CREATE POLICY admin_or_owner ON tasks
  USING (
    public.is_admin() OR
    created_by = auth.uid()
  );
```

---

## 🔄 Atualização de Claims

### Quando os claims são atualizados?

Os custom claims são incluídos no JWT **apenas no momento do login**.

### O que acontece se eu mudar o role de um usuário?

1. O usuário continua com o JWT antigo até expirar (padrão: 1 hora)
2. O trigger `trigger_profile_change` emite um aviso no log
3. **Solução:** Usuário deve fazer logout e login novamente

### Forçar re-autenticação programaticamente

```typescript
// Frontend - Forçar logout após mudança de role
import { supabase } from './supabaseClient';

async function updateUserRole(userId: string, newRole: string) {
  // 1. Atualizar role no banco
  await supabase
    .from('profiles')
    .update({ role: newRole })
    .eq('id', userId);

  // 2. Se for o próprio usuário, fazer logout
  const { data: { user } } = await supabase.auth.getUser();
  if (user?.id === userId) {
    await supabase.auth.signOut();
    // Redirecionar para login
    window.location.href = '/login';
  }
}
```

---

## 🧪 Troubleshooting

### Claims não aparecem no JWT

**Verificar:**
1. ✅ Hook está habilitado no dashboard?
2. ✅ Função `custom_access_token_hook` existe no schema `public`?
3. ✅ Função está marcada como `VOLATILE` (não `STABLE`)?
4. ✅ Fez logout e login novamente após configurar?

**Comando para verificar:**
```sql
SELECT
  proname,
  pronamespace::regnamespace as schema,
  provolatile as volatility
FROM pg_proc
WHERE proname = 'custom_access_token_hook';
-- Resultado esperado: volatility = 'v' (VOLATILE)
```

### Policy ainda não funciona

**Usar helper functions ao invés de claims diretos:**

❌ **Evite:**
```sql
USING (current_setting('request.jwt.claim.role', true) = 'admin')
```

✅ **Use:**
```sql
USING (public.current_user_role() = 'admin')
```

**Motivo:** Helper functions fazem fallback para JOIN com profiles se claims não existirem.

### Performance degradada

Se policies estiverem lentas após usar helper functions:

1. Verificar se hook está configurado (claims devem estar no JWT)
2. Criar índices nas colunas usadas:
   ```sql
   CREATE INDEX idx_profiles_role ON profiles(role);
   CREATE INDEX idx_profiles_org_id ON profiles(org_id);
   ```

---

## 📚 Referências

- [Supabase Docs - Custom Claims](https://supabase.com/docs/guides/auth/custom-claims-and-role-based-access-control-rbac)
- [Supabase Docs - Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL Functions](https://www.postgresql.org/docs/current/xfunc.html)

---

## ✅ Checklist de Configuração

- [ ] Migration executada (`20251207150000_setup_custom_jwt_claims.sql`)
- [ ] Hook configurado no Supabase Dashboard (Authentication → Hooks)
- [ ] Testado: Logout e login novamente
- [ ] Validado: JWT contém custom claims (role, org_id, permissions)
- [ ] Testado: Helper functions funcionando (`public.is_admin()`, etc.)
- [ ] Atualizado: Policies usando helper functions
- [ ] Documentado: Processo de mudança de role para equipe

---

**Data de criação:** 2025-12-07
**Status:** ⚠️ Requer configuração manual no dashboard
**Responsável:** DevOps/Backend Team
