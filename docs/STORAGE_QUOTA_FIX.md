# ⚠️ ERRO CRÍTICO: Storage Quota Exceeded

## 🎯 Erro Reportado

```
Failed to execute 'setItem' on 'Storage':
Setting the value of 'sb-hvnfoaewvrabyxaktjlf-auth-token' exceeded the quota.
```

## 🔍 Causa

O **localStorage** do navegador está **cheio**. Isso acontece quando:
- Muitos dados foram armazenados
- Tokens grandes demais
- Cache acumulado de várias sessões

**Limite do localStorage**: ~5-10MB dependendo do navegador

## ✅ SOLUÇÃO IMEDIATA (Usuário)

### Opção 1: Limpar localStorage Manualmente

**Console do navegador (F12)**:
```javascript
// Limpar TUDO do localStorage
localStorage.clear();

// Limpar TUDO do sessionStorage também
sessionStorage.clear();

// Recarregar página
location.reload();
```

**Depois**: Tentar fazer login novamente

### Opção 2: Limpar Storage pelo DevTools

1. **F12** → Aba **Application** (ou **Armazenamento**)
2. **Storage** → **Local Storage**
3. Clicar com botão direito → **Clear**
4. Fazer o mesmo para **Session Storage**
5. **Recarregar a página**

### Opção 3: Limpar Dados do Site (Mais Drástico)

**Chrome/Edge**:
1. **Configurações** → **Privacidade e segurança**
2. **Limpar dados de navegação**
3. **Avançado** → Selecionar:
   - ✅ Cookies e outros dados do site
   - ✅ Imagens e arquivos em cache
4. **Intervalo**: Últimas 24 horas
5. **Limpar dados**

**Firefox**:
1. **Opções** → **Privacidade e Segurança**
2. **Cookies e dados do site** → **Limpar dados**
3. Selecionar tudo → **Limpar**

---

## 🔧 SOLUÇÃO PERMANENTE (Desenvolvedor)

### ✅ IMPLEMENTADO: Sistema Automático de Limpeza

A solução permanente foi **implementada** no sistema. O código agora:

1. **Limpa automaticamente** o storage em 2 momentos:
   - Na inicialização da aplicação
   - Antes de cada login
2. **Captura erros de quota** e tenta recuperar automaticamente
3. **Monitora o uso** do storage e alerta quando necessário

---

### Arquivos Implementados

#### 1. Utilitário de Limpeza: `src/utils/storageCleanup.ts` ✅

**Funções disponíveis**:
- `cleanupStorage()` - Remove chaves antigas automaticamente
- `getLocalStorageSize()` - Calcula tamanho atual do storage
- `emergencyStorageClear()` - Limpeza total em emergências
- `safeStorageSet()` - Wrapper seguro para localStorage.setItem com auto-cleanup
- `monitorStorage()` - Monitor contínuo de uso (desenvolvimento)

**O que a limpeza remove**:
- Chaves antigas do Supabase (exceto token atual)
- Dados temporários (`temp-*`, `cache-*`)
- Logs do tamanho antes/depois da limpeza
- Warning se uso > 80%

#### 2. Integração no Auth: `src/store/useAuthStore.ts` ✅

**Mudanças aplicadas**:

1. **Na inicialização** (linha 50):
   ```typescript
   // Clean up old storage on app initialization
   cleanupStorage();
   ```

2. **Antes do login** (linha 92):
   ```typescript
   async signIn(email, password) {
     set({ loading: true, error: null });
     try {
       // Clean up old storage before login to prevent quota errors
       cleanupStorage();

       await authService.signIn({ email, password });
       // ... resto do login
     } catch (error) {
       // ... erro handling
     }
   }
   ```

3. **Captura de erros de quota** (linhas 107-126):
   ```typescript
   catch (error) {
     // Log the actual error for debugging
     console.error('[Auth] Login error:', error);

     // Check if error is SPECIFICALLY storage quota related (QuotaExceededError)
     if (error instanceof DOMException && error.name === 'QuotaExceededError') {
       console.error('[Auth] Storage quota exceeded during login');

       // Clear all storage and reload
       localStorage.clear();
       sessionStorage.clear();
       alert('Seu navegador está com cache cheio. A página será recarregada automaticamente.');
       window.location.reload();
       return;
     }

     throw error;
   }
   ```

   **Importante**: A detecção agora é **precisa**, verificando `DOMException` com `name === 'QuotaExceededError'` em vez de apenas checar strings na mensagem de erro. Isso evita falsos positivos.

---

### Como Funciona

#### Fluxo Automático

1. **Usuário abre a aplicação**:
   - `initializeAuth()` executa
   - `cleanupStorage()` roda automaticamente
   - Logs no console: `[StorageCleanup] Cleaned up X keys, freed Y KB`

2. **Usuário faz login**:
   - `signIn()` executa
   - `cleanupStorage()` roda antes de autenticar
   - Se quota exceder, captura erro e limpa tudo

3. **Resultado**:
   - Storage mantido limpo automaticamente
   - Quota nunca excede (ou é corrigida automaticamente)
   - Usuário não precisa fazer nada manualmente

---

### Verificar se Está Funcionando

**Console do navegador** (F12):

Ao abrir a aplicação, você deve ver:
```
[StorageCleanup] Removing old key: sb-old-key-123
[StorageCleanup] Cleaned up 3 keys, freed 127.45 KB
[StorageCleanup] Storage usage: 234.12 KB / ~5120 KB limit (4.6%)
```

Se uso estiver acima de 80%:
```
[StorageCleanup] ⚠️ Storage usage above 80%! Consider clearing all storage.
```

---

### Monitoramento Avançado (Desenvolvimento)

Para monitorar em tempo real durante desenvolvimento:

```javascript
// Console do navegador
import { monitorStorage } from './utils/storageCleanup';

// Inicia monitor a cada 5 segundos
const stopMonitoring = monitorStorage(5);

// Para parar:
stopMonitoring();
```

Output a cada 5 segundos:
```
[Storage Monitor] 234.12 KB / 5120 KB (4.6%)
```

---

### Uso Manual das Funções (Se Necessário)

#### Limpar storage manualmente
```javascript
import { cleanupStorage } from './utils/storageCleanup';
cleanupStorage();
```

#### Ver tamanho atual
```javascript
import { getLocalStorageSize } from './utils/storageCleanup';
const sizeKB = getLocalStorageSize();
console.log(`Storage: ${sizeKB.toFixed(2)} KB`);
```

#### Salvar com proteção automática
```javascript
import { safeStorageSet } from './utils/storageCleanup';

// Tenta salvar, se falhar por quota, limpa e tenta novamente
const success = safeStorageSet('myKey', 'myValue');
if (!success) {
  console.error('Failed to save even after cleanup');
}
```

---

### Problema: Supabase Token Muito Grande (Referência)

Se o token ainda for muito grande após limpeza, pode ser necessário:

**Verificar tamanho do token**:
```javascript
// Ver tamanho do localStorage
let totalSize = 0;
for (let key in localStorage) {
  if (localStorage.hasOwnProperty(key)) {
    const size = (localStorage[key].length + key.length) * 2; // 2 bytes por char
    console.log(`${key}: ${(size / 1024).toFixed(2)} KB`);
    totalSize += size;
  }
}
console.log(`Total: ${(totalSize / 1024).toFixed(2)} KB / ~5120 KB limit`);
```

Se `sb-...-auth-token` for > 500 KB, investigar:
- Custom claims no JWT
- Metadata excessivo no user object

### Otimização 3: Reduzir Dados no Store

Se você está salvando muito no localStorage via Zustand persist:

**Arquivo**: Stores com `persist`

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ANTES - Salva TUDO
export const useStore = create(
  persist(
    (set) => ({
      // ... todo o state
    }),
    { name: 'app-storage' }
  )
);

// DEPOIS - Salva apenas essencial
export const useStore = create(
  persist(
    (set) => ({
      // ... todo o state
    }),
    {
      name: 'app-storage',
      // Particionar: salvar apenas campos essenciais
      partialize: (state) => ({
        currentUser: state.currentUser,
        // NÃO salvar arrays grandes
        // users: state.users,  // ← Remover
        // messages: state.messages,  // ← Remover
      })
    }
  )
);
```

---

## 🧪 Como Testar

### Verificar se problema foi resolvido

1. **Limpar storage** (localStorage.clear())
2. **Recarregar página**
3. **Tentar fazer login**
4. **Verificar tamanho** do storage novamente

### Monitorar uso do Storage

**Console do navegador** (deixar rodando):
```javascript
// Monitor contínuo
setInterval(() => {
  let totalSize = 0;
  for (let key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      totalSize += (localStorage[key].length + key.length) * 2;
    }
  }
  const usedKB = (totalSize / 1024).toFixed(2);
  const limitKB = 5120; // ~5MB
  const percent = ((totalSize / 1024 / limitKB) * 100).toFixed(1);

  console.log(`[Storage Monitor] ${usedKB} KB / ${limitKB} KB (${percent}%)`);

  if (percent > 80) {
    console.warn('[Storage Monitor] ⚠️ Storage usage above 80%! Consider cleanup.');
  }
}, 5000); // A cada 5 segundos
```

---

## 🚨 AÇÃO IMEDIATA PARA O USUÁRIO

**PASSO A PASSO**:

1. **Abrir Console do Navegador**:
   ```
   Pressione F12
   ```

2. **Ir para aba "Console"**

3. **Colar e executar este comando**:
   ```javascript
   localStorage.clear();
   sessionStorage.clear();
   location.reload();
   ```

4. **Aguardar página recarregar**

5. **Tentar fazer login novamente**

---

## 📊 Por Que Isso Aconteceu?

Possíveis causas:

1. **Token JWT muito grande**:
   - Supabase inclui muitos dados na sessão
   - Custom claims extensos

2. **Múltiplas sessões acumuladas**:
   - Logins/logouts repetidos sem limpar
   - Storage nunca foi limpo

3. **Dados do Zustand persist**:
   - Stores salvando arrays grandes no localStorage
   - Mensagens, conversas, usuários sendo persistidos

4. **Cache de outros sistemas**:
   - Service Worker cache
   - Dados temporários de uploads

---

## ✅ Checklist de Correção

- [ ] Limpar localStorage/sessionStorage manualmente
- [ ] Fazer login novamente
- [ ] Verificar se erro sumiu
- [ ] Se erro persistir:
  - [ ] Limpar dados do site completo (via configurações do navegador)
  - [ ] Tentar em janela anônima
  - [ ] Tentar em outro navegador
- [ ] Implementar limpeza automática no código (dev)
- [ ] Reduzir dados salvos no persist (dev)

---

**Status**: ⚠️ CRÍTICO - Impede login
**Solução Rápida**: `localStorage.clear()` + reload
**Solução Permanente**: Implementar cleanup automático no código
