/**
 * Converter Imagens Customizadas do Instalador
 * Converte Banner.png e Cabeçalho.png para os formatos corretos
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = path.join(__dirname, '..');
const installerDir = path.join(rootDir, 'build', 'installer');

console.log('🎨 Convertendo imagens customizadas do instalador...\n');

/**
 * Converter Banner (164x314)
 */
async function convertBanner() {
  console.log('📦 Convertendo Banner.png → welcome.bmp...');

  const sourcePng = path.join(installerDir, 'welcome.png');
  const targetBmp = path.join(installerDir, 'welcome.bmp');

  if (!fs.existsSync(sourcePng)) {
    console.log('⚠️  welcome.png não encontrado, pulando...\n');
    return;
  }

  try {
    await sharp(sourcePng)
      .resize(164, 314, {
        fit: 'cover',
        position: 'center'
      })
      .toFile(targetBmp);

    console.log('✅ welcome.bmp criado com sucesso (164x314px)\n');
  } catch (error) {
    console.error('❌ Erro ao converter banner:', error.message);
  }
}

/**
 * Converter Cabeçalho (150x57)
 */
async function convertHeader() {
  console.log('📐 Convertendo Cabeçalho.png → header.bmp...');

  const sourcePng = path.join(installerDir, 'header.png');
  const targetBmp = path.join(installerDir, 'header.bmp');

  if (!fs.existsSync(sourcePng)) {
    console.log('⚠️  header.png não encontrado, pulando...\n');
    return;
  }

  try {
    await sharp(sourcePng)
      .resize(150, 57, {
        fit: 'cover',
        position: 'center'
      })
      .toFile(targetBmp);

    console.log('✅ header.bmp criado com sucesso (150x57px)\n');
  } catch (error) {
    console.error('❌ Erro ao converter cabeçalho:', error.message);
  }
}

/**
 * Executar conversões
 */
async function convert() {
  try {
    await convertBanner();
    await convertHeader();

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('✨ Conversão concluída!');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('📁 Arquivos convertidos:');
    console.log(`   - ${path.join(installerDir, 'welcome.bmp')} (164x314px)`);
    console.log(`   - ${path.join(installerDir, 'header.bmp')} (150x57px)\n`);
    console.log('🚀 Execute "npm run electron:build:win" para gerar o instalador');
  } catch (error) {
    console.error('❌ Erro durante conversão:', error);
    process.exit(1);
  }
}

convert();
