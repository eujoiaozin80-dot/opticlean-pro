import { useEffect, useState } from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import logoOpticlean from '@/assets/logo-opticlean.png';

interface WelcomeScreenProps {
  userName: string;
  onComplete: () => void;
}

const WelcomeScreen = ({ userName, onComplete }: WelcomeScreenProps) => {
  const [stage, setStage] = useState<'welcome' | 'loading' | 'ready'>('welcome');

  useEffect(() => {
    // Stage 1: Show welcome message
    const timer1 = setTimeout(() => setStage('loading'), 1500);
    
    // Stage 2: Show loading
    const timer2 = setTimeout(() => setStage('ready'), 3000);
    
    // Stage 3: Complete and transition
    const timer3 = setTimeout(() => onComplete(), 3800);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-grid opacity-30" />
      <div className="gradient-rgb-animated absolute inset-0 opacity-50" />
      
      {/* Floating Orbs */}
      <div className="absolute top-1/3 left-1/4 w-96 h-96 rounded-full bg-primary/10 blur-[120px] animate-pulse" />
      <div className="absolute bottom-1/3 right-1/4 w-80 h-80 rounded-full bg-secondary/10 blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
      
      {/* Content */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Logo with glow */}
        <div className="relative mb-8 animate-scale-in">
          <div className="absolute inset-0 bg-primary/30 blur-3xl rounded-full scale-150 animate-pulse" />
          <img 
            src={logoOpticlean} 
            alt="OptiClean Pro" 
            className="w-28 h-28 relative z-10 drop-shadow-2xl"
          />
          <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-primary animate-pulse" />
        </div>

        {/* Welcome Text */}
        <div className={`transition-all duration-700 ${stage === 'welcome' ? 'opacity-100 translate-y-0' : 'opacity-100 -translate-y-2'}`}>
          <h1 className="text-4xl md:text-5xl font-bold text-gradient text-center mb-4 animate-fade-in">
            Bem-vindo
          </h1>
          
          <p className={`text-2xl md:text-3xl font-semibold text-foreground/90 text-center transition-all duration-500 delay-300 ${stage === 'welcome' ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}>
            {userName || 'Usuário'}
          </p>
        </div>

        {/* Loading Spinner */}
        <div className={`mt-12 flex flex-col items-center transition-all duration-500 ${stage === 'loading' || stage === 'ready' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          {stage !== 'ready' ? (
            <>
              <div className="relative">
                <div className="w-16 h-16 border-4 border-primary/20 rounded-full" />
                <div className="absolute inset-0 w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
              <p className="mt-6 text-muted-foreground text-sm animate-pulse">
                Carregando seu ambiente...
              </p>
            </>
          ) : (
            <div className="flex flex-col items-center animate-scale-in">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                <svg 
                  className="w-8 h-8 text-primary animate-scale-in" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={3} 
                    d="M5 13l4 4L19 7" 
                  />
                </svg>
              </div>
              <p className="mt-6 text-primary text-sm font-medium">
                Pronto!
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom branding */}
      <div className="absolute bottom-8 text-center">
        <p className="text-xs text-muted-foreground/60">
          OptiClean Pro v1.1.0
        </p>
      </div>
    </div>
  );
};

export default WelcomeScreen;
