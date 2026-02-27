
CREATE OR REPLACE FUNCTION public.get_ranking(p_month integer DEFAULT NULL, p_year integer DEFAULT NULL)
RETURNS TABLE(
  headhunter_name text,
  total_referrals bigint,
  total_enrolled bigint,
  total_inscribed bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    p.full_name AS headhunter_name,
    COUNT(*)::bigint AS total_referrals,
    COUNT(*) FILTER (WHERE r.status = 'matriculado')::bigint AS total_enrolled,
    COUNT(*) FILTER (WHERE r.status IN ('inscrito', 'matriculado'))::bigint AS total_inscribed
  FROM public.referrals r
  JOIN public.profiles p ON p.id = r.headhunter_id
  WHERE (p_month IS NULL OR EXTRACT(MONTH FROM r.created_at) = p_month)
    AND (p_year IS NULL OR EXTRACT(YEAR FROM r.created_at) = p_year)
  GROUP BY p.full_name
  ORDER BY 
    COUNT(*) FILTER (WHERE r.status = 'matriculado') DESC,
    COUNT(*) DESC;
$$;
