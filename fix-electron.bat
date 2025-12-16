@echo off
echo ========================================
echo Fix Electron Installation
echo ========================================
echo.

echo Matando processos do Electron...
taskkill /F /IM electron.exe 2>nul
timeout /t 2 /nobreak >nul

echo Matando processos do Node...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul

echo Aguardando libera��o dos arquivos...
timeout /t 3 /nobreak >nul

echo Removendo pasta do Electron...
rmdir /s /q node_modules\electron 2>nul
rmdir /s /q node_modules\.electron-* 2>nul

echo Limpando cache do npm...
call npm cache clean --force

echo Reinstalando Electron...
call npm install electron@33.3.1

echo.
echo ========================================
echo Conclu�do! Tente executar:
echo npm run electron:dev
echo ========================================
pause
