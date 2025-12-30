#!/usr/bin/env node

/**
 * Fix paths in dist/index.html for Electron
 *
 * Adiciona <base href="./"> para que caminhos absolutos funcionem com file://
 */

const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, '..', 'dist', 'index.html');

console.log('[fix-electron-paths] Reading index.html...');

let html = fs.readFileSync(indexPath, 'utf-8');

// Verificar se já tem a tag base
if (html.includes('<base')) {
  console.log('[fix-electron-paths] Base tag already exists, skipping');
  process.exit(0);
}

// Adicionar <base href="./"> logo após <head>
html = html.replace(
  /<head>/,
  '<head>\n    <base href="./">'
);

// Salvar
fs.writeFileSync(indexPath, html, 'utf-8');

console.log('[fix-electron-paths] ✓ Added <base href="./"> to index.html');
console.log('[fix-electron-paths] This allows absolute paths (/logo.png) to work with file:// protocol');
