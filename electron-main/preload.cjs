const { contextBridge, ipcRenderer } = require('electron');

// Expor APIs seguras para o renderer process (React)
contextBridge.exposeInMainWorld('electronAPI', {
  // Obter versão do aplicativo
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),

  // Verificar atualizações manualmente
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),

  // Window controls (para barra de título customizada)
  windowMinimize: () => ipcRenderer.send('window-minimize'),
  windowMaximize: () => ipcRenderer.send('window-maximize'),
  windowClose: () => ipcRenderer.send('window-close'),
  windowIsMaximized: () => ipcRenderer.invoke('window-is-maximized'),

  // Informações do ambiente
  platform: process.platform,
  isElectron: true,
});

console.log('Electron preload script carregado');
