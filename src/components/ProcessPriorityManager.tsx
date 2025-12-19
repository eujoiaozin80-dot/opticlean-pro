import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Gauge, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ProcessPriorityManagerProps {
  pid: number;
  name: string;
  currentPriority?: string;
  onClose: () => void;
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
    setIsUpdating(true);
    try {
      if (typeof window !== 'undefined' && (window as any).electronAPI) {
        await (window as any).electronAPI.setProcessPriority(pid, priority);
        toast({ title: 'Prioridade Atualizada', description: `${name} agora tem prioridade ${PRIORITIES.find(p => p.value === priority)?.label}` });
        onClose();
      } else {
        toast({ title: 'Modo Desktop Necessário', description: 'Execute o .exe para alterar prioridade', variant: 'default' });
      }
    } catch (error) {
      toast({ title: 'Erro', description: 'Não foi possível alterar a prioridade', variant: 'destructive' });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
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
          <Button variant="outline" onClick={onClose} className="flex-1">
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
