import { useState, useCallback, useEffect } from 'react';
import { PROCESS_CONSTANTS } from '@/constants/processes';

const STORAGE_KEY = 'byte-latency_protected_processes';

export const useProtectedProcesses = () => {
  const [protectedProcesses, setProtectedProcesses] = useState<string[]>([]);

  // Carregar whitelist do localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setProtectedProcesses(JSON.parse(stored));
      } else {
        // Inicializar com processos críticos do sistema
        setProtectedProcesses([...PROCESS_CONSTANTS.CRITICAL_PROCESSES]);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(PROCESS_CONSTANTS.CRITICAL_PROCESSES));
      }
    } catch (error) {
      console.error('Erro ao carregar processos protegidos:', error);
      setProtectedProcesses([...PROCESS_CONSTANTS.CRITICAL_PROCESSES]);
    }
  }, []);

  const isProtected = useCallback(
    (processName: string): boolean => {
      return protectedProcesses.some(
        (protectedName) =>
          protectedName.toLowerCase() === processName.toLowerCase() ||
          processName.toLowerCase().includes(protectedName.toLowerCase())
      );
    },
    [protectedProcesses]
  );

  const addProtected = useCallback(
    (processName: string) => {
      if (!isProtected(processName)) {
        const updated = [...protectedProcesses, processName];
        setProtectedProcesses(updated);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      }
    },
    [protectedProcesses, isProtected]
  );

  const removeProtected = useCallback(
    (processName: string) => {
      // Não permitir remover processos críticos do sistema
      if ((PROCESS_CONSTANTS.CRITICAL_PROCESSES as readonly string[]).includes(processName)) {
        return false;
      }

      const updated = protectedProcesses.filter((p) => p !== processName);
      setProtectedProcesses(updated);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return true;
    },
    [protectedProcesses]
  );

  return {
    protectedProcesses,
    isProtected,
    addProtected,
    removeProtected,
  };
};

