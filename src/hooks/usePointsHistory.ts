import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface PointsEvent {
  id: string;
  referral_id: string;
  referred_name: string;
  old_status: string | null;
  new_status: string;
  changed_at: string;
  pontos_gerados: number;
  headhunter_id: string;
}

export interface PointsBreakdown {
  indicado: { count: number; points: number };
  qualificado: { count: number; points: number };
  inscrito: { count: number; points: number };
  total: number;
}

function buildDateRange(month?: number, year?: number) {
  if (!month || !year) return null;
  const start = new Date(year, month - 1, 1).toISOString();
  const end = new Date(year, month, 0, 23, 59, 59, 999).toISOString();
  return { start, end };
}

function computeBreakdown(events: PointsEvent[]): PointsBreakdown {
  const bd: PointsBreakdown = {
    indicado: { count: 0, points: 0 },
    qualificado: { count: 0, points: 0 },
    inscrito: { count: 0, points: 0 },
    total: 0,
  };
  for (const e of events) {
    if (e.new_status === 'indicado' && !e.old_status) {
      bd.indicado.count++;
      bd.indicado.points += e.pontos_gerados;
    } else if (e.new_status === 'qualificado') {
      bd.qualificado.count++;
      bd.qualificado.points += e.pontos_gerados;
    } else if (e.new_status === 'inscrito') {
      bd.inscrito.count++;
      bd.inscrito.points += e.pontos_gerados;
    }
    bd.total += e.pontos_gerados;
  }
  return bd;
}

async function fetchEvents(month?: number, year?: number, headhunterId?: string): Promise<PointsEvent[]> {
  let query = supabase
    .from('referral_status_history')
    .select('id, referral_id, old_status, new_status, changed_at, pontos_gerados, referrals!referral_status_history_referral_id_fkey(referred_name, headhunter_id)')
    .order('changed_at', { ascending: false });

  const range = buildDateRange(month, year);
  if (range) {
    query = query.gte('changed_at', range.start).lte('changed_at', range.end);
  }

  const { data, error } = await query;
  if (error) throw error;

  return (data ?? [])
    .map((h: any) => ({
      id: h.id,
      referral_id: h.referral_id,
      referred_name: h.referrals?.referred_name ?? '',
      old_status: h.old_status,
      new_status: h.new_status,
      changed_at: h.changed_at,
      pontos_gerados: h.pontos_gerados ?? 0,
      headhunter_id: h.referrals?.headhunter_id ?? '',
    }))
    .filter((e: PointsEvent) => !headhunterId || e.headhunter_id === headhunterId);
}

/** User's points events for a given month */
export function useMyPointsHistory(month?: number, year?: number) {
  const { profile } = useAuth();
  return useQuery({
    queryKey: ['my-points-history', profile?.id, month, year],
    enabled: !!profile,
    queryFn: () => fetchEvents(month, year, profile!.id),
  });
}

/** User's points breakdown for a given month */
export function useMyPointsBreakdown(month?: number, year?: number) {
  const { data: events = [], ...rest } = useMyPointsHistory(month, year);
  return { data: computeBreakdown(events), events, ...rest };
}

/** Pending referrals from previous months that can still generate points */
export function usePendingReferrals() {
  const { profile } = useAuth();
  return useQuery({
    queryKey: ['pending-referrals', profile?.id],
    enabled: !!profile,
    queryFn: async () => {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const { data, error } = await supabase
        .from('referrals')
        .select('id, referred_name, status, created_at, course')
        .eq('headhunter_id', profile!.id)
        .lt('created_at', startOfMonth)
        .in('status', ['indicado', 'qualificado'] as any);
      if (error) throw error;
      return data ?? [];
    },
  });
}

/** Admin: all points events for a given month (all users) */
export function useAllPointsHistory(month?: number, year?: number) {
  return useQuery({
    queryKey: ['all-points-history', month, year],
    queryFn: () => fetchEvents(month, year),
  });
}

/** Admin: breakdown per headhunter for a given month */
export function useAdminPointsBreakdown(month?: number, year?: number) {
  const { data: events = [], ...rest } = useAllPointsHistory(month, year);

  const globalBreakdown = computeBreakdown(events);

  const byUser = new Map<string, { name: string; events: PointsEvent[] }>();
  for (const e of events) {
    if (!byUser.has(e.headhunter_id)) {
      byUser.set(e.headhunter_id, { name: '', events: [] });
    }
    byUser.get(e.headhunter_id)!.events.push(e);
  }

  const perUser = Array.from(byUser.entries()).map(([id, { events: userEvents }]) => ({
    headhunter_id: id,
    breakdown: computeBreakdown(userEvents),
  }));

  return { globalBreakdown, perUser, events, ...rest };
}

/** Points events for a specific headhunter (by profile id) for a given month */
export function useHeadhunterPointsHistory(headhunterId: string | null, month?: number, year?: number) {
  return useQuery({
    queryKey: ['headhunter-points-history', headhunterId, month, year],
    enabled: !!headhunterId,
    queryFn: () => fetchEvents(month, year, headhunterId!),
  });
}

export { computeBreakdown };
