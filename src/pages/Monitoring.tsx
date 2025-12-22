import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSystemStats } from '@/hooks/useSystemStats';
import { useToast } from '@/hooks/use-toast';
import { NetworkMonitorCard } from '@/components/NetworkMonitorCard';
import { DiskIOCard } from '@/components/DiskIOCard';
import { PerformanceProfiles } from '@/components/PerformanceProfiles';
import { 
  Cpu, 
  MemoryStick, 
  HardDrive, 
  Network, 
  Thermometer,
  Activity,
  Clock,
  WifiOff,
  Search,
  ArrowUpDown,
  XCircle,
  RefreshCw,
  AlertTriangle,
  TrendingUp,
  Bell,
  X,
  Settings
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

const isElectron = (): boolean => {
  try {
    return typeof window !== 'undefined' && 
           typeof window.electronAPI !== 'undefined' &&
           window.electronAPI !== null &&
           typeof window.electronAPI.onSystemStats === 'function';
  } catch (error) {
    console.error('Erro ao verificar ambiente Electron:', error);
    return false;
  }
};

interface MonitoringProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

const Monitoring = ({ className, ...props }: MonitoringProps) => {
  const { toast } = useToast();
  const { 
    cpu, 
    memory, 
    disk, 
    network, 
    processes,
    temperature,
    timestamp,
    isLoading, 
    connectionStatus,
    formatBytes,
    formatSpeed,
    cpuHistory,
    memoryHistory,
    coreHistory,
    networkHistory,
    alerts,
    clearAlerts,
    hasActiveAlerts
  } = useSystemStats();

  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'cpu' | 'mem' | 'name'>('cpu');
  const [showAlerts, setShowAlerts] = useState(false);

  // Mostrar toast quando houver alertas novos
  useEffect(() => {
    if (alerts.length > 0) {
      const lastAlert = alerts[alerts.length - 1];
      toast({
        title: `⚠️ Alerta de ${lastAlert.type === 'cpu' ? 'CPU' : 'Memória'}`,
        description: `Uso em ${lastAlert.value}% - Considere fechar programas`,
        variant: "destructive"
      });
    }
  }, [alerts.length]);

  const filteredProcesses = processes
    .filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'cpu') return b.cpuPercent - a.cpuPercent;
      if (sortBy === 'mem') return b.memPercent - a.memPercent;
      return a.name.localeCompare(b.name);
    });

  const killProcess = async (pid: number, name: string) => {
    if (!isElectron()) return;
    
    try {
      const api = window.electronAPI;
      const result = await api.killProcess(pid);
      if (result.success) {
        toast({ title: "Processo Finalizado", description: `${name} (PID: ${pid})` });
      } else {
        throw new Error(result.error);
      }
    } catch (error: unknown) {
      toast({ title: "Erro", description: error instanceof Error ? error.message : "Erro desconhecido", variant: "destructive" });
    }
  };

  const getStatusColor = (percent: number) => {
    if (percent >= 90) return 'text-red-500';
    if (percent >= 70) return 'text-yellow-500';
    return 'text-emerald-500';
  };

  const diskPercent = disk.total > 0 ? Math.round((disk.used / disk.total) * 100) : 0;

  // Cores para os gráficos
  const coreColors = [
    '#3b82f6', '#8b5cf6', '#ec4899', '#f97316', 
    '#22c55e', '#06b6d4', '#eab308', '#ef4444'
  ];

  if (!isElectron()) {
    return (
      <div className={`space-y-6 animate-fade-up ${className || ''}`} {...props}>
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-1">Monitoramento</h1>
          <p className="text-muted-foreground text-sm">Sistema de monitoramento em tempo real</p>
        </div>
        <Card className="p-12 text-center glass-strong border-border/50">
          <WifiOff className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
          <h2 className="text-xl font-semibold mb-2">Modo Desktop Necessário</h2>
          <p className="text-muted-foreground">Execute o aplicativo .exe para acessar o monitoramento em tempo real.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className={`space-y-6 animate-fade-up ${className || ''}`} {...props}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-1">Monitoramento</h1>
          <p className="text-muted-foreground text-sm">Métricas do sistema em tempo real</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Botão de Alertas */}
          <Button
            variant={hasActiveAlerts ? "destructive" : "outline"}
            size="sm"
            onClick={() => setShowAlerts(!showAlerts)}
            className="relative"
          >
            <Bell className="w-4 h-4 mr-1" />
            Alertas
            {hasActiveAlerts && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] flex items-center justify-center">
                {alerts.length}
              </span>
            )}
          </Button>
          
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            <span>{new Date(timestamp).toLocaleTimeString('pt-BR')}</span>
          </div>
          {connectionStatus === 'connected' ? (
            <Badge variant="outline" className="text-emerald-500 border-emerald-500/50 bg-emerald-500/10">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2 animate-pulse" />
              1s Intervalo
            </Badge>
          ) : (
            <Badge variant="outline" className="text-muted-foreground">
              <RefreshCw className="w-3 h-3 mr-2 animate-spin" />
              Conectando
            </Badge>
          )}
        </div>
      </div>

      {/* Painel de Alertas */}
      {showAlerts && (
        <Card className="glass-strong border-destructive/50 bg-destructive/5 animate-fade-in">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-destructive" />
                <CardTitle className="text-sm">Alertas do Sistema</CardTitle>
              </div>
              <div className="flex items-center gap-2">
                {alerts.length > 0 && (
                  <Button variant="ghost" size="sm" onClick={clearAlerts} className="h-7 text-xs">
                    Limpar
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={() => setShowAlerts(false)} className="h-7 w-7 p-0">
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {alerts.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhum alerta ativo. Alertas aparecem quando CPU ou RAM ultrapassam 90%.
              </p>
            ) : (
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {alerts.map((alert, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded bg-destructive/10">
                    <div className="flex items-center gap-2">
                      {alert.type === 'cpu' ? (
                        <Cpu className="w-4 h-4 text-destructive" />
                      ) : (
                        <MemoryStick className="w-4 h-4 text-destructive" />
                      )}
                      <span className="text-sm font-medium">
                        {alert.type === 'cpu' ? 'CPU' : 'Memória'} em {alert.value}%
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {alert.time.toLocaleTimeString('pt-BR')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="glass-strong border border-border/50">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="charts" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Gráficos
          </TabsTrigger>
          <TabsTrigger value="network" className="flex items-center gap-2">
            <Network className="w-4 h-4" />
            Rede & Disco
          </TabsTrigger>
          <TabsTrigger value="profiles" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Perfis
          </TabsTrigger>
          <TabsTrigger value="processes" className="flex items-center gap-2">
            <Cpu className="w-4 h-4" />
            Processos
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          {/* CPU Section */}
          <Card className="glass-strong border-border/50">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className={`p-2 rounded-lg ${cpu.usageTotal >= 90 ? 'bg-red-500/20' : 'bg-primary/10'}`}>
                  <Cpu className={`w-5 h-5 ${cpu.usageTotal >= 90 ? 'text-red-500' : 'text-primary'}`} />
                </div>
                <div>
                  <CardTitle className="text-lg">CPU</CardTitle>
                  <CardDescription>Uso total: {cpu.usageTotal}%</CardDescription>
                </div>
                {cpu.usageTotal >= 90 && (
                  <Badge variant="destructive" className="ml-auto">CRÍTICO</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="p-3 rounded-lg bg-muted/30">
                  <p className="text-xs text-muted-foreground mb-1">Uso Total</p>
                  <p className={`text-2xl font-bold ${getStatusColor(cpu.usageTotal)}`}>
                    {cpu.usageTotal}%
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-muted/30">
                  <p className="text-xs text-muted-foreground mb-1">Velocidade</p>
                  <p className="text-2xl font-bold text-foreground">{formatSpeed(cpu.speed)}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/30">
                  <p className="text-xs text-muted-foreground mb-1">Núcleos</p>
                  <p className="text-2xl font-bold text-foreground">{cpu.usagePerCore.length}</p>
                </div>
              </div>

              {/* Per Core Usage */}
              <div>
                <p className="text-sm font-medium mb-3">Uso por Núcleo</p>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                  {cpu.usagePerCore.map((usage, i) => (
                    <div key={i} className="text-center">
                      <div 
                        className="h-16 rounded-lg flex items-end justify-center pb-1 text-xs font-medium transition-all"
                        style={{ 
                          background: `linear-gradient(to top, ${
                            usage > 80 ? 'rgba(239,68,68,0.4)' :
                            usage > 50 ? 'rgba(234,179,8,0.4)' :
                            'rgba(16,185,129,0.4)'
                          } ${usage}%, hsl(var(--muted)/0.2) ${usage}%)`
                        }}
                      >
                        <span className={getStatusColor(usage)}>{usage}%</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground">Core {i}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Memory & Disk */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* RAM */}
            <Card className="glass-strong border-border/50">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-lg ${memory.percent >= 90 ? 'bg-red-500/20' : 'bg-secondary/10'}`}>
                    <MemoryStick className={`w-5 h-5 ${memory.percent >= 90 ? 'text-red-500' : 'text-secondary'}`} />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Memória RAM</CardTitle>
                    <CardDescription>Uso: {memory.percent}%</CardDescription>
                  </div>
                  {memory.percent >= 90 && (
                    <Badge variant="destructive" className="ml-auto">CRÍTICO</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <Progress value={memory.percent} className="h-3" />
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-muted/30">
                    <p className="text-xs text-muted-foreground">Total</p>
                    <p className="text-lg font-bold">{formatBytes(memory.total)}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/30">
                    <p className="text-xs text-muted-foreground">Usada</p>
                    <p className="text-lg font-bold text-secondary">{formatBytes(memory.used)}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/30">
                    <p className="text-xs text-muted-foreground">Livre</p>
                    <p className="text-lg font-bold text-emerald-500">{formatBytes(memory.free)}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/30">
                    <p className="text-xs text-muted-foreground">Percentual</p>
                    <p className={`text-lg font-bold ${getStatusColor(memory.percent)}`}>
                      {memory.percent}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Disk */}
            <Card className="glass-strong border-border/50">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-accent/10">
                    <HardDrive className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Disco</CardTitle>
                    <CardDescription>Uso: {diskPercent}%</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <Progress value={diskPercent} className="h-3" />
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 rounded-lg bg-muted/30">
                    <p className="text-xs text-muted-foreground">Total</p>
                    <p className="text-lg font-bold">{formatBytes(disk.total)}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/30">
                    <p className="text-xs text-muted-foreground">Usado</p>
                    <p className="text-lg font-bold text-accent">{formatBytes(disk.used)}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/30">
                    <p className="text-xs text-muted-foreground">Livre</p>
                    <p className="text-lg font-bold text-emerald-500">{formatBytes(disk.free)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Network & Temperature */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Network */}
            <Card className="glass-strong border-border/50">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-blue-500/10">
                    <Network className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Rede</CardTitle>
                    <CardDescription>Interface: {network.interface}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 rounded-lg bg-muted/30">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-emerald-500">↓</span>
                      <span className="text-xs text-muted-foreground">Download</span>
                    </div>
                    <p className="text-xl font-bold">{network.rx} KB/s</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/30">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-blue-500">↑</span>
                      <span className="text-xs text-muted-foreground">Upload</span>
                    </div>
                    <p className="text-xl font-bold">{network.tx} KB/s</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Temperature */}
            <Card className="glass-strong border-border/50">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-orange-500/10">
                    <Thermometer className="w-5 h-5 text-orange-500" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Temperatura</CardTitle>
                    <CardDescription>Sensores do sistema</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="p-6 rounded-lg bg-muted/30 text-center">
                  {temperature.cpu !== null ? (
                    <>
                      <p className={`text-4xl font-bold ${
                        temperature.cpu > 80 ? 'text-red-500' :
                        temperature.cpu > 60 ? 'text-orange-500' :
                        'text-emerald-500'
                      }`}>
                        {temperature.cpu}°C
                      </p>
                      <p className="text-sm text-muted-foreground mt-2">CPU Temperature</p>
                    </>
                  ) : (
                    <>
                      <p className="text-4xl font-bold text-muted-foreground">N/A</p>
                      <p className="text-sm text-muted-foreground mt-2">Sensor não disponível</p>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Charts Tab */}
        <TabsContent value="charts" className="space-y-4">
          {/* CPU & Memory History */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="glass-strong border-border/50">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">Histórico CPU</CardTitle>
                  <Badge variant="outline" className="text-xs">60s</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={cpuHistory}>
                    <defs>
                      <linearGradient id="cpuGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                    <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" fontSize={9} tickLine={false} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={9} domain={[0, 100]} width={30} />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '6px', fontSize: '11px' }} />
                    <Area type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#cpuGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="glass-strong border-border/50">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">Histórico Memória</CardTitle>
                  <Badge variant="outline" className="text-xs">60s</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={memoryHistory}>
                    <defs>
                      <linearGradient id="memGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--secondary))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--secondary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                    <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" fontSize={9} tickLine={false} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={9} domain={[0, 100]} width={30} />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '6px', fontSize: '11px' }} />
                    <Area type="monotone" dataKey="value" stroke="hsl(var(--secondary))" strokeWidth={2} fill="url(#memGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Per Core History */}
          <Card className="glass-strong border-border/50">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">CPU por Núcleo</CardTitle>
                <div className="flex gap-1 flex-wrap">
                  {cpu.usagePerCore.slice(0, 8).map((_, i) => (
                    <span key={i} className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: `${coreColors[i]}20`, color: coreColors[i] }}>
                      C{i}
                    </span>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={coreHistory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                  <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" fontSize={9} tickLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={9} domain={[0, 100]} width={30} />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '6px', fontSize: '11px' }} />
                  {cpu.usagePerCore.slice(0, 8).map((_, i) => (
                    <Line 
                      key={i} 
                      type="monotone" 
                      dataKey={`core${i}`} 
                      stroke={coreColors[i]} 
                      strokeWidth={1.5}
                      dot={false}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Network History */}
          <Card className="glass-strong border-border/50">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Tráfego de Rede</CardTitle>
                <div className="flex gap-2">
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-500">↓ Download</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-500">↑ Upload</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={networkHistory}>
                  <defs>
                    <linearGradient id="rxGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="txGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                  <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" fontSize={9} tickLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={9} width={40} />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '6px', fontSize: '11px' }} />
                  <Area type="monotone" dataKey="rx" stroke="#22c55e" strokeWidth={2} fill="url(#rxGrad)" name="Download" />
                  <Area type="monotone" dataKey="tx" stroke="#3b82f6" strokeWidth={2} fill="url(#txGrad)" name="Upload" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Network & Disk Tab */}
        <TabsContent value="network" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <NetworkMonitorCard />
            <DiskIOCard />
          </div>
        </TabsContent>

        {/* Performance Profiles Tab */}
        <TabsContent value="profiles" className="space-y-4">
          <PerformanceProfiles />
        </TabsContent>

        {/* Processes Tab */}
        <TabsContent value="processes" className="space-y-4">
          <Card className="glass-strong border-border/50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-primary" />
                  <CardTitle className="text-lg">Processos Ativos</CardTitle>
                  <Badge variant="outline">{processes.length}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9 w-48 h-8 text-sm"
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSortBy(sortBy === 'cpu' ? 'mem' : sortBy === 'mem' ? 'name' : 'cpu')}
                    className="h-8"
                  >
                    <ArrowUpDown className="w-3 h-3 mr-1" />
                    {sortBy === 'cpu' ? 'CPU' : sortBy === 'mem' ? 'RAM' : 'Nome'}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1 max-h-[500px] overflow-y-auto">
                {/* Header */}
                <div className="grid grid-cols-12 gap-2 p-2 text-xs font-medium text-muted-foreground border-b border-border/50">
                  <span className="col-span-4">Nome</span>
                  <span className="col-span-2 text-right">PID</span>
                  <span className="col-span-2 text-right">CPU %</span>
                  <span className="col-span-2 text-right">RAM %</span>
                  <span className="col-span-2 text-right">Ação</span>
                </div>
                
                {filteredProcesses.map((proc, i) => (
                  <div 
                    key={`${proc.pid}-${i}`}
                    className="grid grid-cols-12 gap-2 p-2 rounded-lg hover:bg-muted/30 transition-colors items-center"
                  >
                    <span className="col-span-4 font-medium truncate text-sm">{proc.name}</span>
                    <span className="col-span-2 text-right text-xs text-muted-foreground font-mono">
                      {proc.pid}
                    </span>
                    <span className={`col-span-2 text-right text-sm font-medium ${getStatusColor(proc.cpuPercent)}`}>
                      {proc.cpuPercent.toFixed(1)}%
                    </span>
                    <span className={`col-span-2 text-right text-sm font-medium ${getStatusColor(proc.memPercent)}`}>
                      {proc.memPercent.toFixed(1)}%
                    </span>
                    <div className="col-span-2 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => killProcess(proc.pid, proc.name)}
                        className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <XCircle className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                
                {filteredProcesses.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhum processo encontrado
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Monitoring;
