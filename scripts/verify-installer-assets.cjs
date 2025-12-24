const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const installerDir = path.join(__dirname, '../build/installer');
const buildDir = path.join(__dirname, '../build');

async function verifyAssets() {
  console.log('\n=== VERIFICAÇÃO DE ASSETS DO INSTALADOR ===\n');

  // Verificar header.bmp (deve ser 150x57)
  const headerPath = path.join(installerDir, 'header.bmp');
  if (fs.existsSync(headerPath)) {
    const headerMeta = await sharp(headerPath).metadata();
    console.log(`✓ header.bmp encontrado:`);
    console.log(`  Dimensões: ${headerMeta.width}x${headerMeta.height}`);
    console.log(`  Formato: ${headerMeta.format}`);
    console.log(`  Esperado: 150x57 BMP`);
    if (headerMeta.width !== 150 || headerMeta.height !== 57) {
      console.log(`  ⚠️  AVISO: Dimensões incorretas!`);
    }
  } else {
    console.log(`✗ header.bmp NÃO encontrado!`);
  }

  console.log();

  // Verificar welcome.bmp/sidebar.bmp (deve ser 164x314)
  const welcomePath = path.join(installerDir, 'welcome.bmp');
  if (fs.existsSync(welcomePath)) {
    const welcomeMeta = await sharp(welcomePath).metadata();
    console.log(`✓ welcome.bmp encontrado:`);
    console.log(`  Dimensões: ${welcomeMeta.width}x${welcomeMeta.height}`);
    console.log(`  Formato: ${welcomeMeta.format}`);
    console.log(`  Esperado: 164x314 BMP`);
    if (welcomeMeta.width !== 164 || welcomeMeta.height !== 314) {
      console.log(`  ⚠️  AVISO: Dimensões incorretas!`);
    }
  } else {
    console.log(`✗ welcome.bmp NÃO encontrado!`);
  }

  console.log();

  // Verificar icon.ico
  const iconPath = path.join(buildDir, 'icon.ico');
  if (fs.existsSync(iconPath)) {
    const iconStats = fs.statSync(iconPath);
    console.log(`✓ icon.ico encontrado:`);
    console.log(`  Tamanho: ${iconStats.size} bytes`);
    console.log(`  Deve conter múltiplos tamanhos: 16x16, 32x32, 48x48, 256x256`);
  } else {
    console.log(`✗ icon.ico NÃO encontrado!`);
  }

  console.log();

  // Verificar configuração electron-builder.json
  const configPath = path.join(__dirname, '../electron-builder.json');
  if (fs.existsSync(configPath)) {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    console.log(`✓ electron-builder.json:`);
    console.log(`  win.icon: ${config.win?.icon || 'NÃO DEFINIDO'}`);
    console.log(`  nsis.installerIcon: ${config.nsis?.installerIcon || 'NÃO DEFINIDO'}`);
    console.log(`  nsis.uninstallerIcon: ${config.nsis?.uninstallerIcon || 'NÃO DEFINIDO'}`);
    console.log(`  nsis.installerHeader: ${config.nsis?.installerHeader || 'NÃO DEFINIDO'}`);
    console.log(`  nsis.installerSidebar: ${config.nsis?.installerSidebar || 'NÃO DEFINIDO'}`);

    if (config.nsis?.installerSidebar === 'build/installer/sidebar.bmp') {
      console.log(`  ⚠️  AVISO: installerSidebar deve apontar para 'welcome.bmp', não 'sidebar.bmp'`);
    }
  }

  console.log('\n=== FIM DA VERIFICAÇÃO ===\n');
}

verifyAssets().catch(console.error);
