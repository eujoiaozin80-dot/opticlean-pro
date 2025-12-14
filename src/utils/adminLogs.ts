import { supabase } from '@/integrations/supabase/client';

export type AdminAction =
  | 'create_code'
  | 'delete_code'
  | 'revoke_code'
  | 'modify_user'
  | 'change_user_role'
  | 'toggle_user_status'
  | 'export_codes'
  | 'bulk_delete_codes';

export type TargetType = 'code' | 'user' | 'codes';

export interface AdminLog {
  id: string;
  admin_id: string;
  action: AdminAction;
  target_type: TargetType;
  target_id: string;
  details: Record<string, unknown>;
  created_at: string;
}

/**
 * Registra ação administrativa
 */
export async function logAdminAction(
  adminId: string,
  action: AdminAction,
  targetType: TargetType,
  targetId: string,
  details: Record<string, unknown> = {}
): Promise<void> {
  try {
    // Usar type assertion para contornar tipos do Supabase que ainda não incluem admin_logs
    const { error } = await (supabase as any).from('admin_logs').insert({
      admin_id: adminId,
      action,
      target_type: targetType,
      target_id: targetId,
      details: details as any,
    });

    if (error) {
      // Se tabela não existe, apenas logar no console
      console.warn('Erro ao registrar log administrativo:', error);
      console.log('Admin Action:', {
        adminId,
        action,
        targetType,
        targetId,
        details,
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error('Erro ao registrar log administrativo:', error);
  }
}

/**
 * Busca logs administrativos
 */
export async function getAdminLogs(
  limit = 100,
  offset = 0
): Promise<{ logs: AdminLog[]; total: number }> {
  try {
    // Usar type assertion para contornar tipos do Supabase que ainda não incluem admin_logs
    const { data, error, count } = await (supabase as any)
      .from('admin_logs')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    // Validar e mapear os dados para o tipo AdminLog
    const logs: AdminLog[] = (data || []).map((log: any) => ({
      id: log.id,
      admin_id: log.admin_id,
      action: log.action as AdminAction,
      target_type: log.target_type as TargetType,
      target_id: log.target_id,
      details: typeof log.details === 'object' ? log.details : {},
      created_at: log.created_at,
    }));

    return {
      logs,
      total: count || 0,
    };
  } catch (error) {
    console.error('Erro ao buscar logs:', error);
    return { logs: [], total: 0 };
  }
}

