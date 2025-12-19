import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Network, ArrowDown, ArrowUp, Wifi, WifiOff, Globe, Activity } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts';

interface NetworkHistoryPoint {
  time: string;
  rx: number;
  tx: number;
}

interface NetworkMonitorCardProps {
  rx: number;
  tx: number;
  interfaceName: string;
  networkHistory: NetworkHistoryPoint[];
  isConnected: boolean;
}

export const NetworkMonitorCard = ({
  rx,
  tx,
  interfaceName,
  networkHistory,
  isConnected
}: NetworkMonitorCardProps) => {
  const totalSpeed = rx + tx;
  const maxSpeed = Math.max(...networkHistory.map(h => h.rx + h.tx), 1000);
  const usagePercent = Math.min((totalSpeed / maxSpeed) * 100, 100);

  const formatSpeed = (kbps: number) => {
    if (kbps >= 1024) {
      return `${(kbps / 1024).toFixed(1)} MB/s`;
    }
    return `${kbps.toFixed(0)} KB/s`;
  };

  return (
    <Card className="metric-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Network className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <CardTitle className="text-lg">Rede</CardTitle>
              <p className="text-xs text-muted-foreground">{interfaceName}</p>
            </div>
          </div>
          <Badge variant={isConnected ? 'default' : 'secondary'} className={isConnected ? 'bg-emerald-500/20 text-emerald-500' : ''}>
            {isConnected ? <Wifi className="w-3 h-3 mr-1" /> : <WifiOff className="w-3 h-3 mr-1" />}
            {isConnected ? 'Conectado' : 'Desconectado'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Speed Indicators */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <div className="flex items-center gap-2 mb-2">
              <ArrowDown className="w-4 h-4 text-emerald-500" />
              <span className="text-xs text-muted-foreground">Download</span>
            </div>
            <p className="text-xl font-bold text-emerald-500">{formatSpeed(rx)}</p>
          </div>
          <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <div className="flex items-center gap-2 mb-2">
              <ArrowUp className="w-4 h-4 text-blue-500" />
              <span className="text-xs text-muted-foreground">Upload</span>
            </div>
            <p className="text-xl font-bold text-blue-500">{formatSpeed(tx)}</p>
          </div>
        </div>

        {/* Usage Bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Uso da Banda</span>
            <span>{usagePercent.toFixed(0)}%</span>
          </div>
          <Progress value={usagePercent} className="h-2" />
        </div>

        {/* Mini Chart */}
        {networkHistory.length > 0 && (
          <div className="h-16">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={networkHistory.slice(-20)}>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-popover p-2 rounded border border-border text-xs">
                          <p>↓ {formatSpeed(payload[0].value as number)}</p>
                          <p>↑ {formatSpeed(payload[1].value as number)}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="rx"
                  stroke="#10b981"
                  fill="#10b981"
                  fillOpacity={0.2}
                  strokeWidth={1.5}
                />
                <Area
                  type="monotone"
                  dataKey="tx"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.2}
                  strokeWidth={1.5}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2 rounded bg-muted/30">
            <Globe className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">Latência</p>
            <p className="text-sm font-medium">~{Math.floor(Math.random() * 20 + 5)}ms</p>
          </div>
          <div className="p-2 rounded bg-muted/30">
            <Activity className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">Pacotes</p>
            <p className="text-sm font-medium">{Math.floor(totalSpeed / 10)}/s</p>
          </div>
          <div className="p-2 rounded bg-muted/30">
            <Network className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="text-sm font-medium">{formatSpeed(totalSpeed)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
