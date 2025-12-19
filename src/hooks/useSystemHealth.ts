import { useState, useEffect, useCallback } from 'react';

interface SystemHealthScore {
  overall: number;
  cpu: number;
  memory: number;
  disk: number;
  stability: number;
  status: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
  recommendations: string[];
}

interface PerformanceTrend {
  direction: 'improving' | 'stable' | 'declining';
  percentage: number;
}

// Hook para calcular health score do sistema
export const useSystemHealthScore = (
  cpuUsage: number,
  memoryUsage: number,
  diskUsage: number,
  cpuHistory: Array<{ value: number }>,
  memoryHistory: Array<{ value: number }>
) => {
  const [healthScore, setHealthScore] = useState<SystemHealthScore>({
    overall: 100,
    cpu: 100,
    memory: 100,
    disk: 100,
    stability: 100,
    status: 'excellent',
    recommendations: [],
  });

  const [cpuTrend, setCpuTrend] = useState<PerformanceTrend>({ direction: 'stable', percentage: 0 });
  const [memoryTrend, setMemoryTrend] = useState<PerformanceTrend>({ direction: 'stable', percentage: 0 });

  const calculateScore = useCallback(() => {
    // CPU Score (inverso do uso)
    const cpuScore = Math.max(0, 100 - cpuUsage);
    
    // Memory Score (inverso do uso)
    const memoryScore = Math.max(0, 100 - memoryUsage);
    
    // Disk Score (inverso do uso, mas com peso menor)
    const diskScore = Math.max(0, 100 - diskUsage);
    
    // Stability Score baseado na variação do CPU e memória
    let stabilityScore = 100;
    if (cpuHistory.length > 5) {
      const recentCpu = cpuHistory.slice(-10).map(h => h.value);
      const cpuVariance = calculateVariance(recentCpu);
      stabilityScore -= Math.min(30, cpuVariance);
    }
    if (memoryHistory.length > 5) {
      const recentMemory = memoryHistory.slice(-10).map(h => h.value);
      const memoryVariance = calculateVariance(recentMemory);
      stabilityScore -= Math.min(20, memoryVariance);
    }
    stabilityScore = Math.max(0, stabilityScore);

    // Overall Score (média ponderada)
    const overall = Math.round(
      cpuScore * 0.35 +
      memoryScore * 0.35 +
      diskScore * 0.15 +
      stabilityScore * 0.15
    );

    // Status
    let status: SystemHealthScore['status'] = 'excellent';
    if (overall < 30) status = 'critical';
    else if (overall < 50) status = 'poor';
    else if (overall < 70) status = 'fair';
    else if (overall < 85) status = 'good';

    // Recommendations
    const recommendations: string[] = [];
    if (cpuUsage > 80) {
      recommendations.push('Feche programas desnecessários para reduzir uso de CPU');
    }
    if (memoryUsage > 80) {
      recommendations.push('Libere memória RAM fechando aplicativos em segundo plano');
    }
    if (diskUsage > 90) {
      recommendations.push('Libere espaço em disco removendo arquivos desnecessários');
    }
    if (stabilityScore < 70) {
      recommendations.push('O sistema está instável. Considere reiniciar o computador');
    }
    if (overall > 85 && recommendations.length === 0) {
      recommendations.push('Sistema funcionando perfeitamente!');
    }

    setHealthScore({
      overall,
      cpu: Math.round(cpuScore),
      memory: Math.round(memoryScore),
      disk: Math.round(diskScore),
      stability: Math.round(stabilityScore),
      status,
      recommendations,
    });

    // Calculate trends
    if (cpuHistory.length > 20) {
      const oldAvg = average(cpuHistory.slice(-30, -15).map(h => h.value));
      const newAvg = average(cpuHistory.slice(-15).map(h => h.value));
      const diff = ((newAvg - oldAvg) / Math.max(oldAvg, 1)) * 100;
      setCpuTrend({
        direction: diff < -5 ? 'improving' : diff > 5 ? 'declining' : 'stable',
        percentage: Math.abs(Math.round(diff)),
      });
    }

    if (memoryHistory.length > 20) {
      const oldAvg = average(memoryHistory.slice(-30, -15).map(h => h.value));
      const newAvg = average(memoryHistory.slice(-15).map(h => h.value));
      const diff = ((newAvg - oldAvg) / Math.max(oldAvg, 1)) * 100;
      setMemoryTrend({
        direction: diff < -5 ? 'improving' : diff > 5 ? 'declining' : 'stable',
        percentage: Math.abs(Math.round(diff)),
      });
    }
  }, [cpuUsage, memoryUsage, diskUsage, cpuHistory, memoryHistory]);

  useEffect(() => {
    calculateScore();
  }, [calculateScore]);

  return { healthScore, cpuTrend, memoryTrend };
};

// Utility functions
const calculateVariance = (values: number[]): number => {
  if (values.length === 0) return 0;
  const avg = average(values);
  const squaredDiffs = values.map(value => Math.pow(value - avg, 2));
  return Math.sqrt(average(squaredDiffs));
};

const average = (values: number[]): number => {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
};

// Hook para calcular estimativa de tempo até limite
export const useResourcePrediction = (
  currentUsage: number,
  history: Array<{ value: number; time: string }>
) => {
  const [prediction, setPrediction] = useState<{
    willReachCritical: boolean;
    estimatedMinutes: number | null;
    trend: 'increasing' | 'stable' | 'decreasing';
  }>({
    willReachCritical: false,
    estimatedMinutes: null,
    trend: 'stable',
  });

  useEffect(() => {
    if (history.length < 10) {
      setPrediction({
        willReachCritical: false,
        estimatedMinutes: null,
        trend: 'stable',
      });
      return;
    }

    const recentValues = history.slice(-20).map(h => h.value);
    const firstHalf = average(recentValues.slice(0, 10));
    const secondHalf = average(recentValues.slice(-10));
    const rateOfChange = (secondHalf - firstHalf) / 10; // per second

    let trend: 'increasing' | 'stable' | 'decreasing' = 'stable';
    if (rateOfChange > 0.5) trend = 'increasing';
    else if (rateOfChange < -0.5) trend = 'decreasing';

    let estimatedMinutes: number | null = null;
    if (rateOfChange > 0 && currentUsage < 90) {
      const remainingToHigh = 90 - currentUsage;
      const secondsToHigh = remainingToHigh / rateOfChange;
      estimatedMinutes = Math.round(secondsToHigh / 60);
      if (estimatedMinutes > 120) estimatedMinutes = null; // Ignore if more than 2 hours
    }

    setPrediction({
      willReachCritical: trend === 'increasing' && currentUsage > 70,
      estimatedMinutes,
      trend,
    });
  }, [currentUsage, history]);

  return prediction;
};

// Format uptime
export const formatUptime = (startTime: Date): string => {
  const now = new Date();
  const diff = now.getTime() - startTime.getTime();
  
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
};

// Calculate performance grade
export const getPerformanceGrade = (score: number): { grade: string; color: string } => {
  if (score >= 90) return { grade: 'A+', color: 'text-emerald-500' };
  if (score >= 80) return { grade: 'A', color: 'text-emerald-500' };
  if (score >= 70) return { grade: 'B', color: 'text-blue-500' };
  if (score >= 60) return { grade: 'C', color: 'text-yellow-500' };
  if (score >= 50) return { grade: 'D', color: 'text-orange-500' };
  return { grade: 'F', color: 'text-red-500' };
};
