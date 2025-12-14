import { Progress } from '@/components/ui/progress';
import type { PasswordStrength } from '@/hooks/usePasswordStrength';

interface PasswordStrengthIndicatorProps {
  strength: PasswordStrength;
  strengthColor: string;
  strengthBg: string;
  strengthLabel: string;
}

export const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({
  strength,
  strengthColor,
  strengthBg,
  strengthLabel,
}) => {
  const progressValue = {
    weak: 25,
    fair: 50,
    good: 75,
    strong: 100,
  }[strength];

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Força da senha:</span>
        <span className={strengthColor}>{strengthLabel}</span>
      </div>
      <Progress value={progressValue} className="h-1.5" />
    </div>
  );
};

