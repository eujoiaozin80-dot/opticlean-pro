import { useState, useEffect, useRef } from 'react';
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
import { useLanguage } from '@/hooks/useLanguage';
import { useSystemStats } from '@/hooks/useSystemStats';
import { DiscordSettings } from '@/components/DiscordSettings';
import { useToast } from '@/hooks/use-toast';
import { 
  User, Settings2, Sun, Moon, Bell, Download, 
  Trash2, Shield, Clock, CheckCircle, AlertCircle, Loader2,
  FileText, RefreshCw, Lock, Palette, Volume2, VolumeX,
  Monitor, Gauge, Wifi, Languages, Accessibility, Camera, Upload
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
  
  // Perfil
  profileImage: string;
  userName: string;
  userEmail: string;
  
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
  profileImage: '',
  userName: '',
  userEmail: '',
  highContrast: false,
  reducedMotion: false,
  language: 'pt-BR',
};

const Settings = ({ className, ...props }: SettingsProps) => {
  const { userId } = useOutletContext<OutletContext>();
  const { theme, setTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const systemStats = useSystemStats();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [loading, setLoading] = useState(false);
  const [profileImagePreview, setProfileImagePreview] = useState<string>('');

  // Carregar configurações do localStorage
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem('appSettings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        setSettings({ ...defaultSettings, ...parsed });
        if (parsed.profileImage) {
          setProfileImagePreview(parsed.profileImage);
        }
        // Sincronizar com os hooks
        if (parsed.theme) setTheme(parsed.theme);
        if (parsed.language) setLanguage(parsed.language);
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    }
  }, [setTheme, setLanguage]);

  // Salvar configurações no localStorage
  const saveSettings = (newSettings: Partial<AppSettings>) => {
    try {
      const updatedSettings = { ...settings, ...newSettings };
      setSettings(updatedSettings);
      localStorage.setItem('appSettings', JSON.stringify(updatedSettings));
      
      // Sincronizar com os hooks
      if (newSettings.theme !== undefined) setTheme(newSettings.theme);
      if (newSettings.language !== undefined) setLanguage(newSettings.language as 'pt-BR' | 'en-US' | 'es-ES');
      
      toast({
        title: 'Configurações salvas',
        description: 'Suas configurações foram salvas com sucesso',
      });
    } catch (error) {
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar as configurações',
        variant: 'destructive',
      });
    }
  };

  // Função para upload de imagem
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'Arquivo muito grande',
          description: 'A imagem deve ter no máximo 5MB',
          variant: 'destructive',
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string;
        setProfileImagePreview(imageUrl);
        saveSettings({ profileImage: imageUrl });
      };
      reader.readAsDataURL(file);
    }
  };

  // Função para remover imagem
  const handleRemoveImage = () => {
    setProfileImagePreview('');
    saveSettings({ profileImage: '' });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Aplicar configurações de aparência (exceto tema)
  useEffect(() => {
    const root = document.documentElement;
    
    // Font size
    root.style.fontSize = `${settings.fontSize}px`;

    // Compact mode
    if (settings.compactMode) {
      root.classList.add('compact-mode');
    } else {
      root.classList.remove('compact-mode');
    }

    // Animations
    if (settings.animations) {
      root.classList.remove('reduce-motion');
    } else {
      root.classList.add('reduce-motion');
    }

    // High contrast
    if (settings.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }

    // Reduced motion
    if (settings.reducedMotion) {
      root.classList.add('reduce-motion');
    } else {
      root.classList.remove('reduce-motion');
    }
  }, [settings.fontSize, settings.compactMode, settings.animations, settings.highContrast, settings.reducedMotion]);

  
  return (
    <div className={`space-y-6 animate-fade-up ${className || ''}`} {...props}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-1">Configurações</h1>
          <p className="text-muted-foreground text-sm">Personalize sua experiência no Byte Latency</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => saveSettings(defaultSettings)}>
            <RefreshCw className="w-4 h-4 mr-1" />
            Restaurar Padrão
          </Button>
        </div>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            Perfil
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex items-center gap-2">
            <Palette className="w-4 h-4" />
            Aparência
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="w-4 h-4" />
            Notificações
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center gap-2">
            <Gauge className="w-4 h-4" />
            Sistema
          </TabsTrigger>
        </TabsList>

        {/* Perfil */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Foto de Perfil
              </CardTitle>
              <CardDescription>
                Adicione uma foto personalizada ao seu perfil
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="relative">
                  {profileImagePreview ? (
                    <img
                      src={profileImagePreview}
                      alt="Foto de perfil"
                      className="w-20 h-20 rounded-full object-cover border-2 border-border"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-muted border-2 border-border flex items-center justify-center">
                      <User className="w-8 h-8 text-muted-foreground" />
                    </div>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    className="absolute -bottom-2 -right-2 rounded-full w-8 h-8 p-0"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Camera className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex-1">
                  <p className="font-medium">Foto do Perfil</p>
                  <p className="text-sm text-muted-foreground">
                    Clique na câmera para alterar sua foto
                  </p>
                  {profileImagePreview && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleRemoveImage}
                      className="mt-2 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Remover foto
                    </Button>
                  )}
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Informações Pessoais</CardTitle>
              <CardDescription>
                Atualize suas informações de perfil
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="userName">Nome</Label>
                <Input
                  id="userName"
                  placeholder="Seu nome"
                  value={settings.userName}
                  onChange={(e) => saveSettings({ userName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="userEmail">E-mail</Label>
                <Input
                  id="userEmail"
                  type="email"
                  placeholder="seu@email.com"
                  value={settings.userEmail}
                  onChange={(e) => saveSettings({ userEmail: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aparência */}
        <TabsContent value="appearance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5" />
                Tema
              </CardTitle>
              <CardDescription>
                Escolha o tema visual que prefere
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant={settings.theme === 'light' ? 'default' : 'outline'}
                  onClick={() => saveSettings({ theme: 'light' })}
                  className="flex items-center gap-2"
                >
                  <Sun className="w-4 h-4" />
                  Claro
                </Button>
                <Button
                  variant={settings.theme === 'dark' ? 'default' : 'outline'}
                  onClick={() => saveSettings({ theme: 'dark' })}
                  className="flex items-center gap-2"
                >
                  <Moon className="w-4 h-4" />
                  Escuro
                </Button>
                <Button
                  variant={settings.theme === 'system' ? 'default' : 'outline'}
                  onClick={() => saveSettings({ theme: 'system' })}
                  className="flex items-center gap-2"
                >
                  <Monitor className="w-4 h-4" />
                  Sistema
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Personalização</CardTitle>
              <CardDescription>
                Ajuste a aparência da interface
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Tamanho da Fonte</Label>
                  <span className="text-sm text-muted-foreground">{settings.fontSize}px</span>
                </div>
                <Slider
                  value={[settings.fontSize]}
                  onValueChange={([value]) => saveSettings({ fontSize: value })}
                  min={12}
                  max={20}
                  step={1}
                  className="w-full"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Modo Compacto</Label>
                  <p className="text-sm text-muted-foreground">
                    Reduz o espaçamento entre elementos
                  </p>
                </div>
                <Switch
                  checked={settings.compactMode}
                  onCheckedChange={(checked) => saveSettings({ compactMode: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Animações</Label>
                  <p className="text-sm text-muted-foreground">
                    Habilitar animações e transições
                  </p>
                </div>
                <Switch
                  checked={settings.animations}
                  onCheckedChange={(checked) => saveSettings({ animations: checked })}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Accessibility className="w-5 h-5" />
                Acessibilidade
              </CardTitle>
              <CardDescription>
                Opções para melhorar a acessibilidade
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Alto Contraste</Label>
                  <p className="text-sm text-muted-foreground">
                    Aumenta o contraste das cores
                  </p>
                </div>
                <Switch
                  checked={settings.highContrast}
                  onCheckedChange={(checked) => saveSettings({ highContrast: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Reduzir Movimento</Label>
                  <p className="text-sm text-muted-foreground">
                    Minimiza animações e efeitos visuais
                  </p>
                </div>
                <Switch
                  checked={settings.reducedMotion}
                  onCheckedChange={(checked) => saveSettings({ reducedMotion: checked })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notificações */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Notificações do Sistema
              </CardTitle>
              <CardDescription>
                Configure como e quando receber alertas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Notificações Desktop</Label>
                  <p className="text-sm text-muted-foreground">
                    Mostrar notificações nativas do sistema
                  </p>
                </div>
                <Switch
                  checked={settings.desktopNotifications}
                  onCheckedChange={(checked) => saveSettings({ desktopNotifications: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Som de Notificação</Label>
                  <p className="text-sm text-muted-foreground">
                    Reproduzir som ao receber alertas
                  </p>
                </div>
                <Switch
                  checked={settings.soundEnabled}
                  onCheckedChange={(checked) => saveSettings({ soundEnabled: checked })}
                />
              </div>

              {settings.soundEnabled && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Volume do Som</Label>
                    <span className="text-sm text-muted-foreground">{settings.soundVolume}%</span>
                  </div>
                  <Slider
                    value={[settings.soundVolume]}
                    onValueChange={([value]) => saveSettings({ soundVolume: value })}
                    min={0}
                    max={100}
                    step={5}
                    className="w-full"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Alertas de Recursos</CardTitle>
              <CardDescription>
                Defina limites para alertas automáticos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Alerta de CPU</Label>
                  <span className="text-sm text-muted-foreground">{settings.cpuAlertThreshold}%</span>
                </div>
                <Slider
                  value={[settings.cpuAlertThreshold]}
                  onValueChange={([value]) => saveSettings({ cpuAlertThreshold: value })}
                  min={50}
                  max={95}
                  step={5}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Alerta de Memória</Label>
                  <span className="text-sm text-muted-foreground">{settings.memoryAlertThreshold}%</span>
                </div>
                <Slider
                  value={[settings.memoryAlertThreshold]}
                  onValueChange={([value]) => saveSettings({ memoryAlertThreshold: value })}
                  min={50}
                  max={95}
                  step={5}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Alerta de Disco</Label>
                  <span className="text-sm text-muted-foreground">{settings.diskAlertThreshold}%</span>
                </div>
                <Slider
                  value={[settings.diskAlertThreshold]}
                  onValueChange={([value]) => saveSettings({ diskAlertThreshold: value })}
                  min={70}
                  max={95}
                  step={5}
                  className="w-full"
                />
              </div>
            </CardContent>
          </Card>

          <DiscordSettings />
        </TabsContent>

        {/* Sistema */}
        <TabsContent value="system" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings2 className="w-5 h-5" />
                Automação
              </CardTitle>
              <CardDescription>
                Configure tarefas automáticas do sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Limpeza Automática</Label>
                  <p className="text-sm text-muted-foreground">
                    Limpar arquivos temporários automaticamente
                  </p>
                </div>
                <Switch
                  checked={settings.autoClean}
                  onCheckedChange={(checked) => saveSettings({ autoClean: checked })}
                />
              </div>

              {settings.autoClean && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Intervalo (horas)</Label>
                    <span className="text-sm text-muted-foreground">{settings.autoCleanInterval}h</span>
                  </div>
                  <Slider
                    value={[settings.autoCleanInterval]}
                    onValueChange={([value]) => saveSettings({ autoCleanInterval: value })}
                    min={1}
                    max={72}
                    step={1}
                    className="w-full"
                  />
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Otimização Automática</Label>
                  <p className="text-sm text-muted-foreground">
                    Otimizar sistema automaticamente
                  </p>
                </div>
                <Switch
                  checked={settings.autoOptimize}
                  onCheckedChange={(checked) => saveSettings({ autoOptimize: checked })}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Inicialização</CardTitle>
              <CardDescription>
                Configure como o aplicativo inicia
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Iniciar com Windows</Label>
                  <p className="text-sm text-muted-foreground">
                    Iniciar automaticamente com o sistema
                  </p>
                </div>
                <Switch
                  checked={settings.startWithWindows}
                  onCheckedChange={(checked) => saveSettings({ startWithWindows: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Minimizar para Bandeja</Label>
                  <p className="text-sm text-muted-foreground">
                    Minimizar para a bandeja do sistema ao fechar
                  </p>
                </div>
                <Switch
                  checked={settings.minimizeToTray}
                  onCheckedChange={(checked) => saveSettings({ minimizeToTray: checked })}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Languages className="w-5 h-5" />
                Idioma
              </CardTitle>
              <CardDescription>
                Selecione seu idioma preferido
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Select
                value={settings.language}
                onValueChange={(value) => saveSettings({ language: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o idioma" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                  <SelectItem value="en-US">English (US)</SelectItem>
                  <SelectItem value="es-ES">Español</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* <UpdateDialog /> */}
    </div>
  );
};

export default Settings;
