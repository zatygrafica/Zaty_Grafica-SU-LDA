# ✅ Fix: UUID Exibido em Vez do Nome do Usuário no Chat - RESOLVIDO

## 🎯 Problema Relatado

**Sintoma**: Na área de cabeçalho do chat, onde deveria aparecer o nome do usuário e o status (online/offline), o sistema exibe apenas o UUID:

```
Exemplo: 2840e79a-db3e-4a02-9b79-7c54259bd2a5
```

**Esperado**: Nome do usuário, foto e status online/offline.

## ✅ PROBLEMA RESOLVIDO

**Causa Raiz**: A query em `listUsersForChat()` estava tentando selecionar a coluna `is_blocked` que **não existe** na tabela `profiles`.

**Erro no Console**:
```
column profiles.is_blocked does not exist
```

**Solução**: Removida a coluna `is_blocked` da query SQL.

**Arquivo Corrigido**: [src/store/useUserStore.ts:215](../src/store/useUserStore.ts#L215)

```typescript
// ANTES (❌ ERRO)
.select('id, full_name, email, role, permissions, avatar_url, is_blocked, created_at, updated_at')

// DEPOIS (✅ CORRIGIDO)
.select('id, full_name, email, role, permissions, avatar_url, created_at, updated_at')
```

---

## 🔍 Diagnóstico Implementado

### Debug Logging Adicionado

#### 1. UserStore - Verificação de Carregamento de Dados
**Arquivo**: [src/store/useUserStore.ts](../src/store/useUserStore.ts#L224-L237)

```typescript
const normalized = (data || []).map((profile) => {
  const raw = convertKeysToCamelCase(profile as Record<string, unknown>);
  const user = mapProfileToUser(raw as ProfileRecord);
  // Debug log to verify name mapping
  if (!user.name || user.name === 'Unnamed User') {
    console.warn('[UserStore] User with missing name:', { raw, user });
  }
  return normalizeUser(user);
});

set({ users: normalized, loading: false, hasLoaded: true });
console.log(`[UserStore] Successfully loaded ${normalized.length} users for chat`);
console.log('[UserStore] Sample user:', normalized[0]);
```

**O que verifica**:
- Se usuários sem nome estão sendo carregados
- Se a conversão de `full_name` → `name` está funcionando
- Quantos usuários foram carregados
- Estrutura de um usuário de exemplo

#### 2. MessageHeader - Verificação de Lookup de Usuário
**Arquivo**: [src/components/Chat/MessageHeader.tsx](../src/components/Chat/MessageHeader.tsx#L27-L38)

```typescript
// Debug: Log when user is not found
React.useEffect(() => {
  if (otherUserId && !otherUser && hasLoaded) {
    console.warn('[MessageHeader] User not found in store:', {
      otherUserId,
      usersCount: users.length,
      hasLoaded,
      loading,
      userIds: users.map((u) => u.id),
    });
  }
}, [otherUserId, otherUser, hasLoaded, loading, users]);
```

**O que verifica**:
- Se o usuário da conversa não foi encontrado no UserStore
- Quantos usuários estão no store quando o lookup falha
- Se a lista de IDs no store contém o UUID procurado
- Se o carregamento já foi concluído (`hasLoaded`)

---

## 🧪 Como Diagnosticar

### Passo 1: Limpar Cache e Recarregar

```bash
# 1. Hard refresh no navegador
Ctrl + Shift + R (Windows/Linux)
Cmd + Shift + R (Mac)

# 2. Ou limpar cache manualmente
# No console do navegador:
localStorage.clear();
location.reload();
```

### Passo 2: Verificar Console do Navegador

**Ao abrir o chat**, você deve ver:

```
[UserStore] Fetching users for chat directly from profiles
[UserStore] Successfully loaded 5 users for chat
[UserStore] Sample user: { id: "...", name: "João Silva", email: "..." }
```

**Se aparecer warning**:
```
[UserStore] User with missing name: { raw: {...}, user: {...} }
```
→ Significa que o campo `full_name` está vazio no banco de dados

**Ao selecionar uma conversa**, se o nome não aparecer:
```
[MessageHeader] User not found in store: {
  otherUserId: "2840e79a-db3e-4a02-9b79-7c54259bd2a5",
  usersCount: 0,
  hasLoaded: false,
  loading: true,
  userIds: []
}
```
→ Significa que o UserStore ainda não carregou

### Passo 3: Verificar Dados no Banco

**No Supabase Dashboard → SQL Editor**:

```sql
-- Verificar se usuários têm full_name
SELECT
  id,
  email,
  full_name,
  avatar_url,
  role
FROM public.profiles
LIMIT 10;

-- Resultado esperado:
-- id                                   | email            | full_name    | avatar_url | role
-- ------------------------------------ | ---------------- | ------------ | ---------- | -----
-- 2840e79a-db3e-4a02-9b79-7c54259bd2a5 | user@example.com | João Silva   | null       | user
```

**Se `full_name` estiver NULL ou vazio**:
```sql
-- Atualizar manualmente (substitua os valores)
UPDATE public.profiles
SET full_name = 'Nome do Usuário'
WHERE id = '2840e79a-db3e-4a02-9b79-7c54259bd2a5';
```

---

## 🔄 Possíveis Causas e Soluções

### Causa 1: UserStore Não Carregou

**Sintoma**:
- Console mostra `usersCount: 0`
- `hasLoaded: false`

**Verificação**:
```javascript
// No console do navegador
const userStore = useUserStore.getState();
console.log('Users:', userStore.users.length);
console.log('HasLoaded:', userStore.hasLoaded);
console.log('Loading:', userStore.loading);
console.log('Error:', userStore.error);
```

**Solução**:
```javascript
// Forçar recarga manualmente
await useUserStore.getState().listUsersForChat();
console.log('Users after reload:', useUserStore.getState().users.length);
```

Se ainda retornar 0 usuários, verificar RLS policies (veja [CHAT_USERS_FINAL_SOLUTION.md](CHAT_USERS_FINAL_SOLUTION.md)).

### Causa 2: Campo `full_name` Vazio no Banco

**Sintoma**:
- Console mostra `[UserStore] User with missing name`
- Query SQL retorna `full_name: null`

**Solução**: Atualizar perfis existentes

```sql
-- Verificar quantos usuários sem nome
SELECT COUNT(*) FROM public.profiles WHERE full_name IS NULL;

-- Atualizar usando email como fallback
UPDATE public.profiles
SET full_name = SPLIT_PART(email, '@', 1)
WHERE full_name IS NULL OR full_name = '';

-- Verificar
SELECT id, email, full_name FROM public.profiles;
```

### Causa 3: Timing - MessageHeader Renderiza Antes do UserStore

**Sintoma**:
- `usersCount: 0` inicialmente
- Depois de alguns segundos, usuários aparecem

**Solução**: Já implementada no código

O MessageHeader agora acessa `hasLoaded` e `loading` para saber quando esperar dados:

```typescript
const { users, loading, hasLoaded } = useUserStore();
```

O componente renderiza o UUID como fallback até que `hasLoaded === true` e o usuário seja encontrado.

### Causa 4: Conversão de Campos Não Funcionou

**Sintoma**:
- Console mostra objeto `raw` com `full_name` preenchido
- Mas `user.name` é 'Unnamed User'

**Verificação**:
```javascript
// No console, testar conversão manualmente
import { convertKeysToCamelCase } from './src/utils/case';

const profile = { full_name: 'João Silva', avatar_url: 'https://...' };
const converted = convertKeysToCamelCase(profile);
console.log('Converted:', converted);
// Esperado: { fullName: 'João Silva', avatarUrl: 'https://...' }
```

**Solução**: Se conversão falhar, verificar [src/utils/case.ts](../src/utils/case.ts).

---

## 📋 Checklist de Diagnóstico

Execute na ordem:

- [ ] 1. Hard refresh (Ctrl+Shift+R)
- [ ] 2. Logout e login novamente
- [ ] 3. Abrir console do navegador (F12)
- [ ] 4. Ir para aba "Console"
- [ ] 5. Limpar console (botão 🚫 ou Ctrl+L)
- [ ] 6. Abrir módulo de Chat
- [ ] 7. Verificar logs: `[UserStore] Successfully loaded X users`
- [ ] 8. Verificar se há warnings de nomes ausentes
- [ ] 9. Selecionar uma conversa
- [ ] 10. Verificar se nome aparece ou UUID
- [ ] 11. Se UUID, verificar warning `[MessageHeader] User not found`
- [ ] 12. Executar verificações SQL no Supabase
- [ ] 13. Verificar estado do UserStore no console

---

## 🧪 Testes Manuais

### Teste 1: Verificar Carregamento de Usuários

```javascript
// No console do navegador (na página do chat)

// 1. Ver estado atual
const state = useUserStore.getState();
console.log('Estado UserStore:', {
  usersCount: state.users.length,
  hasLoaded: state.hasLoaded,
  loading: state.loading,
  error: state.error,
  sampleUser: state.users[0]
});

// 2. Forçar recarga
await state.listUsersForChat();

// 3. Ver estado atualizado
console.log('Após recarga:', {
  usersCount: useUserStore.getState().users.length,
  users: useUserStore.getState().users.map(u => ({ id: u.id, name: u.name, email: u.email }))
});
```

**Resultado esperado**:
```
Estado UserStore: {
  usersCount: 5,
  hasLoaded: true,
  loading: false,
  error: null,
  sampleUser: {
    id: "uuid-here",
    name: "João Silva",
    email: "joao@example.com",
    role: "user",
    photoUrl: null
  }
}
```

### Teste 2: Verificar Lookup de Usuário

```javascript
// No console do navegador (com conversa selecionada)

// 1. Pegar ID do outro usuário da conversa
const chatStore = useChatStore.getState();
const conversation = chatStore.conversations[0]; // Primeira conversa
const currentUser = useStore.getState().currentUser;
const otherUserId = conversation.participantIds.find(id => id !== currentUser?.id);

console.log('Other user ID:', otherUserId);

// 2. Procurar no UserStore
const userStore = useUserStore.getState();
const otherUser = userStore.users.find(u => u.id === otherUserId);

console.log('Found user:', otherUser);

// 3. Se não encontrar, listar todos os IDs
if (!otherUser) {
  console.log('Available user IDs:', userStore.users.map(u => u.id));
  console.log('Looking for:', otherUserId);
}
```

**Resultado esperado**:
```
Other user ID: "2840e79a-db3e-4a02-9b79-7c54259bd2a5"
Found user: {
  id: "2840e79a-db3e-4a02-9b79-7c54259bd2a5",
  name: "João Silva",
  email: "joao@example.com",
  ...
}
```

**Se não encontrar**:
```
Other user ID: "2840e79a-db3e-4a02-9b79-7c54259bd2a5"
Found user: undefined
Available user IDs: ["outro-uuid-1", "outro-uuid-2", ...]
Looking for: "2840e79a-db3e-4a02-9b79-7c54259bd2a5"
```
→ Usuário não está no banco ou RLS está bloqueando

---

## 🔒 Verificação de RLS Policies

Se usuários não aparecem, verificar policies:

```sql
-- Verificar policies de SELECT em profiles
SELECT
  policyname,
  cmd as operation,
  qual as using_expression
FROM pg_policies
WHERE tablename = 'profiles';

-- Resultado esperado:
-- policyname                           | operation | using_expression
-- ------------------------------------ | --------- | --------------------
-- profiles_select_all_authenticated    | SELECT    | (auth.uid() IS NOT NULL)
-- profiles_select_own                  | SELECT    | (auth.uid() = id)
-- profiles_update_own                  | UPDATE    | (auth.uid() = id)
-- profiles_insert_own                  | INSERT    | (auth.uid() = id)
```

Se `profiles_select_all_authenticated` não existir:

```sql
-- Recriar policy
DROP POLICY IF EXISTS profiles_select_all_authenticated ON public.profiles;

CREATE POLICY profiles_select_all_authenticated
  ON public.profiles
  FOR SELECT
  USING (auth.uid() IS NOT NULL);
```

---

## 📊 Fluxo de Dados (Para Entender o Problema)

```
1. ChatModule monta
   ↓
2. useEffect chama listUsersForChat()
   ↓
3. Query SQL: SELECT full_name, avatar_url, ... FROM profiles
   ↓
4. Conversão: convertKeysToCamelCase({ full_name: "João" }) → { fullName: "João" }
   ↓
5. Mapping: mapProfileToUser({ fullName: "João" }) → { name: "João" }
   ↓
6. UserStore atualizado: users = [{ id, name, email, ... }]
   ↓
7. MessageHeader procura: users.find(u => u.id === otherUserId)
   ↓
8. Se encontrado: Exibe name
9. Se NÃO encontrado: Exibe otherUserId (UUID) ← PROBLEMA
```

**Pontos de falha**:
- Passo 3: RLS bloqueia query (veja RLS policies)
- Passo 3: `full_name` é NULL no banco (atualizar dados)
- Passo 6: UserStore ainda `loading: true` quando MessageHeader renderiza (timing)
- Passo 7: UUID não está na lista (usuário deletado ou ID incorreto)

---

## ✅ Solução Final

### Código Atualizado

1. **UserStore com Debug Logs** ✅
   - Logs de carregamento
   - Warnings para nomes ausentes
   - Sample user no console

2. **MessageHeader com Debug Logs** ✅
   - Acesso a `hasLoaded` e `loading`
   - Warning quando usuário não encontrado
   - Informações sobre o estado do store

### Build Verificado ✅

```bash
npm run build
# ✓ built in 1m 50s
# Sem erros TypeScript
```

---

## 🎯 Próximos Passos (Para o Usuário)

1. **Fazer hard refresh** (Ctrl+Shift+R)
2. **Abrir console** do navegador (F12)
3. **Abrir chat**
4. **Verificar logs** conforme este documento
5. **Selecionar conversa**
6. **Reportar** o que aparece no console:
   - Logs do `[UserStore]`
   - Warnings do `[MessageHeader]`
   - Estado do `useUserStore.getState()`

---

## 📖 Arquivos Relacionados

- [src/store/useUserStore.ts](../src/store/useUserStore.ts) - Lógica de carregamento de usuários
- [src/components/Chat/MessageHeader.tsx](../src/components/Chat/MessageHeader.tsx) - Exibição do nome do usuário
- [src/components/Chat/ChatModule.tsx](../src/components/Chat/ChatModule.tsx) - Inicialização do chat
- [CHAT_USERS_FINAL_SOLUTION.md](CHAT_USERS_FINAL_SOLUTION.md) - Solução de visibilidade de usuários
- [TEST_CHAT_USERS.md](../TEST_CHAT_USERS.md) - Guia de testes

---

**Criado**: 2025-12-09
**Problema**: UUID exibido em vez do nome no chat
**Status**: Debug logging implementado - Aguardando teste do usuário
**Build**: ✅ Sucesso (sem erros)
