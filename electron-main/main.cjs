// CRITICAL: Do NOT name your folder "electron" if you're going to require('electron')!
// The module resolution is seeing the folder "./electron" before node_modules
// Solution: require from the parent directory's node_modules explicitly

const { app, BrowserWindow, ipcMain, dialog, nativeTheme } = require('electron');
const path = require('path');
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
  // This ensures the native title bar follows the OS theme
  nativeTheme.themeSource = 'system';

  // Define background color based on system theme
  const backgroundColor = nativeTheme.shouldUseDarkColors ? '#0a0a0a' : '#ffffff';

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 768,
    icon: path.join(__dirname, '../public/icon-512x512.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.cjs')
    },
    backgroundColor: backgroundColor,
    show: false, // Não mostrar até estar pronto (evita flash)
    autoHideMenuBar: true, // Esconder menu (File, Edit, etc)
    titleBarStyle: 'default', // Usar barra de título nativa que segue o tema do sistema
  });

  // Carregar a aplicação
  if (isDev) {
    // Modo desenvolvimento - conecta ao Vite dev server
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools(); // Abrir DevTools automaticamente
  } else {
    // Modo produção - carregar arquivos buildados
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Mostrar janela quando estiver pronta (evita flash branco)
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();

    // Checar atualizações apenas em produção
    if (!isDev) {
      checkForUpdates();
    }
  });

  // Atualizar background quando tema do sistema mudar
  nativeTheme.on('updated', () => {
    // Force theme update to ensure title bar follows system theme
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
}

// Inicializar app
app.whenReady().then(() => {
  createWindow();

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

console.log('Electron main process iniciado');
console.log('Versão:', app.getVersion());
console.log('Modo:', isDev ? 'Desenvolvimento' : 'Produção');
