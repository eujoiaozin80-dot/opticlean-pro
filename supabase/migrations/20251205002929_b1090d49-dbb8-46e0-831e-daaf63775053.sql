-- Tabela de histórico de operações
CREATE TABLE public.operation_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  operation_type TEXT NOT NULL,
  operation_name TEXT NOT NULL,
  details TEXT,
  status TEXT DEFAULT 'completed',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.operation_history ENABLE ROW LEVEL SECURITY;

-- Users can view their own history
CREATE POLICY "Users can view their own operation history"
ON public.operation_history
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own history
CREATE POLICY "Users can insert their own operation history"
ON public.operation_history
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Founders can view all history
CREATE POLICY "Founders can view all operation history"
ON public.operation_history
FOR SELECT
USING (has_role(auth.uid(), 'founder'::app_role));

-- Create index for faster queries
CREATE INDEX idx_operation_history_user_id ON public.operation_history(user_id);
CREATE INDEX idx_operation_history_created_at ON public.operation_history(created_at DESC);