import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Key, Copy, Check, Plus, Shield, Settings, Trash2, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { OutletContext } from '@/types/outlet-context';
import UserPanel from '@/components/UserPanel';

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

const Admin = ({ className, ...props }: AdminProps = {}) => {
  const { userId } = useOutletContext<OutletContext>();
  const [activationCodes, setActivationCodes] = useState<ActivationCode[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [validityDays, setValidityDays] = useState<string>('30');
  const { toast } = useToast();

  useEffect(() => {
    loadActivationCodes();
  }, []);

  const loadActivationCodes = async () => {
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
    } catch (error: any) {
      console.error('Erro ao carregar códigos:', error);
    }
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

      toast({
        title: "Código gerado",
        description: `Código: ${code} (validade: ${validityDays} dias)`,
      });

      loadActivationCodes();
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

      toast({
        title: "Código deletado",
        description: `O código ${codeValue} foi removido. Usuários que usavam esse código perderão acesso.`,
      });

      loadActivationCodes();
    } catch (error: any) {
      console.error('Erro ao deletar código:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao deletar código",
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

  const isCodeExpired = (code: ActivationCode) => {
    if (!code.is_used || !code.expires_at) return false;
    return new Date(code.expires_at) < new Date();
  };

  const availableCodes = activationCodes.filter(c => !c.is_used).length;
  const usedCodes = activationCodes.filter(c => c.is_used).length;

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
        <div className="flex items-center gap-2 text-sm text-secondary bg-secondary/10 px-3 py-1.5 rounded-full">
          <Shield className="w-3 h-3" />
          <span className="font-medium">Admin</span>
        </div>
      </div>

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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                    <p className="text-2xl font-bold text-success">{availableCodes}</p>
                  </div>
                  <div className="p-2 bg-success/10 rounded-lg">
                    <Check className="w-5 h-5 text-success" />
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

          {/* Codes List */}
          <Card className="metric-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Códigos de Ativação</CardTitle>
            </CardHeader>
            <CardContent>
              {activationCodes.length === 0 ? (
                <div className="text-center py-12">
                  <Key className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
                  <p className="text-muted-foreground text-sm">
                    Nenhum código gerado ainda
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {activationCodes.map((code, index) => (
                    <div
                      key={code.id}
                      className={`flex items-center justify-between p-3 bg-background/50 rounded-lg border transition-all animate-fade-up ${
                        isCodeExpired(code) 
                          ? 'border-destructive/30 bg-destructive/5' 
                          : 'border-border/50 hover:border-primary/20'
                      }`}
                      style={{ animationDelay: `${index * 0.02}s` }}
                    >
                      <div className="flex flex-col gap-1">
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
                              <Check className="h-3 w-3 text-success" />
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
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right hidden sm:block">
                          <span className="text-xs text-muted-foreground block">
                            {formatDate(code.created_at)}
                          </span>
                          <span className="text-[10px] text-muted-foreground/70">
                            {code.validity_days || 30} dias
                          </span>
                        </div>
                        {isCodeExpired(code) ? (
                          <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-destructive/10 text-destructive uppercase">
                            Expirado
                          </span>
                        ) : code.is_used ? (
                          <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-muted text-muted-foreground uppercase">
                            Usado
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-success/10 text-success uppercase">
                            Disponível
                          </span>
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