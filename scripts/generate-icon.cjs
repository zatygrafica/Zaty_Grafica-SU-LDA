const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const logoSource = path.join(__dirname, '../public/icon-512x512.png');
const iconTarget = path.join(__dirname, '../build/icon.ico');
const tempDir = path.join(__dirname, '../build/temp-icons');

// Garantir que os diretórios existem
if (!fs.existsSync(path.join(__dirname, '../build'))) {
  fs.mkdirSync(path.join(__dirname, '../build'), { recursive: true });
}

if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

async function generateIcon() {
  console.log('\n=== GERANDO ÍCONE .ICO PROFISSIONAL ===\n');

  try {
    // Importação dinâmica de png-to-ico (ESM module)
    const pngToIco = (await import('png-to-ico')).default;

    if (!fs.existsSync(logoSource)) {
      console.error(`✗ Logo não encontrado: ${logoSource}`);
      console.log('\nPor favor, coloque o logo da sua empresa em:');
      console.log('  public/logo.png');
      console.log('\nOu especifique o caminho correto no script.');
      process.exit(1);
    }

    console.log(`Fonte: ${logoSource}`);
    console.log('Gerando ícones em múltiplos tamanhos...\n');

    // Tamanhos necessários para um ícone profissional do Windows
    const sizes = [16, 32, 48, 64, 128, 256];
    const pngFiles = [];

    for (const size of sizes) {
      const outputPath = path.join(tempDir, `icon-${size}.png`);

      await sharp(logoSource)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 } // Fundo transparente
        })
        .png()
        .toFile(outputPath);

      pngFiles.push(outputPath);
      console.log(`✓ ${size}x${size} criado`);
    }

    console.log('\nCombinando em arquivo .ICO...');

    // Converter PNGs para ICO
    const ico = await pngToIco(pngFiles);
    fs.writeFileSync(iconTarget, ico);

    // Limpar arquivos temporários
    for (const file of pngFiles) {
      fs.unlinkSync(file);
    }
    fs.rmdirSync(tempDir);

    const stats = fs.statSync(iconTarget);
    console.log(`\n✓ Ícone criado com sucesso!`);
    console.log(`  Localização: ${iconTarget}`);
    console.log(`  Tamanho: ${stats.size} bytes`);
    console.log(`  Contém: ${sizes.map(s => `${s}x${s}`).join(', ')}`);
    console.log('\n=== ÍCONE GERADO COM SUCESSO ===\n');

  } catch (error) {
    console.error('Erro ao gerar ícone:', error);
    process.exit(1);
  }
}

generateIcon();
