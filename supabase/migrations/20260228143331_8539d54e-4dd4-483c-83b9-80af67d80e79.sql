
-- Add new enum values
ALTER TYPE public.referral_status ADD VALUE IF NOT EXISTS 'qualificado';
ALTER TYPE public.referral_status ADD VALUE IF NOT EXISTS 'nao_qualificado';
