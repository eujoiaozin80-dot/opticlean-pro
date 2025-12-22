const { contextBridge, ipcRenderer } = require('electron');

// ============================================
// OptiClean Pro - Preload Script
// APIs seguras expostas ao renderer
// ============================================

contextBridge.exposeInMainWorld('electronAPI', {
  // ============================================
  // Sistema de Monitoramento em Tempo Real
  // ============================================
  onSystemStats: (callback) => {
    ipcRenderer.on('system-stats', (event, data) => callback(data));
  },
  
  removeSystemStatsListener: () => {
    ipcRenderer.removeAllListeners('system-stats');
  },

  // ============================================
  // Métricas do Sistema (Compatibilidade)
  // ============================================
  getCpuUsage: () => ipcRenderer.invoke('get-cpu-usage'),
  getMemoryUsage: () => ipcRenderer.invoke('get-memory-usage'),
  getDiskUsage: () => ipcRenderer.invoke('get-disk-usage'),
  getSystemInfo: () => ipcRenderer.invoke('get-system-info'),
  getProcesses: () => ipcRenderer.invoke('get-processes'),
  
  // ============================================
  // Funções do Sistema
  // ============================================
  cleanSystem: () => ipcRenderer.invoke('clean-system'),
  optimizeSystem: () => ipcRenderer.invoke('optimize-system'),
  analyzeSystem: () => ipcRenderer.invoke('analyze-system'),
  killProcess: (pid) => ipcRenderer.invoke('kill-process', pid),
  getStartupPrograms: () => ipcRenderer.invoke('get-startup-programs'),
  checkUpdates: () => ipcRenderer.invoke('check-updates'),
  
  // Otimizações específicas
  optimizeDisk: () => ipcRenderer.invoke('optimize-disk'),
  optimizeNetwork: () => ipcRenderer.invoke('optimize-network'),
  cleanRegistry: () => ipcRenderer.invoke('clean-registry'),
  optimizeMemory: () => ipcRenderer.invoke('optimize-memory'),
  optimizeCpu: () => ipcRenderer.invoke('optimize-cpu'),
  
  // ============================================
  // Auto Updater
  // ============================================
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  downloadUpdate: () => ipcRenderer.invoke('download-update'),
  installUpdate: () => ipcRenderer.invoke('install-update'),
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  
  // Eventos de atualização
  onUpdateChecking: (callback) => {
    ipcRenderer.on('update-checking', () => callback());
  },
  onUpdateAvailable: (callback) => {
    ipcRenderer.on('update-available', (event, data) => callback(data));
  },
  onUpdateNotAvailable: (callback) => {
    ipcRenderer.on('update-not-available', (event, data) => callback(data));
  },
  onUpdateError: (callback) => {
    ipcRenderer.on('update-error', (event, data) => callback(data));
  },
  onUpdateDownloadProgress: (callback) => {
    ipcRenderer.on('update-download-progress', (event, data) => callback(data));
  },
  onUpdateDownloaded: (callback) => {
    ipcRenderer.on('update-downloaded', (event, data) => callback(data));
  },
  
  removeUpdateListeners: () => {
    ipcRenderer.removeAllListeners('update-checking');
    ipcRenderer.removeAllListeners('update-available');
    ipcRenderer.removeAllListeners('update-not-available');
    ipcRenderer.removeAllListeners('update-error');
    ipcRenderer.removeAllListeners('update-download-progress');
    ipcRenderer.removeAllListeners('update-downloaded');
  },

  // ============================================
  // Gerenciamento de Usuário e Licença
  // ============================================
  getUsername: () => ipcRenderer.invoke('get-username'),
  getLicense: () => ipcRenderer.invoke('get-license'),
  saveLicense: (data) => ipcRenderer.invoke('save-license', data),
  deleteUser: () => ipcRenderer.invoke('delete-user'),
  generateCode: () => ipcRenderer.invoke('generate-code'),
  
  // ============================================
  // Execução de Comandos
  // ============================================
  runCommand: (command) => ipcRenderer.invoke('run-command', command),
  
  // ============================================
  // Gerenciamento de Prioridade de Processos
  // ============================================
  setProcessPriority: (pid, priority) => ipcRenderer.invoke('set-process-priority', pid, priority),
  
  // ============================================
  // Notificações Desktop
  // ============================================
  showNotification: (options) => ipcRenderer.invoke('show-notification', options),
  onSystemAlert: (callback) => {
    ipcRenderer.on('system-alert', (event, data) => callback(data));
  },
  removeSystemAlertListener: () => {
    ipcRenderer.removeAllListeners('system-alert');
  },
});

console.log('[OptiClean Pro] APIs do Electron carregadas');
