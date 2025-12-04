import { useOutletContext, Navigate } from 'react-router-dom';
import { OutletContext } from '@/types/outlet-context';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireFounder?: boolean;
}

const ProtectedRoute = ({ children, requireFounder = false }: ProtectedRouteProps) => {
  const { isFounder } = useOutletContext<OutletContext>();

  if (requireFounder && !isFounder) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
