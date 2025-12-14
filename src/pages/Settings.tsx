import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import UserProfile from '@/components/UserProfile';
import { OutletContext } from '@/types/outlet-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/hooks/useTheme';
import { useOperationHistory } from '@/hooks/useOperationHistory';
import { useSystemStats } from '@/hooks/useSystemStats';
import { generatePdfReport } from '@/utils/generatePdfReport';
import { ScheduledTasksPanel } from '@/components/ScheduledTasksPanel';
import { useToast } from '@/hooks/use-toast';
import { 
  User, Settings2, Sun, Moon, Bell, Download, History, 
  Trash2, Shield, Clock, CheckCircle, AlertCircle, Loader2,
  FileText, Calendar, RefreshCw
} from 'lucide-react';
import { UpdateDialog } from '@/components/UpdateDialog';

interface SettingsProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

const Settings = ({ className, ...props }: SettingsProps) => {
  const { userId } = useOutletContext<OutletContext>();
  const { theme, toggleTheme } = useTheme();
  const { operations, loading: historyLoading } = useOperationHistory(userId);
  const systemStats = useSystemStats();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState(true);
  const [autoClean, setAutoClean] = useState(false);
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [appVersion, setAppVersion] = useState<string>('');
  
  const exportPdfReport = () => {
    try {
      generatePdfReport({
        metrics: {
          cpu: systemStats.cpu || { usageTotal: 0, speed: 0, usagePerCore: [] },
          memory: systemStats.memory || { total: 0, used: 0, free: 0, percent: 0 },
          disk: systemStats.disk || { total: 0, used: 0, free: 0 },
          network: systemStats.network || { rx: 0, tx: 0, interface: 'N/A' },
          temperature: systemStats.temperature || { cpu: null },
        },
        operations,
        cpuHistory: systemStats.cpuHistory || [],
        memoryHistory: systemStats.memoryHistory || [],
      });
      toast({ title: 'Relatório Exportado', description: 'PDF salvo com sucesso!' });
    } catch (error) {
      toast({ title: 'Erro', description: 'Falha ao gerar PDF', variant: 'destructive' });
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const getOperationIcon = (type: string) => {
    switch (type) {
      case 'cleaning': return <Trash2 className="w-4 h-4 text-primary" />;
      case 'optimization': return <Settings2 className="w-4 h-4 text-secondary" />;
      case 'security': return <Shield className="w-4 h-4 text-success" />;
      default: return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-3.5 h-3.5 text-success" />;
      case 'failed': return <AlertCircle className="w-3.5 h-3.5 text-destructive" />;
      default: return <Clock className="w-3.5 h-3.5 text-warning" />;
    }
  };

  // Obter versão do app
  useEffect(() => {
    if (typeof window !== 'undefined' && window.electronAPI) {
      window.electronAPI.getAppVersion().then(version => {
        setAppVersion(version);
      });
    }
  }, []);
  
  return (
    <div className={`space-y-6 animate-fade-up ${className || ''}`} {...props}>
      <div>
        <h1 className="text-2xl font-bold text-foreground mb-1">Configurações</h1>
        <p className="text-muted-foreground text-sm">Personalize sua experiência no OptiClean Pro</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList className="glass-strong border border-border/50">
          <TabsTrigger value="profile" className="flex items-center gap-2"><User className="w-4 h-4" />Perfil</TabsTrigger>
          <TabsTrigger value="preferences" className="flex items-center gap-2"><Settings2 className="w-4 h-4" />Preferências</TabsTrigger>
          <TabsTrigger value="schedule" className="flex items-center gap-2"><Calendar className="w-4 h-4" />Agendamento</TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2"><History className="w-4 h-4" />Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="profile"><UserProfile userId={userId} /></TabsContent>

        <TabsContent value="preferences" className="space-y-4">
          <div className="grid gap-4 max-w-xl">
            <Card className="metric-card">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  {theme === 'dark' ? <Moon className="w-4 h-4 text-primary" /> : <Sun className="w-4 h-4 text-warning" />}
                  <CardTitle className="text-sm font-medium">Aparência</CardTitle>
                </div>
                <CardDescription className="text-xs">Escolha o tema da interface</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3"><Sun className="w-4 h-4 text-muted-foreground" /><span className="text-sm">Claro</span></div>
                  <Switch checked={theme === 'dark'} onCheckedChange={toggleTheme} />
                  <div className="flex items-center gap-3"><span className="text-sm">Escuro</span><Moon className="w-4 h-4 text-muted-foreground" /></div>
                </div>
              </CardContent>
            </Card>

            <Card className="metric-card">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2"><Bell className="w-4 h-4 text-secondary" /><CardTitle className="text-sm font-medium">Notificações</CardTitle></div>
                <CardDescription className="text-xs">Alertas do sistema</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="notifications" className="text-sm">Alertas de recurso crítico</Label>
                  <Switch id="notifications" checked={notifications} onCheckedChange={setNotifications} />
                </div>
              </CardContent>
            </Card>

            <Card className="metric-card">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2"><Download className="w-4 h-4 text-accent" /><CardTitle className="text-sm font-medium">Exportar</CardTitle></div>
              </CardHeader>
              <CardContent>
                <Button onClick={exportPdfReport} className="w-full btn-primary">
                  <FileText className="w-4 h-4 mr-2" />Exportar Relatório PDF
                </Button>
              </CardContent>
            </Card>

            {typeof window !== 'undefined' && window.electronAPI && (
              <Card className="metric-card">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 text-primary" />
                    <CardTitle className="text-sm font-medium">Atualizações</CardTitle>
                  </div>
                  <CardDescription className="text-xs">
                    {appVersion && `Versão atual: ${appVersion}`}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    onClick={() => setShowUpdateDialog(true)} 
                    className="w-full btn-primary"
                    variant="outline"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Verificar Atualizações
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="schedule"><ScheduledTasksPanel /></TabsContent>

        <TabsContent value="history">
          <Card className="metric-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2"><History className="w-4 h-4 text-primary" />Histórico de Operações</CardTitle>
            </CardHeader>
            <CardContent>
              {historyLoading ? (
                <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
              ) : operations.length === 0 ? (
                <div className="text-center py-12"><History className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" /><p className="text-muted-foreground text-sm">Nenhuma operação registrada</p></div>
              ) : (
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {operations.map((op, i) => (
                    <div key={op.id} className="flex items-center justify-between p-3 bg-background/50 rounded-lg border border-border/50">
                      <div className="flex items-center gap-3">{getOperationIcon(op.operation_type)}<div><p className="text-sm font-medium">{op.operation_name}</p></div></div>
                      <div className="flex items-center gap-3"><span className="text-xs text-muted-foreground">{formatDate(op.created_at)}</span>{getStatusIcon(op.status)}</div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Update Dialog */}
      {typeof window !== 'undefined' && window.electronAPI && (
        <UpdateDialog open={showUpdateDialog} onOpenChange={setShowUpdateDialog} />
      )}
    </div>
  );
};

export default Settings;
