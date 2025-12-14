import { useState, useMemo, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { 
  X, Search, Activity, Wifi, WifiOff, RefreshCw, Cpu, 
  Download, Filter, Shield, ShieldOff, History as HistoryIcon, Trash2, CheckSquare, Square
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useProcesses } from '@/hooks/useProcesses';
import { useProtectedProcesses } from '@/hooks/useProtectedProcesses';
import { useProcessHistory } from '@/hooks/useProcessHistory';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { exportProcessesToCSV, exportProcessesToJSON } from '@/utils/export';
import { ProcessSkeletonList } from '@/components/ProcessSkeleton';
import { PROCESS_CONSTANTS } from '@/constants/processes';
import type { ProcessFilter } from '@/types/process';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ProcessesProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

const Processes = ({ className, ...props }: ProcessesProps) => {
  const {
    filteredProcesses,
    loading,
    connectionStatus,
    filters,
    searchTerm,
    stats,
    setFilters,
    setSearchTerm,
    killProcess,
  } = useProcesses();

  const { isProtected, addProtected, removeProtected, protectedProcesses } = useProtectedProcesses();
  const { history, addToHistory, clearHistory } = useProcessHistory();
  const { toast } = useToast();
  const [processToKill, setProcessToKill] = useState<{ pid: number; name: string } | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'cpu' | 'mem' | 'name'>('cpu');
  const [groupBy, setGroupBy] = useState(false);
  const [selectedProcesses, setSelectedProcesses] = useState<Set<number>>(new Set());
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Atalhos de teclado
  useKeyboardShortcuts([
    {
      key: 'k',
      ctrlKey: true,
      action: () => {
        searchInputRef.current?.focus();
      },
      description: 'Focar busca',
    },
    {
      key: 'Escape',
      action: () => {
        setProcessToKill(null);
        setShowFilters(false);
      },
      description: 'Fechar dialogs',
    },
    {
      key: 'f',
      ctrlKey: true,
      action: () => {
        setShowFilters(!showFilters);
      },
      description: 'Toggle filtros',
    },
  ]);

  const handleKillProcess = (pid: number, name: string) => {
    // Verificar se processo está protegido
    if (isProtected(name)) {
      toast({
        title: 'Processo protegido',
        description: 'Este processo está na whitelist e não pode ser finalizado',
        variant: 'destructive',
      });
      return;
    }

    setProcessToKill({ pid, name });
  };

  const confirmKillProcess = async () => {
    if (!processToKill) return;

    const { pid, name } = processToKill;
    const process = filteredProcesses.find((p) => p.pid === pid);
    
    setProcessToKill(null);

    const success = await killProcess(pid, name);
    
    if (success && process) {
      addToHistory(process);
    }
  };

  // Ações em lote
  const handleSelectProcess = (pid: number) => {
    setSelectedProcesses((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(pid)) {
        newSet.delete(pid);
      } else {
        newSet.add(pid);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedProcesses.size === filteredProcesses.length) {
      setSelectedProcesses(new Set());
    } else {
      setSelectedProcesses(new Set(filteredProcesses.map((p) => p.pid)));
    }
  };

  const handleBulkKill = async () => {
    if (selectedProcesses.size === 0) return;

    const processesToKill = filteredProcesses.filter((p) => selectedProcesses.has(p.pid));
    const protectedProcesses = processesToKill.filter((p) => isProtected(p.name));

    if (protectedProcesses.length > 0) {
      toast({
        title: 'Processos protegidos',
        description: `${protectedProcesses.length} processo(s) protegido(s) não podem ser finalizados`,
        variant: 'destructive',
      });
      return;
    }

    setBulkActionLoading(true);
    let successCount = 0;
    let failCount = 0;

    for (const process of processesToKill) {
      const success = await killProcess(process.pid, process.name);
      if (success) {
        successCount++;
        addToHistory(process);
      } else {
        failCount++;
      }
    }

    setSelectedProcesses(new Set());
    setBulkActionLoading(false);

    toast({
      title: 'Ação em lote concluída',
      description: `${successCount} processo(s) finalizado(s)${failCount > 0 ? `, ${failCount} falha(s)` : ''}`,
      variant: failCount > 0 ? 'destructive' : 'default',
    });
  };

  const handleExport = (format: 'csv' | 'json') => {
    try {
      if (format === 'csv') {
        exportProcessesToCSV(filteredProcesses, `processos_${new Date().toISOString().split('T')[0]}.csv`);
        toast({
          title: 'Exportado com sucesso',
          description: 'Lista de processos exportada para CSV',
        });
      } else {
        exportProcessesToJSON(filteredProcesses, `processos_${new Date().toISOString().split('T')[0]}.json`);
        toast({
          title: 'Exportado com sucesso',
          description: 'Lista de processos exportada para JSON',
        });
      }
    } catch (error) {
      toast({
        title: 'Erro ao exportar',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
    }
  };

  // Processos ordenados e agrupados
  const sortedAndGroupedProcesses = useMemo(() => {
    let sorted = [...filteredProcesses];

    // Ordenar
    sorted.sort((a, b) => {
      if (sortBy === 'cpu') return b.cpuPercent - a.cpuPercent;
      if (sortBy === 'mem') return b.memPercent - a.memPercent;
      return a.name.localeCompare(b.name);
    });

    // Agrupar se solicitado
    if (groupBy) {
      const grouped = sorted.reduce((acc, proc) => {
        const name = proc.name;
        if (!acc[name]) acc[name] = [];
        acc[name].push(proc);
        return acc;
      }, {} as Record<string, typeof sorted>);

      return Object.entries(grouped).map(([name, processes]) => ({
        name,
        processes,
        totalCpu: processes.reduce((sum, p) => sum + p.cpuPercent, 0),
        totalMem: processes.reduce((sum, p) => sum + p.memPercent, 0),
        count: processes.length,
      }));
    }

    return sorted;
  }, [filteredProcesses, sortBy, groupBy]);

  const getCpuColor = (cpu: number) => {
    if (cpu >= PROCESS_CONSTANTS.CRITICAL_CPU_THRESHOLD) return 'text-destructive';
    if (cpu >= PROCESS_CONSTANTS.WARNING_CPU_THRESHOLD) return 'text-yellow-500';
    return 'text-emerald-500';
  };

  const getMemColor = (mem: number) => {
    if (mem >= PROCESS_CONSTANTS.CRITICAL_MEM_THRESHOLD) return 'text-destructive';
    if (mem >= PROCESS_CONSTANTS.WARNING_MEM_THRESHOLD) return 'text-yellow-500';
    return 'text-emerald-500';
  };

  return (
    <TooltipProvider>
    <div className={`space-y-6 animate-fade-up ${className || ''}`} {...props}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-1">Processos</h1>
          <p className="text-muted-foreground text-sm">
            Monitore e controle os processos em execução
          </p>
        </div>
        <div className="flex items-center gap-2">
          {connectionStatus === 'connected' ? (
            <div className="flex items-center gap-2 text-sm text-emerald-500 bg-emerald-500/10 px-3 py-1.5 rounded-full">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-medium">Conectado</span>
            </div>
          ) : connectionStatus === 'connecting' ? (
            <div className="flex items-center gap-2 text-sm text-primary bg-primary/10 px-3 py-1.5 rounded-full">
              <RefreshCw className="w-3 h-3 animate-spin" />
              <span className="font-medium">Conectando...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted px-3 py-1.5 rounded-full">
              <WifiOff className="w-3 h-3" />
              <span className="font-medium">Offline</span>
            </div>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground mb-1">Total de Processos</div>
            <div className="text-2xl font-bold">{stats.processCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground mb-1">CPU Total</div>
            <div className="text-2xl font-bold">{stats.totalCpu.toFixed(1)}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground mb-1">RAM Total</div>
            <div className="text-2xl font-bold">{stats.totalMem.toFixed(1)}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground mb-1">CPU Médio</div>
            <div className="text-2xl font-bold">{stats.avgCpu.toFixed(1)}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Offline Banner */}
      {connectionStatus === 'disconnected' && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50 border border-border animate-fade-in">
          <WifiOff className="w-5 h-5 text-muted-foreground" />
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">Modo Offline</p>
            <p className="text-xs text-muted-foreground">
              Execute o Electron para ver processos reais: <code className="px-1.5 py-0.5 bg-background rounded text-primary">npm run dev</code>
            </p>
          </div>
        </div>
      )}

      {/* Controls */}
      <Card className="metric-card">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-primary" />
              <CardTitle className="text-sm font-medium">Processos Ativos</CardTitle>
              <Badge variant="outline">{filteredProcesses.length}</Badge>
            </div>
            <div className="flex items-center gap-2">
              {selectedProcesses.size > 0 && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleBulkKill}
                  disabled={bulkActionLoading}
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Finalizar {selectedProcesses.size} processo(s)
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="w-4 h-4 mr-1" />
                Filtros
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport('csv')}
              >
                <Download className="w-4 h-4 mr-1" />
                CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport('json')}
              >
                <Download className="w-4 h-4 mr-1" />
                JSON
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search and Sort */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                placeholder="Buscar processo... (Ctrl+K)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-9 bg-input border-border input-focus"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={sortBy === 'cpu' ? 'default' : 'outline'}
                onClick={() => setSortBy('cpu')}
                size="sm"
              >
                CPU
              </Button>
              <Button
                variant={sortBy === 'mem' ? 'default' : 'outline'}
                onClick={() => setSortBy('mem')}
                size="sm"
              >
                Memória
              </Button>
              <Button
                variant={sortBy === 'name' ? 'default' : 'outline'}
                onClick={() => setSortBy('name')}
                size="sm"
              >
                Nome
              </Button>
              <Button
                variant={groupBy ? 'default' : 'outline'}
                onClick={() => setGroupBy(!groupBy)}
                size="sm"
              >
                Agrupar
              </Button>
            </div>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="p-4 rounded-lg bg-muted/30 border border-border space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>CPU Mínimo: {filters.minCpu ?? 0}%</Label>
                  <Slider
                    value={[filters.minCpu ?? 0]}
                    onValueChange={([value]) => setFilters({ ...filters, minCpu: value })}
                    max={100}
                    step={1}
                  />
                </div>
                <div className="space-y-2">
                  <Label>CPU Máximo: {filters.maxCpu ?? 100}%</Label>
                  <Slider
                    value={[filters.maxCpu ?? 100]}
                    onValueChange={([value]) => setFilters({ ...filters, maxCpu: value })}
                    max={100}
                    step={1}
                  />
                </div>
                <div className="space-y-2">
                  <Label>RAM Mínima: {filters.minMem ?? 0}%</Label>
                  <Slider
                    value={[filters.minMem ?? 0]}
                    onValueChange={([value]) => setFilters({ ...filters, minMem: value })}
                    max={100}
                    step={1}
                  />
                </div>
                <div className="space-y-2">
                  <Label>RAM Máxima: {filters.maxMem ?? 100}%</Label>
                  <Slider
                    value={[filters.maxMem ?? 100]}
                    onValueChange={([value]) => setFilters({ ...filters, maxMem: value })}
                    max={100}
                    step={1}
                  />
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFilters({})}
              >
                Limpar Filtros
              </Button>
            </div>
          )}

          {/* Process List */}
          {loading ? (
            <ProcessSkeletonList count={5} />
          ) : connectionStatus === 'disconnected' ? (
            <div className="text-center py-12">
              <Activity className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">
                Conecte via Electron para ver os processos
              </p>
            </div>
          ) : filteredProcesses.length === 0 ? (
            <div className="text-center py-12">
              <Search className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">
                Nenhum processo encontrado
              </p>
            </div>
          ) : groupBy && Array.isArray(sortedAndGroupedProcesses) && sortedAndGroupedProcesses.length > 0 && typeof sortedAndGroupedProcesses[0] === 'object' && 'name' in sortedAndGroupedProcesses[0] ? (
            // Renderizar agrupado
            <div className="space-y-4 max-h-[500px] overflow-y-auto">
              {(sortedAndGroupedProcesses as Array<{ name: string; processes: typeof filteredProcesses; totalCpu: number; totalMem: number; count: number }>).map((group) => (
                <div key={group.name} className="border border-border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{group.name}</span>
                      <Badge variant="secondary">{group.count} instância(s)</Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>CPU: {group.totalCpu.toFixed(1)}%</span>
                      <span>RAM: {group.totalMem.toFixed(1)}%</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    {group.processes.map((process) => (
                      <div
                        key={process.pid}
                        className="flex items-center justify-between p-2 bg-background/50 rounded hover:bg-background/80 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs text-muted-foreground">PID: {process.pid}</span>
                            <span className={getCpuColor(process.cpuPercent)}>
                              CPU: {process.cpuPercent.toFixed(1)}%
                            </span>
                            <span className={getMemColor(process.memPercent)}>
                              RAM: {process.memPercent.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {isProtected(process.name) && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Shield className="w-4 h-4 text-emerald-500" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Processo protegido</p>
                              </TooltipContent>
                            </Tooltip>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleKillProcess(process.pid, process.name)}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            disabled={connectionStatus !== 'connected' || isProtected(process.name)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // Renderizar lista normal
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {/* Header com seleção */}
              <div className="flex items-center gap-2 p-2 border-b border-border/50 sticky top-0 bg-background/95 backdrop-blur-sm z-10">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSelectAll}
                  className="h-7 w-7 p-0"
                >
                  {selectedProcesses.size === filteredProcesses.length && filteredProcesses.length > 0 ? (
                    <CheckSquare className="w-4 h-4" />
                  ) : (
                    <Square className="w-4 h-4" />
                  )}
                </Button>
                <span className="text-xs text-muted-foreground">
                  {selectedProcesses.size > 0 ? `${selectedProcesses.size} selecionado(s)` : 'Selecionar todos'}
                </span>
              </div>
              {(sortedAndGroupedProcesses as typeof filteredProcesses).map((process, index) => (
                <div
                  key={process.pid}
                  className={`flex items-center justify-between p-3 bg-background/50 rounded-lg border transition-all animate-fade-up ${
                    selectedProcesses.has(process.pid)
                      ? 'border-primary bg-primary/10'
                      : 'border-border/50 hover:border-primary/20'
                  }`}
                  style={{ animationDelay: `${index * 0.02}s` }}
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSelectProcess(process.pid)}
                      className="h-5 w-5 p-0"
                    >
                      {selectedProcesses.has(process.pid) ? (
                        <CheckSquare className="w-4 h-4 text-primary" />
                      ) : (
                        <Square className="w-4 h-4 text-muted-foreground" />
                      )}
                    </Button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-sm text-foreground truncate">
                          {process.name}
                        </p>
                        {isProtected(process.name) && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Shield className="w-4 h-4 text-emerald-500" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Processo protegido</p>
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="font-mono">PID: {process.pid}</span>
                        <span className={getCpuColor(process.cpuPercent)}>
                          CPU: {process.cpuPercent.toFixed(1)}%
                        </span>
                        <span className={getMemColor(process.memPercent)}>
                          RAM: {process.memPercent.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleKillProcess(process.pid, process.name)}
                    className="ml-4 text-destructive hover:text-destructive hover:bg-destructive/10"
                    disabled={connectionStatus !== 'connected' || isProtected(process.name)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Confirmação */}
      <AlertDialog open={!!processToKill} onOpenChange={(open) => !open && setProcessToKill(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Finalização</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja finalizar o processo <strong>{processToKill?.name}</strong> (PID: {processToKill?.pid})?
              <br />
              <span className="text-destructive text-sm mt-2 block">
                Esta ação não pode ser desfeita e pode causar perda de dados não salvos.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmKillProcess}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Finalizar Processo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de Processos Protegidos */}
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="fixed bottom-4 right-4">
            <Shield className="w-4 h-4 mr-2" />
            Processos Protegidos
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Gerenciar Processos Protegidos</DialogTitle>
            <DialogDescription>
              Processos na lista não podem ser finalizados acidentalmente
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-[400px] overflow-y-auto">
            {protectedProcesses.map((name) => (
              <div key={name} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-500" />
                  <span className="font-medium">{name}</span>
                  {(PROCESS_CONSTANTS.CRITICAL_PROCESSES as readonly string[]).includes(name) && (
                    <Badge variant="secondary" className="text-xs">Sistema</Badge>
                  )}
                </div>
                {!(PROCESS_CONSTANTS.CRITICAL_PROCESSES as readonly string[]).includes(name) && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeProtected(name)}
                  >
                    <ShieldOff className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de Histórico */}
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="fixed bottom-4 right-48">
            <HistoryIcon className="w-4 h-4 mr-2" />
            Histórico
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Histórico de Processos Finalizados</DialogTitle>
            <DialogDescription>
              Últimos processos finalizados
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {history.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Nenhum processo finalizado ainda</p>
            ) : (
              history.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-muted-foreground">
                      PID: {item.pid} • {item.killedAt.toLocaleString('pt-BR')}
                    </p>
                  </div>
                  <div className="text-right text-sm">
                    <p>CPU: {item.cpuPercent.toFixed(1)}%</p>
                    <p>RAM: {item.memPercent.toFixed(1)}%</p>
                  </div>
                </div>
              ))
            )}
          </div>
          {history.length > 0 && (
            <Button variant="outline" onClick={clearHistory} className="w-full">
              Limpar Histórico
            </Button>
          )}
        </DialogContent>
      </Dialog>
    </div>
    </TooltipProvider>
  );
};

export default Processes;
