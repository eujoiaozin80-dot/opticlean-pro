import { useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Download, RefreshCw, CheckCircle2 } from 'lucide-react';
import { useAppUpdates } from '@/hooks/useAppUpdates';

interface UpdateInfo {
  version: string;
  releaseDate: string;
  releaseNotes: string;
}

interface UpdateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const UpdateDialog = ({ open, onOpenChange }: UpdateDialogProps) => {
  const {
    checking,
    available,
    downloading,
    downloaded,
    downloadProgress,
    updateInfo,
    currentVersion,
    error,
    checkForUpdates,
    downloadUpdate,
    installUpdate,
  } = useAppUpdates();

  useEffect(() => {
    if (available && updateInfo) {
      onOpenChange(true);
    }
  }, [available, updateInfo, onOpenChange]);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {downloaded ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  Atualização Pronta
                </>
              ) : updateInfo ? (
                <>
                  <Download className="w-5 h-5 text-primary" />
                  Nova Versão Disponível
                </>
              ) : (
                <>
                  <RefreshCw className="w-5 h-5 text-primary" />
                  Verificar Atualizações
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {downloaded
                ? 'A atualização foi baixada e será instalada ao reiniciar.'
                : updateInfo
                ? `Versão ${updateInfo.version} está disponível para download.`
                : 'Verifique se há atualizações disponíveis para o Byte Latency.'}
            </DialogDescription>
          </DialogHeader>

          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
              {error}
            </div>
          )}

          {currentVersion && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Versão atual:</span>
              <Badge variant="outline">{currentVersion}</Badge>
            </div>
          )}

          {updateInfo && !downloaded && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Nova versão:</span>
                <Badge variant="default" className="bg-primary">
                  {updateInfo.version}
                </Badge>
              </div>
              
              {updateInfo.releaseNotes && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Notas da versão:</p>
                  <p className="text-sm whitespace-pre-wrap">{updateInfo.releaseNotes}</p>
                </div>
              )}

              {downloading && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Baixando atualização...</span>
                    <span className="font-medium">{downloadProgress}%</span>
                  </div>
                  <Progress value={downloadProgress} className="h-2" />
                </div>
              )}
            </div>
          )}

          {downloaded && (
            <div className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              <div className="flex-1">
                <p className="text-sm font-medium">Atualização baixada com sucesso!</p>
                <p className="text-xs text-muted-foreground">
                  O aplicativo será reiniciado para instalar a nova versão.
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            {!updateInfo && !downloaded && (
              <Button
                onClick={checkForUpdates}
                disabled={checking}
                className="w-full"
              >
                {checking ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Verificando...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Verificar Atualizações
                  </>
                )}
              </Button>
            )}

            {updateInfo && !downloading && !downloaded && (
              <>
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Depois
                </Button>
                <Button onClick={downloadUpdate} className="btn-primary">
                  <Download className="w-4 h-4 mr-2" />
                  Baixar Atualização
                </Button>
              </>
            )}

            {downloading && (
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Baixando... {downloadProgress}%
              </Button>
            )}

            {downloaded && (
              <>
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Depois
                </Button>
                <Button onClick={installUpdate} className="btn-primary">
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Reiniciar e Instalar
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
