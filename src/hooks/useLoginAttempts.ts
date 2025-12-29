import { useState, useMemo, useCallback } from 'react';
import { AUTH_CONFIG } from '@/config/auth';

const STORAGE_KEY = 'byte-latency_login_attempts';

export const useLoginAttempts = () => {
  const [attempts, setAttempts] = useState<number[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Filtrar tentativas antigas
        const now = Date.now();
        return parsed.filter((t: number) => now - t < AUTH_CONFIG.LOGIN_ATTEMPT_WINDOW_MS);
      }
    } catch {
      // Ignorar erros
    }
    return [];
  });

  const canAttempt = useMemo(() => {
    const now = Date.now();
    const recentAttempts = attempts.filter(t => now - t < AUTH_CONFIG.LOGIN_ATTEMPT_WINDOW_MS);
    return recentAttempts.length < AUTH_CONFIG.MAX_LOGIN_ATTEMPTS;
  }, [attempts]);

  const remainingAttempts = useMemo(() => {
    const now = Date.now();
    const recentAttempts = attempts.filter(t => now - t < AUTH_CONFIG.LOGIN_ATTEMPT_WINDOW_MS);
    return Math.max(0, AUTH_CONFIG.MAX_LOGIN_ATTEMPTS - recentAttempts.length);
  }, [attempts]);

  const timeUntilReset = useMemo(() => {
    if (attempts.length === 0) return 0;
    const oldestAttempt = Math.min(...attempts);
    const resetTime = oldestAttempt + AUTH_CONFIG.LOGIN_ATTEMPT_WINDOW_MS;
    const now = Date.now();
    return Math.max(0, resetTime - now);
  }, [attempts]);

  const recordAttempt = useCallback(() => {
    const now = Date.now();
    const newAttempts = [...attempts, now].filter(
      t => now - t < AUTH_CONFIG.LOGIN_ATTEMPT_WINDOW_MS
    );
    setAttempts(newAttempts);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newAttempts));
    } catch {
      // Ignorar erros de localStorage
    }
  }, [attempts]);

  const resetAttempts = useCallback(() => {
    setAttempts([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignorar erros
    }
  }, []);

  return {
    canAttempt,
    remainingAttempts,
    timeUntilReset,
    recordAttempt,
    resetAttempts,
  };
};

