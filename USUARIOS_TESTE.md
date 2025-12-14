# Usuários de Teste

Este documento lista os usuários de teste disponíveis no ambiente de desenvolvimento local.

## 🔐 Credenciais

### Administrador
- **Email:** `admin@test.com`
- **Senha:** `123456`
- **Permissões:** Todas (17 permissões)
  - clients, orders, invoices, payments, materials, services
  - employees, purchases, tasks, notes, documents, settings
  - financial, reports, chat, users, audit

### Usuário Comum
- **Email:** `user@test.com`
- **Senha:** `123456`
- **Permissões:** Limitadas (6 permissões)
  - clients, orders, services, tasks, notes, chat

## 🚀 Como usar

1. Certifique-se de que o Supabase local está rodando:
   ```bash
   npx supabase start
   ```

2. Aplique as migrations (se ainda não aplicou):
   ```bash
   npx supabase db reset
   ```

3. Acesse a aplicação:
   ```bash
   npm run dev
   ```

4. Faça login com uma das credenciais acima

## 🔄 Resetar usuários

Se precisar resetar os usuários de teste, execute:

```bash
npx supabase db reset
```

Isso vai recriar todos os usuários com as credenciais padrão.

## 📝 Notas

- Os usuários são criados automaticamente pela migration `20251214172129_create_test_users.sql`
- Os perfis são criados com as permissões corretas
- As senhas são criptografadas usando bcrypt
- Os usuários são confirmados automaticamente (email_confirmed_at)

## ⚠️ IMPORTANTE

**NUNCA use essas credenciais em produção!**

Esses usuários são APENAS para desenvolvimento local. Em produção, use credenciais seguras e únicas.
