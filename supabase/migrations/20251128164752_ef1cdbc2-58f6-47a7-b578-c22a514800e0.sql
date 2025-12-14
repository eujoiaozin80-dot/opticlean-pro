-- Add new fields to profiles table
ALTER TABLE public.profiles
ADD COLUMN full_name TEXT,
ADD COLUMN avatar_url TEXT,
ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN last_login TIMESTAMP WITH TIME ZONE;

-- Add RLS policies for users to update their own profiles
CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Add RLS policy for founders to update any profile
CREATE POLICY "Founders can update any profile"
ON public.profiles
FOR UPDATE
USING (has_role(auth.uid(), 'founder'::app_role))
WITH CHECK (has_role(auth.uid(), 'founder'::app_role));