import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface CampaignRankingEntry {
  headhunter_id: string;
  headhunter_name: string;
  avatar_url: string | null;
  productivity_points: number;
  revenue_points: number;
  deadline_points: number;
  cancellation_points: number;
  referral_points: number;
  total_points: number;
}

export function useCampaignRanking(month: number, year: number) {
  return useQuery({
    queryKey: ['campaign-ranking', month, year],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_campaign_ranking', {
        p_month: month,
        p_year: year,
      });
      if (error) throw error;
      return (data ?? []) as CampaignRankingEntry[];
    },
  });
}

export interface CampaignMyData {
  productivity: { meta_percentage: number; points: number } | null;
  revenue: { revenue_audens: number; revenue_one_outsourcing: number; points: number } | null;
  deadline: { vacancies_on_time: number; points: number } | null;
  cancellations: { cancellations_as_responsible: number; cancellations_as_finder: number; points: number } | null;
  referral_points: number;
  rank: number;
  total_points: number;
}

export function useMyCampaign(month: number, year: number) {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ['my-campaign', profile?.id, month, year],
    enabled: !!profile,
    queryFn: async () => {
      const pid = profile!.id;

      const [prodRes, revRes, dlRes, cancRes, rankRes] = await Promise.all([
        supabase.from('campaign_productivity').select('*').eq('headhunter_id', pid).eq('month', month).eq('year', year).maybeSingle(),
        supabase.from('campaign_revenue').select('*').eq('headhunter_id', pid).eq('month', month).eq('year', year).maybeSingle(),
        supabase.from('campaign_deadline_bonus').select('*').eq('headhunter_id', pid).eq('month', month).eq('year', year).maybeSingle(),
        supabase.from('campaign_cancellations').select('*').eq('headhunter_id', pid).eq('month', month).eq('year', year).maybeSingle(),
        supabase.rpc('get_campaign_ranking', { p_month: month, p_year: year }),
      ]);

      const ranking = (rankRes.data ?? []) as CampaignRankingEntry[];
      const myRank = ranking.findIndex(r => r.headhunter_id === pid);
      const myEntry = myRank >= 0 ? ranking[myRank] : null;

      return {
        productivity: prodRes.data ? { meta_percentage: Number(prodRes.data.meta_percentage), points: prodRes.data.points } : null,
        revenue: revRes.data ? { revenue_audens: Number(revRes.data.revenue_audens), revenue_one_outsourcing: Number(revRes.data.revenue_one_outsourcing), points: revRes.data.points } : null,
        deadline: dlRes.data ? { vacancies_on_time: dlRes.data.vacancies_on_time, points: dlRes.data.points } : null,
        cancellations: cancRes.data ? { cancellations_as_responsible: cancRes.data.cancellations_as_responsible, cancellations_as_finder: cancRes.data.cancellations_as_finder, points: cancRes.data.points } : null,
        referral_points: myEntry?.referral_points ?? 0,
        rank: myRank >= 0 ? myRank + 1 : 0,
        total_points: myEntry?.total_points ?? 0,
      } as CampaignMyData;
    },
  });
}
