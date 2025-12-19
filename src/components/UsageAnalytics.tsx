import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, TrendingUp, Users, Key, Calendar, Clock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface ActivationCode {
  id: string;
  code: string;
  created_at: string;
  is_used: boolean;
  used_at: string | null;
  expires_at: string | null;
  validity_days: number | null;
}

interface UsageAnalyticsProps {
  codes: ActivationCode[];
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

export const UsageAnalytics = ({ codes }: UsageAnalyticsProps) => {
  const analytics = useMemo(() => {
    const now = new Date();
    
    // Códigos por mês
    const monthlyData: Record<string, { created: number; used: number }> = {};
    codes.forEach(code => {
      const month = new Date(code.created_at).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
      if (!monthlyData[month]) {
        monthlyData[month] = { created: 0, used: 0 };
      }
      monthlyData[month].created++;
      if (code.is_used) {
        monthlyData[month].used++;
      }
    });

    const chartData = Object.entries(monthlyData).map(([month, data]) => ({
      month,
      ...data
    })).slice(-6);

    // Códigos por validade
    const byValidity: Record<string, number> = {};
    codes.forEach(code => {
      const days = code.validity_days || 30;
      let label = 'Outros';
      if (days <= 7) label = '7 dias';
      else if (days <= 30) label = '30 dias';
      else if (days <= 90) label = '90 dias';
      else if (days <= 365) label = '1 ano';
      else label = 'Vitalício';
      byValidity[label] = (byValidity[label] || 0) + 1;
    });

    const pieData = Object.entries(byValidity).map(([name, value]) => ({ name, value }));

    // Taxa de conversão
    const total = codes.length;
    const used = codes.filter(c => c.is_used).length;
    const conversionRate = total > 0 ? ((used / total) * 100).toFixed(1) : 0;

    // Tempo médio de ativação
    const activationTimes = codes
      .filter(c => c.is_used && c.used_at)
      .map(c => {
        const created = new Date(c.created_at).getTime();
        const usedAt = new Date(c.used_at!).getTime();
        return (usedAt - created) / (1000 * 60 * 60); // Em horas
      });
    const avgActivationTime = activationTimes.length > 0
      ? (activationTimes.reduce((a, b) => a + b, 0) / activationTimes.length)
      : 0;

    // Códigos expirando em 7 dias
    const expiringCount = codes.filter(c => {
      if (!c.is_used || !c.expires_at) return false;
      const expires = new Date(c.expires_at);
      const daysLeft = (expires.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      return daysLeft > 0 && daysLeft <= 7;
    }).length;

    return {
      chartData,
      pieData,
      conversionRate,
      avgActivationTime: avgActivationTime.toFixed(1),
      expiringCount,
      total,
      used,
      available: total - used,
    };
  }, [codes]);

  return (
    <Card className="metric-card">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-primary" />
          <CardTitle className="text-sm font-medium">Analytics de Códigos</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-2">
          <div className="p-2 rounded-lg bg-muted/30 text-center">
            <Key className="w-4 h-4 mx-auto mb-1 text-primary" />
            <p className="text-lg font-bold">{analytics.total}</p>
            <p className="text-[10px] text-muted-foreground">Total</p>
          </div>
          <div className="p-2 rounded-lg bg-emerald-500/10 text-center">
            <Users className="w-4 h-4 mx-auto mb-1 text-emerald-500" />
            <p className="text-lg font-bold text-emerald-500">{analytics.used}</p>
            <p className="text-[10px] text-muted-foreground">Usados</p>
          </div>
          <div className="p-2 rounded-lg bg-blue-500/10 text-center">
            <TrendingUp className="w-4 h-4 mx-auto mb-1 text-blue-500" />
            <p className="text-lg font-bold text-blue-500">{analytics.conversionRate}%</p>
            <p className="text-[10px] text-muted-foreground">Conversão</p>
          </div>
          <div className="p-2 rounded-lg bg-orange-500/10 text-center">
            <Clock className="w-4 h-4 mx-auto mb-1 text-orange-500" />
            <p className="text-lg font-bold text-orange-500">{analytics.avgActivationTime}h</p>
            <p className="text-[10px] text-muted-foreground">Média Ativ.</p>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-2 gap-4">
          {/* Bar Chart - Monthly */}
          <div>
            <p className="text-xs text-muted-foreground mb-2">Códigos por Mês</p>
            <div className="h-32">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.chartData}>
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} width={25} />
                  <Tooltip 
                    contentStyle={{ fontSize: 10, background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))' }}
                  />
                  <Bar dataKey="created" fill="#3b82f6" name="Criados" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="used" fill="#10b981" name="Usados" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Pie Chart - By Validity */}
          <div>
            <p className="text-xs text-muted-foreground mb-2">Por Validade</p>
            <div className="h-32">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics.pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={25}
                    outerRadius={45}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {analytics.pieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ fontSize: 10, background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-2 justify-center">
          {analytics.pieData.map((item, index) => (
            <div key={item.name} className="flex items-center gap-1 text-xs">
              <div className="w-2 h-2 rounded-full" style={{ background: COLORS[index % COLORS.length] }} />
              <span className="text-muted-foreground">{item.name}</span>
            </div>
          ))}
        </div>

        {/* Expiring Alert */}
        {analytics.expiringCount > 0 && (
          <div className="p-2 rounded-lg bg-orange-500/10 border border-orange-500/30">
            <p className="text-xs text-orange-500 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {analytics.expiringCount} código(s) expirando em 7 dias
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
