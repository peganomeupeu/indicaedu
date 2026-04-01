
-- Step 1: Add column
ALTER TABLE public.referral_status_history ADD COLUMN pontos_gerados integer NOT NULL DEFAULT 0;

-- Step 2: Indexes
CREATE INDEX IF NOT EXISTS idx_rsh_referral_id ON public.referral_status_history(referral_id);
CREATE INDEX IF NOT EXISTS idx_rsh_changed_at ON public.referral_status_history(changed_at);

-- Step 3: Insert creation events using profiles.user_id for changed_by
INSERT INTO public.referral_status_history (referral_id, old_status, new_status, changed_by, changed_at, pontos_gerados)
SELECT r.id, NULL, 'indicado'::referral_status, p.user_id, r.created_at, 10
FROM public.referrals r
JOIN public.profiles p ON p.id = r.headhunter_id
WHERE NOT EXISTS (
  SELECT 1 FROM public.referral_status_history h 
  WHERE h.referral_id = r.id AND h.old_status IS NULL
);

-- Step 4: Update existing history records with incremental points
UPDATE public.referral_status_history SET pontos_gerados = CASE
  WHEN new_status = 'qualificado'::referral_status THEN 20
  WHEN new_status = 'inscrito'::referral_status THEN 20
  ELSE 0
END
WHERE old_status IS NOT NULL;

-- Step 5: Update trigger function for status changes
CREATE OR REPLACE FUNCTION public.log_referral_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.referral_status_history (referral_id, old_status, new_status, changed_by, pontos_gerados)
    VALUES (
      NEW.id, OLD.status, NEW.status, auth.uid(),
      CASE
        WHEN NEW.status = 'qualificado' THEN 20
        WHEN NEW.status = 'inscrito' THEN 20
        ELSE 0
      END
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_log_referral_status_change ON public.referrals;
CREATE TRIGGER trg_log_referral_status_change
  BEFORE UPDATE ON public.referrals
  FOR EACH ROW
  EXECUTE FUNCTION public.log_referral_status_change();

-- Step 6: Create trigger for referral creation
CREATE OR REPLACE FUNCTION public.log_referral_creation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.referral_status_history (referral_id, old_status, new_status, changed_by, pontos_gerados)
  VALUES (NEW.id, NULL, 'indicado'::referral_status, auth.uid(), 10);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_log_referral_creation ON public.referrals;
CREATE TRIGGER trg_log_referral_creation
  AFTER INSERT ON public.referrals
  FOR EACH ROW
  EXECUTE FUNCTION public.log_referral_creation();

-- Step 7: Recreate get_ranking with event-based points
DROP FUNCTION IF EXISTS public.get_ranking(integer, integer);

CREATE FUNCTION public.get_ranking(p_month integer DEFAULT NULL, p_year integer DEFAULT NULL)
RETURNS TABLE(
  headhunter_name text, 
  total_referrals bigint, 
  total_enrolled bigint, 
  total_inscribed bigint, 
  total_nao_convertido bigint, 
  total_nao_qualificado bigint, 
  avatar_url text,
  total_points bigint
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  WITH event_points AS (
    SELECT r.headhunter_id, SUM(h.pontos_gerados)::bigint as total_points
    FROM public.referral_status_history h
    JOIN public.referrals r ON r.id = h.referral_id
    WHERE (p_month IS NULL OR EXTRACT(MONTH FROM h.changed_at) = p_month)
      AND (p_year IS NULL OR EXTRACT(YEAR FROM h.changed_at) = p_year)
    GROUP BY r.headhunter_id
  ),
  referral_counts AS (
    SELECT 
      r.headhunter_id,
      COUNT(*)::bigint AS total_referrals,
      COUNT(*) FILTER (WHERE r.status = 'inscrito')::bigint AS total_enrolled,
      COUNT(*) FILTER (WHERE r.status = 'qualificado')::bigint AS total_inscribed,
      COUNT(*) FILTER (WHERE r.status = 'nao_convertido')::bigint AS total_nao_convertido,
      COUNT(*) FILTER (WHERE r.status = 'nao_qualificado')::bigint AS total_nao_qualificado
    FROM public.referrals r
    WHERE (p_month IS NULL OR EXTRACT(MONTH FROM r.created_at) = p_month)
      AND (p_year IS NULL OR EXTRACT(YEAR FROM r.created_at) = p_year)
    GROUP BY r.headhunter_id
  )
  SELECT 
    p.full_name AS headhunter_name,
    COALESCE(rc.total_referrals, 0)::bigint,
    COALESCE(rc.total_enrolled, 0)::bigint,
    COALESCE(rc.total_inscribed, 0)::bigint,
    COALESCE(rc.total_nao_convertido, 0)::bigint,
    COALESCE(rc.total_nao_qualificado, 0)::bigint,
    p.avatar_url,
    ep.total_points
  FROM event_points ep
  JOIN public.profiles p ON p.id = ep.headhunter_id
  LEFT JOIN referral_counts rc ON rc.headhunter_id = ep.headhunter_id
  ORDER BY ep.total_points DESC, COALESCE(rc.total_referrals, 0) DESC
$$;
