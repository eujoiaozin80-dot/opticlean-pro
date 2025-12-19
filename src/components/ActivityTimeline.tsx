import { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Activity, LogIn, LogOut, Settings, Key, UserPlus, UserMinus, Shield, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Operation {
  id: string;
  operation_type: string;
  operation_name: string;
  status: string | null;
  created_at: string;
  details: string | null;
}

interface LoginHistory {
  id: string;
  login_status: string;
  created_at: string;
  ip_address: string | null;
  browser: string | null;
}

interface ActivityTimelineProps {
  operations?: Operation[];
  loginHistory?: LoginHistory[];
  userId?: string;
}

export const ActivityTimeline = ({ operations: propOperations, loginHistory: propLoginHistory, userId }: ActivityTimelineProps) => {
  const [operations, setOperations] = useState<Operation[]>(propOperations || []);
  const [loginHistory, setLoginHistory] = useState<LoginHistory[]>(propLoginHistory || []);

  useEffect(() => {
    const fetchData = async () => {
      if (!propOperations) {
        const { data } = await supabase.from('operation_history').select('*').order('created_at', { ascending: false }).limit(50);
        if (data) setOperations(data);
      }
      if (!propLoginHistory) {
        const { data } = await supabase.from('login_history').select('*').order('created_at', { ascending: false }).limit(50);
        if (data) setLoginHistory(data);
      }
    };
    fetchData();
  }, [propOperations, propLoginHistory]);
  const timeline = useMemo(() => {
    // Combinar e ordenar todas as atividades
    const activities: Array<{
      id: string;
      type: 'operation' | 'login';
      action: string;
      status: string;
      timestamp: string;
      details?: string;
      icon: React.ReactNode;
      color: string;
    }> = [];

    // Adicionar operações
    operations.forEach(op => {
      let icon: React.ReactNode = <Activity className="w-4 h-4" />;
      let color = 'text-primary';

      switch (op.operation_type) {
        case 'cleaning':
          icon = <Settings className="w-4 h-4" />;
          color = 'text-blue-500';
          break;
        case 'optimization':
          icon = <Activity className="w-4 h-4" />;
          color = 'text-emerald-500';
          break;
        case 'security':
          icon = <Shield className="w-4 h-4" />;
          color = 'text-yellow-500';
          break;
      }

      activities.push({
        id: op.id,
        type: 'operation',
        action: op.operation_name,
        status: op.status || 'completed',
        timestamp: op.created_at,
        details: op.details || undefined,
        icon,
        color,
      });
    });

    // Adicionar logins
    loginHistory.forEach(login => {
      const isSuccess = login.login_status === 'success';
      activities.push({
        id: login.id,
        type: 'login',
        action: isSuccess ? 'Login bem-sucedido' : 'Tentativa de login',
        status: login.login_status,
        timestamp: login.created_at,
        details: `${login.browser || 'Navegador desconhecido'} • ${login.ip_address || 'IP desconhecido'}`,
        icon: isSuccess ? <LogIn className="w-4 h-4" /> : <LogOut className="w-4 h-4" />,
        color: isSuccess ? 'text-emerald-500' : 'text-red-500',
      });
    });

    // Ordenar por data (mais recente primeiro)
    return activities.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    ).slice(0, 50);
  }, [operations, loginHistory]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Agora';
    if (diffMins < 60) return `${diffMins}min atrás`;
    if (diffHours < 24) return `${diffHours}h atrás`;
    if (diffDays < 7) return `${diffDays}d atrás`;
    return date.toLocaleDateString('pt-BR');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
      case 'success':
        return <Badge variant="outline" className="text-emerald-500 border-emerald-500/50 text-[10px]">Sucesso</Badge>;
      case 'failed':
        return <Badge variant="outline" className="text-red-500 border-red-500/50 text-[10px]">Falha</Badge>;
      case 'pending':
        return <Badge variant="outline" className="text-yellow-500 border-yellow-500/50 text-[10px]">Pendente</Badge>;
      default:
        return null;
    }
  };

  return (
    <Card className="metric-card">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" />
          <CardTitle className="text-sm font-medium">Timeline de Atividades</CardTitle>
          <Badge variant="secondary" className="text-[10px]">{timeline.length}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-border" />

            <div className="space-y-4">
              {timeline.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Nenhuma atividade registrada
                </p>
              ) : (
                timeline.map((activity, index) => (
                  <div key={activity.id} className="relative flex gap-3 pl-6">
                    {/* Timeline dot */}
                    <div className={`absolute left-0 w-4 h-4 rounded-full bg-background border-2 border-border flex items-center justify-center ${activity.color}`}>
                      <div className="w-1.5 h-1.5 rounded-full bg-current" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className={activity.color}>{activity.icon}</span>
                          <span className="text-sm font-medium truncate">{activity.action}</span>
                        </div>
                        {getStatusBadge(activity.status)}
                      </div>
                      {activity.details && (
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          {activity.details}
                        </p>
                      )}
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {formatDate(activity.timestamp)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
