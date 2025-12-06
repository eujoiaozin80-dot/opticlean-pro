import { useOutletContext, Navigate } from 'react-router-dom';
import { OutletContext } from '@/types/outlet-context';

interface ProtectedRouteProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  requireFounder?: boolean;
  className?: string;
}

const ProtectedRoute = ({ children, requireFounder = false, className, ...props }: ProtectedRouteProps) => {
  const { isFounder } = useOutletContext<OutletContext>();

  if (requireFounder && !isFounder) {
    return <Navigate to="/dashboard" replace />;
  }

  return <div className={className} {...props}>{children}</div>;
};

export default ProtectedRoute;
