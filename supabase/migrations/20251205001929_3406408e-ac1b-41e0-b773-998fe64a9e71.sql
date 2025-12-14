-- Permitir que qualquer pessoa possa verificar códigos de ativação durante signup
CREATE POLICY "Anyone can check unused activation codes"
ON public.activation_codes
FOR SELECT
USING (is_used = false);

-- Também precisamos permitir que founders deletem códigos
CREATE POLICY "Founders can delete activation codes"
ON public.activation_codes
FOR DELETE
USING (has_role(auth.uid(), 'founder'::app_role));