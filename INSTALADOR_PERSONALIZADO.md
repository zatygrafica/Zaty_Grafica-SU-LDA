# Instalador Personalizado - Zaty Gráfica

Este documento explica como os elementos visuais do instalador são configurados e como atualizá-los.

## 📁 Estrutura de Arquivos

```
project/
├── build/
│   ├── icon.ico                    # Ícone da aplicação (gerado automaticamente)
│   └── installer/
│       ├── header.bmp              # Cabeçalho do instalador (150x57px)
│       ├── welcome.bmp             # Banner lateral (164x314px)
│       ├── sidebar.bmp             # Cópia de welcome.bmp
│       ├── LICENSE.txt             # Termos de Uso e Política de Privacidade
│       └── installer.nsh           # Script customizado NSIS
│
├── public/
│   └── logo.png                    # Logo da empresa (fonte para icon.ico)
│
├── D:/IMAGEM PROJETO/              # Pasta com imagens personalizadas
│   ├── header.png                  # Cabeçalho customizado
│   ├── sidebar.png                 # Banner lateral customizado
│   └── welcome.png                 # Banner lateral alternativo
│
└── scripts/
    ├── generate-icon.cjs           # Gera icon.ico a partir do logo.png
    └── convert-to-nsis-bmp.cjs     # Converte PNGs para BMP 24-bit
```

## 🎨 Elementos Visuais

### 1. Ícone da Aplicação (icon.ico)

**Especificações:**
- Formato: .ICO (ícone do Windows)
- Tamanhos incluídos: 16x16, 32x32, 48x48, 64x64, 128x128, 256x256 pixels
- Gerado automaticamente a partir de `public/logo.png`

**Onde aparece:**
- Janela do instalador
- Atalho na área de trabalho
- Menu Iniciar
- Barra de tarefas quando o app está rodando
- Lista de Programas instalados

**Como atualizar:**
1. Substituir o arquivo `public/logo.png` com o novo logo
2. Executar: `npm run installer:icon`

### 2. Cabeçalho do Instalador (header.bmp)

**Especificações:**
- Formato: BMP 24-bit
- Dimensões: 150 x 57 pixels
- Aparece no topo de cada página do instalador

**Como atualizar:**
1. Colocar nova imagem em `D:/IMAGEM PROJETO/header.png`
2. Executar: `npm run installer:images`

### 3. Banner Lateral (welcome.bmp / sidebar.bmp)

**Especificações:**
- Formato: BMP 24-bit
- Dimensões: 164 x 314 pixels
- Aparece no lado esquerdo do instalador

**Como atualizar:**
1. Colocar nova imagem em `D:/IMAGEM PROJETO/sidebar.png` ou `welcome.png`
2. Executar: `npm run installer:images`

## 🔧 Comandos Disponíveis

### Gerar apenas o ícone:
```bash
npm run installer:icon
```

### Converter apenas as imagens BMP:
```bash
npm run installer:images
```

### Gerar todos os assets do instalador:
```bash
npm run installer:assets
```

### Construir instalador completo (gera assets + build):
```bash
npm run electron:build:win
```

## ⚙️ Configuração do electron-builder

O arquivo `electron-builder.json` contém as configurações do instalador:

```json
{
  "win": {
    "icon": "build/icon.ico"           // Ícone principal
  },
  "nsis": {
    "installerIcon": "build/icon.ico",           // Ícone do instalador
    "uninstallerIcon": "build/icon.ico",         // Ícone do desinstalador
    "installerHeader": "build/installer/header.bmp",     // Cabeçalho
    "installerSidebar": "build/installer/welcome.bmp",   // Banner lateral
    "license": "build/installer/LICENSE.txt"             // Termos de Uso
  }
}
```

## 📝 Termos de Uso e Política de Privacidade

O arquivo `build/installer/LICENSE.txt` contém:
- Termos de Uso do Software
- Política de Privacidade
- Limitações de Responsabilidade
- Informações de Contato

**Importante:** O usuário DEVE aceitar estes termos para prosseguir com a instalação.

## 🎯 Checklist de Personalização

Ao criar um instalador personalizado, verifique:

- [ ] Logo da empresa em `public/logo.png`
- [ ] Cabeçalho personalizado em `D:/IMAGEM PROJETO/header.png`
- [ ] Banner lateral em `D:/IMAGEM PROJETO/sidebar.png`
- [ ] Termos de Uso atualizados em `build/installer/LICENSE.txt`
- [ ] Informações da empresa em `electron-builder.json`:
  - [ ] `appId`
  - [ ] `productName`
  - [ ] `copyright`
  - [ ] `author`
- [ ] Executar `npm run installer:assets` para gerar todos os arquivos
- [ ] Testar o instalador: `npm run electron:build:win`

## 🔍 Troubleshooting

### Problema: Imagens não aparecem no instalador

**Causas possíveis:**
1. Formato incorreto (deve ser BMP 24-bit)
2. Dimensões erradas
3. Arquivos não encontrados durante o build

**Solução:**
```bash
# Regenerar todas as imagens
npm run installer:assets

# Verificar se os arquivos foram criados
ls -la build/icon.ico build/installer/*.bmp

# Rebuild do instalador
npm run electron:build:win
```

### Problema: Ícone padrão do React aparece

**Causa:** O icon.ico não foi gerado corretamente

**Solução:**
```bash
# Verificar se o logo.png existe
ls -la public/logo.png

# Regenerar o ícone
npm run installer:icon

# Verificar o ícone criado
ls -la build/icon.ico
```

### Problema: Banner/Header cortado ou distorcido

**Causa:** Dimensões da imagem de origem não correspondem às dimensões esperadas

**Solução:**
- O script `convert-to-nsis-bmp.cjs` usa `fit: 'cover'` que pode cortar a imagem
- Para melhor resultado, prepare as imagens nas dimensões exatas:
  - Header: 150 x 57 pixels
  - Banner: 164 x 314 pixels

## 📚 Referências

- [NSIS Documentation](https://nsis.sourceforge.io/Docs/)
- [electron-builder NSIS Options](https://www.electron.build/configuration/nsis)
- [Windows Icon Guidelines](https://docs.microsoft.com/en-us/windows/apps/design/style/iconography/app-icon-design)

## 🚀 Processo Completo de Build

1. **Preparar imagens personalizadas:**
   - Colocar logo em `public/logo.png`
   - Colocar header em `D:/IMAGEM PROJETO/header.png`
   - Colocar sidebar em `D:/IMAGEM PROJETO/sidebar.png`

2. **Gerar assets:**
   ```bash
   npm run installer:assets
   ```

3. **Build da aplicação React:**
   ```bash
   npm run build
   ```

4. **Gerar instalador:**
   ```bash
   npm run electron:build:win
   ```

5. **Localizar instalador:**
   ```
   release/Zaty Grafica-Setup-1.0.0.exe
   ```

6. **Testar instalação:**
   - Execute o .exe
   - Verifique se todos os elementos visuais aparecem
   - Confirme que o ícone está correto
   - Teste a funcionalidade do aplicativo

---

**Última atualização:** 24 de dezembro de 2025
**Versão:** 1.0.0
