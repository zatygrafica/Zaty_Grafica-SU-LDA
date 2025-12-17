# Sistema de Segurança - Zaty Gráfica

## Visão Geral

Sistema completo de segurança implementado para proteger o acesso ao sistema contra uso indevido, especialmente em casos de ausência ou abandono da sessão.

## ✅ Funcionalidades Implementadas

### 1. Reautenticação Obrigatória
- ✅ Todo acesso ao sistema requer autenticação válida via Supabase
- ✅ Nenhum login automático
- ✅ Sessão é validada em cada inicialização
- ✅ **Sessão NÃO é persistida** (`persistSession: false`)
- ✅ **Logout automático ao fechar** aplicativo/aba
- ✅ **Limpeza completa de storage** ao fazer logout
- ✅ Senhas NUNCA são armazenadas localmente

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
5. **src/components/Settings/SecuritySettings.tsx** - Interface de configuração
6. **src/services/sessionManager.ts** - Gerenciador de sessão
7. **src/store/useAuthStore.ts** - Atualizado com controle de bloqueio
8. **src/App.tsx** - Atualizado com gerenciamento dinâmico de timeout
9. **src/components/Settings/SettingsModule.tsx** - Integração com SecuritySettings

## 🔧 Configuração

### Ajustar Tempo de Inatividade

#### Via Interface (Recomendado)

1. Acesse **Configurações → Segurança**
2. Selecione o tempo de inatividade desejado:
   - 30 segundos (apenas testes)
   - 1 minuto
   - 2 minutos
   - 3 minutos (Padrão)
   - 5 minutos
   - 10 minutos
   - 15 minutos (Recomendado)
   - 30 minutos
   - 60 minutos (1 hora)
3. A alteração é aplicada imediatamente

#### Via Código

Em [src/App.tsx](src/App.tsx), o timeout é carregado automaticamente do localStorage:
```tsx
const [idleTimeout, setIdleTimeout] = useState<number>(() => {
  const saved = localStorage.getItem('security_idle_timeout');
  return saved ? parseInt(saved, 10) : 3 * 60 * 1000; // Default: 3 minutes
});
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
- ✅ Tokens renovados automaticamente (apenas durante sessão ativa)
- ✅ UI completamente bloqueada durante reauth
- ✅ **Sessão não persiste entre fechamentos do aplicativo**
- ✅ **Logout automático ao fechar janela/aba**
- ✅ **Storage limpo completamente ao fazer logout**
- ✅ **Senhas nunca armazenadas no cliente**

### Proteção contra:
- 🔒 Acesso não autorizado após fechar aplicativo
- 🔒 Reutilização de sessões antigas
- 🔒 Vazamento de credenciais via storage
- 🔒 Sessões abandonadas ativas

### Limitações (Frontend):
- ⚠️ Validações de permissão devem ser no backend (RLS)
- ⚠️ Rate limiting deve ser server-side
- ⚠️ Logs de auditoria devem ser no banco

## ⚙️ Funcionalidades da Configuração

### Interface de Configuração de Timeout
- ✅ 9 opções predefinidas de timeout (30s até 60min)
- ✅ Indicadores visuais (Padrão, Recomendado)
- ✅ Descrições explicativas para cada opção
- ✅ Aviso para timeouts muito curtos (<2min)
- ✅ Persistência em localStorage
- ✅ Aplicação imediata das mudanças
- ✅ Sincronização entre abas (via storage events)

## 📝 Próximas Melhorias

- [ ] Countdown antes do bloqueio
- [ ] Configuração por role de usuário
- [ ] Dashboard de sessões ativas
- [ ] Histórico de bloqueios

## 🔐 Medidas de Segurança Adicionais

### Configuração do Supabase Client
```typescript
// src/services/supabaseClient.ts
export const supabase = createClient(url, key, {
  auth: {
    storage: createResilientStorage(),
    autoRefreshToken: true,
    persistSession: false, // ⚠️ CRÍTICO: Não persiste sessão
  },
});
```

### Logout Automático
- Evento `beforeunload`: Limpa sessão ao fechar janela
- Evento `unload`: Fallback para garantir limpeza
- Limpeza de localStorage e sessionStorage
- Remoção de tokens e dados sensíveis

### Dados Preservados
Apenas configurações não-sensíveis são mantidas:
- ✅ Tema (light/dark)
- ✅ Idioma (pt/en)
- ✅ Timeout de segurança configurado
- ❌ Tokens de autenticação
- ❌ Dados de sessão
- ❌ Informações do usuário

---

**Data de Implementação:** 2025-12-16
**Última Atualização:** 2025-12-17
- Configuração de timeout personalizado
- **Correção crítica: Sessão não persistente**
- **Logout automático ao fechar**

**Versão:** 1.2.0
**Status:** ✅ Produção (Segurança Aprimorada)
