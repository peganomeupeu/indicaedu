
CREATE OR REPLACE FUNCTION public.get_login_stats()
RETURNS TABLE(total_referrals bigint, conversion_rate numeric, active_courses bigint)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    (SELECT COUNT(*) FROM public.referrals
     WHERE EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM now())
       AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM now()))::bigint AS total_referrals,
    COALESCE(
      (SELECT ROUND(
        COUNT(*) FILTER (WHERE status = 'matriculado')::numeric * 100 /
        NULLIF(COUNT(*)::numeric, 0)
      ) FROM public.referrals
       WHERE EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM now())
         AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM now())),
      0
    ) AS conversion_rate,
    (SELECT COUNT(*) FROM public.courses WHERE active = true)::bigint AS active_courses;
$$;
