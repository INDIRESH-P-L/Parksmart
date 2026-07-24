// Role-aware route guard.
//  - unauthenticated → /login (remembering where they were headed)
//  - authenticated but wrong role → /dashboard
//  - while the stored token is being re-validated on boot, show a loader
//    instead of flashing the login page.
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import Loader from '../Loader/Loader.jsx';

export default function ProtectedRoute({ children, roles }) {
  const { user, booting, isAuthed } = useAuth();
  const location = useLocation();

  if (booting) return <Loader variant="page" label="Restoring your session…" />;

  if (!isAuthed) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
