# Sistema de Segurança - Zaty Gráfica

## Visão Geral

Sistema completo de segurança implementado para proteger o acesso ao sistema contra uso indevido, especialmente em casos de ausência ou abandono da sessão.

## ✅ Funcionalidades Implementadas

### 1. Reautenticação Obrigatória
- ✅ Todo acesso ao sistema requer autenticação válida via Supabase
- ✅ Nenhum login automático
- ✅ Sessão é validada em cada inicialização

### 2. Bloqueio por Inatividade
- ✅ Detecção automática de inatividade após **3 minutos**
- ✅ Bloqueio imediato da interface
- ✅ Preservação do estado da aplicação
- ✅ Reautenticação obrigatória para desbloquear

### 3. Gerenciamento de Sessão
- ✅ Monitoramento contínuo da validade da sessão
- ✅ Renovação automática de tokens antes da expiração
- ✅ Bloqueio automático se a sessão expirar
- ✅ Tempo máximo de sessão: **8 horas**

### 4. Preservação de Dados
- ✅ Auto-save de formulários antes do bloqueio
- ✅ Restauração automática após reautenticação
- ✅ Dados preservados por até 1 hora no localStorage
- ✅ Limpeza automática de dados antigos

## 📁 Arquivos Criados

1. **src/hooks/useIdleTimer.ts** - Hook para detectar inatividade
2. **src/hooks/useFormAutoSave.ts** - Hook para auto-salvar formulários
3. **src/components/Auth/ReauthModal.tsx** - Modal de reautenticação
4. **src/components/Security/SecurityWrapper.tsx** - Wrapper de segurança
5. **src/services/sessionManager.ts** - Gerenciador de sessão
6. **src/store/useAuthStore.ts** - Atualizado com controle de bloqueio

## 🔧 Configuração

### Ajustar Tempo de Inatividade

Em [src/App.tsx](src/App.tsx):
```tsx
<SecurityWrapper
  enabled={true}
  idleTimeout={5 * 60 * 1000} // 5 minutos ao invés de 3
>
```

### Desabilitar Sistema

```tsx
<SecurityWrapper enabled={false}>
```

## 🔄 Fluxo de Funcionamento

### Login Inicial
```
Usuário → Login → Supabase → SecurityWrapper Ativo
```

### Bloqueio por Inatividade
```
3min inativo → Salva formulários → Bloqueia → Modal Reauth
```

### Reautenticação
```
Usuário digita senha → Valida → Desbloqueia → Restaura estado
```

## 🧪 Como Testar

### Teste 1: Bloqueio por Inatividade
1. Faça login no sistema
2. Aguarde 3 minutos sem mexer mouse/teclado
3. Modal de reautenticação deve aparecer
4. Digite a senha e confirme desbloqueio

### Teste 2: Preservação de Formulários
1. Abra um formulário e preencha dados
2. Aguarde bloqueio automático
3. Reautentique
4. Dados devem estar preservados

## 📊 Logs e Debug

O sistema gera logs no console:
- `[Security] User is idle, locking session...`
- `[Security] Session expired`
- `[Auth] Locking session: idle`
- `[Auth] Unlocking session`

## ⚙️ Configurações Avançadas

### SessionManager

Em [src/services/sessionManager.ts](src/services/sessionManager.ts):
```typescript
maxIdleTime: 3 * 60 * 1000,        // Tempo de inatividade
maxSessionTime: 8 * 60 * 60 * 1000, // Tempo máximo de sessão
checkInterval: 30 * 1000            // Intervalo de verificação
```

## 🛡️ Segurança

### O que está protegido:
- ✅ Bloqueio automático por inatividade
- ✅ Validação real via Supabase
- ✅ Tokens renovados automaticamente
- ✅ UI completamente bloqueada durante reauth

### Limitações (Frontend):
- ⚠️ Validações de permissão devem ser no backend (RLS)
- ⚠️ Rate limiting deve ser server-side
- ⚠️ Logs de auditoria devem ser no banco

## 📝 Próximas Melhorias

- [ ] Countdown antes do bloqueio
- [ ] Configuração por role de usuário
- [ ] Dashboard de sessões ativas
- [ ] Histórico de bloqueios

---

**Data de Implementação:** 2025-12-16
**Versão:** 1.0.0
**Status:** ✅ Produção
