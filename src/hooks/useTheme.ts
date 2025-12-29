import { useState, useEffect } from 'react';

type Theme = 'dark' | 'light' | 'system';

export const useTheme = () => {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('appSettings');
      if (saved) {
        const settings = JSON.parse(saved);
        return settings.theme || 'dark';
      }
      return 'dark';
    }
    return 'dark';
  });

  useEffect(() => {
    const root = document.documentElement;
    
    // Remover todas as classes de tema primeiro
    root.classList.remove('dark', 'light');
    
    let effectiveTheme: 'dark' | 'light';
    
    if (theme === 'system') {
      // Verificar preferência do sistema
      effectiveTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } else {
      effectiveTheme = theme;
    }
    
    // Adicionar a classe do tema efetivo
    root.classList.add(effectiveTheme);
    
    // Salvar no localStorage através das configurações do app
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('appSettings');
      const settings = saved ? JSON.parse(saved) : {};
      settings.theme = theme;
      localStorage.setItem('appSettings', JSON.stringify(settings));
    }
  }, [theme]);

  // Ouvir mudanças na preferência do sistema quando o tema for 'system'
  useEffect(() => {
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      
      const handleChange = () => {
        const root = document.documentElement;
        root.classList.remove('dark', 'light');
        root.classList.add(mediaQuery.matches ? 'dark' : 'light');
      };
      
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => {
      if (prev === 'dark') return 'light';
      if (prev === 'light') return 'system';
      return 'dark';
    });
  };

  return { theme, setTheme, toggleTheme };
};
