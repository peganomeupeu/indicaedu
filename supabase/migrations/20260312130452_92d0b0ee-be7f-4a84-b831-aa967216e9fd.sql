
-- Add attended_by (references profiles, only admins) and rd_station_sent to referrals
ALTER TABLE public.referrals 
  ADD COLUMN IF NOT EXISTS attended_by uuid REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS rd_station_sent boolean NOT NULL DEFAULT false;
