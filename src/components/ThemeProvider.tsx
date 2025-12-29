import { FC, ReactNode } from 'react';
import { useTheme } from '@/hooks/useTheme';

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: FC<ThemeProviderProps> = ({ children }) => {
  useTheme(); // Hook que aplica o tema
  
  return <>{children}</>;
};
