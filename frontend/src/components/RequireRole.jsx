import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Usage: <Route element={<RequireRole roles={['admin', 'hr']} />}> ... </Route>
// Admin and HR are treated as equivalent permissions everywhere per the API contract.
export function RequireRole({ roles }) {
  const { user } = useAuth();

  if (!roles.includes(user?.role)) {
    return <Navigate to="/not-found" replace />;
  }

  return <Outlet />;
}
