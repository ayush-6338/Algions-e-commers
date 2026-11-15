import { Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function AdminRoute() {
  const { user } = useAuth();
  if (user?.role !== 'admin') return <section role="alert" className="mx-auto max-w-2xl rounded-2xl bg-white p-8 text-center shadow-sm"><h1 className="text-2xl font-medium">403 · Access denied</h1><p className="mt-2 text-stone-600">You do not have permission to view the admin dashboard.</p></section>;
  return <Outlet />;
}
