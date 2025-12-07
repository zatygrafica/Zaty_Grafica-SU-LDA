# 🔒 Guia de Segurança - Zaty Gráfica

## ⚠️ AÇÃO URGENTE NECESSÁRIA

### 1. Rotacionar Credenciais do Supabase

As credenciais do Supabase foram expostas no histórico do Git e **DEVEM** ser rotacionadas imediatamente:

#### Passos para Rotacionar:

1. **Acesse o Supabase Dashboard:**
   - Vá para: https://app.supabase.com
   - Selecione o projeto: `hvnfoaewvrabyxaktjlf`

2. **Regenerar Anon Key:**
   - Navegue para: `Settings` → `API`
   - Clique em `Reset` ao lado de "anon/public key"
   - **IMPORTANTE:** Copie a nova chave antes de confirmar

3. **Atualizar .env.local:**
   ```bash
   # Copie o arquivo de exemplo
   cp .env.example .env.local

   # Edite e adicione as NOVAS credenciais
   nano .env.local
   ```

4. **Verificar que .env.local está em .gitignore:**
   ```bash
   # Este comando NÃO deve retornar nada
   git check-ignore .env.local
   # Deve retornar: .env.local
   ```

### 2. Limpar Histórico do Git (Opcional mas Recomendado)

Para remover completamente as credenciais do histórico:

```bash
# ATENÇÃO: Isso reescreve o histórico do Git
# Coordene com a equipe antes de executar

# Opção 1: Usando git filter-repo (recomendado)
git filter-repo --path .env.local --invert-paths

# Opção 2: Usando BFG Repo-Cleaner
bfg --delete-files .env.local

# Após qualquer opção, force push
git push origin --force --all
```

### 3. Configuração Segura de Variáveis de Ambiente

#### Para Desenvolvimento Local:
- Use `.env.local` (nunca commite!)
- Copie de `.env.example`

#### Para Produção (Netlify):
1. Acesse o Netlify Dashboard
2. Vá para: `Site settings` → `Environment variables`
3. Adicione as variáveis:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

## 🛡️ Políticas de Segurança

### Nunca Commitar:
- ❌ `.env`
- ❌ `.env.local`
- ❌ `.env.production`
- ❌ Qualquer arquivo com credenciais

### Sempre Usar:
- ✅ `.env.example` como template
- ✅ Variáveis de ambiente para credenciais
- ✅ `.gitignore` para arquivos sensíveis

## 📞 Contato

Se você identificou uma vulnerabilidade de segurança, **NÃO** abra uma issue pública.
Entre em contato diretamente com a equipe de desenvolvimento.

---

**Data de criação:** 2025-12-07
**Status:** 🔴 Credenciais expostas - AÇÃO NECESSÁRIA
