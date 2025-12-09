// ============================================
// OptiClean Pro - TypeScript Declarations
// ============================================

interface SystemStatsData {
  cpu: {
    usageTotal: number;
    usagePerCore: number[];
    speed: number;
  };
  memory: {
    total: number;
    used: number;
    free: number;
    percent: number;
  };
  disk: {
    total: number;
    used: number;
    free: number;
  };
  network: {
    rx: number;
    tx: number;
    interface: string;
  };
  processes: Array<{
    pid: number;
    name: string;
    cpu: number;
    mem: number;
    cpuPercent: number;
    memPercent: number;
  }>;
  temperature: {
    cpu: number | null;
  };
  timestamp: string;
}

interface LicenseData {
  code: string;
  activatedAt: string;
  expiresAt: string;
  username: string;
}

interface CleanSystemResult {
  success: boolean;
  tempFiles: number;
  freedSpace: number;
  details?: string;
}

interface OptimizeSystemResult {
  success: boolean;
  processesOptimized: number;
  memoryFreed: number;
  actions?: string;
}

interface AnalyzeSystemResult {
  success: boolean;
  totalIssues: number;
  issues: Array<{
    type: string;
    title: string;
    description: string;
    severity: 'high' | 'medium' | 'low';
  }>;
  cpuHealth: string;
  memHealth: string;
  diskHealth: string;
  timestamp: string;
}

interface StartupProgram {
  name: string;
  path: string;
  enabled: boolean;
  location: string;
}

interface UpdateInfo {
  name: string;
  type: string;
}

export interface ElectronAPI {
  // Sistema de Monitoramento em Tempo Real
  onSystemStats: (callback: (data: SystemStatsData) => void) => void;
  removeSystemStatsListener: () => void;
  
  // Alertas do Sistema
  onSystemAlert: (callback: (data: { type: string; value: number }) => void) => void;
  removeSystemAlertListener: () => void;
  
  // Métricas do Sistema (Compatibilidade)
  getCpuUsage: () => Promise<{
    usage: number;
    cores: number;
    temperature: number;
  }>;
  getMemoryUsage: () => Promise<{
    total: number;
    used: number;
    free: number;
    percent: number;
  }>;
  getDiskUsage: () => Promise<{
    total: number;
    used: number;
    free: number;
  }>;
  getSystemInfo: () => Promise<{
    cpu: { brand: string; cores: number; speed: number };
    os: { platform: string; distro: string; release: string };
    memory: { total: number };
  } | null>;
  getProcesses: () => Promise<Array<{ name: string; cpu: number; mem: number; pid: number; cpuPercent: number; memPercent: number }>>;
  
  // Funções do Sistema - Limpeza, Otimização, Análise
  cleanSystem: () => Promise<CleanSystemResult>;
  optimizeSystem: () => Promise<OptimizeSystemResult>;
  analyzeSystem: () => Promise<AnalyzeSystemResult>;
  killProcess: (pid: number) => Promise<{
    success: boolean;
    error?: string;
  }>;
  getStartupPrograms: () => Promise<{
    success: boolean;
    programs: StartupProgram[];
    total: number;
  }>;
  checkUpdates: () => Promise<{
    success: boolean;
    totalUpdates: number;
    updates: UpdateInfo[];
  }>;
  
  // Notificações Desktop
  showNotification: (options: { title: string; body: string; type?: string }) => Promise<{
    success: boolean;
    reason?: string;
    error?: string;
  }>;
  
  // Gerenciamento de Usuário e Licença
  getUsername: () => Promise<string>;
  getLicense: () => Promise<LicenseData | null>;
  saveLicense: (data: LicenseData) => Promise<{ success: boolean; error?: string }>;
  deleteUser: () => Promise<{ success: boolean; error?: string }>;
  generateCode: () => Promise<string>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export {};
