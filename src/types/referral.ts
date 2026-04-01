export type ReferralStatus = 
  | 'indicado' 
  | 'qualificado' 
  | 'inscrito' 
  | 'nao_convertido'
  | 'nao_qualificado';

export type InterestLevel = 'baixo' | 'medio' | 'alto';

export interface Referral {
  id: string;
  referred_name: string;
  referred_email: string;
  referred_phone: string;
  referred_company: string;
  referred_position: string;
  course: string;
  interest_level: InterestLevel;
  notes: string;
  status: ReferralStatus;
  created_at: string;
  headhunter_id: string;
  headhunter_name?: string;
  attended_by?: string | null;
  rd_station_sent?: boolean;
}

export interface HeadhunterStats {
  total_referrals: number;
  total_inscribed: number;
  total_enrolled: number;
  conversion_rate: number;
  points: number;
  rank: number;
}

export const STATUS_LABELS: Record<ReferralStatus, string> = {
  indicado: 'Indicado',
  qualificado: 'Qualificado',
  inscrito: 'Inscrito',
  nao_convertido: 'Não Convertido',
  nao_qualificado: 'Não Qualificado',
};

export const STATUS_COLORS: Record<ReferralStatus, string> = {
  indicado: 'bg-info text-info-foreground',
  qualificado: 'bg-warning text-warning-foreground',
  inscrito: 'bg-success text-success-foreground',
  nao_convertido: 'bg-destructive/80 text-destructive-foreground',
  nao_qualificado: 'bg-destructive text-destructive-foreground',
};

export const PIPELINE_COLORS: Record<ReferralStatus, string> = {
  indicado: 'border-t-[hsl(210,80%,55%)]',
  qualificado: 'border-t-[hsl(38,92%,50%)]',
  inscrito: 'border-t-[hsl(142,70%,45%)]',
  nao_convertido: 'border-t-[hsl(0,84%,60%)]',
  nao_qualificado: 'border-t-[hsl(0,84%,40%)]',
};

export const PIPELINE_ORDER: ReferralStatus[] = [
  'indicado',
  'qualificado',
  'inscrito',
  'nao_convertido',
  'nao_qualificado',
];

export const INTEREST_LABELS: Record<InterestLevel, string> = {
  baixo: 'Baixo',
  medio: 'Médio',
  alto: 'Alto',
};

export const COURSES = [
  'MBA em Gestão Estratégica de Pessoas',
  'Formação em Headhunting Avançado',
  'Liderança e Gestão de Equipes',
  'Inteligência Emocional para Líderes',
  'Assessment e Avaliação de Talentos',
  'Desenvolvimento de Carreira Executiva',
  'Gestão de Mudanças Organizacionais',
  'Coaching Executivo',
];

export const POINTS_CONFIG: Record<string, number> = {
  indicado: 10,
  qualificado: 20,
  inscrito: 20,
  nao_convertido: 0,
  nao_qualificado: 0,
};

export const POSITION_OPTIONS = [
  'Analista',
  'Supervisor',
  'Coordenador',
  'Gerente',
  'Diretor',
  'Vice-presidente ou C-level',
  'Presidente ou CEO',
  'Sócio / Fundador',
];

export const AREA_OPTIONS = [
  'Recursos Humanos',
  'Financeiro',
  'Contábil / Fiscal',
  'Jurídico / Compliance',
  'Administrativo',
  'Comercial / Vendas',
  'Marketing',
  'Operações',
  'Supply Chain / Logística',
  'Compras',
  'Engenharia',
  'Tecnologia da Informação (TI)',
  'Produto / Inovação',
  'Dados / BI',
  'Customer Success / Atendimento',
  'Qualidade / Processos',
  'Educação / Treinamento',
  'Sustentabilidade / ESG',
];
