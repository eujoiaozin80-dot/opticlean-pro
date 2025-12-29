import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Settings, 
  Zap, 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  FileText,
  Play,
  Loader2,
  Info
} from 'lucide-react';
import { useOptimization } from '@/hooks/useOptimization';
import { useToast } from '@/hooks/use-toast';

const Optimization = () => {
  const { 
    categories, 
    loading, 
    error, 
    executeOptimization, 
    readTextFile,
    getFilesByRisk 
  } = useOptimization();
  
  const { toast } = useToast();
  const [executingFile, setExecutingFile] = useState<string | null>(null);
  const [showTextContent, setShowTextContent] = useState<{ content: string; fileName: string } | null>(null);

  const handleExecuteOptimization = async (fileId: string, category: string, fileName: string) => {
    setExecutingFile(fileId);
    
    try {
      const result = await executeOptimization(fileId, category);
      
      if (result.success) {
        toast({
          title: "Otimização executada com sucesso!",
          description: result.message,
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
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'medium':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'high':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Info className="w-4 h-4 text-gray-500" />;
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
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

  if (loading && categories.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-2">Carregando otimizações...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Zap className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Otimizações Byte Latency</h1>
          <p className="text-muted-foreground">Sistema completo de otimização para Windows</p>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{categories.reduce((acc, cat) => acc + cat.files.length, 0)}</p>
                <p className="text-sm text-muted-foreground">Total de Arquivos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{getFilesByRisk('low').length}</p>
                <p className="text-sm text-muted-foreground">Baixo Risco</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold">{getFilesByRisk('medium').length}</p>
                <p className="text-sm text-muted-foreground">Médio Risco</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-500" />
              <div>
                <p className="text-2xl font-bold">{getFilesByRisk('high').length}</p>
                <p className="text-sm text-muted-foreground">Alto Risco</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Categorias */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">Todas</TabsTrigger>
          <TabsTrigger value="services">Serviços</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="gaming">Gaming</TabsTrigger>
          <TabsTrigger value="registry">Registro</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {categories.map((category) => (
            <Card key={category.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  {category.name}
                </CardTitle>
                <CardDescription>{category.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3">
                  {category.files.map((file) => (
                    <div key={file.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getFileIcon(file.type)}
                        <div>
                          <p className="font-medium">{file.name}</p>
                          <p className="text-sm text-muted-foreground">{file.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getRiskColor(file.risk)}>
                          {getRiskIcon(file.risk)}
                          <span className="ml-1">
                            {file.risk === 'low' ? 'Baixo' : file.risk === 'medium' ? 'Médio' : 'Alto'}
                          </span>
                        </Badge>
                        {file.type === 'txt' ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewTextFile(file.id, file.category, file.name)}
                          >
                            <FileText className="w-4 h-4 mr-1" />
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
                              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                            ) : (
                              <Play className="w-4 h-4 mr-1" />
                            )}
                            Executar
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {categories.map((category) => (
          <TabsContent key={category.id} value={category.id} className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  {category.name}
                </CardTitle>
                <CardDescription>{category.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3">
                  {category.files.map((file) => (
                    <div key={file.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getFileIcon(file.type)}
                        <div>
                          <p className="font-medium">{file.name}</p>
                          <p className="text-sm text-muted-foreground">{file.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getRiskColor(file.risk)}>
                          {getRiskIcon(file.risk)}
                          <span className="ml-1">
                            {file.risk === 'low' ? 'Baixo' : file.risk === 'medium' ? 'Médio' : 'Alto'}
                          </span>
                        </Badge>
                        {file.type === 'txt' ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewTextFile(file.id, file.category, file.name)}
                          >
                            <FileText className="w-4 h-4 mr-1" />
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
                              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                            ) : (
                              <Play className="w-4 h-4 mr-1" />
                            )}
                            Executar
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Modal para visualizar arquivos de texto */}
      {showTextContent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-2xl w-full max-h-[80vh]">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {showTextContent.fileName}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowTextContent(null)}
                >
                  <XCircle className="w-4 h-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px] w-full">
                <pre className="text-sm whitespace-pre-wrap bg-muted p-4 rounded">
                  {showTextContent.content}
                </pre>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Optimization;
