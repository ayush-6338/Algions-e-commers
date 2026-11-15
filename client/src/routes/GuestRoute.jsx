import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function GuestRoute() {
  const { user, loading } = useAuth();
  if (loading) return <p role="status" className="py-12 text-center">Loading your account…</p>;
  return user ? <Navigate to="/" replace /> : <Outlet />;
}
