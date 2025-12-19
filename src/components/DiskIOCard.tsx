import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { HardDrive, Database, Folder, FileText, ArrowDown, ArrowUp } from 'lucide-react';

interface DiskIOCardProps {
  total: number;
  used: number;
  free: number;
  formatBytes: (bytes: number) => string;
}

export const DiskIOCard = ({ total, used, free, formatBytes }: DiskIOCardProps) => {
  const [ioStats, setIOStats] = useState({
    readSpeed: 0,
    writeSpeed: 0,
    readOps: 0,
    writeOps: 0,
    temperature: null as number | null,
  });

  const diskPercent = total > 0 ? Math.round((used / total) * 100) : 0;

  // Simulate I/O stats (would come from Electron in real app)
  useEffect(() => {
    const interval = setInterval(() => {
      setIOStats({
        readSpeed: Math.floor(Math.random() * 50000),
        writeSpeed: Math.floor(Math.random() * 30000),
        readOps: Math.floor(Math.random() * 500),
        writeOps: Math.floor(Math.random() * 300),
        temperature: Math.floor(Math.random() * 20 + 30),
      });
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (percent: number) => {
    if (percent >= 90) return 'text-red-500';
    if (percent >= 70) return 'text-yellow-500';
    return 'text-emerald-500';
  };

  const formatSpeed = (bytesPerSec: number) => {
    if (bytesPerSec >= 1024 * 1024) {
      return `${(bytesPerSec / (1024 * 1024)).toFixed(1)} MB/s`;
    }
    if (bytesPerSec >= 1024) {
      return `${(bytesPerSec / 1024).toFixed(1)} KB/s`;
    }
    return `${bytesPerSec} B/s`;
  };

  return (
    <Card className="metric-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-accent/10">
              <HardDrive className="w-5 h-5 text-accent" />
            </div>
            <div>
              <CardTitle className="text-lg">Disco & I/O</CardTitle>
              <p className="text-xs text-muted-foreground">Uso: {diskPercent}%</p>
            </div>
          </div>
          {ioStats.temperature && (
            <Badge variant={ioStats.temperature > 45 ? 'destructive' : 'secondary'}>
              {ioStats.temperature}°C
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Disk Usage */}
        <div className="space-y-2">
          <Progress value={diskPercent} className="h-3" />
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2 rounded bg-muted/30">
              <Database className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="text-sm font-medium">{formatBytes(total)}</p>
            </div>
            <div className="p-2 rounded bg-muted/30">
              <Folder className="w-4 h-4 mx-auto mb-1 text-accent" />
              <p className="text-xs text-muted-foreground">Usado</p>
              <p className={`text-sm font-medium ${getStatusColor(diskPercent)}`}>{formatBytes(used)}</p>
            </div>
            <div className="p-2 rounded bg-muted/30">
              <FileText className="w-4 h-4 mx-auto mb-1 text-emerald-500" />
              <p className="text-xs text-muted-foreground">Livre</p>
              <p className="text-sm font-medium text-emerald-500">{formatBytes(free)}</p>
            </div>
          </div>
        </div>

        {/* I/O Stats */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">Atividade I/O</p>
          <div className="grid grid-cols-2 gap-2">
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <div className="flex items-center gap-2 mb-1">
                <ArrowDown className="w-4 h-4 text-emerald-500" />
                <span className="text-xs text-muted-foreground">Leitura</span>
              </div>
              <p className="text-lg font-bold text-emerald-500">{formatSpeed(ioStats.readSpeed)}</p>
              <p className="text-xs text-muted-foreground">{ioStats.readOps} ops/s</p>
            </div>
            <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
              <div className="flex items-center gap-2 mb-1">
                <ArrowUp className="w-4 h-4 text-orange-500" />
                <span className="text-xs text-muted-foreground">Escrita</span>
              </div>
              <p className="text-lg font-bold text-orange-500">{formatSpeed(ioStats.writeSpeed)}</p>
              <p className="text-xs text-muted-foreground">{ioStats.writeOps} ops/s</p>
            </div>
          </div>
        </div>

        {/* Usage Warning */}
        {diskPercent >= 85 && (
          <div className="p-2 rounded-lg bg-destructive/10 border border-destructive/30">
            <p className="text-xs text-destructive">
              ⚠️ Espaço em disco baixo! Considere liberar espaço.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
