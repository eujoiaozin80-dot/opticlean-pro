-- Delete all existing activation codes
DELETE FROM public.activation_codes;

-- Add validity_days column (nullable, stores number of days the code is valid after activation)
ALTER TABLE public.activation_codes 
ADD COLUMN validity_days integer DEFAULT 30;

-- Add expires_at column to track when license expires after use
ALTER TABLE public.activation_codes 
ADD COLUMN expires_at timestamp with time zone;