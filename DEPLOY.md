# 🚀 Deploy Rápido na Vercel

## ⚡ Quick Start (3 passos)

### 1️⃣ Fazer Commit

```bash
git add .
git commit -m "Configure Vercel deployment"
git push origin main
```

### 2️⃣ Importar na Vercel

1. Acesse: https://vercel.com/new
2. Selecione seu repositório
3. Clique em **Deploy**

### 3️⃣ Configurar Variáveis de Ambiente

**Após primeiro deploy**, adicione suas credenciais do Supabase:

1. Dashboard da Vercel → Seu Projeto → **Settings** → **Environment Variables**
2. Adicionar:

```
VITE_SUPABASE_URL = https://[seu-projeto].supabase.co
VITE_SUPABASE_ANON_KEY = eyJhbGc... (sua anon key)
```

3. Selecionar: **Production**, **Preview**, **Development**
4. **Save**
5. **Deployments** → Latest → **Redeploy**

---

## 📋 Obter Credenciais do Supabase

1. Dashboard Supabase → **Settings** → **API**
2. Copiar:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public** key → `VITE_SUPABASE_ANON_KEY`

---

## ✅ Pronto!

Seu site estará em: `https://seu-projeto.vercel.app`

---

**Documentação completa**: [docs/VERCEL_DEPLOY_GUIDE.md](docs/VERCEL_DEPLOY_GUIDE.md)
