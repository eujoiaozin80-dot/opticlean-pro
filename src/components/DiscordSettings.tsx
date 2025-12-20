import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import {
  MessageSquare,
  Bell,
  Cpu,
  MemoryStick,
  HardDrive,
  Shield,
  Loader2,
  CheckCircle,
  AlertCircle,
  Settings,
  Trash2,
  Zap,
  Users,
  Key,
  LogIn,
  RefreshCw,
} from 'lucide-react';
import {
  setWebhookUrl,
  getStoredWebhookUrl,
  isDiscordEnabled,
  setDiscordEnabled,
  testWebhookConnection,
} from '@/services/discordWebhook';

interface NotificationSettings {
  cpuAlerts: boolean;
  memoryAlerts: boolean;
  diskAlerts: boolean;
  cleaningComplete: boolean;
  optimizationComplete: boolean;
  newUsers: boolean;
  codeUsed: boolean;
  codeExpiring: boolean;
  loginAlerts: boolean;
  updateAvailable: boolean;
}

const defaultSettings: NotificationSettings = {
  cpuAlerts: true,
  memoryAlerts: true,
  diskAlerts: true,
  cleaningComplete: true,
  optimizationComplete: true,
  newUsers: true,
  codeUsed: true,
  codeExpiring: true,
  loginAlerts: false,
  updateAvailable: true,
};

export const DiscordSettings = () => {
  const { toast } = useToast();
  const [webhookUrl, setWebhookUrlState] = useState('');
  const [enabled, setEnabled] = useState(false);
  const [testing, setTesting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'connected' | 'error'>('unknown');
  const [settings, setSettings] = useState<NotificationSettings>(defaultSettings);

  useEffect(() => {
    // Carregar configurações salvas
    const savedUrl = getStoredWebhookUrl();
    const savedEnabled = isDiscordEnabled();
    
    if (savedUrl) {
      setWebhookUrlState(savedUrl);
    }
    setEnabled(savedEnabled);

    // Carregar configurações de notificação
    const savedSettings = localStorage.getItem('discord_notification_settings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);

  const handleSaveWebhook = () => {
    // Validação mais flexível para webhooks Discord
    const webhookPattern = /^https:\/\/(discord\.com|discordapp\.com)\/api\/webhooks\/\d+\/[\w-]+$/;
    if (!webhookUrl.trim() || (!webhookUrl.includes('discord.com/api/webhooks/') && !webhookUrl.includes('discordapp.com/api/webhooks/'))) {
      toast({
        title: 'URL Inválida',
        description: 'A URL deve ser um webhook do Discord (discord.com/api/webhooks/...)',
        variant: 'destructive',
      });
      return;
    }

    setWebhookUrl(webhookUrl);
    toast({
      title: 'Webhook Salvo',
      description: 'URL do webhook salva com sucesso',
    });
  };

  const handleTestConnection = async () => {
    if (!webhookUrl) {
      toast({
        title: 'Webhook não configurado',
        description: 'Configure a URL do webhook primeiro',
        variant: 'destructive',
      });
      return;
    }

    setTesting(true);
    setWebhookUrl(webhookUrl);
    setDiscordEnabled(true);

    try {
      const success = await testWebhookConnection();
      
      if (success) {
        setConnectionStatus('connected');
        toast({
          title: 'Conexão OK!',
          description: 'Mensagem de teste enviada com sucesso',
        });
      } else {
        setConnectionStatus('error');
        toast({
          title: 'Erro na Conexão',
          description: 'Não foi possível enviar mensagem de teste',
          variant: 'destructive',
        });
      }
    } catch (error) {
      setConnectionStatus('error');
      toast({
        title: 'Erro',
        description: 'Falha ao testar conexão',
        variant: 'destructive',
      });
    } finally {
      setTesting(false);
    }
  };

  const handleToggleEnabled = (value: boolean) => {
    setEnabled(value);
    setDiscordEnabled(value);
    toast({
      title: value ? 'Notificações Ativadas' : 'Notificações Desativadas',
      description: value 
        ? 'Você receberá alertas no Discord' 
        : 'Alertas do Discord foram desativados',
    });
  };

  const handleSettingChange = (key: keyof NotificationSettings, value: boolean) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    localStorage.setItem('discord_notification_settings', JSON.stringify(newSettings));
  };

  const notificationOptions = [
    { key: 'cpuAlerts' as const, label: 'Alertas de CPU', icon: Cpu, description: 'Quando CPU > 80%' },
    { key: 'memoryAlerts' as const, label: 'Alertas de Memória', icon: MemoryStick, description: 'Quando RAM > 80%' },
    { key: 'diskAlerts' as const, label: 'Alertas de Disco', icon: HardDrive, description: 'Quando disco > 90%' },
    { key: 'cleaningComplete' as const, label: 'Limpeza Concluída', icon: Trash2, description: 'Ao finalizar limpeza' },
    { key: 'optimizationComplete' as const, label: 'Otimização Concluída', icon: Zap, description: 'Ao finalizar otimização' },
    { key: 'newUsers' as const, label: 'Novos Usuários', icon: Users, description: 'Quando alguém se registrar' },
    { key: 'codeUsed' as const, label: 'Código Usado', icon: Key, description: 'Quando código for ativado' },
    { key: 'codeExpiring' as const, label: 'Código Expirando', icon: Shield, description: 'Códigos prestes a expirar' },
    { key: 'loginAlerts' as const, label: 'Alertas de Login', icon: LogIn, description: 'Logins e tentativas' },
    { key: 'updateAvailable' as const, label: 'Atualizações', icon: RefreshCw, description: 'Nova versão disponível' },
  ];

  return (
    <Card className="metric-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#5865F2]/20">
              <MessageSquare className="w-5 h-5 text-[#5865F2]" />
            </div>
            <div>
              <CardTitle className="text-base">Notificações Discord</CardTitle>
              <CardDescription className="text-xs">
                Receba alertas do sistema no seu servidor Discord
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {connectionStatus === 'connected' && (
              <Badge variant="outline" className="text-emerald-500 border-emerald-500/50">
                <CheckCircle className="w-3 h-3 mr-1" />
                Conectado
              </Badge>
            )}
            {connectionStatus === 'error' && (
              <Badge variant="outline" className="text-destructive border-destructive/50">
                <AlertCircle className="w-3 h-3 mr-1" />
                Erro
              </Badge>
            )}
            <Switch
              checked={enabled}
              onCheckedChange={handleToggleEnabled}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Configuração do Webhook */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">URL do Webhook</Label>
          <div className="flex gap-2">
            <Input
              type="url"
              placeholder="https://discord.com/api/webhooks/..."
              value={webhookUrl}
              onChange={(e) => setWebhookUrlState(e.target.value)}
              className="flex-1"
            />
            <Button onClick={handleSaveWebhook} variant="outline" size="sm">
              Salvar
            </Button>
            <Button 
              onClick={handleTestConnection} 
              variant="outline" 
              size="sm"
              disabled={testing || !webhookUrl}
            >
              {testing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Testar'
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Crie um webhook em Configurações do Servidor → Integrações → Webhooks
          </p>
        </div>

        <Separator />

        {/* Configurações de Notificação */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-muted-foreground" />
            <Label className="text-sm font-medium">Tipos de Notificação</Label>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {notificationOptions.map((option) => {
              const Icon = option.icon;
              return (
                <div
                  key={option.key}
                  className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border/50"
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{option.label}</p>
                      <p className="text-xs text-muted-foreground">{option.description}</p>
                    </div>
                  </div>
                  <Switch
                    checked={settings[option.key]}
                    onCheckedChange={(value) => handleSettingChange(option.key, value)}
                    disabled={!enabled}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DiscordSettings;
