import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PlatformUser {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  created_at: string;
  role: string;
}

export function useAllUsers() {
  return useQuery({
    queryKey: ['all-users'],
    queryFn: async () => {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .order('full_name');
      if (error) throw error;

      const { data: roles } = await supabase
        .from('user_roles')
        .select('user_id, role');

      return (profiles ?? []).map(p => ({
        ...p,
        role: roles?.find(r => r.user_id === p.user_id)?.role ?? 'headhunter',
      })) as PlatformUser[];
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) => {
      const { data, error } = await supabase.functions.invoke('admin-delete-user', {
        body: { user_id: userId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-users'] });
      queryClient.invalidateQueries({ queryKey: ['all-referrals'] });
      queryClient.invalidateQueries({ queryKey: ['ranking'] });
    },
  });
}

export function useDeleteReferralsByDateRange() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ startDate, endDate }: { startDate: string; endDate: string }) => {
      const { error } = await supabase
        .from('referrals')
        .delete()
        .gte('created_at', startDate)
        .lte('created_at', endDate + 'T23:59:59.999Z');
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
