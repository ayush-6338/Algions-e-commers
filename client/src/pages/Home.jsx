import { useAuth } from '../context/AuthContext.jsx';
import LandingHome from './home/LandingHome.jsx';
import MemberHome from './home/MemberHome.jsx';
import { Skeleton } from '../components/catalogue/CatalogueComponents.jsx';

function HomeSkeleton() {
  return <div aria-label="Loading your home page" className="space-y-6"><div className="grid gap-6 rounded-3xl border border-stone-200 bg-white p-6 lg:grid-cols-2"><div className="space-y-4 py-6"><div className="h-3 w-32 animate-pulse rounded bg-stone-200" /><div className="h-12 w-4/5 animate-pulse rounded bg-stone-200" /><div className="h-4 w-full animate-pulse rounded bg-stone-100" /><div className="h-4 w-2/3 animate-pulse rounded bg-stone-100" /></div><div className="grid grid-cols-2 gap-3">{[0, 1, 2, 3].map((item) => <div key={item} className="aspect-square animate-pulse rounded-2xl bg-stone-100" />)}</div></div><Skeleton count={4} /></div>;
}

export default function Home() {
  const { user, loading } = useAuth();
  if (loading) return <HomeSkeleton />;
  return user ? <MemberHome key={user.id} user={user} /> : <LandingHome />;
}
