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

  // ============================================
  // Gerenciamento de Usuário e Licença
  // ============================================
  getUsername: () => ipcRenderer.invoke('get-username'),
  getLicense: () => ipcRenderer.invoke('get-license'),
  saveLicense: (data) => ipcRenderer.invoke('save-license', data),
  deleteUser: () => ipcRenderer.invoke('delete-user'),
  generateCode: () => ipcRenderer.invoke('generate-code'),
});

console.log('[OptiClean Pro] APIs do Electron carregadas');
