import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ProgressDialog } from '@/components/ProgressDialog';
import { 
  Zap, 
  Users,
  Crown,
  ExternalLink,
  MessageCircle,
  Info,
  Cpu,
  MemoryStick,
  HardDrive
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSystemActions } from '@/hooks/useSystemActions';
import { useToast } from '@/hooks/use-toast';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useOutletContext } from 'react-router-dom';
import logoLatency from "/Latency.png";
import { OutletContext } from '@/types/outlet-context';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSystemMetrics } from '@/hooks/useSystemMetrics';

interface DashboardProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

const Dashboard = ({ className, ...props }: DashboardProps) => {
  const { userId, userRole, isFounder } = useOutletContext<OutletContext>();
  const [userName, setUserName] = useState<string>('');
  const [totalUsers, setTotalUsers] = useState<number>(0);
  
  const { cpu, memory, disk, connectionStatus, isElectron: isElectronMetrics } = useSystemMetrics();
  const systemActions = useSystemActions();
  const { toast } = useToast();

  const { 
    optimizeSystem, 
    isProcessing,
    progress,
    currentStep,
    showProgress,
    setShowProgress,
    isElectron 
  } = systemActions;

  // Atalhos de teclado
  useKeyboardShortcuts([
    {
      key: 'o',
      ctrlKey: true,
      action: () => {
        if (!isProcessing && isElectron) {
          optimizeSystem();
          toast({
            title: 'Otimização iniciada',
            description: 'Pressione Ctrl+O para otimização rápida',
          });
        }
      },
      description: 'Otimização rápida',
    },
  ]);

  // Carregar nome do usuário e contagem de usuários
  useEffect(() => {
    const loadData = async () => {
      if (!userId) return;
      
      try {
        // Carregar nome do usuário
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('full_name, email')
          .eq('id', userId)
          .single();

        if (!profileError && profileData) {
          const name = profileData.full_name || profileData.email?.split('@')[0] || 'Usuário';
          setUserName(name);
        }

        // Carregar total de usuários
        const { count, error: countError } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });

        if (!countError && count) {
          setTotalUsers(count);
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      }
    };

    loadData();
  }, [userId]);

  const getOptimizationLevel = () => {
    const cpuUsage = cpu.usage;
    if (cpuUsage >= 80) return { level: 'Nível ruim', color: 'text-red-500', glowColor: 'shadow-red-500/50', percent: cpuUsage };
    if (cpuUsage >= 50) return { level: 'Nível médio', color: 'text-yellow-500', glowColor: 'shadow-yellow-500/50', percent: cpuUsage };
    return { level: 'Nível bom', color: 'text-emerald-500', glowColor: 'shadow-emerald-500/50', percent: Math.max(100 - cpuUsage, 21) };
  };

  const optimization = getOptimizationLevel();

  const news = [
    {
      date: '07.01.2026',
      author: 'Developer',
      tag: 'UPDATE',
      content: 'Nova versão do Byte Latency com interface redesenhada inspirada em BoosterX. Melhorias de performance e novos recursos de otimização.'
    },
    {
      date: '05.01.2026',
      author: 'Developer',
      tag: 'FIXES',
      content: 'Corrigido o funcionamento do botão "Avançado" nos métodos rápidos. Corrigidos crashes devido ao novo parser de tarefas.'
    }
  ];

  return (
    <div className={`space-y-6 animate-fade-up p-6 ${className || ''}`} {...props}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Olá, {userName || 'Usuário'}!
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm text-muted-foreground">Versão:</span>
            <Badge variant="secondary" className="text-xs">atual</Badge>
            <Badge className="bg-primary text-primary-foreground text-xs">2.2</Badge>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" className="rounded-full">
            <MessageCircle className="w-5 h-5" />
          </Button>
          <Button variant="ghost" className="text-sm">
            Sobre o programa
          </Button>
          <Button variant="ghost" className="text-sm">
            🇧🇷 Português (Brasil)
          </Button>
        </div>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-4 gap-4">
        {/* CPU Card */}
        <Card className="bg-card/50 border-border/50 backdrop-blur hover:shadow-lg hover:shadow-primary/20 transition-all duration-300">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-primary/20">
                <Cpu className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className={`text-2xl font-bold ${cpu.usage >= 80 ? 'text-red-500' : cpu.usage >= 50 ? 'text-yellow-500' : 'text-emerald-500'}`}>
                  {cpu.usage}%
                </p>
                <p className="text-sm text-muted-foreground">CPU</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* RAM Card */}
        <Card className="bg-card/50 border-border/50 backdrop-blur hover:shadow-lg hover:shadow-secondary/20 transition-all duration-300">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-secondary/20">
                <MemoryStick className="w-6 h-6 text-secondary" />
              </div>
              <div>
                <p className={`text-2xl font-bold ${memory.percent >= 80 ? 'text-red-500' : memory.percent >= 50 ? 'text-yellow-500' : 'text-emerald-500'}`}>
                  {memory.percent}%
                </p>
                <p className="text-sm text-muted-foreground">RAM ({memory.used.toFixed(1)}GB)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Disco Card */}
        <Card className="bg-card/50 border-border/50 backdrop-blur hover:shadow-lg hover:shadow-accent/20 transition-all duration-300">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-accent/20">
                <HardDrive className="w-6 h-6 text-accent-foreground" />
              </div>
              <div>
                <p className={`text-2xl font-bold ${disk.percent >= 80 ? 'text-red-500' : disk.percent >= 50 ? 'text-yellow-500' : 'text-emerald-500'}`}>
                  {disk.percent}%
                </p>
                <p className="text-sm text-muted-foreground">Disco ({disk.used.toFixed(0)}GB)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* PRO Card */}
        <Card className="bg-card/50 border-border/50 backdrop-blur hover:shadow-lg hover:shadow-amber-500/20 transition-all duration-300">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-amber-500/20">
                  <Crown className="w-6 h-6 text-amber-500" />
                </div>
                <div>
                  <p className="text-xl font-bold text-foreground">PRO</p>
                  <p className="text-sm text-muted-foreground">
                    {isFounder ? 'Vitalício' : 'Ativo'}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-3 gap-6">
        {/* Left Column - Hero */}
        <div className="col-span-2 space-y-6">
          {/* Hero Section */}
          <Card className="relative overflow-hidden bg-gradient-to-br from-primary/20 via-card to-card border-primary/30 hover:shadow-xl hover:shadow-primary/20 transition-all duration-500">
            <CardContent className="p-8 relative z-10">
              <div className="flex items-center gap-4 mb-4">
                <img 
                  src={logoLatency} 
                  alt="Byte Latency" 
                  className="w-12 h-12"
                />
                <h2 className="text-4xl font-extrabold tracking-tight">
                  <span className="text-foreground">BYTE</span>
                  <span className="text-primary">+</span>
                  <span className="text-foreground">LATENCY</span>
                </h2>
              </div>
              <p className="text-muted-foreground mb-6 max-w-md">
                Byte Latency aumenta o FPS em todos os jogos e reduz a latência do sistema ao mínimo possível!
              </p>
              <Button 
                onClick={optimizeSystem}
                disabled={isProcessing || !isElectron}
                className="btn-primary text-lg px-8 py-6 rounded-xl hover:shadow-lg hover:shadow-primary/30 transition-all"
              >
                Começar otimização
              </Button>
            </CardContent>
            {/* Decorative X */}
            <div className="absolute right-8 top-1/2 -translate-y-1/2 opacity-20">
              <svg width="200" height="200" viewBox="0 0 200 200" fill="none">
                <path 
                  d="M40 40L160 160M160 40L40 160" 
                  stroke="currentColor" 
                  strokeWidth="40" 
                  strokeLinecap="round"
                  className="text-primary"
                />
              </svg>
            </div>
          </Card>
        </div>

        {/* Right Column - News + Tips */}
        <div className="space-y-6">
          {/* News Section */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Notícias:</h3>
            <div className="space-y-4">
              {news.map((item, index) => (
                <Card key={index} className="bg-card/50 border-border/50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs text-muted-foreground">{item.date}</span>
                      <span className="text-xs text-muted-foreground">{item.author}</span>
                      <Badge variant={item.tag === 'UPDATE' ? 'default' : 'secondary'} className="text-xs">
                        {item.tag}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {item.content}
                    </p>
                    <Button variant="link" size="sm" className="px-0 mt-2 text-primary">
                      Ir para <ExternalLink className="w-3 h-3 ml-1" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Tips Section */}
          <Card className="bg-card/50 border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Info className="w-4 h-4 text-primary" />
                <h3 className="font-semibold">Dicas e truques de IA</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                O que fazer com o laptop para evitar throttling e quedas de frequência:
              </p>
              <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                <li>- Baixe o programa do fabricante (Dragon Center, Armoury Crate, Control Center ou outro)</li>
                <li>- e dentro do programa ajuste manualmente o funcionamento dos coolers. Faça com que eles funcionem mais em altas temperaturas.</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Progress Dialog */}
      <ProgressDialog
        open={showProgress}
        title="Otimizando Sistema"
        description="Aguarde enquanto aplicamos as otimizações..."
        progress={progress}
        currentStep={currentStep}
      />

      {/* CPU Indicator - Bottom Left with Pulse Animation */}
      <div className="fixed bottom-6 left-20 z-50">
        <div className={`relative w-20 h-20 animate-pulse`}>
          {/* Glow effect */}
          <div className={`absolute inset-0 rounded-full blur-xl opacity-50 ${optimization.glowColor}`} 
               style={{ boxShadow: `0 0 30px currentColor` }} />
          
          <svg className="w-full h-full transform -rotate-90 relative z-10" viewBox="0 0 64 64">
            {/* Background circle */}
            <circle
              cx="32"
              cy="32"
              r="28"
              stroke="currentColor"
              strokeWidth="4"
              fill="transparent"
              className="text-muted/30"
            />
            {/* Progress circle */}
            <circle
              cx="32"
              cy="32"
              r="28"
              stroke="currentColor"
              strokeWidth="4"
              fill="transparent"
              strokeDasharray={`${(cpu.usage / 100) * 175.93} 175.93`}
              className={`${optimization.color} transition-all duration-500`}
              style={{ filter: 'drop-shadow(0 0 6px currentColor)' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
            <span className={`text-lg font-bold ${optimization.color}`}>
              {cpu.usage}%
            </span>
            <span className="text-[10px] text-muted-foreground">CPU</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
