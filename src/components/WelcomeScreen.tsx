import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles } from "lucide-react";
import logoOpticlean from "@/assets/logo-opticlean.png";

interface WelcomeScreenProps {
  userName: string;
  onComplete: () => void;
}

const steps = [
  "Inicializando módulos...",
  "Verificando integridade do sistema...",
  "Otimizando ambiente...",
  "Carregando interface...",
  "Finalizando...",
];

export default function WelcomeScreen({ userName, onComplete }: WelcomeScreenProps) {
  const totalLoadTime = 10000; // 10 segundos
  const stepDuration = totalLoadTime / steps.length;

  const [progress, setProgress] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);
  const [stage, setStage] = useState<"welcome" | "loading" | "done">("welcome");

  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];

    // 1) Troca do welcome → loading
    timers.push(
      setTimeout(() => setStage("loading"), 1800)
    );

    // 2) Barra de progresso
    timers.push(
      setTimeout(() => {
        let start = 0;
        const interval = setInterval(() => {
          start += 1;
          setProgress(start);
          if (start >= 100) clearInterval(interval);
        }, totalLoadTime / 100);

        timers.push(interval);
      }, 2000)
    );

    // 3) troca das etapas
    steps.forEach((_, idx) => {
      timers.push(
        setTimeout(() => setStepIndex(idx), 2000 + idx * stepDuration)
      );
    });

    // 4) Finalização
    timers.push(
      setTimeout(() => {
        setStage("done");
        setTimeout(onComplete, 1000);
      }, totalLoadTime + 2500)
    );

    return () => timers.forEach((t) => clearTimeout(t));
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background overflow-hidden select-none">

      {/* Dynamic Light Background */}
      <motion.div
        className="absolute inset-0 gradient-rgb-animated opacity-60"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        transition={{ duration: 1 }}
      />

      {/* Orbs */}
      <motion.div
        className="absolute top-1/3 left-1/4 w-[420px] h-[420px] rounded-full bg-primary/15 blur-[130px]"
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.8 }}
      />
      <motion.div
        className="absolute bottom-1/3 right-1/4 w-[360px] h-[360px] rounded-full bg-secondary/20 blur-[110px]"
        initial={{ opacity: 0, scale: 0.7 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 2 }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center">

        {/* Logo */}
        <motion.div
          initial={{ scale: 0.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.9, ease: "anticipate" }}
          className="relative mb-8"
        >
          <div className="absolute inset-0 bg-primary/25 blur-3xl rounded-full scale-150 animate-pulse" />
          <img
            src={logoOpticlean}
            className="w-28 h-28 drop-shadow-[0_0_25px_rgba(0,0,0,0.45)]"
            alt=""
            draggable={false}
          />
          <Sparkles className="absolute -top-2 -right-2 text-primary w-6 h-6 animate-pulse" />
        </motion.div>

        {/* Welcome */}
        <AnimatePresence mode="wait">
          {stage === "welcome" && (
            <motion.div
              key="welcome"
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.6 }}
              className="text-center"
            >
              <h1 className="text-5xl font-bold text-gradient">Bem-vindo</h1>
              <p className="mt-4 text-2xl text-foreground/80 font-semibold">
                {userName || "Usuário"}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading */}
        <AnimatePresence mode="wait">
          {stage === "loading" && (
            <motion.div
              key="loading"
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
              className="w-[330px] mt-12 flex flex-col items-center"
            >
              {/* Step text */}
              <motion.p
                key={stepIndex}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="text-sm text-muted-foreground"
              >
                {steps[stepIndex]}
              </motion.p>

              {/* Progress bar */}
              <div className="w-full h-2 bg-muted/40 rounded-full mt-4 overflow-hidden">
                <motion.div
                  className="h-full bg-primary"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.2, ease: "linear" }}
                />
              </div>

              <p className="mt-4 text-xs text-muted-foreground/70">{progress}%</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Done */}
        {stage === "done" && (
          <motion.p
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="mt-12 text-primary font-semibold text-lg"
          >
            Concluido!
          </motion.p>
        )}
      </div>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
        className="absolute bottom-8 text-xs text-muted-foreground/60"
      >
        OptiClean Pro v1
      </motion.div>
    </div>
  );
}