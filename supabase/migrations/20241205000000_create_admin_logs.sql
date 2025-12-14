-- Create admin_logs table for auditing administrative actions
CREATE TABLE IF NOT EXISTS public.admin_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;

-- Founders can view all logs
CREATE POLICY "Founders can view all admin logs"
ON public.admin_logs
FOR SELECT
USING (has_role(auth.uid(), 'founder'::app_role));

-- Founders can insert logs
CREATE POLICY "Founders can insert admin logs"
ON public.admin_logs
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'founder'::app_role));

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_admin_logs_admin_id ON public.admin_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_created_at ON public.admin_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_logs_action ON public.admin_logs(action);

