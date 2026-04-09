
-- 1. campaign_productivity
CREATE TABLE public.campaign_productivity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  headhunter_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  month integer NOT NULL,
  year integer NOT NULL,
  meta_percentage numeric NOT NULL DEFAULT 0,
  points integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (headhunter_id, month, year)
);
ALTER TABLE public.campaign_productivity ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own productivity" ON public.campaign_productivity FOR SELECT TO authenticated USING (headhunter_id = public.get_my_profile_id() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert productivity" ON public.campaign_productivity FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update productivity" ON public.campaign_productivity FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete productivity" ON public.campaign_productivity FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- 2. campaign_revenue
CREATE TABLE public.campaign_revenue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  headhunter_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  month integer NOT NULL,
  year integer NOT NULL,
  revenue_audens numeric NOT NULL DEFAULT 0,
  revenue_one_outsourcing numeric NOT NULL DEFAULT 0,
  points integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (headhunter_id, month, year)
);
ALTER TABLE public.campaign_revenue ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own revenue" ON public.campaign_revenue FOR SELECT TO authenticated USING (headhunter_id = public.get_my_profile_id() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert revenue" ON public.campaign_revenue FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update revenue" ON public.campaign_revenue FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete revenue" ON public.campaign_revenue FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- 3. campaign_deadline_bonus
CREATE TABLE public.campaign_deadline_bonus (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  headhunter_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  month integer NOT NULL,
  year integer NOT NULL,
  vacancies_on_time integer NOT NULL DEFAULT 0,
  points integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (headhunter_id, month, year)
);
ALTER TABLE public.campaign_deadline_bonus ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own deadline bonus" ON public.campaign_deadline_bonus FOR SELECT TO authenticated USING (headhunter_id = public.get_my_profile_id() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert deadline bonus" ON public.campaign_deadline_bonus FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update deadline bonus" ON public.campaign_deadline_bonus FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete deadline bonus" ON public.campaign_deadline_bonus FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- 4. campaign_cancellations
CREATE TABLE public.campaign_cancellations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  headhunter_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  month integer NOT NULL,
  year integer NOT NULL,
  cancellations_as_responsible integer NOT NULL DEFAULT 0,
  cancellations_as_finder integer NOT NULL DEFAULT 0,
  points integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (headhunter_id, month, year)
);
ALTER TABLE public.campaign_cancellations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own cancellations" ON public.campaign_cancellations FOR SELECT TO authenticated USING (headhunter_id = public.get_my_profile_id() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert cancellations" ON public.campaign_cancellations FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update cancellations" ON public.campaign_cancellations FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete cancellations" ON public.campaign_cancellations FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- 5. get_campaign_ranking function
CREATE OR REPLACE FUNCTION public.get_campaign_ranking(p_month integer, p_year integer)
RETURNS TABLE(
  headhunter_id uuid,
  headhunter_name text,
  avatar_url text,
  productivity_points integer,
  revenue_points integer,
  deadline_points integer,
  cancellation_points integer,
  referral_points bigint,
  total_points bigint
)
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
    SELECT headhunter_id, points FROM public.campaign_cancellations WHERE month = p_month AND year = p_year
  ),
  ref AS (
    SELECT r.headhunter_id, SUM(h.pontos_gerados)::bigint AS points
    FROM public.referral_status_history h
    JOIN public.referrals r ON r.id = h.referral_id
    WHERE EXTRACT(MONTH FROM h.changed_at) = p_month
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
