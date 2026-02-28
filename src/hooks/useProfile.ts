import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useUpdateProfileName() {
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (fullName: string) => {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: fullName })
        .eq('user_id', user!.id);
      if (error) throw error;
    },
  });
}

export function useUploadAvatar() {
  return useMutation({
    mutationFn: async ({ userId, file }: { userId: string; file: File }) => {
      const ext = file.name.split('.').pop();
      const path = `${userId}/avatar.${ext}`;

      // Remove old avatar files
      const { data: existing } = await supabase.storage.from('avatars').list(userId);
      if (existing && existing.length > 0) {
        await supabase.storage.from('avatars').remove(existing.map(f => `${userId}/${f.name}`));
      }

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
      const avatarUrl = urlData.publicUrl + '?t=' + Date.now();

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: avatarUrl })
        .eq('user_id', userId);
      if (updateError) throw updateError;

      return avatarUrl;
    },
  });
}

// Admin: upload avatar for any user
export function useAdminUploadAvatar() {
  return useMutation({
    mutationFn: async ({ targetUserId, file }: { targetUserId: string; file: File }) => {
      const ext = file.name.split('.').pop();
      const path = `${targetUserId}/avatar.${ext}`;

      const { data: existing } = await supabase.storage.from('avatars').list(targetUserId);
      if (existing && existing.length > 0) {
        await supabase.storage.from('avatars').remove(existing.map(f => `${targetUserId}/${f.name}`));
      }

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
      const avatarUrl = urlData.publicUrl + '?t=' + Date.now();

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: avatarUrl })
        .eq('user_id', targetUserId);
      if (updateError) throw updateError;

      return avatarUrl;
    },
  });
}
