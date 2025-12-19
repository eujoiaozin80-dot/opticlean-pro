import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Camera, Clock, Trash2, Download, Eye, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface ProcessSnapshot {
  id: string;
  timestamp: string;
  processCount: number;
  totalCpu: number;
  totalMemory: number;
  processes: Array<{
    pid: number;
    name: string;
    cpuPercent: number;
    memPercent: number;
  }>;
}

interface ProcessSnapshotsProps {
  currentProcesses?: Array<{
    pid: number;
    name: string;
    cpuPercent: number;
    memPercent: number;
  }>;
  processes?: Array<{
    pid: number;
    name: string;
    cpuPercent: number;
    memPercent: number;
  }>;
}

export const ProcessSnapshots = ({ currentProcesses, processes }: ProcessSnapshotsProps) => {
  const processData = currentProcesses || processes || [];
  const [snapshots, setSnapshots] = useState<ProcessSnapshot[]>([]);
  const [viewingSnapshot, setViewingSnapshot] = useState<ProcessSnapshot | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const saved = localStorage.getItem('process_snapshots');
    if (saved) {
      setSnapshots(JSON.parse(saved));
    }
  }, []);

  const saveSnapshots = (updated: ProcessSnapshot[]) => {
    setSnapshots(updated);
    localStorage.setItem('process_snapshots', JSON.stringify(updated));
  };

  const takeSnapshot = () => {
    const snapshot: ProcessSnapshot = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      processCount: processData.length,
      totalCpu: processData.reduce((sum, p) => sum + p.cpuPercent, 0),
      totalMemory: processData.reduce((sum, p) => sum + p.memPercent, 0),
      processes: processData.slice(0, 50), // Top 50
    };

    saveSnapshots([snapshot, ...snapshots].slice(0, 10)); // Keep last 10
    toast({ title: 'Snapshot Capturado', description: `${processData.length} processos salvos` });
  };

  const deleteSnapshot = (id: string) => {
    saveSnapshots(snapshots.filter(s => s.id !== id));
    toast({ title: 'Snapshot Removido' });
  };

  const exportSnapshot = (snapshot: ProcessSnapshot) => {
    const data = JSON.stringify(snapshot, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `snapshot_${new Date(snapshot.timestamp).toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({ title: 'Exportado', description: 'Snapshot salvo como JSON' });
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <>
      <Card className="metric-card">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Camera className="w-4 h-4 text-purple-500" />
              <CardTitle className="text-sm font-medium">Snapshots</CardTitle>
              <Badge variant="outline" className="text-xs">{snapshots.length}/10</Badge>
            </div>
            <Button variant="default" size="sm" onClick={takeSnapshot} disabled={currentProcesses.length === 0}>
              <Camera className="w-4 h-4 mr-1" />
              Capturar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-2 max-h-[250px] overflow-y-auto">
          {snapshots.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">
              Nenhum snapshot. Capture um para comparar processos no tempo.
            </p>
          ) : (
            snapshots.map((snapshot) => (
              <div
                key={snapshot.id}
                className="flex items-center justify-between p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{formatDate(snapshot.timestamp)}</p>
                    <p className="text-xs text-muted-foreground">
                      {snapshot.processCount} processos • CPU: {snapshot.totalCpu.toFixed(1)}% • RAM: {snapshot.totalMemory.toFixed(1)}%
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setViewingSnapshot(snapshot)}
                    className="h-7 w-7 p-0"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => exportSnapshot(snapshot)}
                    className="h-7 w-7 p-0"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteSnapshot(snapshot.id)}
                    className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Snapshot Detail Dialog */}
      <Dialog open={!!viewingSnapshot} onOpenChange={() => setViewingSnapshot(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Camera className="w-5 h-5" />
              Snapshot - {viewingSnapshot && formatDate(viewingSnapshot.timestamp)}
            </DialogTitle>
          </DialogHeader>
          {viewingSnapshot && (
            <div className="space-y-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-3 gap-2">
                <div className="p-3 rounded-lg bg-muted/30 text-center">
                  <p className="text-2xl font-bold">{viewingSnapshot.processCount}</p>
                  <p className="text-xs text-muted-foreground">Processos</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/30 text-center">
                  <p className="text-2xl font-bold">{viewingSnapshot.totalCpu.toFixed(1)}%</p>
                  <p className="text-xs text-muted-foreground">CPU Total</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/30 text-center">
                  <p className="text-2xl font-bold">{viewingSnapshot.totalMemory.toFixed(1)}%</p>
                  <p className="text-xs text-muted-foreground">RAM Total</p>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-sm font-medium">Top Processos</p>
                <div className="space-y-1 max-h-[300px] overflow-y-auto">
                  {viewingSnapshot.processes
                    .sort((a, b) => b.cpuPercent - a.cpuPercent)
                    .slice(0, 20)
                    .map((proc, i) => (
                      <div key={i} className="flex items-center justify-between p-2 rounded bg-muted/20 text-sm">
                        <span className="truncate flex-1">{proc.name}</span>
                        <div className="flex gap-4 text-xs">
                          <span className="w-16 text-right">CPU: {proc.cpuPercent.toFixed(1)}%</span>
                          <span className="w-16 text-right">RAM: {proc.memPercent.toFixed(1)}%</span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
