import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Lock, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import logoOpticlean from '@/assets/logo-opticlean.png';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Verificar requisitos de senha
  const passwordRequirements = {
    minLength: password.length >= 6,
    hasUpperCase: /[A-Z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecial: /[^a-zA-Z\d]/.test(password),
    matches: password === confirmPassword && password.length > 0,
  };

  const allRequirementsMet = Object.values(passwordRequirements).every(Boolean);

  useEffect(() => {
    const handleRecoveryToken = async () => {
      try {
        // Verificar se já existe uma sessão válida
        const { data: { session: existingSession } } = await supabase.auth.getSession();
        
        if (existingSession) {
          setSessionReady(true);
          setCheckingSession(false);
          return;
        }

        // Extrair tokens da URL (podem estar no hash ou query params)
        const fullUrl = window.location.href;
        
        // Tentar extrair do hash (formato: #access_token=xxx ou /#/reset-password#access_token=xxx)
        let accessToken = null;
        let refreshToken = null;
        let type = null;
        
        // Verificar hash
        const hashIndex = fullUrl.lastIndexOf('#');
        if (hashIndex !== -1) {
          const hashPart = fullUrl.substring(hashIndex + 1);
          const hashParams = new URLSearchParams(hashPart.replace(/^\/reset-password/, '').replace(/^#/, ''));
          accessToken = hashParams.get('access_token');
          refreshToken = hashParams.get('refresh_token');
          type = hashParams.get('type');
        }
        
        // Verificar query params também
        const urlParams = new URLSearchParams(window.location.search);
        if (!accessToken) {
          accessToken = urlParams.get('access_token');
          refreshToken = urlParams.get('refresh_token');
          type = urlParams.get('type');
        }

        if (type === 'recovery' && accessToken) {
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || '',
          });
          
          if (error) {
            console.error('Erro ao configurar sessão:', error);
            toast({
              title: 'Link expirado',
              description: 'Solicite um novo link de recuperação de senha.',
              variant: 'destructive',
            });
            setTimeout(() => navigate('/'), 3000);
            return;
          }

          if (data.session) {
            setSessionReady(true);
          }
        } else {
          // Sem token, verificar evento de auth
          const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && session)) {
              setSessionReady(true);
            }
          });

          // Aguardar um pouco para o evento
          setTimeout(() => {
            if (!sessionReady) {
              setCheckingSession(false);
            }
          }, 2000);

          return () => subscription.unsubscribe();
        }
      } catch (error) {
        console.error('Erro ao processar token:', error);
      } finally {
        setCheckingSession(false);
      }
    };
    
    handleRecoveryToken();
  }, [navigate, toast, sessionReady]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!allRequirementsMet) {
      toast({
        title: 'Senha inválida',
        description: 'Verifique os requisitos da senha',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) throw error;

      setSuccess(true);
      toast({
        title: 'Senha atualizada!',
        description: 'Sua senha foi alterada com sucesso.',
      });

      // Redirecionar após 2 segundos
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao atualizar senha';
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Estado de carregamento
  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Verificando link de recuperação...</p>
        </motion.div>
      </div>
    );
  }

  // Sem sessão válida
  if (!sessionReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center max-w-md"
        >
          <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Link Inválido</h1>
          <p className="text-muted-foreground mb-4">
            O link de recuperação expirou ou é inválido. Solicite um novo link de recuperação na tela de login.
          </p>
          <Button onClick={() => navigate('/')}>
            Voltar ao Login
          </Button>
        </motion.div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Senha Atualizada!</h1>
          <p className="text-muted-foreground">Redirecionando para o login...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Card className="p-8">
          <div className="flex flex-col items-center mb-6">
            <img src={logoOpticlean} alt="OptiClean Pro" className="w-16 h-16 mb-4" />
            <h1 className="text-2xl font-bold">Redefinir Senha</h1>
            <p className="text-muted-foreground text-sm text-center mt-2">
              Digite sua nova senha abaixo
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Nova Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-10"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-10"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Requisitos da senha */}
            {password && (
              <div className="space-y-1 text-xs bg-muted/50 p-3 rounded-lg">
                <p className="font-medium text-muted-foreground mb-2">Requisitos:</p>
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
                <div className={`flex items-center gap-2 ${passwordRequirements.matches ? 'text-emerald-500' : 'text-muted-foreground'}`}>
                  {passwordRequirements.matches ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                  <span>Senhas coincidem</span>
                </div>
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={loading || !allRequirementsMet}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Atualizando...
                </>
              ) : (
                'Atualizar Senha'
              )}
            </Button>
          </form>
        </Card>
      </motion.div>
    </div>
  );
}
