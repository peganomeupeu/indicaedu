import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { POINTS_CONFIG } from '@/types/referral';

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

export function useMyStats() {
  const { profile } = useAuth();
  return useQuery({
    queryKey: ['my-stats', profile?.id],
    enabled: !!profile,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('referrals')
        .select('status')
        .eq('headhunter_id', profile!.id);
      if (error) throw error;
      const total = data.length;
      const inscribed = data.filter(r => r.status === 'inscrito' || r.status === 'matriculado').length;
      const enrolled = data.filter(r => r.status === 'matriculado').length;
      const points = data.reduce((acc, r) => {
        if (r.status === 'matriculado') return acc + POINTS_CONFIG.indicado + POINTS_CONFIG.inscrito + POINTS_CONFIG.matriculado;
        if (r.status === 'inscrito') return acc + POINTS_CONFIG.indicado + POINTS_CONFIG.inscrito;
        return acc + POINTS_CONFIG.indicado;
      }, 0);
      return {
        total_referrals: total,
        total_inscribed: inscribed,
        total_enrolled: enrolled,
        conversion_rate: total > 0 ? Math.round((enrolled / total) * 100) : 0,
        points,
      };
    },
  });
}

export function useRanking() {
  return useQuery({
    queryKey: ['ranking'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('referrals')
        .select('headhunter_id, status, profiles!referrals_headhunter_id_fkey(full_name)');
      if (error) throw error;

      const map: Record<string, { name: string; referrals: number; enrolled: number; points: number }> = {};
      data?.forEach(r => {
        const hid = r.headhunter_id;
        if (!map[hid]) {
          map[hid] = { name: (r.profiles as any)?.full_name ?? '', referrals: 0, enrolled: 0, points: 0 };
        }
        map[hid].referrals++;
        if (r.status === 'matriculado') {
          map[hid].enrolled++;
          map[hid].points += POINTS_CONFIG.indicado + POINTS_CONFIG.inscrito + POINTS_CONFIG.matriculado;
        } else if (r.status === 'inscrito') {
          map[hid].points += POINTS_CONFIG.indicado + POINTS_CONFIG.inscrito;
        } else {
          map[hid].points += POINTS_CONFIG.indicado;
        }
      });

      return Object.values(map)
        .sort((a, b) => b.points - a.points)
        .map((u, i) => ({ ...u, rank: i + 1 }));
    },
  });
}
