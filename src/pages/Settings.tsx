import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import UserProfile from '@/components/UserProfile';
import { OutletContext } from '@/types/outlet-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { useTheme } from '@/hooks/useTheme';
import { useOperationHistory } from '@/hooks/useOperationHistory';
import { useSystemStats } from '@/hooks/useSystemStats';
import { generatePdfReport } from '@/utils/generatePdfReport';
import { ScheduledTasksPanel } from '@/components/ScheduledTasksPanel';
import { LoginHistoryPanel } from '@/components/LoginHistoryPanel';
import { DiscordSettings } from '@/components/DiscordSettings';
import { useToast } from '@/hooks/use-toast';
import { 
  User, Settings2, Sun, Moon, Bell, Download, History, 
  Trash2, Shield, Clock, CheckCircle, AlertCircle, Loader2,
  FileText, Calendar, RefreshCw, Lock, Palette, Volume2, VolumeX,
  Monitor, Gauge, Database, Keyboard, Globe, Info, MessageSquare,
  Cpu, MemoryStick, HardDrive, Wifi, Languages, Accessibility
} from 'lucide-react';
import { UpdateDialog } from '@/components/UpdateDialog';

interface SettingsProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

// Configurações salvas no localStorage
interface AppSettings {
  // Aparência
  theme: 'dark' | 'light' | 'system';
  accentColor: string;
  fontSize: number;
  compactMode: boolean;
  animations: boolean;
  
  // Notificações
  desktopNotifications: boolean;
  soundEnabled: boolean;
  soundVolume: number;
  cpuAlertThreshold: number;
  memoryAlertThreshold: number;
  diskAlertThreshold: number;
  
  // Sistema
  autoClean: boolean;
  autoCleanInterval: number;
  autoOptimize: boolean;
  startWithWindows: boolean;
  minimizeToTray: boolean;
  
  // Dados
  keepHistoryDays: number;
  autoExportReports: boolean;
  
  // Acessibilidade
  highContrast: boolean;
  reducedMotion: boolean;
  
  // Idioma
  language: string;
}

const defaultSettings: AppSettings = {
  theme: 'dark',
  accentColor: '#8b5cf6',
  fontSize: 14,
  compactMode: false,
  animations: true,
  desktopNotifications: true,
  soundEnabled: true,
  soundVolume: 50,
  cpuAlertThreshold: 80,
  memoryAlertThreshold: 80,
  diskAlertThreshold: 90,
  autoClean: false,
  autoCleanInterval: 24,
  autoOptimize: false,
  startWithWindows: false,
  minimizeToTray: true,
  keepHistoryDays: 30,
  autoExportReports: false,
  highContrast: false,
  reducedMotion: false,
  language: 'pt-BR',
};

const Settings = ({ className, ...props }: SettingsProps) => {
  const { userId } = useOutletContext<OutletContext>();
  const { theme, toggleTheme } = useTheme();
  const { operations, loading: historyLoading } = useOperationHistory(userId);
  const systemStats = useSystemStats();
  const { toast } = useToast();
  
  const [appSettings, setAppSettings] = useState<AppSettings>(defaultSettings);
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [appVersion, setAppVersion] = useState<string>('');
  const [clearingCache, setClearingCache] = useState(false);
  const [exportingData, setExportingData] = useState(false);
  
  // Carregar configurações salvas
  useEffect(() => {
    const saved = localStorage.getItem('app_settings');
    if (saved) {
      setAppSettings({ ...defaultSettings, ...JSON.parse(saved) });
    }
  }, []);

  // Salvar configurações
  const saveSettings = (newSettings: Partial<AppSettings>) => {
    const updated = { ...appSettings, ...newSettings };
    setAppSettings(updated);
    localStorage.setItem('app_settings', JSON.stringify(updated));
  };
  
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

  const exportAllData = async () => {
    setExportingData(true);
    try {
      const data = {
        settings: appSettings,
        operations,
        systemStats: {
          cpu: systemStats.cpu,
          memory: systemStats.memory,
          disk: systemStats.disk,
        },
        exportDate: new Date().toISOString(),
      };
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `opticlean-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({ title: 'Dados Exportados', description: 'Backup salvo com sucesso!' });
    } catch (error) {
      toast({ title: 'Erro', description: 'Falha ao exportar dados', variant: 'destructive' });
    } finally {
      setExportingData(false);
    }
  };

  const clearCache = async () => {
    setClearingCache(true);
    try {
      // Limpar localStorage exceto configurações essenciais
      const keysToKeep = ['app_settings', 'discord_webhook_url', 'discord_notifications_enabled'];
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (!keysToKeep.includes(key)) {
          localStorage.removeItem(key);
        }
      });
      
      toast({ title: 'Cache Limpo', description: 'Dados em cache foram removidos' });
    } catch (error) {
      toast({ title: 'Erro', description: 'Falha ao limpar cache', variant: 'destructive' });
    } finally {
      setClearingCache(false);
    }
  };

  const resetSettings = () => {
    setAppSettings(defaultSettings);
    localStorage.setItem('app_settings', JSON.stringify(defaultSettings));
    toast({ title: 'Configurações Resetadas', description: 'Voltou para configurações padrão' });
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

  // Atalhos de teclado
  const shortcuts = [
    { keys: 'Ctrl + 1', action: 'Limpeza rápida' },
    { keys: 'Ctrl + 2', action: 'Otimização' },
    { keys: 'Ctrl + 3', action: 'Análise completa' },
    { keys: 'Ctrl + R', action: 'Atualizar métricas' },
    { keys: 'Ctrl + E', action: 'Exportar relatório' },
  ];
  
  return (
    <div className={`space-y-6 animate-fade-up ${className || ''}`} {...props}>
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-1">Configurações</h1>
          <p className="text-muted-foreground text-sm">Personalize sua experiência no OptiClean Pro</p>
        </div>
        {appVersion && (
          <div className="text-xs text-muted-foreground flex items-center gap-2">
            <Info className="w-3 h-3" />
            Versão {appVersion}
          </div>
        )}
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList className="glass-strong border border-border/50 flex-wrap h-auto p-1">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="w-4 h-4" />Perfil
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex items-center gap-2">
            <Palette className="w-4 h-4" />Aparência
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="w-4 h-4" />Notificações
          </TabsTrigger>
          <TabsTrigger value="discord" className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />Discord
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center gap-2">
            <Settings2 className="w-4 h-4" />Sistema
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Lock className="w-4 h-4" />Segurança
          </TabsTrigger>
          <TabsTrigger value="schedule" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />Agendamento
          </TabsTrigger>
          <TabsTrigger value="data" className="flex items-center gap-2">
            <Database className="w-4 h-4" />Dados
          </TabsTrigger>
          <TabsTrigger value="shortcuts" className="flex items-center gap-2">
            <Keyboard className="w-4 h-4" />Atalhos
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="w-4 h-4" />Histórico
          </TabsTrigger>
        </TabsList>

        {/* Perfil */}
        <TabsContent value="profile">
          <UserProfile userId={userId} />
        </TabsContent>

        {/* Aparência */}
        <TabsContent value="appearance" className="space-y-4">
          <div className="grid gap-4 max-w-2xl">
            <Card className="metric-card">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  {theme === 'dark' ? <Moon className="w-4 h-4 text-primary" /> : <Sun className="w-4 h-4 text-warning" />}
                  <CardTitle className="text-sm font-medium">Tema</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Sun className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">Claro</span>
                  </div>
                  <Switch checked={theme === 'dark'} onCheckedChange={toggleTheme} />
                  <div className="flex items-center gap-3">
                    <span className="text-sm">Escuro</span>
                    <Moon className="w-4 h-4 text-muted-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="metric-card">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Palette className="w-4 h-4 text-secondary" />
                  <CardTitle className="text-sm font-medium">Personalização Visual</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm">Tamanho da Fonte</Label>
                  <div className="flex items-center gap-4">
                    <Slider
                      value={[appSettings.fontSize]}
                      onValueChange={([value]) => saveSettings({ fontSize: value })}
                      min={12}
                      max={18}
                      step={1}
                      className="flex-1"
                    />
                    <span className="text-sm text-muted-foreground w-8">{appSettings.fontSize}px</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm">Modo Compacto</Label>
                    <p className="text-xs text-muted-foreground">Reduz espaçamentos</p>
                  </div>
                  <Switch
                    checked={appSettings.compactMode}
                    onCheckedChange={(value) => saveSettings({ compactMode: value })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm">Animações</Label>
                    <p className="text-xs text-muted-foreground">Transições e efeitos</p>
                  </div>
                  <Switch
                    checked={appSettings.animations}
                    onCheckedChange={(value) => saveSettings({ animations: value })}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="metric-card">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Accessibility className="w-4 h-4 text-accent" />
                  <CardTitle className="text-sm font-medium">Acessibilidade</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm">Alto Contraste</Label>
                    <p className="text-xs text-muted-foreground">Aumenta contraste visual</p>
                  </div>
                  <Switch
                    checked={appSettings.highContrast}
                    onCheckedChange={(value) => saveSettings({ highContrast: value })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm">Reduzir Movimentos</Label>
                    <p className="text-xs text-muted-foreground">Minimiza animações</p>
                  </div>
                  <Switch
                    checked={appSettings.reducedMotion}
                    onCheckedChange={(value) => saveSettings({ reducedMotion: value })}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Notificações */}
        <TabsContent value="notifications" className="space-y-4">
          <div className="grid gap-4 max-w-2xl">
            <Card className="metric-card">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-secondary" />
                  <CardTitle className="text-sm font-medium">Notificações Desktop</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm">Alertas do Sistema</Label>
                    <p className="text-xs text-muted-foreground">Notificações do Windows</p>
                  </div>
                  <Switch
                    checked={appSettings.desktopNotifications}
                    onCheckedChange={(value) => saveSettings({ desktopNotifications: value })}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="metric-card">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  {appSettings.soundEnabled ? <Volume2 className="w-4 h-4 text-primary" /> : <VolumeX className="w-4 h-4 text-muted-foreground" />}
                  <CardTitle className="text-sm font-medium">Sons</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Sons de Notificação</Label>
                  <Switch
                    checked={appSettings.soundEnabled}
                    onCheckedChange={(value) => saveSettings({ soundEnabled: value })}
                  />
                </div>
                
                {appSettings.soundEnabled && (
                  <div className="space-y-2">
                    <Label className="text-sm">Volume</Label>
                    <div className="flex items-center gap-4">
                      <Slider
                        value={[appSettings.soundVolume]}
                        onValueChange={([value]) => saveSettings({ soundVolume: value })}
                        min={0}
                        max={100}
                        step={10}
                        className="flex-1"
                      />
                      <span className="text-sm text-muted-foreground w-8">{appSettings.soundVolume}%</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="metric-card">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Gauge className="w-4 h-4 text-accent" />
                  <CardTitle className="text-sm font-medium">Limites de Alerta</CardTitle>
                </div>
                <CardDescription className="text-xs">
                  Defina quando receber alertas de recursos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-primary" />
                    <Label className="text-sm">Alerta de CPU</Label>
                  </div>
                  <div className="flex items-center gap-4">
                    <Slider
                      value={[appSettings.cpuAlertThreshold]}
                      onValueChange={([value]) => saveSettings({ cpuAlertThreshold: value })}
                      min={50}
                      max={95}
                      step={5}
                      className="flex-1"
                    />
                    <span className="text-sm text-muted-foreground w-12">{appSettings.cpuAlertThreshold}%</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <MemoryStick className="w-4 h-4 text-secondary" />
                    <Label className="text-sm">Alerta de Memória</Label>
                  </div>
                  <div className="flex items-center gap-4">
                    <Slider
                      value={[appSettings.memoryAlertThreshold]}
                      onValueChange={([value]) => saveSettings({ memoryAlertThreshold: value })}
                      min={50}
                      max={95}
                      step={5}
                      className="flex-1"
                    />
                    <span className="text-sm text-muted-foreground w-12">{appSettings.memoryAlertThreshold}%</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <HardDrive className="w-4 h-4 text-accent" />
                    <Label className="text-sm">Alerta de Disco</Label>
                  </div>
                  <div className="flex items-center gap-4">
                    <Slider
                      value={[appSettings.diskAlertThreshold]}
                      onValueChange={([value]) => saveSettings({ diskAlertThreshold: value })}
                      min={70}
                      max={98}
                      step={2}
                      className="flex-1"
                    />
                    <span className="text-sm text-muted-foreground w-12">{appSettings.diskAlertThreshold}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Discord */}
        <TabsContent value="discord">
          <div className="max-w-2xl">
            <DiscordSettings />
          </div>
        </TabsContent>

        {/* Sistema */}
        <TabsContent value="system" className="space-y-4">
          <div className="grid gap-4 max-w-2xl">
            <Card className="metric-card">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Monitor className="w-4 h-4 text-primary" />
                  <CardTitle className="text-sm font-medium">Comportamento</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm">Iniciar com Windows</Label>
                    <p className="text-xs text-muted-foreground">Abrir automaticamente</p>
                  </div>
                  <Switch
                    checked={appSettings.startWithWindows}
                    onCheckedChange={(value) => saveSettings({ startWithWindows: value })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm">Minimizar para Bandeja</Label>
                    <p className="text-xs text-muted-foreground">Ao fechar janela</p>
                  </div>
                  <Switch
                    checked={appSettings.minimizeToTray}
                    onCheckedChange={(value) => saveSettings({ minimizeToTray: value })}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="metric-card">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Trash2 className="w-4 h-4 text-secondary" />
                  <CardTitle className="text-sm font-medium">Limpeza Automática</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm">Ativar Limpeza Automática</Label>
                    <p className="text-xs text-muted-foreground">Limpar arquivos temporários</p>
                  </div>
                  <Switch
                    checked={appSettings.autoClean}
                    onCheckedChange={(value) => saveSettings({ autoClean: value })}
                  />
                </div>

                {appSettings.autoClean && (
                  <div className="space-y-2">
                    <Label className="text-sm">Intervalo (horas)</Label>
                    <Select
                      value={String(appSettings.autoCleanInterval)}
                      onValueChange={(value) => saveSettings({ autoCleanInterval: Number(value) })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="6">A cada 6 horas</SelectItem>
                        <SelectItem value="12">A cada 12 horas</SelectItem>
                        <SelectItem value="24">Diariamente</SelectItem>
                        <SelectItem value="168">Semanalmente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm">Otimização Automática</Label>
                    <p className="text-xs text-muted-foreground">Quando CPU/RAM altos</p>
                  </div>
                  <Switch
                    checked={appSettings.autoOptimize}
                    onCheckedChange={(value) => saveSettings({ autoOptimize: value })}
                  />
                </div>
              </CardContent>
            </Card>

            {typeof window !== 'undefined' && window.electronAPI && (
              <Card className="metric-card">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 text-accent" />
                    <CardTitle className="text-sm font-medium">Atualizações</CardTitle>
                  </div>
                  <CardDescription className="text-xs">
                    {appVersion && `Versão atual: ${appVersion}`}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    onClick={() => setShowUpdateDialog(true)} 
                    className="w-full"
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

        {/* Segurança */}
        <TabsContent value="security">
          <LoginHistoryPanel userId={userId} />
        </TabsContent>

        {/* Agendamento */}
        <TabsContent value="schedule">
          <ScheduledTasksPanel />
        </TabsContent>

        {/* Dados */}
        <TabsContent value="data" className="space-y-4">
          <div className="grid gap-4 max-w-2xl">
            <Card className="metric-card">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Download className="w-4 h-4 text-primary" />
                  <CardTitle className="text-sm font-medium">Exportar Dados</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button onClick={exportPdfReport} className="w-full" variant="outline">
                  <FileText className="w-4 h-4 mr-2" />
                  Exportar Relatório PDF
                </Button>
                <Button onClick={exportAllData} className="w-full" variant="outline" disabled={exportingData}>
                  {exportingData ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Database className="w-4 h-4 mr-2" />}
                  Exportar Todos os Dados (JSON)
                </Button>
              </CardContent>
            </Card>

            <Card className="metric-card">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-secondary" />
                  <CardTitle className="text-sm font-medium">Retenção de Dados</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm">Manter histórico por</Label>
                  <Select
                    value={String(appSettings.keepHistoryDays)}
                    onValueChange={(value) => saveSettings({ keepHistoryDays: Number(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">7 dias</SelectItem>
                      <SelectItem value="30">30 dias</SelectItem>
                      <SelectItem value="90">90 dias</SelectItem>
                      <SelectItem value="365">1 ano</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card className="metric-card border-destructive/30">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Trash2 className="w-4 h-4 text-destructive" />
                  <CardTitle className="text-sm font-medium text-destructive">Zona de Perigo</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button onClick={clearCache} className="w-full" variant="outline" disabled={clearingCache}>
                  {clearingCache ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
                  Limpar Cache do App
                </Button>
                <Button onClick={resetSettings} className="w-full" variant="destructive">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Restaurar Configurações Padrão
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Atalhos */}
        <TabsContent value="shortcuts">
          <Card className="metric-card max-w-2xl">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Keyboard className="w-4 h-4 text-primary" />
                <CardTitle className="text-sm font-medium">Atalhos de Teclado</CardTitle>
              </div>
              <CardDescription className="text-xs">
                Use atalhos para ações rápidas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {shortcuts.map((shortcut, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-background/50 rounded-lg border border-border/50"
                  >
                    <span className="text-sm">{shortcut.action}</span>
                    <kbd className="px-2 py-1 text-xs bg-muted rounded border border-border">
                      {shortcut.keys}
                    </kbd>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Histórico */}
        <TabsContent value="history">
          <Card className="metric-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <History className="w-4 h-4 text-primary" />
                Histórico de Operações
              </CardTitle>
            </CardHeader>
            <CardContent>
              {historyLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : operations.length === 0 ? (
                <div className="text-center py-12">
                  <History className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
                  <p className="text-muted-foreground text-sm">Nenhuma operação registrada</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {operations.map((op) => (
                    <div key={op.id} className="flex items-center justify-between p-3 bg-background/50 rounded-lg border border-border/50">
                      <div className="flex items-center gap-3">
                        {getOperationIcon(op.operation_type)}
                        <div>
                          <p className="text-sm font-medium">{op.operation_name}</p>
                          {op.details && <p className="text-xs text-muted-foreground">{op.details}</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground">{formatDate(op.created_at)}</span>
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

      {/* Update Dialog */}
      {typeof window !== 'undefined' && window.electronAPI && (
        <UpdateDialog open={showUpdateDialog} onOpenChange={setShowUpdateDialog} />
      )}
    </div>
  );
};

export default Settings;
