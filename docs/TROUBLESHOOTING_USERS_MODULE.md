# 🔧 Troubleshooting - Módulo de Usuários

## Erro: "Internal server error"

### Causa Raiz
A Edge Function `manage-users` está falhando internamente. Possíveis causas:
- RLS policies bloqueando acesso à tabela `profiles`
- Colunas faltando na tabela `profiles`
- Service role key não configurada
- Erro de permissão no banco de dados

### Como Diagnosticar

**1. Verificar Logs no Dashboard do Supabase:**

```
1. Acesse https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em Edge Functions → manage-users
4. Clique na aba "Logs"
5. Procure por mensagens com prefixo [manage-users]
```

**Mensagens de log possíveis:**
- `[manage-users] List error:` → Erro ao buscar profiles (veja detalhes)
- `[manage-users] No data returned` → Tabela vazia ou RLS bloqueando
- `[manage-users] Successfully fetched X profiles` → Funcionando!

**2. Verificar RLS Policies:**

Se os logs mostrarem erro de permissão, verifique as policies:

```sql
-- Verificar se RLS está habilitado
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'profiles';

-- Listar policies existentes
SELECT * FROM pg_policies WHERE tablename = 'profiles';
```

**3. Verificar Service Role Key:**

No Dashboard do Supabase:
```
Settings → API → Service Role Key (secret)
```

Esta chave deve estar configurada no ambiente da Edge Function.

### Soluções

**Se o problema for RLS:**
A Edge Function usa `service_role_key` que bypassa RLS, mas verifique se está configurado corretamente.

**Se o problema for colunas faltando:**
Execute a migração mais recente:
```bash
supabase db push
```

**Se persistir:**
Reimplante a função:
```bash
supabase functions deploy manage-users --no-verify-jwt
```

---

## Erro: "Failed to fetch - Network error or CORS issue"

### Causa Raiz
A Edge Function `manage-users` não está acessível ou há problemas de conectividade.

### Soluções

#### 1. Verificar se a Edge Function está implantada

```bash
supabase functions list
```

**Esperado:** Você deve ver `manage-users` na lista com STATUS `ACTIVE`

**Se não estiver na lista:**
```bash
supabase functions deploy manage-users --no-verify-jwt
```

#### 2. Verificar configuração do `.env.local`

Certifique-se de que o arquivo `.env.local` existe na raiz do projeto com:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon
```

**Como obter as credenciais:**
1. Acesse https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em Settings → API
4. Copie a "Project URL" e "anon public" key

#### 3. Verificar permissões de Admin

A função `manage-users` requer que o usuário tenha role `admin`.

**Verifique no banco:**
```sql
SELECT id, email, role FROM profiles WHERE email = 'seu@email.com';
```

**Se o role não for 'admin', atualize:**
```sql
UPDATE profiles SET role = 'admin' WHERE email = 'seu@email.com';
```

#### 4. Verificar logs no Console do Navegador

Abra DevTools (F12) → Console e filtre por `[UserStore]`

Você verá mensagens detalhadas como:
- `[UserStore] Calling manage-users function: list`
- `[UserStore] Network error - Failed to connect to Edge Function`
- `[UserStore] Edge Function not found (404)`

Isso ajudará a identificar o problema exato.

#### 5. Testar conectividade diretamente

Teste se consegue acessar a URL da função:

```bash
curl -X POST https://hvnfoaewvrabyxaktjlf.supabase.co/functions/v1/manage-users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -d '{"action":"list"}'
```

Se retornar 401/403 é problema de autenticação. Se retornar 404 é problema de deploy.

### Otimizações Implementadas

✅ **Retry automático** com exponential backoff (3 tentativas para erros 500+)
✅ **Logs detalhados** com prefixo `[UserStore]` para debug
✅ **Cache inteligente** - não faz chamadas duplicadas
✅ **Loading skeletons** - UX melhorada durante carregamento
✅ **Avatar loading otimizado** - carrega em lotes de 5

### Mensagens de Erro e Significados

| Erro | Causa | Solução |
|------|-------|---------|
| `Supabase URL is not configured` | Falta `.env.local` | Crie o arquivo com as credenciais |
| `Authentication error` | Token inválido/expirado | Faça logout e login novamente |
| `Unauthorized (401)` | Token inválido | Faça logout e login novamente |
| `Forbidden (403)` | Usuário não é admin | Atualize role para 'admin' no banco |
| `Edge Function not found (404)` | Função não implantada | Execute `supabase functions deploy manage-users` |
| `Server error (500+)` | Erro interno do servidor | Verifique logs no Dashboard Supabase |
| `Network error or CORS` | Sem conexão ou CORS incorreto | Verifique internet e implantação da função |

### Verificação Final

Após aplicar as soluções, recarregue a página e:

1. Abra o Console (F12)
2. Vá para o módulo de Usuários
3. Deve ver: `[UserStore] Successfully loaded X users`

Se ainda houver problemas, capture os logs do console e relate no GitHub.
