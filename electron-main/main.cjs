// CRITICAL: Do NOT name your folder "electron" if you're going to require('electron')!
// The module resolution is seeing the folder "./electron" before node_modules
// Solution: require from the parent directory's node_modules explicitly

const { app, BrowserWindow, ipcMain, dialog, nativeTheme } = require('electron');
const path = require('path');
const fs = require('fs');
const isDev = process.env.NODE_ENV === 'development';

console.log('Electron app object:', !!app);
console.log('Starting Zaty Gráfica Electron app...');

let mainWindow = null;
let autoUpdater = null;

// Importar autoUpdater apenas em produção
if (!isDev) {
  autoUpdater = require('electron-updater').autoUpdater;
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;
}

function createWindow() {
  // Force Electron to respect system theme
  nativeTheme.themeSource = 'system';

  // Define background color based on system theme
  const backgroundColor = nativeTheme.shouldUseDarkColors ? '#0a0a0a' : '#ffffff';

  // Definir caminho do ícone baseado no ambiente
  let iconPath;
  if (isDev) {
    iconPath = path.join(__dirname, '../public/icon-512x512.png');
  } else {
    // Em produção, o ícone é empacotado no diretório resources
    // Electron automaticamente procura por icon.ico no app.asar
    iconPath = path.join(process.resourcesPath, 'app.asar.unpacked', 'build', 'icon.ico');
    // Fallback para quando app não está em asar
    if (!require('fs').existsSync(iconPath)) {
      iconPath = path.join(__dirname, '..', 'build', 'icon.ico');
    }
  }

  console.log('Icon path:', iconPath);
  console.log('Icon exists:', require('fs').existsSync(iconPath));

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 768,
    icon: iconPath,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.cjs')
    },
    backgroundColor: backgroundColor,
    show: false,
    autoHideMenuBar: true,
    // Remover barra de título nativa para usar customizada que segue o tema
    frame: false,
    titleBarStyle: 'hidden',
  });

  // Carregar a aplicação
  if (isDev) {
    // Modo desenvolvimento - conecta ao Vite dev server
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools(); // Abrir DevTools automaticamente
  } else {
    // Modo produção - carregar arquivos buildados
    const fs = require('fs');

    // Lista de caminhos possíveis para index.html em ordem de prioridade
    const possiblePaths = [
      // Caminho 1: Dentro do app.asar
      path.join(__dirname, '..', 'dist', 'index.html'),
      // Caminho 2: Fora do app.asar (app.asar.unpacked)
      path.join(process.resourcesPath, 'app.asar.unpacked', 'dist', 'index.html'),
      // Caminho 3: Direto no resources
      path.join(process.resourcesPath, 'dist', 'index.html'),
      // Caminho 4: app.asar direto
      path.join(process.resourcesPath, 'app.asar', 'dist', 'index.html')
    ];

    console.log('=== Procurando index.html ===');
    console.log('__dirname:', __dirname);
    console.log('process.resourcesPath:', process.resourcesPath);

    let indexPath = null;
    for (const testPath of possiblePaths) {
      console.log(`Testando: ${testPath}`);
      if (fs.existsSync(testPath)) {
        indexPath = testPath;
        console.log('✓ ENCONTRADO:', testPath);
        break;
      } else {
        console.log('✗ Não existe');
      }
    }

    if (!indexPath) {
      console.error('ERRO: index.html não encontrado em nenhum caminho!');
      mainWindow.show();
      mainWindow.loadURL('data:text/html,<h1 style="color:red">Erro Fatal</h1><p>index.html não encontrado</p><pre>' + possiblePaths.join('\n') + '</pre>');
      return;
    }

    console.log('Carregando:', indexPath);
    mainWindow.loadFile(indexPath).then(() => {
      console.log('✓ index.html carregado com sucesso');
    }).catch(err => {
      console.error('✗ Erro ao carregar index.html:', err);
      mainWindow.show();
      mainWindow.loadURL('data:text/html,<h1>Erro ao Carregar</h1><p>' + err.message + '</p>');
    });
  }

  // Mostrar janela quando estiver pronta (evita flash branco)
  mainWindow.once('ready-to-show', () => {
    console.log('Window ready to show');
    mainWindow.show();

    // Checar atualizações apenas em produção
    if (!isDev) {
      checkForUpdates();
    }
  });

  // Fallback: mostrar janela após 5 segundos se não receber ready-to-show
  setTimeout(() => {
    if (mainWindow && !mainWindow.isVisible()) {
      console.log('Forcing window to show after timeout');
      mainWindow.show();
    }
  }, 5000);

  // Atualizar background quando tema do sistema mudar
  nativeTheme.on('updated', () => {
    nativeTheme.themeSource = 'system';

    const newBackgroundColor = nativeTheme.shouldUseDarkColors ? '#0a0a0a' : '#ffffff';
    if (mainWindow) {
      mainWindow.setBackgroundColor(newBackgroundColor);
    }
  });

  // Cleanup quando janela fechar
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Log de erros do renderer
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('Failed to load:', errorCode, errorDescription);
  });

  mainWindow.webContents.on('crashed', () => {
    console.error('Renderer process crashed!');
  });
}

// Configurar webRequest para redirecionar assets para unpacked
app.whenReady().then(() => {
  createWindow();

  // Interceptar requisições de assets em produção
  if (!isDev && mainWindow) {
    mainWindow.webContents.session.webRequest.onBeforeRequest((details, callback) => {
      const url = details.url;

      // Detectar requisições de assets (imagens)
      if (/\.(png|jpg|jpeg|gif|svg|ico)$/i.test(url)) {
        const filename = path.basename(url);

        // Tentar servir do app.asar.unpacked
        const unpackedPath = path.join(process.resourcesPath, 'app.asar.unpacked', 'dist', filename);

        if (fs.existsSync(unpackedPath)) {
          console.log('[Asset Redirect]', filename, '→ unpacked');
          callback({ redirectURL: 'file://' + unpackedPath.replace(/\\/g, '/') });
          return;
        }
      }

      // Fallback: deixar passar
      callback({});
    });
  }

  // No macOS, recriar janela quando clicar no ícone do dock
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit quando todas as janelas fecharem (exceto macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// ========== AUTO-UPDATER ==========

function checkForUpdates() {
  if (!autoUpdater) return;

  autoUpdater.checkForUpdates().catch(err => {
    console.error('Erro ao verificar atualizações:', err);
  });
}

// Configurar event listeners apenas se autoUpdater estiver disponível
if (autoUpdater) {
  // Quando encontrar atualização disponível
  autoUpdater.on('update-available', (info) => {
    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'Atualização Disponível',
      message: `Nova versão ${info.version} disponível!`,
      detail: 'Deseja baixar a atualização agora? O aplicativo será reiniciado após o download.',
      buttons: ['Sim, baixar', 'Depois'],
      defaultId: 0,
      cancelId: 1
    }).then(result => {
      if (result.response === 0) {
        autoUpdater.downloadUpdate();

        // Mostrar progresso do download
        dialog.showMessageBox(mainWindow, {
          type: 'info',
          title: 'Baixando Atualização',
          message: 'A atualização está sendo baixada em segundo plano.',
          detail: 'Você será notificado quando estiver pronta.',
          buttons: ['OK']
        });
      }
    });
  });

  // Quando não houver atualização
  autoUpdater.on('update-not-available', () => {
    console.log('Aplicativo está atualizado');
  });

  // Progresso do download (opcional - pode mostrar barra de progresso)
  autoUpdater.on('download-progress', (progressObj) => {
    const message = `Baixando: ${Math.round(progressObj.percent)}%`;
    console.log(message);

    // Pode atualizar título da janela com progresso
    if (mainWindow) {
      mainWindow.setTitle(`Zaty Gráfica - ${message}`);
    }
  });

  // Quando download completar
  autoUpdater.on('update-downloaded', (info) => {
    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'Atualização Pronta',
      message: `Versão ${info.version} foi baixada com sucesso!`,
      detail: 'O aplicativo será reiniciado agora para aplicar a atualização.',
      buttons: ['Reiniciar Agora', 'Reiniciar Depois'],
      defaultId: 0,
      cancelId: 1
    }).then(result => {
      if (result.response === 0) {
        // Reinstalar título original antes de reiniciar
        if (mainWindow) {
          mainWindow.setTitle('Zaty Gráfica');
        }
        autoUpdater.quitAndInstall(false, true);
      }
    });
  });

  // Erro no auto-updater
  autoUpdater.on('error', (err) => {
    console.error('Erro no auto-updater:', err);
  });
}

// ========== IPC HANDLERS ==========

// Permitir que o renderer process verifique atualizações manualmente
ipcMain.handle('check-for-updates', async () => {
  if (isDev || !autoUpdater) {
    return { available: false, message: 'Updates disabled in development' };
  }

  try {
    const result = await autoUpdater.checkForUpdates();
    return { available: true, info: result.updateInfo };
  } catch (error) {
    return { available: false, error: error.message };
  }
});

// Obter versão do app
ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

// ========== WINDOW CONTROLS (Custom Title Bar) ==========

// Minimizar janela
ipcMain.on('window-minimize', () => {
  if (mainWindow) {
    mainWindow.minimize();
  }
});

// Maximizar/Restaurar janela
ipcMain.on('window-maximize', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});

// Fechar janela
ipcMain.on('window-close', () => {
  if (mainWindow) {
    mainWindow.close();
  }
});

// Verificar se está maximizada
ipcMain.handle('window-is-maximized', () => {
  return mainWindow ? mainWindow.isMaximized() : false;
});

console.log('Electron main process iniciado');
console.log('Versão:', app.getVersion());
console.log('Modo:', isDev ? 'Desenvolvimento' : 'Produção');
