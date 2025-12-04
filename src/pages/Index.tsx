import { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import ParticlesBackground from '@/components/ParticlesBackground';
import Login from '@/components/Login';
import Sidebar from '@/components/Sidebar';
import { supabase } from '@/integrations/supabase/client';

const Index = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState<string>('');
  const [userRole, setUserRole] = useState<string>('user');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    // Listener de autenticação deve ser configurado ANTES de verificar a sessão
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!isMounted) return;

        if (session?.user) {
          setUserId(session.user.id);
          setIsAuthenticated(true);

          // Buscar perfil em um tick separado para evitar deadlocks com auth
          setTimeout(() => {
            if (!isMounted) return;
            loadUserProfile(session.user!.id);
          }, 0);
        } else {
          setIsAuthenticated(false);
          setUserId('');
          setUserRole('user');
          setLoading(false);
        }
      }
    );

    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) throw error;
        if (!isMounted) return;

        if (session?.user) {
          setUserId(session.user.id);
          setIsAuthenticated(true);
          await loadUserProfile(session.user.id);
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error('Erro ao verificar sessão:', error);
        if (isMounted) {
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
        .select('role')
        .eq('id', id)
        .maybeSingle();

      if (error && (error as any).code !== 'PGRST116') throw error;

      setUserRole(data?.role ?? 'user');
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
      // Se não conseguir carregar o perfil, mantém acesso como usuário padrão
      setUserRole('user');
      setIsAuthenticated(true);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (id: string, role: string) => {
    setUserId(id);
    setUserRole(role);
    setIsAuthenticated(true);
  };

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
