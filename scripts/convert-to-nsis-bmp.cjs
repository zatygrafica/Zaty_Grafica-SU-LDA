const sharp = require('sharp');
const bmp = require('bmp-js');
const path = require('path');
const fs = require('fs');

const sourceDir = 'D:/IMAGEM PROJETO';
const installerDir = path.join(__dirname, '../build/installer');

// Garantir que o diretório existe
if (!fs.existsSync(installerDir)) {
  fs.mkdirSync(installerDir, { recursive: true });
}

async function convertToBMP24(sourcePath, targetPath, width, height) {
  try {
    // 1. Usar Sharp para redimensionar e obter dados raw RGBA
    const { data, info } = await sharp(sourcePath)
      .resize(width, height, {
        fit: 'cover',
        position: 'center'
      })
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    // 2. Converter RGBA para BGRA (formato BMP)
    const bmpData = Buffer.alloc(width * height * 4);
    for (let i = 0; i < data.length; i += 4) {
      bmpData[i] = data[i + 2];     // B
      bmpData[i + 1] = data[i + 1]; // G
      bmpData[i + 2] = data[i];     // R
      bmpData[i + 3] = 255;         // A (opaco)
    }

    // 3. Criar estrutura BMP
    const bmpImage = {
      data: bmpData,
      width: width,
      height: height
    };

    // 4. Codificar como BMP e salvar
    const bmpBuffer = bmp.encode(bmpImage);
    fs.writeFileSync(targetPath, bmpBuffer.data);

    return true;
  } catch (error) {
    console.error(`Erro ao converter ${sourcePath}:`, error.message);
    return false;
  }
}

async function convertImages() {
  console.log('\n=== CONVERTENDO IMAGENS PARA FORMATO NSIS ===\n');

  let success = true;

  // Converter header.png para header.bmp (150x57)
  const headerSource = path.join(sourceDir, 'header.png');
  const headerTarget = path.join(installerDir, 'header.bmp');

  if (fs.existsSync(headerSource)) {
    console.log('Convertendo header.png → header.bmp (150x57)...');
    const result = await convertToBMP24(headerSource, headerTarget, 150, 57);
    if (result) {
      const stats = fs.statSync(headerTarget);
      console.log(`✓ header.bmp criado com sucesso (${stats.size} bytes)`);
    } else {
      success = false;
    }
  } else {
    console.log(`✗ header.png não encontrado em ${sourceDir}`);
    success = false;
  }

  console.log();

  // Converter sidebar/welcome.png para welcome.bmp (164x314)
  const sidebarSource = path.join(sourceDir, 'sidebar.png');
  const welcomeSource = path.join(sourceDir, 'welcome.png');
  const welcomeTarget = path.join(installerDir, 'welcome.bmp');
  const sidebarTarget = path.join(installerDir, 'sidebar.bmp');

  // Tentar primeiro sidebar.png, depois welcome.png
  let sourceFile = null;
  if (fs.existsSync(sidebarSource)) {
    sourceFile = sidebarSource;
    console.log('Usando sidebar.png como fonte...');
  } else if (fs.existsSync(welcomeSource)) {
    sourceFile = welcomeSource;
    console.log('Usando welcome.png como fonte...');
  }

  if (sourceFile) {
    console.log('Convertendo → welcome.bmp (164x314)...');
    const result = await convertToBMP24(sourceFile, welcomeTarget, 164, 314);
    if (result) {
      const stats = fs.statSync(welcomeTarget);
      console.log(`✓ welcome.bmp criado com sucesso (${stats.size} bytes)`);

      // Criar cópia como sidebar.bmp
      fs.copyFileSync(welcomeTarget, sidebarTarget);
      console.log(`✓ sidebar.bmp criado (cópia de welcome.bmp)`);
    } else {
      success = false;
    }
  } else {
    console.log(`✗ Nenhuma imagem de sidebar/welcome encontrada em ${sourceDir}`);
    success = false;
  }

  console.log();

  if (success) {
    console.log('=== CONVERSÃO CONCLUÍDA COM SUCESSO ===\n');
    console.log('Arquivos BMP 24-bit criados em:', installerDir);
    console.log('  • header.bmp (150x57 pixels)');
    console.log('  • welcome.bmp (164x314 pixels)');
    console.log('  • sidebar.bmp (164x314 pixels)');
    console.log('\nPróximo passo: npm run electron:build:win\n');
  } else {
    console.log('=== CONVERSÃO CONCLUÍDA COM ERROS ===\n');
    console.log('Verifique os arquivos de origem em:', sourceDir);
    process.exit(1);
  }
}

convertImages();
