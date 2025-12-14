import { supabase } from '@/integrations/supabase/client';

export interface ActivationCodeValidation {
  valid: boolean;
  error?: string;
  code?: {
    id: string;
    code: string;
    validity_days: number | null;
    expires_at: string | null;
  };
}

/**
 * Valida código de ativação antes de usar
 */
export async function validateActivationCode(code: string): Promise<ActivationCodeValidation> {
  try {
    const normalizedCode = code.toUpperCase().trim();

    if (!normalizedCode) {
      return { valid: false, error: 'Código de ativação é obrigatório' };
    }

    // Buscar código
    const { data, error } = await supabase
      .from('activation_codes')
      .select('*')
      .eq('code', normalizedCode)
      .single();

    if (error || !data) {
      return { valid: false, error: 'Código de ativação inválido' };
    }

    // Verificar se já foi usado
    if (data.is_used) {
      return { valid: false, error: 'Código de ativação já foi utilizado' };
    }

    // Verificar expiração (se houver data de expiração definida)
    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      return { valid: false, error: 'Código de ativação expirado' };
    }

    return {
      valid: true,
      code: {
        id: data.id,
        code: data.code,
        validity_days: data.validity_days,
        expires_at: data.expires_at,
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

