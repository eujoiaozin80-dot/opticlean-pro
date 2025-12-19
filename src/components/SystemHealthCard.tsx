import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Heart,
  TrendingUp,
  TrendingDown,
  Minus,
  Lightbulb,
  RefreshCw,
  Award,
  Cpu,
  MemoryStick,
  HardDrive,
  Activity,
} from 'lucide-react';
import { useSystemHealthScore, getPerformanceGrade } from '@/hooks/useSystemHealth';

interface SystemHealthCardProps {
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  cpuHistory: Array<{ value: number }>;
  memoryHistory: Array<{ value: number }>;
  onOptimize?: () => void;
  isProcessing?: boolean;
}

export const SystemHealthCard = ({
  cpuUsage,
  memoryUsage,
  diskUsage,
  cpuHistory,
  memoryHistory,
  onOptimize,
  isProcessing,
}: SystemHealthCardProps) => {
  const { healthScore, cpuTrend, memoryTrend } = useSystemHealthScore(
    cpuUsage,
    memoryUsage,
    diskUsage,
    cpuHistory,
    memoryHistory
  );

  const { grade, color } = getPerformanceGrade(healthScore.overall);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30';
      case 'good': return 'text-blue-500 bg-blue-500/10 border-blue-500/30';
      case 'fair': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/30';
      case 'poor': return 'text-orange-500 bg-orange-500/10 border-orange-500/30';
      case 'critical': return 'text-red-500 bg-red-500/10 border-red-500/30';
      default: return 'text-muted-foreground bg-muted/10 border-border';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'excellent': return 'Excelente';
      case 'good': return 'Bom';
      case 'fair': return 'Regular';
      case 'poor': return 'Ruim';
      case 'critical': return 'Crítico';
      default: return 'Desconhecido';
    }
  };

  const TrendIcon = ({ trend }: { trend: { direction: string; percentage: number } }) => {
    if (trend.direction === 'improving') {
      return <TrendingDown className="w-3 h-3 text-emerald-500" />;
    }
    if (trend.direction === 'declining') {
      return <TrendingUp className="w-3 h-3 text-red-500" />;
    }
    return <Minus className="w-3 h-3 text-muted-foreground" />;
  };

  return (
    <Card className="metric-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${getStatusColor(healthScore.status)}`}>
              <Heart className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-base">Saúde do Sistema</CardTitle>
              <CardDescription className="text-xs">
                Análise em tempo real
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge className={`${getStatusColor(healthScore.status)} border`}>
              {getStatusLabel(healthScore.status)}
            </Badge>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <div className={`text-3xl font-bold ${color}`}>
                    {grade}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Pontuação: {healthScore.overall}/100</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Score Breakdown */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-background/50 border border-border/50">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Cpu className="w-3 h-3 text-primary" />
                <span className="text-xs text-muted-foreground">CPU</span>
              </div>
              <TrendIcon trend={cpuTrend} />
            </div>
            <div className="flex items-center gap-2">
              <Progress value={healthScore.cpu} className="h-1.5 flex-1" />
              <span className="text-xs font-medium">{healthScore.cpu}</span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-background/50 border border-border/50">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <MemoryStick className="w-3 h-3 text-secondary" />
                <span className="text-xs text-muted-foreground">RAM</span>
              </div>
              <TrendIcon trend={memoryTrend} />
            </div>
            <div className="flex items-center gap-2">
              <Progress value={healthScore.memory} className="h-1.5 flex-1" />
              <span className="text-xs font-medium">{healthScore.memory}</span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-background/50 border border-border/50">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <HardDrive className="w-3 h-3 text-accent" />
                <span className="text-xs text-muted-foreground">Disco</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Progress value={healthScore.disk} className="h-1.5 flex-1" />
              <span className="text-xs font-medium">{healthScore.disk}</span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-background/50 border border-border/50">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Activity className="w-3 h-3 text-blue-500" />
                <span className="text-xs text-muted-foreground">Estabilidade</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Progress value={healthScore.stability} className="h-1.5 flex-1" />
              <span className="text-xs font-medium">{healthScore.stability}</span>
            </div>
          </div>
        </div>

        {/* Recommendations */}
        {healthScore.recommendations.length > 0 && (
          <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Recomendações</span>
            </div>
            <ul className="space-y-1">
              {healthScore.recommendations.map((rec, index) => (
                <li key={index} className="text-xs text-muted-foreground flex items-start gap-2">
                  <span className="text-primary">•</span>
                  {rec}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Action Button */}
        {healthScore.overall < 70 && onOptimize && (
          <Button
            onClick={onOptimize}
            disabled={isProcessing}
            className="w-full"
            variant="outline"
          >
            {isProcessing ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Award className="w-4 h-4 mr-2" />
            )}
            Otimizar Sistema
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default SystemHealthCard;
