import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users as UsersIcon, Shield, UserCheck, UserX, Calendar, Activity, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface User {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: string;
  is_active: boolean;
  last_login: string | null;
  created_at: string;
}

const Users = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ totalOperations: 0, codesUsed: 0 });
  const { toast } = useToast();

  useEffect(() => {
    loadUsers();
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      // Total operations
      const { count: opCount } = await supabase
        .from('operation_history')
        .select('*', { count: 'exact', head: true });

      // Used activation codes
      const { count: codesCount } = await supabase
        .from('activation_codes')
        .select('*', { count: 'exact', head: true })
        .eq('is_used', true);

      setStats({
        totalOperations: opCount || 0,
        codesUsed: codesCount || 0
      });
    } catch (error) {
      console.error('Erro ao carregar stats:', error);
    }
  };

  const loadUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error: any) {
      console.error('Erro ao carregar usuários:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os usuários',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleUserStatus = async (targetUserId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: !currentStatus })
        .eq('id', targetUserId);

      if (error) throw error;

      toast({
        title: 'Atualizado',
        description: `Usuário ${!currentStatus ? 'ativado' : 'desativado'}`
      });

      loadUsers();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o status',
        variant: 'destructive'
      });
    }
  };

  const activeUsers = users.filter(u => u.is_active).length;

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-1">Usuários</h1>
          <p className="text-muted-foreground text-sm">Gerencie todos os usuários do sistema</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-secondary bg-secondary/10 px-3 py-1.5 rounded-full">
          <Shield className="w-3 h-3" />
          <span className="font-medium">Admin</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="metric-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase">Total Usuários</p>
              <p className="text-2xl font-bold">{users.length}</p>
            </div>
            <UsersIcon className="w-5 h-5 text-primary" />
          </CardContent>
        </Card>
        <Card className="metric-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase">Ativos</p>
              <p className="text-2xl font-bold text-success">{activeUsers}</p>
            </div>
            <UserCheck className="w-5 h-5 text-success" />
          </CardContent>
        </Card>
        <Card className="metric-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase">Códigos Usados</p>
              <p className="text-2xl font-bold text-secondary">{stats.codesUsed}</p>
            </div>
            <Activity className="w-5 h-5 text-secondary" />
          </CardContent>
        </Card>
        <Card className="metric-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase">Operações</p>
              <p className="text-2xl font-bold text-accent">{stats.totalOperations}</p>
            </div>
            <TrendingUp className="w-5 h-5 text-accent" />
          </CardContent>
        </Card>
      </div>

      {/* Users List */}
      <Card className="metric-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Usuários Cadastrados</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-muted/30 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12">
              <UsersIcon className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">Nenhum usuário</p>
            </div>
          ) : (
            <div className="space-y-2">
              {users.map((user, index) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 bg-background/50 rounded-lg border border-border/50 hover:border-primary/20 transition-all animate-fade-up"
                  style={{ animationDelay: `${index * 0.02}s` }}
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10 border border-border">
                      <AvatarImage src={user.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary text-sm">
                        {user.full_name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{user.full_name || 'Sem nome'}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                      {user.last_login && (
                        <p className="text-[10px] text-muted-foreground/70 flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3 h-3" />
                          Último login: {new Date(user.last_login).toLocaleDateString('pt-BR')}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-medium ${
                      user.role === 'founder' ? 'bg-secondary/10 text-secondary' : 'bg-muted text-muted-foreground'
                    }`}>
                      {user.role === 'founder' ? 'Admin' : 'User'}
                    </span>
                    <Button
                      size="sm"
                      variant={user.is_active ? 'ghost' : 'default'}
                      onClick={() => toggleUserStatus(user.id, user.is_active)}
                      disabled={user.role === 'founder'}
                      className={user.is_active ? 'text-destructive hover:bg-destructive/10' : 'btn-primary'}
                    >
                      {user.is_active ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Users;
