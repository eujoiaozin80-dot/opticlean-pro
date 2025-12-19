import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Zap, Plus, X, Play, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Shortcut {
  id: string;
  name: string;
  command: string;
}

export const ProcessShortcuts = () => {
  const [shortcuts, setShortcuts] = useState<Shortcut[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCommand, setNewCommand] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    const saved = localStorage.getItem('process_shortcuts');
    if (saved) {
      setShortcuts(JSON.parse(saved));
    } else {
      // Atalhos padrão
      setShortcuts([
        { id: '1', name: 'Task Manager', command: 'taskmgr' },
        { id: '2', name: 'Painel de Controle', command: 'control' },
        { id: '3', name: 'Prompt de Comando', command: 'cmd' },
      ]);
    }
  }, []);

  const saveShortcuts = (updated: Shortcut[]) => {
    setShortcuts(updated);
    localStorage.setItem('process_shortcuts', JSON.stringify(updated));
  };

  const addShortcut = () => {
    if (!newName.trim() || !newCommand.trim()) return;
    
    const shortcut: Shortcut = {
      id: Date.now().toString(),
      name: newName,
      command: newCommand
    };
    
    saveShortcuts([...shortcuts, shortcut]);
    setNewName('');
    setNewCommand('');
    setIsAdding(false);
    toast({ title: 'Atalho adicionado' });
  };

  const deleteShortcut = (id: string) => {
    saveShortcuts(shortcuts.filter(s => s.id !== id));
  };

  const runShortcut = async (shortcut: Shortcut) => {
    if (typeof window !== 'undefined' && (window as any).electronAPI) {
      try {
        await (window as any).electronAPI.runCommand(shortcut.command);
        toast({ title: 'Executado', description: `${shortcut.name} iniciado` });
      } catch (error) {
        toast({ title: 'Erro', description: 'Falha ao executar comando', variant: 'destructive' });
      }
    } else {
      toast({ 
        title: 'Modo Desktop Necessário', 
        description: 'Execute o .exe para usar atalhos',
        variant: 'default'
      });
    }
  };

  return (
    <Card className="metric-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-yellow-500" />
            <CardTitle className="text-sm font-medium">Atalhos Rápidos</CardTitle>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setIsAdding(!isAdding)}>
            {isAdding ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {isAdding && (
          <div className="space-y-2 p-2 rounded-lg bg-muted/30">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Nome do atalho"
              className="h-8 text-sm"
            />
            <Input
              value={newCommand}
              onChange={(e) => setNewCommand(e.target.value)}
              placeholder="Comando (ex: notepad)"
              className="h-8 text-sm"
            />
            <Button size="sm" onClick={addShortcut} className="w-full">
              Adicionar
            </Button>
          </div>
        )}
        
        <div className="grid grid-cols-2 gap-2">
          {shortcuts.map((shortcut) => (
            <div key={shortcut.id} className="group relative">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start text-xs h-8"
                onClick={() => runShortcut(shortcut)}
              >
                <Play className="w-3 h-3 mr-1" />
                {shortcut.name}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="absolute -top-1 -right-1 h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity bg-destructive/20 hover:bg-destructive/40 rounded-full"
                onClick={() => deleteShortcut(shortcut.id)}
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
