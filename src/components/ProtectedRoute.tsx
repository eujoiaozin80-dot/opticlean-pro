import { useOutletContext, Navigate } from 'react-router-dom';
import { OutletContext } from '@/types/outlet-context';
import type { UserRole } from '@/types/roles';
import { hasPermission } from '@/types/roles';

interface ProtectedRouteProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  requireFounder?: boolean;
  requireRole?: UserRole[];
  requirePermission?: string;
  fallback?: React.ReactNode;
  className?: string;
}

const ProtectedRoute = ({ 
  children, 
  requireFounder = false,
  requireRole,
  requirePermission,
  fallback,
  className, 
  ...props 
}: ProtectedRouteProps) => {
  const { isFounder, userRole } = useOutletContext<OutletContext>();

  // Verificar founder
  if (requireFounder && !isFounder) {
    return fallback || <Navigate to="/dashboard" replace />;
  }

  // Verificar role específico
  if (requireRole && !requireRole.includes(userRole as UserRole)) {
    return fallback || <Navigate to="/dashboard" replace />;
  }

  // Verificar permissão específica
  if (requirePermission && !hasPermission(userRole as UserRole, requirePermission)) {
    return fallback || <Navigate to="/dashboard" replace />;
  }

  return <div className={className} {...props}>{children}</div>;
};

export default ProtectedRoute;
