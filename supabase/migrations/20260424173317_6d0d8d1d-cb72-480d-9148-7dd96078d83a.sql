-- 1. Drop salesforce_sync_log (no longer used)
DROP TABLE IF EXISTS public.salesforce_sync_log;

-- 2. Create campaign_consultants table
CREATE TABLE public.campaign_consultants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  consultant_name TEXT NOT NULL,
  cargo TEXT NOT NULL,
  meta_eventos_gerais INTEGER NOT NULL DEFAULT 0,
  meta_entrevistas_telefone INTEGER NOT NULL DEFAULT 0,
  meta_entrevistas_video INTEGER NOT NULL DEFAULT 0,
  meta_entrevistas_presenciais INTEGER NOT NULL DEFAULT 0,
  meta_visitas INTEGER NOT NULL DEFAULT 0,
  meta_placements_semanal NUMERIC NOT NULL DEFAULT 0,
  meta_placements_trimestral INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_campaign_consultants_profile ON public.campaign_consultants(profile_id);
CREATE INDEX idx_campaign_consultants_name ON public.campaign_consultants(consultant_name);

ALTER TABLE public.campaign_consultants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage consultants"
  ON public.campaign_consultants FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated can read consultants"
  ON public.campaign_consultants FOR SELECT
  TO authenticated
  USING (true);

CREATE TRIGGER update_campaign_consultants_updated_at
  BEFORE UPDATE ON public.campaign_consultants
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Seed consultants (link to profiles by name when possible)
INSERT INTO public.campaign_consultants
  (consultant_name, cargo, meta_eventos_gerais, meta_entrevistas_telefone, meta_entrevistas_video, meta_entrevistas_presenciais, meta_visitas, meta_placements_semanal, meta_placements_trimestral, profile_id)
VALUES
  ('Rômulo Carvalho', 'Head de Mesa', 15, 0, 0, 3, 3, 0.31, 4, NULL),
  ('Renata Brandão', 'Consultor Pleno', 15, 0, 0, 2, 2, 0.31, 4, NULL),
  ('Thamires Jucá', 'Analista de Recrutamento Audens', 0, 10, 4, 4, 0, 0.5, 5, NULL),
  ('Lara Cabral', 'Estagiário Audens', 0, 18, 0, 0, 0, 0.5, 5, NULL),
  ('Thaís Casas', 'Consultor Pleno', 15, 0, 0, 2, 2, 0.31, 4, NULL),
  ('Roberto Antunes', 'Head de Projetos', 15, 0, 0, 0, 0, 0.08, 1, NULL),
  ('Melqui Carvalho', 'Consultor Pleno', 15, 0, 0, 2, 2, 0.31, 4, NULL),
  ('Rafael Lucena', 'Head de Mesa', 15, 0, 0, 3, 3, 0.08, 1, NULL),
  ('Ygor Torreão', 'Consultor Sênior', 15, 0, 0, 2, 3, 0.31, 4, NULL),
  ('Lucas Domingos', 'Consultor Junior', 18, 0, 0, 2, 1, 0.31, 4, NULL),
  ('Gabriel Antonio', 'Consultor Junior', 18, 0, 0, 2, 1, 0.31, 4, NULL),
  ('João Belchior', 'Analista de Recrutamento Audens', 0, 10, 4, 4, 0, 0.5, 5, NULL),
  ('Débora Vaz', 'Consultor Sênior', 15, 0, 0, 2, 3, 0.31, 4, NULL),
  ('Felipe Ventura', 'Consultor Pleno', 15, 0, 0, 2, 2, 0.31, 4, NULL),
  ('Clara Macena', 'Estagiário Audens One', 0, 18, 0, 0, 0, 0.6, 6, NULL),
  ('Rodrigo Guerra', 'Head de Mesa', 15, 0, 0, 3, 3, 0.08, 1, NULL),
  ('Paulo Lira', 'Consultor Sênior', 15, 0, 0, 2, 3, 0.31, 4, NULL),
  ('Tomás Meira', 'Analista de Recrutamento Audens', 0, 10, 4, 4, 0, 0.5, 5, NULL),
  ('Myrcea Oliveira', 'Head de Projetos', 15, 0, 0, 0, 0, 0.08, 1, NULL),
  ('Matheus Lucena', 'Consultor Junior', 15, 0, 0, 2, 2, 0.31, 4, NULL),
  ('Júlia Alencar', 'Analista de Recrutamento Audens One', 0, 10, 4, 4, 0, 0.6, 6, NULL),
  ('Maria Júlia Domingues', 'Analista de Recrutamento Audens', 0, 10, 4, 4, 0, 0.5, 5, NULL),
  ('Cecília Príncipe', 'Estagiário Audens Projetos', 0, 18, 0, 0, 0, 0.6, 6, NULL),
  ('Eduarda Lima', 'Estagiário Audens Projetos', 0, 18, 0, 0, 0, 0.6, 6, NULL),
  ('Amanda Araújo', 'Analista de Recrutamento Audens One', 0, 10, 4, 4, 0, 0.6, 6, NULL),
  ('Gabriel Silvestre', 'Analista de Recrutamento Audens', 0, 10, 4, 4, 0, 0.5, 5, NULL),
  ('Pedro Nascimento', 'Consultor Sênior', 15, 0, 0, 2, 3, 0.31, 4, NULL),
  ('Luana Pires', 'Estagiário Audens One', 0, 18, 0, 0, 0, 0.6, 6, NULL),
  ('Victoria Chetrit', 'Estagiário Audens One', 0, 18, 0, 0, 0, 0.6, 6, NULL),
  ('Luca Costa', 'Estagiário Audens One', 0, 18, 0, 0, 0, 0.6, 6, NULL),
  ('João Gouveia', 'Analista de Recrutamento Audens One', 0, 10, 4, 4, 0, 0.6, 6, NULL),
  ('Rodolfo Araújo', 'Head de Mesa', 15, 0, 0, 3, 3, 0.08, 1, NULL),
  ('Felipe Araújo', 'Estagiário Audens One', 0, 18, 0, 0, 0, 0.6, 6, NULL),
  ('Agata Silva', 'Analista de Recrutamento Audens', 0, 10, 4, 4, 0, 0.5, 5, NULL),
  ('Eduarda Caminha', 'Estagiário Audens Projetos', 0, 18, 0, 0, 0, 0.6, 6, NULL);

-- Auto-link consultants to existing profiles by exact name match
UPDATE public.campaign_consultants cc
SET profile_id = p.id
FROM public.profiles p
WHERE LOWER(TRIM(p.full_name)) = LOWER(TRIM(cc.consultant_name))
  AND cc.profile_id IS NULL;

-- 4. Update get_campaign_ranking: cancellations subtract, referrals = 50 pts per 'inscrito' in the month
CREATE OR REPLACE FUNCTION public.get_campaign_ranking(p_month integer, p_year integer)
 RETURNS TABLE(headhunter_id uuid, headhunter_name text, avatar_url text, productivity_points integer, revenue_points integer, deadline_points integer, cancellation_points integer, referral_points bigint, total_points bigint)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  WITH all_headhunters AS (
    SELECT DISTINCT p.id AS hid
    FROM public.profiles p
    JOIN public.user_roles ur ON ur.user_id = p.user_id
  ),
  prod AS (
    SELECT headhunter_id, points FROM public.campaign_productivity WHERE month = p_month AND year = p_year
  ),
  rev AS (
    SELECT headhunter_id, points FROM public.campaign_revenue WHERE month = p_month AND year = p_year
  ),
  dl AS (
    SELECT headhunter_id, points FROM public.campaign_deadline_bonus WHERE month = p_month AND year = p_year
  ),
  canc AS (
    -- points stored as positive magnitude; we negate it here
    SELECT headhunter_id, -ABS(points) AS points FROM public.campaign_cancellations WHERE month = p_month AND year = p_year
  ),
  ref AS (
    -- 50 pts for each referral that became 'inscrito' in this month
    SELECT r.headhunter_id, (COUNT(*) * 50)::bigint AS points
    FROM public.referral_status_history h
    JOIN public.referrals r ON r.id = h.referral_id
    WHERE h.new_status = 'inscrito'::referral_status
      AND EXTRACT(MONTH FROM h.changed_at) = p_month
      AND EXTRACT(YEAR FROM h.changed_at) = p_year
    GROUP BY r.headhunter_id
  ),
  combined AS (
    SELECT ah.hid,
      COALESCE(prod.points, 0) AS productivity_points,
      COALESCE(rev.points, 0) AS revenue_points,
      COALESCE(dl.points, 0) AS deadline_points,
      COALESCE(canc.points, 0) AS cancellation_points,
      COALESCE(ref.points, 0)::bigint AS referral_points
    FROM all_headhunters ah
    LEFT JOIN prod ON prod.headhunter_id = ah.hid
    LEFT JOIN rev ON rev.headhunter_id = ah.hid
    LEFT JOIN dl ON dl.headhunter_id = ah.hid
    LEFT JOIN canc ON canc.headhunter_id = ah.hid
    LEFT JOIN ref ON ref.headhunter_id = ah.hid
    WHERE COALESCE(prod.points, 0) != 0
       OR COALESCE(rev.points, 0) != 0
       OR COALESCE(dl.points, 0) != 0
       OR COALESCE(canc.points, 0) != 0
       OR COALESCE(ref.points, 0) != 0
  )
  SELECT
    c.hid,
    p.full_name,
    p.avatar_url,
    c.productivity_points,
    c.revenue_points,
    c.deadline_points,
    c.cancellation_points,
    c.referral_points,
    (c.productivity_points + c.revenue_points + c.deadline_points + c.cancellation_points + c.referral_points)::bigint AS total_points
  FROM combined c
  JOIN public.profiles p ON p.id = c.hid
  ORDER BY total_points DESC, p.full_name ASC
$function$;