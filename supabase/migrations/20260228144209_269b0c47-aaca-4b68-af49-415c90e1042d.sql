
DROP FUNCTION public.get_ranking(integer, integer);

CREATE OR REPLACE FUNCTION public.get_ranking(p_month integer DEFAULT NULL::integer, p_year integer DEFAULT NULL::integer)
 RETURNS TABLE(headhunter_name text, total_referrals bigint, total_enrolled bigint, total_inscribed bigint, total_nao_convertido bigint, total_nao_qualificado bigint, avatar_url text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT 
    p.full_name AS headhunter_name,
    COUNT(*)::bigint AS total_referrals,
    COUNT(*) FILTER (WHERE r.status = 'inscrito')::bigint AS total_enrolled,
    COUNT(*) FILTER (WHERE r.status = 'qualificado')::bigint AS total_inscribed,
    COUNT(*) FILTER (WHERE r.status = 'nao_convertido')::bigint AS total_nao_convertido,
    COUNT(*) FILTER (WHERE r.status = 'nao_qualificado')::bigint AS total_nao_qualificado,
    p.avatar_url
  FROM public.referrals r
  JOIN public.profiles p ON p.id = r.headhunter_id
  WHERE (p_month IS NULL OR EXTRACT(MONTH FROM r.created_at) = p_month)
    AND (p_year IS NULL OR EXTRACT(YEAR FROM r.created_at) = p_year)
  GROUP BY p.full_name, p.avatar_url
  ORDER BY 
    COUNT(*) FILTER (WHERE r.status = 'inscrito') DESC,
    COUNT(*) DESC;
$function$;
