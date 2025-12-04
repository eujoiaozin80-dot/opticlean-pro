import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

// Verificar se está rodando no Electron com APIs disponíveis
const isElectron = (): boolean => {
  return typeof window !== 'undefined' && 
         typeof window.electronAPI !== 'undefined' &&
         window.electronAPI !== null &&
         typeof window.electronAPI.cleanSystem === 'function';
};

export const useSystemActions = () => {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const cleanSystem = useCallback(async () => {
    if (!isElectron()) {
      toast({
        title: "Modo Offline",
        description: "Esta função requer o aplicativo Electron",
        variant: "default",
      });
      return null;
    }

    setIsProcessing(true);
    try {
      const result = await window.electronAPI.cleanSystem();
      
      toast({
        title: "Limpeza concluída!",
        description: `${result.tempFiles} arquivos removidos. ${result.freedSpace}MB liberados.`,
      });
      return result;
    } catch (error) {
      console.error('Erro ao limpar sistema:', error);
      toast({
        title: "Erro na limpeza",
        description: "Não foi possível limpar o sistema",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, [toast]);

  const optimizeSystem = useCallback(async () => {
    if (!isElectron()) {
      toast({
        title: "Modo Offline",
        description: "Esta função requer o aplicativo Electron",
        variant: "default",
      });
      return null;
    }

    setIsProcessing(true);
    try {
      const result = await window.electronAPI.optimizeSystem();
      
      toast({
        title: "Otimização concluída!",
        description: `Sistema otimizado. ${result.processesOptimized} processos ajustados.`,
      });
      return result;
    } catch (error) {
      console.error('Erro ao otimizar sistema:', error);
      toast({
        title: "Erro na otimização",
        description: "Não foi possível otimizar o sistema",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, [toast]);

  const analyzeSystem = useCallback(async () => {
    if (!isElectron()) {
      toast({
        title: "Modo Offline",
        description: "Esta função requer o aplicativo Electron",
        variant: "default",
      });
      return { totalIssues: 0, issues: [], cpuHealth: 'unknown', memHealth: 'unknown', diskHealth: 'unknown' };
    }

    setIsProcessing(true);
    try {
      const result = await window.electronAPI.analyzeSystem();
      
      if (result.totalIssues === 0) {
        toast({
          title: "Sistema saudável!",
          description: "Nenhum problema detectado",
        });
      } else {
        toast({
          title: `${result.totalIssues} problema(s) encontrado(s)`,
          description: result.issues[0]?.title || "Verifique os detalhes",
          variant: "default",
        });
      }
      
      return result;
    } catch (error) {
      console.error('Erro ao analisar sistema:', error);
      toast({
        title: "Erro na análise",
        description: "Não foi possível analisar o sistema",
        variant: "destructive",
      });
      return { totalIssues: 0, issues: [], cpuHealth: 'unknown', memHealth: 'unknown', diskHealth: 'unknown' };
    } finally {
      setIsProcessing(false);
    }
  }, [toast]);

  const killProcess = useCallback(async (pid: number, name: string) => {
    if (!isElectron()) {
      toast({
        title: "Modo Offline",
        description: "Esta função requer o aplicativo Electron",
        variant: "default",
      });
      return false;
    }

    try {
      const result = await window.electronAPI.killProcess(pid);
      
      if (result.success) {
        toast({
          title: "Processo finalizado",
          description: `${name} foi encerrado com sucesso`,
        });
        return true;
      } else {
        toast({
          title: "Erro ao finalizar processo",
          description: result.error || "Permissões insuficientes",
          variant: "destructive",
        });
        return false;
      }
    } catch (error) {
      console.error('Erro ao finalizar processo:', error);
      toast({
        title: "Erro",
        description: "Não foi possível finalizar o processo",
        variant: "destructive",
      });
      return false;
    }
  }, [toast]);

  const checkUpdates = useCallback(async () => {
    if (!isElectron()) {
      toast({
        title: "Modo Offline",
        description: "Esta função requer o aplicativo Electron",
        variant: "default",
      });
      return { totalUpdates: 0, updates: [] };
    }

    setIsProcessing(true);
    try {
      const result = await window.electronAPI.checkUpdates();
      
      toast({
        title: "Verificação concluída",
        description: result.totalUpdates > 0 
          ? `${result.totalUpdates} atualização(ões) disponível(is)`
          : "Sistema atualizado",
      });
      
      return result;
    } catch (error) {
      console.error('Erro ao verificar atualizações:', error);
      toast({
        title: "Erro na verificação",
        description: "Não foi possível verificar atualizações",
        variant: "destructive",
      });
      return { totalUpdates: 0, updates: [] };
    } finally {
      setIsProcessing(false);
    }
  }, [toast]);

  return {
    cleanSystem,
    optimizeSystem,
    analyzeSystem,
    killProcess,
    checkUpdates,
    isProcessing,
    isElectron: isElectron(),
  };
};

export default useSystemActions;
