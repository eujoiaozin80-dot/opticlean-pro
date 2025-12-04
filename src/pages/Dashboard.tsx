import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Trash2, 
  Zap, 
  Activity, 
  Cpu, 
  MemoryStick, 
  HardDrive, 
  Network,
  Thermometer,
  WifiOff, 
  RefreshCw, 
  AlertCircle,
  TrendingUp,
  ArrowUpRight,
  Clock,
  Monitor,
  Bell,
  AlertTriangle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSystemStats } from '@/hooks/useSystemStats';
import { useSystemActions } from '@/hooks/useSystemActions';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const Dashboard = () => {
  const { 
    cpu, 
    memory, 
    disk, 
    network,
    temperature,
    timestamp,
    isLoading, 
    connectionStatus, 
    isElectron: isElectronStats,
    formatBytes,
    formatSpeed,
    cpuHistory,
    memoryHistory,
    alerts,
    hasActiveAlerts
  } = useSystemStats();
  const { cleanSystem, optimizeSystem, analyzeSystem, isProcessing, isElectron } = useSystemActions();

  const getStatusColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-500';
    if (percentage >= 70) return 'text-yellow-500';
    return 'text-emerald-500';
  };

  const getStatusBg = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 70) return 'bg-yellow-500';
    return 'bg-emerald-500';
  };

  const diskPercent = disk.total > 0 ? Math.round((disk.used / disk.total) * 100) : 0;

  const actions = [
    {
      title: 'Limpeza do Sistema',
      description: 'Remover arquivos temporários',
      icon: Trash2,
      action: cleanSystem,
      color: 'primary',
      gradient: 'from-primary/10 to-primary/5'
    },
    {
      title: 'Otimização',
      description: 'Melhorar desempenho',
      icon: Zap,
      action: optimizeSystem,
      color: 'secondary',
      gradient: 'from-secondary/10 to-secondary/5'
    },
    {
      title: 'Análise Completa',
      description: 'Verificar integridade',
      icon: Activity,
      action: analyzeSystem,
      color: 'accent',
      gradient: 'from-accent/10 to-accent/5'
    }
  ];

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-1">Dashboard</h1>
          <p className="text-muted-foreground text-sm">Monitore e otimize o sistema</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Indicador de Alertas */}
          {hasActiveAlerts && (
            <Link to="/monitoring">
              <Badge variant="destructive" className="cursor-pointer animate-pulse">
                <AlertTriangle className="w-3 h-3 mr-1" />
                {alerts.length} Alerta(s)
              </Badge>
            </Link>
          )}
          
          {connectionStatus === 'connected' && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              <span>{new Date(timestamp).toLocaleTimeString('pt-BR')}</span>
            </div>
          )}
          {connectionStatus === 'connected' ? (
            <Badge variant="outline" className="text-emerald-500 border-emerald-500/50 bg-emerald-500/10">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2 animate-pulse" />
              Conectado
            </Badge>
          ) : connectionStatus === 'connecting' ? (
            <Badge variant="outline" className="text-primary border-primary/50">
              <RefreshCw className="w-3 h-3 mr-2 animate-spin" />
              Conectando
            </Badge>
          ) : (
            <Badge variant="outline" className="text-muted-foreground">
              <WifiOff className="w-3 h-3 mr-2" />
              Offline
            </Badge>
          )}
        </div>
      </div>

      {/* Alerta de Recursos Críticos */}
      {(cpu.usageTotal >= 90 || memory.percent >= 90) && connectionStatus === 'connected' && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-red-500/10 border border-red-500/30 animate-fade-in">
          <AlertTriangle className="w-5 h-5 text-red-500" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-500">Recursos em Nível Crítico</p>
            <p className="text-xs text-muted-foreground">
              {cpu.usageTotal >= 90 && `CPU: ${cpu.usageTotal}% `}
              {memory.percent >= 90 && `RAM: ${memory.percent}%`}
              {' '}- Considere fechar programas
            </p>
          </div>
          <Link to="/monitoring">
            <Button variant="outline" size="sm" className="border-red-500/50 text-red-500 hover:bg-red-500/10">
              <Bell className="w-4 h-4 mr-1" />
              Ver Alertas
            </Button>
          </Link>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {actions.map((item, index) => (
          <Card 
            key={item.title} 
            className={`bg-gradient-to-br ${item.gradient} border-border/50 hover-lift`}
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-${item.color}/10`}>
                  <item.icon className={`w-5 h-5 text-${item.color}`} />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold">{item.title}</CardTitle>
                  <CardDescription className="text-xs">{item.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button
                onClick={item.action}
                disabled={isProcessing || !isElectron}
                className="w-full btn-primary"
                size="sm"
              >
                {isProcessing ? 'Processando...' : 'Executar'}
                <ArrowUpRight className="w-4 h-4 ml-1" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Status Banner */}
      {connectionStatus === 'disconnected' && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50 border border-border animate-fade-in">
          <AlertCircle className="w-5 h-5 text-muted-foreground" />
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">Modo Offline</p>
            <p className="text-xs text-muted-foreground">
              Execute o .exe para métricas em tempo real
            </p>
          </div>
          <Link to="/monitoring">
            <Button variant="outline" size="sm">
              <Monitor className="w-4 h-4 mr-2" />
              Ver Detalhes
            </Button>
          </Link>
        </div>
      )}

      {/* Main Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* CPU */}
        <Card className={`metric-card ${cpu.usageTotal >= 90 ? 'border-red-500/50' : ''}`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className={`p-2 rounded-lg ${cpu.usageTotal >= 90 ? 'bg-red-500/20' : 'bg-primary/10'}`}>
                  <Cpu className={`w-4 h-4 ${cpu.usageTotal >= 90 ? 'text-red-500' : 'text-primary'}`} />
                </div>
                <span className="text-sm font-medium">CPU</span>
              </div>
              {connectionStatus === 'connected' && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">LIVE</Badge>
              )}
            </div>
            <div className="space-y-2">
              <div className="flex items-baseline justify-between">
                <span className={`text-2xl font-bold ${getStatusColor(cpu.usageTotal)}`}>
                  {cpu.usageTotal}%
                </span>
                <span className="text-xs text-muted-foreground">
                  {cpu.usagePerCore.length} cores
                </span>
              </div>
              <Progress value={cpu.usageTotal} className={`h-1.5 ${getStatusBg(cpu.usageTotal)}`} />
              <div className="text-xs text-muted-foreground">
                {formatSpeed(cpu.speed)}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Memory */}
        <Card className={`metric-card ${memory.percent >= 90 ? 'border-red-500/50' : ''}`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className={`p-2 rounded-lg ${memory.percent >= 90 ? 'bg-red-500/20' : 'bg-secondary/10'}`}>
                  <MemoryStick className={`w-4 h-4 ${memory.percent >= 90 ? 'text-red-500' : 'text-secondary'}`} />
                </div>
                <span className="text-sm font-medium">RAM</span>
              </div>
              {connectionStatus === 'connected' && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">LIVE</Badge>
              )}
            </div>
            <div className="space-y-2">
              <div className="flex items-baseline justify-between">
                <span className={`text-2xl font-bold ${getStatusColor(memory.percent)}`}>
                  {memory.percent}%
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatBytes(memory.total)}
                </span>
              </div>
              <Progress value={memory.percent} className={`h-1.5 ${getStatusBg(memory.percent)}`} />
              <div className="text-xs text-muted-foreground">
                {formatBytes(memory.used)} / {formatBytes(memory.free)} livre
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Disk */}
        <Card className="metric-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-accent/10">
                  <HardDrive className="w-4 h-4 text-accent" />
                </div>
                <span className="text-sm font-medium">Disco</span>
              </div>
              {connectionStatus === 'connected' && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">LIVE</Badge>
              )}
            </div>
            <div className="space-y-2">
              <div className="flex items-baseline justify-between">
                <span className={`text-2xl font-bold ${getStatusColor(diskPercent)}`}>
                  {diskPercent}%
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatBytes(disk.total)}
                </span>
              </div>
              <Progress value={diskPercent} className={`h-1.5 ${getStatusBg(diskPercent)}`} />
              <div className="text-xs text-muted-foreground">
                {formatBytes(disk.used)} / {formatBytes(disk.free)} livre
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Network & Temperature */}
        <Card className="metric-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Network className="w-4 h-4 text-blue-500" />
                </div>
                <span className="text-sm font-medium">Rede</span>
              </div>
              {connectionStatus === 'connected' && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">LIVE</Badge>
              )}
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">↓ Down</span>
                <span className="font-medium">{network.rx} KB/s</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">↑ Up</span>
                <span className="font-medium">{network.tx} KB/s</span>
              </div>
              <div className="flex items-center gap-2 pt-1 border-t border-border/50">
                <Thermometer className="w-3 h-3 text-orange-500" />
                <span className="text-xs text-muted-foreground">CPU:</span>
                <span className={`text-xs font-medium ${
                  temperature.cpu && temperature.cpu > 70 ? 'text-orange-500' : 'text-foreground'
                }`}>
                  {temperature.cpu !== null ? `${temperature.cpu}°C` : 'N/A'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="metric-card">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-medium">Histórico CPU</CardTitle>
                <CardDescription className="text-xs">Últimos 60 segundos</CardDescription>
              </div>
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={cpuHistory}>
                <defs>
                  <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" fontSize={9} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={9} tickLine={false} axisLine={false} domain={[0, 100]} width={25} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '6px', fontSize: '11px' }} />
                <Area type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#colorCpu)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="metric-card">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-medium">Histórico Memória</CardTitle>
                <CardDescription className="text-xs">Últimos 60 segundos</CardDescription>
              </div>
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={memoryHistory}>
                <defs>
                  <linearGradient id="colorMemory" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--secondary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--secondary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" fontSize={9} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={9} tickLine={false} axisLine={false} domain={[0, 100]} width={25} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '6px', fontSize: '11px' }} />
                <Area type="monotone" dataKey="value" stroke="hsl(var(--secondary))" strokeWidth={2} fill="url(#colorMemory)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Link to Full Monitoring */}
      <Card className="metric-card border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Monitor className="w-5 h-5 text-primary" />
              <div>
                <p className="font-medium">Monitoramento Completo</p>
                <p className="text-xs text-muted-foreground">CPU por núcleo, processos, rede, alertas</p>
              </div>
            </div>
            <Link to="/monitoring">
              <Button variant="outline" size="sm" className="border-primary/50 text-primary hover:bg-primary/10">
                Abrir
                <ArrowUpRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
