import { useState, useEffect, useCallback } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import ParticlesBackground from '@/components/ParticlesBackground';
import Login from '@/components/Login';
import Sidebar from '@/components/Sidebar';
import WelcomeScreen from '@/components/WelcomeScreen';
import { supabase } from '@/integrations/supabase/client';

const Index = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState<string>('');
  const [userRole, setUserRole] = useState<string>('user');
  const [userName, setUserName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    let isMounted = true;
    let hasInitialized = false;

    // Listener de autenticação deve ser configurado ANTES de verificar a sessão
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!isMounted) return;

        console.log('Auth event:', event, 'Session:', !!session);

        // Se acabou de fazer login, marcar como inicializado para ignorar checkSession
        if (event === 'SIGNED_IN' && session?.user) {
          hasInitialized = true;
          setUserId(session.user.id);
          setIsAuthenticated(true);
          setLoading(false);

          // Buscar perfil em um tick separado para evitar deadlocks com auth
          setTimeout(() => {
            if (!isMounted) return;
            loadUserProfile(session.user!.id);
          }, 0);
          return;
        }

        if (event === 'SIGNED_OUT') {
          setIsAuthenticated(false);
          setUserId('');
          setUserRole('user');
          setLoading(false);
          return;
        }

        if (event === 'TOKEN_REFRESHED' && session?.user) {
          setUserId(session.user.id);
          setIsAuthenticated(true);
          return;
        }

        // Para INITIAL_SESSION
        if (event === 'INITIAL_SESSION') {
          if (session?.user) {
            setUserId(session.user.id);
            setIsAuthenticated(true);
            setTimeout(() => {
              if (!isMounted) return;
              loadUserProfile(session.user!.id);
            }, 0);
          } else {
            setLoading(false);
          }
        }
      }
    );

    const checkSession = async () => {
      // Aguardar um pouco para o listener processar primeiro
      await new Promise(resolve => setTimeout(resolve, 100));
      
      if (hasInitialized || !isMounted) return;

      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          // Se o refresh token for inválido, apenas limpar - não fazer signOut se já logou
          if ((error as any)?.code === 'refresh_token_not_found' || 
              error.message?.includes('Refresh Token')) {
            console.log('Token antigo inválido, limpando...');
            if (isMounted && !hasInitialized) {
              setLoading(false);
            }
            return;
          }
          throw error;
        }

        if (!isMounted || hasInitialized) return;

        if (session?.user) {
          setUserId(session.user.id);
          setIsAuthenticated(true);
          await loadUserProfile(session.user.id);
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error('Erro ao verificar sessão:', error);
        if (isMounted && !hasInitialized) {
          setLoading(false);
        }
      }
    };

    checkSession();

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  const loadUserProfile = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role, full_name, email')
        .eq('id', id)
        .maybeSingle();

      if (error && (error as any).code !== 'PGRST116') throw error;

      setUserRole(data?.role ?? 'user');
      setUserName(data?.full_name || data?.email?.split('@')[0] || 'Usuário');
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
      // Se não conseguir carregar o perfil, mantém acesso como usuário padrão
      setUserRole('user');
      setUserName('Usuário');
      setIsAuthenticated(true);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (id: string, role: string, name?: string) => {
    setUserId(id);
    setUserRole(role);
    setUserName(name || 'Usuário');
    setShowWelcome(true);
  };

  const handleWelcomeComplete = useCallback(() => {
    setShowWelcome(false);
    setIsAuthenticated(true);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsAuthenticated(false);
    setUserId('');
    setUserRole('user');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background relative flex items-center justify-center">
        <ParticlesBackground />
        <div className="text-primary text-xl">Carregando...</div>
      </div>
    );
  }

  const isFounder = userRole === 'founder';

  // Show welcome screen after login
  if (showWelcome) {
    return (
      <WelcomeScreen userName={userName} onComplete={handleWelcomeComplete} />
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background relative">
        <ParticlesBackground />
        <Login onLogin={handleLogin} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative flex">
      <ParticlesBackground />
      
      <Sidebar userRole={userRole} onLogout={handleLogout} />
      
      <main className="flex-1 p-8 overflow-y-auto">
        <Outlet context={{ userId, userRole, isFounder }} />
      </main>
    </div>
  );
};

export default Index;
