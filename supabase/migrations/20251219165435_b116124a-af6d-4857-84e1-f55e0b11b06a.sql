-- Create a secure function to mark activation code as used
-- This runs with security definer so it bypasses RLS
CREATE OR REPLACE FUNCTION public.use_activation_code(
  p_code_id UUID,
  p_user_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code RECORD;
  v_expires_at TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Get the code
  SELECT id, is_used, validity_days
  INTO v_code
  FROM public.activation_codes
  WHERE id = p_code_id;
  
  -- Code not found
  IF v_code IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Código não encontrado');
  END IF;
  
  -- Code already used
  IF v_code.is_used THEN
    RETURN json_build_object('success', false, 'error', 'Código já foi utilizado');
  END IF;
  
  -- Calculate expiration date
  v_expires_at := NOW() + (COALESCE(v_code.validity_days, 30) || ' days')::INTERVAL;
  
  -- Mark code as used
  UPDATE public.activation_codes
  SET 
    is_used = true,
    used_by = p_user_id,
    used_at = NOW(),
    expires_at = v_expires_at
  WHERE id = p_code_id;
  
  RETURN json_build_object(
    'success', true, 
    'expires_at', v_expires_at,
    'validity_days', v_code.validity_days
  );
END;
$$;