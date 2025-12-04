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

export interface ElectronAPI {
  // Sistema de Monitoramento em Tempo Real
  onSystemStats: (callback: (data: SystemStatsData) => void) => void;
  removeSystemStatsListener: () => void;
  
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
    percentage: number;
  }>;
  getDiskUsage: () => Promise<{
    total: number;
    used: number;
    free: number;
    percentage: number;
  }>;
  getSystemInfo: () => Promise<{
    cpu: { brand: string; cores: number; speed: number };
    os: { platform: string; distro: string; release: string };
    memory: { total: number };
  } | null>;
  getProcesses: () => Promise<Array<{ name: string; cpu: number; mem: number; pid: number }>>;
  
  // Funções do Sistema
  cleanSystem: () => Promise<{
    tempFiles: number;
    cacheFiles: number;
    freedSpace: number;
    errors: string[];
  }>;
  optimizeSystem: () => Promise<{
    ramFreed: number;
    processesOptimized: number;
    success: boolean;
  }>;
  analyzeSystem: () => Promise<{
    totalIssues: number;
    issues: Array<{
      type: string;
      title: string;
      description: string;
      suggestion: string;
    }>;
    cpuHealth: string;
    memHealth: string;
    diskHealth: string;
  }>;
  killProcess: (pid: number) => Promise<{
    success: boolean;
    error?: string;
  }>;
  getStartupPrograms: () => Promise<Array<{
    name: string;
    path: string;
    enabled: boolean;
  }>>;
  checkUpdates: () => Promise<{
    totalUpdates: number;
    updates: Array<{
      type: string;
      name: string;
      description: string;
      available: boolean;
    }>;
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
