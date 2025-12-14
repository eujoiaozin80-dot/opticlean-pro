import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface ProgressDialogProps {
  open: boolean;
  title: string;
  description?: string;
  progress: number; // 0-100
  currentStep?: string;
  onCancel?: () => void;
  cancelable?: boolean;
}

export const ProgressDialog: React.FC<ProgressDialogProps> = ({
  open,
  title,
  description,
  progress,
  currentStep,
  onCancel,
  cancelable = false,
}) => {
  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" hideCloseButton={!cancelable}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <div className="space-y-4 py-4">
          {currentStep && (
            <p className="text-sm text-muted-foreground">{currentStep}</p>
          )}
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{Math.round(progress)}%</span>
            <span>{currentStep || 'Processando...'}</span>
          </div>
          {cancelable && onCancel && (
            <Button variant="outline" onClick={onCancel} className="w-full">
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

