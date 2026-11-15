import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function ProtectedRoute({ admin = false }) {
  const { user, ready } = useAuth(); const location = useLocation();
  if (!ready) return <p role="status" className="py-12 text-center">Loading your account…</p>;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (admin && user.role !== 'admin') return <Navigate to="/" replace />;
  return <Outlet />;
}
