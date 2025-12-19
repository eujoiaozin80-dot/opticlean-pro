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
 * Usa RPC com security definer para bypass de RLS
 */
export async function markActivationCodeAsUsed(
  codeId: string,
  usedById: string
): Promise<{ success: boolean; error?: string; expiresAt?: string }> {
  try {
    const { data, error } = await supabase.rpc('use_activation_code', {
      p_code_id: codeId,
      p_user_id: usedById,
    });

    if (error) {
      console.error('Erro ao marcar código como usado:', error);
      return { success: false, error: error.message };
    }

    const result = data as { success: boolean; error?: string; expires_at?: string };

    if (!result.success) {
      return { success: false, error: result.error };
    }

    return { 
      success: true,
      expiresAt: result.expires_at 
    };
  } catch (error) {
    console.error('Erro ao marcar código como usado:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}

