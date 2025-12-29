import { useState, useEffect, useCallback } from 'react';
import { 
  Trash2, 
  Zap, 
  Activity, 
  Wrench, 
  Settings, 
  LogOut,
  Sparkles,
  Cpu,
  HardDrive,
  MemoryStick,
  Key,
  Copy,
  Check,
  Users,
  User as UserIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import UserProfile from './UserProfile';
import { useSystemMetrics } from '@/hooks/useSystemMetrics';
import { useSystemActions } from '@/hooks/useSystemActions';
import { Database } from '@/integrations/supabase/types';

type ActivationCode = Database['public']['Tables']['activation_codes']['Row'] & { user_email?: string };
type UserProfile = Database['public']['Tables']['profiles']['Row'];

interface DashboardProps {
  onLogout: () => void;
  userId: string;
  userRole: string;
}

const Dashboard = ({ onLogout, userId, userRole }: DashboardProps) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showUserManagement, setShowUserManagement] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [activationCodes, setActivationCodes] = useState<ActivationCode[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const { toast } = useToast();
  const { cpu, memory, disk, isLoading: metricsLoading } = useSystemMetrics();
  const { cleanSystem, optimizeSystem, analyzeSystem, isProcessing, isElectron } = useSystemActions();

  const isFounder = userRole === 'founder';

  const loadActivationCodes = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('activation_codes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setActivationCodes(data || []);
    } catch (error: unknown) {
      console.error('Erro ao carregar códigos:', error);
    }
  }, []);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error: unknown) {
      console.error('Erro ao carregar usuários:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os usuários',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const generateActivationCode = async () => {
    setLoading(true);
    try {
      // Gerar código aleatório
      const code = Array.from({ length: 3 }, () =>
        Math.random().toString(36).substring(2, 6).toUpperCase()
      ).join('-');

      const { error } = await supabase
        .from('activation_codes')
        .insert({
          code,
          created_by: userId,
        });

      if (error) throw error;

      toast({
        title: "Código gerado!",
        description: `Código: ${code}`,
      });

      loadActivationCodes();
    } catch (error: unknown) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isFounder && showAdminPanel) {
      loadActivationCodes();
    }
  }, [isFounder, showAdminPanel, loadActivationCodes]);

  useEffect(() => {
    if (isFounder && showUserManagement) {
      loadUsers();
    }
  }, [isFounder, showUserManagement, loadUsers]);

  const toggleUserStatus = async (targetUserId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: !currentStatus })
        .eq('id', targetUserId);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: `Usuário ${!currentStatus ? 'ativado' : 'desativado'} com sucesso`
      });

      loadUsers();
    } catch (error: unknown) {
      console.error('Erro ao atualizar status:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o status do usuário',
        variant: 'destructive'
      });
    }
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast({
      title: "Copiado!",
      description: "Código copiado para a área de transferência",
    });
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const menuItems = [
    { id: 'dashboard', icon: Activity, label: 'Painel' },
    { id: 'clean', icon: Trash2, label: 'Limpeza' },
    { id: 'optimize', icon: Zap, label: 'Otimização' },
    { id: 'analyze', icon: HardDrive, label: 'Análise' },
    { id: 'tools', icon: Wrench, label: 'Ferramentas' },
    { id: 'settings', icon: Settings, label: 'Configurações' },
  ];

  // Profile View
  if (showProfile) {
    return (
      <div className="min-h-screen flex">
        {/* Sidebar */}
        <aside className="w-64 bg-card/80 backdrop-blur-xl border-r border-border/50 p-4 flex flex-col">
          <div className="flex items-center gap-3 mb-8 pb-4 border-b border-border/50">
            <div className="relative">
              <Sparkles className="w-8 h-8 text-primary animate-pulse-glow" />
            </div>
            <div>
              <h2 className="font-bold text-lg">Byte Latency</h2>
              <p className="text-xs text-muted-foreground">v1.0.0</p>
            </div>
          </div>

          <nav className="flex-1 space-y-2">
            <button
              onClick={() => setShowProfile(false)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-all duration-300"
            >
              <Activity className="w-5 h-5" />
              <span className="font-medium">Voltar ao Painel</span>
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-primary/20 text-primary border border-primary/30 neon-glow-cyan">
              <UserIcon className="w-5 h-5" />
              <span className="font-medium">Meu Perfil</span>
            </button>
          </nav>

          <Button
            onClick={onLogout}
            variant="outline"
            className="w-full border-destructive/50 text-destructive hover:bg-destructive/10 mt-4"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </Button>
        </aside>

        {/* Main Content - Profile */}
        <main className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Meu Perfil
              </h1>
              <p className="text-muted-foreground">
                Gerencie suas informações pessoais
              </p>
            </div>
            <UserProfile userId={userId} />
          </div>
        </main>
      </div>
    );
  }

  // User Management View
  if (isFounder && showUserManagement) {
    return (
      <div className="min-h-screen flex">
        {/* Sidebar */}
        <aside className="w-64 bg-card/80 backdrop-blur-xl border-r border-border/50 p-4 flex flex-col">
          <div className="flex items-center gap-3 mb-8 pb-4 border-b border-border/50">
            <div className="relative">
              <Sparkles className="w-8 h-8 text-primary animate-pulse-glow" />
            </div>
            <div>
              <h2 className="font-bold text-lg">Byte Latency</h2>
              <p className="text-xs text-primary">Fundador</p>
            </div>
          </div>

          <nav className="flex-1 space-y-2">
            <button
              onClick={() => setShowUserManagement(false)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-all duration-300"
            >
              <Activity className="w-5 h-5" />
              <span className="font-medium">Voltar ao Painel</span>
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-primary/20 text-primary border border-primary/30 neon-glow-cyan">
              <Users className="w-5 h-5" />
              <span className="font-medium">Gerenciar Usuários</span>
            </button>
          </nav>

          <Button
            onClick={onLogout}
            variant="outline"
            className="w-full border-destructive/50 text-destructive hover:bg-destructive/10 mt-4"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </Button>
        </aside>

        {/* Main Content - User Management */}
        <main className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-6xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Gerenciamento de Usuários
              </h1>
              <p className="text-muted-foreground">
                Gerencie todos os usuários do sistema
              </p>
            </div>

            <Card className="bg-card/50 backdrop-blur border-border/50">
              <CardHeader>
                <CardTitle>Usuários Cadastrados</CardTitle>
                <CardDescription>
                  Total: {users.length} usuários
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p className="text-center text-muted-foreground py-8">Carregando...</p>
                ) : users.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Nenhum usuário encontrado</p>
                ) : (
                  <div className="space-y-4">
                    {users.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center justify-between p-4 bg-background/50 rounded-lg border border-border/50 hover:border-primary/30 transition-all"
                      >
                        <div className="flex items-center gap-4">
                          <Avatar className="w-12 h-12">
                            <AvatarImage src={user.avatar_url} />
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {user.full_name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-foreground">
                              {user.full_name || 'Sem nome'}
                            </p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant={user.role === 'founder' ? 'default' : 'secondary'}>
                                {user.role === 'founder' ? 'Fundador' : 'Usuário'}
                              </Badge>
                              <Badge variant={user.is_active ? 'default' : 'destructive'}>
                                {user.is_active ? 'Ativo' : 'Inativo'}
                              </Badge>
                              {user.last_login && (
                                <span className="text-xs text-muted-foreground">
                                  Último acesso: {new Date(user.last_login).toLocaleDateString('pt-BR')}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant={user.is_active ? 'destructive' : 'default'}
                            onClick={() => toggleUserStatus(user.id, user.is_active)}
                            disabled={user.role === 'founder'}
                          >
                            {user.is_active ? 'Desativar' : 'Ativar'}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  // Admin Panel View
  if (isFounder && showAdminPanel) {
    return (
      <div className="min-h-screen flex">
        {/* Sidebar */}
        <aside className="w-64 bg-card/80 backdrop-blur-xl border-r border-border/50 p-4 flex flex-col">
          <div className="flex items-center gap-3 mb-8 pb-4 border-b border-border/50">
            <div className="relative">
              <Sparkles className="w-8 h-8 text-primary animate-pulse-glow" />
            </div>
            <div>
              <h2 className="font-bold text-lg">Byte Latency</h2>
              <p className="text-xs text-primary">Fundador</p>
            </div>
          </div>

          <nav className="flex-1 space-y-2">
            <button
              onClick={() => setShowAdminPanel(false)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-all duration-300"
            >
              <Activity className="w-5 h-5" />
              <span className="font-medium">Voltar ao Painel</span>
            </button>
            <button
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-primary/20 text-primary border border-primary/30 neon-glow-cyan"
            >
              <Key className="w-5 h-5" />
              <span className="font-medium">Códigos de Ativação</span>
            </button>
          </nav>

          <Button
            onClick={onLogout}
            variant="outline"
            className="w-full border-destructive/50 text-destructive hover:bg-destructive/10 mt-4"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </Button>
        </aside>

        {/* Main Content - Admin */}
        <main className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-6xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Painel do Fundador
              </h1>
              <p className="text-muted-foreground">
                Gerenciamento de Códigos de Ativação
              </p>
            </div>

            {/* Generate Code */}
            <Card className="bg-card/50 backdrop-blur border-primary/30 neon-glow-cyan mb-6">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Gerar Novo Código</CardTitle>
                    <CardDescription>
                      Crie códigos de ativação para novos usuários
                    </CardDescription>
                  </div>
                  <Button
                    onClick={generateActivationCode}
                    disabled={loading}
                    className="bg-gradient-to-r from-primary to-primary-glow hover:opacity-90 text-primary-foreground"
                  >
                    <Key className="mr-2 h-4 w-4" />
                    {loading ? 'Gerando...' : 'Gerar Código'}
                  </Button>
                </div>
              </CardHeader>
            </Card>

            {/* Codes List */}
            <Card className="bg-card/50 backdrop-blur border-border/50">
              <CardHeader>
                <CardTitle>Códigos de Ativação</CardTitle>
                <CardDescription>
                  Lista de todos os códigos gerados
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {activationCodes.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      Nenhum código gerado ainda
                    </p>
                  ) : (
                    activationCodes.map((code) => (
                      <div
                        key={code.id}
                        className="flex items-center justify-between p-4 bg-background/50 rounded-lg border border-primary/20"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <code className="text-lg font-mono font-semibold text-primary">
                              {code.code}
                            </code>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => copyToClipboard(code.code)}
                              className="h-8 w-8 p-0"
                            >
                              {copiedCode === code.code ? (
                                <Check className="h-4 w-4" style={{ color: 'hsl(var(--success))' }} />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                          <div className="text-sm text-muted-foreground mt-1">
                            {code.is_used ? (
                              <Badge variant="default" className="bg-success text-success-foreground">
                                ✓ Usado em {new Date(code.used_at).toLocaleString('pt-BR')}
                              </Badge>
                            ) : (
                              <Badge variant="secondary">⏳ Aguardando uso</Badge>
                            )}
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(code.created_at).toLocaleDateString('pt-BR')}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  // Normal Dashboard View
  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 bg-card/80 backdrop-blur-xl border-r border-border/50 p-4 flex flex-col">
        <div className="flex items-center gap-3 mb-8 pb-4 border-b border-border/50">
          <div className="relative">
            <Sparkles className="w-8 h-8 text-primary animate-pulse-glow" />
          </div>
          <div>
            <h2 className="font-bold text-lg">Byte Latency</h2>
            <p className="text-xs text-muted-foreground">v1.0.0</p>
          </div>
        </div>

        <nav className="flex-1 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 ${
                  activeTab === item.id
                    ? 'bg-primary/20 text-primary border border-primary/30 neon-glow-cyan'
                    : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
          <button
            onClick={() => setShowProfile(true)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-all duration-300 border-t border-border/50 mt-4 pt-4"
          >
            <UserIcon className="w-5 h-5" />
            <span className="font-medium">Meu Perfil</span>
          </button>
          {isFounder && (
            <>
              <button
                onClick={() => setShowUserManagement(true)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-all duration-300"
              >
                <Users className="w-5 h-5" />
                <span className="font-medium">Gerenciar Usuários</span>
              </button>
              <button
                onClick={() => setShowAdminPanel(true)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-all duration-300"
              >
                <Key className="w-5 h-5" />
                <span className="font-medium">Códigos de Ativação</span>
              </button>
            </>
          )}
        </nav>

        <Button
          onClick={onLogout}
          variant="outline"
          className="w-full border-destructive/50 text-destructive hover:bg-destructive/10 mt-4"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sair
        </Button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Painel de Controle
            </h1>
            <p className="text-muted-foreground">
              Sistema em perfeito estado de funcionamento
            </p>
          </div>

          {/* System Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="bg-card/50 backdrop-blur border-primary/30 neon-glow-cyan">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-primary" />
                  CPU
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold mb-2">
                  {metricsLoading ? '...' : `${cpu.usage}%`}
                </div>
                <Progress value={cpu.usage} className="h-2" />
                <p className="text-xs text-muted-foreground mt-2">
                  {cpu.cores} núcleos{cpu.temperature > 0 ? ` • ${cpu.temperature}°C` : ''}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur border-secondary/30 neon-glow-purple">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <MemoryStick className="w-4 h-4 text-secondary" />
                  RAM
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold mb-2">
                  {metricsLoading ? '...' : `${memory.percent}%`}
                </div>
                <Progress value={memory.percent} className="h-2" />
                <p className="text-xs text-muted-foreground mt-2">
                  {memory.used} GB / {memory.total} GB
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur border-success/30 neon-glow-green">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-success" />
                  Armazenamento
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold mb-2">
                  {metricsLoading ? '...' : `${disk.percent}%`}
                </div>
                <Progress value={disk.percent} className="h-2" />
                <p className="text-xs text-muted-foreground mt-2">
                  {disk.used} GB / {disk.total} GB
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Function Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-card/50 backdrop-blur border-border/50 hover:border-primary/50 transition-all duration-300 cursor-pointer hover:neon-glow-cyan group">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-3 bg-primary/20 rounded-lg group-hover:neon-glow-cyan transition-all">
                    <Trash2 className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle>Limpeza Geral</CardTitle>
                </div>
                <CardDescription>
                  Remover arquivos temporários, cache e logs desnecessários
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  className="w-full bg-primary hover:bg-primary-glow text-primary-foreground"
                  onClick={cleanSystem}
                  disabled={isProcessing}
                >
                  {isProcessing ? 'Limpando...' : 'Iniciar Limpeza'}
                </Button>
                <p className="text-xs text-muted-foreground mt-3">
                  {isElectron ? 'Clique para limpar arquivos temporários' : 'Disponível apenas no app desktop'}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur border-border/50 hover:border-secondary/50 transition-all duration-300 cursor-pointer hover:neon-glow-purple group">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-3 bg-secondary/20 rounded-lg group-hover:neon-glow-purple transition-all">
                    <Zap className="w-6 h-6 text-secondary" />
                  </div>
                  <CardTitle>Otimização</CardTitle>
                </div>
                <CardDescription>
                  Gerenciar programas de inicialização e liberar memória RAM
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  className="w-full bg-secondary hover:bg-secondary-glow text-secondary-foreground"
                  onClick={optimizeSystem}
                  disabled={isProcessing}
                >
                  {isProcessing ? 'Otimizando...' : 'Otimizar Agora'}
                </Button>
                <p className="text-xs text-muted-foreground mt-3">
                  {isElectron ? 'Libera RAM e otimiza processos' : 'Disponível apenas no app desktop'}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur border-border/50 hover:border-success/50 transition-all duration-300 cursor-pointer hover:neon-glow-green group">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-3 bg-success/20 rounded-lg group-hover:neon-glow-green transition-all">
                    <Activity className="w-6 h-6 text-success" />
                  </div>
                  <CardTitle>Análise do Sistema</CardTitle>
                </div>
                <CardDescription>
                  Verificar saúde do disco e desempenho do sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  className="w-full bg-success hover:bg-success text-success-foreground"
                  onClick={analyzeSystem}
                  disabled={isProcessing}
                >
                  {isProcessing ? 'Analisando...' : 'Analisar Sistema'}
                </Button>
                <p className="text-xs text-muted-foreground mt-3">
                  {isElectron ? 'Detecta problemas e riscos' : 'Disponível apenas no app desktop'}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur border-border/50 hover:border-primary/50 transition-all duration-300 cursor-pointer hover:neon-glow-cyan group">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-3 bg-primary/20 rounded-lg group-hover:neon-glow-cyan transition-all">
                    <Wrench className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle>Ferramentas Avançadas</CardTitle>
                </div>
                <CardDescription>
                  Executar SFC, DISM e outras ferramentas do sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-primary-foreground">
                  Acessar Ferramentas
                </Button>
                <p className="text-xs text-muted-foreground mt-3">
                  Última verificação: Há 7 dias
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
