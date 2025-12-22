import { useState, useEffect, useCallback, useRef } from 'react';
import { Outlet } from 'react-router-dom';
import ParticlesBackground from '@/components/ParticlesBackground';
import Login from '@/components/Login';
import Sidebar from '@/components/Sidebar';
import WelcomeScreen from '@/components/WelcomeScreen';
import { supabase } from '@/integrations/supabase/client';

interface IndexProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

const Index = ({ className, ...props }: IndexProps) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState<string>('');
  const [userRole, setUserRole] = useState<string>('user');
  const [userName, setUserName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [showWelcome, setShowWelcome] = useState(false);
  
  // Usar ref para evitar re-execuções do useEffect
  const showWelcomeRef = useRef(false);
  const hasInitialized = useRef(false);
  
  // SystemContext não está disponível aqui porque Index está dentro do SystemProvider
  // Mas podemos usar diretamente se necessário

  const loadUserProfile = useCallback(async (id: string): Promise<{ role: string; name: string }> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role, full_name, email')
        .eq('id', id)
        .maybeSingle();

      if (error && 'code' in error && error.code !== 'PGRST116') throw error;

      const role = data?.role ?? 'user';
      const name = data?.full_name || data?.email?.split('@')[0] || 'Usuário';
      
      return { role, name };
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
      return { role: 'user', name: 'Usuário' };
    }
  }, []);

  useEffect(() => {
    // Prevenir múltiplas inicializações
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    let isMounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!isMounted) return;
        
        // Ignorar se welcome screen está ativa
        if (showWelcomeRef.current) return;

        console.log('Auth event:', event, 'Session:', !!session);

        if (event === 'SIGNED_OUT') {
          setIsAuthenticated(false);
          setUserId('');
          setUserRole('user');
          setUserName('');
          setLoading(false);
          return;
        }

        if ((event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED') && session?.user) {
          setUserId(session.user.id);
          
          setTimeout(async () => {
            if (!isMounted) return;
            const { role, name } = await loadUserProfile(session.user!.id);
            if (isMounted) {
              setUserRole(role);
              setUserName(name);
              setIsAuthenticated(true);
              setLoading(false);
            }
          }, 0);
        } else if (event === 'INITIAL_SESSION' && !session) {
          setLoading(false);
        }
      }
    );

    // Verificar sessão existente
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.log('Erro na sessão:', error.message);
          if (isMounted) setLoading(false);
          return;
        }

        if (!isMounted) return;

        if (session?.user) {
          setUserId(session.user.id);
          const { role, name } = await loadUserProfile(session.user.id);
          if (isMounted) {
            setUserRole(role);
            setUserName(name);
            setIsAuthenticated(true);
            setLoading(false);
          }
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error('Erro ao verificar sessão:', error);
        if (isMounted) setLoading(false);
      }
    };

    checkSession();

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, [loadUserProfile]);

  const handleLogin = useCallback((id: string, role: string, name?: string) => {
    showWelcomeRef.current = true;
    setUserId(id);
    setUserRole(role);
    setUserName(name || 'Usuário');
    setShowWelcome(true);
  }, []);

  const handleWelcomeComplete = useCallback(() => {
    showWelcomeRef.current = false;
    setShowWelcome(false);
    setIsAuthenticated(true);
    setLoading(false);
  }, []);

  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut();
    setIsAuthenticated(false);
    setUserId('');
    setUserRole('user');
    setUserName('');
  }, []);

  // Loading state
  if (loading) {
    return (
      <div className={`min-h-screen bg-background relative flex items-center justify-center ${className || ''}`} {...props}>
        <ParticlesBackground />
        <div className="text-primary text-xl">Carregando...</div>
      </div>
    );
  }

  // Welcome screen after login
  if (showWelcome) {
    return <WelcomeScreen userName={userName} onComplete={handleWelcomeComplete} />;
  }

  // Login screen
  if (!isAuthenticated) {
    return (
      <div className={`min-h-screen bg-background relative ${className || ''}`} {...props}>
        <ParticlesBackground />
        <Login onLogin={handleLogin} />
      </div>
    );
  }

  // Main app
  const isFounder = userRole === 'founder';

  return (
    <div className={`min-h-screen bg-background relative flex ${className || ''}`} {...props}>
      <ParticlesBackground />
      <Sidebar userRole={userRole} onLogout={handleLogout} />
      <main className="flex-1 p-8 overflow-y-auto">
        <Outlet context={{ userId, userRole, isFounder }} />
      </main>
    </div>
  );
};

export default Index;
