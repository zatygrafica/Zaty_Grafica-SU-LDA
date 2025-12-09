# 🚀 Guia de Deploy na Vercel - Zaty Gráfica

## 📋 Pré-requisitos

Antes de fazer o deploy, certifique-se de ter:

- ✅ Conta na Vercel (gratuita): https://vercel.com/signup
- ✅ Repositório Git (GitHub, GitLab ou Bitbucket)
- ✅ Variáveis de ambiente do Supabase (URL e Anon Key)
- ✅ Build local funcionando (`npm run build` sem erros)

---

## 🔐 IMPORTANTE: Segurança das Variáveis de Ambiente

### ⚠️ NUNCA faça commit de:
- `.env`
- `.env.local`
- Qualquer arquivo com credenciais reais

### ✅ O que está protegido:
- `.env.local` está no `.gitignore` ✅
- `.vercel` está no `.gitignore` ✅
- `.env.example` é seguro (apenas placeholders) ✅

---

## 📝 Passo a Passo: Deploy na Vercel

### **Método 1: Deploy via Dashboard da Vercel (Recomendado)**

#### 1. Fazer Commit e Push do Código

```bash
# Adicionar arquivos novos
git add vercel.json .gitignore docs/VERCEL_DEPLOY_GUIDE.md

# Criar commit
git commit -m "Configure Vercel deployment

- Add vercel.json with SPA routing and security headers
- Update .gitignore to exclude .vercel directory
- Add deployment documentation"

# Push para repositório (GitHub, GitLab, etc.)
git push origin main
```

#### 2. Importar Projeto na Vercel

1. **Acessar** https://vercel.com/dashboard
2. **Clicar** em "Add New..." → "Project"
3. **Importar** seu repositório Git
4. **Configurar projeto**:

   **Framework Preset**: Vite

   **Build Command**: `npm run build` (detectado automaticamente)

   **Output Directory**: `dist` (detectado automaticamente)

   **Install Command**: `npm install` (detectado automaticamente)

#### 3. Configurar Variáveis de Ambiente

**CRÍTICO**: Adicione suas variáveis de ambiente do Supabase:

1. Na página de configuração do projeto, ir para **"Environment Variables"**
2. Adicionar cada variável:

   | Name | Value | Environment |
   |------|-------|-------------|
   | `VITE_SUPABASE_URL` | `https://[seu-projeto].supabase.co` | Production, Preview, Development |
   | `VITE_SUPABASE_ANON_KEY` | `eyJhbGc...` (sua anon key) | Production, Preview, Development |

   **Como obter suas credenciais do Supabase**:
   - Dashboard do Supabase → Settings → API
   - **Project URL** = `VITE_SUPABASE_URL`
   - **anon public** key = `VITE_SUPABASE_ANON_KEY`

3. **Salvar** as variáveis

#### 4. Deploy!

1. **Clicar** em "Deploy"
2. **Aguardar** build (leva ~2-3 minutos)
3. **Verificar** logs de build
4. **Acessar** URL gerada (ex: `your-project.vercel.app`)

---

### **Método 2: Deploy via CLI da Vercel**

#### 1. Instalar Vercel CLI

```bash
npm install -g vercel
```

#### 2. Fazer Login

```bash
vercel login
```

Escolha seu método de autenticação (GitHub, GitLab, email, etc.)

#### 3. Deploy

```bash
# Na raiz do projeto
vercel

# Responder perguntas:
# Set up and deploy? → Y
# Which scope? → Selecione sua conta
# Link to existing project? → N (primeira vez) ou Y (deploy subsequente)
# What's your project's name? → zaty-grafica-gest
# In which directory is your code located? → ./
# Want to override the settings? → N
```

#### 4. Configurar Variáveis de Ambiente

```bash
# Adicionar variáveis
vercel env add VITE_SUPABASE_URL
# Cole o valor quando solicitado
# Selecione: Production, Preview, Development

vercel env add VITE_SUPABASE_ANON_KEY
# Cole o valor quando solicitado
# Selecione: Production, Preview, Development
```

#### 5. Deploy em Produção

```bash
vercel --prod
```

---

## 🔍 Verificar Deploy

### 1. Testar Site

Após deploy, acesse a URL e verifique:

- [ ] Site carrega corretamente
- [ ] Imagens e assets carregam
- [ ] PWA instala (ícone de instalação aparece)
- [ ] **Login funciona** (importante!)
- [ ] Navegação entre páginas funciona (SPA routing)

### 2. Verificar Console do Navegador

Abrir DevTools (F12) e verificar:

```javascript
// Deve aparecer ao carregar:
[StorageCleanup] Cleaned up X keys, freed Y KB
[StorageCleanup] Storage usage: X KB / ~5120 KB limit
```

- [ ] Sem erros no console
- [ ] Variáveis de ambiente carregadas corretamente

### 3. Testar Login

**Como admin**:
- [ ] Login funciona
- [ ] Dashboard carrega
- [ ] Módulos principais funcionam

**Como usuário simples**:
- [ ] Login funciona (sem mensagem de cache cheio)
- [ ] Chat carrega
- [ ] Perfis aparecem corretamente (não UUID)

---

## ⚙️ Configurações de Segurança Aplicadas

O arquivo `vercel.json` já inclui:

### 1. **Roteamento SPA**
```json
"rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
```
Todas as rotas são direcionadas para index.html (necessário para React Router)

### 2. **Cache de Assets**
```json
"Cache-Control": "public, max-age=31536000, immutable"
```
Assets são cacheados por 1 ano (performance)

### 3. **Headers de Segurança**
- `X-Content-Type-Options: nosniff` - Previne MIME sniffing
- `X-Frame-Options: DENY` - Previne clickjacking
- `X-XSS-Protection: 1; mode=block` - Proteção XSS
- `Referrer-Policy: strict-origin-when-cross-origin` - Controla referrer

---

## 🔄 Deploys Futuros (Automático)

Após configuração inicial, **cada push** para o branch principal dispara deploy automático:

```bash
# Fazer mudanças no código
git add .
git commit -m "Update feature X"
git push origin main

# Vercel detecta push e faz deploy automaticamente!
```

**Ver status do deploy**:
- Dashboard da Vercel → Deployments
- Ou receber notificação por email

---

## 🌍 Domínio Personalizado (Opcional)

### Adicionar seu próprio domínio

1. **Vercel Dashboard** → Projeto → Settings → Domains
2. **Add Domain** → Digite seu domínio
3. **Configurar DNS**:
   - Se domínio está em provedor externo (GoDaddy, Namecheap, etc.):
     - Adicionar registro CNAME: `www` → `cname.vercel-dns.com`
     - Adicionar registro A: `@` → `76.76.21.21`
   - Ou usar nameservers da Vercel (recomendado)
4. **Aguardar** propagação DNS (pode levar até 48h, geralmente minutos)
5. **SSL automático** configurado pela Vercel

---

## 🐛 Troubleshooting

### Problema: Build falha

**Erro**: `Module not found` ou `Cannot find module`

**Solução**:
```bash
# Limpar e reinstalar dependências
rm -rf node_modules package-lock.json
npm install
npm run build

# Se funcionar localmente, push novamente
git add package-lock.json
git commit -m "Update dependencies"
git push
```

### Problema: Site carrega mas login falha

**Causa**: Variáveis de ambiente não configuradas ou incorretas

**Solução**:
1. Vercel Dashboard → Projeto → Settings → Environment Variables
2. Verificar `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`
3. Editar se necessário
4. **Redeploy**: Deployments → Latest → três pontos → Redeploy

### Problema: Rota direta não funciona (404)

**Exemplo**: `your-app.vercel.app/dashboard` dá 404

**Causa**: SPA routing não configurado (raro com vercel.json correto)

**Solução**:
- Verificar se `vercel.json` foi commitado e deployed
- Se necessário, adicionar `_redirects` file:
  ```
  /*    /index.html   200
  ```

### Problema: Assets não carregam (CORS)

**Causa**: Supabase Storage não permite domínio da Vercel

**Solução**:
1. Supabase Dashboard → Storage → Configuration
2. Adicionar domínio da Vercel à lista de origens permitidas:
   - `https://your-project.vercel.app`
   - `https://your-custom-domain.com`

---

## 📊 Monitoramento

### Analytics da Vercel (Grátis)

Habilitar analytics:
1. Dashboard → Projeto → Analytics
2. Ver métricas:
   - Page views
   - Unique visitors
   - Top pages
   - Performance (Core Web Vitals)

### Logs em Tempo Real

Ver logs de aplicação:
```bash
vercel logs [deployment-url] --follow
```

Ou no Dashboard → Deployments → Ver logs

---

## 🔒 Checklist de Segurança Final

Antes de compartilhar URL em produção:

- [ ] Variáveis de ambiente configuradas
- [ ] `.env.local` NÃO está no repositório
- [ ] Headers de segurança ativas (verificar com https://securityheaders.com)
- [ ] HTTPS habilitado (automático na Vercel)
- [ ] Testar todas as funcionalidades críticas
- [ ] Verificar RLS do Supabase ativo
- [ ] Backup do banco de dados feito

---

## 📚 Recursos Úteis

- [Documentação Vercel](https://vercel.com/docs)
- [Vite + Vercel Guide](https://vercel.com/guides/deploying-vite-with-vercel)
- [Supabase + Vercel](https://supabase.com/docs/guides/getting-started/tutorials/with-vercel)
- [Custom Domains](https://vercel.com/docs/concepts/projects/custom-domains)

---

## 🎉 Pronto!

Seu sistema agora está em produção na Vercel com:
- ✅ Deploy automático a cada push
- ✅ HTTPS configurado
- ✅ Cache otimizado
- ✅ Headers de segurança
- ✅ SPA routing funcionando
- ✅ PWA instalável

**URL de exemplo**: `https://zaty-grafica-gest.vercel.app`

---

**Criado**: 2025-12-09
**Última atualização**: 2025-12-09
**Status**: ✅ Pronto para deploy
