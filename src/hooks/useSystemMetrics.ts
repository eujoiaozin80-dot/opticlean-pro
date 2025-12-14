import { useState, useEffect, useCallback } from 'react';

interface CpuData {
  usage: number;
  cores: number;
  temperature: number;
}

interface MemoryData {
  total: number;
  used: number;
  free: number;
  percentage: number;
}

interface DiskData {
  total: number;
  used: number;
  free: number;
  percentage: number;
}

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

const isElectron = (): boolean => {
  return typeof window !== 'undefined' && 
         typeof window.electronAPI !== 'undefined' &&
         window.electronAPI !== null &&
         typeof window.electronAPI.getCpuUsage === 'function';
};

export const useSystemMetrics = () => {
  const [cpu, setCpu] = useState<CpuData>({ usage: 0, cores: 0, temperature: 0 });
  const [memory, setMemory] = useState<MemoryData>({ total: 0, used: 0, free: 0, percentage: 0 });
  const [disk, setDisk] = useState<DiskData>({ total: 0, used: 0, free: 0, percentage: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchMetrics = useCallback(async () => {
    if (!isElectron()) {
      setConnectionStatus('disconnected');
      setIsLoading(false);
      return;
    }

    try {
      setConnectionStatus('connecting');
      
      const [cpuData, memData, diskData] = await Promise.all([
        window.electronAPI.getCpuUsage(),
        window.electronAPI.getMemoryUsage(),
        window.electronAPI.getDiskUsage(),
      ]);

      // Validar e atualizar CPU
      if (cpuData && typeof cpuData.usage === 'number') {
        setCpu({
          usage: Math.round(cpuData.usage) || 0,
          cores: cpuData.cores || 0,
          temperature: Math.round(cpuData.temperature) || 0
        });
      }

      // Validar e atualizar Memória
      if (memData && typeof memData.percentage === 'number') {
        setMemory({
          total: memData.total || 0,
          used: memData.used || 0,
          free: memData.free || 0,
          percentage: Math.round(memData.percentage) || 0
        });
      }

      // Validar e atualizar Disco
      if (diskData && typeof diskData.percentage === 'number') {
        setDisk({
          total: diskData.total || 0,
          used: diskData.used || 0,
          free: diskData.free || 0,
          percentage: Math.round(diskData.percentage) || 0
        });
      }

      setConnectionStatus('connected');
      setLastUpdate(new Date());
      setIsLoading(false);
    } catch (error) {
      console.error('Erro ao buscar métricas:', error);
      setConnectionStatus('error');
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Verificar se está no Electron
    if (!isElectron()) {
      setConnectionStatus('disconnected');
      setIsLoading(false);
      return;
    }

    // Buscar métricas imediatamente
    fetchMetrics();
    
    // Atualizar a cada 2 segundos
    const interval = setInterval(fetchMetrics, 2000);

    return () => clearInterval(interval);
  }, [fetchMetrics]);

  return {
    cpu,
    memory,
    disk,
    isLoading,
    isElectron: isElectron(),
    connectionStatus,
    lastUpdate,
    refetch: fetchMetrics,
  };
};

export default useSystemMetrics;
