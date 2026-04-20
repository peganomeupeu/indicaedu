CREATE TABLE public.salesforce_sync_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sync_type TEXT NOT NULL,
  status TEXT NOT NULL,
  records_synced INTEGER NOT NULL DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ
);

CREATE INDEX idx_salesforce_sync_log_started_at ON public.salesforce_sync_log (started_at DESC);

ALTER TABLE public.salesforce_sync_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read sync log"
ON public.salesforce_sync_log
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert sync log"
ON public.salesforce_sync_log
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));