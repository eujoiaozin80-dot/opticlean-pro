import { useState, useEffect, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Key, Copy, Check, Plus, Shield, Settings, Trash2, Calendar, Search, Filter, Download, FileText, History as HistoryIcon, X, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { OutletContext } from '@/types/outlet-context';
import UserPanel from '@/components/UserPanel';
import { logAdminAction, getAdminLogs, type AdminLog } from '@/utils/adminLogs';
import { exportProcessesToCSV } from '@/utils/export';
import { Badge } from '@/components/ui/badge';

interface ActivationCode {
  id: string;
  code: string;
  created_at: string;
  is_used: boolean;
  used_at: string | null;
  used_by: string | null;
  validity_days: number | null;
  expires_at: string | null;
  user_email?: string;
}

interface AdminProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

const Admin = ({ className, ...props }: AdminProps) => {
  const { userId } = useOutletContext<OutletContext>();
  const [activationCodes, setActivationCodes] = useState<ActivationCode[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [validityDays, setValidityDays] = useState<string>('30');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'available' | 'used' | 'expired'>('all');
  const [selectedCodes, setSelectedCodes] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [adminLogs, setAdminLogs] = useState<AdminLog[]>([]);
  const [showLogs, setShowLogs] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const itemsPerPage = 20;
  const { toast } = useToast();

  // Atualizar tempo atual a cada segundo para recalcular tempo restante
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Carregar dados iniciais
  useEffect(() => {
    loadActivationCodes();
    loadAdminLogs();
  }, []);

  // Atualização automática dos códigos a cada 5 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      loadActivationCodes();
    }, 5000); // Atualizar a cada 5 segundos

    return () => clearInterval(interval);
  }, []);

  const loadAdminLogs = async () => {
    try {
      const { logs } = await getAdminLogs(50);
      setAdminLogs(logs);
    } catch (error) {
      console.error('Erro ao carregar logs:', error);
    }
  };

  const loadActivationCodes = async (showLoading = false) => {
    if (showLoading) {
      setRefreshing(true);
    }
    
    try {
      const { data, error } = await supabase
        .from('activation_codes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Buscar emails dos usuários que usaram os códigos
      const codesWithUsers = await Promise.all(
        (data || []).map(async (code) => {
          if (code.used_by) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('email')
              .eq('id', code.used_by)
              .maybeSingle();
            return { ...code, user_email: profile?.email };
          }
          return code;
        })
      );

      setActivationCodes(codesWithUsers);
      setLastUpdate(new Date());
    } catch (error: any) {
      console.error('Erro ao carregar códigos:', error);
      if (showLoading) {
        toast({
          title: "Erro ao atualizar",
          description: "Não foi possível atualizar a lista de códigos",
          variant: "destructive",
        });
      }
    } finally {
      if (showLoading) {
        setRefreshing(false);
      }
    }
  };

  const handleRefresh = () => {
    loadActivationCodes(true);
    loadAdminLogs();
  };

  const generateActivationCode = async () => {
    if (!userId) {
      toast({
        title: "Erro",
        description: "Usuário não autenticado",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Gerar código com prefixo OPT-
      const randomPart = Array.from({ length: 2 }, () =>
        Math.random().toString(36).substring(2, 6).toUpperCase()
      ).join('-');
      const code = `OPT-${randomPart}`;

      const { error } = await supabase
        .from('activation_codes')
        .insert({
          code,
          created_by: userId,
          validity_days: parseInt(validityDays),
        });

      if (error) throw error;

      // Log ação administrativa
      await logAdminAction(userId, 'create_code', 'code', code, {
        validity_days: parseInt(validityDays),
      });

      toast({
        title: "Código gerado",
        description: `Código: ${code} (validade: ${validityDays} dias)`,
      });

      loadActivationCodes(true);
      loadAdminLogs();
    } catch (error: any) {
      console.error('Erro ao gerar código:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao gerar código",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteActivationCode = async (codeId: string, codeValue: string) => {
    try {
      const { error } = await supabase
        .from('activation_codes')
        .delete()
        .eq('id', codeId);

      if (error) throw error;

      // Log ação administrativa
      await logAdminAction(userId, 'delete_code', 'code', codeId, {
        code: codeValue,
      });

      toast({
        title: "Código deletado",
        description: `O código ${codeValue} foi removido.`,
      });

      loadActivationCodes(true);
      loadAdminLogs();
    } catch (error: any) {
      console.error('Erro ao deletar código:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao deletar código",
        variant: "destructive",
      });
    }
  };

  const bulkDeleteCodes = async () => {
    if (selectedCodes.length === 0) return;

    try {
      const { error } = await supabase
        .from('activation_codes')
        .delete()
        .in('id', selectedCodes);

      if (error) throw error;

      // Log ação administrativa
      await logAdminAction(userId, 'bulk_delete_codes', 'codes', 'bulk', {
        count: selectedCodes.length,
        codes: selectedCodes,
      });

      toast({
        title: "Códigos deletados",
        description: `${selectedCodes.length} código(s) removido(s)`,
      });

      setSelectedCodes([]);
      loadActivationCodes(true);
      loadAdminLogs();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao deletar códigos",
        variant: "destructive",
      });
    }
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast({
      title: "Copiado",
      description: "Código copiado para a área de transferência",
    });
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR');
  };

  const formatExpirationDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);
    return `${day}/${month}/${year}`;
  };

  const calculateTimeRemaining = (expiresAt: string | null, isUsed: boolean) => {
    if (!expiresAt || !isUsed) return null;
    
    const now = currentTime; // Usar currentTime para atualização em tempo real
    const expiration = new Date(expiresAt);
    const diff = expiration.getTime() - now.getTime();

    if (diff <= 0) return 'Expirado';

    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const months = Math.floor(days / 30);
    const years = Math.floor(days / 365);

    const parts: string[] = [];

    if (years > 0) {
      parts.push(`${years} ${years === 1 ? 'ano' : 'anos'}`);
    }
    if (months > 0 && years === 0) {
      parts.push(`${months} ${months === 1 ? 'mês' : 'meses'}`);
    }
    if (days > 0 && months === 0 && years === 0) {
      parts.push(`${days} ${days === 1 ? 'dia' : 'dias'}`);
    }
    if (hours > 0 && days === 0 && months === 0 && years === 0) {
      parts.push(`${hours}h`);
    }
    if (minutes > 0 && hours === 0 && days === 0 && months === 0 && years === 0) {
      parts.push(`${minutes}m`);
    }
    if (seconds > 0 && minutes === 0 && hours === 0 && days === 0 && months === 0 && years === 0) {
      parts.push(`${seconds}s`);
    }

    // Se já passou de um dia, mostrar apenas dias/meses/anos
    if (days > 0) {
      return parts.slice(0, 2).join(', ');
    }

    // Se for menos de um dia, mostrar horas, minutos e segundos
    if (hours > 0) {
      const remainingMinutes = minutes % 60;
      const remainingSeconds = seconds % 60;
      const timeParts = [`${hours}h`];
      if (remainingMinutes > 0) timeParts.push(`${remainingMinutes}m`);
      if (remainingSeconds > 0 && remainingMinutes === 0) timeParts.push(`${remainingSeconds}s`);
      return timeParts.join(' ');
    }

    if (minutes > 0) {
      const remainingSeconds = seconds % 60;
      return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
    }

    return `${seconds}s`;
  };

  const isCodeExpired = (code: ActivationCode) => {
    if (!code.is_used || !code.expires_at) return false;
    return new Date(code.expires_at) < new Date();
  };

  // Filtros
  const filteredCodes = useMemo(() => {
    let filtered = [...activationCodes];

    // Busca por código ou email
    if (searchTerm) {
      filtered = filtered.filter(
        code =>
          code.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
          code.user_email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro de status
    if (statusFilter === 'available') {
      filtered = filtered.filter(c => !c.is_used);
    } else if (statusFilter === 'used') {
      filtered = filtered.filter(c => c.is_used && !isCodeExpired(c));
    } else if (statusFilter === 'expired') {
      filtered = filtered.filter(c => isCodeExpired(c));
    }

    return filtered;
  }, [activationCodes, searchTerm, statusFilter]);

  // Paginação
  const totalPages = Math.ceil(filteredCodes.length / itemsPerPage);
  const paginatedCodes = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredCodes.slice(start, end);
  }, [filteredCodes, currentPage]);

  // Estatísticas
  const availableCodes = activationCodes.filter(c => !c.is_used).length;
  const usedCodes = activationCodes.filter(c => c.is_used && !isCodeExpired(c)).length;
  const expiredCodes = activationCodes.filter(c => isCodeExpired(c)).length;

  const handleSelectAll = () => {
    if (selectedCodes.length === paginatedCodes.length) {
      setSelectedCodes([]);
    } else {
      setSelectedCodes(paginatedCodes.map(c => c.id));
    }
  };

  const handleSelectCode = (codeId: string) => {
    setSelectedCodes(prev =>
      prev.includes(codeId)
        ? prev.filter(id => id !== codeId)
        : [...prev, codeId]
    );
  };

  const exportCodes = () => {
    try {
      const csv = [
        ['Código', 'Status', 'Criado em', 'Validade (dias)', 'Usado por', 'Usado em'],
        ...filteredCodes.map(c => [
          c.code,
          isCodeExpired(c) ? 'Expirado' : c.is_used ? 'Usado' : 'Disponível',
          formatDate(c.created_at),
          String(c.validity_days || 30),
          c.user_email || '-',
          c.used_at ? formatDate(c.used_at) : '-',
        ])
      ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

      const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `codigos_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Exportado",
        description: "Códigos exportados com sucesso",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao exportar códigos",
        variant: "destructive",
      });
    }
  };

  return (
    <div className={`space-y-6 animate-fade-up ${className || ''}`} {...props}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-1">
            Administração
          </h1>
          <p className="text-muted-foreground text-sm">
            Gerenciamento de códigos e usuários
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            title="Atualizar lista de códigos"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Atualizando...' : 'Atualizar'}
          </Button>
          {lastUpdate && (
            <span className="text-xs text-muted-foreground">
              Última atualização: {lastUpdate.toLocaleTimeString('pt-BR')}
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowLogs(!showLogs)}
          >
            <HistoryIcon className="w-4 h-4 mr-2" />
            Logs ({adminLogs.length})
          </Button>
          <div className="flex items-center gap-2 text-sm text-secondary bg-secondary/10 px-3 py-1.5 rounded-full">
            <Shield className="w-3 h-3" />
            <span className="font-medium">Admin</span>
          </div>
        </div>
      </div>

      {/* Admin Logs Panel */}
      {showLogs && (
        <Card className="metric-card border-primary/20">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Logs Administrativos</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowLogs(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {adminLogs.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhum log registrado
                </p>
              ) : (
                adminLogs.map((log) => (
                  <div key={log.id} className="flex items-center justify-between p-2 bg-background/50 rounded text-xs">
                    <div>
                      <span className="font-medium">{log.action}</span>
                      <span className="text-muted-foreground ml-2">
                        {log.target_type}: {log.target_id}
                      </span>
                    </div>
                    <span className="text-muted-foreground">
                      {new Date(log.created_at).toLocaleString('pt-BR')}
                    </span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs defaultValue="codes" className="space-y-4">
        <TabsList className="glass-strong border border-border/50">
          <TabsTrigger value="codes" className="flex items-center gap-2">
            <Key className="w-4 h-4" />
            Códigos
          </TabsTrigger>
          <TabsTrigger value="local" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Licença Local
          </TabsTrigger>
        </TabsList>

        {/* Tab: Códigos */}
        <TabsContent value="codes" className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <Card className="metric-card">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Total</p>
                    <p className="text-2xl font-bold text-foreground">{activationCodes.length}</p>
                  </div>
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Key className="w-5 h-5 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="metric-card">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Disponíveis</p>
                    <p className="text-2xl font-bold text-emerald-500">{availableCodes}</p>
                  </div>
                  <div className="p-2 bg-emerald-500/10 rounded-lg">
                    <Check className="w-5 h-5 text-emerald-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="metric-card">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Usados</p>
                    <p className="text-2xl font-bold text-muted-foreground">{usedCodes}</p>
                  </div>
                  <div className="p-2 bg-muted rounded-lg">
                    <Key className="w-5 h-5 text-muted-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="metric-card">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Expirados</p>
                    <p className="text-2xl font-bold text-destructive">{expiredCodes}</p>
                  </div>
                  <div className="p-2 bg-destructive/10 rounded-lg">
                    <X className="w-5 h-5 text-destructive" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Generate Code */}
          <Card className="metric-card border-primary/20">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-sm font-medium">Gerar Código</CardTitle>
                  <CardDescription className="text-xs">
                    Crie códigos com validade personalizada
                  </CardDescription>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <Select value={validityDays} onValueChange={setValidityDays}>
                      <SelectTrigger className="w-[120px] h-9">
                        <SelectValue placeholder="Validade" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 dia</SelectItem>
                        <SelectItem value="7">7 dias</SelectItem>
                        <SelectItem value="15">15 dias</SelectItem>
                        <SelectItem value="30">30 dias</SelectItem>
                        <SelectItem value="60">60 dias</SelectItem>
                        <SelectItem value="90">90 dias</SelectItem>
                        <SelectItem value="180">180 dias</SelectItem>
                        <SelectItem value="365">365 dias</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    onClick={generateActivationCode}
                    disabled={loading || !userId}
                    className="btn-primary"
                    size="sm"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    {loading ? 'Gerando...' : 'Novo Código'}
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Filters and Search */}
          <Card className="metric-card">
            <CardContent className="p-4 space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por código ou email..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={(v: any) => {
                  setStatusFilter(v);
                  setCurrentPage(1);
                }}>
                  <SelectTrigger className="w-[180px]">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="available">Disponíveis</SelectItem>
                    <SelectItem value="used">Usados</SelectItem>
                    <SelectItem value="expired">Expirados</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  onClick={exportCodes}
                  disabled={filteredCodes.length === 0}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Exportar
                </Button>
              </div>

              {/* Bulk Actions */}
              {selectedCodes.length > 0 && (
                <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg border border-primary/20">
                  <span className="text-sm font-medium">
                    {selectedCodes.length} código(s) selecionado(s)
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedCodes([])}
                    >
                      Desmarcar
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                          <Trash2 className="w-4 h-4 mr-1" />
                          Deletar Selecionados
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Deletar códigos?</AlertDialogTitle>
                          <AlertDialogDescription>
                            {selectedCodes.length} código(s) será(ão) removido(s) permanentemente.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={bulkDeleteCodes}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Deletar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Codes List */}
          <Card className="metric-card">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between w-full">
                <CardTitle className="text-sm font-medium">
                  Códigos de Ativação ({filteredCodes.length})
                </CardTitle>
                <div className="flex items-center gap-3">
                  {refreshing && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      <span>Atualizando...</span>
                    </div>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="h-7 w-7 p-0"
                    title="Atualizar lista"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                  </Button>
                  {paginatedCodes.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={selectedCodes.length === paginatedCodes.length && paginatedCodes.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                      <span className="text-xs text-muted-foreground">Selecionar todos</span>
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {activationCodes.length === 0 ? (
                <div className="text-center py-12">
                  <Key className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
                  <p className="text-muted-foreground text-sm">
                    Nenhum código gerado ainda
                  </p>
                </div>
              ) : filteredCodes.length === 0 ? (
                <div className="text-center py-12">
                  <Search className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
                  <p className="text-muted-foreground text-sm">
                    Nenhum código encontrado
                  </p>
                </div>
              ) : (
                <>
                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {paginatedCodes.map((code, index) => (
                      <div
                        key={code.id}
                        className={`flex items-center gap-3 p-3 bg-background/50 rounded-lg border transition-all animate-fade-up ${
                          isCodeExpired(code) 
                            ? 'border-destructive/30 bg-destructive/5' 
                            : 'border-border/50 hover:border-primary/20'
                        }`}
                        style={{ animationDelay: `${index * 0.02}s` }}
                      >
                        <Checkbox
                          checked={selectedCodes.includes(code.id)}
                          onCheckedChange={() => handleSelectCode(code.id)}
                        />
                        <div className="flex flex-col gap-1 flex-1">
                          <div className="flex items-center gap-2">
                            <code className={`text-sm font-mono font-semibold ${
                              isCodeExpired(code) ? 'text-destructive' : 'text-primary'
                            }`}>
                              {code.code}
                            </code>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => copyToClipboard(code.code)}
                              className="h-6 w-6 p-0"
                            >
                              {copiedCode === code.code ? (
                                <Check className="h-3 w-3 text-emerald-500" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                          {code.user_email && (
                            <span className="text-[10px] text-muted-foreground">
                              👤 {code.user_email}
                            </span>
                          )}
                          {/* Informações de expiração */}
                          {code.is_used && code.expires_at && (
                            <div className="flex flex-col gap-0.5 mt-1">
                              {!isCodeExpired(code) && (
                                <span className="text-[10px] text-emerald-500 font-medium">
                                  ⏱️ {calculateTimeRemaining(code.expires_at, code.is_used)}
                                </span>
                              )}
                              <span className="text-[10px] text-muted-foreground">
                                📅 {formatExpirationDate(code.expires_at)} - (expira)
                              </span>
                            </div>
                          )}
                          {!code.is_used && code.validity_days && (
                            <span className="text-[10px] text-muted-foreground/70 mt-1">
                              Validade: {code.validity_days} {code.validity_days === 1 ? 'dia' : 'dias'}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right hidden sm:block">
                            <span className="text-xs text-muted-foreground block">
                              {formatDate(code.created_at)}
                            </span>
                            {code.is_used && code.expires_at && (
                              <div className="mt-1">
                                {!isCodeExpired(code) && (
                                  <span className="text-[10px] text-emerald-500 font-medium block">
                                    {calculateTimeRemaining(code.expires_at, code.is_used)}
                                  </span>
                                )}
                                <span className="text-[10px] text-muted-foreground/70 block">
                                  {formatExpirationDate(code.expires_at)}
                                </span>
                              </div>
                            )}
                            {!code.is_used && (
                              <span className="text-[10px] text-muted-foreground/70">
                                {code.validity_days || 30} dias
                              </span>
                            )}
                          </div>
                          {isCodeExpired(code) ? (
                            <Badge variant="destructive" className="text-xs">Expirado</Badge>
                          ) : code.is_used ? (
                            <Badge variant="secondary" className="text-xs">Usado</Badge>
                          ) : (
                            <Badge variant="default" className="text-xs bg-emerald-500">Disponível</Badge>
                          )}
                          
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Deletar código?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta ação não pode ser desfeita. O código <strong>{code.code}</strong> será removido permanentemente.
                                  {code.is_used && (
                                    <span className="block mt-2 text-destructive font-medium">
                                      ⚠️ Este código está em uso. O usuário associado perderá o acesso.
                                    </span>
                                  )}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteActivationCode(code.id, code.code)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Deletar
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4 pt-4 border-t">
                      <div className="text-sm text-muted-foreground">
                        Página {currentPage} de {totalPages} ({filteredCodes.length} total)
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                        >
                          Anterior
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                          disabled={currentPage === totalPages}
                        >
                          Próxima
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Licença Local (Electron) */}
        <TabsContent value="local">
          <UserPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Admin;
