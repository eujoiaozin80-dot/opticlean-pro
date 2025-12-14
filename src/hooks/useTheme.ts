import { useState, useEffect } from 'react';

type Theme = 'dark' | 'light';

export const useTheme = () => {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('opticlean-theme') as Theme;
      return saved || 'dark';
    }
    return 'dark';
  });

  useEffect(() => {
    const root = document.documentElement;
    
    if (theme === 'light') {
      root.classList.add('light');
      root.style.setProperty('--background', '0 0% 98%');
      root.style.setProperty('--background-alt', '0 0% 96%');
      root.style.setProperty('--foreground', '222 47% 11%');
      root.style.setProperty('--card', '0 0% 100%');
      root.style.setProperty('--card-foreground', '222 47% 11%');
      root.style.setProperty('--popover', '0 0% 100%');
      root.style.setProperty('--popover-foreground', '222 47% 11%');
      root.style.setProperty('--muted', '210 40% 96%');
      root.style.setProperty('--muted-foreground', '215 16% 47%');
      root.style.setProperty('--border', '214 32% 91%');
      root.style.setProperty('--input', '214 32% 91%');
    } else {
      root.classList.remove('light');
      root.style.setProperty('--background', '222 47% 6%');
      root.style.setProperty('--background-alt', '220 45% 8%');
      root.style.setProperty('--foreground', '210 40% 98%');
      root.style.setProperty('--card', '220 45% 9%');
      root.style.setProperty('--card-foreground', '210 40% 98%');
      root.style.setProperty('--popover', '220 45% 9%');
      root.style.setProperty('--popover-foreground', '210 40% 98%');
      root.style.setProperty('--muted', '220 30% 16%');
      root.style.setProperty('--muted-foreground', '215 20% 65%');
      root.style.setProperty('--border', '220 30% 18%');
      root.style.setProperty('--input', '220 40% 12%');
    }
    
    localStorage.setItem('opticlean-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  return { theme, setTheme, toggleTheme };
};
