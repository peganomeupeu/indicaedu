import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type SyncType = "productivity" | "revenue" | "deadline" | "cancellations" | "all" | "test";

export interface SyncLogEntry {
  id: string;
  sync_type: string;
  status: string;
  records_synced: number;
  error_message: string | null;
  started_at: string;
  finished_at: string | null;
}

export interface SyncResponse {
  ok: boolean;
  error?: string;
  results?: Array<{
    sync_type: string;
    status: "success" | "error";
    records_synced: number;
    error_message?: string;
  }>;
}

export function useSyncLog() {
  return useQuery({
    queryKey: ["salesforce-sync-log"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("salesforce_sync_log")
        .select("*")
        .order("started_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as SyncLogEntry[];
    },
  });
}

export function useTriggerSync() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (syncType: SyncType): Promise<SyncResponse> => {
      const { data, error } = await supabase.functions.invoke("salesforce-sync", {
        body: { sync_type: syncType },
      });
      if (error) throw error;
      return data as SyncResponse;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["salesforce-sync-log"] });
    },
  });
}
