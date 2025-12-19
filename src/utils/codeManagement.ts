import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { sendCodeExpiringAlert } from '@/services/discordWebhook';

interface ExpiringCode {
  code: string;
  userEmail: string;
  daysRemaining: number;
  expiresAt: string;
}

// Hook para monitorar códigos prestes a expirar
export const useCodeExpirationAlerts = (userId: string | null) => {
  const checkExpiringCodes = useCallback(async () => {
    if (!userId) return;

    try {
      // Buscar códigos que expiram nos próximos 7 dias
      const now = new Date();
      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

      const { data: codes, error } = await supabase
        .from('activation_codes')
        .select('*')
        .eq('is_used', true)
        .not('expires_at', 'is', null)
        .gte('expires_at', now.toISOString())
        .lte('expires_at', sevenDaysFromNow.toISOString());

      if (error) throw error;

      const expiringCodes: ExpiringCode[] = [];

      for (const code of codes || []) {
        if (code.used_by && code.expires_at) {
          const expiresAt = new Date(code.expires_at);
          const daysRemaining = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

          // Buscar email do usuário
          const { data: profile } = await supabase
            .from('profiles')
            .select('email')
            .eq('id', code.used_by)
            .maybeSingle();

          if (profile?.email) {
            expiringCodes.push({
              code: code.code,
              userEmail: profile.email,
              daysRemaining,
              expiresAt: code.expires_at,
            });

            // Enviar alerta para Discord se estiver configurado
            // Apenas para códigos que expiram em 3 dias ou menos
            if (daysRemaining <= 3) {
              await sendCodeExpiringAlert(code.code, profile.email, daysRemaining);
            }
          }
        }
      }

      return expiringCodes;
    } catch (error) {
      console.error('Erro ao verificar códigos expirando:', error);
      return [];
    }
  }, [userId]);

  // Verificar a cada hora
  useEffect(() => {
    if (!userId) return;

    checkExpiringCodes();

    const interval = setInterval(checkExpiringCodes, 60 * 60 * 1000); // 1 hora

    return () => clearInterval(interval);
  }, [userId, checkExpiringCodes]);

  return { checkExpiringCodes };
};

// Função para renovar código (estender validade)
export const renewActivationCode = async (
  codeId: string,
  additionalDays: number,
  userId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    // Buscar código atual
    const { data: code, error: fetchError } = await supabase
      .from('activation_codes')
      .select('*')
      .eq('id', codeId)
      .single();

    if (fetchError || !code) {
      return { success: false, error: 'Código não encontrado' };
    }

    if (!code.is_used || !code.expires_at) {
      return { success: false, error: 'Código não está em uso ou não tem data de expiração' };
    }

    // Calcular nova data de expiração
    const currentExpiration = new Date(code.expires_at);
    const now = new Date();
    const baseDate = currentExpiration > now ? currentExpiration : now;
    const newExpiration = new Date(baseDate);
    newExpiration.setDate(newExpiration.getDate() + additionalDays);

    // Atualizar código
    const { error: updateError } = await supabase
      .from('activation_codes')
      .update({ expires_at: newExpiration.toISOString() })
      .eq('id', codeId);

    if (updateError) {
      return { success: false, error: 'Erro ao atualizar código' };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Erro desconhecido' };
  }
};

// Função para gerar múltiplos códigos de uma vez
export const generateBulkCodes = async (
  userId: string,
  quantity: number,
  validityDays: number
): Promise<{ success: boolean; codes?: string[]; error?: string }> => {
  try {
    const codes: string[] = [];
    const inserts = [];

    for (let i = 0; i < quantity; i++) {
      const randomPart = Array.from({ length: 2 }, () =>
        Math.random().toString(36).substring(2, 6).toUpperCase()
      ).join('-');
      const code = `OPT-${randomPart}`;
      codes.push(code);
      inserts.push({
        code,
        created_by: userId,
        validity_days: validityDays,
      });
    }

    const { error } = await supabase
      .from('activation_codes')
      .insert(inserts);

    if (error) {
      return { success: false, error: 'Erro ao gerar códigos' };
    }

    return { success: true, codes };
  } catch (error: any) {
    return { success: false, error: error.message || 'Erro desconhecido' };
  }
};

// Função para exportar códigos para PDF
export const exportCodesToPdf = async (codes: any[]): Promise<void> => {
  const { jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');

  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.text('Relatório de Códigos de Ativação', 14, 22);
  doc.setFontSize(10);
  doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, 30);

  const tableData = codes.map(code => [
    code.code,
    code.is_used ? 'Usado' : 'Disponível',
    new Date(code.created_at).toLocaleDateString('pt-BR'),
    code.validity_days ? `${code.validity_days} dias` : '-',
    code.user_email || '-',
    code.expires_at ? new Date(code.expires_at).toLocaleDateString('pt-BR') : '-',
  ]);

  autoTable(doc, {
    head: [['Código', 'Status', 'Criado em', 'Validade', 'Usuário', 'Expira em']],
    body: tableData,
    startY: 40,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [139, 92, 246] },
  });

  doc.save(`codigos-ativacao-${new Date().toISOString().split('T')[0]}.pdf`);
};

// Estatísticas avançadas de códigos
export interface CodeStats {
  total: number;
  available: number;
  used: number;
  expired: number;
  expiringIn7Days: number;
  expiringIn3Days: number;
  averageValidityDays: number;
  mostUsedValidityDays: number;
  usageRate: number;
}

export const calculateCodeStats = (codes: any[]): CodeStats => {
  const now = new Date();
  const sevenDaysFromNow = new Date();
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
  const threeDaysFromNow = new Date();
  threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

  let available = 0;
  let used = 0;
  let expired = 0;
  let expiringIn7Days = 0;
  let expiringIn3Days = 0;
  let totalValidity = 0;
  const validityCount: Record<number, number> = {};

  for (const code of codes) {
    const isExpired = code.is_used && code.expires_at && new Date(code.expires_at) < now;
    
    if (isExpired) {
      expired++;
    } else if (code.is_used) {
      used++;
      
      if (code.expires_at) {
        const expiresAt = new Date(code.expires_at);
        if (expiresAt <= sevenDaysFromNow) {
          expiringIn7Days++;
        }
        if (expiresAt <= threeDaysFromNow) {
          expiringIn3Days++;
        }
      }
    } else {
      available++;
    }

    if (code.validity_days) {
      totalValidity += code.validity_days;
      validityCount[code.validity_days] = (validityCount[code.validity_days] || 0) + 1;
    }
  }

  const averageValidityDays = codes.length > 0 ? Math.round(totalValidity / codes.length) : 30;
  const mostUsedValidityDays = Object.entries(validityCount).sort((a, b) => b[1] - a[1])[0]?.[0] || 30;
  const usageRate = codes.length > 0 ? Math.round(((used + expired) / codes.length) * 100) : 0;

  return {
    total: codes.length,
    available,
    used,
    expired,
    expiringIn7Days,
    expiringIn3Days,
    averageValidityDays,
    mostUsedValidityDays: Number(mostUsedValidityDays),
    usageRate,
  };
};
