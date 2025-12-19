import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Users, Activity, Calendar, Clock, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface User {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: 'founder' | 'user';
  is_active: boolean;
  last_login: string | null;
  created_at: string;
  operations_count?: number;
}

interface UserComparisonProps {
  users: User[];
}

const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

export const UserComparison = ({ users }: UserComparisonProps) => {
  const analytics = useMemo(() => {
    // Top usuários por operações
    const topByOperations = [...users]
      .sort((a, b) => (b.operations_count || 0) - (a.operations_count || 0))
      .slice(0, 5);

    // Usuários mais ativos (login recente)
    const activeUsers = users.filter(u => {
      if (!u.last_login) return false;
      const lastLogin = new Date(u.last_login);
      const daysSinceLogin = (Date.now() - lastLogin.getTime()) / (1000 * 60 * 60 * 24);
      return daysSinceLogin <= 7;
    }).length;

    // Usuários inativos (sem login há 30+ dias)
    const inactiveUsers = users.filter(u => {
      if (!u.last_login) return true;
      const lastLogin = new Date(u.last_login);
      const daysSinceLogin = (Date.now() - lastLogin.getTime()) / (1000 * 60 * 60 * 24);
      return daysSinceLogin > 30;
    }).length;

    // Novos usuários (últimos 7 dias)
    const newUsers = users.filter(u => {
      const created = new Date(u.created_at);
      const daysSinceCreated = (Date.now() - created.getTime()) / (1000 * 60 * 60 * 24);
      return daysSinceCreated <= 7;
    }).length;

    // Distribuição por role
    const founders = users.filter(u => u.role === 'founder').length;
    const regularUsers = users.filter(u => u.role === 'user').length;

    // Média de operações
    const totalOps = users.reduce((sum, u) => sum + (u.operations_count || 0), 0);
    const avgOps = users.length > 0 ? totalOps / users.length : 0;

    // Dados para o gráfico
    const chartData = topByOperations.map(u => ({
      name: u.full_name || u.email.split('@')[0],
      operations: u.operations_count || 0,
    }));

    return {
      topByOperations,
      activeUsers,
      inactiveUsers,
      newUsers,
      founders,
      regularUsers,
      avgOps,
      chartData,
      total: users.length,
    };
  }, [users]);

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    }
    return email.substring(0, 2).toUpperCase();
  };

  return (
    <Card className="metric-card">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-primary" />
          <CardTitle className="text-sm font-medium">Comparação de Usuários</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-2">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-center">
            <TrendingUp className="w-4 h-4 mx-auto mb-1 text-emerald-500" />
            <p className="text-lg font-bold text-emerald-500">{analytics.activeUsers}</p>
            <p className="text-[10px] text-muted-foreground">Ativos (7d)</p>
          </div>
          <div className="p-2 rounded-lg bg-red-500/10 text-center">
            <TrendingDown className="w-4 h-4 mx-auto mb-1 text-red-500" />
            <p className="text-lg font-bold text-red-500">{analytics.inactiveUsers}</p>
            <p className="text-[10px] text-muted-foreground">Inativos</p>
          </div>
          <div className="p-2 rounded-lg bg-blue-500/10 text-center">
            <Calendar className="w-4 h-4 mx-auto mb-1 text-blue-500" />
            <p className="text-lg font-bold text-blue-500">{analytics.newUsers}</p>
            <p className="text-[10px] text-muted-foreground">Novos (7d)</p>
          </div>
          <div className="p-2 rounded-lg bg-purple-500/10 text-center">
            <Activity className="w-4 h-4 mx-auto mb-1 text-purple-500" />
            <p className="text-lg font-bold text-purple-500">{analytics.avgOps.toFixed(0)}</p>
            <p className="text-[10px] text-muted-foreground">Média Ops</p>
          </div>
        </div>

        {/* Top Users Chart */}
        <div>
          <p className="text-xs text-muted-foreground mb-2">Top 5 por Operações</p>
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.chartData} layout="vertical">
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={80} />
                <Tooltip 
                  contentStyle={{ fontSize: 10, background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))' }}
                />
                <Bar dataKey="operations" radius={[0, 4, 4, 0]}>
                  {analytics.chartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Users List */}
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">Ranking de Atividade</p>
          {analytics.topByOperations.slice(0, 3).map((user, index) => (
            <div key={user.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/30">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/20 text-xs font-bold">
                {index + 1}
              </div>
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.avatar_url || undefined} />
                <AvatarFallback className="text-xs">
                  {getInitials(user.full_name, user.email)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user.full_name || user.email}</p>
                <p className="text-xs text-muted-foreground">{user.operations_count || 0} operações</p>
              </div>
              <Badge variant={user.role === 'founder' ? 'default' : 'secondary'} className="text-[10px]">
                {user.role}
              </Badge>
            </div>
          ))}
        </div>

        {/* Role Distribution */}
        <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/30">
          <div className="flex-1 text-center">
            <p className="text-sm font-bold text-primary">{analytics.founders}</p>
            <p className="text-xs text-muted-foreground">Founders</p>
          </div>
          <div className="w-px h-8 bg-border" />
          <div className="flex-1 text-center">
            <p className="text-sm font-bold">{analytics.regularUsers}</p>
            <p className="text-xs text-muted-foreground">Usuários</p>
          </div>
          <div className="w-px h-8 bg-border" />
          <div className="flex-1 text-center">
            <p className="text-sm font-bold">{analytics.total}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
