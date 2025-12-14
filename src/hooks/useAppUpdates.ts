import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

interface UpdateInfo {
  version: string;
  releaseDate: string;
  releaseNotes: string;
}

interface UpdateState {
  checking: boolean;
  available: boolean;
  downloading: boolean;
  downloaded: boolean;
  downloadProgress: number;
  updateInfo: UpdateInfo | null;
  currentVersion: string;
  error: string | null;
}

export const useAppUpdates = () => {
  const [state, setState] = useState<UpdateState>({
    checking: false,
    available: false,
    downloading: false,
    downloaded: false,
    downloadProgress: 0,
    updateInfo: null,
    currentVersion: '',
    error: null,
  });
  const { toast } = useToast();

  useEffect(() => {
    if (typeof window === 'undefined' || !window.electronAPI) return;

    // Obter versão atual
    window.electronAPI.getAppVersion().then(version => {
      setState(prev => ({ ...prev, currentVersion: version }));
    });

    // Event listeners
    window.electronAPI.onUpdateChecking(() => {
      setState(prev => ({ ...prev, checking: true, error: null }));
    });

    window.electronAPI.onUpdateAvailable((data: UpdateInfo) => {
      setState(prev => ({
        ...prev,
        checking: false,
        available: true,
        updateInfo: data,
        error: null,
      }));
      
      toast({
        title: 'Atualização Disponível',
        description: `Versão ${data.version} está disponível!`,
      });
    });

    window.electronAPI.onUpdateNotAvailable(() => {
      setState(prev => ({
        ...prev,
        checking: false,
        available: false,
        error: null,
      }));
    });

    window.electronAPI.onUpdateError((data: { message: string }) => {
      setState(prev => ({
        ...prev,
        checking: false,
        downloading: false,
        error: data.message,
      }));
    });

    window.electronAPI.onUpdateDownloadProgress((data: { percent: number }) => {
      setState(prev => ({
        ...prev,
        downloading: true,
        downloadProgress: data.percent,
      }));
    });

    window.electronAPI.onUpdateDownloaded((data: { version: string }) => {
      setState(prev => ({
        ...prev,
        downloading: false,
        downloaded: true,
        downloadProgress: 100,
      }));
      
      toast({
        title: 'Atualização Baixada',
        description: 'A atualização será instalada ao reiniciar o aplicativo.',
      });
    });

    return () => {
      if (window.electronAPI) {
        window.electronAPI.removeUpdateListeners();
      }
    };
  }, [toast]);

  const checkForUpdates = async () => {
    if (!window.electronAPI) return;
    
    setState(prev => ({ ...prev, checking: true, error: null }));
    const result = await window.electronAPI.checkForUpdates();
    
    if (!result.success) {
      setState(prev => ({
        ...prev,
        checking: false,
        error: result.error || 'Não foi possível verificar atualizações',
      }));
    }
  };

  const downloadUpdate = async () => {
    if (!window.electronAPI) return;
    
    setState(prev => ({ ...prev, downloading: true, downloadProgress: 0 }));
    const result = await window.electronAPI.downloadUpdate();
    
    if (!result.success) {
      setState(prev => ({
        ...prev,
        downloading: false,
        error: result.error || 'Não foi possível baixar a atualização',
      }));
    }
  };

  const installUpdate = async () => {
    if (!window.electronAPI) return;
    
    const result = await window.electronAPI.installUpdate();
    
    if (!result.success) {
      setState(prev => ({
        ...prev,
        error: result.error || 'Não foi possível instalar a atualização',
      }));
    }
  };

  return {
    ...state,
    checkForUpdates,
    downloadUpdate,
    installUpdate,
  };
};
