// React login component upgraded with everything requested (particles, orbs, cinematic loading, AI placeholders, sounds, ripple, 3D effects)
// -----------------------------------------------
// ENTIRE FILE GENERATED. Ready to paste.
// -----------------------------------------------

/* IMPORTS */
import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Shield, ArrowRight, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import logoOpticlean from "@/assets/logo-opticlean.png";

/* SCHEMAS */
const emailSchema = z.string().trim().email({ message: "E-mail inválido" });
const passwordSchema = z
  .string()
  .trim()
  .min(6, { message: "Senha deve ter no mínimo 6 caracteres" });
const activationCodeSchema = z
  .string()
  .trim()
  .min(1, { message: "Código de ativação é obrigatório" });

const FOUNDER_EMAIL = "brunoquirin3@gmail.com";
const randBetween = (min: number, max: number): number => Math.floor(Math.random() * (max - min)) + min;

interface LoginProps {
  onLogin: (id: string, role: string, name?: string) => void;
}

/* --- SOUND ENGINE --- */
const playSound = (url: string, volume = 0.4): void => {
  const audio = new Audio(url);
  audio.volume = volume;
  audio.play();
};

/* PARTICLE CANVAS (UPGRADED) */
function ParticleCanvas({ intensity = 60 }: { intensity?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const raf = useRef<number | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    let w = (canvas.width = canvas.clientWidth * devicePixelRatio);
    let h = (canvas.height = canvas.clientHeight * devicePixelRatio);

    const particles = Array.from({ length: intensity }).map(() => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      r: 0.5 + Math.random() * 1.2,
      alpha: 0.06 + Math.random() * 0.1,
    }));

    const resize = () => {
      w = canvas.width = canvas.clientWidth * devicePixelRatio;
      h = canvas.height = canvas.clientHeight * devicePixelRatio;
    };
    window.addEventListener("resize", resize);

    const draw = () => {
      ctx.clearRect(0, 0, w, h);

      // particles
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = w;
        if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h;
        if (p.y > h) p.y = 0;

        ctx.beginPath();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = "#7b61ff";
        ctx.arc(p.x, p.y, p.r * devicePixelRatio, 0, Math.PI * 2);
        ctx.fill();
      });

      // connection lines
      ctx.globalAlpha = 0.04;
      particles.forEach((a, i) => {
        for (let j = i + 1; j < particles.length; j++) {
          const b = particles[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 90 * devicePixelRatio) {
            ctx.strokeStyle = "#7b61ff";
            ctx.lineWidth = 0.5 * devicePixelRatio;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      });

      raf.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener("resize", resize);
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ width: "100%", height: "100%" }}
    />
  );
}

/* TYPING AI PLACEHOLDER */
function useAIMockTyping(list: string[], delay = 1500): string {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % list.length), delay);
    return () => clearInterval(id);
  }, [list.length, delay]);
  return list[index];
}

export default function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [activationCode, setActivationCode] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState("idle");
  const { toast } = useToast();

  const isFounder = useMemo(
    () => email.toLowerCase() === FOUNDER_EMAIL.toLowerCase(),
    [email]
  );

  /* PARALLAX */
  const [parallax, setParallax] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const move = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      setParallax({ x: px * 12, y: py * 8 });
    };

    el.addEventListener("mousemove", move);
    el.addEventListener("mouseleave", () => setParallax({ x: 0, y: 0 }));

    return () => {
      el.removeEventListener("mousemove", move);
    };
  }, []);

  /* CINEMATIC LOADING SEQUENCE */
  const messages = [
    "Inicializando ambiente seguro…",
    "Validando integridade do sistema…",
    "Preparando módulos…",
    "Sincronizando permissões…",
    "Estabelecendo canal criptografado…",
  ];

  const [loadingMessage, setLoadingMessage] = useState(messages[0]);

  const runCinematic = async () => {
    setStage("loading");

    for (let i = 0; i < messages.length; i++) {
      setLoadingMessage(messages[i]);
      await new Promise((res) => setTimeout(res, randBetween(900, 1500)));
    }

    setStage("authing");
  };

  /* AI PLACEHOLDERS */
  const emailAI = useAIMockTyping([
    "seu@email.com",
    "usuario@empresa.com",
    "login@opticlean.com",
  ]);

  const passAI = useAIMockTyping([
    "••••••••",
    "senha da conta",
    "senha super segura",
  ]);

  /* HANDLE SUBMIT */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    playSound("/sounds/click.wav", 0.35);
    setLoading(true);

    try {
      emailSchema.parse(email);
      passwordSchema.parse(password);
      if (!isLogin && !isFounder) activationCodeSchema.parse(activationCode);

      await runCinematic();

      // AUTH
      if (isLogin) {
        const { data: authData, error: authError } =
          await supabase.auth.signInWithPassword({ email, password });

        if (authError) throw authError;

        const { data: profile } = await supabase
          .from("profiles")
          .select("role, full_name, email")
          .eq("id", authData.user.id)
          .single();

        onLogin(authData.user.id, profile?.role || 'user', profile?.full_name || undefined);
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Falha ao autenticar.";
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setStage("idle");
    }
  };

  return (
    <div
      ref={containerRef}
      className="min-h-screen flex items-center justify-center relative overflow-hidden bg-background"
    >
      <ParticleCanvas intensity={70} />

      {/* PARALLAX ORBS */}
      <motion.div
        className="absolute top-1/6 left-1/6 w-72 h-72 rounded-full bg-primary/20 blur-[120px]"
        style={{ transform: `translate3d(${parallax.x}px, ${parallax.y}px, 0)` }}
      />
      <motion.div
        className="absolute bottom-1/6 right-1/6 w-80 h-80 rounded-full bg-secondary/20 blur-[130px]"
        style={{ transform: `translate3d(${-parallax.x}px, ${-parallax.y}px, 0)` }}
      />

      <motion.div
        className="relative z-10 w-full max-w-md p-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="glass-strong rounded-2xl p-8 shadow-2xl">
          <div className="flex flex-col items-center mb-8 select-none">
            <motion.div
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="relative mb-4"
            >
              <div className="absolute inset-0 bg-primary/30 blur-2xl rounded-full scale-150" />
              <img
                src={logoOpticlean}
                className="w-20 h-20 relative z-10"
                alt="OptiClean Pro"
                draggable={false}
              />
            </motion.div>
            <h1 className="text-2xl font-bold text-gradient mb-1">OptiClean Pro</h1>
            <p className="text-sm text-muted-foreground">Sistema Corporativo Premium</p>
          </div>

          {/* FORM */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={email}
                placeholder={emailAI}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="h-11 rounded-lg"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                value={password}
                placeholder={passAI}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="h-11 rounded-lg"
              />
            </div>

            {!isFounder && (
              <div className="space-y-2">
                <Label htmlFor="code">Código de Ativação</Label>
                <Input
                  id="code"
                  type="text"
                  value={activationCode}
                  placeholder="XXXX-XXXX"
                  onChange={(e) => setActivationCode(e.target.value.toUpperCase())}
                  disabled={loading}
                  className="h-11 rounded-lg font-mono tracking-wider"
                />
              </div>
            )}

            {isFounder && (
              <div className="flex items-center gap-2 text-sm text-primary bg-primary/10 p-2 rounded-lg">
                <Shield className="w-4 h-4" />
                Acesso Administrativo
              </div>
            )}

            <div className="space-y-3">
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 rounded-lg font-medium"
                onClick={() => playSound("/sounds/click.wav", 0.4)}
              >
                <AnimatePresence mode="wait">
                  {loading ? (
                    <motion.span
                      key="load"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center"
                    >
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {stage === "loading" && loadingMessage}
                      {stage === "authing" && "Autenticando…"}
                    </motion.span>
                  ) : (
                    <motion.span
                      key="idle"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center"
                    >
                      {isLogin ? "Entrar" : "Criar Conta"}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </motion.span>
                  )}
                </AnimatePresence>
              </Button>

              <Button
                type="button"
                variant="ghost"
                disabled={loading}
                className="w-full h-10"
                onClick={() => {
                  playSound("/sounds/swoosh.mp3", 0.4);
                  setIsLogin(!isLogin);
                }}
              >
                {isLogin ? "Criar nova conta" : "Já tenho uma conta"}
              </Button>
            </div>
          </form>

          <p className="text-center text-xs text-muted-foreground mt-6 pt-6 border-t">
            v1.1.0 • © 2025 OptiClean Pro
          </p>
        </Card>
      </motion.div>
    </div>
  );
}
