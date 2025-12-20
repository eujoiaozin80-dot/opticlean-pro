import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileCode, Plus, Trash2, Wand2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CodeTemplate {
  id: string;
  name: string;
  prefix: string;
  validityDays: number;
  description: string;
}

interface CodeTemplatesProps {
  userId?: string;
  onGenerateWithTemplate?: (template: CodeTemplate) => void;
  onCodeCreated?: () => void;
}

const DEFAULT_TEMPLATES: CodeTemplate[] = [
  { id: '1', name: 'Trial', prefix: 'TRIAL', validityDays: 7, description: 'Período de teste' },
  { id: '2', name: 'Mensal', prefix: 'MES', validityDays: 30, description: 'Assinatura mensal' },
  { id: '3', name: 'Anual', prefix: 'ANO', validityDays: 365, description: 'Assinatura anual' },
  { id: '4', name: 'Vitalício', prefix: 'VIP', validityDays: 36500, description: 'Acesso vitalício' },
];

export const CodeTemplates = ({ onGenerateWithTemplate, onCodeCreated }: CodeTemplatesProps) => {
  const [templates, setTemplates] = useState<CodeTemplate[]>(() => {
    const saved = localStorage.getItem('code_templates');
    return saved ? JSON.parse(saved) : DEFAULT_TEMPLATES;
  });
  const [isAdding, setIsAdding] = useState(false);
  const [newTemplate, setNewTemplate] = useState({ name: '', prefix: '', validityDays: 30, description: '' });
  const { toast } = useToast();

  const saveTemplates = (updated: CodeTemplate[]) => {
    setTemplates(updated);
    localStorage.setItem('code_templates', JSON.stringify(updated));
  };

  const addTemplate = () => {
    if (!newTemplate.name || !newTemplate.prefix) {
      toast({ title: 'Erro', description: 'Preencha nome e prefixo', variant: 'destructive' });
      return;
    }

    const template: CodeTemplate = {
      id: Date.now().toString(),
      ...newTemplate
    };

    saveTemplates([...templates, template]);
    setNewTemplate({ name: '', prefix: '', validityDays: 30, description: '' });
    setIsAdding(false);
    toast({ title: 'Template criado' });
  };

  const deleteTemplate = (id: string) => {
    saveTemplates(templates.filter(t => t.id !== id));
    toast({ title: 'Template removido' });
  };

  return (
    <Card className="metric-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileCode className="w-4 h-4 text-secondary" />
            <CardTitle className="text-sm font-medium">Templates de Código</CardTitle>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setIsAdding(!isAdding)}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {isAdding && (
          <div className="space-y-2 p-3 rounded-lg bg-muted/30 border border-border">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Nome</Label>
                <Input
                  value={newTemplate.name}
                  onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                  placeholder="Ex: Premium"
                  className="h-8 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs">Prefixo</Label>
                <Input
                  value={newTemplate.prefix}
                  onChange={(e) => setNewTemplate({ ...newTemplate, prefix: e.target.value.toUpperCase() })}
                  placeholder="Ex: PRE"
                  className="h-8 text-sm"
                  maxLength={5}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Validade (dias)</Label>
                <Input
                  type="number"
                  value={newTemplate.validityDays}
                  onChange={(e) => setNewTemplate({ ...newTemplate, validityDays: parseInt(e.target.value) || 30 })}
                  className="h-8 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs">Descrição</Label>
                <Input
                  value={newTemplate.description}
                  onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })}
                  placeholder="Ex: Plano premium"
                  className="h-8 text-sm"
                />
              </div>
            </div>
            <Button size="sm" onClick={addTemplate} className="w-full">
              Criar Template
            </Button>
          </div>
        )}

        <div className="space-y-2 max-h-[250px] overflow-y-auto">
          {templates.map((template) => (
            <div
              key={template.id}
              className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors group"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{template.name}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded bg-primary/20 text-primary">
                    {template.prefix}-
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {template.validityDays} dias • {template.description}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onGenerateWithTemplate?.(template)}
                  className="h-7"
                >
                  <Wand2 className="w-3 h-3 mr-1" />
                  Gerar
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteTemplate(template.id)}
                  className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
