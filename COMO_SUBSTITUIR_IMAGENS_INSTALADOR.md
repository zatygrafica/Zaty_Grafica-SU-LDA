# 📸 Como Substituir as Imagens do Instalador

## 🎯 Passo a Passo Completo

### **Imagem 1: Banner Lateral (Sidebar)**

**Dimensões obrigatórias:** 164 x 314 pixels

**Onde colocar:**
```
d:\DEVV\Zaty-Grafica-SU-LDA_v1-main\build\installer\welcome.bmp
```

**Como fazer:**
1. Prepare sua imagem no Photoshop/Figma/etc
2. Dimensões: **164 pixels (largura) x 314 pixels (altura)**
3. Salve como **BMP** ou **PNG**
4. Copie para: `build\installer\welcome.bmp`
5. Substitua o arquivo existente

---

### **Imagem 2: Cabeçalho (Header)**

**Dimensões obrigatórias:** 150 x 57 pixels

**Onde colocar:**
```
d:\DEVV\Zaty-Grafica-SU-LDA_v1-main\build\installer\header.bmp
```

**Como fazer:**
1. Prepare sua imagem no Photoshop/Figma/etc
2. Dimensões: **150 pixels (largura) x 57 pixels (altura)**
3. Salve como **BMP** ou **PNG**
4. Copie para: `build\installer\header.bmp`
5. Substitua o arquivo existente

---

## 🔄 Método Alternativo (Se você tem PNG)

Se suas imagens estão em **PNG** e não em **BMP**:

### **Opção A: Converter PNG para BMP (Windows Paint)**
1. Abra a imagem PNG no Paint
2. Arquivo → Salvar como → Imagem BMP
3. Escolha: **BMP 24 bits**
4. Salve com o nome correto (welcome.bmp ou header.bmp)

### **Opção B: Deixar em PNG (Eu converto automaticamente)**
1. Coloque suas imagens na pasta:
   ```
   build\installer\welcome.png
   build\installer\header.png
   ```
2. Me avise e eu modifico o script para converter automaticamente

---

## 📋 Checklist de Verificação

Antes de gerar o instalador, confirme:

- [ ] Banner lateral: 164 x 314 pixels ✓
- [ ] Cabeçalho: 150 x 57 pixels ✓
- [ ] Formato: BMP 24-bit ✓
- [ ] Arquivos no local correto ✓
- [ ] Nomes dos arquivos corretos:
  - `welcome.bmp` (banner lateral)
  - `header.bmp` (cabeçalho)

---

## 🚀 Depois de Substituir as Imagens

Execute o comando para gerar novo instalador:

```bash
npm run electron:build:win
```

O instalador será criado em:
```
release\Zaty Gráfica-Setup-1.0.0.exe
```

---

## ❓ Onde estão suas imagens?

**Me diga onde você salvou suas imagens e eu te ajudo a colocá-las no lugar certo!**

Exemplo:
- "Tenho as imagens na pasta Downloads"
- "Salvei no Desktop como banner.png e logo.png"
- "Estão em C:\Users\Usuario\Imagens\"

---

## 💡 Dica de Design

### Para o Banner Lateral (164x314):
- Use cores da identidade visual da empresa
- Inclua o logo da empresa
- Adicione texto breve (nome da empresa, slogan)
- Evite textos muito pequenos (difícil de ler)

### Para o Cabeçalho (150x57):
- Design mais simples e limpo
- Logo pequeno + nome da empresa
- Cores consistentes com o banner

---

**Precisa de ajuda? Me avise onde estão suas imagens!** 😊
