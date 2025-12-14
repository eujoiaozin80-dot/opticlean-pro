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
import { Progress } from "@/components/ui/progress";
import { Shield, ArrowRight, Loader2, Mail, Lock, Key, AlertCircle, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { AUTH_CONFIG } from "@/config/auth";
import { useLoginAttempts } from "@/hooks/useLoginAttempts";
import { usePasswordStrength } from "@/hooks/usePasswordStrength";
import { validateActivationCode, markActivationCodeAsUsed } from "@/utils/activationCode";
import logoOpticlean from "@/assets/logo-opticlean.png";

/* SCHEMAS */
const emailSchema = z.string().trim().email({ message: "E-mail inválido" });
const passwordSchema = z
  .string()
  .trim()
  .min(6, { message: "Senha deve ter no mínimo 6 caracteres" })
  .refine(
    (val) => /[A-Z]/.test(val),
    { message: "Senha deve conter pelo menos uma letra maiúscula" }
  )
  .refine(
    (val) => /\d/.test(val),
    { message: "Senha deve conter pelo menos um número" }
  )
  .refine(
    (val) => /[^a-zA-Z\d]/.test(val),
    { message: "Senha deve conter pelo menos um caractere especial" }
  );
const activationCodeSchema = z
  .string()
  .trim()
  .min(1, { message: "Código de ativação é obrigatório" });

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
  const [emailError, setEmailError] = useState("");
  const [codeValidation, setCodeValidation] = useState<{ valid: boolean; error?: string } | null>(null);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const { toast } = useToast();

  // Rate limiting
  const { canAttempt, remainingAttempts, timeUntilReset, recordAttempt, resetAttempts } = useLoginAttempts();

  // Timer visual para tentativas
  useEffect(() => {
    if (timeUntilReset > 0) {
      setTimerSeconds(Math.ceil(timeUntilReset / 1000));
      const interval = setInterval(() => {
        setTimerSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setTimerSeconds(0);
    }
  }, [timeUntilReset]);

  // Verificar requisitos de senha
  const passwordRequirements = useMemo(() => {
    return {
      minLength: password.length >= 6,
      hasUpperCase: /[A-Z]/.test(password),
      hasNumber: /\d/.test(password),
      hasSpecial: /[^a-zA-Z\d]/.test(password),
    };
  }, [password]);

  // Password strength
  const { strength, strengthColor, strengthBg, strengthLabel } = usePasswordStrength(password);

  const isFounder = useMemo(
    () => email.toLowerCase() === AUTH_CONFIG.FOUNDER_EMAIL.toLowerCase(),
    [email]
  );

  // Validar email em tempo real
  useEffect(() => {
    if (email && !emailSchema.safeParse(email).success) {
      setEmailError("Email inválido");
    } else {
      setEmailError("");
    }
  }, [email]);

  // Validar código de ativação em tempo real
  useEffect(() => {
    if (!isLogin && !isFounder && activationCode.length >= 4) {
      const timeoutId = setTimeout(async () => {
        const validation = await validateActivationCode(activationCode);
        setCodeValidation(validation);
      }, 500); // Debounce de 500ms

      return () => clearTimeout(timeoutId);
    } else {
      setCodeValidation(null);
    }
  }, [activationCode, isLogin, isFounder]);

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

  /* HANDLE PASSWORD RESET */
  const handlePasswordReset = async () => {
    if (!email) {
      toast({
        title: "Email necessário",
        description: "Digite seu email para recuperar a senha",
        variant: "destructive",
      });
      return;
    }

    try {
      emailSchema.parse(email);
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      toast({
        title: "Email enviado",
        description: "Verifique sua caixa de entrada para redefinir a senha",
      });
      setShowPasswordReset(false);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Erro ao enviar email de recuperação";
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  /* HANDLE SUBMIT */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    // Verificar rate limiting
    if (!canAttempt) {
      const minutes = Math.ceil(timeUntilReset / 60000);
      toast({
        title: "Muitas tentativas",
        description: `Aguarde ${minutes} minuto(s) antes de tentar novamente`,
        variant: "destructive",
      });
      return;
    }

    playSound("/sounds/click.wav", 0.35);
    setLoading(true);

    try {
      emailSchema.parse(email);
      passwordSchema.parse(password);

      await runCinematic();

      // LOGIN
      if (isLogin) {
        const { data: authData, error: authError } =
          await supabase.auth.signInWithPassword({ email, password });

        if (authError) {
          recordAttempt();
          throw authError;
        }

        // Reset tentativas em caso de sucesso
        resetAttempts();

        const { data: profile } = await supabase
          .from("profiles")
          .select("role, full_name, email")
          .eq("id", authData.user.id)
          .single();

        // Salvar "Lembrar-me" se marcado
        if (rememberMe) {
          try {
            localStorage.setItem('opticlean_remember_me', 'true');
            localStorage.setItem('opticlean_user_email', email);
          } catch {
            // Ignorar erros de localStorage
          }
        }

        onLogin(authData.user.id, profile?.role || 'user', profile?.full_name || undefined);
      } 
      // REGISTRO
      else {
        // Validar código de ativação
        if (!isFounder) {
          if (!activationCode) {
            throw new Error("Código de ativação é obrigatório");
          }

          const validation = await validateActivationCode(activationCode);
          if (!validation.valid || !validation.code) {
            throw new Error(validation.error || "Código de ativação inválido");
          }

          // Criar usuário
          const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
          });

          if (authError) throw authError;

          if (!authData.user) {
            throw new Error("Erro ao criar conta. Verifique seu email para confirmar.");
          }

          // Marcar código como usado
          const markResult = await markActivationCodeAsUsed(validation.code.id, authData.user.id);
          if (!markResult.success) {
            console.error("Erro ao marcar código:", markResult.error);
            // Não bloquear o registro, apenas logar o erro
          }

          // Buscar perfil criado
          const { data: profile } = await supabase
            .from("profiles")
            .select("role, full_name, email")
            .eq("id", authData.user.id)
            .single();

          toast({
            title: "Conta criada!",
            description: "Bem-vindo ao OptiClean Pro",
          });

          onLogin(authData.user.id, profile?.role || 'user', profile?.full_name || undefined);
        } else {
          // Founder não precisa de código
          const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
          });

          if (authError) throw authError;

          if (!authData.user) {
            throw new Error("Erro ao criar conta");
          }

          const { data: profile } = await supabase
            .from("profiles")
            .select("role, full_name, email")
            .eq("id", authData.user.id)
            .single();

          onLogin(authData.user.id, profile?.role || 'user', profile?.full_name || undefined);
        }
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
        animate={{
          x: parallax.x,
          y: parallax.y,
        }}
        transition={{ type: "spring", stiffness: 50, damping: 20 }}
      />
      <motion.div
        className="absolute bottom-1/6 right-1/6 w-80 h-80 rounded-full bg-secondary/20 blur-[130px]"
        animate={{
          x: -parallax.x,
          y: -parallax.y,
        }}
        transition={{ type: "spring", stiffness: 50, damping: 20 }}
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
            <p className="text-sm text-muted-foreground">Sistema De Otimização Premium</p>
          </div>

          {/* FORM */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  placeholder={emailAI}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  className={`h-11 rounded-lg pl-10 ${emailError ? 'border-destructive' : ''}`}
                />
              </div>
              {emailError && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {emailError}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  placeholder={passAI}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="h-11 rounded-lg pl-10"
                />
              </div>
              {!isLogin && password && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Força da senha:</span>
                    <span className={strengthColor}>{strengthLabel}</span>
                  </div>
                  <Progress 
                    value={
                      strength === 'weak' ? 25 :
                      strength === 'fair' ? 50 :
                      strength === 'good' ? 75 : 100
                    } 
                    className="h-1.5"
                  />
                  <div className="space-y-1 text-xs">
                    <div className={`flex items-center gap-2 ${passwordRequirements.minLength ? 'text-emerald-500' : 'text-muted-foreground'}`}>
                      {passwordRequirements.minLength ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                      <span>Mínimo 6 caracteres</span>
                    </div>
                    <div className={`flex items-center gap-2 ${passwordRequirements.hasUpperCase ? 'text-emerald-500' : 'text-muted-foreground'}`}>
                      {passwordRequirements.hasUpperCase ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                      <span>Uma letra maiúscula</span>
                    </div>
                    <div className={`flex items-center gap-2 ${passwordRequirements.hasNumber ? 'text-emerald-500' : 'text-muted-foreground'}`}>
                      {passwordRequirements.hasNumber ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                      <span>Um número</span>
                    </div>
                    <div className={`flex items-center gap-2 ${passwordRequirements.hasSpecial ? 'text-emerald-500' : 'text-muted-foreground'}`}>
                      {passwordRequirements.hasSpecial ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                      <span>Um caractere especial</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {!isLogin && !isFounder && (
              <div className="space-y-2">
                <Label htmlFor="code">Código de Ativação</Label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="code"
                    type="text"
                    value={activationCode}
                    placeholder="OPT-XXXX-XXXX"
                    onChange={(e) => {
                      let value = e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '');
                      // Auto-formatação OPT-XXXX-XXXX
                      if (value.length > 0 && !value.startsWith('OPT-')) {
                        value = 'OPT-' + value.replace(/^OPT-?/, '');
                      }
                      // Limitar formato
                      const parts = value.replace('OPT-', '').replace(/-/g, '');
                      if (parts.length <= 8) {
                        if (parts.length > 4) {
                          value = `OPT-${parts.slice(0, 4)}-${parts.slice(4)}`;
                        } else if (parts.length > 0) {
                          value = `OPT-${parts}`;
                        }
                      }
                      setActivationCode(value);
                    }}
                    disabled={loading}
                    className={`h-11 rounded-lg font-mono tracking-wider pl-10 ${
                      codeValidation?.valid ? 'border-emerald-500' :
                      codeValidation?.error ? 'border-destructive' : ''
                    }`}
                  />
                  {codeValidation && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {codeValidation.valid ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-destructive" />
                      )}
                    </div>
                  )}
                </div>
                {codeValidation && (
                  <p className={`text-xs flex items-center gap-1 ${
                    codeValidation.valid ? 'text-emerald-500' : 'text-destructive'
                  }`}>
                    {codeValidation.valid ? (
                      <>
                        <CheckCircle2 className="w-3 h-3" />
                        Código válido
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-3 h-3" />
                        {codeValidation.error}
                      </>
                    )}
                  </p>
                )}
              </div>
            )}

            {isFounder && (
              <div className="flex items-center gap-2 text-sm text-primary bg-primary/10 p-2 rounded-lg">
                <Shield className="w-4 h-4" />
                Acesso Administrativo
              </div>
            )}

            {/* Rate Limiting Warning */}
            {!canAttempt && (
              <div className="flex flex-col gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  <span className="font-medium">Muitas tentativas de login</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="flex-1 bg-destructive/20 rounded-full h-2 overflow-hidden">
                    <div 
                      className="h-full bg-destructive transition-all duration-1000"
                      style={{ width: `${(timerSeconds / Math.ceil(AUTH_CONFIG.LOGIN_ATTEMPT_WINDOW_MS / 1000)) * 100}%` }}
                    />
                  </div>
                  <span className="font-mono font-semibold min-w-[60px] text-right">
                    {Math.floor(timerSeconds / 60)}:{(timerSeconds % 60).toString().padStart(2, '0')}
                  </span>
                </div>
                <span className="text-xs">Aguarde antes de tentar novamente</span>
              </div>
            )}

            {canAttempt && remainingAttempts < AUTH_CONFIG.MAX_LOGIN_ATTEMPTS && (
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground bg-muted/50 p-2 rounded-lg">
                <AlertCircle className="w-3 h-3" />
                <span>
                  Tentativas restantes: <strong className="text-foreground">{remainingAttempts}</strong> de {AUTH_CONFIG.MAX_LOGIN_ATTEMPTS}
                </span>
              </div>
            )}

            {isLogin && (
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="rememberMe"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-border"
                />
                <Label htmlFor="rememberMe" className="text-sm text-muted-foreground cursor-pointer">
                  Lembrar-me
                </Label>
              </div>
            )}

            <div className="space-y-3">
              <Button
                type="submit"
                disabled={loading || !canAttempt}
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
                      {stage === "authing" && (isLogin ? "Autenticando…" : "Criando conta…")}
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

              <div className="flex flex-col gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  disabled={loading}
                  className="w-full h-10"
                  onClick={() => {
                    playSound("/sounds/swoosh.mp3", 0.4);
                    setIsLogin(!isLogin);
                    setShowPasswordReset(false);
                  }}
                >
                  {isLogin ? "Criar nova conta" : "Já tenho uma conta"}
                </Button>

                {isLogin && (
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={loading}
                    className="w-full h-9 text-xs"
                    onClick={() => {
                      setShowPasswordReset(!showPasswordReset);
                    }}
                  >
                    Esqueci minha senha
                  </Button>
                )}
              </div>
            </div>

            {/* Password Reset Form */}
            {showPasswordReset && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="pt-4 border-t border-border"
              >
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Digite seu email para receber instruções de recuperação
                  </p>
                  <Button
                    type="button"
                    onClick={handlePasswordReset}
                    disabled={loading || !email}
                    className="w-full"
                    size="sm"
                  >
                    Enviar Email de Recuperação
                  </Button>
                </div>
              </motion.div>
            )}
          </form>

          <p className="text-center text-xs text-muted-foreground mt-6 pt-6 border-t">
            v1.1.0 • © 2025 OptiClean Pro
          </p>
        </Card>
      </motion.div>
    </div>
  );
}
