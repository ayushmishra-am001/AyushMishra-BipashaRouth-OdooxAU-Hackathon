import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Wraps /sign-in and /sign-up so someone already signed in doesn't land back
// on a login form.
export function RedirectIfAuthenticated() {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/employees" replace />;
  }

  return <Outlet />;
}
