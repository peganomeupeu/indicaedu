import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { POINTS_CONFIG, ReferralStatus } from '@/types/referral';

export function useMyReferrals() {
  const { profile } = useAuth();
  return useQuery({
    queryKey: ['my-referrals', profile?.id],
    enabled: !!profile,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('referrals')
        .select('*')
        .eq('headhunter_id', profile!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useAllReferrals() {
  return useQuery({
    queryKey: ['all-referrals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('referrals')
        .select('*, profiles!referrals_headhunter_id_fkey(full_name)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data?.map(r => ({
        ...r,
        headhunter_name: (r.profiles as any)?.full_name ?? '',
      }));
    },
  });
}

export function useCreateReferral() {
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  return useMutation({
    mutationFn: async (form: {
      referred_name: string;
      referred_email: string;
      referred_phone: string;
      referred_company: string;
      referred_position: string;
      course: string;
      interest_level: string;
      notes: string;
    }) => {
      const { error } = await supabase.from('referrals').insert({
        ...form,
        headhunter_id: profile!.id,
        interest_level: form.interest_level as any,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-referrals'] });
      queryClient.invalidateQueries({ queryKey: ['all-referrals'] });
      queryClient.invalidateQueries({ queryKey: ['my-stats'] });
      queryClient.invalidateQueries({ queryKey: ['ranking'] });
    },
  });
}

export function useUpdateReferralStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from('referrals')
        .update({ status: status as any })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-referrals'] });
      queryClient.invalidateQueries({ queryKey: ['my-referrals'] });
      queryClient.invalidateQueries({ queryKey: ['ranking'] });
      queryClient.invalidateQueries({ queryKey: ['my-stats'] });
    },
  });
}

export function useMyStats(month?: number, year?: number) {
  const { profile } = useAuth();
  return useQuery({
    queryKey: ['my-stats', profile?.id, month, year],
    enabled: !!profile,
    queryFn: async () => {
      let query = supabase
        .from('referrals')
        .select('status, created_at')
        .eq('headhunter_id', profile!.id);
      if (month && year) {
        const start = new Date(year, month - 1, 1).toISOString();
        const end = new Date(year, month, 0, 23, 59, 59, 999).toISOString();
        query = query.gte('created_at', start).lte('created_at', end);
      }
      const { data, error } = await query;
      if (error) throw error;
      const total = data.length;
      const qualified = data.filter(r => r.status === 'qualificado' || r.status === 'inscrito' || r.status === 'nao_convertido').length;
      const enrolled = data.filter(r => r.status === 'inscrito').length;
      const points = data.reduce((acc, r) => {
        const status = r.status as ReferralStatus;
        return acc + (POINTS_CONFIG[status] ?? 0);
      }, 0);
      return {
        total_referrals: total,
        total_inscribed: qualified,
        total_enrolled: enrolled,
        conversion_rate: total > 0 ? Math.round((enrolled / total) * 100) : 0,
        points,
      };
    },
  });
}

export function useRanking(month?: number, year?: number) {
  return useQuery({
    queryKey: ['ranking', month, year],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_ranking', {
        p_month: month ?? null,
        p_year: year ?? null,
      });
      if (error) throw error;
      return (data ?? []).map((u: any, i: number) => ({
        name: u.headhunter_name,
        referrals: Number(u.total_referrals),
        enrolled: Number(u.total_enrolled),
        qualified: Number(u.total_inscribed),
        avatar_url: u.avatar_url ?? null,
        points:
          (Number(u.total_referrals) - Number(u.total_inscribed) - Number(u.total_enrolled)) * POINTS_CONFIG.indicado +
          Number(u.total_inscribed) * POINTS_CONFIG.qualificado +
          Number(u.total_enrolled) * POINTS_CONFIG.inscrito,
        rank: i + 1,
      }));
    },
  });
}
