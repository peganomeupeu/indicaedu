import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Mail, Lock, ArrowRight, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [forgotPassword, setForgotPassword] = useState(false);
  const navigate = useNavigate();
  const { signIn, signUp, user } = useAuth();

  // Redirect if already logged in
  if (user) {
    navigate('/dashboard', { replace: true });
    return null;
  }

  const handleForgotPassword = async () => {
    if (!email) {
      toast.error('Digite seu e-mail para recuperar a senha.');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      toast.error('Erro ao enviar e-mail de recuperação.');
    } else {
      toast.success('E-mail de recuperação enviado! Verifique sua caixa de entrada.');
      setForgotPassword(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (forgotPassword) {
      await handleForgotPassword();
      return;
    }

    if (isSignUp) {
      const { error } = await signUp(email, password, fullName);
      setLoading(false);
      if (error) {
        toast.error(error.message);
      } else {
        toast.success('Conta criada! Verifique seu e-mail para confirmar o cadastro.');
      }
    } else {
      const { error } = await signIn(email, password);
      setLoading(false);
      if (error) {
        toast.error('E-mail ou senha inválidos.');
      } else {
        navigate('/dashboard');
      }
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 gradient-dark items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 rounded-full bg-primary blur-[100px]" />
          <div className="absolute bottom-20 right-20 w-96 h-96 rounded-full bg-primary blur-[120px]" />
        </div>
        <div className="relative z-10 max-w-md">
          <div className="flex items-center gap-3 mb-8">
            <div className="flex items-center justify-center w-14 h-14 rounded-2xl gradient-primary">
              <GraduationCap className="w-7 h-7 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-primary-foreground">Audens Edu</h1>
              <p className="text-sm text-sidebar-foreground/60">Plataforma de Indicações</p>
            </div>
          </div>
          <h2 className="text-2xl font-semibold text-primary-foreground mb-4">
            Transforme conexões em oportunidades de aprendizado
          </h2>
          <p className="text-sidebar-foreground/70 leading-relaxed">
            Indique profissionais para os cursos e formações da Audens Edu. 
            Cada indicação conta pontos, e os melhores headhunters são reconhecidos.
          </p>
          <div className="mt-10 flex gap-8">
            <div>
              <p className="text-3xl font-bold text-primary">150+</p>
              <p className="text-sm text-sidebar-foreground/60">Indicações este mês</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-primary">42%</p>
              <p className="text-sm text-sidebar-foreground/60">Taxa de conversão</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-primary">8</p>
              <p className="text-sm text-sidebar-foreground/60">Cursos disponíveis</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel - form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl gradient-primary">
              <GraduationCap className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Audens Edu</h1>
              <p className="text-xs text-muted-foreground">Plataforma de Indicações</p>
            </div>
          </div>

          <h2 className="text-xl font-bold text-foreground mb-1">
            {forgotPassword ? 'Recuperar senha' : isSignUp ? 'Crie sua conta' : 'Bem-vindo de volta!'}
          </h2>
          <p className="text-sm text-muted-foreground mb-8">
            {forgotPassword
              ? 'Digite seu e-mail para receber o link de recuperação.'
              : isSignUp
                ? 'Preencha seus dados para acessar a plataforma.'
                : 'Entre com seu e-mail corporativo para acessar a plataforma.'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {isSignUp && !forgotPassword && (
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-sm font-medium">Nome completo</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="fullName"
                    placeholder="Seu nome completo"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">E-mail corporativo</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu.nome@audens.com.br"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            {!forgotPassword && (
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    required
                    minLength={6}
                  />
                </div>
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full gradient-primary text-primary-foreground font-semibold h-11 gap-2"
              disabled={loading}
            >
              {loading
                ? (forgotPassword ? 'Enviando...' : isSignUp ? 'Criando conta...' : 'Entrando...')
                : (forgotPassword ? 'Enviar link de recuperação' : isSignUp ? 'Criar conta' : 'Entrar na plataforma')}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </Button>
          </form>

          {!isSignUp && !forgotPassword && (
            <button
              type="button"
              onClick={() => setForgotPassword(true)}
              className="mt-3 w-full text-center text-sm text-muted-foreground hover:text-primary hover:underline"
            >
              Esqueceu sua senha?
            </button>
          )}

          {forgotPassword ? (
            <button
              type="button"
              onClick={() => setForgotPassword(false)}
              className="mt-4 w-full text-center text-sm text-primary hover:underline"
            >
              Voltar ao login
            </button>
          ) : (
            <button
              type="button"
              onClick={() => { setIsSignUp(!isSignUp); setForgotPassword(false); }}
              className="mt-4 w-full text-center text-sm text-primary hover:underline"
            >
              {isSignUp ? 'Já tem conta? Faça login' : 'Não tem conta? Cadastre-se'}
            </button>
          )}

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Acesso restrito a colaboradores da Audens
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
