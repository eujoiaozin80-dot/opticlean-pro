import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Rocket, CheckCircle2, XCircle, WifiOff, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface StartupProgram {
  name: string;
  path: string;
  enabled: boolean;
}

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

const isElectron = (): boolean => {
  return typeof window !== 'undefined' && 
         typeof window.electronAPI !== 'undefined' &&
         window.electronAPI !== null &&
         typeof window.electronAPI.getStartupPrograms === 'function';
};

interface StartupProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

const Startup = ({ className, ...props }: StartupProps) => {
  const [programs, setPrograms] = useState<StartupProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const { toast } = useToast();

  const fetchStartupPrograms = useCallback(async () => {
    if (!isElectron()) {
      setConnectionStatus('disconnected');
      setPrograms([]);
      setLoading(false);
      return;
    }

    try {
      setConnectionStatus('connecting');
      const data = await window.electronAPI.getStartupPrograms();
      setPrograms(data || []);
      setConnectionStatus('connected');
      setLoading(false);
    } catch (error) {
      setConnectionStatus('error');
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStartupPrograms();
  }, [fetchStartupPrograms]);

  const toggleProgram = (index: number) => {
    if (!isElectron()) return;

    const newPrograms = [...programs];
    newPrograms[index].enabled = !newPrograms[index].enabled;
    setPrograms(newPrograms);

    toast({
      title: newPrograms[index].enabled ? 'Ativado' : 'Desativado',
      description: `${newPrograms[index].name} ${newPrograms[index].enabled ? 'iniciará' : 'não iniciará'} com o Windows`,
    });
  };

  const enabledCount = programs.filter(p => p.enabled).length;
  const disabledCount = programs.length - enabledCount;

  return (
    <div className={`space-y-6 animate-fade-up ${className || ''}`} {...props}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-1">Inicialização</h1>
          <p className="text-muted-foreground text-sm">Gerencie programas que iniciam com o Windows</p>
        </div>
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

      {/* Offline Banner */}
      {connectionStatus === 'disconnected' && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50 border border-border animate-fade-in">
          <WifiOff className="w-5 h-5 text-muted-foreground" />
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">Modo Offline</p>
            <p className="text-xs text-muted-foreground">
              Execute o Electron para gerenciar programas: <code className="px-1.5 py-0.5 bg-background rounded text-primary">npm run electron:dev</code>
            </p>
          </div>
        </div>
      )}

      {/* Stats */}
      {connectionStatus === 'connected' && (
        <div className="grid grid-cols-2 gap-4">
          <Card className="metric-card">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase">Ativos</p>
                <p className="text-2xl font-bold text-success">{enabledCount}</p>
              </div>
              <CheckCircle2 className="w-5 h-5 text-success" />
            </CardContent>
          </Card>
          <Card className="metric-card">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase">Desativados</p>
                <p className="text-2xl font-bold text-muted-foreground">{disabledCount}</p>
              </div>
              <XCircle className="w-5 h-5 text-muted-foreground" />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Programs List */}
      <Card className="metric-card">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Rocket className="w-4 h-4 text-primary" />
            <CardTitle className="text-sm font-medium">Programas</CardTitle>
          </div>
          <CardDescription className="text-xs">Desative programas para melhorar o tempo de boot</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-14 bg-muted/30 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : connectionStatus === 'disconnected' ? (
            <div className="text-center py-12">
              <Rocket className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">Conecte via Electron</p>
            </div>
          ) : programs.length === 0 ? (
            <div className="text-center py-12">
              <Rocket className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">Nenhum programa encontrado</p>
            </div>
          ) : (
            <div className="space-y-2">
              {programs.map((program, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-background/50 rounded-lg border border-border/50 hover:border-primary/20 transition-all animate-fade-up"
                  style={{ animationDelay: `${index * 0.02}s` }}
                >
                  <div className="flex-1 min-w-0 mr-4">
                    <p className="text-sm font-medium truncate">{program.name}</p>
                    {program.path && (
                      <p className="text-[10px] text-muted-foreground truncate">{program.path}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-medium ${program.enabled ? 'text-success' : 'text-muted-foreground'}`}>
                      {program.enabled ? 'Ativo' : 'Inativo'}
                    </span>
                    <Switch
                      checked={program.enabled}
                      onCheckedChange={() => toggleProgram(index)}
                      disabled={connectionStatus !== 'connected'}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Startup;
