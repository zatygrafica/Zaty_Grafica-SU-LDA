/**
 * Script para criar arquivos BMP EXATOS para NSIS
 *
 * NSIS REQUER:
 * - Header: 150 x 57 pixels, BMP 24-bit não comprimido
 * - Sidebar: 164 x 314 pixels, BMP 24-bit não comprimido
 *
 * Este script cria BMPs pixel-perfect sem compressão
 */

const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

// Diretórios
const sourceDir = 'D:/IMAGEM PROJETO';
const targetDir = path.join(__dirname, '../build/installer');

// Garantir que o diretório de destino existe
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

/**
 * Cria um BMP 24-bit não comprimido manualmente
 * NSIS só aceita este formato específico
 */
async function createUncompressedBMP(sourcePath, outputPath, targetWidth, targetHeight) {
  try {
    console.log(`\nProcessando: ${path.basename(sourcePath)}`);
    console.log(`  → Dimensão alvo: ${targetWidth}x${targetHeight}`);

    // 1. Redimensionar e obter dados RAW
    const { data, info } = await sharp(sourcePath)
      .resize(targetWidth, targetHeight, {
        fit: 'cover',
        position: 'center',
        background: { r: 255, g: 255, b: 255 }
      })
      .removeAlpha() // IMPORTANTE: Remover canal alfa
      .raw()
      .toBuffer({ resolveWithObject: true });

    console.log(`  → Dados processados: ${info.width}x${info.height}, ${info.channels} canais`);

    // 2. Criar estrutura BMP manualmente
    const width = targetWidth;
    const height = targetHeight;
    const bytesPerPixel = 3; // RGB apenas (24-bit)

    // Cada linha deve ser múltiplo de 4 bytes (padding)
    const rowSize = Math.floor((bytesPerPixel * width + 3) / 4) * 4;
    const pixelDataSize = rowSize * height;

    // Tamanho total do arquivo
    const fileSize = 54 + pixelDataSize; // 54 bytes header + pixel data

    // 3. Criar buffer para o arquivo BMP
    const bmpBuffer = Buffer.alloc(fileSize);

    // === BITMAP FILE HEADER (14 bytes) ===
    bmpBuffer.write('BM', 0); // Signature
    bmpBuffer.writeUInt32LE(fileSize, 2); // File size
    bmpBuffer.writeUInt32LE(0, 6); // Reserved
    bmpBuffer.writeUInt32LE(54, 10); // Offset to pixel data

    // === BITMAP INFO HEADER (40 bytes) ===
    bmpBuffer.writeUInt32LE(40, 14); // Header size
    bmpBuffer.writeInt32LE(width, 18); // Width
    bmpBuffer.writeInt32LE(height, 22); // Height (positivo = bottom-up)
    bmpBuffer.writeUInt16LE(1, 26); // Planes (sempre 1)
    bmpBuffer.writeUInt16LE(24, 28); // Bits per pixel (24-bit)
    bmpBuffer.writeUInt32LE(0, 30); // Compression (0 = sem compressão - CRÍTICO!)
    bmpBuffer.writeUInt32LE(pixelDataSize, 34); // Image size
    bmpBuffer.writeInt32LE(2835, 38); // X pixels per meter (72 DPI)
    bmpBuffer.writeInt32LE(2835, 42); // Y pixels per meter (72 DPI)
    bmpBuffer.writeUInt32LE(0, 46); // Colors used
    bmpBuffer.writeUInt32LE(0, 50); // Important colors

    // 4. Escrever pixel data
    // BMP armazena pixels de baixo para cima (bottom-up) e em BGR ao invés de RGB
    let bmpOffset = 54;

    for (let y = height - 1; y >= 0; y--) { // De baixo para cima
      for (let x = 0; x < width; x++) {
        const srcOffset = (y * width + x) * 3;

        // Converter RGB para BGR
        const r = data[srcOffset];
        const g = data[srcOffset + 1];
        const b = data[srcOffset + 2];

        bmpBuffer[bmpOffset++] = b; // Blue
        bmpBuffer[bmpOffset++] = g; // Green
        bmpBuffer[bmpOffset++] = r; // Red
      }

      // Adicionar padding se necessário
      const padding = rowSize - (width * bytesPerPixel);
      for (let p = 0; p < padding; p++) {
        bmpBuffer[bmpOffset++] = 0;
      }
    }

    // 5. Salvar arquivo
    fs.writeFileSync(outputPath, bmpBuffer);

    const stats = fs.statSync(outputPath);
    console.log(`  ✓ Criado: ${path.basename(outputPath)}`);
    console.log(`  → Tamanho: ${stats.size} bytes`);
    console.log(`  → Formato: BMP 24-bit não comprimido`);

    return true;
  } catch (error) {
    console.error(`  ✗ Erro:`, error.message);
    return false;
  }
}

async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('CRIANDO ARQUIVOS BMP PARA NSIS');
  console.log('═══════════════════════════════════════════════════════════');

  let success = true;

  // === HEADER BMP (150 x 57) ===
  console.log('\n1. HEADER DO INSTALADOR (150 x 57 pixels)');
  console.log('───────────────────────────────────────────────────────────');

  const headerSource = path.join(sourceDir, 'header.png');
  const headerTarget = path.join(targetDir, 'installerHeader.bmp');

  if (fs.existsSync(headerSource)) {
    const result = await createUncompressedBMP(headerSource, headerTarget, 150, 57);
    success = success && result;
  } else {
    console.log(`  ✗ Arquivo não encontrado: ${headerSource}`);
    success = false;
  }

  // === SIDEBAR BMP (164 x 314) ===
  console.log('\n2. SIDEBAR DO INSTALADOR (164 x 314 pixels)');
  console.log('───────────────────────────────────────────────────────────');

  // Tentar sidebar.png primeiro, depois welcome.png
  let sidebarSource = path.join(sourceDir, 'sidebar.png');
  if (!fs.existsSync(sidebarSource)) {
    sidebarSource = path.join(sourceDir, 'welcome.png');
  }

  const sidebarTarget = path.join(targetDir, 'installerSidebar.bmp');

  if (fs.existsSync(sidebarSource)) {
    const result = await createUncompressedBMP(sidebarSource, sidebarTarget, 164, 314);
    success = success && result;
  } else {
    console.log(`  ✗ Arquivo não encontrado: sidebar.png ou welcome.png em ${sourceDir}`);
    success = false;
  }

  console.log('\n═══════════════════════════════════════════════════════════');

  if (success) {
    console.log('✓ TODOS OS ARQUIVOS BMP CRIADOS COM SUCESSO!');
    console.log('\nArquivos gerados:');
    console.log(`  → ${headerTarget}`);
    console.log(`  → ${sidebarTarget}`);
    console.log('\nPróximo passo: npm run electron:build:win');
  } else {
    console.log('✗ ERRO: Alguns arquivos não foram criados');
    console.log('\nVerifique:');
    console.log(`  1. Arquivos de origem existem em: ${sourceDir}`);
    console.log(`  2. Nomes corretos: header.png, sidebar.png`);
    process.exit(1);
  }

  console.log('═══════════════════════════════════════════════════════════\n');
}

main().catch(error => {
  console.error('\n✗ ERRO FATAL:', error);
  process.exit(1);
});
