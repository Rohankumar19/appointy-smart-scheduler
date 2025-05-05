
import { ReactNode } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
}

// Modified to bypass authentication checks
const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  // Simply render the children without any authentication checks
  return <>{children}</>;
};

export default ProtectedRoute;
