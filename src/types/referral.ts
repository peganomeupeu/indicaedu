export type ReferralStatus = 
  | 'indicado' 
  | 'contato_realizado' 
  | 'inscrito' 
  | 'matriculado' 
  | 'nao_convertido';

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
  contato_realizado: 'Contato Realizado',
  inscrito: 'Inscrito',
  matriculado: 'Matriculado',
  nao_convertido: 'Não Convertido',
};

export const STATUS_COLORS: Record<ReferralStatus, string> = {
  indicado: 'bg-info text-info-foreground',
  contato_realizado: 'bg-warning text-warning-foreground',
  inscrito: 'bg-accent text-accent-foreground',
  matriculado: 'bg-success text-success-foreground',
  nao_convertido: 'bg-destructive text-destructive-foreground',
};

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

export const POINTS_CONFIG = {
  indicado: 10,
  inscrito: 30,
  matriculado: 50,
};
