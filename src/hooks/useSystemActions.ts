import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

// Verificar se está rodando no Electron com APIs disponíveis
const isElectron = (): boolean => {
  try {
    return typeof window !== 'undefined' && 
           typeof window.electronAPI !== 'undefined' &&
           window.electronAPI !== null &&
           typeof window.electronAPI.cleanSystem === 'function';
  } catch (error) {
    console.error('Erro ao verificar ambiente Electron:', error);
    return false;
  }
};

// Função para registrar operação no histórico
async function logOperation(type: string, name: string, details: string, status: string = 'completed') {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('operation_history').insert({
        user_id: user.id,
        operation_type: type,
        operation_name: name,
        details,
        status,
      });
    }
  } catch (error) {
    console.error('Erro ao registrar operação:', error);
  }
}

export const useSystemActions = () => {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState<string>('');
  const [showProgress, setShowProgress] = useState(false);

  const cleanSystem = useCallback(async () => {
    if (!isElectron()) {
      toast({
        title: "Modo Desktop Necessário",
        description: "Execute o aplicativo .exe para usar esta função",
        variant: "default",
      });
      return null;
    }

    setIsProcessing(true);
    setShowProgress(true);
    setProgress(0);
    setCurrentStep('Iniciando limpeza...');
    
    try {
      // Simular progresso (em produção, isso viria do Electron via IPC)
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      setCurrentStep('Limpando arquivos temporários...');
      setProgress(25);
      
      const result = await window.electronAPI.cleanSystem();
      
      clearInterval(progressInterval);
      setProgress(100);
      setCurrentStep('Limpeza concluída!');
      
      setTimeout(() => {
        setShowProgress(false);
        setProgress(0);
        setCurrentStep('');
      }, 500);
      
      toast({
        title: "🧹 Limpeza Concluída!",
        description: `${result.tempFiles} arquivos removidos • ${result.freedSpace}MB liberados`,
      });
      
      // Registrar no histórico
      await logOperation(
        'cleaning', 
        'Limpeza do Sistema', 
        `${result.tempFiles} arquivos, ${result.freedSpace}MB liberados. ${result.details || ''}`
      );
      
      return result;
    } catch (error) {
      console.error('Erro ao limpar sistema:', error);
      toast({
        title: "Erro na Limpeza",
        description: "Não foi possível completar a limpeza. Tente novamente.",
        variant: "destructive",
      });
      
      await logOperation('cleaning', 'Limpeza do Sistema', 'Falha na operação', 'failed');
      return null;
    } finally {
      setIsProcessing(false);
      setShowProgress(false);
      setProgress(0);
      setCurrentStep('');
    }
  }, [toast]);

  const optimizeSystem = useCallback(async () => {
    if (!isElectron()) {
      toast({
        title: "Modo Desktop Necessário",
        description: "Execute o aplicativo .exe para usar esta função",
        variant: "default",
      });
      return null;
    }

    setIsProcessing(true);
    try {
      const result = await window.electronAPI.optimizeSystem();
      
      toast({
        title: "⚡ Otimização Concluída!",
        description: `${result.processesOptimized} processos otimizados • ${result.memoryFreed}GB RAM livre`,
      });
      
      await logOperation(
        'optimization', 
        'Otimização do Sistema', 
        `${result.processesOptimized} processos ajustados. ${result.actions || ''}`
      );
      
      return result;
    } catch (error) {
      console.error('Erro ao otimizar sistema:', error);
      toast({
        title: "Erro na Otimização",
        description: "Não foi possível completar a otimização",
        variant: "destructive",
      });
      
      await logOperation('optimization', 'Otimização do Sistema', 'Falha na operação', 'failed');
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, [toast]);

  const analyzeSystem = useCallback(async () => {
    if (!isElectron()) {
      toast({
        title: "Modo Desktop Necessário",
        description: "Execute o aplicativo .exe para usar esta função",
        variant: "default",
      });
      return { totalIssues: 0, issues: [], cpuHealth: 'unknown', memHealth: 'unknown', diskHealth: 'unknown' };
    }

    setIsProcessing(true);
    try {
      const result = await window.electronAPI.analyzeSystem();
      
      if (result.totalIssues === 0) {
        toast({
          title: "✅ Sistema Saudável!",
          description: "Nenhum problema detectado. Tudo funcionando bem!",
        });
      } else {
        const highSeverity = result.issues.filter(i => i.severity === 'high').length;
        const mediumSeverity = result.issues.filter(i => i.severity === 'medium').length;
        
        toast({
          title: `⚠️ ${result.totalIssues} Problema(s) Detectado(s)`,
          description: highSeverity > 0 
            ? `${highSeverity} crítico(s), ${mediumSeverity} moderado(s)`
            : result.issues[0]?.title || "Verifique os detalhes",
          variant: highSeverity > 0 ? "destructive" : "default",
        });
      }
      
      await logOperation(
        'analysis', 
        'Análise Completa', 
        `${result.totalIssues} problema(s). CPU: ${result.cpuHealth}, RAM: ${result.memHealth}, Disco: ${result.diskHealth}`
      );
      
      return result;
    } catch (error) {
      console.error('Erro ao analisar sistema:', error);
      toast({
        title: "Erro na Análise",
        description: "Não foi possível completar a análise",
        variant: "destructive",
      });
      
      await logOperation('analysis', 'Análise Completa', 'Falha na operação', 'failed');
      return { totalIssues: 0, issues: [], cpuHealth: 'unknown', memHealth: 'unknown', diskHealth: 'unknown' };
    } finally {
      setIsProcessing(false);
    }
  }, [toast]);

  const killProcess = useCallback(async (pid: number, name: string) => {
    if (!isElectron()) {
      toast({
        title: "Modo Desktop Necessário",
        description: "Execute o aplicativo .exe para usar esta função",
        variant: "default",
      });
      return false;
    }

    try {
      const result = await window.electronAPI.killProcess(pid);
      
      if (result.success) {
        toast({
          title: "Processo Finalizado",
          description: `${name} (PID: ${pid}) foi encerrado`,
        });
        
        await logOperation('process', `Processo Finalizado: ${name}`, `PID: ${pid}`);
        return true;
      } else {
        toast({
          title: "Erro ao Finalizar",
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
        title: "Modo Desktop Necessário",
        description: "Execute o aplicativo .exe para usar esta função",
        variant: "default",
      });
      return { totalUpdates: 0, updates: [] };
    }

    setIsProcessing(true);
    try {
      const result = await window.electronAPI.checkUpdates();
      
      toast({
        title: result.totalUpdates > 0 ? "🔄 Atualizações Disponíveis" : "✅ Sistema Atualizado",
        description: result.totalUpdates > 0 
          ? `${result.totalUpdates} atualização(ões) do Windows disponível(is)`
          : "Nenhuma atualização pendente",
      });
      
      await logOperation('updates', 'Verificação de Atualizações', `${result.totalUpdates} atualizações disponíveis`);
      
      return result;
    } catch (error) {
      console.error('Erro ao verificar atualizações:', error);
      toast({
        title: "Erro na Verificação",
        description: "Não foi possível verificar atualizações",
        variant: "destructive",
      });
      return { totalUpdates: 0, updates: [] };
    } finally {
      setIsProcessing(false);
    }
  }, [toast]);

  const getStartupPrograms = useCallback(async () => {
    if (!isElectron()) {
      return { programs: [], total: 0 };
    }

    try {
      const result = await window.electronAPI.getStartupPrograms();
      return result;
    } catch (error) {
      console.error('Erro ao obter programas de inicialização:', error);
      return { programs: [], total: 0 };
    }
  }, []);

  return {
    cleanSystem,
    optimizeSystem,
    analyzeSystem,
    killProcess,
    checkUpdates,
    getStartupPrograms,
    isProcessing,
    progress,
    currentStep,
    showProgress,
    setShowProgress,
    isElectron: isElectron(),
  };
};

export default useSystemActions;
