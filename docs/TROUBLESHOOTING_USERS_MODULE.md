# 🔧 Troubleshooting - Módulo de Usuários

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
