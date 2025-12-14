import { useState, useCallback, useEffect } from 'react';
import type { ProcessHistory, Process } from '@/types/process';

const STORAGE_KEY = 'opticlean_process_history';
const MAX_HISTORY_ITEMS = 50;

export const useProcessHistory = () => {
  const [history, setHistory] = useState<ProcessHistory[]>([]);

  // Carregar histórico do localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setHistory(parsed.map((item: any) => ({
          ...item,
          killedAt: new Date(item.killedAt),
        })));
      }
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
    }
  }, []);

  // Salvar histórico no localStorage
  const saveHistory = useCallback((newHistory: ProcessHistory[]) => {
    try {
      const toStore = newHistory.slice(-MAX_HISTORY_ITEMS); // Manter apenas os últimos N
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
      setHistory(toStore);
    } catch (error) {
      console.error('Erro ao salvar histórico:', error);
    }
  }, []);

  const addToHistory = useCallback(
    (process: Process) => {
      const historyItem: ProcessHistory = {
        pid: process.pid,
        name: process.name,
        killedAt: new Date(),
        cpu: process.cpu,
        mem: process.mem,
        cpuPercent: process.cpuPercent,
        memPercent: process.memPercent,
      };

      const newHistory = [historyItem, ...history];
      saveHistory(newHistory);
    },
    [saveHistory]
  );

  const clearHistory = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setHistory([]);
  }, []);

  return {
    history,
    addToHistory,
    clearHistory,
  };
};

