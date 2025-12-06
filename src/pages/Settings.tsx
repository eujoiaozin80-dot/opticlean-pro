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
import { 
  User, Settings2, Sun, Moon, Bell, Download, History, 
  Trash2, Shield, Clock, CheckCircle, AlertCircle, Loader2 
} from 'lucide-react';
import { useState } from 'react';

interface SettingsProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

const Settings = ({ className, ...props }: SettingsProps = {}) => {
  const { userId } = useOutletContext<OutletContext>();
  const { theme, toggleTheme } = useTheme();
  const { operations, loading: historyLoading } = useOperationHistory(userId);
  const [notifications, setNotifications] = useState(true);
  const [autoClean, setAutoClean] = useState(false);
  
  const exportReport = () => {
    const report = {
      exportDate: new Date().toISOString(),
      userId,
      operations: operations.slice(0, 20),
      settings: {
        theme,
        notifications,
        autoClean
      }
    };
    
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `opticlean-report-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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
  
  return (
    <div className={`space-y-6 animate-fade-up ${className || ''}`} {...props}>
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground mb-1">
          Configurações
        </h1>
        <p className="text-muted-foreground text-sm">
          Personalize sua experiência no OptiClean Pro
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList className="glass-strong border border-border/50">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            Perfil
          </TabsTrigger>
          <TabsTrigger value="preferences" className="flex items-center gap-2">
            <Settings2 className="w-4 h-4" />
            Preferências
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="w-4 h-4" />
            Histórico
          </TabsTrigger>
        </TabsList>

        {/* Tab: Perfil */}
        <TabsContent value="profile">
          <UserProfile userId={userId} />
        </TabsContent>

        {/* Tab: Preferências */}
        <TabsContent value="preferences" className="space-y-4">
          <div className="grid gap-4 max-w-xl">
            {/* Tema */}
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
                  <div className="flex items-center gap-3">
                    <Sun className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">Modo Claro</span>
                  </div>
                  <Switch
                    checked={theme === 'dark'}
                    onCheckedChange={toggleTheme}
                  />
                  <div className="flex items-center gap-3">
                    <span className="text-sm">Modo Escuro</span>
                    <Moon className="w-4 h-4 text-muted-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notificações */}
            <Card className="metric-card">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-secondary" />
                  <CardTitle className="text-sm font-medium">Notificações</CardTitle>
                </div>
                <CardDescription className="text-xs">Gerencie alertas do sistema</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="notifications" className="text-sm">Alertas de recurso crítico</Label>
                  <Switch
                    id="notifications"
                    checked={notifications}
                    onCheckedChange={setNotifications}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="auto-clean" className="text-sm">Limpeza automática semanal</Label>
                  <Switch
                    id="auto-clean"
                    checked={autoClean}
                    onCheckedChange={setAutoClean}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Exportar */}
            <Card className="metric-card">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Download className="w-4 h-4 text-accent" />
                  <CardTitle className="text-sm font-medium">Exportar Dados</CardTitle>
                </div>
                <CardDescription className="text-xs">Baixe um relatório completo</CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={exportReport} 
                  variant="outline" 
                  className="w-full border-accent/30 text-accent hover:bg-accent/10"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Exportar Relatório (JSON)
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab: Histórico */}
        <TabsContent value="history">
          <Card className="metric-card">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <History className="w-4 h-4 text-primary" />
                    Histórico de Operações
                  </CardTitle>
                  <CardDescription className="text-xs">Últimas 50 operações realizadas</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {historyLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : operations.length === 0 ? (
                <div className="text-center py-12">
                  <History className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
                  <p className="text-muted-foreground text-sm">
                    Nenhuma operação registrada ainda
                  </p>
                  <p className="text-muted-foreground text-xs mt-1">
                    As operações aparecerão aqui quando você usar o app no modo desktop
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {operations.map((op, index) => (
                    <div
                      key={op.id}
                      className="flex items-center justify-between p-3 bg-background/50 rounded-lg border border-border/50 hover:border-primary/20 transition-all animate-fade-up"
                      style={{ animationDelay: `${index * 0.02}s` }}
                    >
                      <div className="flex items-center gap-3">
                        {getOperationIcon(op.operation_type)}
                        <div>
                          <p className="text-sm font-medium">{op.operation_name}</p>
                          {op.details && (
                            <p className="text-xs text-muted-foreground">{op.details}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground hidden sm:block">
                          {formatDate(op.created_at)}
                        </span>
                        {getStatusIcon(op.status)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
