import { useSystemStats } from '@/hooks/useSystemStats';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Cpu, 
  MemoryStick, 
  HardDrive, 
  Network, 
  Thermometer,
  Activity,
  Clock,
  Wifi,
  WifiOff
} from 'lucide-react';

const SystemMonitor = () => {
  const { 
    cpu, 
    memory, 
    disk, 
    network, 
    temperature, 
    timestamp,
    isLoading, 
    isElectron, 
    connectionStatus,
    formatBytes,
    formatPercent,
    formatSpeed
  } = useSystemStats();

  const getStatusColor = (percent: number) => {
    if (percent >= 90) return 'text-red-500';
    if (percent >= 70) return 'text-yellow-500';
    return 'text-emerald-500';
  };

  const getProgressColor = (percent: number) => {
    if (percent >= 90) return 'bg-red-500';
    if (percent >= 70) return 'bg-yellow-500';
    return 'bg-emerald-500';
  };

  if (!isElectron) {
    return (
      <Card className="p-6 glass-strong border-border/50">
        <div className="flex items-center gap-3 text-muted-foreground">
          <WifiOff className="w-5 h-5" />
          <span>Monitoramento disponível apenas no aplicativo desktop</span>
        </div>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className="p-4 glass-strong border-border/50 animate-pulse">
            <div className="h-24 bg-muted/20 rounded" />
          </Card>
        ))}
      </div>
    );
  }

  const diskPercent = disk.total > 0 ? Math.round((disk.used / disk.total) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* Status de Conexão */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {connectionStatus === 'connected' ? (
            <>
              <Wifi className="w-4 h-4 text-emerald-500" />
              <Badge variant="outline" className="text-emerald-500 border-emerald-500/50">
                Conectado
              </Badge>
            </>
          ) : (
            <>
              <WifiOff className="w-4 h-4 text-muted-foreground" />
              <Badge variant="outline" className="text-muted-foreground">
                Desconectado
              </Badge>
            </>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="w-3 h-3" />
          <span>{new Date(timestamp).toLocaleTimeString()}</span>
        </div>
      </div>

      {/* Grid de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* CPU */}
        <Card className="p-4 glass-strong border-border/50 hover-lift">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <Cpu className="w-4 h-4 text-primary" />
              </div>
              <span className="font-medium">CPU</span>
            </div>
            <span className={`text-2xl font-bold ${getStatusColor(cpu.usageTotal)}`}>
              {formatPercent(cpu.usageTotal)}
            </span>
          </div>
          <Progress 
            value={cpu.usageTotal} 
            className={`h-2 ${getProgressColor(cpu.usageTotal)}`} 
          />
          <div className="mt-3 flex justify-between text-xs text-muted-foreground">
            <span>{cpu.usagePerCore.length} cores</span>
            <span>{formatSpeed(cpu.speed)}</span>
          </div>
        </Card>

        {/* Memória */}
        <Card className="p-4 glass-strong border-border/50 hover-lift">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-secondary/10">
                <MemoryStick className="w-4 h-4 text-secondary" />
              </div>
              <span className="font-medium">Memória</span>
            </div>
            <span className={`text-2xl font-bold ${getStatusColor(memory.percent)}`}>
              {formatPercent(memory.percent)}
            </span>
          </div>
          <Progress 
            value={memory.percent} 
            className={`h-2 ${getProgressColor(memory.percent)}`} 
          />
          <div className="mt-3 flex justify-between text-xs text-muted-foreground">
            <span>{formatBytes(memory.used)} usado</span>
            <span>{formatBytes(memory.total)} total</span>
          </div>
        </Card>

        {/* Disco */}
        <Card className="p-4 glass-strong border-border/50 hover-lift">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-accent/10">
                <HardDrive className="w-4 h-4 text-accent" />
              </div>
              <span className="font-medium">Disco</span>
            </div>
            <span className={`text-2xl font-bold ${getStatusColor(diskPercent)}`}>
              {formatPercent(diskPercent)}
            </span>
          </div>
          <Progress 
            value={diskPercent} 
            className={`h-2 ${getProgressColor(diskPercent)}`} 
          />
          <div className="mt-3 flex justify-between text-xs text-muted-foreground">
            <span>{formatBytes(disk.used)} usado</span>
            <span>{formatBytes(disk.free)} livre</span>
          </div>
        </Card>

        {/* Rede */}
        <Card className="p-4 glass-strong border-border/50 hover-lift">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Network className="w-4 h-4 text-blue-500" />
              </div>
              <span className="font-medium">Rede</span>
            </div>
            <Activity className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Download</span>
              <span>{network.rx} KB/s</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Upload</span>
              <span>{network.tx} KB/s</span>
            </div>
          </div>
          <div className="mt-3 text-xs text-muted-foreground">
            Interface: {network.interface}
          </div>
        </Card>

        {/* Temperatura */}
        <Card className="p-4 glass-strong border-border/50 hover-lift">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-orange-500/10">
                <Thermometer className="w-4 h-4 text-orange-500" />
              </div>
              <span className="font-medium">Temperatura</span>
            </div>
          </div>
          <div className="text-center py-2">
            {temperature.cpu !== null ? (
              <span className={`text-3xl font-bold ${
                temperature.cpu > 80 ? 'text-red-500' : 
                temperature.cpu > 60 ? 'text-yellow-500' : 'text-emerald-500'
              }`}>
                {temperature.cpu}°C
              </span>
            ) : (
              <span className="text-2xl text-muted-foreground">N/A</span>
            )}
          </div>
          <div className="text-xs text-center text-muted-foreground">
            CPU Temperature
          </div>
        </Card>

        {/* Uso por Core */}
        <Card className="p-4 glass-strong border-border/50 hover-lift">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 rounded-lg bg-purple-500/10">
              <Activity className="w-4 h-4 text-purple-500" />
            </div>
            <span className="font-medium">Cores</span>
          </div>
          <div className="grid grid-cols-4 gap-1">
            {cpu.usagePerCore.length > 0 ? (
              cpu.usagePerCore.slice(0, 8).map((usage, i) => (
                <div key={i} className="text-center">
                  <div 
                    className={`h-8 rounded text-xs flex items-end justify-center pb-1 ${
                      usage > 80 ? 'bg-red-500/20 text-red-400' :
                      usage > 50 ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-emerald-500/20 text-emerald-400'
                    }`}
                    style={{ 
                      background: `linear-gradient(to top, ${
                        usage > 80 ? 'rgba(239,68,68,0.3)' :
                        usage > 50 ? 'rgba(234,179,8,0.3)' :
                        'rgba(16,185,129,0.3)'
                      } ${usage}%, transparent ${usage}%)`
                    }}
                  >
                    {usage}%
                  </div>
                  <span className="text-[10px] text-muted-foreground">C{i}</span>
                </div>
              ))
            ) : (
              <span className="col-span-4 text-center text-muted-foreground text-sm">
                N/A
              </span>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default SystemMonitor;
