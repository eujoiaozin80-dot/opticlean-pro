import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useScheduledTasks, ScheduledTask } from '@/hooks/useScheduledTasks';
import { useToast } from '@/hooks/use-toast';
import { 
  Calendar, 
  Clock, 
  Plus, 
  Trash2, 
  Settings2, 
  Sparkles,
  Search,
  Play
} from 'lucide-react';

const taskTypeIcons = {
  cleaning: <Trash2 className="w-4 h-4 text-primary" />,
  optimization: <Sparkles className="w-4 h-4 text-secondary" />,
  analysis: <Search className="w-4 h-4 text-accent" />,
};

const taskTypeLabels = {
  cleaning: 'Limpeza',
  optimization: 'Otimização',
  analysis: 'Análise',
};

const scheduleLabels = {
  daily: 'Diário',
  weekly: 'Semanal',
  monthly: 'Mensal',
};

const daysOfWeek = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export const ScheduledTasksPanel = () => {
  const { tasks, addTask, deleteTask, toggleTask } = useScheduledTasks();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  
  // Form state
  const [taskName, setTaskName] = useState('');
  const [taskType, setTaskType] = useState<'cleaning' | 'optimization' | 'analysis'>('cleaning');
  const [schedule, setSchedule] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [time, setTime] = useState('09:00');
  const [dayOfWeek, setDayOfWeek] = useState(1);

  const handleAddTask = () => {
    if (!taskName.trim()) {
      toast({ title: 'Erro', description: 'Digite um nome para a tarefa', variant: 'destructive' });
      return;
    }

    addTask({
      name: taskName,
      type: taskType,
      schedule,
      time,
      dayOfWeek: schedule === 'weekly' ? dayOfWeek : undefined,
      enabled: true,
    });

    toast({ title: 'Tarefa Criada', description: `${taskName} agendada com sucesso` });
    setDialogOpen(false);
    setTaskName('');
  };

  const handleDelete = (task: ScheduledTask) => {
    deleteTask(task.id);
    toast({ title: 'Tarefa Removida', description: task.name });
  };

  const formatNextRun = (isoString?: string) => {
    if (!isoString) return 'N/A';
    const date = new Date(isoString);
    return date.toLocaleDateString('pt-BR', { 
      weekday: 'short', 
      day: '2-digit', 
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Card className="metric-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            <CardTitle className="text-sm font-medium">Tarefas Agendadas</CardTitle>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="h-8">
                <Plus className="w-4 h-4 mr-1" />
                Nova Tarefa
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Settings2 className="w-5 h-5" />
                  Agendar Nova Tarefa
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Nome da Tarefa</Label>
                  <Input 
                    placeholder="Ex: Limpeza Semanal"
                    value={taskName}
                    onChange={(e) => setTaskName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Tipo de Operação</Label>
                  <Select value={taskType} onValueChange={(v: any) => setTaskType(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cleaning">🧹 Limpeza do Sistema</SelectItem>
                      <SelectItem value="optimization">⚡ Otimização</SelectItem>
                      <SelectItem value="analysis">🔍 Análise de Saúde</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Frequência</Label>
                  <Select value={schedule} onValueChange={(v: any) => setSchedule(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Diário</SelectItem>
                      <SelectItem value="weekly">Semanal</SelectItem>
                      <SelectItem value="monthly">Mensal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {schedule === 'weekly' && (
                  <div className="space-y-2">
                    <Label>Dia da Semana</Label>
                    <Select value={String(dayOfWeek)} onValueChange={(v) => setDayOfWeek(Number(v))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {daysOfWeek.map((day, i) => (
                          <SelectItem key={i} value={String(i)}>{day}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Horário</Label>
                  <Input 
                    type="time" 
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                  />
                </div>

                <Button onClick={handleAddTask} className="w-full btn-primary">
                  <Calendar className="w-4 h-4 mr-2" />
                  Agendar Tarefa
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <CardDescription className="text-xs">
          Execute limpeza e otimização automaticamente
        </CardDescription>
      </CardHeader>
      <CardContent>
        {tasks.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nenhuma tarefa agendada</p>
            <p className="text-xs mt-1">Clique em "Nova Tarefa" para começar</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {tasks.map((task) => (
              <div 
                key={task.id}
                className={`flex items-center justify-between p-3 rounded-lg border border-border/50 transition-all ${
                  task.enabled ? 'bg-muted/20' : 'bg-muted/5 opacity-60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-background/50">
                    {taskTypeIcons[task.type]}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{task.name}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{taskTypeLabels[task.type]}</span>
                      <span>•</span>
                      <span>{scheduleLabels[task.schedule]}</span>
                      <span>•</span>
                      <Clock className="w-3 h-3" />
                      <span>{task.time}</span>
                    </div>
                    {task.nextRun && (
                      <p className="text-[10px] text-muted-foreground mt-1">
                        Próxima: {formatNextRun(task.nextRun)}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch 
                    checked={task.enabled}
                    onCheckedChange={() => toggleTask(task.id)}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(task)}
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ScheduledTasksPanel;
