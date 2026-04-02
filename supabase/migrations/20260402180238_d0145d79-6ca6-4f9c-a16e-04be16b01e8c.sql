
DROP FUNCTION IF EXISTS public.get_ranking(integer, integer);

CREATE FUNCTION public.get_ranking(p_month integer DEFAULT NULL::integer, p_year integer DEFAULT NULL::integer)
 RETURNS TABLE(headhunter_id uuid, headhunter_name text, total_referrals bigint, total_enrolled bigint, total_inscribed bigint, total_nao_convertido bigint, total_nao_qualificado bigint, avatar_url text, total_points bigint)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
    ep.headhunter_id,
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
$function$;
