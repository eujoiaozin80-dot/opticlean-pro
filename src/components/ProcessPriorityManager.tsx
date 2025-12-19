import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Gauge, AlertTriangle, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ProcessPriorityManagerProps {
  pid?: number;
  name?: string;
  currentPriority?: string;
  onClose?: () => void;
}

const PRIORITIES = [
  { value: 'realtime', label: 'Tempo Real', description: 'Máxima prioridade (pode causar instabilidade)', color: 'text-red-500' },
  { value: 'high', label: 'Alta', description: 'Prioridade elevada', color: 'text-orange-500' },
  { value: 'above_normal', label: 'Acima do Normal', description: 'Levemente acima do padrão', color: 'text-yellow-500' },
  { value: 'normal', label: 'Normal', description: 'Prioridade padrão', color: 'text-emerald-500' },
  { value: 'below_normal', label: 'Abaixo do Normal', description: 'Levemente abaixo do padrão', color: 'text-blue-500' },
  { value: 'idle', label: 'Baixa', description: 'Executa quando sistema está ocioso', color: 'text-muted-foreground' },
];

export const ProcessPriorityManager = ({ pid, name, currentPriority = 'normal', onClose }: ProcessPriorityManagerProps) => {
  const [priority, setPriority] = useState(currentPriority);
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  const handleUpdatePriority = async () => {
    if (!pid || !name) {
      toast({ title: 'Informação', description: 'Selecione um processo para alterar a prioridade', variant: 'default' });
      return;
    }
    setIsUpdating(true);
    try {
      if (typeof window !== 'undefined' && (window as any).electronAPI) {
        await (window as any).electronAPI.setProcessPriority(pid, priority);
        toast({ title: 'Prioridade Atualizada', description: `${name} agora tem prioridade ${PRIORITIES.find(p => p.value === priority)?.label}` });
        onClose?.();
      } else {
        toast({ title: 'Modo Desktop Necessário', description: 'Execute o .exe para alterar prioridade', variant: 'default' });
      }
    } catch (error) {
      toast({ title: 'Erro', description: 'Não foi possível alterar a prioridade', variant: 'destructive' });
    } finally {
      setIsUpdating(false);
    }
  };

  // If no process selected, show info card
  if (!pid || !name) {
    return (
      <Card className="metric-card">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Gauge className="w-5 h-5 text-primary" />
            <CardTitle className="text-sm">Gerenciador de Prioridade</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center p-4 rounded-lg bg-muted/30">
            <Info className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              Selecione um processo na lista para gerenciar sua prioridade
            </p>
          </div>
          <div className="mt-4 space-y-2">
            <p className="text-xs text-muted-foreground font-medium">Níveis de Prioridade:</p>
            {PRIORITIES.map((p) => (
              <div key={p.value} className="flex items-center justify-between text-xs p-2 rounded bg-muted/20">
                <span className={p.color}>{p.label}</span>
                <span className="text-muted-foreground">{p.description}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="metric-card">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Gauge className="w-5 h-5 text-primary" />
          <CardTitle className="text-sm">Gerenciar Prioridade</CardTitle>
        </div>
        <p className="text-xs text-muted-foreground">{name} (PID: {pid})</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Select value={priority} onValueChange={setPriority}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione a prioridade" />
            </SelectTrigger>
            <SelectContent>
              {PRIORITIES.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  <div className="flex flex-col">
                    <span className={p.color}>{p.label}</span>
                    <span className="text-xs text-muted-foreground">{p.description}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {priority === 'realtime' && (
          <div className="p-2 rounded-lg bg-destructive/10 border border-destructive/30">
            <p className="text-xs text-destructive flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              Cuidado: Prioridade em tempo real pode causar instabilidade no sistema
            </p>
          </div>
        )}

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => onClose?.()} className="flex-1">
            Cancelar
          </Button>
          <Button onClick={handleUpdatePriority} disabled={isUpdating} className="flex-1">
            {isUpdating ? 'Atualizando...' : 'Aplicar'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
