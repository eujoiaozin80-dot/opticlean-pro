import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Zap, 
  Play, 
  Settings, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Loader2,
  FileText,
  Shield
} from 'lucide-react';
import { useOptimization } from '@/hooks/useOptimization';
import { useToast } from '@/hooks/use-toast';

const QuickOptimizations = () => {
  const { 
    categories, 
    loading, 
    executeOptimization, 
    readTextFile,
    getFilesByRisk 
  } = useOptimization();
  
  const { toast } = useToast();
  const [executingFile, setExecutingFile] = useState<string | null>(null);
  const [showTextContent, setShowTextContent] = useState<{ content: string; fileName: string } | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Otimizações rápidas recomendadas (baixo risco)
  const quickOptimizations = categories.flatMap(category => 
    category.files
      .filter(file => file.risk === 'low')
      .slice(0, 3) // Limitar a 3 otimizações rápidas
  );

  const handleExecuteOptimization = async (fileId: string, category: string, fileName: string) => {
    setExecutingFile(fileId);
    
    try {
      const result = await executeOptimization(fileId);
      
      if (result.success) {
        toast({
          title: "Otimização executada!",
          description: `${fileName} aplicado com sucesso`,
        });
      } else {
        toast({
          title: "Erro na otimização",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro inesperado",
        description: "Ocorreu um erro ao executar a otimização",
        variant: "destructive",
      });
    } finally {
      setExecutingFile(null);
    }
  };

  const handleViewTextFile = async (fileId: string, category: string, fileName: string) => {
    try {
      const content = await readTextFile(fileId, category);
      setShowTextContent({ content, fileName });
    } catch (error) {
      toast({
        title: "Erro ao ler arquivo",
        description: "Não foi possível ler o conteúdo do arquivo",
        variant: "destructive",
      });
    }
  };

  const getRiskIcon = (risk: string) => {
    switch (risk) {
      case 'low':
        return <CheckCircle className="w-3 h-3 text-green-500" />;
      case 'medium':
        return <AlertTriangle className="w-3 h-3 text-yellow-500" />;
      case 'high':
        return <XCircle className="w-3 h-3 text-red-500" />;
      default:
        return <CheckCircle className="w-3 h-3 text-gray-500" />;
    }
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'reg':
        return <Settings className="w-4 h-4 text-blue-500" />;
      case 'bat':
        return <Play className="w-4 h-4 text-green-500" />;
      case 'txt':
        return <FileText className="w-4 h-4 text-purple-500" />;
      default:
        return <FileText className="w-4 h-4 text-gray-500" />;
    }
  };

  const totalOptimizations = categories.reduce((acc, cat) => acc + cat.files.length, 0);
  const safeOptimizations = getFilesByRisk('low').length;

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/5 border-border/50 hover-lift cursor-pointer group">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-green-500/20 group-hover:bg-green-500/30 transition-colors">
                  <Zap className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <CardTitle className="text-lg">Otimizações</CardTitle>
                  <CardDescription>Sistema completo</CardDescription>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-green-500">{totalOptimizations}</div>
                <div className="text-xs text-muted-foreground">disponíveis</div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-sm text-muted-foreground">{safeOptimizations} seguras</span>
              </div>
              <Button size="sm" className="group-hover:scale-105 transition-transform">
                Abrir
              </Button>
            </div>
          </CardContent>
        </Card>
      </DialogTrigger>

      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="w-6 h-6 text-green-500" />
            Otimizações Byte Latency
          </DialogTitle>
          <DialogDescription>
            Sistema completo de otimização para Windows com {totalOptimizations} otimizações disponíveis
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Estatísticas rápidas */}
          <div className="grid grid-cols-3 gap-4">
            <Card className="p-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <div>
                  <p className="text-lg font-bold">{getFilesByRisk('low').length}</p>
                  <p className="text-xs text-muted-foreground">Baixo Risco</p>
                </div>
              </div>
            </Card>
            <Card className="p-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-500" />
                <div>
                  <p className="text-lg font-bold">{getFilesByRisk('medium').length}</p>
                  <p className="text-xs text-muted-foreground">Médio Risco</p>
                </div>
              </div>
            </Card>
            <Card className="p-3">
              <div className="flex items-center gap-2">
                <XCircle className="w-4 h-4 text-red-500" />
                <div>
                  <p className="text-lg font-bold">{getFilesByRisk('high').length}</p>
                  <p className="text-xs text-muted-foreground">Alto Risco</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Otimizações Rápidas */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Shield className="w-5 h-5 text-green-500" />
              Otimizações Rápidas (Seguras)
            </h3>
            <div className="grid gap-2">
              {quickOptimizations.slice(0, 3).map((file) => (
                <div key={file.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getFileIcon(file.type)}
                    <div>
                      <p className="font-medium text-sm">{file.name}</p>
                      <p className="text-xs text-muted-foreground">{file.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {getRiskIcon(file.risk)}
                      <span className="ml-1">Seguro</span>
                    </Badge>
                    {file.type === 'txt' ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewTextFile(file.id, file.category, file.name)}
                      >
                        <FileText className="w-3 h-3 mr-1" />
                        Ver
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleExecuteOptimization(file.id, file.category, file.name)}
                        disabled={executingFile === file.id}
                      >
                        {executingFile === file.id ? (
                          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                        ) : (
                          <Play className="w-3 h-3 mr-1" />
                        )}
                        Executar
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Todas as Categorias */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Todas as Categorias</h3>
            <ScrollArea className="h-[300px] w-full">
              <div className="space-y-3">
                {categories.map((category) => (
                  <Card key={category.id}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center justify-between">
                        <span>{category.name}</span>
                        <Badge variant="secondary">{category.files.length} arquivos</Badge>
                      </CardTitle>
                      <CardDescription className="text-xs">{category.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="grid gap-2">
                        {category.files.slice(0, 2).map((file) => (
                          <div key={file.id} className="flex items-center justify-between p-2 border rounded text-sm">
                            <div className="flex items-center gap-2">
                              {getFileIcon(file.type)}
                              <span className="font-medium">{file.name}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              {getRiskIcon(file.risk)}
                              {file.type !== 'txt' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleExecuteOptimization(file.id, file.category, file.name)}
                                  disabled={executingFile === file.id}
                                  className="h-6 px-2 text-xs"
                                >
                                  {executingFile === file.id ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                  ) : (
                                    'Executar'
                                  )}
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                        {category.files.length > 2 && (
                          <div className="text-xs text-muted-foreground text-center py-1">
                            +{category.files.length - 2} mais arquivos...
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>
      </DialogContent>

      {/* Modal para visualizar arquivos de texto */}
      {showTextContent && (
        <Dialog open={!!showTextContent} onOpenChange={() => setShowTextContent(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                {showTextContent.fileName}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowTextContent(null)}
                >
                  <XCircle className="w-4 h-4" />
                </Button>
              </DialogTitle>
            </DialogHeader>
            <ScrollArea className="h-[400px] w-full">
              <pre className="text-sm whitespace-pre-wrap bg-muted p-4 rounded">
                {showTextContent.content}
              </pre>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      )}
    </Dialog>
  );
};

export default QuickOptimizations;
