import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Database, Download, Upload, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface BackupInfo {
  date: string;
  version: string;
  size: number;
  items: {
    settings: boolean;
    notes: boolean;
    shortcuts: boolean;
    profiles: boolean;
    history: boolean;
  };
}

export const BackupRestore = () => {
  const [lastBackup, setLastBackup] = useState<BackupInfo | null>(() => {
    const saved = localStorage.getItem('last_backup_info');
    return saved ? JSON.parse(saved) : null;
  });
  const [isRestoring, setIsRestoring] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const createBackup = () => {
    try {
      const backup = {
        version: '1.0',
        date: new Date().toISOString(),
        data: {
          app_settings: localStorage.getItem('app_settings'),
          quick_notes: localStorage.getItem('quick_notes'),
          process_shortcuts: localStorage.getItem('process_shortcuts'),
          performance_profiles: localStorage.getItem('performance_profiles'),
          active_profile: localStorage.getItem('active_profile'),
          code_templates: localStorage.getItem('code_templates'),
          discord_webhook_url: localStorage.getItem('discord_webhook_url'),
          discord_notifications_enabled: localStorage.getItem('discord_notifications_enabled'),
          protected_processes: localStorage.getItem('protected_processes'),
          process_history: localStorage.getItem('process_history'),
        },
      };

      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `opticlean-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      const backupInfo: BackupInfo = {
        date: backup.date,
        version: backup.version,
        size: blob.size,
        items: {
          settings: !!backup.data.app_settings,
          notes: !!backup.data.quick_notes,
          shortcuts: !!backup.data.process_shortcuts,
          profiles: !!backup.data.performance_profiles,
          history: !!backup.data.process_history,
        },
      };
      setLastBackup(backupInfo);
      localStorage.setItem('last_backup_info', JSON.stringify(backupInfo));

      toast({ title: 'Backup Criado', description: 'Arquivo de backup baixado com sucesso' });
    } catch (error) {
      toast({ title: 'Erro', description: 'Falha ao criar backup', variant: 'destructive' });
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsRestoring(true);
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const backup = JSON.parse(e.target?.result as string);
        
        if (!backup.version || !backup.data) {
          throw new Error('Arquivo de backup inválido');
        }

        // Restore data
        Object.entries(backup.data).forEach(([key, value]) => {
          if (value) {
            localStorage.setItem(key, value as string);
          }
        });

        toast({ 
          title: 'Restaurado', 
          description: 'Dados restaurados com sucesso. Recarregue a página para aplicar.' 
        });
      } catch (error) {
        toast({ 
          title: 'Erro', 
          description: 'Arquivo de backup inválido ou corrompido', 
          variant: 'destructive' 
        });
      } finally {
        setIsRestoring(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    };

    reader.onerror = () => {
      toast({ title: 'Erro', description: 'Falha ao ler arquivo', variant: 'destructive' });
      setIsRestoring(false);
    };

    reader.readAsText(file);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Card className="metric-card">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-primary" />
          <CardTitle className="text-sm font-medium">Backup & Restauração</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <Button onClick={createBackup} className="w-full">
            <Download className="w-4 h-4 mr-2" />
            Criar Backup
          </Button>
          <Button 
            variant="outline" 
            onClick={() => fileInputRef.current?.click()}
            disabled={isRestoring}
            className="w-full"
          >
            <Upload className="w-4 h-4 mr-2" />
            {isRestoring ? 'Restaurando...' : 'Restaurar'}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        {/* Last Backup Info */}
        {lastBackup && (
          <div className="p-3 rounded-lg bg-muted/30 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Último Backup</span>
              <Badge variant="outline" className="text-[10px]">v{lastBackup.version}</Badge>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              {formatDate(lastBackup.date)}
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Database className="w-3 h-3" />
              {formatSize(lastBackup.size)}
            </div>
            <div className="flex flex-wrap gap-1 pt-1">
              {Object.entries(lastBackup.items).map(([key, value]) => (
                <Badge 
                  key={key} 
                  variant={value ? 'default' : 'secondary'} 
                  className="text-[10px]"
                >
                  {value ? <CheckCircle className="w-2 h-2 mr-1" /> : <AlertCircle className="w-2 h-2 mr-1" />}
                  {key}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Info */}
        <div className="p-2 rounded-lg bg-primary/5 border border-primary/20">
          <p className="text-xs text-muted-foreground">
            O backup inclui configurações, notas, atalhos, perfis de performance e histórico.
            Dados do banco de dados não são incluídos.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
