import { supabase } from '@/integrations/supabase/client';

export interface ActivationCodeValidation {
  valid: boolean;
  error?: string;
  code?: {
    id: string;
    validity_days: number | null;
  };
}

/**
 * Valida código de ativação usando RPC seguro (não expõe códigos)
 */
export async function validateActivationCode(code: string): Promise<ActivationCodeValidation> {
  try {
    const normalizedCode = code.toUpperCase().trim();

    if (!normalizedCode) {
      return { valid: false, error: 'Código de ativação é obrigatório' };
    }

    // Usar RPC seguro para validar código sem expor dados
    const { data, error } = await supabase.rpc('validate_activation_code', {
      code_to_check: normalizedCode
    });

    if (error) {
      console.error('Erro ao validar código:', error);
      return { valid: false, error: 'Erro ao validar código de ativação' };
    }

    const result = data as { valid: boolean; error?: string; code_id?: string; validity_days?: number };

    if (!result.valid) {
      return { valid: false, error: result.error || 'Código de ativação inválido' };
    }

    return {
      valid: true,
      code: {
        id: result.code_id!,
        validity_days: result.validity_days ?? null,
      },
    };
  } catch (error) {
    console.error('Erro ao validar código:', error);
    return { valid: false, error: 'Erro ao validar código de ativação' };
  }
}

/**
 * Marca código como usado após registro bem-sucedido
 */
export async function markActivationCodeAsUsed(
  codeId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const expiresAt = new Date();
    // Buscar validade do código
    const { data: codeData } = await supabase
      .from('activation_codes')
      .select('validity_days')
      .eq('id', codeId)
      .single();

    if (codeData?.validity_days) {
      expiresAt.setDate(expiresAt.getDate() + codeData.validity_days);
    }

    const { error } = await supabase
      .from('activation_codes')
      .update({
        is_used: true,
        used_by: userId,
        used_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
      })
      .eq('id', codeId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Erro ao marcar código como usado:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}

