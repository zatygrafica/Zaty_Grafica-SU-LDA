# 🔧 Desenvolvimento Local com Supabase CLI

Guia completo para usar o Supabase CLI e desenvolver localmente.

---

## ✅ Configuração Completa

### Instalado:
- ✅ **Supabase CLI** v2.65.7
- ✅ **config.toml** configurado
- ✅ **Scripts npm** adicionados

---

## 🚀 Comandos Rápidos

### Iniciar Supabase Local

```bash
npm run supabase:start
```

Isso inicia todos os serviços do Supabase:
- **PostgreSQL** (porta 54322)
- **API** (porta 54321)
- **Studio** (porta 54323) - Interface visual
- **Inbucket** (porta 54324) - Email testing
- **Auth**
- **Storage**
- **Realtime**

**Primeira execução**: Pode demorar ~5 minutos para baixar imagens Docker

### Ver Status dos Serviços

```bash
npm run supabase:status
```

Mostra URLs e credenciais:
```
API URL: http://127.0.0.1:54321
DB URL: postgresql://postgres:postgres@127.0.0.1:54322/postgres
Studio URL: http://127.0.0.1:54323
...
```

### Parar Supabase Local

```bash
npm run supabase:stop
```

---

## 🔗 Conectar ao Projeto Remoto

### Link com Projeto no Supabase Cloud

```bash
npm run supabase:link
```

Você precisará:
1. **Project ID** (encontrar em: Dashboard → Settings → General)
2. **Database Password** (senha do projeto)

Após link, você pode sincronizar local ↔ remoto.

---

## 📊 Trabalhar com Migrations

### Criar Nova Migration

```bash
npm run supabase:migration nome_da_migration
```

Cria arquivo vazio em `supabase/migrations/[timestamp]_nome_da_migration.sql`

**Exemplo**:
```bash
npm run supabase:migration add_user_preferences
```

Edite o arquivo gerado e adicione SQL:
```sql
-- supabase/migrations/20251209123456_add_user_preferences.sql
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  theme VARCHAR(10) DEFAULT 'light',
  language VARCHAR(5) DEFAULT 'pt',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own preferences"
  ON public.user_preferences
  FOR SELECT
  USING (auth.uid() = user_id);
```

### Aplicar Migrations Localmente

```bash
npm run supabase:reset
```

Isso:
1. Derruba o banco local
2. Recria do zero
3. Aplica todas as migrations em ordem
4. Roda seed data (se configurado)

### Aplicar Migrations na Produção

```bash
npm run supabase:push
```

**⚠️ CUIDADO**: Isso aplica migrations no banco de produção!

Sempre:
1. Testar localmente primeiro (`npm run supabase:reset`)
2. Fazer backup do banco
3. Revisar SQL antes de push

---

## 🔄 Sincronizar Schema

### Puxar Schema do Produção

```bash
npm run supabase:pull
```

Gera migrations baseadas no schema remoto.

Útil quando:
- Alguém fez mudanças direto no Supabase Dashboard
- Você quer capturar estado atual da produção

---

## 📝 Gerar Types TypeScript

### Gerar Types do Schema Local

```bash
npm run supabase:types
```

Cria `src/types/supabase.ts` com types do seu schema.

**Exemplo de uso**:
```typescript
import { Database } from './types/supabase';

type Profile = Database['public']['Tables']['profiles']['Row'];
type NewProfile = Database['public']['Tables']['profiles']['Insert'];
```

---

## 🎯 Workflow Recomendado

### 1. Desenvolvimento de Nova Feature

```bash
# 1. Iniciar Supabase local
npm run supabase:start

# 2. Criar migration para nova feature
npm run supabase:migration add_notifications_table

# 3. Editar migration SQL
# Abrir: supabase/migrations/[timestamp]_add_notifications_table.sql

# 4. Aplicar migration localmente
npm run supabase:reset

# 5. Gerar types TypeScript
npm run supabase:types

# 6. Desenvolver feature usando types gerados
npm run dev

# 7. Testar tudo funciona localmente
# ...

# 8. Commit migration
git add supabase/migrations/
git commit -m "Add notifications table migration"

# 9. Deploy migration para produção
npm run supabase:push
```

### 2. Sincronizar com Produção

```bash
# Puxar schema do produção
npm run supabase:pull

# Verificar migrations geradas
git diff supabase/migrations/

# Se OK, commit
git add supabase/migrations/
git commit -m "Pull production schema changes"
```

---

## 🛠️ Acesso ao Studio Local

### Abrir Studio (Interface Visual)

Após `npm run supabase:start`, acesse:
```
http://localhost:54323
```

**No Studio você pode**:
- Ver e editar tabelas (Table Editor)
- Executar queries SQL (SQL Editor)
- Ver logs (Logs)
- Gerenciar Storage buckets
- Testar Auth
- Ver API docs auto-geradas

---

## 📧 Testar Emails Localmente

### Inbucket (Email Testing)

Acesse: http://localhost:54324

**Todos os emails** enviados pelo sistema local vão para Inbucket.

Útil para testar:
- Confirmação de email
- Reset de senha
- Notificações

---

## 🔑 Credenciais Locais

Após `npm run supabase:start`, você recebe:

```
API URL: http://127.0.0.1:54321
anon key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Para usar no código local**, crie `.env.local`:

```bash
# .env.local (NÃO COMMITAR!)
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 🐛 Troubleshooting

### Problema: `supabase start` falha

**Erro**: `Docker is not running`

**Solução**:
1. Instalar Docker Desktop
2. Iniciar Docker Desktop
3. Tentar novamente

---

### Problema: Porta já em uso

**Erro**: `Port 54321 is already in use`

**Solução**:
```bash
# Parar Supabase
npm run supabase:stop

# Verificar processos
npx supabase status

# Forçar parada
npx supabase stop --no-backup
```

---

### Problema: Migration falha

**Erro**: `ERROR: syntax error at or near "..."`

**Solução**:
1. Verificar SQL na migration
2. Testar SQL no Studio (SQL Editor)
3. Corrigir erro
4. `npm run supabase:reset` novamente

---

### Problema: Types não atualizam

**Solução**:
```bash
# Regenerar types
npm run supabase:types

# Se ainda não funciona, reset
npm run supabase:reset
npm run supabase:types
```

---

## 📁 Estrutura de Arquivos

```
supabase/
├── config.toml                    # Configuração do Supabase local
├── migrations/                    # Migrations SQL (versionadas no git)
│   ├── 20251120_create_profiles.sql
│   ├── 20251207_fix_critical_issues.sql
│   └── 20251209_cleanup_duplicates.sql
├── functions/                     # Edge Functions (Deno)
│   ├── _shared/                   # Código compartilhado
│   └── manage-users/              # Função exemplo
│       └── index.ts
└── seed.sql                       # Dados iniciais (opcional)
```

---

## 🔐 Segurança

### O que NÃO commitar

❌ `.env.local` - Credenciais locais
❌ `supabase/.temp/` - Arquivos temporários
❌ Senhas de produção

### O que commitar

✅ `supabase/config.toml` - Configuração (sem secrets)
✅ `supabase/migrations/` - Todas as migrations
✅ `supabase/functions/` - Edge functions
✅ `supabase/seed.sql` - Dados de teste (se não sensível)

---

## 📚 Recursos Úteis

- [Supabase CLI Docs](https://supabase.com/docs/guides/cli)
- [Local Development Guide](https://supabase.com/docs/guides/local-development)
- [Migrations Guide](https://supabase.com/docs/guides/cli/migrations)
- [TypeScript Types](https://supabase.com/docs/guides/api/rest/generating-types)

---

## 🎯 Comandos Todos Disponíveis

| Comando | Descrição |
|---------|-----------|
| `npm run supabase:start` | Inicia todos os serviços locais |
| `npm run supabase:stop` | Para todos os serviços |
| `npm run supabase:status` | Mostra URLs e credenciais |
| `npm run supabase:reset` | Reseta banco e reaplica migrations |
| `npm run supabase:link` | Conecta com projeto remoto |
| `npm run supabase:push` | Aplica migrations na produção |
| `npm run supabase:pull` | Puxa schema da produção |
| `npm run supabase:types` | Gera types TypeScript |
| `npm run supabase:migration` | Cria nova migration |

---

**Criado**: 2025-12-09
**Supabase CLI**: v2.65.7
**Status**: ✅ Configurado e pronto para uso
