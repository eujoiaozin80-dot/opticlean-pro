import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Search, Activity, Wifi, WifiOff, RefreshCw, Cpu } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Process {
  pid: number;
  name: string;
  cpu: number;
  mem: number;
}

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

const isElectron = (): boolean => {
  try {
    return typeof window !== 'undefined' && 
           typeof window.electronAPI !== 'undefined' &&
           window.electronAPI !== null &&
           typeof window.electronAPI.getProcesses === 'function';
  } catch (error) {
    console.error('Erro ao verificar ambiente Electron:', error);
    return false;
  }
};

interface ProcessesProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

const Processes = ({ className, ...props }: ProcessesProps) => {
  const [processes, setProcesses] = useState<Process[]>([]);
  const [filteredProcesses, setFilteredProcesses] = useState<Process[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'cpu' | 'mem'>('cpu');
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const { toast } = useToast();

  const fetchProcesses = useCallback(async () => {
    if (!isElectron()) {
      setConnectionStatus('disconnected');
      setProcesses([]);
      setLoading(false);
      return;
    }

    try {
      setConnectionStatus('connecting');
      const data = await window.electronAPI.getProcesses();
      setProcesses(data || []);
      setConnectionStatus('connected');
      setLoading(false);
    } catch (error) {
      console.error('Erro ao buscar processos:', error);
      setConnectionStatus('error');
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProcesses();
    const interval = setInterval(fetchProcesses, 3000);
    return () => clearInterval(interval);
  }, [fetchProcesses]);

  useEffect(() => {
    const filtered = processes.filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    const sorted = [...filtered].sort((a, b) => {
      if (sortBy === 'cpu') return b.cpu - a.cpu;
      return b.mem - a.mem;
    });

    setFilteredProcesses(sorted);
  }, [processes, searchTerm, sortBy]);

  const killProcess = async (pid: number, name: string) => {
    if (!isElectron()) {
      toast({
        title: 'Modo Offline',
        description: 'Esta função requer o aplicativo Electron',
        variant: 'default'
      });
      return;
    }

    try {
      const result = await window.electronAPI.killProcess(pid);
      if (result.success) {
        toast({
          title: 'Processo finalizado',
          description: `${name} foi finalizado com sucesso`,
        });
        fetchProcesses();
      } else {
        toast({
          title: 'Erro',
          description: result.error || 'Não foi possível finalizar o processo',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: `Não foi possível finalizar ${name}`,
        variant: 'destructive'
      });
    }
  };

  const getCpuColor = (cpu: number) => {
    if (cpu >= 50) return 'text-destructive';
    if (cpu >= 20) return 'text-warning';
    return 'text-success';
  };

  return (
    <div className={`space-y-6 animate-fade-up ${className || ''}`} {...props}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-1">
            Processos
          </h1>
          <p className="text-muted-foreground text-sm">
            Monitore e controle os processos em execução
          </p>
        </div>
        <div className="flex items-center gap-2">
          {connectionStatus === 'connected' ? (
            <div className="flex items-center gap-2 text-sm text-success bg-success/10 px-3 py-1.5 rounded-full">
              <div className="status-online" />
              <span className="font-medium">Conectado</span>
            </div>
          ) : connectionStatus === 'connecting' ? (
            <div className="flex items-center gap-2 text-sm text-primary bg-primary/10 px-3 py-1.5 rounded-full">
              <RefreshCw className="w-3 h-3 animate-spin" />
              <span className="font-medium">Conectando...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted px-3 py-1.5 rounded-full">
              <WifiOff className="w-3 h-3" />
              <span className="font-medium">Offline</span>
            </div>
          )}
        </div>
      </div>

      {/* Offline Banner */}
      {connectionStatus === 'disconnected' && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50 border border-border animate-fade-in">
          <WifiOff className="w-5 h-5 text-muted-foreground" />
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">Modo Offline</p>
            <p className="text-xs text-muted-foreground">
              Execute o Electron para ver processos reais: <code className="px-1.5 py-0.5 bg-background rounded text-primary">npm run electron:dev</code>
            </p>
          </div>
        </div>
      )}

      {/* Controls */}
      <Card className="metric-card">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-primary" />
              <CardTitle className="text-sm font-medium">Processos Ativos</CardTitle>
            </div>
            <span className="text-xs text-muted-foreground">
              {filteredProcesses.length} encontrados
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar processo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-9 bg-input border-border input-focus"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={sortBy === 'cpu' ? 'default' : 'outline'}
                onClick={() => setSortBy('cpu')}
                size="sm"
                className={sortBy === 'cpu' ? 'btn-primary' : ''}
              >
                CPU
              </Button>
              <Button
                variant={sortBy === 'mem' ? 'default' : 'outline'}
                onClick={() => setSortBy('mem')}
                size="sm"
                className={sortBy === 'mem' ? 'btn-primary' : ''}
              >
                Memória
              </Button>
            </div>
          </div>

          {/* Process List */}
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-14 bg-muted/30 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : connectionStatus === 'disconnected' ? (
            <div className="text-center py-12">
              <Activity className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">
                Conecte via Electron para ver os processos
              </p>
            </div>
          ) : filteredProcesses.length === 0 ? (
            <div className="text-center py-12">
              <Search className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">
                Nenhum processo encontrado
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {filteredProcesses.map((process, index) => (
                <div
                  key={process.pid}
                  className="flex items-center justify-between p-3 bg-background/50 rounded-lg border border-border/50 hover:border-primary/20 transition-all animate-fade-up"
                  style={{ animationDelay: `${index * 0.02}s` }}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-foreground truncate mb-1">
                      {process.name}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="font-mono">PID: {process.pid}</span>
                      <span className={getCpuColor(process.cpu)}>
                        CPU: {process.cpu.toFixed(1)}%
                      </span>
                      <span className="text-secondary">
                        RAM: {process.mem.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => killProcess(process.pid, process.name)}
                    className="ml-4 text-destructive hover:text-destructive hover:bg-destructive/10"
                    disabled={connectionStatus !== 'connected'}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Processes;
