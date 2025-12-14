import { useState, useEffect, useCallback, useRef } from 'react';

// ============================================
// Tipos para System Stats
// ============================================

export interface CpuStats {
  usageTotal: number;
  usagePerCore: number[];
  speed: number;
}

export interface MemoryStats {
  total: number;
  used: number;
  free: number;
  percent: number;
}

export interface DiskStats {
  total: number;
  used: number;
  free: number;
}

export interface NetworkStats {
  rx: number;
  tx: number;
  interface: string;
}

export interface ProcessStats {
  pid: number;
  name: string;
  cpuPercent: number;
  memPercent: number;
}

export interface TemperatureStats {
  cpu: number | null;
}

export interface SystemStats {
  cpu: CpuStats;
  memory: MemoryStats;
  disk: DiskStats;
  network: NetworkStats;
  processes: ProcessStats[];
  temperature: TemperatureStats;
  timestamp: string;
}

export interface HistoryPoint {
  time: string;
  value: number;
}

export interface CoreHistoryPoint {
  time: string;
  [key: string]: string | number;
}

export interface NetworkHistoryPoint {
  time: string;
  rx: number;
  tx: number;
}

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

// ============================================
// Verificação de ambiente Electron
// ============================================

const isElectron = (): boolean => {
  try {
    return typeof window !== 'undefined' && 
           typeof window.electronAPI !== 'undefined' &&
           window.electronAPI !== null &&
           typeof (window.electronAPI as any).onSystemStats === 'function';
  } catch (error) {
    console.error('Erro ao verificar ambiente Electron:', error);
    return false;
  }
};

// ============================================
// Hook Principal
// ============================================

export const useSystemStats = () => {
  const [stats, setStats] = useState<SystemStats>({
    cpu: { usageTotal: 0, usagePerCore: [], speed: 0 },
    memory: { total: 0, used: 0, free: 0, percent: 0 },
    disk: { total: 0, used: 0, free: 0 },
    network: { rx: 0, tx: 0, interface: 'N/A' },
    processes: [],
    temperature: { cpu: null },
    timestamp: new Date().toISOString()
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  
  // Históricos
  const [cpuHistory, setCpuHistory] = useState<HistoryPoint[]>([]);
  const [memoryHistory, setMemoryHistory] = useState<HistoryPoint[]>([]);
  const [coreHistory, setCoreHistory] = useState<CoreHistoryPoint[]>([]);
  const [networkHistory, setNetworkHistory] = useState<NetworkHistoryPoint[]>([]);
  
  // Alertas
  const [alerts, setAlerts] = useState<{ type: 'cpu' | 'memory'; value: number; time: Date }[]>([]);
  const lastAlertRef = useRef<{ cpu: number; memory: number }>({ cpu: 0, memory: 0 });

  useEffect(() => {
    if (!isElectron()) {
      setConnectionStatus('disconnected');
      setIsLoading(false);
      return;
    }

    setConnectionStatus('connecting');

    try {
      // Listener para stats em tempo real
      const api = window.electronAPI as any;
      if (!api || typeof api.onSystemStats !== 'function') {
        console.error('electronAPI.onSystemStats não disponível');
        setConnectionStatus('error');
        setIsLoading(false);
        return;
      }

      api.onSystemStats((data: SystemStats) => {
      setStats(data);
      setConnectionStatus('connected');
      setLastUpdate(new Date());
      setIsLoading(false);
      
      const time = new Date().toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit' 
      });
      
      // Atualizar histórico CPU
      setCpuHistory(prev => {
        const newData = [...prev, { time, value: data.cpu.usageTotal }];
        return newData.slice(-60);
      });
      
      // Atualizar histórico Memória
      setMemoryHistory(prev => {
        const newData = [...prev, { time, value: data.memory.percent }];
        return newData.slice(-60);
      });
      
      // Atualizar histórico por Core
      setCoreHistory(prev => {
        const coreData: CoreHistoryPoint = { time };
        data.cpu.usagePerCore.forEach((usage, i) => {
          coreData[`core${i}`] = usage;
        });
        const newData = [...prev, coreData];
        return newData.slice(-30);
      });
      
      // Atualizar histórico Rede
      setNetworkHistory(prev => {
        const newData = [...prev, { time, rx: data.network.rx, tx: data.network.tx }];
        return newData.slice(-60);
      });
      
      // Sistema de Alertas (com cooldown de 30 segundos)
      const now = Date.now();
      
      if (data.cpu.usageTotal >= 90 && now - lastAlertRef.current.cpu > 30000) {
        lastAlertRef.current.cpu = now;
        setAlerts(prev => [...prev.slice(-9), { 
          type: 'cpu', 
          value: data.cpu.usageTotal, 
          time: new Date() 
        }]);
      }
      
      if (data.memory.percent >= 90 && now - lastAlertRef.current.memory > 30000) {
        lastAlertRef.current.memory = now;
        setAlerts(prev => [...prev.slice(-9), { 
          type: 'memory', 
          value: data.memory.percent, 
          time: new Date() 
        }]);
      }
    });

      // Cleanup ao desmontar
      return () => {
        try {
          if (api?.removeSystemStatsListener) {
            api.removeSystemStatsListener();
          }
        } catch (error) {
          console.error('Erro ao remover listener:', error);
        }
      };
    } catch (error) {
      console.error('Erro ao configurar listener de stats:', error);
      setConnectionStatus('error');
      setIsLoading(false);
      return;
    }
  }, []);

  // Limpar alertas
  const clearAlerts = useCallback(() => {
    setAlerts([]);
  }, []);

  // Formatadores úteis
  const formatBytes = useCallback((gb: number) => {
    if (gb >= 1000) return `${(gb / 1000).toFixed(1)} TB`;
    return `${gb} GB`;
  }, []);

  const formatPercent = useCallback((value: number) => {
    return `${Math.round(value)}%`;
  }, []);

  const formatSpeed = useCallback((mhz: number) => {
    if (mhz >= 1000) return `${(mhz / 1000).toFixed(2)} GHz`;
    return `${mhz} MHz`;
  }, []);

  return {
    stats,
    cpu: stats.cpu,
    memory: stats.memory,
    disk: stats.disk,
    network: stats.network,
    processes: stats.processes,
    temperature: stats.temperature,
    timestamp: stats.timestamp,
    isLoading,
    isElectron: isElectron(),
    connectionStatus,
    lastUpdate,
    // Históricos
    cpuHistory,
    memoryHistory,
    coreHistory,
    networkHistory,
    // Alertas
    alerts,
    clearAlerts,
    hasActiveAlerts: alerts.length > 0,
    // Formatadores
    formatBytes,
    formatPercent,
    formatSpeed
  };
};

export default useSystemStats;
