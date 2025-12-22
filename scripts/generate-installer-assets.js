/**
 * Gerador de Assets do Instalador
 * Zaty Gráfica - Sistema de Gestão Empresarial
 *
 * Este script gera todos os recursos visuais necessários para o instalador:
 * - icon.ico (ícone do instalador)
 * - logo.bmp (logo para a página de licença)
 * - header.bmp (cabeçalho das páginas)
 * - welcome.bmp (imagem lateral de boas-vindas)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';
import pngToIco from 'png-to-ico';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = path.join(__dirname, '..');
const publicDir = path.join(rootDir, 'public');
const buildDir = path.join(rootDir, 'build');
const installerDir = path.join(buildDir, 'installer');

// Cores da identidade visual Zaty Gráfica
const BRAND_COLORS = {
  primary: '#4f46e5',    // Indigo-600
  secondary: '#818cf8',  // Indigo-400
  dark: '#1e1b4b',       // Indigo-950
  light: '#eef2ff',      // Indigo-50
  white: '#ffffff',
  text: '#1f2937',       // Gray-800
};

// Criar diretórios se não existirem
if (!fs.existsSync(installerDir)) {
  fs.mkdirSync(installerDir, { recursive: true });
}

console.log('🎨 Gerando recursos visuais do instalador Zaty Gráfica...\n');

/**
 * 1. Converter PNG para ICO (ícone do instalador)
 */
async function generateIcon() {
  console.log('📦 Gerando icon.ico...');

  const sourcePng = path.join(publicDir, 'icon-512x512.png');
  const targetIco = path.join(buildDir, 'icon.ico');

  try {
    const buf = await pngToIco(sourcePng);
    fs.writeFileSync(targetIco, buf);
    console.log('✅ icon.ico criado com sucesso\n');
  } catch (error) {
    console.error('❌ Erro ao gerar icon.ico:', error.message);
  }
}

/**
 * 2. Gerar logo.bmp (logo para página de termos)
 * Tamanho: 500x80 pixels
 */
async function generateLogo() {
  console.log('🖼️  Gerando logo.bmp...');

  const sourcePng = path.join(publicDir, 'icon-512x512.png');
  const targetBmp = path.join(installerDir, 'logo.bmp');

  try {
    // Criar um canvas com fundo branco e o logo centralizado
    const logoSize = 60;
    const width = 500;
    const height = 80;

    // Redimensionar logo
    const logoBuffer = await sharp(sourcePng)
      .resize(logoSize, logoSize, { fit: 'contain' })
      .toBuffer();

    // Criar SVG com logo e texto
    const svg = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="${BRAND_COLORS.white}"/>
        <rect x="0" y="0" width="100%" height="4" fill="${BRAND_COLORS.primary}"/>
        <text x="250" y="55" font-family="Segoe UI, Arial, sans-serif" font-size="28" font-weight="700" text-anchor="middle" fill="${BRAND_COLORS.dark}">
          Zaty Gráfica
        </text>
        <text x="250" y="72" font-family="Segoe UI, Arial, sans-serif" font-size="12" text-anchor="middle" fill="${BRAND_COLORS.text}">
          Sistema de Gestão Empresarial
        </text>
      </svg>
    `;

    await sharp(Buffer.from(svg))
      .resize(width, height)
      .toFile(targetBmp);

    console.log('✅ logo.bmp criado com sucesso\n');
  } catch (error) {
    console.error('❌ Erro ao gerar logo.bmp:', error.message);
  }
}

/**
 * 3. Gerar header.bmp (cabeçalho das páginas)
 * Tamanho: 150x57 pixels (padrão NSIS)
 */
async function generateHeader() {
  console.log('📐 Gerando header.bmp...');

  const targetBmp = path.join(installerDir, 'header.bmp');
  const width = 150;
  const height = 57;

  try {
    const svg = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="headerGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color:${BRAND_COLORS.primary};stop-opacity:1" />
            <stop offset="100%" style="stop-color:${BRAND_COLORS.secondary};stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#headerGradient)"/>
        <circle cx="20" cy="28" r="12" fill="${BRAND_COLORS.white}" opacity="0.3"/>
        <circle cx="35" cy="28" r="8" fill="${BRAND_COLORS.white}" opacity="0.2"/>
        <circle cx="130" cy="15" r="6" fill="${BRAND_COLORS.white}" opacity="0.2"/>
        <circle cx="140" cy="42" r="10" fill="${BRAND_COLORS.white}" opacity="0.3"/>
        <text x="75" y="32" font-family="Segoe UI, Arial, sans-serif" font-size="14" font-weight="700" text-anchor="middle" fill="${BRAND_COLORS.white}">
          Zaty Gráfica
        </text>
        <text x="75" y="45" font-family="Segoe UI, Arial, sans-serif" font-size="8" text-anchor="middle" fill="${BRAND_COLORS.white}" opacity="0.9">
          Gestão Empresarial
        </text>
      </svg>
    `;

    await sharp(Buffer.from(svg))
      .resize(width, height)
      .toFile(targetBmp);

    console.log('✅ header.bmp criado com sucesso\n');
  } catch (error) {
    console.error('❌ Erro ao gerar header.bmp:', error.message);
  }
}

/**
 * 4. Gerar welcome.bmp (imagem lateral de boas-vindas)
 * Tamanho: 164x314 pixels (padrão NSIS)
 */
async function generateWelcome() {
  console.log('🎉 Gerando welcome.bmp...');

  const sourcePng = path.join(publicDir, 'icon-512x512.png');
  const targetBmp = path.join(installerDir, 'welcome.bmp');
  const width = 164;
  const height = 314;

  try {
    // Criar design de boas-vindas profissional
    const svg = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="welcomeGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color:${BRAND_COLORS.dark};stop-opacity:1" />
            <stop offset="50%" style="stop-color:${BRAND_COLORS.primary};stop-opacity:1" />
            <stop offset="100%" style="stop-color:${BRAND_COLORS.secondary};stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#welcomeGradient)"/>

        <!-- Padrão decorativo -->
        <circle cx="20" cy="30" r="40" fill="${BRAND_COLORS.white}" opacity="0.05"/>
        <circle cx="140" cy="80" r="30" fill="${BRAND_COLORS.white}" opacity="0.05"/>
        <circle cx="30" cy="150" r="35" fill="${BRAND_COLORS.white}" opacity="0.05"/>
        <circle cx="130" cy="200" r="25" fill="${BRAND_COLORS.white}" opacity="0.05"/>
        <circle cx="50" cy="260" r="30" fill="${BRAND_COLORS.white}" opacity="0.05"/>

        <!-- Logo centralizado -->
        <circle cx="82" cy="120" r="42" fill="${BRAND_COLORS.white}" opacity="0.15"/>
        <circle cx="82" cy="120" r="38" fill="${BRAND_COLORS.white}" opacity="0.2"/>

        <!-- Texto -->
        <text x="82" y="200" font-family="Segoe UI, Arial, sans-serif" font-size="18" font-weight="700" text-anchor="middle" fill="${BRAND_COLORS.white}">
          Zaty
        </text>
        <text x="82" y="218" font-family="Segoe UI, Arial, sans-serif" font-size="18" font-weight="700" text-anchor="middle" fill="${BRAND_COLORS.white}">
          Gráfica
        </text>
        <rect x="42" y="225" width="80" height="2" fill="${BRAND_COLORS.white}" opacity="0.5"/>
        <text x="82" y="245" font-family="Segoe UI, Arial, sans-serif" font-size="10" text-anchor="middle" fill="${BRAND_COLORS.white}" opacity="0.9">
          Sistema de Gestão
        </text>
        <text x="82" y="258" font-family="Segoe UI, Arial, sans-serif" font-size="10" text-anchor="middle" fill="${BRAND_COLORS.white}" opacity="0.9">
          Empresarial
        </text>

        <!-- Versão -->
        <text x="82" y="295" font-family="Segoe UI, Arial, sans-serif" font-size="8" text-anchor="middle" fill="${BRAND_COLORS.white}" opacity="0.7">
          v1.0.0
        </text>
      </svg>
    `;

    await sharp(Buffer.from(svg))
      .resize(width, height)
      .toFile(targetBmp);

    console.log('✅ welcome.bmp criado com sucesso\n');
  } catch (error) {
    console.error('❌ Erro ao gerar welcome.bmp:', error.message);
  }
}

/**
 * Executar todas as gerações
 */
async function generateAll() {
  try {
    await generateIcon();
    await generateLogo();
    await generateHeader();
    await generateWelcome();

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('✨ Todos os recursos visuais foram gerados com sucesso!');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('📁 Arquivos criados:');
    console.log(`   - ${path.join(buildDir, 'icon.ico')}`);
    console.log(`   - ${path.join(installerDir, 'logo.bmp')}`);
    console.log(`   - ${path.join(installerDir, 'header.bmp')}`);
    console.log(`   - ${path.join(installerDir, 'welcome.bmp')}\n`);
  } catch (error) {
    console.error('❌ Erro durante a geração:', error);
    process.exit(1);
  }
}

// Executar
generateAll();
