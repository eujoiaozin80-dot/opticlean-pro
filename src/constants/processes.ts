/**
 * Constantes relacionadas a processos e sistema
 */

export const PROCESS_CONSTANTS = {
  UPDATE_INTERVAL: 3000,
  DEBOUNCE_DELAY: 300,
  MAX_PID: 65535,
  CRITICAL_CPU_THRESHOLD: 90,
  CRITICAL_MEM_THRESHOLD: 90,
  WARNING_CPU_THRESHOLD: 70,
  WARNING_MEM_THRESHOLD: 70,
  CRITICAL_PROCESSES: [
    'System',
    'smss.exe',
    'csrss.exe',
    'wininit.exe',
    'services.exe',
    'lsass.exe',
    'svchost.exe',
    'explorer.exe',
    'dwm.exe',
    'winlogon.exe',
    'spoolsv.exe',
  ],
  OPERATION_TIMEOUT: 30000, // 30 segundos
  RATE_LIMIT_MAX_REQUESTS: 10,
  RATE_LIMIT_WINDOW_MS: 60000, // 1 minuto
} as const;

