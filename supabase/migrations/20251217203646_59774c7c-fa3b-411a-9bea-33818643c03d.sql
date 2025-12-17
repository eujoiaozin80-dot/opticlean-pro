-- Remove the insecure public SELECT policy
DROP POLICY IF EXISTS "Anyone can check unused activation codes" ON public.activation_codes;

-- Create a secure RPC function to validate activation codes without exposing them
CREATE OR REPLACE FUNCTION public.validate_activation_code(code_to_check text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  code_record RECORD;
  result json;
BEGIN
  -- Normalize the code
  code_to_check := UPPER(TRIM(code_to_check));
  
  -- Check if code exists and is valid
  SELECT id, code, validity_days, expires_at, is_used
  INTO code_record
  FROM public.activation_codes
  WHERE code = code_to_check;
  
  -- Code not found
  IF code_record IS NULL THEN
    RETURN json_build_object('valid', false, 'error', 'Código de ativação inválido');
  END IF;
  
  -- Code already used
  IF code_record.is_used THEN
    RETURN json_build_object('valid', false, 'error', 'Código de ativação já foi utilizado');
  END IF;
  
  -- Code expired (if expiration date is set)
  IF code_record.expires_at IS NOT NULL AND code_record.expires_at < NOW() THEN
    RETURN json_build_object('valid', false, 'error', 'Código de ativação expirado');
  END IF;
  
  -- Code is valid - return necessary info for registration
  RETURN json_build_object(
    'valid', true,
    'code_id', code_record.id,
    'validity_days', code_record.validity_days
  );
END;
$$;

-- Grant execute permission to anonymous users (needed for registration)
GRANT EXECUTE ON FUNCTION public.validate_activation_code(text) TO anon;
GRANT EXECUTE ON FUNCTION public.validate_activation_code(text) TO authenticated;