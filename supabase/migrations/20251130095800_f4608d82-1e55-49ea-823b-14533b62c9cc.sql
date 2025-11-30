-- Add platform fee configuration columns to referral_settings table
ALTER TABLE public.referral_settings
ADD COLUMN IF NOT EXISTS platform_service_fee NUMERIC NOT NULL DEFAULT 20.0,
ADD COLUMN IF NOT EXISTS platform_referral_commission_rate NUMERIC NOT NULL DEFAULT 5.0;

COMMENT ON COLUMN public.referral_settings.platform_service_fee IS 'Platform service fee percentage deducted from gross transaction amount';
COMMENT ON COLUMN public.referral_settings.platform_referral_commission_rate IS 'Referral commission rate percentage deducted from platform service fee';