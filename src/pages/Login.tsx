import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Mail, Lock, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // TODO: Integrate with auth
    setTimeout(() => {
      setLoading(false);
      navigate('/dashboard');
    }, 800);
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

          <h2 className="text-xl font-bold text-foreground mb-1">Bem-vindo de volta!</h2>
          <p className="text-sm text-muted-foreground mb-8">
            Entre com seu e-mail corporativo para acessar a plataforma.
          </p>

          <form onSubmit={handleLogin} className="space-y-5">
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
                />
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full gradient-primary text-primary-foreground font-semibold h-11 gap-2"
              disabled={loading}
            >
              {loading ? 'Entrando...' : 'Entrar na plataforma'}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Acesso restrito a colaboradores da Audens
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
