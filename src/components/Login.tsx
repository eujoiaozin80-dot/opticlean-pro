import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Shield, ArrowRight, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import logoOpticlean from '@/assets/logo-opticlean.png';

interface LoginProps {
  onLogin: (userId: string, userRole: string) => void;
}

const emailSchema = z.string().trim().email({ message: "E-mail inválido" });
const passwordSchema = z.string().trim().min(6, { message: "Senha deve ter no mínimo 6 caracteres" });
const activationCodeSchema = z.string().trim().min(1, { message: "Código de ativação é obrigatório" });

const FOUNDER_EMAIL = 'brunoquirin3@gmail.com';

const Login = ({ onLogin }: LoginProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [activationCode, setActivationCode] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      emailSchema.parse(email);
      passwordSchema.parse(password);
      
      const isFounder = email.toLowerCase() === FOUNDER_EMAIL.toLowerCase();

      if (isLogin) {
        if (!isFounder) {
          activationCodeSchema.parse(activationCode);
        }

        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (authError) throw authError;
        if (!authData.user) throw new Error('Erro ao fazer login');

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', authData.user.id)
          .single();

        if (profileError) throw profileError;

        toast({
          title: "Bem-vindo de volta",
          description: "Login realizado com sucesso",
        });

        onLogin(authData.user.id, profile.role);
      } else {
        if (!isFounder) {
          activationCodeSchema.parse(activationCode);

          const { data: codeData, error: codeError } = await supabase
            .from('activation_codes')
            .select('*')
            .eq('code', activationCode.trim())
            .eq('is_used', false)
            .maybeSingle();

          if (codeError) throw codeError;

          if (!codeData) {
            throw new Error('Código de ativação inválido ou já utilizado');
          }
        }

        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
          },
        });

        if (authError) throw authError;
        if (!authData.user) throw new Error('Erro ao criar conta');

        if (!isFounder && activationCode) {
          // Buscar validade do código
          const { data: codeData } = await supabase
            .from('activation_codes')
            .select('validity_days')
            .eq('code', activationCode.trim())
            .maybeSingle();

          const validityDays = codeData?.validity_days || 30;
          const expiresAt = new Date();
          expiresAt.setDate(expiresAt.getDate() + validityDays);

          const { error: updateError } = await supabase
            .from('activation_codes')
            .update({
              is_used: true,
              used_by: authData.user.id,
              used_at: new Date().toISOString(),
              expires_at: expiresAt.toISOString(),
            })
            .eq('code', activationCode.trim());

          if (updateError) console.error('Erro ao atualizar código:', updateError);
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', authData.user.id)
          .single();

        toast({
          title: "Conta criada",
          description: "Bem-vindo ao OptiClean Pro",
        });

        onLogin(authData.user.id, profile?.role || 'user');
      }
    } catch (error: any) {
      console.error('Erro:', error);
      toast({
        title: "Erro",
        description: error.message || 'Ocorreu um erro. Tente novamente.',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const isFounder = email.toLowerCase() === FOUNDER_EMAIL.toLowerCase();

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-background">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-grid opacity-40" />
      <div className="gradient-rgb-animated absolute inset-0" />
      
      {/* Floating Orbs */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-primary/5 blur-[100px] animate-float" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-secondary/5 blur-[100px] animate-float" style={{ animationDelay: '2s' }} />
      
      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md p-4 animate-scale-in">
        <Card className="glass-strong rounded-2xl p-8 shadow-2xl">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="relative mb-4">
              <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full scale-150" />
              <img 
                src={logoOpticlean} 
                alt="OptiClean Pro" 
                className="w-20 h-20 relative z-10"
              />
            </div>
            <h1 className="text-2xl font-bold text-gradient mb-1">
              OptiClean Pro
            </h1>
            <p className="text-sm text-muted-foreground">
              Sistema de Otimização Profissional
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-foreground/80">
                E-mail
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11 bg-input border-border focus:border-primary input-focus rounded-lg"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-foreground/80">
                Senha
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-11 bg-input border-border focus:border-primary input-focus rounded-lg"
                disabled={loading}
              />
            </div>

            {!isFounder && (
              <div className="space-y-2 animate-fade-in">
                <Label htmlFor="code" className="text-sm font-medium text-foreground/80">
                  Código de Ativação
                </Label>
                <Input
                  id="code"
                  type="text"
                  placeholder="XXXX-XXXX-XXXX"
                  value={activationCode}
                  onChange={(e) => setActivationCode(e.target.value.toUpperCase())}
                  required={!isFounder}
                  className="h-11 bg-input border-border focus:border-primary input-focus rounded-lg font-mono tracking-wider"
                  disabled={loading}
                />
              </div>
            )}

            {isFounder && (
              <div className="flex items-center gap-2 text-sm text-primary py-2 px-3 rounded-lg bg-primary/10 border border-primary/20 animate-fade-in">
                <Shield className="w-4 h-4" />
                <span className="font-medium">Acesso Administrativo</span>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 btn-primary rounded-lg font-medium"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  {isLogin ? 'Entrar' : 'Criar Conta'}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>

            <Button
              type="button"
              variant="ghost"
              className="w-full h-10 text-muted-foreground hover:text-foreground font-medium"
              onClick={() => setIsLogin(!isLogin)}
              disabled={loading}
            >
              {isLogin ? 'Criar nova conta' : 'Já tenho uma conta'}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-border/50">
            <p className="text-center text-xs text-muted-foreground">
              v1.1.0 • © 2025 OptiClean Pro
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Login;
