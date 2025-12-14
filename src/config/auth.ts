/**
 * Configurações de autenticação
 */

export const AUTH_CONFIG = {
  FOUNDER_EMAIL: import.meta.env.VITE_FOUNDER_EMAIL || "brunoquirin3@gmail.com",
  MAX_LOGIN_ATTEMPTS: 5,
  LOGIN_ATTEMPT_WINDOW_MS: 15 * 60 * 1000, // 15 minutos
  SESSION_WARNING_TIME_MS: 5 * 60 * 1000, // 5 minutos antes de expirar
  PASSWORD_MIN_LENGTH: 6,
} as const;

