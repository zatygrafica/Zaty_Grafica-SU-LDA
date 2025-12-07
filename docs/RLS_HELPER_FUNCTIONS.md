# 🔐 RLS Helper Functions

## 📋 O que são Helper Functions?

Helper Functions são funções PostgreSQL que simplificam a verificação de permissões nas Row Level Security (RLS) policies. Elas fazem JOIN direto com a tabela `profiles` para obter informações do usuário autenticado.

## 🎯 Por que usar Helper Functions?

### ✅ Abordagem Atual: Helper Functions (Confiável)

```sql
CREATE POLICY example ON table
  USING (public.is_admin() OR created_by = auth.uid());
```

**Vantagens:**
- ✅ Funciona imediatamente sem configuração no dashboard
- ✅ Não depende de custom claims no JWT
- ✅ Mais confiável e previsível
- ✅ Fácil de debugar

---

## 🛠️ Helper Functions Disponíveis

### 1. `public.current_user_role()`
Retorna o role do usuário autenticado.

### 2. `public.is_admin()`
Verifica se o usuário é admin.

---

## 📝 Exemplos de Uso

```sql
-- Apenas admins
CREATE POLICY settings_admin_only ON public.settings
  FOR ALL
  USING (public.is_admin());

-- Admin ou dono
CREATE POLICY tasks_access ON public.tasks
  FOR ALL
  USING (public.is_admin() OR created_by = auth.uid());
```

---

## 🧹 O que foi removido

O custom access token hook foi **removido** por causar erros. As helper functions são mais confiáveis.

**No Dashboard:** Desabilite `Custom Access Token Hook` em Authentication → Hooks (se existir).

---

**Status:** ✅ Pronto para produção
**Abordagem:** Helper Functions (sem custom claims)
