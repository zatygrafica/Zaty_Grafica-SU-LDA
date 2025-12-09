# 🧪 Teste de Visualização de Usuários no Chat

## Problema Relatado
Usuários comuns ainda não conseguem visualizar a lista de usuários na barra lateral do chat.

## ✅ Verificações Implementadas

### 1. RLS Policy (✅ Aplicada)
```sql
-- Policy permite SELECT para usuários autenticados
SELECT * FROM pg_policies
WHERE tablename = 'profiles'
AND policyname = 'profiles_select_all_authenticated';
```

### 2. Função listUsersForChat (✅ Implementada)
```typescript
// src/store/useUserStore.ts linha 207
listUsersForChat: async () => {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, email, role, permissions, avatar_url, is_blocked, created_at, updated_at')
    .order('full_name', { ascending: true });
  // ... atualiza store.users
}
```

### 3. ChatModule (✅ Atualizado)
```typescript
// src/components/Chat/ChatModule.tsx linha 16
void useUserStore.getState().listUsersForChat();
```

## 🔍 Diagnóstico Passo a Passo

### Teste 1: Verificar RLS Policy
**No Supabase Dashboard → SQL Editor**:
```sql
-- Verificar se policy existe
SELECT * FROM pg_policies
WHERE tablename = 'profiles';

-- Resultado esperado: 4 policies incluindo profiles_select_all_authenticated
```

### Teste 2: Testar Query Diretamente
**No console do navegador (logado como usuário simples)**:
```javascript
// Importar supabase
import { supabase } from './src/services/supabaseClient';

// Testar query
const { data, error } = await supabase
  .from('profiles')
  .select('*');

console.log('Profiles:', data?.length, 'profiles');
console.log('Error:', error);

// Resultado esperado: data com array de perfis, error = null
```

### Teste 3: Verificar Estado do UserStore
**No console do navegador (na página do chat)**:
```javascript
// Verificar estado atual
const userStore = useUserStore.getState();
console.log('Users no store:', userStore.users.length);
console.log('Loading:', userStore.loading);
console.log('HasLoaded:', userStore.hasLoaded);
console.log('Error:', userStore.error);

// Forçar recarga
await useUserStore.getState().listUsersForChat();
console.log('Users após reload:', useUserStore.getState().users.length);
```

### Teste 4: Verificar Renderização do Componente
**No console do navegador (React DevTools)**:
```javascript
// Inspecionar ConversationList component
// Procurar por:
// - users: array com perfis
// - allUsers: array filtrado
// - currentUser: objeto do usuário logado

// No console:
console.log('Users prop:', users);
console.log('AllUsers computed:', allUsers);
console.log('CurrentUser:', currentUser);
```

## 🐛 Possíveis Problemas e Soluções

### Problema 1: Store não atualiza
**Sintoma**: `listUsersForChat()` executa mas `users` permanece vazio

**Verificação**:
```javascript
// No console
useUserStore.subscribe(
  (state) => console.log('Store updated:', state.users.length)
);
await useUserStore.getState().listUsersForChat();
```

**Solução**: Verificar se `set()` do Zustand está sendo chamado corretamente

### Problema 2: Query retorna vazio
**Sintoma**: Query executa mas `data` é vazio

**Verificação**:
```sql
-- Verificar se há profiles na tabela
SELECT COUNT(*) FROM public.profiles;
```

**Solução**: Se vazio, criar alguns perfis de teste

### Problema 3: RLS ainda bloqueia
**Sintoma**: Query retorna erro de permission

**Verificação**:
```javascript
// No console (logado como user simples)
const { data, error } = await supabase.from('profiles').select('id');
console.log('Error:', error?.message);
// Se error contém "permission denied" → RLS está bloqueando
```

**Solução**: Reaplicar migration

### Problema 4: Componente não re-renderiza
**Sintoma**: Store atualiza mas UI não muda

**Verificação**:
```javascript
// Verificar se ConversationList está subscrito ao store
// No código: const { users } = useUserStore();
// Isso deve criar subscription automática do Zustand
```

**Solução**: Adicionar `useEffect` para debug:
```typescript
useEffect(() => {
  console.log('[ConversationList] users changed:', users.length);
}, [users]);
```

## 📋 Checklist de Validação

Execute na ordem:

- [ ] 1. Verificar policy no Supabase Dashboard
- [ ] 2. Testar query SQL direta (console browser)
- [ ] 3. Chamar `listUsersForChat()` manualmente (console)
- [ ] 4. Verificar estado do UserStore
- [ ] 5. Inspecionar ConversationList com React DevTools
- [ ] 6. Verificar console do navegador por erros
- [ ] 7. Hard refresh (Ctrl+Shift+R)
- [ ] 8. Logout e login novamente

## 🔧 Comandos Úteis

### Console do Navegador
```javascript
// Verificar auth
const { data: { user } } = await supabase.auth.getUser();
console.log('User:', user?.id, user?.email);

// Testar listUsersForChat
await useUserStore.getState().listUsersForChat();

// Ver estado
console.log(useUserStore.getState());
```

### Supabase SQL Editor
```sql
-- Ver todas as policies de profiles
SELECT
  policyname,
  cmd as operation,
  qual as using_expression
FROM pg_policies
WHERE tablename = 'profiles';

-- Contar profiles
SELECT COUNT(*) as total FROM public.profiles;

-- Ver primeiros 5 profiles
SELECT id, full_name, email, role FROM public.profiles LIMIT 5;
```

## 📝 Resultado Esperado

Após executar as verificações, você deve ver:

1. **4 policies em profiles** (incluindo `profiles_select_all_authenticated`)
2. **Query retorna array de perfis** (não vazio, sem erro)
3. **UserStore.users populado** com array de User objects
4. **ConversationList renderiza lista** de usuários disponíveis
5. **Console sem erros** relacionados a profiles ou RLS

## 🚨 Se Nada Funcionar

Execute esta query SQL para forçar recriação das policies:

```sql
-- REMOVER TODAS AS POLICIES
DROP POLICY IF EXISTS profiles_select_own ON public.profiles;
DROP POLICY IF EXISTS profiles_select_all_authenticated ON public.profiles;
DROP POLICY IF EXISTS profiles_update_own ON public.profiles;
DROP POLICY IF EXISTS profiles_insert_own ON public.profiles;

-- RECRIAR POLICIES CORRETAS
CREATE POLICY profiles_select_all_authenticated
  ON public.profiles
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY profiles_update_own
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY profiles_insert_own
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- VERIFICAR
SELECT policyname FROM pg_policies WHERE tablename = 'profiles';
```

Depois faça **logout, login** e teste novamente.
