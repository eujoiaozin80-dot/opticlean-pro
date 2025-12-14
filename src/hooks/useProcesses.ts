import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Process, ProcessFilter, ConnectionStatus, ProcessStats } from '@/types/process';
import { PROCESS_CONSTANTS } from '@/constants/processes';
import { debounce } from '@/utils/debounce';
import { validatePid } from '@/utils/validation';
import { handleProcessError } from '@/utils/errorHandler';
import { withTimeout } from '@/utils/timeout';
import { useToast } from '@/hooks/use-toast';

const isElectron = (): boolean => {
  try {
    return (
      typeof window !== 'undefined' &&
      typeof window.electronAPI !== 'undefined' &&
      window.electronAPI !== null &&
      typeof window.electronAPI.getProcesses === 'function'
    );
  } catch (error) {
    console.error('Erro ao verificar ambiente Electron:', error);
    return false;
  }
};

export const useProcesses = () => {
  const [processes, setProcesses] = useState<Process[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [filters, setFilters] = useState<ProcessFilter>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const { toast } = useToast();

  // Debounce da busca
  const debouncedSetSearch = useMemo(
    () => debounce((value: string) => setDebouncedSearchTerm(value), PROCESS_CONSTANTS.DEBOUNCE_DELAY),
    []
  );

  useEffect(() => {
    debouncedSetSearch(searchTerm);
    return () => {
      debouncedSetSearch.cancel();
    };
  }, [searchTerm, debouncedSetSearch]);

  const fetchProcesses = useCallback(async () => {
    if (!isElectron()) {
      setConnectionStatus('disconnected');
      setProcesses([]);
      setLoading(false);
      return;
    }

    try {
      setConnectionStatus('connecting');
      const data = await withTimeout(
        window.electronAPI.getProcesses(),
        PROCESS_CONSTANTS.OPERATION_TIMEOUT,
        'Timeout ao buscar processos'
      );
      
      // Converter para formato Process
      const formattedProcesses: Process[] = (data || []).map((p: any) => ({
        pid: p.pid || 0,
        name: p.name || 'Unknown',
        cpu: p.cpu || 0,
        mem: p.mem || 0,
        cpuPercent: p.cpuPercent || p.cpu || 0,
        memPercent: p.memPercent || p.mem || 0,
      }));

      setProcesses(formattedProcesses);
      setConnectionStatus('connected');
      setLoading(false);
    } catch (error) {
      handleProcessError(error, 'buscar processos');
      setConnectionStatus('error');
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProcesses();
    const interval = setInterval(fetchProcesses, PROCESS_CONSTANTS.UPDATE_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchProcesses]);

  // Filtrar processos
  const filteredProcesses = useMemo(() => {
    let filtered = [...processes];

    // Busca por nome
    if (debouncedSearchTerm) {
      filtered = filtered.filter((p) =>
        p.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
      );
    }

    // Filtros de CPU
    if (filters.minCpu !== undefined) {
      filtered = filtered.filter((p) => p.cpuPercent >= filters.minCpu!);
    }
    if (filters.maxCpu !== undefined) {
      filtered = filtered.filter((p) => p.cpuPercent <= filters.maxCpu!);
    }

    // Filtros de Memória
    if (filters.minMem !== undefined) {
      filtered = filtered.filter((p) => p.memPercent >= filters.minMem!);
    }
    if (filters.maxMem !== undefined) {
      filtered = filtered.filter((p) => p.memPercent <= filters.maxMem!);
    }

    return filtered;
  }, [processes, debouncedSearchTerm, filters]);

  // Estatísticas dos processos
  const stats = useMemo<ProcessStats>(() => {
    if (filteredProcesses.length === 0) {
      return {
        totalCpu: 0,
        totalMem: 0,
        avgCpu: 0,
        avgMem: 0,
        processCount: 0,
      };
    }

    const totalCpu = filteredProcesses.reduce((sum, p) => sum + p.cpuPercent, 0);
    const totalMem = filteredProcesses.reduce((sum, p) => sum + p.memPercent, 0);

    return {
      totalCpu,
      totalMem,
      avgCpu: totalCpu / filteredProcesses.length,
      avgMem: totalMem / filteredProcesses.length,
      processCount: filteredProcesses.length,
    };
  }, [filteredProcesses]);

  const killProcess = useCallback(
    async (pid: number, name: string): Promise<boolean> => {
      if (!isElectron()) {
        toast({
          title: 'Modo Offline',
          description: 'Esta função requer o aplicativo Electron',
          variant: 'default',
        });
        return false;
      }

      try {
        validatePid(pid);

        const result = await withTimeout(
          window.electronAPI.killProcess(pid),
          PROCESS_CONSTANTS.OPERATION_TIMEOUT,
          'Timeout ao finalizar processo'
        );

        if (result.success) {
          toast({
            title: 'Processo finalizado',
            description: `${name} foi finalizado com sucesso`,
          });
          fetchProcesses();
          return true;
        } else {
          toast({
            title: 'Erro',
            description: result.error || 'Não foi possível finalizar o processo',
            variant: 'destructive',
          });
          return false;
        }
      } catch (error) {
        handleProcessError(error, `finalizar processo ${name}`, { pid, name });
        return false;
      }
    },
    [toast, fetchProcesses]
  );

  return {
    processes,
    filteredProcesses,
    loading,
    connectionStatus,
    filters,
    searchTerm,
    stats,
    setFilters,
    setSearchTerm,
    fetchProcesses,
    killProcess,
    isElectron: isElectron(),
  };
};

