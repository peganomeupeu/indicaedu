import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, Send } from 'lucide-react';
import { AppLayout } from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { COURSES, INTEREST_LABELS, InterestLevel } from '@/types/referral';
import { toast } from 'sonner';

const NewReferral = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    referred_name: '',
    referred_email: '',
    referred_phone: '',
    referred_company: '',
    referred_position: '',
    course: '',
    interest_level: '' as InterestLevel | '',
    notes: '',
  });

  const updateField = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // TODO: Save to database
    setTimeout(() => {
      setLoading(false);
      toast.success('Indicação registrada com sucesso!', {
        description: `${form.referred_name} foi indicado para ${form.course}`,
      });
      navigate('/indicacoes');
    }, 600);
  };

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl gradient-primary">
            <UserPlus className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Nova Indicação</h1>
            <p className="text-sm text-muted-foreground">Preencha os dados do profissional indicado</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-card rounded-xl border border-border shadow-card p-6 space-y-6">
          {/* Personal data */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-4">Dados do Indicado</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2 space-y-2">
                <Label>Nome completo *</Label>
                <Input
                  placeholder="Nome completo do indicado"
                  value={form.referred_name}
                  onChange={(e) => updateField('referred_name', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>E-mail *</Label>
                <Input
                  type="email"
                  placeholder="email@empresa.com"
                  value={form.referred_email}
                  onChange={(e) => updateField('referred_email', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Telefone / WhatsApp *</Label>
                <Input
                  placeholder="(11) 99999-9999"
                  value={form.referred_phone}
                  onChange={(e) => updateField('referred_phone', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Empresa atual *</Label>
                <Input
                  placeholder="Nome da empresa"
                  value={form.referred_company}
                  onChange={(e) => updateField('referred_company', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Cargo atual *</Label>
                <Input
                  placeholder="Cargo do indicado"
                  value={form.referred_position}
                  onChange={(e) => updateField('referred_position', e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          {/* Course info */}
          <div className="border-t border-border pt-6">
            <h3 className="text-sm font-semibold text-foreground mb-4">Curso e Interesse</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Curso indicado *</Label>
                <Select value={form.course} onValueChange={(v) => updateField('course', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o curso" />
                  </SelectTrigger>
                  <SelectContent>
                    {COURSES.map(course => (
                      <SelectItem key={course} value={course}>{course}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Nível de interesse *</Label>
                <Select value={form.interest_level} onValueChange={(v) => updateField('interest_level', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.entries(INTEREST_LABELS) as [InterestLevel, string][]).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2 space-y-2">
                <Label>Observações</Label>
                <Textarea
                  placeholder="Adicione informações relevantes sobre o indicado..."
                  value={form.notes}
                  onChange={(e) => updateField('notes', e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              className="gradient-primary text-primary-foreground font-semibold gap-2 h-11 px-8"
              disabled={loading}
            >
              {loading ? 'Registrando...' : 'Registrar Indicação'}
              {!loading && <Send className="w-4 h-4" />}
            </Button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
};

export default NewReferral;
