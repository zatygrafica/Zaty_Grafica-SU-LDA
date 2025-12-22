# Instalador Profissional - Zaty Gráfica

## 📦 Sobre o Instalador

O instalador do Sistema de Gestão Zaty Gráfica foi desenvolvido com recursos profissionais de nível empresarial, incluindo:

- ✅ Identidade visual corporativa da Zaty Gráfica
- ✅ Termos de Uso e Política de Privacidade completos
- ✅ Aceitação obrigatória dos termos legais
- ✅ Interface em português adaptada ao mercado moçambicano
- ✅ Compatibilidade com Windows 10/11 (32-bit e 64-bit)

## 🎨 Características Visuais

### Tela de Boas-Vindas
- Logo profissional da Zaty Gráfica
- Gradiente com cores da identidade visual
- Mensagem de boas-vindas personalizada

### Página de Termos
- Documento legal completo e detalhado
- Caixa de texto com rolagem para leitura
- Checkbox de aceitação obrigatório
- Botão "Avançar" bloqueado até aceitação

### Processo de Instalação
- Seleção de diretório de instalação
- Barra de progresso profissional
- Criação automática de atalhos
- Opção de executar após instalação

## 📂 Arquivos do Instalador

```
Zaty Gráfica-Setup-1.0.0.exe    (177 MB)
├── Aplicação Electron completa
├── Dependências nativas
├── Recursos visuais
└── Documentos legais
```

## 🛠️ Como Gerar o Instalador

### Pré-requisitos
- Node.js 20.19+ ou 22.12+
- Windows 10/11
- 2 GB de espaço livre em disco

### Comandos

```bash
# 1. Instalar dependências (se necessário)
npm install

# 2. Gerar recursos visuais + Build + Instalador
npm run electron:build:win

# 3. O instalador será criado em:
release/Zaty Gráfica-Setup-1.0.0.exe
```

### Processo Detalhado

O comando `npm run electron:build:win` executa automaticamente:

1. **Geração de Assets** (`npm run installer:assets`)
   - Converte PNG para ICO (ícone do instalador)
   - Gera header.bmp (150x57px - cabeçalho das páginas)
   - Gera welcome.bmp (164x314px - imagem lateral)
   - Gera logo.bmp (500x80px - logo para página de termos)

2. **Build da Aplicação** (`npm run build`)
   - Compila o código TypeScript
   - Otimiza assets com Vite
   - Gera Service Worker para PWA
   - Prepara arquivos para produção

3. **Empacotamento Electron** (`electron-builder --win`)
   - Empacota aplicação com Electron
   - Cria versões x64 e ia32
   - Executa script NSIS customizado
   - Gera instalador final

## 📋 Documentos Legais

### Termos de Uso
O instalador inclui termos de uso abrangentes cobrindo:
- Licença de uso do software
- Restrições e proibições
- Propriedade intelectual
- Atualizações e suporte
- Rescisão de licença

### Política de Privacidade
Documento detalhado sobre:
- Coleta e uso de dados
- Armazenamento e segurança
- Direitos do usuário (LGPD/GDPR compliant)
- Cookies e armazenamento local
- Retenção de dados
- Transferência internacional

## 🔧 Configuração do Instalador

### electron-builder.json
```json
{
  "nsis": {
    "oneClick": false,
    "allowToChangeInstallationDirectory": true,
    "createDesktopShortcut": true,
    "createStartMenuShortcut": true,
    "license": "build/installer/LICENSE.txt",
    "include": "build/installer/installer.nsh"
  }
}
```

### Script NSIS Customizado
Localizado em: `build/installer/installer.nsh`

Recursos implementados:
- Página customizada de licença com scroll
- Validação de aceitação dos termos
- Bloqueio do botão "Avançar" até aceitação
- Mensagens personalizadas em português
- Verificação de instalação anterior

## 🎯 Funcionalidades do Instalador

### Instalação
- ✅ Escolha do diretório de instalação
- ✅ Criação de atalho na área de trabalho
- ✅ Criação de atalho no menu iniciar
- ✅ Registro no sistema Windows
- ✅ Opção de executar após instalação

### Desinstalação
- ✅ Remoção completa da aplicação
- ✅ Preservação dos dados do servidor
- ✅ Limpeza de registros do sistema
- ✅ Confirmação antes de desinstalar

## 🌐 Distribuição

### Requisitos de Sistema
- **SO:** Windows 10/11 (64-bit ou 32-bit)
- **RAM:** Mínimo 4 GB recomendado
- **Disco:** 500 MB de espaço livre
- **Conexão:** Internet necessária para funcionamento completo

### Como Distribuir

1. **Teste o Instalador**
   ```bash
   # Execute em uma máquina limpa (virtual machine recomendada)
   "Zaty Gráfica-Setup-1.0.0.exe"
   ```

2. **Hospedagem**
   - GitHub Releases (recomendado)
   - Servidor web próprio
   - Serviço de distribuição de software

3. **Assinatura Digital (Opcional)**
   Para produção final, recomenda-se obter certificado de assinatura de código:
   ```bash
   # Configurar em electron-builder.json
   "win": {
     "certificateFile": "path/to/certificate.pfx",
     "certificatePassword": "password"
   }
   ```

## 🔍 Verificação de Integridade

### Checksums
Após gerar o instalador, você pode criar checksums:

```bash
# SHA256
certutil -hashfile "release\Zaty Gráfica-Setup-1.0.0.exe" SHA256

# MD5
certutil -hashfile "release\Zaty Gráfica-Setup-1.0.0.exe" MD5
```

## 📞 Suporte

Para questões sobre o instalador ou problemas de instalação:

**Zaty Gráfica, SU, LDA**
- Email: suporte@zatygrafica.co.mz
- Localização: Maputo, Moçambique

## 📄 Licença

Copyright © 2025 Zaty Gráfica, SU, LDA. Todos os direitos reservados.

Este instalador e o software contido são propriedade da Zaty Gráfica, SU, LDA.
O uso está sujeito aos Termos de Uso e Política de Privacidade incluídos no instalador.

---

## 🚀 Versão Atual

**v1.0.0** - Release Inicial
- Data: 22 de dezembro de 2025
- Build: Windows x64/ia32
- Tamanho: ~177 MB
- Formato: NSIS Installer

---

**Desenvolvido com ❤️ para Zaty Gráfica**
