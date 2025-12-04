import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Key, Copy, Check, Plus, Shield, User, Settings } from 'lucide-react';
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
}

const Admin = () => {
  const { userId } = useOutletContext<OutletContext>();
  const [activationCodes, setActivationCodes] = useState<ActivationCode[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
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
      setActivationCodes(data || []);
    } catch (error: any) {
      console.error('Erro ao carregar códigos:', error);
    }
  };

  const generateActivationCode = async () => {
    setLoading(true);
    try {
      const code = Array.from({ length: 3 }, () =>
        Math.random().toString(36).substring(2, 6).toUpperCase()
      ).join('-');

      const { error } = await supabase
        .from('activation_codes')
        .insert({
          code,
          created_by: userId,
        });

      if (error) throw error;

      toast({
        title: "Código gerado",
        description: `Código: ${code}`,
      });

      loadActivationCodes();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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

  const availableCodes = activationCodes.filter(c => !c.is_used).length;
  const usedCodes = activationCodes.filter(c => c.is_used).length;

  return (
    <div className="space-y-6 animate-fade-up">
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
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-medium">Gerar Código</CardTitle>
                  <CardDescription className="text-xs">
                    Crie códigos para novos usuários
                  </CardDescription>
                </div>
                <Button
                  onClick={generateActivationCode}
                  disabled={loading}
                  className="btn-primary"
                  size="sm"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  {loading ? 'Gerando...' : 'Novo Código'}
                </Button>
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
                      className="flex items-center justify-between p-3 bg-background/50 rounded-lg border border-border/50 hover:border-primary/20 transition-all animate-fade-up"
                      style={{ animationDelay: `${index * 0.02}s` }}
                    >
                      <div className="flex items-center gap-3">
                        <code className="text-sm font-mono font-semibold text-primary">
                          {code.code}
                        </code>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyToClipboard(code.code)}
                          className="h-7 w-7 p-0"
                        >
                          {copiedCode === code.code ? (
                            <Check className="h-3 w-3 text-success" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground hidden sm:block">
                          {new Date(code.created_at).toLocaleDateString('pt-BR')}
                        </span>
                        {code.is_used ? (
                          <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-muted text-muted-foreground uppercase">
                            Usado
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-success/10 text-success uppercase">
                            Disponível
                          </span>
                        )}
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
