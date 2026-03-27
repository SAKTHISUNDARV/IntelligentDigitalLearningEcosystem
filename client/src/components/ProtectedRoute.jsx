import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * roles: optional array of allowed roles e.g. ['admin'] or ['instructor','admin']
 * If roles is empty/undefined, any authenticated user can access.
 */
export default function ProtectedRoute({ children, roles }) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (roles && roles.length > 0 && !roles.includes(user.role)) {
    // Redirect to home (dashboard will show their own role view)
    return <Navigate to="/" replace />;
  }

  return children ?? <Outlet />;
}
