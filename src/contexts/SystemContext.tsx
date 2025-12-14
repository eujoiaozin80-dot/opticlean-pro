import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import type { ConnectionStatus } from '@/types/process';

interface SystemContextType {
  connectionStatus: ConnectionStatus;
  setConnectionStatus: (status: ConnectionStatus) => void;
  isElectron: boolean;
  userRole: string;
  setUserRole: (role: string) => void;
}

const SystemContext = createContext<SystemContextType | null>(null);

export const useSystemContext = () => {
  const context = useContext(SystemContext);
  if (!context) {
    throw new Error('useSystemContext deve ser usado dentro de SystemProvider');
  }
  return context;
};

interface SystemProviderProps {
  children: ReactNode;
  initialRole?: string;
}

export const SystemProvider: React.FC<SystemProviderProps> = ({
  children,
  initialRole = 'user',
}) => {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [userRole, setUserRole] = useState<string>(initialRole);

  const isElectron = (): boolean => {
    try {
      return (
        typeof window !== 'undefined' &&
        typeof window.electronAPI !== 'undefined' &&
        window.electronAPI !== null
      );
    } catch {
      return false;
    }
  };

  const value: SystemContextType = {
    connectionStatus,
    setConnectionStatus,
    isElectron: isElectron(),
    userRole,
    setUserRole,
  };

  return <SystemContext.Provider value={value}>{children}</SystemContext.Provider>;
};

