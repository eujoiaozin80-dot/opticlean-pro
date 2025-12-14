/**
 * Tipos e constantes relacionados a roles e permissões
 */

export type UserRole = 'founder' | 'admin' | 'moderator' | 'user';

export interface Permission {
  name: string;
  description: string;
}

export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  founder: ['*'], // Todas as permissões
  admin: [
    'manage_users',
    'manage_codes',
    'view_logs',
    'edit_user_profile',
    'change_user_role',
    'toggle_user_status',
  ],
  moderator: [
    'view_users',
    'view_codes',
    'view_logs',
  ],
  user: [], // Sem permissões administrativas
};

/**
 * Verifica se um role tem uma permissão específica
 */
export function hasPermission(userRole: UserRole, permission: string): boolean {
  const userPerms = ROLE_PERMISSIONS[userRole];
  return userPerms.includes('*') || userPerms.includes(permission);
}

/**
 * Verifica se um role pode executar uma ação
 */
export function canPerformAction(userRole: UserRole, action: string): boolean {
  return hasPermission(userRole, action);
}

