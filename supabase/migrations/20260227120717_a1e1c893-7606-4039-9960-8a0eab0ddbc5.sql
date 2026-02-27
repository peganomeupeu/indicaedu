
-- Create courses table
CREATE TABLE public.courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

-- Everyone authenticated can read active courses
CREATE POLICY "Authenticated can read courses"
  ON public.courses FOR SELECT TO authenticated
  USING (true);

-- Only admins can insert/update/delete
CREATE POLICY "Admins can insert courses"
  ON public.courses FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update courses"
  ON public.courses FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete courses"
  ON public.courses FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Seed existing courses
INSERT INTO public.courses (name) VALUES
  ('MBA em Gestão Estratégica de Pessoas'),
  ('Formação em Headhunting Avançado'),
  ('Liderança e Gestão de Equipes'),
  ('Inteligência Emocional para Líderes'),
  ('Assessment e Avaliação de Talentos'),
  ('Desenvolvimento de Carreira Executiva'),
  ('Gestão de Mudanças Organizacionais'),
  ('Coaching Executivo');
