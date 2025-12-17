import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Cpu, MemoryStick, HardDrive, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { useSystemMetrics } from '@/hooks/useSystemMetrics';

const SystemMetricsDisplay = () => {
  const { cpu, memory, disk, isLoading, connectionStatus } = useSystemMetrics();

  const getStatusColor = (percentage: number) => {
    if (percentage >= 80) return 'text-destructive';
    if (percentage >= 60) return 'text-yellow-500';
    return 'text-success';
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="bg-card/50 backdrop-blur border-border/50 animate-pulse">
            <CardHeader>
              <div className="h-6 bg-muted rounded w-24"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded w-16 mb-4"></div>
              <div className="h-2 bg-muted rounded mb-4"></div>
              <div className="space-y-2">
                <div className="h-4 bg-muted rounded"></div>
                <div className="h-4 bg-muted rounded"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Status de Conexão Compacto */}
      <div className={`flex items-center gap-2 p-3 rounded-lg text-sm border ${
        connectionStatus === 'connected' 
          ? 'bg-success/10 border-success/30' 
          : connectionStatus === 'connecting'
          ? 'bg-primary/10 border-primary/30'
          : 'bg-yellow-500/10 border-yellow-500/30'
      }`}>
        {connectionStatus === 'connected' && (
          <>
            <Wifi className="w-4 h-4 text-success" />
            <span className="text-success font-medium">Conectado</span>
            <span className="text-xs px-2 py-0.5 rounded bg-success/20 text-success">DADOS REAIS</span>
          </>
        )}
        {connectionStatus === 'connecting' && (
          <>
            <RefreshCw className="w-4 h-4 text-primary animate-spin" />
            <span className="text-primary font-medium">Conectando...</span>
          </>
        )}
        {connectionStatus === 'disconnected' && (
          <>
            <WifiOff className="w-4 h-4 text-yellow-500" />
            <span className="text-yellow-500 font-medium">Modo Offline</span>
            <span className="text-muted-foreground text-xs ml-2">Execute o Electron para métricas reais</span>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* CPU */}
        <Card className="bg-card/50 backdrop-blur border-border/50 hover:border-primary/30 transition-all">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Cpu className="w-5 h-5 text-primary" />
              <span>CPU</span>
              {connectionStatus === 'connected' && (
                <span className="ml-auto text-xs px-2 py-1 rounded bg-success/20 text-success font-medium">
                  REAL
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Uso</span>
                <span className={`text-2xl font-bold ${getStatusColor(cpu.usage)}`}>
                  {cpu.usage}%
                </span>
              </div>
              <Progress value={cpu.usage} className="h-2" />
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Núcleos</span>
              <span className="font-medium">{cpu.cores}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Temperatura</span>
              <span className="font-medium">{cpu.temperature}°C</span>
            </div>
          </CardContent>
        </Card>

        {/* Memória */}
        <Card className="bg-card/50 backdrop-blur border-border/50 hover:border-secondary/30 transition-all">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <MemoryStick className="w-5 h-5 text-secondary" />
              <span>Memória RAM</span>
              {connectionStatus === 'connected' && (
                <span className="ml-auto text-xs px-2 py-1 rounded bg-success/20 text-success font-medium">
                  REAL
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Uso</span>
                <span className={`text-2xl font-bold ${getStatusColor(memory.percent)}`}>
                  {memory.percent}%
                </span>
              </div>
              <Progress value={memory.percent} className="h-2" />
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Usado</span>
              <span className="font-medium">{memory.used.toFixed(1)} GB</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Total</span>
              <span className="font-medium">{memory.total.toFixed(1)} GB</span>
            </div>
          </CardContent>
        </Card>

        {/* Disco */}
        <Card className="bg-card/50 backdrop-blur border-border/50 hover:border-accent/30 transition-all">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <HardDrive className="w-5 h-5 text-accent" />
              <span>Armazenamento</span>
              {connectionStatus === 'connected' && (
                <span className="ml-auto text-xs px-2 py-1 rounded bg-success/20 text-success font-medium">
                  REAL
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Uso</span>
                <span className={`text-2xl font-bold ${getStatusColor(disk.percent)}`}>
                  {disk.percent}%
                </span>
              </div>
              <Progress value={disk.percent} className="h-2" />
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Usado</span>
              <span className="font-medium">{disk.used.toFixed(1)} GB</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Total</span>
              <span className="font-medium">{disk.total.toFixed(1)} GB</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SystemMetricsDisplay;
