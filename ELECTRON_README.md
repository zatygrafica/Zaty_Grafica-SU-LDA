# Zaty Gráfica - Aplicativo Desktop

Este projeto agora suporta geração de aplicativo desktop usando Electron!

## 🚀 Comandos Disponíveis

### Desenvolvimento Web (como antes)
```bash
npm run dev
# Abre no navegador em http://localhost:5173
```

### Desenvolvimento Desktop
```bash
npm run electron:dev
# Abre o aplicativo em janela nativa do Electron
# Conecta ao servidor Vite em localhost:5173
# DevTools aberto automaticamente
```

### Build para Produção

#### Build apenas web (dist/)
```bash
npm run build
```

#### Build aplicativo Windows (.exe)
```bash
npm run electron:build:win
```
Gera: `release/Zaty Gráfica-Setup-1.0.0.exe`

#### Build para todas as plataformas
```bash
npm run electron:build
```

## 📦 Estrutura de Arquivos

```
.
├── electron-main/
│   ├── main.cjs         # Processo principal do Electron
│   └── preload.cjs      # Script de segurança (ponte Electron ↔ React)
├── electron-builder.json # Configuração do empacotamento
├── dist/                # Build do Vite (gerado por npm run build)
└── release/             # Aplicativos .exe gerados (criado automaticamente)
```

**Nota**: A pasta foi renomeada de `electron/` para `electron-main/` para evitar conflitos de módulo com o pacote npm `electron`.

## ⚙️ Como Funciona

### Modo Desenvolvimento
1. Execute `npm run dev` para iniciar Vite
2. Em outro terminal, execute `npm run electron:dev`
3. O Electron abre uma janela carregando `http://localhost:5173`

### Modo Produção
1. `npm run build` compila React → `dist/`
2. `electron-builder` empacota `dist/` + Electron → `.exe`
3. Resultado: Instalador standalone em `release/`

## 🔄 Auto-Update

O aplicativo verifica atualizações automaticamente ao iniciar:

1. Checa novas versões no GitHub Releases
2. Notifica usuário se houver atualização
3. Baixa em segundo plano
4. Instala no próximo reinício

### Como publicar atualizações:

```bash
# 1. Aumentar versão
npm version patch  # 1.0.0 → 1.0.1

# 2. Gerar novo .exe
npm run electron:build:win

# 3. Fazer upload no GitHub Releases
# (Ou configurar publish automático no electron-builder.json)
```

## 🎨 Ícone do Aplicativo

O ícone está em `public/logo.png`. Para melhor resultado:
- Tamanho recomendado: 512x512px ou 1024x1024px
- Formato: PNG com transparência

O electron-builder converte automaticamente para os formatos necessários (.ico, .icns, etc).

## 📱 Recursos Nativos Disponíveis

O aplicativo desktop tem acesso a APIs nativas via `window.electronAPI`:

```javascript
// Obter versão do app
const version = await window.electronAPI.getAppVersion();

// Verificar atualizações manualmente
await window.electronAPI.checkForUpdates();

// Detectar se está rodando no Electron
if (window.electronAPI?.isElectron) {
  console.log('Rodando no Electron!');
}
```

## 🔒 Segurança

- ✅ `nodeIntegration: false` - Sem acesso direto ao Node.js no renderer
- ✅ `contextIsolation: true` - Contextos isolados
- ✅ `preload.js` - Ponte segura entre Electron e React
- ✅ Apenas APIs específicas expostas via `contextBridge`

## 📊 Diferenças Web vs Desktop

| Recurso | Web (navegador) | Desktop (Electron) |
|---------|-----------------|-------------------|
| Interface | Idêntica | Idêntica |
| Supabase | ✅ Funciona | ✅ Funciona |
| Offline | ❌ Não | ⚠️ Parcial* |
| Notificações | ⚠️ Limitado | ✅ Nativas |
| Impressão | ⚠️ Básico | ✅ Avançado |
| Auto-update | ❌ Não | ✅ Sim |
| Instalação | ❌ Não | ✅ Instalador |

*Offline: App funciona, mas precisa internet para Supabase

## 🐛 Troubleshooting

### Erro: "Cannot find module 'electron'"
```bash
npm install
```

### DevTools não abre
Edite `electron/main.js`, linha com `openDevTools()`:
```javascript
mainWindow.webContents.openDevTools();  // Descomentar
```

### Build falha no Windows
1. Verifique se tem permissões de administrador
2. Desabilite antivírus temporariamente (pode bloquear electron-builder)
3. Limpe cache: `npm run electron:build:win -- --clean`

### Tamanho do .exe muito grande (~150MB)
Isso é normal! Electron inclui Chromium completo. Para reduzir:
- Use `7zip` para comprimir o instalador
- Considere `asar` packing (já habilitado por padrão)

## 📦 Distribuição

### Opção 1: Manual
1. Gere o `.exe`: `npm run electron:build:win`
2. Envie `release/Zaty Gráfica-Setup-1.0.0.exe` para usuários
3. Usuários executam e instalam

### Opção 2: GitHub Releases (Auto-Update)
1. Configure `publish` no `electron-builder.json`
2. Faça push com tag: `git tag v1.0.1 && git push --tags`
3. GitHub Actions pode buildar automaticamente
4. Apps instalados detectam e baixam atualizações

### Opção 3: Site/Drive
1. Hospede o `.exe` em Google Drive, Dropbox, ou seu site
2. Compartilhe link de download
3. Sem auto-update (usuários baixam manualmente)

## 🎯 Próximos Passos

1. ✅ Testar aplicativo: `npm run electron:dev`
2. ✅ Gerar primeiro .exe: `npm run electron:build:win`
3. ⬜ Personalizar ícone (substituir `public/logo.png`)
4. ⬜ Configurar GitHub Releases para auto-update
5. ⬜ Distribuir para usuários

## 💡 Dicas

- **Sempre teste** com `electron:dev` antes de buildar
- **Versão** do app está em `package.json`
- **Logs** do Electron aparecem no terminal (não no DevTools)
- **Cache** do Electron pode causar problemas: delete `node_modules/.cache`

## 📞 Suporte

Para problemas com Electron:
- Documentação: https://www.electronjs.org/docs
- electron-builder: https://www.electron.build

Para problemas com o app (React/Supabase):
- Verifique console do navegador (F12)
- Logs do Electron: verifique terminal

---

**Desenvolvido por:** Zaty Gráfica, SU, LDA
**Powered by:** React + Vite + Electron + Supabase
