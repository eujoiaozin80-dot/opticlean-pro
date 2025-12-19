import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle } from 'lucide-react';

interface HistoryPoint {
  time: string;
  value: number;
}

interface ResourcePredictionsProps {
  cpuHistory: HistoryPoint[];
  memoryHistory: HistoryPoint[];
}

export const ResourcePredictions = ({ cpuHistory, memoryHistory }: ResourcePredictionsProps) => {
  const predictions = useMemo(() => {
    const calculateTrend = (history: HistoryPoint[]) => {
      if (history.length < 5) return { trend: 'stable', change: 0, predicted: 0 };
      
      const recent = history.slice(-10);
      const firstHalf = recent.slice(0, Math.floor(recent.length / 2));
      const secondHalf = recent.slice(Math.floor(recent.length / 2));
      
      const avgFirst = firstHalf.reduce((a, b) => a + b.value, 0) / firstHalf.length;
      const avgSecond = secondHalf.reduce((a, b) => a + b.value, 0) / secondHalf.length;
      
      const change = avgSecond - avgFirst;
      const predicted = Math.max(0, Math.min(100, avgSecond + change * 2));
      
      let trend: 'up' | 'down' | 'stable' = 'stable';
      if (change > 5) trend = 'up';
      else if (change < -5) trend = 'down';
      
      return { trend, change: Math.round(change), predicted: Math.round(predicted) };
    };

    return {
      cpu: calculateTrend(cpuHistory),
      memory: calculateTrend(memoryHistory),
    };
  }, [cpuHistory, memoryHistory]);

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-red-500" />;
      case 'down': return <TrendingDown className="w-4 h-4 text-emerald-500" />;
      default: return <Minus className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getTrendColor = (trend: string, predicted: number) => {
    if (predicted >= 90) return 'destructive';
    if (trend === 'up' && predicted >= 70) return 'warning';
    return 'default';
  };

  return (
    <Card className="metric-card">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" />
          <CardTitle className="text-sm font-medium">Previsão de Recursos</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* CPU Prediction */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
          <div className="flex items-center gap-3">
            {getTrendIcon(predictions.cpu.trend)}
            <div>
              <p className="text-sm font-medium">CPU</p>
              <p className="text-xs text-muted-foreground">
                {predictions.cpu.trend === 'up' ? 'Subindo' : 
                 predictions.cpu.trend === 'down' ? 'Caindo' : 'Estável'}
                {predictions.cpu.change !== 0 && ` (${predictions.cpu.change > 0 ? '+' : ''}${predictions.cpu.change}%)`}
              </p>
            </div>
          </div>
          <div className="text-right">
            <Badge variant={getTrendColor(predictions.cpu.trend, predictions.cpu.predicted) as any}>
              {predictions.cpu.predicted >= 90 ? (
                <AlertTriangle className="w-3 h-3 mr-1" />
              ) : (
                <CheckCircle className="w-3 h-3 mr-1" />
              )}
              ~{predictions.cpu.predicted}%
            </Badge>
            <p className="text-[10px] text-muted-foreground mt-1">em 5 min</p>
          </div>
        </div>

        {/* Memory Prediction */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
          <div className="flex items-center gap-3">
            {getTrendIcon(predictions.memory.trend)}
            <div>
              <p className="text-sm font-medium">Memória</p>
              <p className="text-xs text-muted-foreground">
                {predictions.memory.trend === 'up' ? 'Subindo' : 
                 predictions.memory.trend === 'down' ? 'Caindo' : 'Estável'}
                {predictions.memory.change !== 0 && ` (${predictions.memory.change > 0 ? '+' : ''}${predictions.memory.change}%)`}
              </p>
            </div>
          </div>
          <div className="text-right">
            <Badge variant={getTrendColor(predictions.memory.trend, predictions.memory.predicted) as any}>
              {predictions.memory.predicted >= 90 ? (
                <AlertTriangle className="w-3 h-3 mr-1" />
              ) : (
                <CheckCircle className="w-3 h-3 mr-1" />
              )}
              ~{predictions.memory.predicted}%
            </Badge>
            <p className="text-[10px] text-muted-foreground mt-1">em 5 min</p>
          </div>
        </div>

        {(predictions.cpu.predicted >= 85 || predictions.memory.predicted >= 85) && (
          <div className="p-2 rounded-lg bg-destructive/10 border border-destructive/30">
            <p className="text-xs text-destructive flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              Recursos podem atingir nível crítico em breve
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
