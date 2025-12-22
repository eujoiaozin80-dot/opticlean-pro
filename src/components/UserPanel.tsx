import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { 
  User, 
  Key, 
  Calendar, 
  Trash2, 
  Copy, 
  RefreshCw,
  Shield,
  AlertTriangle
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface LicenseData {
  code: string;
  activatedAt: string;
  expiresAt: string;
  username: string;
}

const isElectron = (): boolean => {
  return typeof window !== 'undefined' && 
         typeof window.electronAPI !== 'undefined' &&
         window.electronAPI !== null;
};

const UserPanel = () => {
  const { toast } = useToast();
  const [username, setUsername] = useState<string>('');
  const [license, setLicense] = useState<LicenseData | null>(null);
  const [generatedCode, setGeneratedCode] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    if (!isElectron()) {
      setIsLoading(false);
      return;
    }

    try {
      const api = window.electronAPI;
      const [user, licenseData] = await Promise.all([
        api.getUsername(),
        api.getLicense()
      ]);
      
      setUsername(user);
      setLicense(licenseData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateCode = async () => {
    if (!isElectron()) {
      toast({
        title: "Erro",
        description: "Funcionalidade disponível apenas no app desktop",
        variant: "destructive"
      });
      return;
    }

    try {
      const api = window.electronAPI;
      const code = await api.generateCode();
      setGeneratedCode(code);
      toast({
        title: "Código Gerado",
        description: "Novo código de ativação criado com sucesso"
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao gerar código",
        variant: "destructive"
      });
    }
  };

  const handleCopyCode = () => {
    if (generatedCode) {
      navigator.clipboard.writeText(generatedCode);
      toast({
        title: "Copiado",
        description: "Código copiado para a área de transferência"
      });
    }
  };

  const handleDeleteUser = async () => {
    if (!isElectron()) return;

    setIsDeleting(true);
    try {
      const api = window.electronAPI;
      const result = await api.deleteUser();
      
      if (result.success) {
        setLicense(null);
        toast({
          title: "Usuário Removido",
          description: "Licença e dados do usuário foram excluídos"
        });
        // Redirecionar para login após exclusão
        window.location.reload();
      } else {
        throw new Error(result.error || 'Erro desconhecido');
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao remover usuário",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (!isElectron()) {
    return (
      <Card className="p-6 glass-strong border-border/50">
        <div className="text-center text-muted-foreground">
          <Shield className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Painel disponível apenas no aplicativo desktop</p>
        </div>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="p-6 glass-strong border-border/50 animate-pulse">
        <div className="h-48 bg-muted/20 rounded" />
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Informações do Usuário */}
      <Card className="p-6 glass-strong border-border/50">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <User className="w-5 h-5 text-primary" />
          Informações do Usuário
        </h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/10">
            <span className="text-muted-foreground">Usuário</span>
            <span className="font-medium">{username || 'N/A'}</span>
          </div>
          
          {license && (
            <>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/10">
                <span className="text-muted-foreground">Código de Ativação</span>
                <Badge variant="outline" className="font-mono">{license.code}</Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/10">
                <span className="text-muted-foreground">Ativado em</span>
                <span className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {formatDate(license.activatedAt)}
                </span>
              </div>
              
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/10">
                <span className="text-muted-foreground">Validade</span>
                <span className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {formatDate(license.expiresAt)}
                </span>
              </div>
            </>
          )}
        </div>
      </Card>

      {/* Gerar Código */}
      <Card className="p-6 glass-strong border-border/50">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Key className="w-5 h-5 text-secondary" />
          Gerar Código de Ativação
        </h3>
        
        <div className="space-y-4">
          <Button 
            onClick={handleGenerateCode}
            className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Gerar Novo Código
          </Button>
          
          {generatedCode && (
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input 
                  value={generatedCode} 
                  readOnly 
                  className="font-mono text-center text-lg tracking-wider bg-muted/20"
                />
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={handleCopyCode}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground text-center">
                Código válido por 30 dias após ativação
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Zona de Perigo */}
      <Card className="p-6 glass-strong border-destructive/30 bg-destructive/5">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-destructive">
          <AlertTriangle className="w-5 h-5" />
          Zona de Perigo
        </h3>
        
        <p className="text-sm text-muted-foreground mb-4">
          Esta ação irá remover permanentemente sua licença e dados locais. 
          Você precisará de um novo código de ativação para usar o aplicativo novamente.
        </p>
        
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button 
              variant="destructive" 
              className="w-full"
              disabled={isDeleting}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {isDeleting ? 'Removendo...' : 'Deletar Usuário'}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="glass-strong border-border/50">
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja remover sua licença? 
                Esta ação não pode ser desfeita e você perderá acesso ao aplicativo.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDeleteUser}
                className="bg-destructive hover:bg-destructive/90"
              >
                Sim, Deletar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </Card>
    </div>
  );
};

export default UserPanel;
