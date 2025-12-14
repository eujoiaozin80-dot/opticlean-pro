/**
 * Tipos relacionados a processos
 */

export interface Process {
  pid: number;
  name: string;
  cpu: number;
  mem: number;
  cpuPercent: number;
  memPercent: number;
  user?: string;
  startTime?: Date;
}

export interface ProcessHistory {
  pid: number;
  name: string;
  killedAt: Date;
  cpu: number;
  mem: number;
  cpuPercent: number;
  memPercent: number;
}

export type ProcessFilter = {
  search?: string;
  minCpu?: number;
  maxCpu?: number;
  minMem?: number;
  maxMem?: number;
  userOnly?: boolean;
  systemOnly?: boolean;
  groupBy?: 'name' | 'none';
};

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface ProcessStats {
  totalCpu: number;
  totalMem: number;
  avgCpu: number;
  avgMem: number;
  processCount: number;
}

