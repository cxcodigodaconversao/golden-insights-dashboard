import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Loader2, AlertCircle, ArrowLeft, Mail } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
});

const resetPasswordSchema = z.object({
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Senhas não conferem',
  path: ['confirmPassword'],
});

export default function Auth() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isLoading, signIn, resetPassword } = useAuth();
  const { toast } = useToast();
  
  const [mode, setMode] = useState<'login' | 'forgot' | 'reset'>('login');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [emailSent, setEmailSent] = useState(false);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
  });

  useEffect(() => {
    // Check if this is a password recovery redirect
    const type = searchParams.get('type');
    if (type === 'recovery') {
      setMode('reset');
    }
  }, [searchParams]);

  useEffect(() => {
    if (user && !isLoading && mode !== 'reset') {
      navigate('/');
    }
  }, [user, isLoading, navigate, mode]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setIsSubmitting(true);

    const result = loginSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      setIsSubmitting(false);
      return;
    }

    try {
      const { error } = await signIn(formData.email, formData.password);
      
      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          toast({
            title: 'Credenciais inválidas',
            description: 'Email ou senha incorretos.',
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Erro ao fazer login',
            description: error.message,
            variant: 'destructive',
          });
        }
      }
    } catch {
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro inesperado.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setIsSubmitting(true);

    if (!formData.email || !z.string().email().safeParse(formData.email).success) {
      setErrors({ email: 'Email inválido' });
      setIsSubmitting(false);
      return;
    }

    try {
      const { error } = await resetPassword(formData.email);
      
      if (error) {
        toast({
          title: 'Erro',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        setEmailSent(true);
        toast({
          title: 'Email enviado!',
          description: 'Verifique sua caixa de entrada para redefinir a senha.',
        });
      }
    } catch {
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro inesperado.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setIsSubmitting(true);

    const result = resetPasswordSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      setIsSubmitting(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: formData.password,
      });
      
      if (error) {
        toast({
          title: 'Erro',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Senha atualizada!',
          description: 'Sua senha foi alterada com sucesso.',
        });
        navigate('/');
      }
    } catch {
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro inesperado.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
          <TrendingUp className="h-6 w-6 text-primary-foreground" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">
            CX - <span className="text-primary">Comercial 10X</span>
          </h1>
          <p className="text-sm text-muted-foreground">Dashboard de Resultados</p>
        </div>
      </div>

      <Card className="w-full max-w-md border-border bg-card">
        <CardHeader className="text-center">
          <CardTitle className="font-display text-xl">
            {mode === 'login' && 'Entrar'}
            {mode === 'forgot' && 'Recuperar Senha'}
            {mode === 'reset' && 'Nova Senha'}
          </CardTitle>
          <CardDescription>
            {mode === 'login' && 'Entre com suas credenciais para acessar o dashboard'}
            {mode === 'forgot' && 'Digite seu email para receber o link de recuperação'}
            {mode === 'reset' && 'Digite sua nova senha'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={formData.email}
                  onChange={handleChange}
                  className={errors.email ? 'border-destructive' : ''}
                />
                {errors.email && (
                  <p className="flex items-center gap-1 text-sm text-destructive">
                    <AlertCircle className="h-3 w-3" />
                    {errors.email}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  className={errors.password ? 'border-destructive' : ''}
                />
                {errors.password && (
                  <p className="flex items-center gap-1 text-sm text-destructive">
                    <AlertCircle className="h-3 w-3" />
                    {errors.password}
                  </p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  'Entrar'
                )}
              </Button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    setMode('forgot');
                    setErrors({});
                    setEmailSent(false);
                  }}
                  className="text-sm text-muted-foreground hover:text-primary"
                >
                  Esqueci minha senha
                </button>
              </div>
            </form>
          )}

          {mode === 'forgot' && (
            <>
              {emailSent ? (
                <div className="text-center space-y-4">
                  <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Mail className="h-6 w-6 text-primary" />
                  </div>
                  <p className="text-muted-foreground">
                    Um link de recuperação foi enviado para <strong>{formData.email}</strong>
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setMode('login');
                      setEmailSent(false);
                    }}
                    className="gap-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Voltar ao login
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="seu@email.com"
                      value={formData.email}
                      onChange={handleChange}
                      className={errors.email ? 'border-destructive' : ''}
                    />
                    {errors.email && (
                      <p className="flex items-center gap-1 text-sm text-destructive">
                        <AlertCircle className="h-3 w-3" />
                        {errors.email}
                      </p>
                    )}
                  </div>

                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      'Enviar link de recuperação'
                    )}
                  </Button>

                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => {
                        setMode('login');
                        setErrors({});
                      }}
                      className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1 mx-auto"
                    >
                      <ArrowLeft className="h-3 w-3" />
                      Voltar ao login
                    </button>
                  </div>
                </form>
              )}
            </>
          )}

          {mode === 'reset' && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Nova Senha</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  className={errors.password ? 'border-destructive' : ''}
                />
                {errors.password && (
                  <p className="flex items-center gap-1 text-sm text-destructive">
                    <AlertCircle className="h-3 w-3" />
                    {errors.password}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={errors.confirmPassword ? 'border-destructive' : ''}
                />
                {errors.confirmPassword && (
                  <p className="flex items-center gap-1 text-sm text-destructive">
                    <AlertCircle className="h-3 w-3" />
                    {errors.confirmPassword}
                  </p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  'Salvar nova senha'
                )}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
