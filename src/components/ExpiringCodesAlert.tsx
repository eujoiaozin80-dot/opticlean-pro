import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import {
  AlertTriangle,
  Clock,
  Key,
  RefreshCw,
  Mail,
  Calendar,
  Filter,
  X,
  ChevronRight,
  Bell,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { renewActivationCode } from '@/utils/codeManagement';
import { sendCodeExpiringAlert } from '@/services/discordWebhook';

interface ExpiringCode {
  id: string;
  code: string;
  userEmail: string;
  daysRemaining: number;
  expiresAt: string;
  usedBy: string;
}

interface ExpiringCodesAlertProps {
  userId: string | null;
  onRefresh?: () => void;
}

export const ExpiringCodesAlert = ({ userId, onRefresh }: ExpiringCodesAlertProps) => {
  const { toast } = useToast();
  const [expiringCodes, setExpiringCodes] = useState<ExpiringCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [renewingCode, setRenewingCode] = useState<string | null>(null);
  const [filterDays, setFilterDays] = useState<string>('7');
  const [searchTerm, setSearchTerm] = useState('');

  const loadExpiringCodes = async () => {
    if (!userId) return;

    setLoading(true);
    try {
      const now = new Date();
      const filterDate = new Date();
      filterDate.setDate(filterDate.getDate() + parseInt(filterDays));

      const { data: codes, error } = await supabase
        .from('activation_codes')
        .select('*')
        .eq('is_used', true)
        .not('expires_at', 'is', null)
        .gte('expires_at', now.toISOString())
        .lte('expires_at', filterDate.toISOString())
        .order('expires_at', { ascending: true });

      if (error) throw error;

      const codesWithUsers: ExpiringCode[] = [];

      for (const code of codes || []) {
        if (code.used_by && code.expires_at) {
          const expiresAt = new Date(code.expires_at);
          const daysRemaining = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

          const { data: profile } = await supabase
            .from('profiles')
            .select('email')
            .eq('id', code.used_by)
            .maybeSingle();

          codesWithUsers.push({
            id: code.id,
            code: code.code,
            userEmail: profile?.email || 'Desconhecido',
            daysRemaining,
            expiresAt: code.expires_at,
            usedBy: code.used_by,
          });
        }
      }

      setExpiringCodes(codesWithUsers);
    } catch (error) {
      console.error('Erro ao carregar códigos expirando:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExpiringCodes();
  }, [userId, filterDays]);

  const filteredCodes = useMemo(() => {
    if (!searchTerm) return expiringCodes;
    return expiringCodes.filter(
      code =>
        code.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        code.userEmail.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [expiringCodes, searchTerm]);

  const handleRenewCode = async (codeId: string, additionalDays: number) => {
    if (!userId) return;

    setRenewingCode(codeId);
    try {
      const result = await renewActivationCode(codeId, additionalDays, userId);

      if (result.success) {
        toast({
          title: 'Código Renovado',
          description: `Validade estendida em ${additionalDays} dias`,
        });
        loadExpiringCodes();
        onRefresh?.();
      } else {
        toast({
          title: 'Erro',
          description: result.error || 'Erro ao renovar código',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Falha ao renovar código',
        variant: 'destructive',
      });
    } finally {
      setRenewingCode(null);
    }
  };

  const handleSendReminder = async (code: ExpiringCode) => {
    const sent = await sendCodeExpiringAlert(code.code, code.userEmail, code.daysRemaining);
    
    if (sent) {
      toast({
        title: 'Lembrete Enviado',
        description: 'Notificação enviada via Discord',
      });
    } else {
      toast({
        title: 'Aviso',
        description: 'Discord não está configurado',
        variant: 'default',
      });
    }
  };

  const getDaysColor = (days: number) => {
    if (days <= 1) return 'text-red-500 bg-red-500/10 border-red-500/30';
    if (days <= 3) return 'text-orange-500 bg-orange-500/10 border-orange-500/30';
    if (days <= 7) return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/30';
    return 'text-blue-500 bg-blue-500/10 border-blue-500/30';
  };

  if (expiringCodes.length === 0 && !loading) {
    return null;
  }

  return (
    <Card className="metric-card border-warning/30 bg-warning/5">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-warning/20">
              <AlertTriangle className="w-5 h-5 text-warning" />
            </div>
            <div>
              <CardTitle className="text-base">Códigos Expirando</CardTitle>
              <CardDescription className="text-xs">
                {filteredCodes.length} código(s) expirando em breve
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Select value={filterDays} onValueChange={setFilterDays}>
              <SelectTrigger className="w-[120px] h-8">
                <Filter className="w-3 h-3 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 dia</SelectItem>
                <SelectItem value="3">3 dias</SelectItem>
                <SelectItem value="7">7 dias</SelectItem>
                <SelectItem value="14">14 dias</SelectItem>
                <SelectItem value="30">30 dias</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="ghost"
              size="sm"
              onClick={loadExpiringCodes}
              disabled={loading}
              className="h-8 w-8 p-0"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {filteredCodes.length > 3 && (
          <Input
            placeholder="Buscar por código ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-8"
          />
        )}

        <div className="space-y-2 max-h-[300px] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : filteredCodes.length === 0 ? (
            <div className="text-center py-4 text-sm text-muted-foreground">
              Nenhum código expirando no período selecionado
            </div>
          ) : (
            filteredCodes.map((code) => (
              <div
                key={code.id}
                className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border/50"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <code className="text-sm font-mono font-semibold text-primary">
                      {code.code}
                    </code>
                    <Badge className={`text-xs ${getDaysColor(code.daysRemaining)}`}>
                      <Clock className="w-3 h-3 mr-1" />
                      {code.daysRemaining} {code.daysRemaining === 1 ? 'dia' : 'dias'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1 truncate">
                      <Mail className="w-3 h-3" />
                      {code.userEmail}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(code.expiresAt).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSendReminder(code)}
                    title="Enviar lembrete via Discord"
                    className="h-7 w-7 p-0"
                  >
                    <Bell className="w-3.5 h-3.5" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={renewingCode === code.id}
                        className="h-7"
                      >
                        {renewingCode === code.id ? (
                          <RefreshCw className="w-3 h-3 animate-spin" />
                        ) : (
                          <>
                            <RefreshCw className="w-3 h-3 mr-1" />
                            Renovar
                          </>
                        )}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Renovar Código</AlertDialogTitle>
                        <AlertDialogDescription>
                          Escolha por quantos dias deseja estender a validade do código{' '}
                          <code className="font-mono text-primary">{code.code}</code>
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <div className="grid grid-cols-3 gap-2 py-4">
                        {[7, 15, 30, 60, 90, 180].map((days) => (
                          <Button
                            key={days}
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              handleRenewCode(code.id, days);
                            }}
                          >
                            +{days} dias
                          </Button>
                        ))}
                      </div>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ExpiringCodesAlert;
