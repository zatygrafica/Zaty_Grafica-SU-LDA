# 🔧 Fix: Problemas do Chat para Usuários Simples

## 🎯 Problemas Relatados

Usuários **simples** (não-administradores) enfrentam os seguintes problemas no chat:

1. ❌ **Foto de perfil quebrada** - Ícone de imagem quebrada em vez da foto
2. ❌ **Usuários duplicados** - Mesmo usuário aparece múltiplas vezes na lista
3. ❌ **Conversas misturadas** - Mensagens de diferentes conversas aparecem juntas

**Importante**: Estes problemas **NÃO** ocorrem com administradores, apenas com usuários simples.

---

## 🔍 Diagnóstico Implementado

### Debug Logging Adicionado

#### 1. ConversationList - Verificação de Dados
**Arquivo**: [src/components/Chat/ConversationList.tsx](../src/components/Chat/ConversationList.tsx#L24-L65)

```typescript
console.log('[ConversationList] Building conversation details:', {
  conversationsCount: conversations.length,
  usersCount: users.length,
  currentUserId: currentUser?.id
});

// Warning se usuário não encontrado
if (!otherUser) {
  console.warn('[ConversationList] User not found for conversation:', {
    convoId: convo.id,
    participantIds: convo.participantIds,
    otherUserId,
    availableUserIds: users.map(u => u.id)
  });
}

console.log('[ConversationList] Final conversation details:', {
  totalDetails: details.length,
  uniqueUsers: new Set(details.map(d => d.otherUser?.id)).size
});
```

**O que verifica**:
- Quantas conversas e usuários foram carregados
- Se há conversas sem usuário correspondente (causa duplicação)
- Se há duplicação (totalDetails !== uniqueUsers)

#### 2. UserStore - Carregamento de Dados
**Arquivo**: [src/store/useUserStore.ts](../src/store/useUserStore.ts#L224-L237)

Já implementado anteriormente:
- Logs de carregamento de usuários
- Warnings para usuários sem nome
- Sample user com todos os campos

#### 3. MessageHeader - Lookup de Usuário
**Arquivo**: [src/components/Chat/MessageHeader.tsx](../src/components/Chat/MessageHeader.tsx#L27-L38)

Já implementado anteriormente:
- Warning quando usuário não encontrado
- Estado do UserStore

---

## 🧪 Como Diagnosticar (Usuário Simples)

### Passo 1: Fazer Login como Usuário Simples

1. **Logout** se estiver como admin
2. **Login** com credenciais de usuário simples (role=`user`)
3. **Abrir o Chat** no menu

### Passo 2: Abrir Console do Navegador

```
F12 → Aba "Console"
```

### Passo 3: Verificar Logs

Você deve ver:

```javascript
[UserStore] Fetching users for chat directly from profiles
[UserStore] Successfully loaded X users for chat
[UserStore] Sample user: { id: "...", name: "...", photoUrl: "..." }

[ConversationList] Building conversation details: {
  conversationsCount: 5,
  usersCount: 3,
  currentUserId: "..."
}
[ConversationList] Final conversation details: {
  totalDetails: 5,
  uniqueUsers: 3
}
```

**Problemas a verificar**:

#### Problema 1: Foto Quebrada

**Sintoma no console**:
```javascript
[UserStore] Sample user: {
  id: "...",
  name: "Nome",
  photoUrl: null  // ← PROBLEMA: NULL ou undefined
}
```

**Ou**:
```javascript
// Erro de carregamento de imagem
GET https://hvnfoaewvrabyxaktjlf.supabase.co/storage/v1/object/public/avatars/... 403 Forbidden
```

**Causa**:
- Campo `avatar_url` não está sendo carregado
- OU bucket de storage não permite acesso público
- OU RLS do storage bloqueia usuários simples

#### Problema 2: Duplicação

**Sintoma no console**:
```javascript
[ConversationList] Final conversation details: {
  totalDetails: 6,      // ← 6 conversas
  uniqueUsers: 3        // ← mas apenas 3 usuários únicos → DUPLICAÇÃO!
}
```

**Causa**:
- Múltiplas conversas no banco para o mesmo par de participantes
- Frontend não está deduplicando corretamente

#### Problema 3: Conversas Misturadas

**Sintoma no console**:
```javascript
[ConversationList] User not found for conversation: {
  convoId: "...",
  participantIds: ["user1", "user2"],
  otherUserId: "user2",
  availableUserIds: ["user3", "user4"] // ← user2 não está na lista!
}
```

**Causa**:
- Usuário da conversa não está sendo carregado por `listUsersForChat()`
- RLS bloqueando acesso a alguns perfis específicos

---

## 🔧 Soluções para Cada Problema

### Solução 1: Foto de Perfil Quebrada

#### Verificar se avatar_url está sendo carregado

**Console do navegador**:
```javascript
// Ver usuários carregados
const userStore = useUserStore.getState();
console.log('Users:', userStore.users.map(u => ({
  name: u.name,
  photoUrl: u.photoUrl
})));

// Verificar se há photoUrl
const withPhotos = userStore.users.filter(u => u.photoUrl).length;
const total = userStore.users.length;
console.log(`Users with photos: ${withPhotos}/${total}`);
```

#### Se photoUrl está null

**Causa**: Campo `avatar_url` vazio no banco

**Solução SQL** (no Supabase Dashboard):
```sql
-- Ver quais usuários não têm avatar_url
SELECT id, full_name, email, avatar_url
FROM public.profiles
WHERE avatar_url IS NULL OR avatar_url = '';

-- Definir um avatar padrão (opcional)
UPDATE public.profiles
SET avatar_url = 'https://ui-avatars.com/api/?name=' || full_name || '&background=random'
WHERE avatar_url IS NULL OR avatar_url = '';
```

#### Se photoUrl tem valor mas imagem quebra

**Causa**: Permissões do Storage

**Solução**: Verificar RLS do bucket `avatars`:

1. **Supabase Dashboard** → Storage → Policies
2. **Verificar bucket `avatars`**:
   - Deve ter policy de SELECT pública OU
   - Policy que permite `auth.uid() IS NOT NULL`

**Criar policy se necessário**:
```sql
-- Permitir leitura pública de avatares
CREATE POLICY "Public avatars read access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- OU permitir apenas usuários autenticados
CREATE POLICY "Authenticated avatars read"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'avatars');
```

### Solução 2: Duplicação de Usuários

**Já implementada**: Migration `20251209000000_cleanup_duplicate_conversations.sql`

#### Verificar se migration foi aplicada

**SQL** (Supabase Dashboard):
```sql
-- Verificar índice único
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'conversations'
AND indexname = 'idx_conversations_participants_unique';

-- Deve retornar 1 linha
-- Se vazio, migration não foi aplicada
```

#### Verificar duplicatas no banco

```sql
-- Ver duplicatas
SELECT
  participant_ids,
  COUNT(*) as total,
  ARRAY_AGG(id) as conversation_ids
FROM public.conversations
GROUP BY participant_ids
HAVING COUNT(*) > 1;

-- Se retornar linhas → HÁ DUPLICATAS
```

**Solução**: Reaplicar migration:
```bash
npx supabase db push --linked
```

### Solução 3: Conversas Misturadas

#### Verificar se todos os usuários estão sendo carregados

**Console do navegador**:
```javascript
// Ver IDs de participantes nas conversas
const chatStore = useChatStore.getState();
const participantIds = new Set();
chatStore.conversations.forEach(c => {
  c.participantIds.forEach(id => participantIds.add(id));
});

// Ver IDs de usuários carregados
const userStore = useUserStore.getState();
const userIds = new Set(userStore.users.map(u => u.id));

// Ver quais participantes NÃO foram carregados
const missing = [...participantIds].filter(id => !userIds.has(id));
console.log('Missing users:', missing);
console.log('Participant IDs:', [...participantIds]);
console.log('Loaded user IDs:', [...userIds]);
```

#### Se houver usuários ausentes

**Causa**: RLS bloqueando ou usuário deletado

**Verificar no banco**:
```sql
-- Ver se usuários ausentes existem
SELECT id, full_name, email
FROM public.profiles
WHERE id IN ('id1', 'id2', 'id3'); -- IDs dos missing users

-- Se não retornar linhas → usuário foi deletado
-- Se retornar linhas → RLS está bloqueando
```

**Solução se bloqueado por RLS**:

Verificar policy:
```sql
SELECT * FROM pg_policies
WHERE tablename = 'profiles'
AND policyname = 'profiles_select_all_authenticated';

-- Deve existir policy com USING (auth.uid() IS NOT NULL)
```

Se não existir, aplicar:
```sql
CREATE POLICY profiles_select_all_authenticated
  ON public.profiles
  FOR SELECT
  USING (auth.uid() IS NOT NULL);
```

---

## 🔄 Fluxo Completo de Correção

### Para o Usuário

1. **Hard refresh**: `Ctrl+Shift+R`
2. **Logout e Login** como usuário simples
3. **Abrir Console** (F12)
4. **Abrir Chat**
5. **Verificar logs** conforme documentado acima
6. **Reportar** ao desenvolvedor:
   - Logs do console
   - Screenshots do problema
   - Quais das 3 soluções não funcionaram

### Para o Desenvolvedor

1. **Aplicar migrations pendentes**:
   ```bash
   npx supabase db push --linked
   ```

2. **Verificar RLS policies**:
   ```sql
   -- Profiles
   SELECT * FROM pg_policies WHERE tablename = 'profiles';

   -- Storage (avatars)
   SELECT * FROM storage.policies WHERE bucket_id = 'avatars';
   ```

3. **Limpar duplicatas manualmente** (se necessário):
   ```sql
   -- Executar migration manualmente
   -- Ver supabase/migrations/20251209000000_cleanup_duplicate_conversations.sql
   ```

4. **Fazer build e deploy**:
   ```bash
   npm run build
   ```

---

## 📊 Checklist de Validação

Execute como **usuário simples**:

- [ ] Login com usuário simples (role=`user`)
- [ ] Abrir console do navegador (F12)
- [ ] Abrir chat
- [ ] Verificar logs:
  - [ ] `[UserStore] Successfully loaded X users`
  - [ ] `[ConversationList] Building conversation details`
  - [ ] Sem warnings de "User not found"
- [ ] Verificar UI:
  - [ ] ✅ Fotos de perfil aparecem (não quebradas)
  - [ ] ✅ Cada usuário aparece apenas 1 vez
  - [ ] ✅ Mensagens corretas para cada conversa
- [ ] Testar funcionalidades:
  - [ ] Selecionar conversa → mensagens corretas
  - [ ] Enviar mensagem → funciona
  - [ ] Receber mensagem → funciona
  - [ ] Status online/offline → funciona
- [ ] Atualizar página (F5):
  - [ ] Problemas não voltam
  - [ ] Lista permanece correta

---

## 🚨 Comandos de Emergência

Se nada funcionar, execute no console do navegador:

```javascript
// 1. Limpar tudo e forçar recarga
localStorage.clear();
sessionStorage.clear();

// 2. Forçar recarga de usuários
await useUserStore.getState().listUsersForChat();

// 3. Forçar recarga de conversas
await useChatStore.getState().listConversations();

// 4. Ver estado final
console.log('Users:', useUserStore.getState().users.length);
console.log('Conversations:', useChatStore.getState().conversations.length);

// 5. Reload da página
location.reload();
```

---

## ✅ Status

| Componente | Status |
|------------|--------|
| **Debug Logs** | ✅ Implementados |
| **Migration Duplicatas** | ✅ Aplicada |
| **Índice Único** | ✅ Criado |
| **Foto Quebrada** | 🔄 Aguardando diagnóstico do usuário |
| **Duplicação** | ✅ Resolvida (banco limpo) |
| **Conversas Misturadas** | 🔄 Aguardando diagnóstico do usuário |

---

**Próximo Passo**: Usuário simples deve fazer **hard refresh**, abrir o **console** e nos enviar os **logs** que aparecem ao abrir o chat.

Com base nos logs, poderemos identificar exatamente qual dos 3 problemas persiste e aplicar a solução específica.
